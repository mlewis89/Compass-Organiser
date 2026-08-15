import { relations, sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

export const groups = pgTable("groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  status: text("status").notNull().default("active"),
  clerkOrgId: text("clerk_org_id"),
  ...timestamps,
}, (table) => [uniqueIndex("groups_slug_idx").on(table.slug)]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  passwordHash: text("password_hash"),
  externalAuthId: text("external_auth_id"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  preferredName: text("preferred_name"),
  scoutName: text("scout_name"),
  scoutRego: text("scout_rego"),
  status: text("status"),
  gender: text("gender"),
  dob: timestamp("dob", { withTimezone: true }),
  section: text("section"),
  phone: text("phone"),
  taskAvailability: integer("task_availability").notNull().default(5),
  ...timestamps,
}, (table) => [
  uniqueIndex("users_email_idx").on(table.email),
  uniqueIndex("users_external_auth_id_idx").on(table.externalAuthId),
]);

export const memberships = pgTable("memberships", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("active"),
  ...timestamps,
}, (table) => [
  uniqueIndex("memberships_user_group_idx").on(table.userId, table.groupId),
  index("memberships_group_idx").on(table.groupId),
]);

export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  prerequisites: text("prerequisites"),
  requiredTraining: text("required_training"),
  reportsToRoleId: uuid("reports_to_role_id"),
  isUniformed: boolean("is_uniformed").notNull().default(false),
}, (table) => [uniqueIndex("roles_name_idx").on(table.name)]);

export const membershipRoles = pgTable("membership_roles", {
  membershipId: uuid("membership_id")
    .notNull()
    .references(() => memberships.id, { onDelete: "cascade" }),
  roleId: uuid("role_id")
    .notNull()
    .references(() => roles.id, { onDelete: "cascade" }),
}, (table) => [primaryKey({ columns: [table.membershipId, table.roleId] })]);

export const skills = pgTable("skills", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  parentId: uuid("parent_id").references((): AnyPgColumn => skills.id, {
    onDelete: "set null",
  }),
  /** platform = shared defaults; group = per-group catalog */
  scope: text("scope").notNull().default("platform"),
  groupId: uuid("group_id").references(() => groups.id, { onDelete: "cascade" }),
  /** approved | pending | archived */
  status: text("status").notNull().default("approved"),
  createdByUserId: uuid("created_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
}, (table) => [
  uniqueIndex("skills_platform_name_idx")
    .on(table.name)
    .where(sql`${table.scope} = 'platform'`),
  uniqueIndex("skills_group_name_idx")
    .on(table.groupId, table.name)
    .where(sql`${table.scope} = 'group'`),
  index("skills_group_idx").on(table.groupId),
  index("skills_parent_idx").on(table.parentId),
]);

export const userSkills = pgTable("user_skills", {
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  skillId: uuid("skill_id")
    .notNull()
    .references(() => skills.id, { onDelete: "cascade" }),
}, (table) => [primaryKey({ columns: [table.userId, table.skillId] })]);

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  organiserUserId: uuid("organiser_user_id").references(() => users.id),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  isPublic: boolean("is_public").notNull().default(false),
  description: text("description"),
  location: text("location"),
  plan: text("plan"),
  riskManagement: text("risk_management"),
  status: text("status"),
  cost: real("cost"),
  ...timestamps,
}, (table) => [index("events_group_idx").on(table.groupId)]);

export const eventAttendees = pgTable("event_attendees", {
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
}, (table) => [primaryKey({ columns: [table.eventId, table.userId] })]);

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  duration: real("duration"),
  responsibleUserId: uuid("responsible_user_id").references(() => users.id),
  createdByUserId: uuid("created_by_user_id").references(() => users.id),
  priority: integer("priority"),
  ...timestamps,
}, (table) => [index("tasks_group_idx").on(table.groupId)]);

export const taskSkills = pgTable("task_skills", {
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  skillId: uuid("skill_id")
    .notNull()
    .references(() => skills.id, { onDelete: "cascade" }),
}, (table) => [primaryKey({ columns: [table.taskId, table.skillId] })]);

export const userTasks = pgTable("user_tasks", {
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
}, (table) => [primaryKey({ columns: [table.userId, table.taskId] })]);

export const boardPosts = pgTable("board_posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  title: text("title"),
  content: text("content"),
  image: text("image"),
  isPublic: boolean("is_public").notNull().default(false),
  expiryDate: timestamp("expiry_date", { withTimezone: true }),
  createdByUserId: uuid("created_by_user_id").references(() => users.id),
  priority: integer("priority"),
  ...timestamps,
}, (table) => [index("board_posts_group_idx").on(table.groupId)]);

