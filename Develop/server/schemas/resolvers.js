//include models
const {
  User,
  BoardPost,
  Event,
  Family,
  Payment,
  Role,
  Skill,
  Task,
} = require("../models");
const { signToken, AuthencationError } = require("../utils/auth");

const resolvers = {
  Query: {
    boardPosts: async (parent, args, { user }) => {
      if (user) {
        return await BoardPost.find().populate("createdBy");
      } else {
        return await BoardPost.find({ isPublic: true }).populate("createdBy");
      }
    },
    events: async (parent, args, { user }) => {
      if (user) {
        return await Event.find().populate("organisor").populate("attending");
      } else {
        return await Event.find({ isPublic: true })
          .populate("organisor")
          .populate("attending");
      }
    },
    singleEvent: async (parent, { _Id }, { user }) => {
      if (user) {
        return await Event.findById(_id)
          .populate("organisor")
          .populate("attending");
      } else {
        return await Event.findById(_Id, { isPublic: true })
          .populate("organisor")
          .populate("attending");
      }
    },
    members: async () => {
      return await User.find();
    },
  },
  Mutation: {
    addUser: async (parent, { user }) => {
      const newUser = await User.create(user);

      if (!newUser) {
        throw AuthenticationError;
      }
      const token = signToken(newUser);

      return { token: token, user: newUser };
    },
  },
};

module.exports = resolvers;
