import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "../lib/db";
import {
  boardPosts,
  events,
  groups,
  membershipRoles,
  memberships,
  roles,
  skills,
  taskSkills,
  tasks,
  userSkills,
  users,
} from "../db/schema";

const skillNames = [
  "Web Development",
  "Power Tools",
  "Towing a trailer",
  "Data entry",
  "Admin",
  "Accounting",
  "Communication",
  "English",
  "General Help",
  "Trades",
  "3D Modeling/Printing",
  "Wood working",
  "Graphics Design",
  "Chainsawing",
  "Splitting wood",
];

const roleSeed = [
  { name: "Youth", reportsTo: "UnitLeader", isUniformed: true },
  { name: "UnitLeader", reportsTo: "Leader", isUniformed: true },
  { name: "GroupRosteredParent", reportsTo: "Leader", isUniformed: true },
  { name: "AdultHelper", reportsTo: "Leader", isUniformed: false },
  { name: "AssistantLeader", reportsTo: "Leader", isUniformed: true },
  { name: "Leader", reportsTo: "GroupLeader", isUniformed: true },
  { name: "AssistGroupLeader", reportsTo: "GroupLeader", isUniformed: true },
  { name: "Secretary", reportsTo: "GroupLeader", isUniformed: false },
  { name: "Treasurer", reportsTo: "GroupLeader", isUniformed: false },
  { name: "Quartermaster", reportsTo: "GroupLeader", isUniformed: true },
  { name: "GroupLeader", reportsTo: null, isUniformed: true },
];

