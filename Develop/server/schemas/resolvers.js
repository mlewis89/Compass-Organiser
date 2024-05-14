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
        return await Event.find({ isPublic: true });
      }
    },
    singleEvent: async (parent, { _Id }, { user }) => {
      if (user) {
        return await Event.findById(_id)
          .populate("organisor")
          .populate("attending");
      } else {
        return await Event.findById(_Id, { isPublic: true });
      }
    },
    tasks: async (parent, args, { user }) => {
      if (user) {
        return await Task.find()
          .populate("responsible")
          .populate("createdBy")
          .populate("requiredSkills");
      } else {
        return;
      }
    },
    members: async () => {
      return await User.find();
    },
    me: async (parent, args, { user }) => {
      console.log(user);
      if (user) {
        return await User.findById(user._id)
          .populate("skills")
          .populate("myTasks")
          .populate("role")
          .populate("parentGardian")
          .populate("family");
      } else {
        return;
      }
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

    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw AuthenticationError;
      }

      const CorrectPw = await user.isCorrectPassword(password);
      if (!CorrectPw) {
        throw AuthenticationError;
      }
      const token = signToken(user);
      return { token, user };
    },
    updateUser: async (parent, args, context) => {
      const _id = args.user._id || context.user._id;

      const user = await User.findByIdAndUpdate(_id, { ...args.user });

      return user;
    },
    updateUserTime: async (parent, args, context) => {
      const _id = context.user._id;
      const user = await User.findByIdAndUpdate(_id, {
        taskAvailabity: args.taskAvailabity,
      });
      return user;
    },
  },
};

module.exports = resolvers;
