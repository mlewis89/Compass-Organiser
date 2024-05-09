const mongoose = require('mongoose');

const{Schema} = mongoose;

const familySchema = new Schema({
    users: [
        {
          type: Schema.Types.ObjectId,
          ref: 'User'
        }
      ],

})

const Family = mongoose.model('Family', familySchema);

module.exports = Family;