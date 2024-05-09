const typeDefs = `
    type User {
        firstName: String
    }

    type Query {
        users: [User]
    }

    type Mutation {
        addUser(firstName: String!): User
    
    }
`;

module.exports = typeDefs;