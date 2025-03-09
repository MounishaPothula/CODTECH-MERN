import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);

// Try different ports if default is in use
const tryPort = async (startPort) => {
  for (let port = startPort; port < startPort + 10; port++) {
    try {
      await new Promise((resolve, reject) => {
        const server = httpServer.listen(port, () => {
          console.log(`Server running on port ${port}`);
          resolve(port);
        });
        server.on('error', (error) => {
          if (error.code === 'EADDRINUSE') {
            console.log(`Port ${port} is in use, trying next port...`);
            reject(error);
          } else {
            reject(error);
          }
        });
      });
      return port;
    } catch (error) {
      if (error.code !== 'EADDRINUSE') {
        throw error;
      }
    }
  }
  throw new Error('No available ports found');
};

// Start the server
const startServer = async () => {
  try {
    app.use(cors());
    app.use(express.json());

    const port = await tryPort(3001);
    
    const io = new Server(httpServer, {
      cors: {
        origin: ["http://localhost:5173", "http://localhost:5174"],
        methods: ["GET", "POST"]
      }
    });

    // In-memory storage
    const users = new Map(); // Maximum 5 users
    const messages = []; // Store last 50 messages
    const connectedUsers = new Set(); // Track connected users

    // Store active rooms and their users
    const rooms = {
      'shared-room': { 
        users: new Map(),
        messages: []
      },
      'shared-doc': { 
        users: new Map(),
        content: '',
        version: 0,
        cursors: new Map() // Track user cursors
      },
      'shared-board': { 
        users: new Map(),
        strokes: [],
        currentStrokes: new Map() // Track ongoing strokes
      }
    };

    // Simple authentication
    app.post('/api/login', (req, res) => {
      const { username } = req.body;
      
      if (users.size >= 5 && !users.has(username)) {
        return res.status(400).json({ error: 'Maximum user limit reached' });
      }

      const user = {
        id: username,
        name: username,
        createdAt: new Date()
      };

      users.set(username, user);
      console.log(`User logged in: ${username}`);
      res.json({ user });
    });

    // Socket.IO connection handling
    io.on('connection', (socket) => {
      console.log('User connected:', socket.id);
      let currentUser = null;

      // Join room handler
      socket.on('join-room', ({ roomId, user }) => {
        try {
          if (!rooms[roomId]) {
            console.error('Invalid room:', roomId);
            socket.emit('error', { message: 'Invalid room' });
            return;
          }

          currentUser = user;
          console.log('User joining room:', roomId, user.name);
          
          // Check user limit
          if (connectedUsers.size >= 5 && !connectedUsers.has(user.id)) {
            console.error('Maximum user limit reached for:', user.name);
            socket.emit('error', { message: 'Maximum user limit reached' });
            return;
          }

          // Add user to room and connected users
          socket.join(roomId);
          rooms[roomId].users.set(socket.id, user);
          connectedUsers.add(user.id);

          console.log(`${user.name} joined ${roomId}. Total users: ${connectedUsers.size}`);

          // Send initial state based on room type
          switch (roomId) {
            case 'shared-room':
              socket.emit('chat-history', messages);
              break;
            case 'shared-doc':
              socket.emit('document-state', {
                content: rooms['shared-doc'].content,
                version: rooms['shared-doc'].version,
                cursors: Array.from(rooms['shared-doc'].cursors.values())
              });
              break;
            case 'shared-board':
              socket.emit('whiteboard-state', {
                strokes: rooms['shared-board'].strokes,
                currentStrokes: Array.from(rooms['shared-board'].currentStrokes.values())
              });
              break;
          }

          // Notify others about new user
          socket.broadcast.to(roomId).emit('user-joined', user);
          io.to(roomId).emit('users-update', Array.from(rooms[roomId].users.values()));
        } catch (error) {
          console.error('Error in join-room:', error);
          socket.emit('error', { message: 'Failed to join room' });
        }
      });

      // Chat message handler
      socket.on('chat-message', (message) => {
        try {
          console.log('Chat message:', message);
          messages.push(message);
          if (messages.length > 50) messages.shift(); // Keep only last 50 messages
          io.to('shared-room').emit('chat-message', message);
        } catch (error) {
          console.error('Error in chat-message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Document handlers
      socket.on('document-change', (change) => {
        try {
          const room = rooms['shared-doc'];
          room.content = change.content;
          console.log(`Document updated by ${currentUser?.name}`);
          socket.broadcast.to('shared-doc').emit('document-change', {
            content: room.content,
            userId: currentUser?.id
          });
        } catch (error) {
          console.error('Error in document-change:', error);
          socket.emit('error', { message: 'Failed to update document' });
        }
      });

      socket.on('cursor-move', (data) => {
        try {
          if (!currentUser) return;
          
          const room = rooms['shared-doc'];
          room.cursors.set(currentUser.id, {
            userId: currentUser.id,
            username: currentUser.name,
            ...data
          });
          
          socket.broadcast.to('shared-doc').emit('cursor-move', {
            userId: currentUser.id,
            username: currentUser.name,
            ...data
          });
        } catch (error) {
          console.error('Error in cursor-move:', error);
        }
      });

      // Whiteboard handlers
      socket.on('drawing-start', (data) => {
        try {
          if (!currentUser) return;
          
          const room = rooms['shared-board'];
          room.currentStrokes.set(currentUser.id, {
            userId: currentUser.id,
            username: currentUser.name,
            points: [data]
          });
          
          console.log(`Drawing started by ${currentUser.name}`);
          socket.broadcast.to('shared-board').emit('drawing-start', {
            userId: currentUser.id,
            username: currentUser.name,
            ...data
          });
        } catch (error) {
          console.error('Error in drawing-start:', error);
          socket.emit('error', { message: 'Failed to start drawing' });
        }
      });

      socket.on('drawing-move', (data) => {
        try {
          if (!currentUser) return;
          
          const room = rooms['shared-board'];
          const currentStroke = room.currentStrokes.get(currentUser.id);
          if (currentStroke) {
            currentStroke.points.push(data);
            socket.broadcast.to('shared-board').emit('drawing-move', {
              userId: currentUser.id,
              ...data
            });
          }
        } catch (error) {
          console.error('Error in drawing-move:', error);
        }
      });

      socket.on('drawing-end', () => {
        try {
          if (!currentUser) return;
          
          const room = rooms['shared-board'];
          const currentStroke = room.currentStrokes.get(currentUser.id);
          if (currentStroke) {
            room.strokes.push({
              ...currentStroke,
              completed: true
            });
            room.currentStrokes.delete(currentUser.id);
            console.log(`Drawing completed by ${currentUser.name}`);
            socket.broadcast.to('shared-board').emit('drawing-end', {
              userId: currentUser.id
            });
          }
        } catch (error) {
          console.error('Error in drawing-end:', error);
        }
      });

      socket.on('clear-canvas', () => {
        try {
          if (!currentUser) return;
          
          const room = rooms['shared-board'];
          room.strokes = [];
          room.currentStrokes.clear();
          socket.broadcast.to('shared-board').emit('clear-canvas');
        } catch (error) {
          console.error('Error in clear-canvas:', error);
        }
      });

      // Disconnect handler
      socket.on('disconnect', () => {
        try {
          console.log('User disconnected:', socket.id);
          
          if (currentUser) {
            connectedUsers.delete(currentUser.id);
            console.log(`${currentUser.name} disconnected. Total users: ${connectedUsers.size}`);
            
            // Remove user from all rooms and notify others
            for (const [roomId, room] of Object.entries(rooms)) {
              if (room.users.has(socket.id)) {
                room.users.delete(socket.id);
                if (roomId === 'shared-doc') {
                  room.cursors.delete(currentUser.id);
                }
                if (roomId === 'shared-board') {
                  room.currentStrokes.delete(currentUser.id);
                }
                socket.broadcast.to(roomId).emit('user-left', currentUser);
                io.to(roomId).emit('users-update', Array.from(room.users.values()));
              }
            }
          }
        } catch (error) {
          console.error('Error in disconnect:', error);
        }
      });
    });

    console.log(`Server is ready on port ${port}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();