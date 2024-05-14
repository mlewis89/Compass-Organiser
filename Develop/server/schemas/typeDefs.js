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
        Section: String,
        email: String!,
        phone: String,
        taskAvailabity: Int,
        Family: Family,
        ParentGardian: [User],
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
        Section: String,
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
        FamilyId: Family,
        Items: [String],
        total: Int,
        Status: String,
    }

    type Role {
        _id: ID!
        name: String,
        prequistes: String,
        RequiredTraining: String,
        ReportsTo : Role,
        isUniformed : Boolean,
    }
    type Skill {
        _id: ID!
        name: String!,
    }

    type Task {
        _id: ID!
        name: String,
        requiredSkills: [Skill],
        dueDate: String,
        duration : Int,
        responsible: [User],
        createdBy: User,
        priority: Int,
        description: String,
        status: String
    }

    type Auth {
        token: ID!
        user: User
    }

    type Query {
        boardPosts: [BoardPost],
        events: [Event],
        singleEvent(eventID :ID!) : Event,
        userTasks(UserID: ID): [Task],
        suggestedTasks(UserID:ID): [Task],
        tasks: [Task],
        members: [User],
        me: User
    }

    type Mutation {
        addUser(user: addUser!): Auth
        login(email: String!, password: String!): Auth
        updateUser(user: updateUser!): User
        updateUserTime(taskAvailabity: Int!): User
    }
`;

module.exports = typeDefs;
