const mongoose = require('mongoose');
const User = require('./User');

const{Schema} = mongoose;

const eventSchema = new Schema({
    Title: {
        type: String,
        required: true,
        trim: true,
    },
    PrimaryOrangisor: User,
    startDate: {
        type: Date,
    },
    endDate: {
        type: Date,
    },

    isPublic: {
        type: Boolean,
    },
    description: {
        type: String,
    },
    Location: {
        type: String,
    },
    Attending: [User],
    //Sections: [Sections],
    plan: {
        type: String,
    },
    riskManagement: {
        type: String,
    },
    status: {
        type: String,
    },
    cost: {
        type: Float,
    }
})

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;