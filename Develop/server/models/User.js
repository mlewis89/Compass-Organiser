const mongoose = require('mongoose');

const{Schema} = mongoose;
const bcrypt = require('bcrypt');

const userSchema = new Schema({
    scoutRego: {
        type: String,
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    preferredName: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
    },
    gender: {
        type: String,
    },
    dob: {
        type: Date,
    },
    Section: {
        type: String,
    },
    
    email:
    {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    taskAvailabity: {
        type: int,
        default: 0,
    },
    Family: {
        type: Schema.Types.ObjectId,
        ref: 'Family'
    },
    ParentGardian: [User],
    //role: [Role],
    //skills : [Skill],
    //myTasks : [Task],

})

const User = mongoose.model('User', userSchema);

module.exports = User;