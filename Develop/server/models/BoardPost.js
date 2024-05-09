const mongoose = require('mongoose');
const User = require('./User');

const{Schema} = mongoose;

const postSchema = new Schema({
   title: {
        type: String
    },
    content: {
        type: String
    },
    image: {
        type: String
    },
    isPublic: Boolean,
    expiryDate: {
        type: Date,
    },
    createdBy: 
        {
          type: Schema.Types.ObjectId,
          ref: 'User'
        }
      ,
    priority: {
        type: Number,
    },
})

const BoardPost = mongoose.model('BoardPost', postSchema);

module.exports = BoardPost;