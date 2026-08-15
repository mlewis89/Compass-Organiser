import { and, asc, count, desc, eq, inArray, isNull, ne, or, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { GraphQLError } from "graphql";
import { clerkClient } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { getAppUrl } from "@/lib/env";
import {
  AuthenticationError,
  GroupNotConfiguredError,
  requireUser,
  signToken,
} from "@/lib/auth/jwt";
import {
  findGroupById,
  findGroupBySlug,
  hasActiveMembership,
  listActiveGroups,
  listUserActiveGroups,
  requireMembership,
} from "@/lib/tenancy";
import {
  GROUP_ADMIN_ROLES,
  LEADER_ROLES,
  MODULE_SETTINGS_ROLES,
  canViewAllUnitBuckets,
  getGroupEnabledModules,
  getMemberRoles,
  hasAnyRole,
  isPlatformAdmin,
  requireModule,
  requireOwnerOrRole,
  requirePlatformAdmin,
  requireRole,
} from "@/lib/authz";
import {
  expandEnabledModules,
  isModuleEnabled,
  mergeModuleUpdates,
  type StoredEnabledModules,
} from "@/lib/groupModules";
import {
  TASK_STATUS,
  isTaskOpen,
  isWishlistStatus,
} from "@/lib/taskStatus";
import { pickSuggestedTasks } from "@/lib/suggestedTasks";
import {
  boardPosts,
  eventAttendees,
  events,
  families,
  familyMembers,
  groups,
  membershipRoles,
  memberships,
  roles,
  skills,
  taskResponsible,
  taskSkills,
  taskUnits,
  tasks,
  unitMembers,
  units,
  userGuardians,
  userSkills,
  userTasks,
  users,
} from "@/db/schema";
import { dateString, mapUser, toDate, type UserRow } from "@/lib/graphql/mappers";
import type { GraphQLContext } from "@/lib/graphql/context";

type SkillInput = { _id?: string; name?: string; parentId?: string };
type SkillCatalogInput = {
  name?: string;
  parentId?: string | null;
  status?: string;
};
type CreateSkillInput = {
  name: string;
  parentId?: string | null;
  groupId?: string | null;
};
type UserInput = {
  _id?: string;
  firstName?: string;
  lastName?: string;
  preferredName?: string;
  scoutName?: string;
  scoutRego?: string;
  status?: string;
  gender?: string;
  dob?: string;
  section?: string;
  email?: string;
  phone?: string;
  taskAvailabity?: number;
};
type TaskInput = {
  name?: string;
  description?: string;
  status?: string;
  dueDate?: string;
  duration?: number;
  priority?: number;
  requiredSkills?: SkillInput[];
  responsible?: UserInput[] | null;
  units?: { _id?: string }[] | null;
  parentTaskId?: string | null;
};
type OutlineTaskInput = {
  name: string;
  children?: OutlineTaskInput[] | null;
  responsible?: UserInput[] | null;
  units?: { _id?: string }[] | null;
  requiredSkills?: SkillInput[] | null;
  priority?: number | null;
  duration?: number | null;
};
type EventInput = {
  title?: string;
  startDate?: string;
  endDate?: string;
  isPublic?: boolean;
  description?: string;
  location?: string;
  plan?: string;
  riskManagement?: string;
  status?: string;
  cost?: number;
};
type PostInput = {
  title?: string;
  content?: string;
  image?: string;
  isPublic?: boolean;
  expiryDate?: string;
  Priority?: number;
  priority?: number;
};

function defaultDueDate() {
  const date = new Date();
  date.setDate(date.getDate() + 365);
  return date;
}

async function loadUserById(id: string | null | undefined) {
  if (!id) {
    return null;
  }
  const db = getDb();
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return row ? mapUser(row) : null;
}

async function loadUsersByIds(ids: string[]) {
  if (ids.length === 0) {
    return [];
  }
  const db = getDb();
  const rows = await db.select().from(users).where(inArray(users.id, ids));
  const byId = new Map(rows.map((row) => [row.id, mapUser(row)]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

async function loadSkillsForTask(taskId: string) {
  const db = getDb();
  const rows = await db
    .select({ skill: skills })
    .from(taskSkills)
    .innerJoin(skills, eq(taskSkills.skillId, skills.id))
    .where(eq(taskSkills.taskId, taskId));
  return rows.map(({ skill }) => mapSkillRow(skill));
}

async function loadResponsibleUserIds(taskId: string): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select({ userId: taskResponsible.userId })
    .from(taskResponsible)
    .where(eq(taskResponsible.taskId, taskId));
  return rows.map((row) => row.userId);
}

async function loadResponsibleForTask(taskId: string) {
  const db = getDb();
  const rows = await db
    .select({ user: users })
    .from(taskResponsible)
    .innerJoin(users, eq(taskResponsible.userId, users.id))
    .where(eq(taskResponsible.taskId, taskId));
  return rows.map(({ user }) => mapUser(user));
}

async function setTaskResponsible(taskId: string, people: UserInput[] | null | undefined) {
  if (people === undefined) {
    return;
  }
  const db = getDb();
  const userIds = [
    ...new Set(
      (people ?? [])
        .map((person) => person._id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  await db.delete(taskResponsible).where(eq(taskResponsible.taskId, taskId));
  if (userIds.length === 0) {
    return;
  }
  await db
    .insert(taskResponsible)
    .values(userIds.map((userId) => ({ taskId, userId })));
  for (const userId of userIds) {
    await ensureUserTaskAssignment(userId, taskId);
  }
}

async function loadMembersForUnit(unitId: string) {
  const db = getDb();
  const rows = await db
    .select({ user: users })
    .from(unitMembers)
    .innerJoin(users, eq(unitMembers.userId, users.id))
    .where(eq(unitMembers.unitId, unitId));
  return rows.map(({ user }) => mapUser(user));
}

async function mapUnit(unit: typeof units.$inferSelect) {
  return {
    ...unit,
    _id: unit.id,
    members: await loadMembersForUnit(unit.id),
  };
}

async function loadUnitsForTask(taskId: string) {
  const db = getDb();
  const rows = await db
    .select({ unit: units })
    .from(taskUnits)
    .innerJoin(units, eq(taskUnits.unitId, units.id))
    .where(eq(taskUnits.taskId, taskId));
  return Promise.all(rows.map(({ unit }) => mapUnit(unit)));
}

async function loadUnitMemberIdsForTask(taskId: string): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select({ userId: unitMembers.userId })
    .from(taskUnits)
    .innerJoin(unitMembers, eq(taskUnits.unitId, unitMembers.unitId))
    .where(eq(taskUnits.taskId, taskId));
  return [...new Set(rows.map((row) => row.userId))];
}

async function loadTaskOwnerIds(task: {
  id: string;
  createdByUserId: string | null;
}): Promise<Array<string | null | undefined>> {
  const [responsibleIds, unitMemberIds] = await Promise.all([
    loadResponsibleUserIds(task.id),
    loadUnitMemberIdsForTask(task.id),
  ]);
  return [task.createdByUserId, ...responsibleIds, ...unitMemberIds];
}

async function requireGroupUnit(
  groupId: string,
  unitId: string,
): Promise<typeof units.$inferSelect> {
  const db = getDb();
  const [unit] = await db
    .select()
    .from(units)
    .where(and(eq(units.id, unitId), eq(units.groupId, groupId)))
    .limit(1);
  if (!unit) {
    throw new GraphQLError("Unit not found");
  }
  return unit;
}

async function requireGroupUnitIds(groupId: string, unitIds: string[]) {
  if (unitIds.length === 0) {
    return;
  }
  const db = getDb();
  const rows = await db
    .select({ id: units.id })
    .from(units)
    .where(and(eq(units.groupId, groupId), inArray(units.id, unitIds)));
  if (rows.length !== unitIds.length) {
    throw new GraphQLError("One or more units do not belong to the active group");
  }
}

async function requireActiveGroupMemberIds(groupId: string, userIds: string[]) {
  if (userIds.length === 0) {
    return;
  }
  const db = getDb();
  const rows = await db
    .select({ userId: memberships.userId })
    .from(memberships)
    .where(
      and(
        eq(memberships.groupId, groupId),
        eq(memberships.status, "active"),
        inArray(memberships.userId, userIds),
      ),
    );
  if (rows.length !== userIds.length) {
    throw new GraphQLError("One or more members are not active in this group");
  }
}

async function setTaskUnits(
  taskId: string,
  groupId: string,
  unitInputs: { _id?: string }[] | null | undefined,
) {
  if (unitInputs === undefined) {
    return;
  }
  const db = getDb();
  const unitIds = [
    ...new Set(
      (unitInputs ?? [])
        .map((unit) => unit._id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  await requireGroupUnitIds(groupId, unitIds);
  await db.delete(taskUnits).where(eq(taskUnits.taskId, taskId));
  if (unitIds.length === 0) {
    return;
  }
  await db.insert(taskUnits).values(unitIds.map((unitId) => ({ taskId, unitId })));
}

function mapSkillRow(
  skill: typeof skills.$inferSelect,
  extras?: {
    isActiveForUser?: boolean;
    taskCount?: number;
    userCount?: number;
  },
) {
  return {
    ...skill,
    _id: skill.id,
    parentId: skill.parentId,
    groupId: skill.groupId,
    createdByUserId: skill.createdByUserId,
    isActiveForUser: extras?.isActiveForUser,
    taskCount: extras?.taskCount,
    userCount: extras?.userCount,
  };
}

async function findVisibleSkillByName(groupId: string, name: string) {
  const db = getDb();
  const trimmed = name.trim();
  const [groupMatch] = await db
    .select()
    .from(skills)
    .where(
      and(
        eq(skills.scope, "group"),
        eq(skills.groupId, groupId),
        eq(skills.name, trimmed),
        ne(skills.status, "archived"),
      ),
    )
    .limit(1);
  if (groupMatch) {
    return groupMatch;
  }
  const [platformMatch] = await db
    .select()
    .from(skills)
    .where(
      and(
        eq(skills.scope, "platform"),
        eq(skills.status, "approved"),
        eq(skills.name, trimmed),
      ),
    )
    .limit(1);
  return platformMatch ?? null;
}

async function resolveRequiredSkillIds(
  skillInputs: SkillInput[],
  groupId: string,
  userId: string,
): Promise<string[]> {
  const db = getDb();
  const ids: string[] = [];
  for (const input of skillInputs) {
    if (input._id) {
      ids.push(input._id);
      continue;
    }
    const name = input.name?.trim();
    if (!name) {
      continue;
    }
    const existing = await findVisibleSkillByName(groupId, name);
    if (existing) {
      ids.push(existing.id);
      continue;
    }
    const [created] = await db
      .insert(skills)
      .values({
        name,
        parentId: input.parentId || null,
        scope: "group",
        groupId,
        status: "approved",
        createdByUserId: userId,
      })
      .returning();
    if (created) {
      ids.push(created.id);
    }
  }
  return [...new Set(ids)];
}

async function loadSkillUsage(skillId: string) {
  const db = getDb();
  const [taskRow] = await db
    .select({ value: count() })
    .from(taskSkills)
    .where(eq(taskSkills.skillId, skillId));
  const [userRow] = await db
    .select({ value: count() })
    .from(userSkills)
    .where(eq(userSkills.skillId, skillId));
  return {
    taskCount: Number(taskRow?.value ?? 0),
    userCount: Number(userRow?.value ?? 0),
  };
}

async function getSkillOrThrow(skillId: string) {
  const db = getDb();
  const [skill] = await db.select().from(skills).where(eq(skills.id, skillId)).limit(1);
  if (!skill) {
    throw new GraphQLError("Skill not found");
  }
  return skill;
}

async function assertSkillAssignable(skillId: string, groupId: string) {
  const skill = await getSkillOrThrow(skillId);
  if (skill.status === "archived") {
    throw new GraphQLError("That skill is archived");
  }
  const inPlatformCatalog =
    skill.scope === "platform" && skill.status === "approved";
  const inGroupCatalog = skill.scope === "group" && skill.groupId === groupId;
  if (!inPlatformCatalog && !inGroupCatalog) {
    throw new GraphQLError("That skill is not available in this group");
  }
  return skill;
}

async function requireSkillCatalogAccess(
  user: NonNullable<GraphQLContext["user"]>,
  skill: typeof skills.$inferSelect,
  groupId: string | null,
) {
  if (skill.scope === "platform") {
    requirePlatformAdmin(user);
    return;
  }
  if (!skill.groupId || skill.groupId !== groupId) {
    throw new GraphQLError("Skill does not belong to the active group");
  }
  await requireModule(groupId, "skills");
  await requireRole(user, groupId, GROUP_ADMIN_ROLES);
}

type TaskRow = typeof tasks.$inferSelect;

type ParentSummary = { _id: string; name: string };

async function loadTasksByIds(ids: string[]): Promise<TaskRow[]> {
  if (ids.length === 0) {
    return [];
  }
  const db = getDb();
  return db.select().from(tasks).where(inArray(tasks.id, ids));
}

/** Ancestors and descendants of the seed rows, staying in the same groups. */
async function expandTaskForest(seed: TaskRow[]): Promise<TaskRow[]> {
  const byId = new Map(seed.map((task) => [task.id, task]));
  const db = getDb();

  let missingParentIds = [
    ...new Set(
      [...byId.values()]
        .map((task) => task.parentTaskId)
        .filter((id): id is string => id != null && !byId.has(id)),
    ),
  ];
  while (missingParentIds.length > 0) {
    const parents = await db
      .select()
      .from(tasks)
      .where(inArray(tasks.id, missingParentIds));
    const next: string[] = [];
    for (const parent of parents) {
      byId.set(parent.id, parent);
      if (parent.parentTaskId && !byId.has(parent.parentTaskId)) {
        next.push(parent.parentTaskId);
      }
    }
    missingParentIds = next;
  }

  let frontier = [...byId.keys()];
  while (frontier.length > 0) {
    const children = await db
      .select()
      .from(tasks)
      .where(inArray(tasks.parentTaskId, frontier));
    const next: string[] = [];
    for (const child of children) {
      if (!byId.has(child.id)) {
        byId.set(child.id, child);
        next.push(child.id);
      }
    }
    frontier = next;
  }

  return [...byId.values()];
}

async function loadDescendantCounts(
  taskIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map(taskIds.map((id) => [id, 0]));
  if (taskIds.length === 0) {
    return counts;
  }
  const belonging = new Map<string, Set<string>>();
  for (const id of taskIds) {
    belonging.set(id, new Set([id]));
  }
  const db = getDb();
  let frontier = [...taskIds];
  while (frontier.length > 0) {
    const children = await db
      .select({ id: tasks.id, parentTaskId: tasks.parentTaskId })
      .from(tasks)
      .where(inArray(tasks.parentTaskId, frontier));
    const next: string[] = [];
    for (const child of children) {
      const parentSeeds = belonging.get(child.parentTaskId ?? "") ?? new Set();
      const seeds = belonging.get(child.id) ?? new Set();
      for (const seed of parentSeeds) {
        if (seed !== child.id && !seeds.has(seed)) {
          seeds.add(seed);
          counts.set(seed, (counts.get(seed) ?? 0) + 1);
        }
      }
      belonging.set(child.id, seeds);
      next.push(child.id);
    }
    frontier = next;
  }
  return counts;
}

function includeAncestorStubs(
  visible: TaskRow[],
  forest: TaskRow[],
): { rows: TaskRow[]; stubIds: Set<string> } {
  const forestById = new Map(forest.map((task) => [task.id, task]));
  const included = new Map(visible.map((task) => [task.id, task]));
  const stubIds = new Set<string>();
  for (const task of visible) {
    let parentId = task.parentTaskId;
    while (parentId) {
      if (included.has(parentId)) {
        break;
      }
      const parent = forestById.get(parentId);
      if (!parent) {
        break;
      }
      included.set(parent.id, parent);
      stubIds.add(parent.id);
      parentId = parent.parentTaskId;
    }
  }
  return { rows: [...included.values()], stubIds };
}

async function visibleTaskForest(
  seed: TaskRow[],
  userId: string,
  groupId: string,
  viewAll: boolean,
): Promise<{ rows: TaskRow[]; stubIds: Set<string> }> {
  const forest = await expandTaskForest(seed);
  const visible = await filterVisibleTasks(forest, userId, groupId, viewAll);
  return includeAncestorStubs(visible, forest);
}

async function mapTasks(
  rows: TaskRow[],
  stubIds: Set<string> = new Set(),
) {
  if (rows.length === 0) {
    return [];
  }
  const parentIds = [
    ...new Set(
      rows
        .map((task) => task.parentTaskId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const knownIds = new Set(rows.map((task) => task.id));
  const missingParentIds = parentIds.filter((id) => !knownIds.has(id));
  const extraParents = await loadTasksByIds(missingParentIds);
  const parentById = new Map<string, ParentSummary>();
  for (const task of rows) {
    parentById.set(task.id, { _id: task.id, name: task.name });
  }
  for (const parent of extraParents) {
    parentById.set(parent.id, { _id: parent.id, name: parent.name });
  }
  const descendantCounts = await loadDescendantCounts(rows.map((task) => task.id));
  return Promise.all(
    rows.map(async (task) => ({
      ...task,
      _id: task.id,
      Name: task.name,
      Priority: task.priority,
      dueDate: dateString(task.dueDate),
      parentTaskId: task.parentTaskId,
      parent: task.parentTaskId
        ? (parentById.get(task.parentTaskId) ?? null)
        : null,
      descendantCount: descendantCounts.get(task.id) ?? 0,
      isStub: stubIds.has(task.id),
      requiredSkills: stubIds.has(task.id)
        ? []
        : await loadSkillsForTask(task.id),
      responsible: stubIds.has(task.id)
        ? []
        : await loadResponsibleForTask(task.id),
      units: stubIds.has(task.id) ? [] : await loadUnitsForTask(task.id),
      createdBy: stubIds.has(task.id)
        ? null
        : await loadUserById(task.createdByUserId),
    })),
  );
}

async function mapTask(
  task: TaskRow,
  stubIds: Set<string> = new Set(),
) {
  const [mapped] = await mapTasks([task], stubIds);
  return mapped;
}

async function resolveParentTaskId(
  groupId: string,
  parentTaskId: string | null | undefined,
  taskId?: string,
): Promise<string | null | undefined> {
  if (parentTaskId === undefined) {
    return undefined;
  }
  if (parentTaskId === null || parentTaskId === "") {
    return null;
  }
  if (taskId && parentTaskId === taskId) {
    throw new GraphQLError("A task cannot be its own parent");
  }
  const db = getDb();
  const [parent] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, parentTaskId), eq(tasks.groupId, groupId)))
    .limit(1);
  if (!parent) {
    throw new GraphQLError("Parent task not found");
  }
  if (taskId) {
    let cursor: string | null = parentTaskId;
    const seen = new Set<string>();
    while (cursor) {
      if (cursor === taskId) {
        throw new GraphQLError("A task cannot be nested under its own descendant");
      }
      if (seen.has(cursor)) {
        break;
      }
      seen.add(cursor);
      const [row] = await db
        .select({ parentTaskId: tasks.parentTaskId })
        .from(tasks)
        .where(eq(tasks.id, cursor))
        .limit(1);
      cursor = row?.parentTaskId ?? null;
    }
  }
  return parentTaskId;
}

/** Tasks claimed via user_tasks or personally responsible. */
async function loadTasksForUser(
  userId: string,
  groupId?: string | null,
): Promise<TaskRow[]> {
  const db = getDb();
  const claimedWhere = groupId
    ? and(eq(userTasks.userId, userId), eq(tasks.groupId, groupId))
    : eq(userTasks.userId, userId);
  const responsibleWhere = groupId
    ? and(eq(taskResponsible.userId, userId), eq(tasks.groupId, groupId))
    : eq(taskResponsible.userId, userId);

  const [claimed, responsible] = await Promise.all([
    db
      .select({ task: tasks })
      .from(userTasks)
      .innerJoin(tasks, eq(userTasks.taskId, tasks.id))
      .where(claimedWhere),
    db
      .select({ task: tasks })
      .from(taskResponsible)
      .innerJoin(tasks, eq(taskResponsible.taskId, tasks.id))
      .where(responsibleWhere),
  ]);

  const byId = new Map<string, TaskRow>();
  for (const { task } of claimed) {
    byId.set(task.id, task);
  }
  for (const { task } of responsible) {
    byId.set(task.id, task);
  }
  return [...byId.values()];
}

async function loadUserUnitIds(userId: string, groupId: string): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select({ unitId: unitMembers.unitId })
    .from(unitMembers)
    .innerJoin(units, eq(unitMembers.unitId, units.id))
    .where(and(eq(unitMembers.userId, userId), eq(units.groupId, groupId)));
  return rows.map((row) => row.unitId);
}

async function loadClaimedTaskIds(userId: string): Promise<Set<string>> {
  const db = getDb();
  const rows = await db
    .select({ taskId: userTasks.taskId })
    .from(userTasks)
    .where(eq(userTasks.userId, userId));
  return new Set(rows.map((row) => row.taskId));
}

async function loadTaskIdsWithResponsible(taskIds: string[]): Promise<Set<string>> {
  if (taskIds.length === 0) {
    return new Set();
  }
  const db = getDb();
  const rows = await db
    .select({ taskId: taskResponsible.taskId })
    .from(taskResponsible)
    .where(inArray(taskResponsible.taskId, taskIds));
  return new Set(rows.map((row) => row.taskId));
}

async function loadUnitIdsByTaskIds(
  taskIds: string[],
): Promise<Map<string, string[]>> {
  const byTask = new Map<string, string[]>();
  if (taskIds.length === 0) {
    return byTask;
  }
  const db = getDb();
  const rows = await db
    .select({ taskId: taskUnits.taskId, unitId: taskUnits.unitId })
    .from(taskUnits)
    .where(inArray(taskUnits.taskId, taskIds));
  for (const row of rows) {
    const current = byTask.get(row.taskId) ?? [];
    current.push(row.unitId);
    byTask.set(row.taskId, current);
  }
  return byTask;
}

async function canSeeUnitAssignedTask(
  task: TaskRow,
  userId: string,
  userUnitIds: Set<string>,
  claimedIds: Set<string>,
  taskUnitIds: string[],
): Promise<boolean> {
  if (taskUnitIds.length === 0) {
    return true;
  }
  if (task.createdByUserId === userId) {
    return true;
  }
  if (claimedIds.has(task.id)) {
    return true;
  }
  if (taskUnitIds.some((unitId) => userUnitIds.has(unitId))) {
    return true;
  }
  const responsibleIds = await loadResponsibleUserIds(task.id);
  return responsibleIds.includes(userId);
}

async function filterVisibleTasks(
  rows: TaskRow[],
  userId: string,
  groupId: string,
  viewAll: boolean,
): Promise<TaskRow[]> {
  if (viewAll) {
    return rows;
  }
  const [userUnitIds, claimedIds, unitIdsByTask] = await Promise.all([
    loadUserUnitIds(userId, groupId).then((ids) => new Set(ids)),
    loadClaimedTaskIds(userId),
    loadUnitIdsByTaskIds(rows.map((row) => row.id)),
  ]);
  const visible: TaskRow[] = [];
  for (const task of rows) {
    const allowed = await canSeeUnitAssignedTask(
      task,
      userId,
      userUnitIds,
      claimedIds,
      unitIdsByTask.get(task.id) ?? [],
    );
    if (allowed) {
      visible.push(task);
    }
  }
  return visible;
}

async function loadVisibleUnits(
  userId: string,
  groupId: string,
  viewAll: boolean,
): Promise<(typeof units.$inferSelect)[]> {
  const db = getDb();
  if (viewAll) {
    return db
      .select()
      .from(units)
      .where(eq(units.groupId, groupId))
      .orderBy(asc(units.name));
  }
  const rows = await db
    .select({ unit: units })
    .from(unitMembers)
    .innerJoin(units, eq(unitMembers.unitId, units.id))
    .where(and(eq(unitMembers.userId, userId), eq(units.groupId, groupId)))
    .orderBy(asc(units.name));
  return rows.map(({ unit }) => unit);
}

async function loadTasksForUnit(unitId: string, groupId: string): Promise<TaskRow[]> {
  const db = getDb();
  const rows = await db
    .select({ task: tasks })
    .from(taskUnits)
    .innerJoin(tasks, eq(taskUnits.taskId, tasks.id))
    .where(and(eq(taskUnits.unitId, unitId), eq(tasks.groupId, groupId)))
    .orderBy(desc(tasks.priority));
  return rows.map(({ task }) => task);
}

async function mapUnitBucket(
  unit: typeof units.$inferSelect,
  groupId: string,
  userId: string,
  viewAll: boolean,
) {
  const unitTasks = await loadTasksForUnit(unit.id, groupId);
  const openTasks = unitTasks.filter(isTaskOpen);
  const withResponsible = await loadTaskIdsWithResponsible(
    openTasks.map((task) => task.id),
  );
  const { rows, stubIds } = await visibleTaskForest(
    unitTasks,
    userId,
    groupId,
    viewAll,
  );
  return {
    unit: await mapUnit(unit),
    tasks: await mapTasks(rows, stubIds),
    allocated: openTasks.filter((task) => withResponsible.has(task.id)).length,
    total: openTasks.length,
  };
}

async function ensureUserTaskAssignment(userId: string, taskId: string) {
  const db = getDb();
  await db
    .insert(userTasks)
    .values({ userId, taskId })
    .onConflictDoNothing();
}

async function mapEvent(event: typeof events.$inferSelect) {
  const db = getDb();
  const attendees = await db
    .select({ userId: eventAttendees.userId })
    .from(eventAttendees)
    .where(eq(eventAttendees.eventId, event.id));

  return {
    ...event,
    _id: event.id,
    startDate: dateString(event.startDate),
    endDate: dateString(event.endDate),
    organisor: await loadUserById(event.organiserUserId),
    attending: await loadUsersByIds(attendees.map((row) => row.userId)),
  };
}

async function mapPost(post: typeof boardPosts.$inferSelect) {
  return {
    ...post,
    _id: post.id,
    Priority: post.priority,
    expiryDate: dateString(post.expiryDate),
    createdBy: await loadUserById(post.createdByUserId),
  };
}

async function hydrateUser(user: UserRow, groupId: string | null) {
  const db = getDb();
  const mapped = mapUser(user);

  const skillRows = await db
    .select({ skill: skills })
    .from(userSkills)
    .innerJoin(skills, eq(userSkills.skillId, skills.id))
    .where(eq(userSkills.userId, user.id));

  const assigned = await loadTasksForUser(user.id);

  const guardianRows = await db
    .select({ guardian: users })
    .from(userGuardians)
    .innerJoin(users, eq(userGuardians.guardianUserId, users.id))
    .where(eq(userGuardians.userId, user.id));

  const familyJoin = await db
    .select({ family: families })
    .from(familyMembers)
    .innerJoin(families, eq(familyMembers.familyId, families.id))
    .where(eq(familyMembers.userId, user.id))
    .limit(1);

  let family = null;
  if (familyJoin[0]) {
    const members = await db
      .select({ user: users })
      .from(familyMembers)
      .innerJoin(users, eq(familyMembers.userId, users.id))
      .where(eq(familyMembers.familyId, familyJoin[0].family.id));
    family = {
      _id: familyJoin[0].family.id,
      users: members.map(({ user: member }) => mapUser(member)),
    };
  }

  let roleList: Array<Record<string, unknown>> = [];
  if (groupId) {
    const [membership] = await db
      .select()
      .from(memberships)
      .where(
        and(eq(memberships.userId, user.id), eq(memberships.groupId, groupId)),
      )
      .limit(1);

    if (membership) {
      const roleRows = await db
        .select({ role: roles })
        .from(membershipRoles)
        .innerJoin(roles, eq(membershipRoles.roleId, roles.id))
        .where(eq(membershipRoles.membershipId, membership.id));

      roleList = await Promise.all(
        roleRows.map(async ({ role }) => {
          const reportsTo = role.reportsToRoleId
            ? (
                await db
                  .select()
                  .from(roles)
                  .where(eq(roles.id, role.reportsToRoleId))
                  .limit(1)
              )[0]
            : null;
          const mappedRole = {
            ...role,
            _id: role.id,
            prequistes: role.prerequisites,
            RequiredTraining: role.requiredTraining,
            reportsTo: reportsTo
              ? {
                  ...reportsTo,
                  _id: reportsTo.id,
                  prequistes: reportsTo.prerequisites,
                  RequiredTraining: reportsTo.requiredTraining,
                }
              : null,
          };
          return { ...mappedRole, ReportsTo: mappedRole.reportsTo };
        }),
      );
    }
  }

  return {
    ...mapped,
    skills: skillRows.map(({ skill }) => mapSkillRow(skill)),
    myTasks: await mapTasks(await expandTaskForest(assigned)),
    parentGardian: guardianRows.map(({ guardian }) => mapUser(guardian)),
    ParentGardian: guardianRows.map(({ guardian }) => mapUser(guardian)),
    family,
    Family: family,
    role: roleList,
  };
}

async function mapRole(role: typeof roles.$inferSelect) {
  const db = getDb();
  const reportsTo = role.reportsToRoleId
    ? (
        await db.select().from(roles).where(eq(roles.id, role.reportsToRoleId)).limit(1)
      )[0]
    : null;
  const mappedReportsTo = reportsTo
    ? {
        ...reportsTo,
        _id: reportsTo.id,
        prequistes: reportsTo.prerequisites,
        RequiredTraining: reportsTo.requiredTraining,
      }
    : null;
  return {
    ...role,
    _id: role.id,
    prequistes: role.prerequisites,
    RequiredTraining: role.requiredTraining,
    reportsTo: mappedReportsTo,
    ReportsTo: mappedReportsTo,
  };
}

function requireGroup(groupId: string | null) {
  if (!groupId) {
    throw GroupNotConfiguredError;
  }
  return groupId;
}

function mapGroup(group: {
  id: string;
  name: string;
  slug: string;
  status: string | null;
  enabledModules?: unknown;
}) {
  return {
    _id: group.id,
    name: group.name,
    slug: group.slug,
    status: group.status,
    enabledModules: expandEnabledModules(group.enabledModules),
  };
}

async function scopedGroupId(
  context: GraphQLContext,
  groupSlug?: string | null,
) {
  if (groupSlug) {
    const group = await findGroupBySlug(groupSlug);
    if (!group) {
      return null;
    }
    return group.id;
  }
  return context.groupId;
}

async function deleteEventImpl(
  { eventId }: { eventId: string },
  context: GraphQLContext,
) {
  const user = requireUser(context.user);
  const groupId = requireGroup(context.groupId);
  await requireModule(groupId, "events");
  const db = getDb();
  const [existingEvent] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.groupId, groupId)))
    .limit(1);
  if (!existingEvent) {
    return null;
  }
  await requireOwnerOrRole(user, groupId, [existingEvent.organiserUserId], LEADER_ROLES);
  const [removed] = await db
    .delete(events)
    .where(and(eq(events.id, eventId), eq(events.groupId, groupId)))
    .returning();
  return removed ? mapEvent(removed) : null;
}

async function canSeePrivateContent(
  context: GraphQLContext,
  groupId: string,
) {
  if (!context.user) {
    return false;
  }
  return hasActiveMembership(context.user._id, groupId);
}

export const resolvers = {
  User: {
    _id: (parent: { id?: string; _id?: string }) => parent._id ?? parent.id,
    displayName: (parent: UserRow & { displayName?: string }) =>
      parent.displayName ?? mapUser(parent).displayName,
    taskAvailabity: (parent: { taskAvailability?: number; taskAvailabity?: number }) =>
      parent.taskAvailabity ?? parent.taskAvailability,
    taskAvailability: (parent: { taskAvailability?: number; taskAvailabity?: number }) =>
      parent.taskAvailability ?? parent.taskAvailabity,
    Section: (parent: { section?: string | null; Section?: string | null }) =>
      parent.Section ?? parent.section,
  },
  BoardPost: {
    _id: (parent: { id?: string; _id?: string }) => parent._id ?? parent.id,
    Priority: (parent: { priority?: number | null; Priority?: number | null }) =>
      parent.Priority ?? parent.priority,
  },
  Task: {
    _id: (parent: { id?: string; _id?: string }) => parent._id ?? parent.id,
    Name: (parent: { name?: string | null; Name?: string | null }) =>
      parent.Name ?? parent.name,
    Priority: (parent: { priority?: number | null; Priority?: number | null }) =>
      parent.Priority ?? parent.priority,
  },
  Unit: {
    _id: (parent: { id?: string; _id?: string }) => parent._id ?? parent.id,
  },
  Event: {
    _id: (parent: { id?: string; _id?: string }) => parent._id ?? parent.id,
  },
  Skill: {
    _id: (parent: { id?: string; _id?: string }) => parent._id ?? parent.id,
  },
  Query: {
    publicGroup: async (_parent: unknown, { slug }: { slug: string }) => {
      const group = await findGroupBySlug(slug);
      if (!group) {
        return null;
      }
      return mapGroup(group);
    },
    boardPosts: async (
      _parent: unknown,
      { groupSlug }: { groupSlug?: string | null },
      context: GraphQLContext,
    ) => {
      const groupId = await scopedGroupId(context, groupSlug);
      if (!groupId) {
        return [];
      }
      const modules = await getGroupEnabledModules(groupId);
      if (!isModuleEnabled(modules, "noticeBoard")) {
        return [];
      }
      const db = getDb();
      const includePrivate = await canSeePrivateContent(context, groupId);
      const rows = includePrivate
        ? await db
            .select()
            .from(boardPosts)
            .where(eq(boardPosts.groupId, groupId))
            .orderBy(desc(boardPosts.priority))
        : await db
            .select()
            .from(boardPosts)
            .where(
              and(eq(boardPosts.groupId, groupId), eq(boardPosts.isPublic, true)),
            )
            .orderBy(desc(boardPosts.priority));
      return Promise.all(rows.map(mapPost));
    },
    events: async (
      _parent: unknown,
      { groupSlug }: { groupSlug?: string | null },
      context: GraphQLContext,
    ) => {
      const groupId = await scopedGroupId(context, groupSlug);
      if (!groupId) {
        return [];
      }
      const modules = await getGroupEnabledModules(groupId);
      if (!isModuleEnabled(modules, "events")) {
        return [];
      }
      const db = getDb();
      const includePrivate = await canSeePrivateContent(context, groupId);
      const rows = includePrivate
        ? await db
            .select()
            .from(events)
            .where(eq(events.groupId, groupId))
            .orderBy(events.startDate)
        : await db
            .select()
            .from(events)
            .where(and(eq(events.groupId, groupId), eq(events.isPublic, true)))
            .orderBy(events.startDate);
      return Promise.all(rows.map(mapEvent));
    },
    singleEvent: async (
      _parent: unknown,
      { eventId, groupSlug }: { eventId: string; groupSlug?: string | null },
      context: GraphQLContext,
    ) => {
      const groupId = await scopedGroupId(context, groupSlug);
      if (!groupId) {
        return null;
      }
      const modules = await getGroupEnabledModules(groupId);
      if (!isModuleEnabled(modules, "events")) {
        return null;
      }
      const db = getDb();
      const [row] = await db
        .select()
        .from(events)
        .where(and(eq(events.id, eventId), eq(events.groupId, groupId)))
        .limit(1);
      if (!row) {
        return null;
      }
      const includePrivate = await canSeePrivateContent(context, groupId);
      if (!includePrivate && !row.isPublic) {
        return null;
      }
      return mapEvent(row);
    },
    tasks: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireModule(groupId, "tasks");
      const db = getDb();
      const rows = await db
        .select()
        .from(tasks)
        .where(eq(tasks.groupId, groupId))
        .orderBy(desc(tasks.priority));
      const viewAll = await canViewAllUnitBuckets(user, groupId);
      const visible = await filterVisibleTasks(rows, user._id, groupId, viewAll);
      const { rows: forest, stubIds } = includeAncestorStubs(visible, rows);
      return mapTasks(forest, stubIds);
    },
    userTasks: async (
      _parent: unknown,
      { userId }: { userId?: string },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireModule(groupId, "tasks");
      const targetId = userId || user._id;
      const rows = await loadTasksForUser(targetId, groupId);
      return mapTasks(await expandTaskForest(rows));
    },
    suggestedTasks: async (
      _parent: unknown,
      args: {
        userId?: string;
        numberOfTasks?: number;
        userSkills?: SkillInput[];
      },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireModule(groupId, "tasks");
      const db = getDb();
      const targetId = args.userId || user._id;

      let skillIds = (args.userSkills ?? [])
        .map((skill) => skill._id)
        .filter((id): id is string => Boolean(id));
      let limit = args.numberOfTasks;

      if (skillIds.length === 0 || limit == null) {
        const [profile] = await db
          .select()
          .from(users)
          .where(eq(users.id, targetId))
          .limit(1);
        if (!profile) {
          return [];
        }
        if (skillIds.length === 0) {
          const owned = await db
            .select({ skillId: userSkills.skillId })
            .from(userSkills)
            .where(eq(userSkills.userId, targetId));
          skillIds = owned.map((row) => row.skillId);
        }
        if (limit == null) {
          limit = profile.taskAvailability;
        }
      }

      if (limit == null || limit <= 0) {
        return [];
      }

      const [matching, unskilled, userUnitIdList, viewAll] = await Promise.all([
        skillIds.length === 0
          ? Promise.resolve([] as Array<{ task: TaskRow }>)
          : db
              .select({ task: tasks })
              .from(taskSkills)
              .innerJoin(tasks, eq(taskSkills.taskId, tasks.id))
              .where(
                and(eq(tasks.groupId, groupId), inArray(taskSkills.skillId, skillIds)),
              ),
        db
          .select({ task: tasks })
          .from(tasks)
          .leftJoin(taskSkills, eq(tasks.id, taskSkills.taskId))
          .where(and(eq(tasks.groupId, groupId), isNull(taskSkills.taskId))),
        loadUserUnitIds(targetId, groupId),
        canViewAllUnitBuckets(user, groupId),
      ]);

      const unique = new Map<string, TaskRow>();
      const skillMatchedIds = new Set<string>();
      for (const { task } of matching) {
        unique.set(task.id, task);
        skillMatchedIds.add(task.id);
      }
      for (const { task } of unskilled) {
        unique.set(task.id, task);
      }

      const candidateIds = [...unique.keys()];
      if (candidateIds.length === 0) {
        return [];
      }

      const [claimedRows, responsibleRows, unitIdsByTask] = await Promise.all([
        db
          .select({ taskId: userTasks.taskId })
          .from(userTasks)
          .where(inArray(userTasks.taskId, candidateIds)),
        db
          .select({ taskId: taskResponsible.taskId })
          .from(taskResponsible)
          .where(inArray(taskResponsible.taskId, candidateIds)),
        loadUnitIdsByTaskIds(candidateIds),
      ]);
      const takenIds = new Set([
        ...claimedRows.map((row) => row.taskId),
        ...responsibleRows.map((row) => row.taskId),
      ]);
      const filled = pickSuggestedTasks({
        candidates: [...unique.values()],
        skillMatchedIds,
        takenIds,
        unitIdsByTask,
        userUnitIds: new Set(userUnitIdList),
        viewAll,
        limit,
      });
      return mapTasks(filled);
    },
    members: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      const db = getDb();
      const rows = await db
        .select({ user: users })
        .from(memberships)
        .innerJoin(users, eq(memberships.userId, users.id))
        .where(
          and(eq(memberships.groupId, groupId), eq(memberships.status, "active")),
        );
      return rows
        .map(({ user }) => mapUser(user))
        .sort((a, b) => {
          const sectionCmp = (a.section ?? "").localeCompare(b.section ?? "");
          if (sectionCmp !== 0) {
            return sectionCmp;
          }
          return a.displayName.localeCompare(b.displayName);
        });
    },
    me: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      const user = requireUser(context.user);
      const db = getDb();
      const [row] = await db
        .select()
        .from(users)
        .where(eq(users.id, user._id))
        .limit(1);
      if (!row) {
        return null;
      }
      return hydrateUser(row, context.groupId);
    },
    pageSkills: async (
      _parent: unknown,
      { userId }: { userId?: string },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireModule(groupId, "skills");
      const targetId = userId || user._id;
      const db = getDb();
      const visible = await db
        .select()
        .from(skills)
        .where(
          and(
            ne(skills.status, "archived"),
            or(
              and(eq(skills.scope, "platform"), eq(skills.status, "approved")),
              and(eq(skills.scope, "group"), eq(skills.groupId, groupId)),
            ),
          ),
        )
        .orderBy(asc(skills.name));
      const owned = await db
        .select({ skillId: userSkills.skillId })
        .from(userSkills)
        .where(eq(userSkills.userId, targetId));
      const ownedSet = new Set(owned.map((row) => row.skillId));
      return visible.map((skill) =>
        mapSkillRow(skill, { isActiveForUser: ownedSet.has(skill.id) }),
      );
    },
    groupSkills: async (
      _parent: unknown,
      { includeArchived }: { includeArchived?: boolean },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireModule(groupId, "skills");
      await requireRole(user, groupId, GROUP_ADMIN_ROLES);
      const db = getDb();
      const conditions = [
        eq(skills.scope, "group"),
        eq(skills.groupId, groupId),
      ];
      if (!includeArchived) {
        conditions.push(ne(skills.status, "archived"));
      }
      const rows = await db
        .select()
        .from(skills)
        .where(and(...conditions))
        .orderBy(asc(skills.name));
      return Promise.all(
        rows.map(async (skill) => {
          const usage = await loadSkillUsage(skill.id);
          return mapSkillRow(skill, usage);
        }),
      );
    },
    platformSkills: async (
      _parent: unknown,
      { includePending }: { includePending?: boolean },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      requirePlatformAdmin(user);
      const db = getDb();
      const statusValues = includePending
        ? ["approved", "pending", "archived"]
        : ["approved", "archived"];
      const rows = await db
        .select()
        .from(skills)
        .where(
          and(eq(skills.scope, "platform"), inArray(skills.status, statusValues)),
        )
        .orderBy(asc(skills.name));
      return Promise.all(
        rows.map(async (skill) => {
          const usage = await loadSkillUsage(skill.id);
          return mapSkillRow(skill, usage);
        }),
      );
    },
    myStats: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireModule(groupId, "memberStats");
      const db = getDb();

      const counts = await db
        .select({
          section: users.section,
          value: sql<number>`count(*)`.mapWith(Number),
        })
        .from(memberships)
        .innerJoin(users, eq(memberships.userId, users.id))
        .where(
          and(eq(memberships.groupId, groupId), eq(memberships.status, "active")),
        )
        .groupBy(users.section);

      const bySection = new Map(
        counts.map((row) => [row.section ?? "", row.value]),
      );
      return [
        { name: "Joeys", value: String(bySection.get("JOEYS") ?? 0) },
        { name: "Cubs", value: String(bySection.get("CUBS") ?? 0) },
        { name: "Scouts", value: String(bySection.get("SCOUTS") ?? 0) },
        { name: "Venturers", value: String(bySection.get("VENT") ?? 0) },
        { name: "Rovers", value: String(bySection.get("ROVER") ?? 0) },
      ];
    },
    singleTask: async (
      _parent: unknown,
      { taskId }: { taskId: string },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireModule(groupId, "tasks");
      const db = getDb();
      const [row] = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, taskId), eq(tasks.groupId, groupId)))
        .limit(1);
      if (!row) {
        return null;
      }
      const viewAll = await canViewAllUnitBuckets(user, groupId);
      const visible = await filterVisibleTasks([row], user._id, groupId, viewAll);
      return visible[0] ? mapTask(visible[0]) : null;
    },
    units: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireModule(groupId, "tasks");
      const db = getDb();
      const rows = await db
        .select()
        .from(units)
        .where(eq(units.groupId, groupId))
        .orderBy(asc(units.name));
      return Promise.all(rows.map(mapUnit));
    },
    singleUnit: async (
      _parent: unknown,
      { unitId }: { unitId: string },
      context: GraphQLContext,
    ) => {
      requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireModule(groupId, "tasks");
      const unit = await requireGroupUnit(groupId, unitId);
      return mapUnit(unit);
    },
    unitBuckets: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireModule(groupId, "tasks");
      const viewAll = await canViewAllUnitBuckets(user, groupId);
      const visibleUnits = await loadVisibleUnits(user._id, groupId, viewAll);
      return Promise.all(visibleUnits.map((unit) =>
        mapUnitBucket(unit, groupId, user._id, viewAll),
      ));
    },
    unassignedTasks: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireModule(groupId, "tasks");
      const viewAll = await canViewAllUnitBuckets(user, groupId);
      if (!viewAll) {
        return [];
      }
      const db = getDb();
      const rows = await db
        .select()
        .from(tasks)
        .where(eq(tasks.groupId, groupId))
        .orderBy(desc(tasks.priority));
      const assignedIds = new Set(
        (
          await db
            .select({ taskId: taskUnits.taskId })
            .from(taskUnits)
            .innerJoin(tasks, eq(taskUnits.taskId, tasks.id))
            .where(eq(tasks.groupId, groupId))
        ).map((row) => row.taskId),
      );
      const unassigned = rows.filter((task) => !assignedIds.has(task.id));
      return mapTasks(await expandTaskForest(unassigned));
    },
    singleMember: async (
      _parent: unknown,
      { userId }: { userId: string },
      context: GraphQLContext,
    ) => {
      requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      const db = getDb();
      const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      return row ? hydrateUser(row, groupId) : null;
    },
    roles: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      requireUser(context.user);
      const db = getDb();
      const rows = await db.select().from(roles).orderBy(roles.name);
      return Promise.all(rows.map(mapRole));
    },
    myPermissions: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const platformAdmin = isPlatformAdmin(user.email);
      if (!context.groupId) {
        return {
          roles: platformAdmin ? ["GroupLeader"] : [],
          canManageTasks: platformAdmin,
          canManageEvents: platformAdmin,
          canManagePosts: platformAdmin,
          canManageMembers: platformAdmin,
          canManageGroupModules: platformAdmin,
          canViewAllUnitBuckets: platformAdmin,
          isPlatformAdmin: platformAdmin,
        };
      }
      const userRoles = await getMemberRoles(user._id, context.groupId, user.email);
      return {
        roles: userRoles,
        canManageTasks: hasAnyRole(userRoles, LEADER_ROLES),
        canManageEvents: hasAnyRole(userRoles, LEADER_ROLES),
        canManagePosts: hasAnyRole(userRoles, LEADER_ROLES),
        canManageMembers: hasAnyRole(userRoles, GROUP_ADMIN_ROLES),
        canManageGroupModules: hasAnyRole(userRoles, MODULE_SETTINGS_ROLES),
        canViewAllUnitBuckets: await canViewAllUnitBuckets(user, context.groupId),
        isPlatformAdmin: platformAdmin,
      };
    },
    myGroups: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      if (isPlatformAdmin(user.email)) {
        const rows = await listActiveGroups();
        return rows.map(mapGroup);
      }
      const rows = await listUserActiveGroups(user._id);
      return rows.map(mapGroup);
    },
    activeGroup: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      requireUser(context.user);
      if (!context.groupId) {
        return null;
      }
      const group = await findGroupById(context.groupId);
      if (!group) {
        return null;
      }
      return mapGroup(group);
    },
    adminGroups: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      requirePlatformAdmin(context.user);
      const db = getDb();
      const rows = await db
        .select({
          id: groups.id,
          name: groups.name,
          slug: groups.slug,
          status: groups.status,
          memberCount: count(memberships.id),
        })
        .from(groups)
        .leftJoin(
          memberships,
          and(
            eq(memberships.groupId, groups.id),
            eq(memberships.status, "active"),
          ),
        )
        .groupBy(groups.id)
        .orderBy(asc(groups.name));
      return rows.map((row) => ({
        _id: row.id,
        name: row.name,
        slug: row.slug,
        status: row.status,
        memberCount: Number(row.memberCount),
      }));
    },
    orphanedUsers: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      requirePlatformAdmin(context.user);
      const db = getDb();
      const rows = await db
        .select()
        .from(users)
        .where(
          sql`not exists (
            select 1 from ${memberships}
            where ${memberships.userId} = ${users.id}
              and ${memberships.status} = 'active'
          )`,
        )
        .orderBy(asc(users.email));
      return rows.map((row) => mapUser(row));
    },
    adminGroupMembers: async (
      _parent: unknown,
      { groupId }: { groupId: string },
      context: GraphQLContext,
    ) => {
      requirePlatformAdmin(context.user);
      const db = getDb();
      const rows = await db
        .select({ user: users })
        .from(memberships)
        .innerJoin(users, eq(memberships.userId, users.id))
        .where(
          and(eq(memberships.groupId, groupId), eq(memberships.status, "active")),
        )
        .orderBy(asc(users.lastName), asc(users.firstName));
      return Promise.all(rows.map(({ user }) => hydrateUser(user, groupId)));
    },
  },
  Mutation: {
    addUser: async (
      _parent: unknown,
      { user }: { user: { firstName: string; lastName: string; email: string; password: string } },
      context: GraphQLContext,
    ) => {
      const groupId = requireGroup(context.groupId);
      const db = getDb();
      const passwordHash = await bcrypt.hash(user.password, 10);
      const [created] = await db
        .insert(users)
        .values({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email.toLowerCase(),
          passwordHash,
        })
        .returning();

      await db.insert(memberships).values({
        userId: created.id,
        groupId,
        status: "active",
      });

      const mapped = mapUser(created);
      return {
        token: signToken({
          _id: created.id,
          email: created.email,
          firstName: created.firstName,
          lastName: created.lastName,
        }),
        user: mapped,
      };
    },
    login: async (
      _parent: unknown,
      { email, password }: { email: string; password: string },
    ) => {
      const db = getDb();
      const [found] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

      if (!found?.passwordHash) {
        throw AuthenticationError;
      }
      const ok = await bcrypt.compare(password, found.passwordHash);
      if (!ok) {
        throw AuthenticationError;
      }

      return {
        token: signToken({
          _id: found.id,
          email: found.email,
          firstName: found.firstName,
          lastName: found.lastName,
        }),
        user: mapUser(found),
      };
    },
    updateUser: async (
      _parent: unknown,
      { user }: { user: UserInput },
      context: GraphQLContext,
    ) => {
      const current = requireUser(context.user);
      const targetId = user._id || current._id;
      if (targetId !== current._id) {
        await requireRole(current, context.groupId, GROUP_ADMIN_ROLES);
      }
      const db = getDb();
      const [updated] = await db
        .update(users)
        .set({
          firstName: user.firstName,
          lastName: user.lastName,
          preferredName: user.preferredName,
          scoutName: user.scoutName,
          scoutRego: user.scoutRego,
          status: user.status,
          gender: user.gender,
          dob: toDate(user.dob) ?? undefined,
          section: user.section,
          email: user.email?.toLowerCase(),
          phone: user.phone,
          taskAvailability: user.taskAvailabity,
          updatedAt: new Date(),
        })
        .where(eq(users.id, targetId))
        .returning();
      return updated ? hydrateUser(updated, context.groupId) : null;
    },
    updateUserTime: async (
      _parent: unknown,
      { taskAvailabity }: { taskAvailabity: number },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireModule(groupId, "tasks");
      const db = getDb();
      const [updated] = await db
        .update(users)
        .set({ taskAvailability: taskAvailabity, updatedAt: new Date() })
        .where(eq(users.id, user._id))
        .returning();
      return updated ? mapUser(updated) : null;
    },
    assignUserSkill: async (
      _parent: unknown,
      { skillId, userId }: { skillId?: string; userId?: string },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireModule(groupId, "skills");
      if (!skillId) {
        throw new GraphQLError("Skill is required");
      }
      await assertSkillAssignable(skillId, groupId);
      const targetId = userId || user._id;
      if (targetId !== user._id) {
        await requireRole(user, context.groupId, GROUP_ADMIN_ROLES);
      }
      const db = getDb();
      await db
        .insert(userSkills)
        .values({ userId: targetId, skillId })
        .onConflictDoNothing();
      const [row] = await db.select().from(users).where(eq(users.id, targetId));
      return row ? hydrateUser(row, context.groupId) : null;
    },
    removeUserSkill: async (
      _parent: unknown,
      { skillId, userId }: { skillId?: string; userId?: string },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireModule(groupId, "skills");
      if (!skillId) {
        return null;
      }
      const targetId = userId || user._id;
      if (targetId !== user._id) {
        await requireRole(user, context.groupId, GROUP_ADMIN_ROLES);
      }
      const db = getDb();
      await db
        .delete(userSkills)
        .where(and(eq(userSkills.userId, targetId), eq(userSkills.skillId, skillId)));
      const [row] = await db.select().from(users).where(eq(users.id, targetId));
      return row ? hydrateUser(row, context.groupId) : null;
    },
    createSkill: async (
      _parent: unknown,
      { skill }: { skill: CreateSkillInput },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireModule(groupId, "skills");
      await requireRole(user, groupId, LEADER_ROLES);
      const name = skill.name.trim();
      if (!name) {
        throw new GraphQLError("Skill name is required");
      }
      const existing = await findVisibleSkillByName(groupId, name);
      if (existing) {
        return mapSkillRow(existing);
      }
      const db = getDb();
      const [created] = await db
        .insert(skills)
        .values({
          name,
          parentId: skill.parentId || null,
          scope: "group",
          groupId,
          status: "approved",
          createdByUserId: user._id,
        })
        .returning();
      return created ? mapSkillRow(created) : null;
    },
    updateSkillCatalog: async (
      _parent: unknown,
      { skillId, skill }: { skillId: string; skill: SkillCatalogInput },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const existing = await getSkillOrThrow(skillId);
      await requireSkillCatalogAccess(user, existing, context.groupId);
      const db = getDb();
      const [updated] = await db
        .update(skills)
        .set({
          name: skill.name?.trim() || existing.name,
          parentId:
            skill.parentId === undefined ? existing.parentId : skill.parentId || null,
          status: skill.status ?? existing.status,
        })
        .where(eq(skills.id, skillId))
        .returning();
      return updated ? mapSkillRow(updated) : null;
    },
    archiveSkill: async (
      _parent: unknown,
      { skillId }: { skillId: string },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const existing = await getSkillOrThrow(skillId);
      await requireSkillCatalogAccess(user, existing, context.groupId);
      const db = getDb();
      const [updated] = await db
        .update(skills)
        .set({ status: "archived" })
        .where(eq(skills.id, skillId))
        .returning();
      return updated ? mapSkillRow(updated) : null;
    },
    requestPromoteSkill: async (
      _parent: unknown,
      { skillId }: { skillId: string },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireModule(groupId, "skills");
      await requireRole(user, groupId, GROUP_ADMIN_ROLES);
      const existing = await getSkillOrThrow(skillId);
      if (existing.scope !== "group" || existing.groupId !== groupId) {
        throw new GraphQLError("Only group skills can be promoted");
      }
      const db = getDb();
      const [platformExisting] = await db
        .select()
        .from(skills)
        .where(
          and(eq(skills.scope, "platform"), eq(skills.name, existing.name)),
        )
        .limit(1);
      if (platformExisting) {
        if (platformExisting.status === "archived") {
          const [restored] = await db
            .update(skills)
            .set({ status: "pending" })
            .where(eq(skills.id, platformExisting.id))
            .returning();
          return restored ? mapSkillRow(restored) : null;
        }
        return mapSkillRow(platformExisting);
      }
      let parentId: string | null = null;
      if (existing.parentId) {
        const parent = await getSkillOrThrow(existing.parentId);
        if (parent.scope === "platform" && parent.status === "approved") {
          parentId = parent.id;
        }
      }
      const [created] = await db
        .insert(skills)
        .values({
          name: existing.name,
          parentId,
          scope: "platform",
          status: "pending",
          createdByUserId: user._id,
        })
        .returning();
      return created ? mapSkillRow(created) : null;
    },
    approvePlatformSkill: async (
      _parent: unknown,
      { skillId }: { skillId: string },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      requirePlatformAdmin(user);
      const existing = await getSkillOrThrow(skillId);
      if (existing.scope !== "platform") {
        throw new GraphQLError("Only platform skills can be approved");
      }
      const db = getDb();
      const [updated] = await db
        .update(skills)
        .set({ status: "approved" })
        .where(eq(skills.id, skillId))
        .returning();
      return updated ? mapSkillRow(updated) : null;
    },
    rejectPlatformSkill: async (
      _parent: unknown,
      { skillId }: { skillId: string },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      requirePlatformAdmin(user);
      const existing = await getSkillOrThrow(skillId);
      if (existing.scope !== "platform") {
        throw new GraphQLError("Only platform skills can be rejected");
      }
      const db = getDb();
      if (existing.status === "pending") {
        const [removed] = await db
          .delete(skills)
          .where(eq(skills.id, skillId))
          .returning();
        return removed ? mapSkillRow(removed) : null;
      }
      const [updated] = await db
        .update(skills)
        .set({ status: "archived" })
        .where(eq(skills.id, skillId))
        .returning();
      return updated ? mapSkillRow(updated) : null;
    },
    createPlatformSkill: async (
      _parent: unknown,
      { skill }: { skill: CreateSkillInput },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      requirePlatformAdmin(user);
      const name = skill.name.trim();
      if (!name) {
        throw new GraphQLError("Skill name is required");
      }
      const db = getDb();
      const [existing] = await db
        .select()
        .from(skills)
        .where(and(eq(skills.scope, "platform"), eq(skills.name, name)))
        .limit(1);
      if (existing) {
        if (existing.status !== "approved") {
          const [restored] = await db
            .update(skills)
            .set({
              status: "approved",
              parentId: skill.parentId || existing.parentId,
            })
            .where(eq(skills.id, existing.id))
            .returning();
          return restored ? mapSkillRow(restored) : null;
        }
        return mapSkillRow(existing);
      }
      const [created] = await db
        .insert(skills)
        .values({
          name,
          parentId: skill.parentId || null,
          scope: "platform",
          status: "approved",
          createdByUserId: user._id,
        })
        .returning();
      return created ? mapSkillRow(created) : null;
    },
    assignUserTask: async (
      _parent: unknown,
      { taskId, userId }: { taskId: string; userId?: string },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireModule(groupId, "tasks");
      const targetId = userId || user._id;
      if (targetId !== user._id) {
        await requireRole(user, context.groupId, LEADER_ROLES);
      }
      const db = getDb();
      const [existingTask] = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, taskId), eq(tasks.groupId, groupId)))
        .limit(1);
      if (existingTask && isWishlistStatus(existingTask.status)) {
        await db
          .update(tasks)
          .set({ status: TASK_STATUS.toDo, updatedAt: new Date() })
          .where(eq(tasks.id, existingTask.id));
      }
      await db
        .insert(userTasks)
        .values({ userId: targetId, taskId })
        .onConflictDoNothing();
      const [row] = await db.select().from(users).where(eq(users.id, targetId));
      return row ? hydrateUser(row, context.groupId) : null;
    },
    removeUserFromTask: async (
      _parent: unknown,
      { taskId, userId }: { taskId: string; userId?: string },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireModule(groupId, "tasks");
      const targetId = userId || user._id;
      if (targetId !== user._id) {
        await requireRole(user, context.groupId, LEADER_ROLES);
      }
      const db = getDb();
      await db
        .delete(userTasks)
        .where(and(eq(userTasks.userId, targetId), eq(userTasks.taskId, taskId)));
      const [row] = await db.select().from(users).where(eq(users.id, targetId));
      return row ? hydrateUser(row, context.groupId) : null;
    },
    addBoardPost: async (
      _parent: unknown,
      { postData }: { postData: PostInput },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireModule(groupId, "noticeBoard");
      await requireRole(user, groupId, LEADER_ROLES);
      const db = getDb();
      const [created] = await db
        .insert(boardPosts)
        .values({
          groupId,
          title: postData.title,
          content: postData.content,
          image: postData.image,
          isPublic: postData.isPublic ?? false,
          expiryDate: toDate(postData.expiryDate),
          createdByUserId: user._id,
          priority: postData.priority ?? postData.Priority,
        })
        .returning();
      return mapPost(created);
    },
    updateBoardPost: async (
      _parent: unknown,
      { postId, postData }: { postId: string; postData?: PostInput },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireModule(groupId, "noticeBoard");
      const db = getDb();
      const [existingPost] = await db
        .select()
        .from(boardPosts)
        .where(and(eq(boardPosts.id, postId), eq(boardPosts.groupId, groupId)))
        .limit(1);
      if (!existingPost) {
        return null;
      }
      await requireOwnerOrRole(
        user,
        groupId,
        [existingPost.createdByUserId],
        LEADER_ROLES,
      );
      const [updated] = await db
        .update(boardPosts)
        .set({
          title: postData?.title,
          content: postData?.content,
          image: postData?.image,
          isPublic: postData?.isPublic,
          expiryDate: toDate(postData?.expiryDate) ?? undefined,
          priority: postData?.priority ?? postData?.Priority,
          updatedAt: new Date(),
        })
        .where(and(eq(boardPosts.id, postId), eq(boardPosts.groupId, groupId)))
        .returning();
      return updated ? mapPost(updated) : null;
    },
    deleteBoardPost: async (
      _parent: unknown,
      { postId }: { postId: string },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireModule(groupId, "noticeBoard");
      const db = getDb();
      const [existingPost] = await db
        .select()
        .from(boardPosts)
        .where(and(eq(boardPosts.id, postId), eq(boardPosts.groupId, groupId)))
        .limit(1);
      if (!existingPost) {
        return null;
      }
      await requireOwnerOrRole(
        user,
        groupId,
        [existingPost.createdByUserId],
        LEADER_ROLES,
      );
      const [removed] = await db
        .delete(boardPosts)
        .where(and(eq(boardPosts.id, postId), eq(boardPosts.groupId, groupId)))
        .returning();
      return removed ? mapPost(removed) : null;
    },
    addEvent: async (
      _parent: unknown,
      { eventData }: { eventData: EventInput },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireModule(groupId, "events");
      await requireRole(user, groupId, LEADER_ROLES);
      const db = getDb();
      const [created] = await db
        .insert(events)
        .values({
          groupId,
          title: eventData.title ?? "Untitled event",
          organiserUserId: user._id,
          startDate: toDate(eventData.startDate),
          endDate: toDate(eventData.endDate),
          isPublic: eventData.isPublic ?? false,
          description: eventData.description,
          location: eventData.location,
          plan: eventData.plan,
          riskManagement: eventData.riskManagement,
          status: eventData.status,
          cost: eventData.cost,
        })
        .returning();
      return mapEvent(created);
    },
    updateEvent: async (
      _parent: unknown,
      { eventId, eventData }: { eventId: string; eventData: EventInput },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireModule(groupId, "events");
      const db = getDb();
      const [existingEvent] = await db
        .select()
        .from(events)
        .where(and(eq(events.id, eventId), eq(events.groupId, groupId)))
        .limit(1);
      if (!existingEvent) {
        return null;
      }
      await requireOwnerOrRole(
        user,
        groupId,
        [existingEvent.organiserUserId],
        LEADER_ROLES,
      );
      const [updated] = await db
        .update(events)
        .set({
          title: eventData.title,
          startDate: toDate(eventData.startDate) ?? undefined,
          endDate: toDate(eventData.endDate) ?? undefined,
          isPublic: eventData.isPublic,
          description: eventData.description,
          location: eventData.location,
          plan: eventData.plan,
          riskManagement: eventData.riskManagement,
          status: eventData.status,
          cost: eventData.cost,
          updatedAt: new Date(),
        })
        .where(and(eq(events.id, eventId), eq(events.groupId, groupId)))
        .returning();
      return updated ? mapEvent(updated) : null;
    },
    deletEvent: async (
      _parent: unknown,
      args: { eventId: string },
      context: GraphQLContext,
    ) => deleteEventImpl(args, context),
    deleteEvent: async (
      _parent: unknown,
      args: { eventId: string },
      context: GraphQLContext,
    ) => deleteEventImpl(args, context),
    joinEvent: async (
      _parent: unknown,
      { eventId }: { eventId: string },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireModule(groupId, "events");
      await requireMembership(user, groupId);
      const db = getDb();
      const [event] = await db
        .select()
        .from(events)
        .where(and(eq(events.id, eventId), eq(events.groupId, groupId)))
        .limit(1);
      if (!event) {
        return null;
      }
      await db
        .insert(eventAttendees)
        .values({ eventId, userId: user._id })
        .onConflictDoNothing();
      return mapEvent(event);
    },
    leaveEvent: async (
      _parent: unknown,
      { eventId }: { eventId: string },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireModule(groupId, "events");
      const db = getDb();
      const [event] = await db
        .select()
        .from(events)
        .where(and(eq(events.id, eventId), eq(events.groupId, groupId)))
        .limit(1);
      if (!event) {
        return null;
      }
      await db
        .delete(eventAttendees)
        .where(
          and(eq(eventAttendees.eventId, eventId), eq(eventAttendees.userId, user._id)),
        );
      return mapEvent(event);
    },
    setEventAttendee: async (
      _parent: unknown,
      {
        eventId,
        userId,
        attending,
      }: { eventId: string; userId: string; attending: boolean },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireModule(groupId, "events");
      const db = getDb();
      const [event] = await db
        .select()
        .from(events)
        .where(and(eq(events.id, eventId), eq(events.groupId, groupId)))
        .limit(1);
      if (!event) {
        return null;
      }
      await requireOwnerOrRole(user, groupId, [event.organiserUserId], LEADER_ROLES);
      if (attending) {
        await db
          .insert(eventAttendees)
          .values({ eventId, userId })
          .onConflictDoNothing();
      } else {
        await db
          .delete(eventAttendees)
          .where(
            and(eq(eventAttendees.eventId, eventId), eq(eventAttendees.userId, userId)),
          );
      }
      return mapEvent(event);
    },
    addTask: async (
      _parent: unknown,
      { taskData }: { taskData: TaskInput },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireModule(groupId, "tasks");
      await requireRole(user, groupId, LEADER_ROLES);
      const parentTaskId = await resolveParentTaskId(
        groupId,
        taskData.parentTaskId,
      );
      const db = getDb();
      const [created] = await db
        .insert(tasks)
        .values({
          groupId,
          name: taskData.name ?? "Untitled task",
          description: taskData.description,
          status: taskData.status ?? "toDo",
          dueDate: toDate(taskData.dueDate) ?? defaultDueDate(),
          duration: taskData.duration,
          priority: taskData.priority,
          createdByUserId: user._id,
          parentTaskId: parentTaskId ?? null,
        })
        .returning();

      const skillIds = await resolveRequiredSkillIds(
        taskData.requiredSkills ?? [],
        groupId,
        user._id,
      );
      if (skillIds.length > 0) {
        await db.insert(taskSkills).values(
          skillIds.map((skillId) => ({ taskId: created.id, skillId })),
        );
      }
      await setTaskResponsible(created.id, taskData.responsible ?? []);
      let unitInputs = taskData.units;
      if (
        parentTaskId &&
        (!unitInputs || unitInputs.length === 0)
      ) {
        const parentUnits = await loadUnitsForTask(parentTaskId);
        unitInputs = parentUnits.map((unit) => ({ _id: unit._id }));
      }
      await setTaskUnits(created.id, groupId, unitInputs ?? []);
      return mapTask(created);
    },
    addTasks: async (
      _parent: unknown,
      {
        roots,
        units,
        parentTaskId,
      }: {
        roots: OutlineTaskInput[];
        units?: { _id?: string }[] | null;
        parentTaskId?: string | null;
      },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireModule(groupId, "tasks");
      await requireRole(user, groupId, LEADER_ROLES);
      const resolvedParentId =
        (await resolveParentTaskId(groupId, parentTaskId)) ?? null;
      let rootUnits = units ?? [];
      if (resolvedParentId && rootUnits.length === 0) {
        const parentUnits = await loadUnitsForTask(resolvedParentId);
        rootUnits = parentUnits.map((unit) => ({ _id: unit._id }));
      }
      const db = getDb();
      const createdRows: TaskRow[] = [];
      const dueDate = defaultDueDate();

      const insertNode = async (
        node: OutlineTaskInput,
        parentId: string | null,
        inheritedUnits: { _id?: string }[],
      ) => {
        const unitInputs =
          node.units && node.units.length > 0 ? node.units : inheritedUnits;
        const [created] = await db
          .insert(tasks)
          .values({
            groupId,
            name: node.name.trim() || "Untitled task",
            status: "toDo",
            dueDate,
            duration: node.duration ?? 2,
            priority: node.priority ?? 5,
            createdByUserId: user._id,
            parentTaskId: parentId,
          })
          .returning();
        const skillIds = await resolveRequiredSkillIds(
          node.requiredSkills ?? [],
          groupId,
          user._id,
        );
        if (skillIds.length > 0) {
          await db.insert(taskSkills).values(
            skillIds.map((skillId) => ({ taskId: created.id, skillId })),
          );
        }
        await setTaskUnits(created.id, groupId, unitInputs);
        await setTaskResponsible(created.id, node.responsible ?? []);
        createdRows.push(created);
        for (const child of node.children ?? []) {
          await insertNode(child, created.id, unitInputs);
        }
      };

      for (const root of roots) {
        await insertNode(root, resolvedParentId, rootUnits);
      }
      return mapTasks(createdRows);
    },
    updateTask: async (
      _parent: unknown,
      { taskId, taskData }: { taskId: string; taskData: TaskInput },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireModule(groupId, "tasks");
      const db = getDb();
      const [existingTask] = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, taskId), eq(tasks.groupId, groupId)))
        .limit(1);
      if (!existingTask) {
        return null;
      }
      await requireOwnerOrRole(
        user,
        groupId,
        await loadTaskOwnerIds(existingTask),
        LEADER_ROLES,
      );
      const parentTaskId = await resolveParentTaskId(
        groupId,
        taskData.parentTaskId,
        taskId,
      );
      const [updated] = await db
        .update(tasks)
        .set({
          name: taskData.name,
          description: taskData.description,
          status: taskData.status,
          dueDate: toDate(taskData.dueDate) ?? undefined,
          duration: taskData.duration,
          priority: taskData.priority,
          ...(parentTaskId !== undefined ? { parentTaskId } : {}),
          updatedAt: new Date(),
        })
        .where(and(eq(tasks.id, taskId), eq(tasks.groupId, groupId)))
        .returning();
      if (!updated) {
        return null;
      }
      if (taskData.requiredSkills) {
        const skillIds = await resolveRequiredSkillIds(
          taskData.requiredSkills,
          groupId,
          user._id,
        );
        await db.delete(taskSkills).where(eq(taskSkills.taskId, taskId));
        if (skillIds.length > 0) {
          await db
            .insert(taskSkills)
            .values(skillIds.map((skillId) => ({ taskId, skillId })));
        }
      }
      await setTaskResponsible(taskId, taskData.responsible);
      await setTaskUnits(taskId, groupId, taskData.units);
      return mapTask(updated);
    },
    setTaskStatus: async (
      _parent: unknown,
      { taskId, status }: { taskId: string; status: string },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireModule(groupId, "tasks");
      const db = getDb();
      const [existingTask] = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, taskId), eq(tasks.groupId, groupId)))
        .limit(1);
      if (!existingTask) {
        return null;
      }
      await requireOwnerOrRole(
        user,
        groupId,
        await loadTaskOwnerIds(existingTask),
        LEADER_ROLES,
      );
      const [updated] = await db
        .update(tasks)
        .set({ status, updatedAt: new Date() })
        .where(eq(tasks.id, taskId))
        .returning();
      return updated ? mapTask(updated) : null;
    },
    setTaskUnits: async (
      _parent: unknown,
      { taskId, unitIds }: { taskId: string; unitIds: string[] },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireModule(groupId, "tasks");
      await requireRole(user, groupId, LEADER_ROLES);
      const db = getDb();
      const [existingTask] = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, taskId), eq(tasks.groupId, groupId)))
        .limit(1);
      if (!existingTask) {
        return null;
      }
      await setTaskUnits(
        taskId,
        groupId,
        unitIds.map((unitId) => ({ _id: unitId })),
      );
      const [updated] = await db
        .update(tasks)
        .set({ updatedAt: new Date() })
        .where(and(eq(tasks.id, taskId), eq(tasks.groupId, groupId)))
        .returning();
      return updated ? mapTask(updated) : null;
    },
    deleteTask: async (
      _parent: unknown,
      { taskId }: { taskId: string },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireModule(groupId, "tasks");
      const db = getDb();
      const [existingTask] = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, taskId), eq(tasks.groupId, groupId)))
        .limit(1);
      if (!existingTask) {
        return null;
      }
      await requireOwnerOrRole(
        user,
        groupId,
        await loadTaskOwnerIds(existingTask),
        LEADER_ROLES,
      );
      const [removed] = await db
        .delete(tasks)
        .where(and(eq(tasks.id, taskId), eq(tasks.groupId, groupId)))
        .returning();
      return removed ? mapTask(removed) : null;
    },
    addUnit: async (
      _parent: unknown,
      { unit }: { unit: { name: string } },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireModule(groupId, "tasks");
      await requireRole(user, groupId, LEADER_ROLES);
      const name = unit.name.trim();
      if (!name) {
        throw new GraphQLError("Unit name is required");
      }
      const db = getDb();
      const [duplicate] = await db
        .select({ id: units.id })
        .from(units)
        .where(and(eq(units.groupId, groupId), eq(units.name, name)))
        .limit(1);
      if (duplicate) {
        throw new GraphQLError("A unit with that name already exists");
      }
      const [created] = await db
        .insert(units)
        .values({ groupId, name })
        .returning();
      return mapUnit(created);
    },
    updateUnit: async (
      _parent: unknown,
      { unitId, unit }: { unitId: string; unit: { name?: string } },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireModule(groupId, "tasks");
      await requireRole(user, groupId, LEADER_ROLES);
      await requireGroupUnit(groupId, unitId);
      const name = unit.name?.trim();
      if (!name) {
        throw new GraphQLError("Unit name is required");
      }
      const db = getDb();
      const [duplicate] = await db
        .select({ id: units.id })
        .from(units)
        .where(
          and(eq(units.groupId, groupId), eq(units.name, name), ne(units.id, unitId)),
        )
        .limit(1);
      if (duplicate) {
        throw new GraphQLError("A unit with that name already exists");
      }
      const [updated] = await db
        .update(units)
        .set({ name, updatedAt: new Date() })
        .where(and(eq(units.id, unitId), eq(units.groupId, groupId)))
        .returning();
      return updated ? mapUnit(updated) : null;
    },
    deleteUnit: async (
      _parent: unknown,
      { unitId }: { unitId: string },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireModule(groupId, "tasks");
      await requireRole(user, groupId, LEADER_ROLES);
      const existing = await requireGroupUnit(groupId, unitId);
      const mapped = await mapUnit(existing);
      const db = getDb();
      await db
        .delete(units)
        .where(and(eq(units.id, unitId), eq(units.groupId, groupId)));
      return mapped;
    },
    setUnitMembers: async (
      _parent: unknown,
      { unitId, userIds }: { unitId: string; userIds: string[] },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireModule(groupId, "tasks");
      await requireRole(user, groupId, LEADER_ROLES);
      await requireGroupUnit(groupId, unitId);
      const uniqueIds = [...new Set(userIds.filter(Boolean))];
      await requireActiveGroupMemberIds(groupId, uniqueIds);
      const db = getDb();
      await db.delete(unitMembers).where(eq(unitMembers.unitId, unitId));
      if (uniqueIds.length > 0) {
        await db
          .insert(unitMembers)
          .values(uniqueIds.map((memberId) => ({ unitId, userId: memberId })));
      }
      const refreshed = await requireGroupUnit(groupId, unitId);
      return mapUnit(refreshed);
    },
    inviteMember: async (
      _parent: unknown,
      { member }: { member: { email: string; roleIds?: string[] } },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireRole(user, groupId, GROUP_ADMIN_ROLES);
      const db = getDb();
      const email = member.email.toLowerCase();
      const roleIds = (member.roleIds ?? []).filter(
        (id): id is string => Boolean(id),
      );

      let [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      let invitationSent = false;

      if (!existingUser) {
        const clerk = await clerkClient();
        const clerkUsers = await clerk.users.getUserList({ emailAddress: [email] });
        const matchedClerkUser = clerkUsers.data[0];

        const localPart = email.split("@")[0] || "New";
        const firstName = matchedClerkUser?.firstName?.trim() || localPart;
        const lastName = matchedClerkUser?.lastName?.trim() || "Member";

        const [created] = await db
          .insert(users)
          .values({
            email,
            externalAuthId: matchedClerkUser?.id ?? null,
            firstName,
            lastName,
            passwordHash: null,
          })
          .returning();
        existingUser = created;

        if (!matchedClerkUser) {
          try {
            await clerk.invitations.createInvitation({
              emailAddress: email,
              notify: true,
              redirectUrl: `${getAppUrl()}/sign-up`,
            });
            invitationSent = true;
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            if (!/already exists|pending invitation/i.test(message)) {
              throw error;
            }
            invitationSent = true;
          }
        }
      }

      const [membership] = await db
        .insert(memberships)
        .values({ userId: existingUser.id, groupId, status: "active" })
        .onConflictDoUpdate({
          target: [memberships.userId, memberships.groupId],
          set: { status: "active", updatedAt: new Date() },
        })
        .returning();

      if (roleIds.length > 0 && membership) {
        await db
          .insert(membershipRoles)
          .values(roleIds.map((roleId) => ({ membershipId: membership.id, roleId })))
          .onConflictDoNothing();
      }

      return {
        user: await hydrateUser(existingUser, groupId),
        invitationSent,
      };
    },
    resendInvite: async (
      _parent: unknown,
      { userId }: { userId: string },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireRole(user, groupId, GROUP_ADMIN_ROLES);
      const db = getDb();
      const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!row) {
        throw new GraphQLError("Member not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }
      if (row.externalAuthId) {
        return { user: await hydrateUser(row, groupId), invitationSent: false };
      }

      const clerk = await clerkClient();
      const pending = await clerk.invitations.getInvitationList({
        status: "pending",
        query: row.email,
        limit: 10,
      });
      const existingInvitation = pending.data.find(
        (invite) => invite.emailAddress.toLowerCase() === row.email.toLowerCase(),
      );
      if (existingInvitation) {
        await clerk.invitations.revokeInvitation(existingInvitation.id);
      }
      await clerk.invitations.createInvitation({
        emailAddress: row.email,
        notify: true,
        redirectUrl: `${getAppUrl()}/sign-up`,
      });
      return { user: await hydrateUser(row, groupId), invitationSent: true };
    },
    setMemberStatus: async (
      _parent: unknown,
      { userId, status }: { userId: string; status: string },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireRole(user, groupId, GROUP_ADMIN_ROLES);
      const db = getDb();
      await db
        .update(memberships)
        .set({ status, updatedAt: new Date() })
        .where(and(eq(memberships.userId, userId), eq(memberships.groupId, groupId)));
      const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      return row ? hydrateUser(row, groupId) : null;
    },
    removeMember: async (
      _parent: unknown,
      { userId }: { userId: string },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireRole(user, groupId, GROUP_ADMIN_ROLES);
      const db = getDb();
      const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      await db
        .delete(memberships)
        .where(and(eq(memberships.userId, userId), eq(memberships.groupId, groupId)));
      return row ? mapUser(row) : null;
    },
    updateMember: async (
      _parent: unknown,
      { userId, user: userInput }: { userId: string; user: UserInput },
      context: GraphQLContext,
    ) => {
      const current = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireOwnerOrRole(current, groupId, [userId], GROUP_ADMIN_ROLES);
      const db = getDb();
      const [updated] = await db
        .update(users)
        .set({
          firstName: userInput.firstName,
          lastName: userInput.lastName,
          preferredName: userInput.preferredName,
          scoutName: userInput.scoutName,
          scoutRego: userInput.scoutRego,
          status: userInput.status,
          gender: userInput.gender,
          dob: toDate(userInput.dob) ?? undefined,
          section: userInput.section,
          email: userInput.email?.toLowerCase(),
          phone: userInput.phone,
          taskAvailability: userInput.taskAvailabity,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();
      return updated ? hydrateUser(updated, groupId) : null;
    },
    assignMemberRole: async (
      _parent: unknown,
      { userId, roleId }: { userId: string; roleId: string },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireRole(user, groupId, GROUP_ADMIN_ROLES);
      const db = getDb();
      const [membership] = await db
        .select()
        .from(memberships)
        .where(and(eq(memberships.userId, userId), eq(memberships.groupId, groupId)))
        .limit(1);
      if (!membership) {
        return null;
      }
      await db
        .insert(membershipRoles)
        .values({ membershipId: membership.id, roleId })
        .onConflictDoNothing();
      const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      return row ? hydrateUser(row, groupId) : null;
    },
    removeMemberRole: async (
      _parent: unknown,
      { userId, roleId }: { userId: string; roleId: string },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireRole(user, groupId, GROUP_ADMIN_ROLES);
      const db = getDb();
      const [membership] = await db
        .select()
        .from(memberships)
        .where(and(eq(memberships.userId, userId), eq(memberships.groupId, groupId)))
        .limit(1);
      if (!membership) {
        return null;
      }
      await db
        .delete(membershipRoles)
        .where(
          and(
            eq(membershipRoles.membershipId, membership.id),
            eq(membershipRoles.roleId, roleId),
          ),
        );
      const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      return row ? hydrateUser(row, groupId) : null;
    },
    createGroup: async (
      _parent: unknown,
      { group }: { group: { name: string; slug: string } },
      context: GraphQLContext,
    ) => {
      requirePlatformAdmin(context.user);
      const db = getDb();
      const slug = group.slug.trim().toLowerCase().replace(/\s+/g, "-");
      try {
        const [created] = await db
          .insert(groups)
          .values({
            name: group.name.trim(),
            slug,
            status: "active",
          })
          .returning();
        return {
          _id: created.id,
          name: created.name,
          slug: created.slug,
          status: created.status,
          memberCount: 0,
        };
      } catch (error) {
        throw new GraphQLError("Could not create group (slug may already exist)", {
          extensions: { code: "BAD_USER_INPUT", cause: String(error) },
        });
      }
    },
    updateGroup: async (
      _parent: unknown,
      {
        groupId,
        group,
      }: {
        groupId: string;
        group: { name?: string; slug?: string; status?: string };
      },
      context: GraphQLContext,
    ) => {
      requirePlatformAdmin(context.user);
      const db = getDb();
      const updates: {
        name?: string;
        slug?: string;
        status?: string;
        updatedAt: Date;
      } = { updatedAt: new Date() };
      if (group.name !== undefined) {
        updates.name = group.name.trim();
      }
      if (group.slug !== undefined) {
        updates.slug = group.slug.trim().toLowerCase().replace(/\s+/g, "-");
      }
      if (group.status !== undefined) {
        updates.status = group.status;
      }
      const [updated] = await db
        .update(groups)
        .set(updates)
        .where(eq(groups.id, groupId))
        .returning();
      if (!updated) {
        throw new GraphQLError("Group not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }
      const [countRow] = await db
        .select({ memberCount: count(memberships.id) })
        .from(memberships)
        .where(
          and(eq(memberships.groupId, groupId), eq(memberships.status, "active")),
        );
      return {
        _id: updated.id,
        name: updated.name,
        slug: updated.slug,
        status: updated.status,
        memberCount: Number(countRow?.memberCount ?? 0),
      };
    },
    updateGroupModules: async (
      _parent: unknown,
      {
        modules,
      }: {
        modules: Partial<StoredEnabledModules>;
      },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      await requireRole(user, groupId, MODULE_SETTINGS_ROLES);
      const db = getDb();
      const [existing] = await db
        .select()
        .from(groups)
        .where(eq(groups.id, groupId))
        .limit(1);
      if (!existing) {
        throw new GraphQLError("Group not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }
      const nextModules = mergeModuleUpdates(existing.enabledModules, modules);
      const [updated] = await db
        .update(groups)
        .set({
          enabledModules: nextModules,
          updatedAt: new Date(),
        })
        .where(eq(groups.id, groupId))
        .returning();
      if (!updated) {
        throw new GraphQLError("Group not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }
      return mapGroup(updated);
    },
    assignUserToGroup: async (
      _parent: unknown,
      {
        userId,
        groupId,
        roleIds,
      }: { userId: string; groupId: string; roleIds?: string[] },
      context: GraphQLContext,
    ) => {
      requirePlatformAdmin(context.user);
      const db = getDb();
      const group = await findGroupById(groupId);
      if (!group) {
        throw new GraphQLError("Group not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      if (!existingUser) {
        throw new GraphQLError("User not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }
      const [membership] = await db
        .insert(memberships)
        .values({ userId, groupId, status: "active" })
        .onConflictDoUpdate({
          target: [memberships.userId, memberships.groupId],
          set: { status: "active", updatedAt: new Date() },
        })
        .returning();
      const ids = (roleIds ?? []).filter((id): id is string => Boolean(id));
      if (ids.length > 0 && membership) {
        await db
          .insert(membershipRoles)
          .values(ids.map((roleId) => ({ membershipId: membership.id, roleId })))
          .onConflictDoNothing();
      }
      return hydrateUser(existingUser, groupId);
    },
    removeUserFromGroup: async (
      _parent: unknown,
      { userId, groupId }: { userId: string; groupId: string },
      context: GraphQLContext,
    ) => {
      requirePlatformAdmin(context.user);
      const db = getDb();
      const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      await db
        .delete(memberships)
        .where(and(eq(memberships.userId, userId), eq(memberships.groupId, groupId)));
      return row ? mapUser(row) : null;
    },
  },
};
