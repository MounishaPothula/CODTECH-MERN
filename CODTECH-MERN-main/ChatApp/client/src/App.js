import React, { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Typography,
  Divider,
  Button,
  Avatar,
  Tooltip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Menu as MenuIcon,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
  Delete as DeleteIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { ThemeProvider } from './context/ThemeContext';
import { ChatProvider, useChat } from './context/ChatContext';
import Login from './components/Login';
import ChatRoom from './components/ChatRoom';

const DRAWER_WIDTH = 280;

const ChatApp = () => {
  const [openNewRoomDialog, setOpenNewRoomDialog] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const {
    currentUser,
    activeRoom,
    joinRoom,
    createRoom,
    availableRooms,
    logout,
  } = useChat();

  const handleCreateRoom = () => {
    if (newRoomName.trim()) {
      createRoom(newRoomName.trim());
      setNewRoomName('');
      setOpenNewRoomDialog(false);
    }
  };

  if (!currentUser) {
    return <Login />;
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            backgroundColor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
            borderRadius: 0,
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenNewRoomDialog(true)}
            sx={{
              justifyContent: 'flex-start',
              backgroundColor: 'background.paper',
              color: 'text.primary',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none',
              borderRadius: 1,
              '&:hover': {
                backgroundColor: 'action.hover',
                boxShadow: 'none',
              },
              mb: 1,
            }}
          >
            New Room
          </Button>
        </Box>

        <Box sx={{ overflow: 'auto', flex: 1, px: 0 }}>
          <List sx={{ p: 0 }}>
            {availableRooms.map((room) => (
              <ListItem key={room.id} disablePadding>
                <ListItemButton
                  selected={activeRoom === room.id}
                  onClick={() => joinRoom(room.id)}
                  sx={{
                    borderRadius: 0,
                    py: 1.5,
                    px: 2,
                    '&.Mui-selected': {
                      backgroundColor: 'action.selected',
                      '&:hover': {
                        backgroundColor: 'action.selected',
                      },
                    },
                  }}
                >
                  <ListItemText
                    primary={room.name}
                    primaryTypographyProps={{
                      noWrap: true,
                      fontSize: '0.875rem',
                    }}
                  />
                  <IconButton 
                    size="small" 
                    sx={{ 
                      opacity: 0.7,
                      borderRadius: 0,
                      '&:hover': {
                        opacity: 1,
                      }
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        <Divider sx={{ borderColor: 'divider' }} />
        
        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 1.5,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'background.paper',
            }}
          >
            <Avatar
              sx={{
                width: 40,
                height: 40,
                fontSize: '1rem',
                bgcolor: 'primary.main',
                borderRadius: '50%',
              }}
            >
              {currentUser[0].toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography noWrap variant="body2" sx={{ fontWeight: 500 }}>
                {currentUser}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Online
              </Typography>
            </Box>
            <Tooltip title="Logout">
              <IconButton
                size="small"
                onClick={logout}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'error.main',
                  },
                }}
              >
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Drawer>

      {/* Create Room Dialog */}
      <Dialog open={openNewRoomDialog} onClose={() => setOpenNewRoomDialog(false)}>
        <DialogTitle>Create New Room</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Room Name"
            fullWidth
            variant="outlined"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewRoomDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateRoom} variant="contained" disabled={!newRoomName.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: '100vh',
          overflow: 'hidden',
          bgcolor: 'background.default',
        }}
      >
        {activeRoom ? (
          <ChatRoom roomId={activeRoom} />
        ) : (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              p: 3,
              textAlign: 'center',
            }}
          >
            <Typography variant="h5" sx={{ color: 'text.primary', mb: 2 }}>
              Welcome to Chat
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 500 }}>
              Select a chat room from the sidebar or create a new one to start messaging
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenNewRoomDialog(true)}
              sx={{ mt: 2 }}
            >
              New chat
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <ChatProvider>
        <ChatApp />
      </ChatProvider>
    </ThemeProvider>
  );
};

export default App;
