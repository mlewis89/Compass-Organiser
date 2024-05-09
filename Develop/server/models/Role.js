const mongoose = require('mongoose');

const{Schema} = mongoose;

const roleSchema = new Schema({
    Name: {
        type: String
    },
    Prequistes: {
        type: String
    },
    RequiredTraining: {
        type: String
    },
    ReportsTo : {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Role'
    },
    isUniformed : Boolean,

})

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;