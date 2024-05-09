const mongoose = require('mongoose');

const{Schema} = mongoose;

const skillSchema = new Schema({
    Name: {
        type: String
    },

})

const Skill = mongoose.model('Skill', skillSchema);

module.exports = Skill;