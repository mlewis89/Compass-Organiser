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
    suggestedTasks: async (parent, { userId }, { user }) => {
      let _id = userId || user._id;
      let userData = await User.findById(_id)
        .populate("skills")
        .populate("myTasks");
      let userSkills = userData.skills;
      let userSkillsIDs = userSkills.map((skillobj) => skillobj._id);
      let numberOfTasks = userData.taskAvailabity;

      console.log(userSkillsIDs);

      let tasks = await Task.find({
        requiredSkills: { $in: [...userSkillsIDs] },
      })
        .populate("responsible")
        .populate("createdBy")
        .populate("requiredSkills")
        .sort({ dueDate: -1, priority: -1 })
        .limit(numberOfTasks);

      console.log("tasks", tasks);
      return tasks;
    },
    members: async () => {
      return await User.find().sort({ section: 1, displayName: 1 });
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
    pageSkills: async (parent, { userId }, { user }) => {
      console.log(user);
      let _id = userId || user._id;
      let skills = await Skill.find().sort({ name: 1 });
      console.log(skills);
      let userData = await User.findById(_id).populate("skills");
      console.log(userData);
      for (let i = 0; i < userData.skills.length; i++) {
        //find skill in main list
        let index = skills.findIndex((x) => {
          return x._id.equals(userData.skills[i]._id);
        });
        if (index >= 0) {
          skills[index].isActiveForUser = true; //add bollean value that it relates to the current user
        }
      }
      skills.forEach((s) => {
        if (!s.isActiveForUser) {
          s.isActiveForUser = false;
        }
      }); //set default value to false.
      return skills;
    },
    myStats: async (parent, { userId }, { user }) => {
      let _id = userId || user._id;
      let stats = [
        { name: "Joeys", value: await User.count({ section: "JOEYS" }) },
        { name: "Cubs", value: await User.count({ section: "CUBS" }) },
        { name: "Scouts", value: await User.count({ section: "SCOUTS" }) },
        { name: "Venturers", value: await User.count({ section: "VENT" }) },
        { name: "Rovers", value: await User.count({ section: "ROVER" }) },
      ];
      console.log(stats); //set default value to false.
      return stats;
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
      let _id = args.user._id || context.user._id;

      let user = await User.findByIdAndUpdate(_id, { ...args.user });

      return user;
    },
    updateUserTime: async (parent, args, context) => {
      let _id = context.user._id;
      let user = await User.findByIdAndUpdate(_id, {
        taskAvailabity: args.taskAvailabity,
      });
      return user;
    },
    addRemovedUserSkill: async (parent, { type, skillId, userId }, context) => {
      let _id = userId || context.user._id;

      switch (type) {
        case "ADD": {
          let user = await User.findByIdAndUpdate(_id, {
            $addToSet: { skills: skillId },
          }).populate("skills");
          return user;
        }
        case "REMOVE": {
          let user = await User.findByIdAndUpdate(_id, {
            $pull: { skills: skillId },
          }).populate("skills");
          return user;
        }
      }
    },
    addUserTask: async (parent, { taskId, userId }, { user }) => {
      let _id = userId || user._id;

      let userData = await User.findByIdAndUpdate(_id, {
        $addToSet: { myTasks: taskId },
      })
        .populate("myTasks")
        .populate("skills");
      return userData;
    },
  },
};

module.exports = resolvers;
