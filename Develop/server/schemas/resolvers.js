//include models
const {User} = require('../models');
//const {signToken, AuthencationError} = require('../utils/auth');

const resolvers = {
    Query : {
        users: async () => {
            return await User.find();
        },
    },
    Mutation: {
        addUser: async (parent, args) => {
          const user = await User.create(args);
          return user;
          /*const token = signToken(user);
    
          return { token, user };*/
        },
    },
}

module.exports = resolvers;