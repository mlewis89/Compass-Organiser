const db = require("../config/connection");
const {
  User,
  Event,
  Task,
  Family,
  BoardPost,
  Payment,
  Role,
  Skill,
} = require("../models");
const cleanDB = require("./cleanDB");

const userData = require("./users.json");
const eventData = require("./Event.json");
const postData = require("./BoardPost.json");
const roleData = require("./Role.json");
const skillData = require("./skills.json");
const taskData = require("./Task.json");

db.once("open", async () => {
  await cleanDB("User", "users");
  await cleanDB("Event", "events");
  await cleanDB("Task", "tasks");
  await cleanDB("Family", "families");
  await cleanDB("BoardPost", "boardposts");
  await cleanDB("Payment", "payments");
  await cleanDB("Role", "roles");
  await cleanDB("Skill", "skills");

  const skills = await Skill.insertMany(skillData);
  const roles = await Role.insertMany(roleData);

  const emailDomains = [
    "gmail.com",
    "hotmail.com",
    "outlook.com.au",
    "email.com",
  ];
  const userArr = [];

  //get random birthdate
  const randomDOB = () => {
    let minDay = Date.parse("01 Jan 1970 00:00:00 GMT").valueOf();
    let maxDay = Date.parse("01 Jan 2019 00:12:00 GMT").valueOf();
    let randomDay = minDay + Math.floor(Math.random() * (maxDay - minDay));

    return new Date(randomDay);
  };

  //generate 50 users
  for (let i = 0; i < 50; i++) {
    let user = {
      scoutRego: Math.floor(1000000 + Math.random() * 9000000),
      phone: `04${Math.floor(10000000 + Math.random() * 90000000)}`,
      firstName:
        userData.names[Math.floor(Math.random() * userData.names.length)],
      lastName:
        userData.names[Math.floor(Math.random() * userData.names.length)],
      status:
        userData.status[Math.floor(Math.random() * userData.status.length)],
      gender:
        userData.gender[Math.floor(Math.random() * userData.gender.length)],
      section:
        userData.section[Math.floor(Math.random() * userData.section.length)],
      dob: randomDOB(),
      tasks: [],
      taskAvailabity: Math.floor(Math.random() * 10),
      skills: skills[Math.floor(Math.random() * skills.length)],
      roles: roles[Math.floor(Math.random() * roles.length)],
      password: "password",
    };
    user.email = `${user.firstName}.${user.lastName}@${
      emailDomains[Math.floor(Math.random() * emailDomains.length)]
    }`;

    userArr.push(user);
  }
  const users = await User.insertMany(userArr);
  taskData.forEach((task) => {
    task.requiredSkills = skills.find((element)=> element.name == task.skill)
    //task.requiredSkills = skills[Math.floor(Math.random() * skills.length)]
    //task.responsible = users[Math.floor(Math.random() * users.length)];    
    task.responsible = null;
    task.createdBy = users[Math.floor(Math.random() * users.length)];
  });
  const tasks = await Task.insertMany(taskData);

  postData.forEach((post) => {
    post.createdBy = users[Math.floor(Math.random() * users.length)];
  });
  const posts = await BoardPost.insertMany(postData);

  eventData.forEach((event) => {
    event.organisor = users[Math.floor(Math.random() * users.length)];
    event.attending = [];
    let numOfUsers = Math.floor(Math.random() * users.length);
    for (let i = 0; i < numOfUsers; i++) {
      event.attending.push(users[Math.floor(Math.random() * users.length)]);
    }
  });

  const events = await Event.insertMany(eventData);

  const familyData = [];
  let familyUsers = [...users];
  
  //for each user
  while (familyUsers.length > 0) {
    //create temp Array of family
    let familyMembers = [];
    let NumOfMembers = 1+Math.floor(Math.random() * 5);
    for (let i = 0; i < NumOfMembers; i++ )//loop between 0-5 times to build family list
    {
      let usrIndex = Math.floor(Math.random() * familyUsers.length); //select random user from remaoning list
      familyMembers.push(familyUsers[usrIndex]); // add chosen user to family array
      familyUsers.splice(usrIndex, 1); //remove chosen user from array
    }
    let family = {
      users: familyMembers,
    };
    familyData.push(family); //add family to dataset
  }

  const families = await Family.insertMany(familyData);

  console.log("all done!");
  process.exit(0);
});
