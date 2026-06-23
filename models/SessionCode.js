const mongoose = require("mongoose");

const sessionCodeSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true
  },

  savedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  code: {
    type: String,
    required: true
  },

  language: {
    type: String,
    enum: ["python", "c"],
    default: "python"
  },

  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("SessionCode", sessionCodeSchema);
