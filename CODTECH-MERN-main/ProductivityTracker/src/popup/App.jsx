import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  CircularProgress
} from '@mui/material';
import Dashboard from './components/Dashboard';
import BlockList from './components/BlockList';
import Settings from './components/Settings';
import FocusTools from './components/FocusTools';
import {
  Dashboard as DashboardIcon,
  Block as BlockIcon,
  Timer as TimerIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { createTheme } from '@mui/material/styles';

const createAppTheme = (darkMode = false) => {
  return createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#2196f3',
      },
      secondary: {
        main: '#ff9800',
      },
      background: {
        default: darkMode ? '#121212' : '#f5f5f5',
        paper: darkMode ? '#1e1e1e' : '#ffffff',
      },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            minHeight: 48,
          },
        },
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h6: {
        fontWeight: 500,
      },
      button: {
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 8,
    },
  });
};

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ padding: '16px 0' }}>
      {value === index && children}
    </div>
  );
}

const defaultSettings = {
  notifications: {
    enabled: true,
    productivityAlerts: true,
    dailyReports: true,
    soundEnabled: true,
    alertFrequency: 30,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  },
  timeManagement: {
    dailyLimit: 120,
    workSessionDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsBeforeLongBreak: 4,
    autoStartBreaks: true,
    autoStartNextSession: false,
    workDays: [1, 2, 3, 4, 5],
    workHours: {
      start: '09:00',
      end: '17:00'
    }
  },
  categories: {
    productive: ['github.com', 'stackoverflow.com', 'docs.google.com'],
    distracting: ['facebook.com', 'instagram.com', 'twitter.com', 'youtube.com'],
    learning: ['coursera.org', 'udemy.com', 'edx.org'],
    work: [],
    custom: [],
    autoCategorizationEnabled: true,
    uncategorizedAsNeutral: true
  },
  theme: {
    darkMode: false
  },
  focusMode: {
    enabled: false,
    blockAllDistracting: true,
    allowedSites: [],
    strictMode: false,
    showMotivationalQuotes: true,
    breakReminders: true,
    soundEffects: true,
    whiteNoise: false
  },
  privacy: {
    collectAnonymousStats: true,
    localDataOnly: false,
    dataRetentionDays: 30,
    backupFrequency: 'weekly'
  }
};

const mergeSettings = (source, target) => {
  // Start with default settings
  const merged = JSON.parse(JSON.stringify(defaultSettings));
  
  // Deep merge with target settings
  if (target) {
    // Merge notifications
    if (target.notifications) {
      merged.notifications = {
        ...merged.notifications,
        ...target.notifications,
        quietHours: {
          ...merged.notifications.quietHours,
          ...(target.notifications.quietHours || {})
        }
      };
    }

    // Merge timeManagement
    if (target.timeManagement) {
      merged.timeManagement = {
        ...merged.timeManagement,
        ...target.timeManagement,
        workHours: {
          ...merged.timeManagement.workHours,
          ...(target.timeManagement.workHours || {})
        },
        workDays: [...(target.timeManagement.workDays || merged.timeManagement.workDays)]
      };
    }

    // Merge categories
    if (target.categories) {
      merged.categories = {
        ...merged.categories,
        productive: [...(target.categories.productive || merged.categories.productive)],
        distracting: [...(target.categories.distracting || merged.categories.distracting)],
        learning: [...(target.categories.learning || merged.categories.learning)],
        work: [...(target.categories.work || merged.categories.work)],
        custom: [...(target.categories.custom || merged.categories.custom)],
        autoCategorizationEnabled: target.categories.autoCategorizationEnabled ?? merged.categories.autoCategorizationEnabled,
        uncategorizedAsNeutral: target.categories.uncategorizedAsNeutral ?? merged.categories.uncategorizedAsNeutral
      };
    }

    // Merge focusMode
    if (target.focusMode) {
      merged.focusMode = {
        ...merged.focusMode,
        ...target.focusMode,
        allowedSites: [...(target.focusMode.allowedSites || merged.focusMode.allowedSites)]
      };
    }

    // Merge theme
    if (target.theme) {
      merged.theme = {
        ...merged.theme,
        darkMode: target.theme.darkMode ?? merged.theme.darkMode
      };
    }

    // Merge privacy
    if (target.privacy) {
      merged.privacy = {
        ...merged.privacy,
        ...target.privacy
      };
    }
  }

  return merged;
};

export default function App() {
  const [value, setValue] = useState(0);
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(defaultSettings);
  const [theme, setTheme] = useState(createAppTheme(false));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load initial stats and settings
    chrome.storage.local.get(['timeTracking', 'settings'], (result) => {
      if (result.timeTracking) {
        const today = new Date().toISOString().split('T')[0];
        setStats(result.timeTracking[today] || {});
      }
      
      // Always merge with default settings, even if no settings exist
      const newSettings = mergeSettings(defaultSettings, result.settings || {});
      setSettings(newSettings);
      setTheme(createAppTheme(newSettings.theme.darkMode));
      
      // Save merged settings back to storage to ensure consistency
      chrome.storage.local.set({ settings: newSettings });
      
      setIsLoading(false);
    });

    // Listen for settings changes
    const handleStorageChange = (changes) => {
      if (changes.settings) {
        const newSettings = mergeSettings(defaultSettings, changes.settings.newValue || {});
        setSettings(newSettings);
        setTheme(createAppTheme(newSettings.theme.darkMode));
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleThemeChange = (isDark) => {
    const newSettings = {
      ...settings,
      theme: {
        darkMode: isDark
      }
    };
    setSettings(newSettings);
    setTheme(createAppTheme(isDark));
    chrome.storage.local.set({ settings: newSettings });
  };

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        width: '100%', 
        height: '100%', 
        bgcolor: 'background.default',
        minWidth: '350px'
      }}>
        <Paper sx={{ 
          width: '100%', 
          minHeight: '500px',
          boxShadow: 'none',
          borderRadius: 0,
          overflow: 'hidden'
        }}>
          <Typography 
            variant="h6" 
            sx={{ 
              p: 2, 
              textAlign: 'center',
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: 'primary.main',
              color: 'primary.contrastText'
            }}
          >
            Productivity Tracker
          </Typography>
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={value} 
              onChange={handleChange} 
              variant="fullWidth"
              sx={{
                bgcolor: 'background.paper',
                '& .MuiTab-root': {
                  minHeight: '48px',
                  fontSize: '0.875rem'
                },
                '& .Mui-selected': {
                  color: 'primary.main',
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: 'primary.main',
                }
              }}
            >
              <Tab icon={<DashboardIcon />} label="Dashboard" />
              <Tab icon={<TimerIcon />} label="Focus" />
              <Tab icon={<BlockIcon />} label="Block" />
              <Tab icon={<SettingsIcon />} label="Settings" />
            </Tabs>
          </Box>

          <Box sx={{ p: 2, bgcolor: 'background.default' }}>
            <TabPanel value={value} index={0}>
              <Dashboard stats={stats} />
            </TabPanel>
            <TabPanel value={value} index={1}>
              <FocusTools />
            </TabPanel>
            <TabPanel value={value} index={2}>
              <BlockList />
            </TabPanel>
            <TabPanel value={value} index={3}>
              <Settings settings={settings} onThemeChange={handleThemeChange} />
            </TabPanel>
          </Box>
        </Paper>
      </Box>
    </ThemeProvider>
  );
} 