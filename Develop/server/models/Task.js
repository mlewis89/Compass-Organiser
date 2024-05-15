const mongoose = require('mongoose');

const{Schema} = mongoose;

const taskSchema = new Schema({
    name: {
        type: String,
        required:true,
    },
    requiredSkills: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Skill'
        }
      ],
      description:
        {
          type: String,
        },
      status: {
          type: String,
        },
    dueDate: {
        type: Date,
    },
    duration : {
        type: Number,
    },
    responsible: 
        {
          type: Schema.Types.ObjectId,
          ref: 'User'
        }
      ,
    createdBy: 
        {
          type: Schema.Types.ObjectId,
          ref: 'User'
        },
    priority: {
        type: Number,
    },
})

taskSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('dueDate')) {
   if(!this.dueDate)
    {
      var date = new Date(this.valueOf());
      date.setDate(date.getDate() + 365);
      this.dueDate = date.getTime();
    }
  }

  next();
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;