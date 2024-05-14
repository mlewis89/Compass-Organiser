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
    password:{
      type: String,
      required: true,
    },

    scoutName: {
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
    section: {
        type: String,
    },
    
    email:
    {
        type: String,
        required: true,
    },
    phone: {
        type: String,
    },
    taskAvailabity: {
        type: Number,
        default: 0,
    },
    family: {
        type: Schema.Types.ObjectId,
        ref: 'Family'
    },
    parentGardian: [
        {
          type: Schema.Types.ObjectId,
          ref: 'User'
        }
      ],
    role: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Role'
        }
      ],
    skills : [
        {
          type: Schema.Types.ObjectId,
          ref: 'Skill'
        }
      ],
    myTasks : [
        {
          type: Schema.Types.ObjectId,
          ref: 'Task'
        }
      ],

})
// hash user password
userSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('password')) {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
  }

  next();
});

// custom method to compare and validate password for logging in
userSchema.methods.isCorrectPassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

// when we query a user, we'll also get another field called `bookCount` with the number of saved books we have
userSchema.virtual('displayName').get(function () {
  return this.scoutName || this.preferredName || this.firstName;
});

const User = mongoose.model('User', userSchema);

module.exports = User;