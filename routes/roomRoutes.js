const express = require("express");
const router = express.Router();
const Room = require("../models/Room");
const authMiddleware = require("../middleware/authMiddleware"); // verify JWT
const multer = require("multer");
const path=require('path');
const fs = require("fs");
const Message = require("../models/Message");
const User = require("../models/user");
const { connectedUsers } = require("../server");
const SessionCode = require("../models/SessionCode");
const { exec, spawn } = require('child_process');
const os = require('os');
const { v4: uuidv4 } = require('uuid');


const upload = multer({
  dest: path.join(__dirname, "..", "uploads/"),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".c" && ext !== ".py") {
      return cb(new Error("Only C or Python files are allowed"));
    }
    cb(null, true);
  },
});


// GET all users (for dropdown)
router.get("/users", authMiddleware, async (req, res) => {
  try {
    const users = await User.find({}, "username email _id role");
    res.status(200).json({ users });
  } catch (err) {
    res.status(500).json({ message: "Error fetching users" });
  }
});


// ✅ Invite selected users
router.post("/invite", authMiddleware, async (req, res) => {
  const { roomId, invitedUserIds } = req.body;
  const io = req.app.get("io");

  try {
    const room = await Room.findOne({ roomId });
    if (!room) return res.status(404).json({ message: "Room not found" });

    if (room.createdBy.toString() !== req.user.id)
      return res.status(403).json({ message: "Only session creator can invite" });

    invitedUserIds.forEach((uid) => {
      if (!room.invitedUsers.includes(uid)) room.invitedUsers.push(uid);
    });
    await room.save();

    // Send real-time notifications to invited users
    invitedUserIds.forEach((uid) => {
      const socketId = connectedUsers.get(uid.toString());
      if (socketId) {
        io.to(socketId).emit("invitedToSession", {
          message: `You’ve been invited to join ${room.sessionTitle}`,
          roomId,
        });
      }
    });

    res.status(200).json({ message: "Invitations sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error inviting users" });
  }
});

// POST --- Create room
// POST --- Create Session (with title, length, type)
// roomRoutes.js ke /create route mein ye changes kar do

router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { sessionTitle, sessionLength, sessionType } = req.body;

    // Validation
    if (!sessionTitle || !sessionLength || !sessionType) {
      return res.status(400).json({ message: "Session title, length and type are required" });
    }

    if (!["public", "private"].includes(sessionType)) {
      return res.status(400).json({ message: "Invalid session type" });
    }

    if (isNaN(sessionLength) || sessionLength < 15 || sessionLength > 300) {
      return res.status(400).json({ message: "Session length must be between 15 and 300 minutes" });
    }

    // Auto generate 6-digit passcode only for private sessions
    let roomPasscode = null;
    if (sessionType === "private") {
      roomPasscode = String(Math.floor(100000 + Math.random() * 900000)); // 100000 - 999999
    }

    // Generate unique roomId
    const roomId = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Create room
    const room = new Room({
      roomId,
      sessionTitle: sessionTitle.trim(),
      sessionLength: Number(sessionLength),
      sessionType,
      roomPasscode,
      createdBy: req.user.id,
      users: [req.user.id],
      isActive: true,
    });

    await room.save();

    // Success response
    res.status(201).json({
      message: "Session created successfully",
      roomId,
      sessionTitle,
      sessionType,
      passcode: sessionType === "private" ? roomPasscode : null,
      joinLink: `http://localhost:3000/join/${roomId}`, // ya tumhara actual frontend URL
    });

  } catch (err) {
    console.error("Create Session Error:", err);
    res.status(500).json({ message: "Server error, please try again" });
  }
});

//join the session
// ✅ Final: Join room (handles invite + approval + public/private)
router.post("/join", authMiddleware, async (req, res) => {
  const { joinLink } = req.body;
  const roomId = joinLink.split("/").pop();
  const room = await Room.findOne({ roomId });

  if (!room) return res.status(404).json({ message: "Session not found" });

  // 🔒 If it's a private session — only invited users can request join
  if (room.sessionType === "private" && !room.invitedUsers.includes(req.user.id)) {
    return res.status(403).json({ message: "You are not invited to this private session" });
  }

  // ✅ If user is already approved (in users list)
  if (room.users.includes(req.user.id)) {
    return res.status(200).json({ message: "You are already in the session" });
  }

  // 🚧 If user is already pending
  if (!room.pendingUsers.includes(req.user.id)) {
    room.pendingUsers.push(req.user.id);
    await room.save();

    // 🔔 Notify session creator (owner)
    const io = req.app.get("io");
    io.to(room.createdBy.toString()).emit("newPendingUser", {
      userId: req.user.id,
      username: req.user.username,
      roomId,
    });
  }

  res.status(200).json({
    message: "Request sent. Waiting for session creator approval.",
  });
});

