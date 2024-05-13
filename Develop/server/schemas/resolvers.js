//include models
const {User, BoardPost, Event, Family, Payment, Role, Skill, Task} = require('../models');
//const {signToken, AuthencationError} = require('../utils/auth');

const resolvers = {
    Query : {
        publicBoardPosts: async () => {
            return await BoardPost.find({isPublic : true})
        },
        BoardPosts: async () => {
            return await BoardPost.find()
        },
        publicEvents: async () => {
            return await Event.find({isPublic : true})
        },
        Events: async () => {
            return await Event.find()
        },
    },
    Mutation: {
        addUser: async () => {
          const user = await User.create(args);
          return user;
          /*const token = signToken(user);
    
          return { token, user };*/
        },
    },
}

module.exports = resolvers;