export const families = pgTable("families", {
  id: uuid("id").defaultRandom().primaryKey(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  ...timestamps,
}, (table) => [index("families_group_idx").on(table.groupId)]);

export const familyMembers = pgTable("family_members", {
  familyId: uuid("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
}, (table) => [primaryKey({ columns: [table.familyId, table.userId] })]);

export const userGuardians = pgTable("user_guardians", {
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  guardianUserId: uuid("guardian_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
}, (table) => [primaryKey({ columns: [table.userId, table.guardianUserId] })]);

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  familyId: uuid("family_id").references(() => families.id),
  reckonId: text("reckon_id"),
  items: jsonb("items").$type<unknown[]>().notNull().default([]),
  total: real("total"),
  status: text("status"),
  ...timestamps,
}, (table) => [index("payments_group_idx").on(table.groupId)]);

export const groupsRelations = relations(groups, ({ many }) => ({
  memberships: many(memberships),
  events: many(events),
  tasks: many(tasks),
  boardPosts: many(boardPosts),
  families: many(families),
  payments: many(payments),
  skills: many(skills),
}));

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
  userSkills: many(userSkills),
  userTasks: many(userTasks),
  organisedEvents: many(events),
  createdPosts: many(boardPosts),
  familyMembers: many(familyMembers),
  guardians: many(userGuardians, { relationName: "ward" }),
  wards: many(userGuardians, { relationName: "guardian" }),
}));

export const membershipsRelations = relations(memberships, ({ one, many }) => ({
  user: one(users, { fields: [memberships.userId], references: [users.id] }),
  group: one(groups, { fields: [memberships.groupId], references: [groups.id] }),
  membershipRoles: many(membershipRoles),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  reportsTo: one(roles, {
    fields: [roles.reportsToRoleId],
    references: [roles.id],
    relationName: "roleReportsTo",
  }),
  reports: many(roles, { relationName: "roleReportsTo" }),
  membershipRoles: many(membershipRoles),
}));

export const membershipRolesRelations = relations(membershipRoles, ({ one }) => ({
  membership: one(memberships, {
    fields: [membershipRoles.membershipId],
    references: [memberships.id],
  }),
  role: one(roles, {
    fields: [membershipRoles.roleId],
    references: [roles.id],
  }),
}));

export const skillsRelations = relations(skills, ({ one, many }) => ({
  parent: one(skills, {
    fields: [skills.parentId],
    references: [skills.id],
    relationName: "skillHierarchy",
  }),
  children: many(skills, { relationName: "skillHierarchy" }),
  group: one(groups, { fields: [skills.groupId], references: [groups.id] }),
  createdBy: one(users, {
    fields: [skills.createdByUserId],
    references: [users.id],
  }),
  userSkills: many(userSkills),
  taskSkills: many(taskSkills),
}));

export const userSkillsRelations = relations(userSkills, ({ one }) => ({
  user: one(users, { fields: [userSkills.userId], references: [users.id] }),
  skill: one(skills, { fields: [userSkills.skillId], references: [skills.id] }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  group: one(groups, { fields: [events.groupId], references: [groups.id] }),
  organiser: one(users, {
    fields: [events.organiserUserId],
    references: [users.id],
  }),
  attendees: many(eventAttendees),
}));

export const eventAttendeesRelations = relations(eventAttendees, ({ one }) => ({
  event: one(events, { fields: [eventAttendees.eventId], references: [events.id] }),
  user: one(users, { fields: [eventAttendees.userId], references: [users.id] }),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  group: one(groups, { fields: [tasks.groupId], references: [groups.id] }),
  responsible: one(users, {
    fields: [tasks.responsibleUserId],
    references: [users.id],
    relationName: "taskResponsible",
  }),
  createdBy: one(users, {
    fields: [tasks.createdByUserId],
    references: [users.id],
    relationName: "taskCreatedBy",
  }),
  taskSkills: many(taskSkills),
  userTasks: many(userTasks),
}));

export const taskSkillsRelations = relations(taskSkills, ({ one }) => ({
  task: one(tasks, { fields: [taskSkills.taskId], references: [tasks.id] }),
  skill: one(skills, { fields: [taskSkills.skillId], references: [skills.id] }),
}));

export const userTasksRelations = relations(userTasks, ({ one }) => ({
  user: one(users, { fields: [userTasks.userId], references: [users.id] }),
  task: one(tasks, { fields: [userTasks.taskId], references: [tasks.id] }),
}));

export const boardPostsRelations = relations(boardPosts, ({ one }) => ({
  group: one(groups, { fields: [boardPosts.groupId], references: [groups.id] }),
  createdBy: one(users, {
    fields: [boardPosts.createdByUserId],
    references: [users.id],
  }),
}));

export const familiesRelations = relations(families, ({ one, many }) => ({
  group: one(groups, { fields: [families.groupId], references: [groups.id] }),
  members: many(familyMembers),
}));

export const familyMembersRelations = relations(familyMembers, ({ one }) => ({
  family: one(families, {
    fields: [familyMembers.familyId],
    references: [families.id],
  }),
  user: one(users, { fields: [familyMembers.userId], references: [users.id] }),
}));

export const userGuardiansRelations = relations(userGuardians, ({ one }) => ({
  user: one(users, {
    fields: [userGuardians.userId],
    references: [users.id],
    relationName: "ward",
  }),
  guardian: one(users, {
    fields: [userGuardians.guardianUserId],
    references: [users.id],
    relationName: "guardian",
  }),
}));
