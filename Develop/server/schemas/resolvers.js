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
      console.log("query-boardPosts");
      if (user) {
        return await BoardPost.find().populate("createdBy");
      } else {
        return await BoardPost.find({ isPublic: true }).populate("createdBy");
      }
    },
    events: async (parent, args, { user }) => {
      console.log("query-events");
      if (user) {
        return await Event.find().populate("organisor").populate("attending");
      } else {
        return await Event.find({ isPublic: true }).populate("organisor");
      }
    },
    singleEvent: async (parent, { eventId }, { user }) => {
      console.log("query-singleEvent");
      if (user) {
        return await Event.findById(eventId)
          .populate("organisor")
          .populate("attending");
      } else {
        return await Event.findById(eventId, { isPublic: true });
      }
    },
    tasks: async (parent, args, { user }) => {
      console.log("query-tasks");
      if (user) {
        return await Task.find()
          .populate("responsible")
          .populate("createdBy")
          .populate("requiredSkills");
      } else {
        return;
      }
    },
    suggestedTasks: async (
      parent,
      { userId, numberOfTasks, userSkills },
      { user }
    ) => {
      console.log("query-suggestedTasks");
      console.log(numberOfTasks, userSkills);
      let _id = userId || user._id;
      let userData;
      if (!userSkills || !numberOfTasks) {
        userData = await User.findById(_id)
          .populate("skills")
          .populate("myTasks");
      }
      if (!userSkills) {
        let userSkills = userData.skills;
      }
      let userSkillsIDs = userSkills.map((skillobj) => skillobj._id);

      if (!numberOfTasks) {
        let numberOfTasks = userData.taskAvailabity;
      }
      if (numberOfTasks > 0) {
        let tasks = await Task.find({
          requiredSkills: { $in: [...userSkillsIDs] },
        })
          .populate("responsible")
          .populate("createdBy")
          .populate("requiredSkills")
          .sort({ dueDate: -1, priority: -1 })
          .limit(numberOfTasks);
        return tasks;
      }
      return;
    },
    members: async () => {
      console.log("query-memebers");
      return await User.find().sort({ section: 1, displayName: 1 });
    },
    me: async (parent, args, { user }) => {
      console.log("query-me");
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
      console.log("query-pageSkills");
      let _id = userId || user._id;
      let skills = await Skill.find().sort({ name: 1 });
      let userData = await User.findById(_id).populate("skills");
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
      console.log("query-myStats");
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
    singleTask: async (parent, { taskId }, { user }) => {
      return await Task.findById(taskId)
        .populate("responsible")
        .populate("createdBy")
        .populate("requiredSkills");
    },
  },
  Mutation: {
    addUser: async (parent, { user }) => {
      console.log("mutation-addUser");
      const newUser = await User.create(user);

      if (!newUser) {
        throw AuthenticationError;
      }
      const token = signToken(newUser);

      return { token: token, user: newUser };
    },

    login: async (parent, { email, password }) => {
      console.log("mutation-login");
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
    updateUser: async (parent, args, { user }) => {
      console.log("mutation-updateUser");
      if (user) {
        let _id = args.user._id || user._id;

        return await User.findByIdAndUpdate(_id, { ...args.user });
      }
    },
    updateUserTime: async (parent, args, { user }) => {
      console.log("mutation-updateUserTime");
      let _id = user._id;
      return await User.findByIdAndUpdate(_id, {
        taskAvailabity: args.taskAvailabity,
      });
    },
    assignUserSkill: async (parent, { skillId, userId }, { user }) => {
      console.log("mutation-assignUserSkill");
      if (user) {
        let _id = userId || user._id;

        let userData = await User.findByIdAndUpdate(_id, {
          $addToSet: { skills: skillId },
        }).populate("skills");
        return userData;
      }
    },
    removeUserSkill: async (parent, { skillId, userId }, { user }) => {
      if (user) {
        let _id = userId || user._id;

        return await User.findByIdAndUpdate(_id, {
          $pull: { skills: skillId },
        }).populate("skills");
      }
    },
    assignUserTask: async (parent, { taskId, userId }, { user }) => {
      if (user) {
        let _id = userId || user._id;

        return await User.findByIdAndUpdate(_id, {
          $addToSet: { myTasks: taskId },
        })
          .populate("myTasks")
          .populate("skills");
      }
    },
    removeUserFromTask: async (parent, { taskId, userId }, { user }) => {
      if (user) {
        let _id = userId || user._id;

        return await User.findByIdAndUpdate(_id, {
          $pull: { myTasks: taskId },
        })
          .populate("myTasks")
          .populate("skills");
      }
    },
    addBoardPost: async (parent, { postData }, { user }) => {
      if (user) {
        return await BoardPost.create({ ...postData, createdBy: user._id });
      }
    },
    updateBoardPost: async (parent, { postId, postData }, { user }) => {
      if (user) {
        return await BoardPost.findByIdAndUpdate(postId, { ...postData });
      }
    },
    deleteBoardPost: async (parent, { postId }, { user }) => {
      if (user) {
        return await BoardPost.findByIdAndDelete(postId);
      }
    },
    addEvent: async (parent, { eventData }, { user }) => {
      if (user) {
        return await Event.create({ ...eventData, organisor: user._id });
      }
    },
    updateEvent: async (parent, { eventId, eventData }, { user }) => {
      if (user) {
        return await Event.findByIdAndUpdate(eventId, { ...eventData });
      }
    },
    deletEvent: async (parent, { eventId }, { user }) => {
      if (user) {
        return await Event.findByIdAndDelete(eventId, { ...eventData });
      }
    },
    addTask: async (parent, { taskData }, { user }) => {
      if (user) {
        return await Task.create({ ...taskData, createdBy: user._id });
      }
    },
    updateTask: async (parent, { taskId, taskData }, { user }) => {
      if (user) {
        return await Task.findByIdAndUpdate(taskId, { ...taskData });
      }
    },
    deleteTask: async (parent, { taskId }, { user }) => {
      if (user) {
        return await Task.findByIdAndDelete(taskId);
      }
    },
  },
};

module.exports = resolvers;