async function main() {
  const db = getDb();
  const slug = process.env.DEFAULT_GROUP_SLUG || "default";
  const passwordHash = await bcrypt.hash("password", 10);

  const [group] = await db
    .insert(groups)
    .values({
      name: "Default Scout Group",
      slug,
      status: "active",
    })
    .onConflictDoNothing()
    .returning();

  const existingGroup =
    group ??
    (
      await db.select().from(groups).where(eq(groups.slug, slug)).limit(1)
    )[0];

  if (!existingGroup) {
    throw new Error("Could not create or load the default group");
  }

  const insertedSkills = await db
    .insert(skills)
    .values(skillNames.map((name) => ({ name })))
    .onConflictDoNothing()
    .returning();
  const allSkills =
    insertedSkills.length > 0 ? insertedSkills : await db.select().from(skills);
  const skillByName = new Map(allSkills.map((skill) => [skill.name, skill]));

  const insertedRoles = await db
    .insert(roles)
    .values(
      roleSeed.map((role) => ({
        name: role.name,
        isUniformed: role.isUniformed,
      })),
    )
    .onConflictDoNothing()
    .returning();
  const allRoles = insertedRoles.length > 0 ? insertedRoles : await db.select().from(roles);
  const roleByName = new Map(allRoles.map((role) => [role.name, role]));

  for (const role of roleSeed) {
    const current = roleByName.get(role.name);
    const reportsTo = role.reportsTo ? roleByName.get(role.reportsTo) : null;
    if (current && reportsTo) {
      await db
        .update(roles)
        .set({ reportsToRoleId: reportsTo.id })
        .where(eq(roles.id, current.id));
    }
  }

  const seedUsers = [
    {
      firstName: "Alex",
      lastName: "Leader",
      email: "alex.leader@example.com",
      section: "LEADERS",
      role: "GroupLeader",
      skills: ["Admin", "Communication"],
    },
    {
      firstName: "Sam",
      lastName: "Treasurer",
      email: "sam.treasurer@example.com",
      section: "LEADERS",
      role: "Treasurer",
      skills: ["Accounting", "Admin"],
    },
    {
      firstName: "Jordan",
      lastName: "Scout",
      email: "jordan.youth@example.com",
      section: "SCOUTS",
      role: "Youth",
      skills: ["General Help", "Wood working"],
    },
    {
      firstName: "Casey",
      lastName: "Parent",
      email: "casey.parent@example.com",
      section: "CUBS",
      role: "GroupRosteredParent",
      skills: ["Towing a trailer", "Admin"],
    },
    {
      firstName: "Riley",
      lastName: "Helper",
      email: "riley.helper@example.com",
      section: "CUBS",
      role: "AdultHelper",
      skills: ["Trades", "Power Tools"],
    },
    {
      firstName: "Morgan",
      lastName: "Joey",
      email: "morgan.joey@example.com",
      section: "JOEYS",
      role: "Youth",
      skills: ["General Help"],
    },
    {
      firstName: "Taylor",
      lastName: "Venturer",
      email: "taylor.venturer@example.com",
      section: "VENT",
      role: "Youth",
      skills: ["Web Development", "Graphics Design"],
    },
    {
      firstName: "Quinn",
      lastName: "Rover",
      email: "quinn.rover@example.com",
      section: "ROVER",
      role: "Youth",
      skills: ["Chainsawing", "Splitting wood"],
    },
  ];

  const createdUsers = [];
  for (const seedUser of seedUsers) {
    const [created] = await db
      .insert(users)
      .values({
        firstName: seedUser.firstName,
        lastName: seedUser.lastName,
        email: seedUser.email,
        passwordHash,
        section: seedUser.section,
        status: "active",
        taskAvailability: 5,
      })
      .onConflictDoNothing()
      .returning();

    const userRow =
      created ??
      (
        await db
          .select()
          .from(users)
          .where(eq(users.email, seedUser.email))
          .limit(1)
      )[0];

    createdUsers.push(userRow);

    const [membership] = await db
      .insert(memberships)
      .values({
        userId: userRow.id,
        groupId: existingGroup.id,
        status: "active",
      })
      .onConflictDoNothing()
      .returning();

    const membershipRow =
      membership ??
      (
        await db
          .select()
          .from(memberships)
          .where(eq(memberships.userId, userRow.id))
          .limit(1)
      )[0];

    const role = roleByName.get(seedUser.role);
    if (role && membershipRow) {
      await db
        .insert(membershipRoles)
        .values({ membershipId: membershipRow.id, roleId: role.id })
        .onConflictDoNothing();
    }

    const skillRows = seedUser.skills
      .map((name) => skillByName.get(name))
      .filter((skill): skill is NonNullable<typeof skill> => Boolean(skill));
    if (skillRows.length > 0) {
      await db
        .insert(userSkills)
        .values(skillRows.map((skill) => ({ userId: userRow.id, skillId: skill.id })))
        .onConflictDoNothing();
    }
  }

  const organiser = createdUsers[0];

  const taskSeed = [
    { name: "pack trailer", skill: "Towing a trailer", description: "pack trailer for camp", status: "inProgress", duration: 2, priority: 8 },
    { name: "build website", skill: "Web Development", description: "build a MERN stack application", status: "inProgress", duration: 20, priority: 3 },
    { name: "clean bbq after camp", skill: "General Help", description: "deep clean and reseason", status: "toDo", duration: 2, priority: 7 },
    { name: "fix camp lights", skill: "Trades", description: "diagnose and fix", status: "inProgress", duration: 2, priority: 5 },
    { name: "Plumbing at hall", skill: "Trades", description: "new tap in male bathroom", status: "toDo", duration: 2, priority: 7 },
    { name: "Organise Social event", skill: "Admin", description: "choose date", status: "toDo", duration: 10, priority: 5 },
    { name: "Transport for scout hike", skill: "Admin", description: "email parents", status: "toDo", duration: 2, priority: 6 },
    { name: "restock first aid kits", skill: "Admin", description: "purchase and replace items", status: "complete", duration: 5, priority: 6 },
    { name: "Paint hall", skill: "Trades", description: "inside and outside hall", status: "inProgress", duration: 10, priority: 2 },
  ];

  for (const task of taskSeed) {
    const [created] = await db
      .insert(tasks)
      .values({
        groupId: existingGroup.id,
        name: task.name,
        description: task.description,
        status: task.status,
        duration: task.duration,
        priority: task.priority,
        createdByUserId: organiser.id,
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
      })
      .returning();
    const skill = skillByName.get(task.skill);
    if (created && skill) {
      await db
        .insert(taskSkills)
        .values({ taskId: created.id, skillId: skill.id })
        .onConflictDoNothing();
    }
  }

  await db.insert(events).values([
    {
      groupId: existingGroup.id,
      title: "Scout Hike",
      organiserUserId: organiser.id,
      startDate: new Date("2026-05-24T17:00:00.000Z"),
      endDate: new Date("2026-05-26T18:00:00.000Z"),
      isPublic: false,
      description: "A competition hike",
      location: "Tallarook State Park",
      plan: "Leave Friday night, hike for the weekend, come home exhausted",
      riskManagement: "See event risk management",
      status: "Planned",
      cost: 200,
    },
    {
      groupId: existingGroup.id,
      title: "Bunnings BBQ",
      organiserUserId: organiser.id,
      startDate: new Date("2026-08-25T09:00:00.000Z"),
      endDate: new Date("2026-08-25T15:00:00.000Z"),
      isPublic: true,
      description: "Come support us and buy a sausage",
      location: "Springvale Bunnings",
      status: "Planned",
    },
    {
      groupId: existingGroup.id,
      title: "Star Wars group camp",
      organiserUserId: organiser.id,
      startDate: new Date("2026-05-03T17:00:00.000Z"),
      endDate: new Date("2026-05-05T18:00:00.000Z"),
      isPublic: false,
      description: "A family-friendly camp packed with activities and food",
      location: "Bay Park Scout Camp",
      plan: "Arrive when you can on Friday, food and camping gear provided",
      status: "toReview",
      cost: 200,
    },
    {
      groupId: existingGroup.id,
      title: "Group end of year break up",
      organiserUserId: organiser.id,
      startDate: new Date("2026-12-01T09:00:00.000Z"),
      endDate: new Date("2026-12-01T18:00:00.000Z"),
      isPublic: true,
      description: "A family-friendly event as a group",
      location: "TBA",
      plan: "TBA",
      status: "inProgress",
      cost: 200,
    },
  ]);

  await db.insert(boardPosts).values([
    {
      groupId: existingGroup.id,
      title: "Group Camp",
      content: "Please come along to our camp next weekend, see Alex for details",
      isPublic: false,
      priority: 5,
      createdByUserId: organiser.id,
    },
    {
      groupId: existingGroup.id,
      title: "Group Fees",
      content: "Group fees due soon, please contact the treasurer for information",
      isPublic: false,
      priority: 6,
      createdByUserId: organiser.id,
    },
    {
      groupId: existingGroup.id,
      title: "Bunnings BBQ 25 Aug",
      content: "We'll be selling sausages at Bunnings Springvale on Saturday 25 August.",
      isPublic: true,
      priority: 6,
      createdByUserId: organiser.id,
    },
    {
      groupId: existingGroup.id,
      title: "Container Deposit Scheme",
      content: "Bring your containers to the hall to help support our group.",
      isPublic: true,
      priority: 5,
      createdByUserId: organiser.id,
    },
    {
      groupId: existingGroup.id,
      title: "Help Needed - trailer pack",
      content: "Looking for a few people to help pack the trailer this weekend.",
      isPublic: false,
      priority: 10,
      createdByUserId: organiser.id,
    },
  ]);

  console.log("Seed complete.");
  console.log("Default login: alex.leader@example.com / password");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
