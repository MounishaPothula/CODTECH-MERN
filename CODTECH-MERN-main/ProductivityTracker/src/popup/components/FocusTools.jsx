import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Switch,
  FormControlLabel,
  CircularProgress,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Settings as SettingsIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

export default function FocusTools() {
  const [pomodoroState, setPomodoroState] = useState({
    isActive: false,
    isBreak: false,
    timeLeft: 0,
    totalSessions: 0
  });

  const [focusMode, setFocusMode] = useState({
    enabled: false,
    blockAllDistracting: true,
    allowedSites: []
  });

  const [settings, setSettings] = useState({
    timeManagement: {
      workSessionDuration: 25,
      breakDuration: 5,
      longBreakDuration: 15,
      sessionsBeforeLongBreak: 4,
    },
    focusMode: {
      enabled: false,
      blockAllDistracting: true,
      allowedSites: []
    }
  });
  const [newAllowedSite, setNewAllowedSite] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load settings and state
    chrome.storage.local.get(['settings'], (result) => {
      if (result.settings) {
        setSettings(result.settings);
        setFocusMode(result.settings.focusMode || {
          enabled: false,
          blockAllDistracting: true,
          allowedSites: []
        });
      }
      setIsLoading(false);
    });

    // Get initial Pomodoro state
    chrome.runtime.sendMessage({ action: 'getPomodoroState' }, (response) => {
      if (response) {
        setPomodoroState(response);
      }
    });

    // Set up timer update interval
    const interval = setInterval(() => {
      chrome.runtime.sendMessage({ action: 'getPomodoroState' }, (response) => {
        if (response) {
          setPomodoroState(response);
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleStartPomodoro = () => {
    chrome.runtime.sendMessage({ action: 'startPomodoro' });
  };

  const handleStopPomodoro = () => {
    chrome.runtime.sendMessage({ action: 'stopPomodoro' });
  };

  const handleFocusModeToggle = (event) => {
    const enabled = event.target.checked;
    const updatedFocusMode = { ...focusMode, enabled };
    setFocusMode(updatedFocusMode);
    
    chrome.runtime.sendMessage({ 
      action: 'toggleFocusMode',
      enabled
    }, (response) => {
      if (!response?.success) {
        // Revert the state if the update failed
        setFocusMode(prev => ({ ...prev, enabled: !enabled }));
      }
    });
  };

  const handleAddAllowedSite = () => {
    if (!newAllowedSite) return;

    try {
      const url = new URL(newAllowedSite.startsWith('http') ? newAllowedSite : `http://${newAllowedSite}`);
      const hostname = url.hostname;
      
      const updatedSites = [...focusMode.allowedSites, hostname];
      const updatedFocusMode = { ...focusMode, allowedSites: updatedSites };
      
      chrome.runtime.sendMessage({
        action: 'updateFocusSettings',
        settings: updatedFocusMode
      }, (response) => {
        if (response.success) {
          setFocusMode(updatedFocusMode);
          setNewAllowedSite('');
        } else {
          alert('Failed to update allowed sites');
        }
      });
    } catch (e) {
      alert('Please enter a valid URL');
    }
  };

  const handleRemoveAllowedSite = (site) => {
    const updatedSites = focusMode.allowedSites.filter(s => s !== site);
    const updatedFocusMode = { ...focusMode, allowedSites: updatedSites };
    
    chrome.runtime.sendMessage({
      action: 'updateFocusSettings',
      settings: updatedFocusMode
    }, (response) => {
      if (response.success) {
        setFocusMode(updatedFocusMode);
      } else {
        alert('Failed to remove site');
      }
    });
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={2}>
        {/* Pomodoro Timer */}
        <Grid item xs={12}>
          <Paper 
            elevation={1}
            sx={{ 
              p: 2,
              border: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ flex: 1, color: 'text.primary' }}>
                Pomodoro Timer
              </Typography>
              <Tooltip title="Timer Settings">
                <IconButton 
                  onClick={() => setSettingsOpen(true)}
                  sx={{ color: 'primary.main' }}
                >
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography 
                variant="h3" 
                sx={{ 
                  fontFamily: 'monospace',
                  color: pomodoroState.isBreak ? 'success.main' : 'primary.main',
                  mb: 1
                }}
              >
                {formatTime(pomodoroState.timeLeft)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {pomodoroState.isBreak ? 'Break Time' : 'Work Time'} - Session {pomodoroState.totalSessions + 1}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              {!pomodoroState.isActive ? (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PlayArrow />}
                  onClick={handleStartPomodoro}
                  sx={{ minWidth: 120 }}
                >
                  Start
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Stop />}
                  onClick={handleStopPomodoro}
                  sx={{ minWidth: 120 }}
                >
                  Stop
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Focus Mode */}
        <Grid item xs={12}>
          <Paper 
            elevation={1}
            sx={{ 
              p: 2,
              border: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper'
            }}
          >
            <Typography variant="h6" gutterBottom color="text.primary">
              Focus Mode
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={focusMode.enabled}
                  onChange={handleFocusModeToggle}
                  color="primary"
                />
              }
              label={
                <Typography color="text.primary">
                  {focusMode.enabled ? 'Focus Mode Active' : 'Focus Mode Disabled'}
                </Typography>
              }
            />

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom color="text.secondary">
                Allowed Websites During Focus Mode
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Enter website URL"
                  value={newAllowedSite}
                  onChange={(e) => setNewAllowedSite(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddAllowedSite()}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main',
                      },
                    },
                  }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleAddAllowedSite}
                >
                  Add
                </Button>
              </Box>

              <List sx={{ bgcolor: 'background.default', borderRadius: 1 }}>
                {focusMode.allowedSites.map((site) => (
                  <ListItem 
                    key={site}
                    sx={{
                      borderBottom: 1,
                      borderColor: 'divider',
                      '&:last-child': {
                        borderBottom: 0,
                      },
                    }}
                  >
                    <ListItemText 
                      primary={site}
                      primaryTypographyProps={{
                        color: 'text.primary',
                      }}
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        onClick={() => handleRemoveAllowedSite(site)}
                        sx={{ color: 'error.main' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Settings Dialog */}
      <Dialog 
        open={settingsOpen} 
        onClose={() => setSettingsOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            boxShadow: 24,
          },
        }}
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          Timer Settings
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Work Duration (minutes)"
                value={settings.timeManagement.workSessionDuration}
                onChange={(e) => {
                  const updatedSettings = {
                    ...settings,
                    timeManagement: {
                      ...settings.timeManagement,
                      workSessionDuration: parseInt(e.target.value)
                    }
                  };
                  setSettings(updatedSettings);
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Break Duration (minutes)"
                value={settings.timeManagement.breakDuration}
                onChange={(e) => {
                  const updatedSettings = {
                    ...settings,
                    timeManagement: {
                      ...settings.timeManagement,
                      breakDuration: parseInt(e.target.value)
                    }
                  };
                  setSettings(updatedSettings);
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: 'background.default' }}>
          <Button onClick={() => setSettingsOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={() => {
              chrome.storage.local.set({ settings });
              setSettingsOpen(false);
            }}
            color="primary"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 