router.post("/admit", authMiddleware, async (req, res) => {
  const { roomId, userId, action } = req.body; // action = 'approve' | 'deny'

  const room = await Room.findOne({ roomId });
  if (!room) return res.status(404).json({ message: "Room not found" });

  if (room.createdBy.toString() !== req.user.id) {
    return res.status(403).json({ message: "Only the session owner can admit users" });
  }

  if (!room.pendingUsers.includes(userId)) {
    return res.status(400).json({ message: "User not pending" });
  }

  if (action === "approve") {
    room.users.push(userId);
  }

  // Remove from pending
  room.pendingUsers = room.pendingUsers.filter(u => u.toString() !== userId);
  await room.save();

  // Notify the user in real-time via Socket.IO
  const io = req.app.get("io");
  io.to(userId).emit("admitResponse", { roomId, action });

  res.json({ message: `User ${action}d successfully` });
});


// ----------------- DOWNLOAD ROUTE -----------------
router.post("/download", authMiddleware, async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code || !language)
      return res.status(400).json({ message: "Code and language required" });

    let extension = "";
    if (language.toLowerCase() === "python") extension = "py";
    else if (language.toLowerCase() === "c") extension = "c";
    else return res.status(400).json({ message: "Invalid language" });

    const tempDir = path.join(__dirname, "..", "temp");
    fs.mkdirSync(tempDir, { recursive: true });

    const filename = `code_${Date.now()}.${extension}`;
    const filePath = path.join(tempDir, filename);

    fs.writeFileSync(filePath, code);

    res.download(filePath, filename, (err) => {
      if (err) {
        console.error("Download Error:", err);
        return res.status(500).json({ message: "Error downloading file" });
      }
      fs.unlinkSync(filePath); // remove temp file after download
    });
  } catch (error) {
    console.error("Catch Error:", error);
    res.status(500).json({ message: "Error downloading file" });
  }
});

// ----------------- UPLOAD ROUTE -----------------

// roomRoutes.js me upload route
router.post("/upload", authMiddleware, upload.single("file"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "File is required" });

    res.status(200).json({
      message: "File uploaded successfully",
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path,
    });
  } catch (error) {
    console.error("Upload Error:", error);

    // Friendly response for Multer file type errors
    if (error.message.includes("Only C or Python files are allowed")) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Error uploading file" });
  }
});


