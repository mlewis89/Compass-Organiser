const mongoose = require('mongoose');

const{Schema} = mongoose;

const skillSchema = new Schema({
    name: {
        type: String
    },

})

const Skill = mongoose.model('Skill', skillSchema);

module.exports = Skill;