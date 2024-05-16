const typeDefs = `
    type User {
        _id: ID!
        scoutRego: String,
        displayName: String!
        firstName: String,
        lastName: String,
        preferredName: String,
        scoutName: String,
        status: String,
        gender: String,
        dob: String,
        section: String,
        email: String!,
        phone: String,
        taskAvailabity: Int,
        family: Family,
        parentGardian: [User],
        role: [Role],
        skills : [Skill],
        myTasks : [Task]    
    }
    input updateUser {
        _id: ID!
        scoutRego: String,
        displayName: String,
        firstName: String,
        lastName: String,
        preferredName: String,
        scoutName: String,
        status: String,
        gender: String,
        dob: String,
        section: String,
        email: String,
        phone: String,
        taskAvailabity: Int
    }

    input addUser {
        firstName: String!
        lastName: String!
        email: String!,
        password: String!    
    }

    type BoardPost{
        _id: ID!
        title: String,
        content: String,
        image: String,
        isPublic: Boolean,
        expiryDate:  String,
        createdBy: User,
        Priority: Int,
    }

    type Event {
        _id: ID!
        title: String!,
        organisor: User,
        startDate:  String,
        endDate: String,
        isPublic: Boolean,
        description: String,
        location: String,
        attending: [User],
        plan: String,
        riskManagement: String,
        status: String,
        cost: Float
    }

    type Family {
        _id: ID!
        users: [User],
    }

    type Payment {
        _id: ID!
        reckonId: String,
        familyId: Family,
        items: [String],
        total: Int,
        status: String,
    }

    type Role {
        _id: ID!
        name: String,
        prequistes: String,
        requiredTraining: String,
        reportsTo : Role,
        isUniformed : Boolean,
    }
    type Skill {
        _id: ID!
        name: String!,
        isActiveForUser: Boolean,
    }

    type Task {
        _id: ID!
        name: String,
        requiredSkills: [Skill],
        dueDate: String,
        duration : Int,
        responsible: User,
        createdBy: User,
        priority: Int,
        description: String,
        status: String
    }

    type Auth {
        token: ID!,
        user: User
    }

    type Stat {
        name: String,
        value: String
    }

    type Query {
        boardPosts: [BoardPost],
        events: [Event],
        singleEvent(eventID :ID!) : Event,
        userTasks(UserID: ID): [Task],
        suggestedTasks(userId:ID): [Task],
        tasks: [Task],
        members: [User],
        me: User,
        pageSkills(userId: ID): [Skill]
        myStats(userId: ID): [Stat]
    }

    type Mutation {
        addUser(user: addUser!): Auth
        login(email: String!, password: String!): Auth
        updateUser(user: updateUser!): User
        updateUserTime(taskAvailabity: Int!): User
        addRemovedUserSkill(type: String!, skillId: ID,userId: ID): User
        addUserTask(taskId: ID!, userId: ID ): User
    }
`;

module.exports = typeDefs;
