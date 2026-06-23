const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Serve static frontend (optional)
app.use(express.static(path.join(__dirname, 'public')));

// Socket.io
io.on('connection', (socket) => {
    console.log('A user connected via socket.io');
    socket.on('sendNotification', (data) => io.emit('receiveNotification', data));
    socket.on('disconnect', () => console.log('User disconnected'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
