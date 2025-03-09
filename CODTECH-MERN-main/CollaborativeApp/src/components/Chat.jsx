import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile } from 'lucide-react';
import socketService from '../services/socket';

function Chat({ user, darkMode }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef();
  const typingTimeoutRef = useRef();

  useEffect(() => {
    if (!user) return;

    // Join chat room
    socketService.joinRoom('shared-room', user);

    // Set up event listeners
    const messageHandler = (message) => {
      console.log('Received message:', message);
      setMessages((prev) => [...prev, message]);
    };

    const typingHandler = (typingInfo) => {
      if (typingInfo.user.id !== user.id) {
        setTypingUser(typingInfo.user);
        setIsTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          setTypingUser(null);
        }, 1000);
      }
    };

    const userJoinHandler = (joinedUser) => {
      console.log('User joined:', joinedUser.name);
      setOnlineUsers((prev) => {
        if (!prev.find(u => u.id === joinedUser.id)) {
          return [...prev, joinedUser];
        }
        return prev;
      });
    };

    const userLeaveHandler = (leftUser) => {
      console.log('User left:', leftUser.name);
      setOnlineUsers((prev) => prev.filter(u => u.id !== leftUser.id));
    };

    const chatHistoryHandler = (history) => {
      console.log('Received chat history:', history);
      setMessages(history);
    };

    const usersUpdateHandler = (users) => {
      console.log('Users update:', users);
      setOnlineUsers(users);
    };

    // Register event handlers
    socketService.onMessage(messageHandler);
    socketService.onTyping(typingHandler);
    socketService.onUserJoin(userJoinHandler);
    socketService.onUserLeave(userLeaveHandler);
    socketService.onChatHistory(chatHistoryHandler);
    socketService.onUsersUpdate(usersUpdateHandler);

    return () => {
      // Clean up event handlers
      socketService.onMessage(() => {});
      socketService.onTyping(() => {});
      socketService.onUserJoin(() => {});
      socketService.onUserLeave(() => {});
      socketService.onChatHistory(() => {});
      socketService.onUsersUpdate(() => {});
      clearTimeout(typingTimeoutRef.current);
    };
  }, [user]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      content: newMessage,
      sender: user,
      timestamp: new Date().toISOString(),
    };

    console.log('Sending message:', message);
    socketService.sendMessage(message);
    setNewMessage('');
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    socketService.sendTyping({ user, timestamp: Date.now() });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="p-4 border-b dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Chat
          </h2>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {onlineUsers.length} online
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender.id === user.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2 ${
                message.sender.id === user.id
                  ? 'bg-primary-500 text-white'
                  : darkMode
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="flex items-center justify-between space-x-2 mb-1">
                <span className="text-sm font-medium">{message.sender.name}</span>
                <span className="text-xs opacity-75">{formatTime(message.timestamp)}</span>
              </div>
              <p className="text-sm break-words">{message.content}</p>
            </div>
          </div>
        ))}
        {isTyping && typingUser && (
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex space-x-1">
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-100" />
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-200" />
            </div>
            <span>{typingUser.name} is typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t dark:border-gray-700">
        <div className="mb-2">
          <div className="flex flex-wrap gap-2">
            {onlineUsers.map((onlineUser) => (
              <div
                key={onlineUser.id}
                className={`flex items-center px-2 py-1 rounded-full text-xs ${
                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5" />
                {onlineUser.name}
              </div>
            ))}
          </div>
        </div>
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <button
            type="button"
            className={`p-2 rounded-lg ${
              darkMode
                ? 'hover:bg-gray-700 text-gray-400'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <Smile className="h-5 w-5" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type a message..."
            className={`flex-1 px-4 py-2 rounded-lg border ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
            } focus:outline-none focus:ring-2 focus:ring-primary-500`}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className={`p-2 rounded-lg ${
              newMessage.trim()
                ? 'bg-primary-500 text-white hover:bg-primary-600'
                : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
            } transition-colors duration-200`}
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chat; 