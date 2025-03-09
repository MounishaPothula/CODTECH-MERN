const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store connected users and their socket IDs
const users = new Map();
// Store active chat rooms
const chatRooms = new Map();
// Store room metadata
const roomMetadata = new Map();

const broadcastRooms = () => {
  const rooms = Array.from(roomMetadata.values()).map(room => ({
    id: room.id,
    name: room.name,
    userCount: room.users.size,
    lastActivity: room.lastActivity,
  }));
  io.emit('rooms:update', rooms);
};

io.on('connection', (socket) => {
  console.log('New client connected');

  // Send initial rooms list
  broadcastRooms();

  // Handle user joining
  socket.on('user:join', ({ username }) => {
    users.set(socket.id, { username, status: 'online' });
    io.emit('users:update', Array.from(users.values()));
  });

  // Handle room creation
  socket.on('room:create', ({ roomId, roomName }) => {
    if (!roomMetadata.has(roomId)) {
      roomMetadata.set(roomId, {
        id: roomId,
        name: roomName,
        users: new Set(),
        lastActivity: Date.now(),
      });
      chatRooms.set(roomId, { messages: [] });
      broadcastRooms();
    }
  });

  // Handle joining chat rooms
  socket.on('room:join', ({ roomId }) => {
    socket.join(roomId);
    const user = users.get(socket.id);
    
    if (user && roomMetadata.has(roomId)) {
      const room = roomMetadata.get(roomId);
      room.users.add(socket.id);
      room.lastActivity = Date.now();
      broadcastRooms();
    }

    // Send room history to the joining user
    socket.emit('room:history', {
      roomId,
      messages: chatRooms.get(roomId)?.messages || []
    });
  });

  // Handle leaving rooms
  socket.on('room:leave', ({ roomId }) => {
    if (roomMetadata.has(roomId)) {
      const room = roomMetadata.get(roomId);
      room.users.delete(socket.id);
      if (room.users.size === 0) {
        roomMetadata.delete(roomId);
        chatRooms.delete(roomId);
      }
      socket.leave(roomId);
      broadcastRooms();
    }
  });

  // Handle new messages
  socket.on('message:new', ({ roomId, message }) => {
    const user = users.get(socket.id);
    if (!user) return;

    const messageData = {
      id: Date.now(),
      text: message,
      sender: user.username,
      timestamp: new Date(),
      status: 'sent'
    };

    // Store message in room history
    const room = chatRooms.get(roomId);
    if (room) {
      room.messages.push(messageData);
      if (roomMetadata.has(roomId)) {
        roomMetadata.get(roomId).lastActivity = Date.now();
      }
    }

    // Broadcast message to room
    io.to(roomId).emit('message:received', { roomId, message: messageData });
    broadcastRooms();
  });

  // Handle typing status
  socket.on('user:typing', ({ roomId, isTyping }) => {
    const user = users.get(socket.id);
    if (user) {
      socket.to(roomId).emit('user:typing', {
        username: user.username,
        isTyping
      });
    }
  });

  // Handle message read status
  socket.on('message:read', ({ roomId, messageId }) => {
    io.to(roomId).emit('message:status', {
      messageId,
      status: 'read'
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      users.delete(socket.id);
      // Remove user from all rooms
      roomMetadata.forEach((room, roomId) => {
        room.users.delete(socket.id);
        if (room.users.size === 0) {
          roomMetadata.delete(roomId);
          chatRooms.delete(roomId);
        }
      });
      io.emit('users:update', Array.from(users.values()));
      broadcastRooms();
    }
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 