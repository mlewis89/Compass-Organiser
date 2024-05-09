const mongoose = require('mongoose');

const{Schema} = mongoose;

const taskSchema = new Schema({
    name: {
        type: String
    },
    requiredSkills: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Skill'
        }
      ],
    dueDate: {
        type: Date,
    },
    duration : {
        type: Number,
    },
    responsible: [
        {
          type: Schema.Types.ObjectId,
          ref: 'User'
        }
      ],
    createdBy: 
        {
          type: Schema.Types.ObjectId,
          ref: 'User'
        },
    priority: {
        type: Number,
    },
})

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;