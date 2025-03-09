import React, { useState } from 'react';
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  Avatar,
  useTheme,
} from '@mui/material';
import { Chat as ChatIcon } from '@mui/icons-material';
import { useChat } from '../context/ChatContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const { login } = useChat();
  const theme = useTheme();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      login(username.trim());
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        p: 3,
      }}
    >
      <Card
        elevation={theme.palette.mode === 'dark' ? 2 : 1}
        sx={{
          width: '100%',
          maxWidth: 400,
          p: 4,
          textAlign: 'center',
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              backgroundColor: 'primary.main',
              margin: '0 auto 16px',
            }}
          >
            <ChatIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Typography variant="h5" component="h1" gutterBottom>
            Welcome to Chat
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter your name to start chatting
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your name"
            variant="outlined"
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme.palette.mode === 'light' 
                  ? 'rgba(0, 0, 0, 0.02)' 
                  : 'rgba(255, 255, 255, 0.02)',
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={!username.trim()}
            sx={{
              py: 1.5,
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
              '&.Mui-disabled': {
                backgroundColor: theme.palette.mode === 'light'
                  ? 'rgba(0, 0, 0, 0.12)'
                  : 'rgba(255, 255, 255, 0.12)',
                color: theme.palette.mode === 'light'
                  ? 'rgba(0, 0, 0, 0.26)'
                  : 'rgba(255, 255, 255, 0.3)',
              },
            }}
          >
            Join Chat
          </Button>
        </form>
      </Card>
    </Box>
  );
};

export default Login; 