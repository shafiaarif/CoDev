const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true },
    sessionTitle: { type: String, required: true },
    sessionLength: { type: Number, required: true },
    sessionType: { type: String, enum: ["public", "private"], required: true },
    roomPasscode: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // joined users
    invitedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // invited users
    pendingUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // waiting for approval

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);
