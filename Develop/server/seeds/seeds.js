const db = require('../config/connection');
const { User, Event, Task, Family, BoardPost, Payment, Role, Skill } = require('../models');
const cleanDB = require('./cleanDB');

const userData =  require('./users.json');
const eventData =  require('./Event.json');
const postData =  require('./BoardPost.json');
const roleData =  require('./Role.json');
const skillData =  require('./skills.json');
const taskData =  require('./Task.json');

db.once('open', async () => {
    await cleanDB("User", "users");
    await cleanDB("Event", "events");
    await cleanDB("Task", "tasks");
    await cleanDB("Family", "families");
    await cleanDB("BoardPost", "boardposts");
    await cleanDB("Payment", "payments");
    await cleanDB("Role", "roles");
    await cleanDB("Skill", "skills");


    const emailDomains = ['gmail.com', 'hotmail.com', 'outlook.com.au', 'email.com'];
    const userArr = [];

//get random birthdate
const randomDOB = ()=> {
    let minDay = Date.parse('01 Jan 1970 00:00:00 GMT').valueOf();
    let maxDay = Date.parse('01 Jan 2019 00:12:00 GMT').valueOf();
    let randomDay = minDay + Math.floor(Math.random() * (maxDay - minDay));
    
    return new Date(randomDay);

}


    //generate 50 users
    for(let i=0; i<50; i++)
        {
            let user = {
                scoutRego : Math.floor(1000000 + Math.random() * 9000000),
                phone : `04${Math.floor(10000000 + Math.random() * 90000000)}`,
                firstName : userData.names[Math.floor(Math.random() * userData.names.length)],
                lastName : userData.names[Math.floor(Math.random() * userData.names.length)],
                status : userData.status[Math.floor(Math.random() * userData.status.length)],
                gender : userData.gender[Math.floor(Math.random() * userData.gender.length)],
                section : userData.section[Math.floor(Math.random() * userData.section.length)],
                dob : randomDOB(),
                taskAvailabity : Math.floor(Math.random() * 10),
            };
            user.email = `${user.firstName}.${user.lastName}@${emailDomains[Math.floor(Math.random() * emailDomains.length)]}`;
            userArr.push(user);
}
const users = await User.insertMany(userArr);

console.log(users);
}
)
