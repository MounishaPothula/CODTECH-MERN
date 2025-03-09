const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// In-memory storage
const rooms = new Map();
const messages = new Map();
const onlineUsers = new Set();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user login
  socket.on('user:login', ({ username }) => {
    socket.username = username;
    onlineUsers.add(username);
    io.emit('users:online', Array.from(onlineUsers));
  });

  // Handle user logout
  socket.on('user:logout', () => {
    if (socket.username) {
      onlineUsers.delete(socket.username);
      io.emit('users:online', Array.from(onlineUsers));
    }
  });

  // Get available rooms
  socket.on('rooms:get', () => {
    socket.emit('rooms:list', Array.from(rooms.values()));
  });

  // Create a new room
  socket.on('room:create', ({ id, name }) => {
    const room = { id, name, createdAt: new Date().toISOString() };
    rooms.set(id, room);
    messages.set(id, []);
    io.emit('rooms:list', Array.from(rooms.values()));
  });

  // Join a room
  socket.on('room:join', ({ roomId }) => {
    socket.join(roomId);
  });

  // Get messages for a room
  socket.on('messages:get', ({ roomId }) => {
    const roomMessages = messages.get(roomId) || [];
    socket.emit('messages:list', { roomId, messageList: roomMessages });
  });

  // Send a message
  socket.on('message:send', ({ roomId, message }) => {
    const roomMessages = messages.get(roomId) || [];
    roomMessages.push(message);
    messages.set(roomId, roomMessages);
    io.to(roomId).emit('message:new', { roomId, message });
  });

  // Handle typing status
  socket.on('user:typing', ({ roomId, isTyping }) => {
    io.to(roomId).emit('user:typing', {
      roomId,
      user: socket.username,
      isTyping
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    if (socket.username) {
      onlineUsers.delete(socket.username);
      io.emit('users:online', Array.from(onlineUsers));
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 