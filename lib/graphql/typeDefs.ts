export const typeDefs = `#graphql
  type User {
    _id: ID!
    scoutRego: String
    displayName: String!
    firstName: String
    lastName: String
    preferredName: String
    scoutName: String
    status: String
    gender: String
    dob: String
    section: String
    Section: String
    email: String!
    phone: String
    taskAvailabity: Int
    taskAvailability: Int
    family: Family
    Family: Family
    parentGardian: [User]
    ParentGardian: [User]
    role: [Role]
    skills: [Skill]
    myTasks: [Task]
    accountStatus: String
  }

  input updateUser {
    _id: ID
    scoutRego: String
    displayName: String
    firstName: String
    lastName: String
    preferredName: String
    scoutName: String
    status: String
    gender: String
    dob: String
    section: String
    email: String
    phone: String
    taskAvailabity: Int
  }

  input addUser {
    firstName: String!
    lastName: String!
    email: String!
    password: String!
  }

  type BoardPost {
    _id: ID!
    title: String
    content: String
    image: String
    isPublic: Boolean
    expiryDate: String
    createdBy: User
    Priority: Int
    priority: Int
  }

  input updateBoardPost {
    title: String
    content: String
    image: String
    isPublic: Boolean
    expiryDate: String
    Priority: Int
    priority: Int
  }

  type Event {
    _id: ID!
    title: String!
    organisor: User
    startDate: String
    endDate: String
    isPublic: Boolean
    description: String
    location: String
    attending: [User]
    plan: String
    riskManagement: String
    status: String
    cost: Float
  }

  input updateEvent {
    title: String
    organisor: updateUser
    startDate: String
    endDate: String
    isPublic: Boolean
    description: String
    location: String
    attending: [updateUser]
    plan: String
    riskManagement: String
    status: String
    cost: Float
  }

  type Family {
    _id: ID!
    users: [User]
  }

  type Payment {
    _id: ID!
    reckonId: String
    familyId: Family
    items: [String]
    total: Int
    status: String
  }

  type Role {
    _id: ID!
    name: String
    prequistes: String
    requiredTraining: String
    RequiredTraining: String
    reportsTo: Role
    ReportsTo: Role
    isUniformed: Boolean
  }

  type Skill {
    _id: ID!
    name: String
    isActiveForUser: Boolean
    parentId: ID
    parent: Skill
    children: [Skill]
    scope: String
    groupId: ID
    status: String
    createdByUserId: ID
    taskCount: Int
    userCount: Int
  }

  input updateSkill {
    _id: ID
    name: String
    parentId: ID
    isActiveForUser: Boolean
  }

  input createSkillInput {
    name: String!
    parentId: ID
    groupId: ID
  }

  input updateSkillCatalogInput {
    name: String
    parentId: ID
    status: String
  }

  type Task {
    _id: ID!
    name: String
    Name: String
    requiredSkills: [Skill]
    dueDate: String
    duration: Float
    responsible: User
    createdBy: User
    priority: Int
    Priority: Int
    description: String
    status: String
  }

  input updateTask {
    _id: ID
    name: String
    requiredSkills: [updateSkill]
    dueDate: String
    duration: Float
    responsible: updateUser
    createdBy: updateUser
    priority: Int
    description: String
    status: String
  }

  type Auth {
    token: ID!
    user: User
  }

  type Stat {
    name: String
    value: String
  }

  type Group {
    _id: ID!
    name: String!
    slug: String!
    status: String
  }

  type Permissions {
    roles: [String]
    canManageTasks: Boolean
    canManageEvents: Boolean
    canManagePosts: Boolean
    canManageMembers: Boolean
    isPlatformAdmin: Boolean
  }

  type AdminGroup {
    _id: ID!
    name: String!
    slug: String!
    status: String
    memberCount: Int!
  }

  input createGroupInput {
    name: String!
    slug: String!
  }

  input updateGroupInput {
    name: String
    slug: String
    status: String
  }

  input addMemberInput {
    email: String!
    roleIds: [ID]
  }

  type InviteMemberResult {
    user: User!
    invitationSent: Boolean!
  }

  type Query {
    publicGroup(slug: String!): Group
    boardPosts(groupSlug: String): [BoardPost]
    events(groupSlug: String): [Event]
    singleEvent(eventId: ID!, groupSlug: String): Event
    userTasks(userId: ID): [Task]
    suggestedTasks(numberOfTasks: Int, userSkills: [updateSkill], userId: ID): [Task]
    tasks: [Task]
    singleTask(taskId: ID!): Task
    members: [User]
    singleMember(userId: ID!): User
    me: User
    pageSkills(userId: ID): [Skill]
    groupSkills(includeArchived: Boolean): [Skill]
    platformSkills(includePending: Boolean): [Skill]
    myStats(userId: ID): [Stat]
    roles: [Role]
    myPermissions: Permissions
    myGroups: [Group]
    activeGroup: Group
    adminGroups: [AdminGroup]
    orphanedUsers: [User]
    adminGroupMembers(groupId: ID!): [User]
  }

  type Mutation {
    addUser(user: addUser!): Auth
    login(email: String!, password: String!): Auth
    updateUser(user: updateUser!): User
    updateUserTime(taskAvailabity: Int!): User
    assignUserSkill(skillId: ID, userId: ID): User
    removeUserSkill(skillId: ID, userId: ID): User
    createSkill(skill: createSkillInput!): Skill
    updateSkillCatalog(skillId: ID!, skill: updateSkillCatalogInput!): Skill
    archiveSkill(skillId: ID!): Skill
    requestPromoteSkill(skillId: ID!): Skill
    approvePlatformSkill(skillId: ID!): Skill
    rejectPlatformSkill(skillId: ID!): Skill
    createPlatformSkill(skill: createSkillInput!): Skill
    assignUserTask(taskId: ID!, userId: ID): User
    removeUserFromTask(taskId: ID!, userId: ID): User
    addBoardPost(postData: updateBoardPost!): BoardPost
    updateBoardPost(postId: ID!, postData: updateBoardPost): BoardPost
    deleteBoardPost(postId: ID!): BoardPost
    addEvent(eventData: updateEvent!): Event
    updateEvent(eventId: ID!, eventData: updateEvent!): Event
    deletEvent(eventId: ID!): Event
    deleteEvent(eventId: ID!): Event
    joinEvent(eventId: ID!): Event
    leaveEvent(eventId: ID!): Event
    setEventAttendee(eventId: ID!, userId: ID!, attending: Boolean!): Event
    addTask(taskData: updateTask!): Task
    updateTask(taskId: ID!, taskData: updateTask!): Task
    deleteTask(taskId: ID!): Task
    setTaskStatus(taskId: ID!, status: String!): Task
    inviteMember(member: addMemberInput!): InviteMemberResult
    resendInvite(userId: ID!): InviteMemberResult
    setMemberStatus(userId: ID!, status: String!): User
    removeMember(userId: ID!): User
    updateMember(userId: ID!, user: updateUser!): User
    assignMemberRole(userId: ID!, roleId: ID!): User
    removeMemberRole(userId: ID!, roleId: ID!): User
    createGroup(group: createGroupInput!): AdminGroup
    updateGroup(groupId: ID!, group: updateGroupInput!): AdminGroup
    assignUserToGroup(userId: ID!, groupId: ID!, roleIds: [ID]): User
    removeUserFromGroup(userId: ID!, groupId: ID!): User
  }
`;
