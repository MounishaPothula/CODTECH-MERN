import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';

const ChatContext = createContext();
const socket = io('http://localhost:3001'); // Adjust the URL to match your server

export const ChatProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState({});
  const [availableRooms, setAvailableRooms] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});

  // Socket event listeners
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server');
      // Request initial data
      socket.emit('rooms:get');
    });

    socket.on('rooms:list', (rooms) => {
      setAvailableRooms(rooms);
    });

    socket.on('messages:list', ({ roomId, messageList }) => {
      setMessages(prev => ({
        ...prev,
        [roomId]: messageList
      }));
    });

    socket.on('message:new', ({ roomId, message }) => {
      setMessages(prev => ({
        ...prev,
        [roomId]: [...(prev[roomId] || []), message]
      }));
    });

    socket.on('users:online', (users) => {
      setOnlineUsers(users);
    });

    socket.on('user:typing', ({ roomId, user, isTyping }) => {
      setTypingUsers(prev => ({
        ...prev,
        [roomId]: isTyping 
          ? [...(prev[roomId] || []), user]
          : (prev[roomId] || []).filter(u => u !== user)
      }));
    });

    return () => {
      socket.off('connect');
      socket.off('rooms:list');
      socket.off('messages:list');
      socket.off('message:new');
      socket.off('users:online');
      socket.off('user:typing');
    };
  }, []);

  const login = useCallback((username) => {
    socket.emit('user:login', { username });
    setCurrentUser(username);
  }, []);

  const logout = useCallback(() => {
    socket.emit('user:logout');
    setCurrentUser(null);
    setActiveRoom(null);
  }, []);

  const createRoom = useCallback((name) => {
    const roomId = name.toLowerCase().replace(/\s+/g, '-');
    socket.emit('room:create', { id: roomId, name });
  }, []);

  const joinRoom = useCallback((roomId) => {
    socket.emit('room:join', { roomId });
    setActiveRoom(roomId);
    // Request messages for this room
    socket.emit('messages:get', { roomId });
  }, []);

  const sendMessage = useCallback((roomId, text) => {
    if (!currentUser || !roomId) return;
    
    const message = {
      id: Date.now().toString(),
      text,
      sender: currentUser,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    socket.emit('message:send', { roomId, message });
  }, [currentUser]);

  const setTyping = useCallback((roomId, isTyping) => {
    if (!currentUser || !roomId) return;
    socket.emit('user:typing', { roomId, isTyping });
  }, [currentUser]);

  const value = {
    currentUser,
    activeRoom,
    messages,
    availableRooms,
    onlineUsers,
    typingUsers,
    login,
    logout,
    createRoom,
    joinRoom,
    sendMessage,
    setTyping
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}; 