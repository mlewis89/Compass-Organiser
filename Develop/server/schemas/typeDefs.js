const typeDefs = `
    type User {
        _id: ID!
        scoutRego: String,
        firstName: String!
        lastName: String!
        preferredName: String,
        status: String,
        gender: String,
        dob: String,
        Section: String,
        email: String!,
        phone: String!,
        taskAvailabity: Int,
        Family: Family,
        ParentGardian: [User],
        role: [Role],
        skills : [Skill],
        myTasks : [Task]    
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
        Title: String!,
        PrimaryOrangisor: User,
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
        Name: String,
        requiredSkills: [Skill],
        dueDate: String,
        duration : Int,
        responsible: [User],
        createdBy: User,
        Priority: Int
    }

    type Query {
        users: [User],
        tasks: [Task],
        skills: [Skill],
        roles: [Role],
        payments: [Payment],
        families: [Family],
        events: [Event],
        boardPost: [BoardPost]

    }

    type Mutation {
        addUser(firstName: String!): User
    
    }
`;

module.exports = typeDefs;
