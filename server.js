const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

// Routes
const authRoutes = require("./routes/authRoutes");
const roomRoutes = require("./routes/roomRoutes");

const app = express();
const server = http.createServer(app);

// ======================= SOCKET.IO SETUP =======================
const io = new Server(server, {
  cors: {
    origin: "http://127.0.0.1:5500",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Important for invite/kick etc.
app.set("io", io);
// =============================================================

// Middlewares
app.use(express.json());
app.use(cors({
  origin: "http://127.0.0.1:5500",
  credentials: true
}));

app.use(express.static(path.join(__dirname, "public")));

// MongoDB
mongoose.connect(process.env.MONGO_URL || "mongodb+srv://shafiaarif26_db_user:shafia123@devroom.moxdmqi.mongodb.net/?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log("MongoDB Error:", err));

// Connected users map
const connectedUsers = new Map();

// ======================= SOCKET.IO LOGIC =======================
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinRoom", ({ roomId, username, role }) => {
    socket.join(roomId);
    socket.username = username;
    socket.role = role;
    socket.roomId = roomId;

    // Tell everyone someone joined
    socket.to(roomId).emit("userJoined", { id: socket.id, username, role });

    // Send current participants list to new user
    const users = {};
    io.in(roomId).fetchSockets().then(sockets => {
      sockets.forEach(s => {
        users[s.id] = { username: s.username || "User", role: s.role || "student" };
      });
      socket.emit("participants", users);
    });
  });

  socket.on("codeChange", ({ roomId, code, language }) => {
    socket.to(roomId).emit("codeUpdate", { code, language });
  });

  socket.on("chatMessage", ({ roomId, text }) => {
    const msg = { username: socket.username || "User", text, isOwn: false };
    socket.to(roomId).emit("chatMessage", msg);
    socket.emit("chatMessage", { ...msg, isOwn: true });
  });

  socket.on("endSession", (roomId) => {
    io.to(roomId).emit("sessionEnded");
  });

  socket.on("disconnect", () => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit("userLeft", socket.id);
    }
    console.log("User disconnected:", socket.id);
  });
});
// =============================================================

// Make connectedUsers available in routes
app.use((req, res, next) => {
  req.connectedUsers = connectedUsers;
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);

// Catch all
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 8000;
// YE LINE ADD KAR DO (server.listen se pehle)
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id); // console mein dikhega
});
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = { io, connectedUsers };