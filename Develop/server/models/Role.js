const mongoose = require('mongoose');

const{Schema} = mongoose;

const roleSchema = new Schema({
    name: {
        type: String
    },
    prequistes: {
        type: String
    },
    requiredTraining: {
        type: String
    },
    reportsTo : {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Role'
    },
    isUniformed : Boolean,

})

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;