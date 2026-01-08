const mongoose = require("mongoose");

const MeetingSchema = new mongoose.Schema({
  transcript: String,
  summary: String,
  mom: String,
  tasks: Array,
  dates: Array,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Meeting", MeetingSchema);