// ✅ GET: Fetch all messages of a room
router.get("/chat/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await Message.find({ roomId }).sort({ createdAt: 1 });

    res.json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

//  POST: Send (save) a new message manually
router.post("/chat", async (req, res) => {
  try {
    const { roomId, username, message } = req.body;

    const newMsg = new Message({ roomId, username, message });
    await newMsg.save();

    res.json({ success: true, message: "Message saved" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get participants of a session (by roomId)
router.get("/participants/:roomId", async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId }).populate("users", "email username _id");
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    res.json({
      success: true,
      participants: room.users,

    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});


// END session (only instructor can end)
router.post("/end/:roomId", authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check if logged in user is the creator of the session
    if (room.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the session owner can end this session" });
    }

    // Mark session as inactive (recommended)
    room.isActive = false;
    await room.save();

    // Notify all users via socket.io
    req.app.get("io").to(roomId).emit("sessionEnded", {
      message: "This session has ended by the instructor.",
    });

    res.status(200).json({
      success: true,
      message: "Session ended successfully",
    });

  } catch (error) {
    console.error("End Session Error:", error);
    res.status(500).json({ message: "Error ending session" });
  }
});


// instructor getting his sessions
router.get("/my-sessions", authMiddleware, async (req, res) => {
  try {
    const sessions = await Room.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 }); // newest first

    const activeSessions = sessions.filter(s => s.isActive);
    const pastSessions = sessions.filter(s => !s.isActive);

    res.json({
      success: true,
      activeSessions,
      pastSessions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});


// POST --- Instructor joins their own active session
router.post("/join-active/:roomId", authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Only allow if instructor is the creator
    if (room.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not the creator of this session" });
    }

    // Only allow if session is active
    if (!room.isActive) {
      return res.status(400).json({ message: "This session has ended" });
    }

    // Add instructor to room users array if not already there
    if (!room.users.includes(req.user.id)) {
      room.users.push(req.user.id);
      await room.save();
    }

    // Return join info
    res.status(200).json({
      success: true,
      message: "Joined your active session",
      roomId: room.roomId,
      sessionTitle: room.sessionTitle,
    });

  } catch (err) {
    console.error("Join Active Session Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// POST: Kick a student from a session (instructor only)
router.post("/kick/:roomId", authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { studentId } = req.body; // ID of the student to remove

    if (!studentId) {
      return res.status(400).json({ message: "studentId is required" });
    }

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Only the creator (instructor) can kick
    if (room.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the instructor can kick a student" });
    }

    // Remove student from the room.users array
    room.users = room.users.filter(u => u.toString() !== studentId);
    await room.save();

    // Notify the kicked student via Socket.IO
    const io = req.app.get("io"); // make sure you set io in server.js: app.set("io", io)
    io.to(roomId).emit("studentKicked", { studentId, message: "You have been removed from the session." });

    res.status(200).json({
      success: true,
      message: "Student removed from the session",
    });

  } catch (err) {
    console.error("Kick Error:", err);
    res.status(500).json({ message: "Error kicking student" });
  }
});

// Saves code + language + timestamp
router.post("/save-code/:roomId", authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { code, language } = req.body;

    if (!code)
      return res.status(400).json({ message: "Code is required" });

    const room = await Room.findOne({ roomId });
    if (!room) return res.status(404).json({ message: "Session not found" });

    // Only instructor can save
    if (room.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the instructor can save session code" });
    }

    const saved = new SessionCode({
      roomId,
      savedBy: req.user.id,
      code,
      language
    });

    await saved.save();

    res.json({
      success: true,
      message: "Code saved successfully",
      savedId: saved._id
    });

  } catch (err) {
    console.error("Save Code Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Load previous saved versions
router.get("/load-code/:roomId", authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;

    const saves = await SessionCode.find({ roomId }).sort({ timestamp: -1 });

    res.json({
      success: true,
      count: saves.length,
      saves
    });
  } catch (err) {
    console.error("Load Code Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// Restore a specific save
router.get("/restore-code/:saveId", authMiddleware, async (req, res) => {
  try {
    const { saveId } = req.params;

    const saved = await SessionCode.findById(saveId);
    if (!saved)
      return res.status(404).json({ message: "Saved snapshot not found" });

    // Find room
    const room = await Room.findOne({ roomId: saved.roomId });
    if (!room)
      return res.status(404).json({ message: "Session not found" });

    // Only instructor can restore
    if (room.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the instructor can restore code" });
    }

    res.json({
      success: true,
      code: saved.code,
      language: saved.language,
      timestamp: saved.timestamp
    });

  } catch (err) {
    console.error("Restore Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});



router.post('/run', async (req, res) => {
const { code, language } = req.body;
if (!code || !language) return res.status(400).json({ error: 'Code and language required' });

const tempDir = os.tmpdir();
const id = uuidv4();
let filePath;

try {
if (language === 'python') {
filePath = path.join(tempDir, `${id}.py`);
fs.writeFileSync(filePath, code);


  const pyProcess = spawn('python', [filePath], { timeout: 5000, stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '', stderr = '';
  pyProcess.stdout.on('data', d => stdout += d.toString());
  pyProcess.stderr.on('data', d => stderr += d.toString());

  pyProcess.on('close', () => {
    fs.unlinkSync(filePath);
    res.json({ output: stdout || stderr || 'No output' });
  });

} else if (language === 'c') {
  filePath = path.join(tempDir, `${id}.c`);
  const exePath = path.join(tempDir, `${id}.out`);
  fs.writeFileSync(filePath, code);

  const compile = spawn('gcc', [filePath, '-o', exePath], { timeout: 5000 });
  let compileErr = '';
  compile.stderr.on('data', d => compileErr += d.toString());

  compile.on('close', code => {
    if (code !== 0) {
      fs.unlinkSync(filePath);
      return res.json({ error: compileErr });
    }

    const run = spawn(exePath, [], { timeout: 5000, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    run.stdout.on('data', d => stdout += d.toString());
    run.stderr.on('data', d => stderr += d.toString());

    run.on('close', () => {
      fs.unlinkSync(filePath);
      fs.unlinkSync(exePath);
      res.json({ output: stdout || stderr || 'No output' });
    });
  });

} else {
  return res.status(400).json({ error: 'Unsupported language' });
}


} catch (err) {
return res.status(500).json({ error: err.message });
}
});


module.exports = router;
