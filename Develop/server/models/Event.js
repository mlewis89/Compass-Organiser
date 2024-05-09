const mongoose = require("mongoose");
const User = require("./User");

const { Schema } = mongoose;

const eventSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  organisor: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },

  isPublic: Boolean,
  description: {
    type: String,
  },
  location: {
    type: String,
  },
  attending: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
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
    type: Number,
  },
});

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
