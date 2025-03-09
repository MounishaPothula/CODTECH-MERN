import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnecting = false;
    this.callbacks = {
      onMessage: () => {},
      onTyping: () => {},
      onDocumentChange: () => {},
      onDocumentState: () => {},
      onCursorMove: () => {},
      onDrawingStart: () => {},
      onDrawingMove: () => {},
      onDrawingEnd: () => {},
      onWhiteboardState: () => {},
      onClearCanvas: () => {},
      onUserJoin: () => {},
      onUserLeave: () => {},
      onUsersUpdate: () => {},
      onChatHistory: () => {},
      onError: () => {},
      onConnectionStateChange: () => {},
    };
  }

  async connect() {
    if (this.socket || this.isConnecting) return;

    this.isConnecting = true;
    console.log('Connecting to socket server...');

    // Try ports 3001-3010
    for (let port = 3001; port <= 3010; port++) {
      try {
        this.socket = io(`http://localhost:${port}`, {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: Infinity,
          timeout: 10000,
        });

        await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Connection timeout'));
          }, 5000);

          this.socket.on('connect', () => {
            clearTimeout(timeoutId);
            console.log('Socket connected:', this.socket.id);
            this.isConnecting = false;
            this.callbacks.onConnectionStateChange({ connected: true });
            resolve();
          });

          this.socket.on('connect_error', (error) => {
            clearTimeout(timeoutId);
            reject(error);
          });
        });

        // If we get here, connection was successful
        this.setupListeners();
        return;
      } catch (error) {
        console.log(`Failed to connect to port ${port}:`, error.message);
        if (this.socket) {
          this.socket.disconnect();
          this.socket = null;
        }
      }
    }

    // If we get here, all connection attempts failed
    this.isConnecting = false;
    console.error('Failed to connect to any available port');
    this.callbacks.onError({ message: 'Failed to connect to server' });
  }

  setupListeners() {
    if (!this.socket) return;

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.callbacks.onConnectionStateChange({ connected: false, reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.callbacks.onError({ message: 'Connection failed', error });
    });

    this.socket.on('chat-message', (message) => {
      console.log('Received chat message:', message);
      this.callbacks.onMessage(message);
    });

    this.socket.on('chat-history', (messages) => {
      console.log('Received chat history:', messages.length, 'messages');
      this.callbacks.onChatHistory(messages);
    });

    this.socket.on('user-typing', (data) => {
      this.callbacks.onTyping(data);
    });

    this.socket.on('document-change', (change) => {
      console.log('Received document change, version:', change.version);
      this.callbacks.onDocumentChange(change);
    });

    this.socket.on('document-state', (state) => {
      console.log('Received document state, version:', state.version);
      this.callbacks.onDocumentState(state);
    });

    this.socket.on('cursor-move', (cursor) => {
      this.callbacks.onCursorMove(cursor);
    });

    this.socket.on('drawing-start', (data) => {
      console.log('Received drawing start from:', data.username);
      this.callbacks.onDrawingStart(data);
    });

    this.socket.on('drawing-move', (data) => {
      this.callbacks.onDrawingMove(data);
    });

    this.socket.on('drawing-end', (data) => {
      console.log('Drawing ended by:', data.userId);
      this.callbacks.onDrawingEnd(data);
    });

    this.socket.on('whiteboard-state', (state) => {
      console.log('Received whiteboard state:', state.strokes.length, 'strokes');
      this.callbacks.onWhiteboardState(state);
    });

    this.socket.on('clear-canvas', () => {
      console.log('Canvas cleared');
      this.callbacks.onClearCanvas();
    });

    this.socket.on('user-joined', (user) => {
      console.log('User joined:', user.name);
      this.callbacks.onUserJoin(user);
    });

    this.socket.on('user-left', (user) => {
      console.log('User left:', user.name);
      this.callbacks.onUserLeave(user);
    });

    this.socket.on('users-update', (users) => {
      console.log('Users update:', users.length, 'users online');
      this.callbacks.onUsersUpdate(users);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.callbacks.onError(error);
    });
  }

  // Room methods
  joinRoom(roomId, user) {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return;
    }
    console.log('Joining room:', roomId, 'as', user.name);
    this.socket.emit('join-room', { roomId, user });
  }

  // Chat methods
  sendMessage(message) {
    if (!this.socket?.connected) return;
    this.socket.emit('chat-message', message);
  }

  sendTyping(data) {
    if (!this.socket?.connected) return;
    this.socket.emit('user-typing', data);
  }

  // Document methods
  joinDocument(documentId, user) {
    this.joinRoom('shared-doc', user);
  }

  sendDocumentChange(change) {
    if (!this.socket?.connected) return;
    this.socket.emit('document-change', change);
  }

  sendCursorMove(data) {
    if (!this.socket?.connected) return;
    this.socket.emit('cursor-move', data);
  }

  // Whiteboard methods
  joinWhiteboard(whiteboardId, user) {
    this.joinRoom('shared-board', user);
  }

  sendDrawingStart(data) {
    if (!this.socket?.connected) return;
    this.socket.emit('drawing-start', data);
  }

  sendDrawingMove(data) {
    if (!this.socket?.connected) return;
    this.socket.emit('drawing-move', data);
  }

  sendDrawingEnd() {
    if (!this.socket?.connected) return;
    this.socket.emit('drawing-end');
  }

  sendClearCanvas() {
    if (!this.socket?.connected) return;
    this.socket.emit('clear-canvas');
  }

  // Event handlers
  onConnectionStateChange(callback) {
    this.callbacks.onConnectionStateChange = callback;
  }

  onMessage(callback) {
    this.callbacks.onMessage = callback;
  }

  onChatHistory(callback) {
    this.callbacks.onChatHistory = callback;
  }

  onTyping(callback) {
    this.callbacks.onTyping = callback;
  }

  onDocumentChange(callback) {
    this.callbacks.onDocumentChange = callback;
  }

  onDocumentState(callback) {
    this.callbacks.onDocumentState = callback;
  }

  onCursorMove(callback) {
    this.callbacks.onCursorMove = callback;
  }

  onDrawingStart(callback) {
    this.callbacks.onDrawingStart = callback;
  }

  onDrawingMove(callback) {
    this.callbacks.onDrawingMove = callback;
  }

  onDrawingEnd(callback) {
    this.callbacks.onDrawingEnd = callback;
  }

  onWhiteboardState(callback) {
    this.callbacks.onWhiteboardState = callback;
  }

  onClearCanvas(callback) {
    this.callbacks.onClearCanvas = callback;
  }

  onUserJoin(callback) {
    this.callbacks.onUserJoin = callback;
  }

  onUserLeave(callback) {
    this.callbacks.onUserLeave = callback;
  }

  onUsersUpdate(callback) {
    this.callbacks.onUsersUpdate = callback;
  }

  onError(callback) {
    this.callbacks.onError = callback;
  }

  disconnect() {
    if (this.socket) {
      console.log('Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
    }
  }
}

// Create a singleton instance
const socketService = new SocketService();
export default socketService; 