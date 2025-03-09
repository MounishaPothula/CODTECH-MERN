import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Grid,
  Avatar,
  Tooltip,
  Divider,
  CircularProgress,
  Menu,
  MenuItem,
  Fade,
  useTheme as useMuiTheme,
} from '@mui/material';
import {
  Send as SendIcon,
  EmojiEmotions as EmojiIcon,
  AttachFile as AttachFileIcon,
  Check as CheckIcon,
  CheckCircle as CheckCircleIcon,
  MoreVert as MoreVertIcon,
  Reply as ReplyIcon,
  ContentCopy as CopyIcon,
  Search as SearchIcon,
  Info as InfoIcon,
  Phone as PhoneIcon,
  VideoCall as VideoCallIcon,
} from '@mui/icons-material';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';

const Message = React.memo(({ message, currentUser, onCopy }) => {
  const isOwn = message.sender === currentUser;
  
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        alignItems: 'center',
        flexDirection: isOwn ? 'row-reverse' : 'row',
        width: '100%',
        mb: 0.5,
      }}
    >
      <Avatar
        sx={{ 
          width: 24,
          height: 24,
          backgroundColor: isOwn ? 'primary.main' : 'secondary.main',
          fontSize: '0.75rem',
          fontWeight: 600,
        }}
      >
        {message.sender[0].toUpperCase()}
      </Avatar>
      <Box 
        sx={{ 
          maxWidth: '60%',
          backgroundColor: isOwn ? 'primary.main' : 'background.paper',
          color: isOwn ? 'primary.contrastText' : 'text.primary',
          py: 0.75,
          px: 1.5,
          borderRadius: 1.5,
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        {!isOwn && (
          <Typography 
            variant="caption"
            sx={{ 
              color: 'text.secondary',
              fontWeight: 500,
              fontSize: '0.75rem',
              mr: 0.5,
            }}
          >
            {message.sender}:
          </Typography>
        )}
        <Typography
          variant="body2"
          sx={{
            color: 'inherit',
            lineHeight: 1.2,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontSize: '0.875rem',
          }}
        >
          {message.text}
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          opacity: 0,
          transition: 'opacity 0.2s',
          '&:hover': {
            opacity: 1,
          },
        }}
      >
        <Tooltip title="Copy">
          <IconButton
            size="small"
            onClick={() => onCopy(message.text)}
            sx={{
              color: 'text.secondary',
              padding: 0.5,
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <CopyIcon sx={{ fontSize: '0.875rem' }} />
          </IconButton>
        </Tooltip>
        {isOwn && (
          <CheckCircleIcon 
            sx={{ fontSize: '0.875rem' }}
            color={message.status === 'read' ? 'primary' : 'action'} 
          />
        )}
      </Box>
    </Box>
  );
});

const MessageInput = React.memo(({ onSend, disabled }) => {
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message.trim());
      setMessage('');
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        gap: 2,
        alignItems: 'flex-end',
        p: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <TextField
        fullWidth
        multiline
        maxRows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
        disabled={disabled}
        placeholder="Send a message..."
        variant="outlined"
        sx={{
          flex: 1,
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'background.paper',
            borderRadius: 2,
          },
        }}
      />
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Tooltip title="Add emoji">
          <IconButton
            size="small"
            onClick={() => setShowEmoji(!showEmoji)}
            disabled={disabled}
            sx={{
              color: 'text.secondary',
              borderRadius: '50%',
            }}
          >
            <EmojiIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Attach file">
          <IconButton
            size="small"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            sx={{
              color: 'text.secondary',
              borderRadius: '50%',
            }}
          >
            <AttachFileIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files?.[0]) {
              onSend(`📎 ${e.target.files[0].name}`);
            }
          }}
        />
        <IconButton
          type="submit"
          disabled={!message.trim() || disabled}
          sx={{
            width: 45,
            height: 45,
            backgroundColor: message.trim() && !disabled ? 'primary.main' : 'action.disabledBackground',
            color: message.trim() && !disabled ? '#fff' : 'text.disabled',
            borderRadius: '50%',
            '&:hover': {
              backgroundColor: message.trim() && !disabled ? 'primary.dark' : 'action.disabledBackground',
            },
            '& .MuiSvgIcon-root': {
              fontSize: '1.5rem',
            },
          }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
});

const ChatRoom = ({ roomId }) => {
  const {
    messages,
    sendMessage,
    currentUser,
    typingUsers,
    setTyping,
    onlineUsers,
    availableRooms,
  } = useChat();

  const { mode } = useTheme();
  const theme = useMuiTheme();
  const messagesEndRef = useRef(null);

  const room = availableRooms.find(r => r.id === roomId);
  const roomMessages = messages[roomId] || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomMessages]);

  const handleSendMessage = (text) => {
    sendMessage(roomId, text);
  };

  const handleCopyMessage = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (!room) return null;

  return (
    <Box 
      sx={{ 
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          backgroundColor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Grid container alignItems="center" spacing={2}>
          <Grid item>
            <Avatar 
              sx={{ 
                width: 48, 
                height: 48,
                backgroundColor: 'primary.main',
                fontSize: '1.25rem',
                fontWeight: 600,
              }}
            >
              {room.name[0].toUpperCase()}
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {room.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: '#10b981',
                  boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.1)'
                }}
              />
              <Typography variant="body2" color="text.secondary">
                {onlineUsers.length} online
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          px: 2,
          py: 1,
          display: 'flex',
          flexDirection: 'column',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
            borderRadius: '3px',
          },
        }}
      >
        {roomMessages.map((message) => (
          <Message
            key={message.id}
            message={message}
            currentUser={currentUser}
            onCopy={handleCopyMessage}
          />
        ))}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <MessageInput
        onSend={handleSendMessage}
        disabled={!currentUser}
      />
    </Box>
  );
};

export default ChatRoom; 