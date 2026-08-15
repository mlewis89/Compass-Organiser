import { and, desc, eq, inArray, sql } from "drizzle-orm";
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
  findGroupBySlug,
  hasActiveMembership,
  requireMembership,
} from "@/lib/tenancy";
import {
  GROUP_ADMIN_ROLES,
  LEADER_ROLES,
  getMemberRoles,
  hasAnyRole,
  requireOwnerOrRole,
  requireRole,
} from "@/lib/authz";
import {
  boardPosts,
  eventAttendees,
  events,
  families,
  familyMembers,
  membershipRoles,
  memberships,
  roles,
  skills,
  taskSkills,
  tasks,
  userGuardians,
  userSkills,
  userTasks,
  users,
} from "@/db/schema";
import { dateString, mapUser, toDate, type UserRow } from "@/lib/graphql/mappers";
import type { GraphQLContext } from "@/lib/graphql/context";

type SkillInput = { _id?: string; name?: string };
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
  responsible?: UserInput;
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
  return rows.map(({ skill }) => ({ ...skill, _id: skill.id }));
}

async function mapTask(task: typeof tasks.$inferSelect) {
  return {
    ...task,
    _id: task.id,
    Name: task.name,
    Priority: task.priority,
    dueDate: dateString(task.dueDate),
    requiredSkills: await loadSkillsForTask(task.id),
    responsible: await loadUserById(task.responsibleUserId),
    createdBy: await loadUserById(task.createdByUserId),
  };
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

  const assigned = await db
    .select({ task: tasks })
    .from(userTasks)
    .innerJoin(tasks, eq(userTasks.taskId, tasks.id))
    .where(eq(userTasks.userId, user.id));

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
    skills: skillRows.map(({ skill }) => ({ ...skill, _id: skill.id })),
    myTasks: await Promise.all(assigned.map(({ task }) => mapTask(task))),
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
  Event: {
    _id: (parent: { id?: string; _id?: string }) => parent._id ?? parent.id,
  },
  Query: {
    publicGroup: async (_parent: unknown, { slug }: { slug: string }) => {
      const group = await findGroupBySlug(slug);
      if (!group) {
        return null;
      }
      return {
        _id: group.id,
        name: group.name,
        slug: group.slug,
        status: group.status,
      };
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
      requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      const db = getDb();
      const rows = await db
        .select()
        .from(tasks)
        .where(eq(tasks.groupId, groupId))
        .orderBy(desc(tasks.priority));
      return Promise.all(rows.map(mapTask));
    },
    userTasks: async (
      _parent: unknown,
      { userId }: { userId?: string },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const targetId = userId || user._id;
      const db = getDb();
      const rows = await db
        .select({ task: tasks })
        .from(userTasks)
        .innerJoin(tasks, eq(userTasks.taskId, tasks.id))
        .where(eq(userTasks.userId, targetId));
      return Promise.all(rows.map(({ task }) => mapTask(task)));
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
      const db = getDb();
      const targetId = args.userId || user._id;

      let skillIds = (args.userSkills ?? [])
        .map((skill) => skill._id)
        .filter((id): id is string => Boolean(id));
      let limit = args.numberOfTasks;

      if (skillIds.length === 0 || !limit) {
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
        if (!limit) {
          limit = profile.taskAvailability;
        }
      }

      if (!limit || limit <= 0 || skillIds.length === 0) {
        return [];
      }

      const matching = await db
        .select({ task: tasks })
        .from(taskSkills)
        .innerJoin(tasks, eq(taskSkills.taskId, tasks.id))
        .where(
          and(eq(tasks.groupId, groupId), inArray(taskSkills.skillId, skillIds)),
        );

      const unique = new Map(matching.map(({ task }) => [task.id, task]));
      const sorted = [...unique.values()]
        .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
        .slice(0, limit);

      return Promise.all(sorted.map(mapTask));
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
      const targetId = userId || user._id;
      const db = getDb();
      const allSkills = await db.select().from(skills).orderBy(skills.name);
      const owned = await db
        .select({ skillId: userSkills.skillId })
        .from(userSkills)
        .where(eq(userSkills.userId, targetId));
      const ownedSet = new Set(owned.map((row) => row.skillId));
      return allSkills.map((skill) => ({
        ...skill,
        _id: skill.id,
        isActiveForUser: ownedSet.has(skill.id),
      }));
    },
    myStats: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      requireUser(context.user);
      const groupId = requireGroup(context.groupId);
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
      requireUser(context.user);
      const groupId = requireGroup(context.groupId);
      const db = getDb();
      const [row] = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, taskId), eq(tasks.groupId, groupId)))
        .limit(1);
      return row ? mapTask(row) : null;
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
      const groupId = requireGroup(context.groupId);
      const userRoles = await getMemberRoles(user._id, groupId, user.email);
      return {
        roles: userRoles,
        canManageTasks: hasAnyRole(userRoles, LEADER_ROLES),
        canManageEvents: hasAnyRole(userRoles, LEADER_ROLES),
        canManagePosts: hasAnyRole(userRoles, LEADER_ROLES),
        canManageMembers: hasAnyRole(userRoles, GROUP_ADMIN_ROLES),
      };
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
      if (!skillId) {
        return null;
      }
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
    assignUserTask: async (
      _parent: unknown,
      { taskId, userId }: { taskId: string; userId?: string },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const targetId = userId || user._id;
      if (targetId !== user._id) {
        await requireRole(user, context.groupId, LEADER_ROLES);
      }
      const db = getDb();
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
      await requireRole(user, groupId, LEADER_ROLES);
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
          responsibleUserId: taskData.responsible?._id,
        })
        .returning();

      const skillIds = (taskData.requiredSkills ?? [])
        .map((skill) => skill._id)
        .filter((id): id is string => Boolean(id));
      if (skillIds.length > 0) {
        await db.insert(taskSkills).values(
          skillIds.map((skillId) => ({ taskId: created.id, skillId })),
        );
      }
      return mapTask(created);
    },
    updateTask: async (
      _parent: unknown,
      { taskId, taskData }: { taskId: string; taskData: TaskInput },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
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
        [existingTask.createdByUserId, existingTask.responsibleUserId],
        LEADER_ROLES,
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
          responsibleUserId: taskData.responsible?._id,
          updatedAt: new Date(),
        })
        .where(and(eq(tasks.id, taskId), eq(tasks.groupId, groupId)))
        .returning();
      if (!updated) {
        return null;
      }
      if (taskData.requiredSkills) {
        const skillIds = taskData.requiredSkills
          .map((skill) => skill._id)
          .filter((id): id is string => Boolean(id));
        await db.delete(taskSkills).where(eq(taskSkills.taskId, taskId));
        if (skillIds.length > 0) {
          await db
            .insert(taskSkills)
            .values(skillIds.map((skillId) => ({ taskId, skillId })));
        }
      }
      return mapTask(updated);
    },
    setTaskStatus: async (
      _parent: unknown,
      { taskId, status }: { taskId: string; status: string },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context.user);
      const groupId = requireGroup(context.groupId);
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
        [existingTask.createdByUserId, existingTask.responsibleUserId],
        LEADER_ROLES,
      );
      const [updated] = await db
        .update(tasks)
        .set({ status, updatedAt: new Date() })
        .where(eq(tasks.id, taskId))
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
        [existingTask.createdByUserId, existingTask.responsibleUserId],
        LEADER_ROLES,
      );
      const [removed] = await db
        .delete(tasks)
        .where(and(eq(tasks.id, taskId), eq(tasks.groupId, groupId)))
        .returning();
      return removed ? mapTask(removed) : null;
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
  },
};
