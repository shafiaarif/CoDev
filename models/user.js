const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["student", "instructor", "admin"], // ← Admin add kiya
    default: "student"
  },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);