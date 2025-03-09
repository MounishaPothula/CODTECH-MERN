import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Slider,
  Button,
  Paper,
  Divider,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Alert,
  Tooltip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  List,
  ListItem,
  ListItemText,
  useTheme,
} from '@mui/material';
import {
  Notifications,
  Schedule,
  Category,
  Palette,
  Info,
  ExpandMore,
  CloudUpload,
  CloudDownload,
  Add as AddIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Timer as TimerIcon,
  Work as WorkIcon,
  Block as BlockIcon
} from '@mui/icons-material';

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
  autoStart: {
    enabled: false,
    startTime: '09:00',
    endTime: '17:00',
    workDays: [1, 2, 3, 4, 5],
    autoStopEnabled: true
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

export default function Settings({ settings: propSettings, onThemeChange }) {
  const theme = useTheme();
  const [settings, setSettings] = useState({
    ...defaultSettings,
    ...(propSettings || {})
  });
  const [showSaved, setShowSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [newProductiveSite, setNewProductiveSite] = useState('');
  const [newDistractingSite, setNewDistractingSite] = useState('');
  const [newLearningSite, setNewLearningSite] = useState('');
  const [newWorkSite, setNewWorkSite] = useState('');

  useEffect(() => {
    if (propSettings) {
      setSettings(prev => ({
        ...prev,
        ...propSettings,
        theme: {
          darkMode: propSettings.theme?.darkMode || false
        }
      }));
    }
  }, [propSettings]);

  useEffect(() => {
    chrome.storage.local.get(['settings'], (result) => {
      if (result.settings) {
        setSettings(prev => ({
          ...prev,
          ...result.settings,
          theme: {
            darkMode: result.settings.theme?.darkMode || false
          }
        }));
      }
    });
  }, []);

  const handleChange = (section, field, value) => {
    const updatedSettings = {
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value
      }
    };
    
    chrome.storage.local.set({ settings: updatedSettings }, () => {
      setSettings(updatedSettings);
      showSavedMessage();
      setIsDirty(true);
    });
  };

  const showSavedMessage = () => {
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all tracking data? This cannot be undone.')) {
      chrome.storage.local.remove(['timeTracking', 'categoryTracking'], () => {
        alert('All tracking data has been cleared');
      });
    }
  };

  const exportData = () => {
    chrome.storage.local.get(null, (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `productivity-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          chrome.storage.local.set(data, () => {
            alert('Data imported successfully');
            window.location.reload();
          });
        } catch (error) {
          alert('Error importing data: Invalid file format');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSave = () => {
    chrome.storage.local.set({ settings }, () => {
      setIsDirty(false);
    });
  };

  const handleAddSite = (category, site) => {
    if (!site) return;
    
    const updatedCategories = {
      ...settings.categories,
      [category]: [...(settings.categories[category] || []), site]
    };
    handleChange('categories', category, updatedCategories[category]);
    
    // Reset the appropriate input field
    switch(category) {
      case 'productive':
        setNewProductiveSite('');
        break;
      case 'distracting':
        setNewDistractingSite('');
        break;
      case 'learning':
        setNewLearningSite('');
        break;
      case 'work':
        setNewWorkSite('');
        break;
    }
  };

  const handleRemoveSite = (category, site) => {
    const updatedCategories = {
      ...settings.categories,
      [category]: settings.categories[category].filter((s) => s !== site)
    };
    handleChange('categories', category, updatedCategories[category]);
  };

  const handleThemeChange = (isDark) => {
    const updatedSettings = {
      ...settings,
      theme: {
        darkMode: isDark
      }
    };
    
    // Save to storage and update state
    chrome.storage.local.set({ settings: updatedSettings }, () => {
      setSettings(updatedSettings);
      showSavedMessage();
      setIsDirty(true);
      // Notify parent component about theme change
      if (onThemeChange) {
        onThemeChange(isDark);
      }
    });
  };

  const renderSiteList = (category, sites = []) => {
    return (
      <List dense>
        {(sites || []).map((site) => (
          <ListItem key={site}>
            <ListItemText primary={site} />
            <IconButton 
              edge="end" 
              onClick={() => handleRemoveSite(category, site)}
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          </ListItem>
        ))}
      </List>
    );
  };

  if (!settings) return null;

  return (
    <Box>
      {showSaved && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Settings saved successfully
        </Alert>
      )}

      <Grid container spacing={2}>
        {/* General Settings */}
        <Grid item xs={12}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SettingsIcon />
                <Typography variant="h6">General Settings</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.theme.darkMode}
                        onChange={(e) => handleThemeChange(e.target.checked)}
                      />
                    }
                    label="Dark Mode"
                  />
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Switch between light and dark theme for better visibility
                  </Typography>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Notifications */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Notifications />
                <Typography variant="h6">Notifications</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.enabled}
                        onChange={(e) => handleChange('notifications', 'enabled', e.target.checked)}
                      />
                    }
                    label="Enable Notifications"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.productivityAlerts}
                        onChange={(e) => handleChange('notifications', 'productivityAlerts', e.target.checked)}
                        disabled={!settings.notifications.enabled}
                      />
                    }
                    label="Productivity Alerts"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.dailyReports}
                        onChange={(e) => handleChange('notifications', 'dailyReports', e.target.checked)}
                        disabled={!settings.notifications.enabled}
                      />
                    }
                    label="Daily Reports"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.soundEnabled}
                        onChange={(e) => handleChange('notifications', 'soundEnabled', e.target.checked)}
                        disabled={!settings.notifications.enabled}
                      />
                    }
                    label="Sound Notifications"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.quietHours.enabled}
                        onChange={(e) => handleChange('notifications', 'quietHours', {
                          ...settings.notifications.quietHours,
                          enabled: e.target.checked
                        })}
                        disabled={!settings.notifications.enabled}
                      />
                    }
                    label="Quiet Hours"
                  />
                </Grid>
                {settings.notifications.quietHours.enabled && (
                  <>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="time"
                        label="Start Time"
                        value={settings.notifications.quietHours.start}
                        onChange={(e) => handleChange('notifications', 'quietHours', {
                          ...settings.notifications.quietHours,
                          start: e.target.value
                        })}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="time"
                        label="End Time"
                        value={settings.notifications.quietHours.end}
                        onChange={(e) => handleChange('notifications', 'quietHours', {
                          ...settings.notifications.quietHours,
                          end: e.target.value
                        })}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Time Management */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Schedule />
                <Typography variant="h6">Time Management</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Daily Limit (minutes)"
                    value={settings.timeManagement.dailyLimit}
                    onChange={(e) => handleChange('timeManagement', 'dailyLimit', parseInt(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Work Session Duration (minutes)"
                    value={settings.timeManagement.workSessionDuration}
                    onChange={(e) => handleChange('timeManagement', 'workSessionDuration', parseInt(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Break Duration (minutes)"
                    value={settings.timeManagement.breakDuration}
                    onChange={(e) => handleChange('timeManagement', 'breakDuration', parseInt(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Long Break Duration (minutes)"
                    value={settings.timeManagement.longBreakDuration}
                    onChange={(e) => handleChange('timeManagement', 'longBreakDuration', parseInt(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.timeManagement.autoStartBreaks}
                        onChange={(e) => handleChange('timeManagement', 'autoStartBreaks', e.target.checked)}
                      />
                    }
                    label="Auto-start Breaks"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.timeManagement.autoStartNextSession}
                        onChange={(e) => handleChange('timeManagement', 'autoStartNextSession', e.target.checked)}
                      />
                    }
                    label="Auto-start Next Session"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Website Categories */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Category />
                <Typography variant="h6">Website Categories</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.categories.autoCategorizationEnabled}
                        onChange={(e) => handleChange('categories', 'autoCategorizationEnabled', e.target.checked)}
                      />
                    }
                    label="Auto-categorize New Websites"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.categories.uncategorizedAsNeutral}
                        onChange={(e) => handleChange('categories', 'uncategorizedAsNeutral', e.target.checked)}
                      />
                    }
                    label="Treat Uncategorized Sites as Neutral"
                  />
                </Grid>

                {/* Productive Sites */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" color="primary" gutterBottom>
                    Productive Sites
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Add productive site (e.g., docs.google.com)"
                      value={newProductiveSite}
                      onChange={(e) => setNewProductiveSite(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSite('productive', newProductiveSite)}
                    />
                    <Button
                      variant="contained"
                      onClick={() => handleAddSite('productive', newProductiveSite)}
                      startIcon={<AddIcon />}
                    >
                      Add
                    </Button>
                  </Box>
                  {renderSiteList('productive', settings.categories?.productive)}
                </Grid>

                {/* Distracting Sites */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" color="error" gutterBottom>
                    Distracting Sites
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Add distracting site (e.g., facebook.com)"
                      value={newDistractingSite}
                      onChange={(e) => setNewDistractingSite(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSite('distracting', newDistractingSite)}
                    />
                    <Button
                      variant="contained"
                      onClick={() => handleAddSite('distracting', newDistractingSite)}
                      startIcon={<AddIcon />}
                    >
                      Add
                    </Button>
                  </Box>
                  {renderSiteList('distracting', settings.categories?.distracting)}
                </Grid>

                {/* Learning Sites */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" color="info" gutterBottom>
                    Learning Sites
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Add learning site (e.g., coursera.org)"
                      value={newLearningSite}
                      onChange={(e) => setNewLearningSite(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSite('learning', newLearningSite)}
                    />
                    <Button
                      variant="contained"
                      onClick={() => handleAddSite('learning', newLearningSite)}
                      startIcon={<AddIcon />}
                    >
                      Add
                    </Button>
                  </Box>
                  {renderSiteList('learning', settings.categories?.learning)}
                </Grid>

                {/* Work Sites */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" color="success" gutterBottom>
                    Work Sites
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Add work site (e.g., workspace.company.com)"
                      value={newWorkSite}
                      onChange={(e) => setNewWorkSite(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSite('work', newWorkSite)}
                    />
                    <Button
                      variant="contained"
                      onClick={() => handleAddSite('work', newWorkSite)}
                      startIcon={<AddIcon />}
                    >
                      Add
                    </Button>
                  </Box>
                  {renderSiteList('work', settings.categories?.work)}
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Work Schedule */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WorkIcon />
                <Typography variant="h6">Work Schedule</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="time"
                    label="Work Start Time"
                    value={settings.timeManagement.workHours.start}
                    onChange={(e) => handleChange('timeManagement', 'workHours', {
                      ...settings.timeManagement.workHours,
                      start: e.target.value
                    })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="time"
                    label="Work End Time"
                    value={settings.timeManagement.workHours.end}
                    onChange={(e) => handleChange('timeManagement', 'workHours', {
                      ...settings.timeManagement.workHours,
                      end: e.target.value
                    })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Work Days</InputLabel>
                    <Select
                      multiple
                      value={settings.timeManagement.workDays}
                      onChange={(e) => handleChange('timeManagement', 'workDays', e.target.value)}
                      label="Work Days"
                      renderValue={(selected) => selected.map(day => 
                        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]
                      ).join(', ')}
                    >
                      {[
                        { value: 0, label: 'Sunday' },
                        { value: 1, label: 'Monday' },
                        { value: 2, label: 'Tuesday' },
                        { value: 3, label: 'Wednesday' },
                        { value: 4, label: 'Thursday' },
                        { value: 5, label: 'Friday' },
                        { value: 6, label: 'Saturday' }
                      ].map((day) => (
                        <MenuItem key={day.value} value={day.value}>
                          {day.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Focus Mode */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimerIcon />
                <Typography variant="h6">Focus Mode</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.focusMode.enabled}
                        onChange={(e) => handleChange('focusMode', 'enabled', e.target.checked)}
                      />
                    }
                    label="Enable Focus Mode"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.focusMode.blockAllDistracting}
                        onChange={(e) => handleChange('focusMode', 'blockAllDistracting', e.target.checked)}
                        disabled={!settings.focusMode.enabled}
                      />
                    }
                    label="Block All Distracting Sites"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.focusMode.strictMode}
                        onChange={(e) => handleChange('focusMode', 'strictMode', e.target.checked)}
                        disabled={!settings.focusMode.enabled}
                      />
                    }
                    label="Strict Mode (Cannot Disable During Session)"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.focusMode.showMotivationalQuotes}
                        onChange={(e) => handleChange('focusMode', 'showMotivationalQuotes', e.target.checked)}
                      />
                    }
                    label="Show Motivational Quotes"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Privacy & Data */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Info />
                <Typography variant="h6">Privacy & Data</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.privacy.collectAnonymousStats}
                        onChange={(e) => handleChange('privacy', 'collectAnonymousStats', e.target.checked)}
                      />
                    }
                    label="Collect Anonymous Usage Statistics"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.privacy.localDataOnly}
                        onChange={(e) => handleChange('privacy', 'localDataOnly', e.target.checked)}
                      />
                    }
                    label="Store Data Locally Only"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Data Retention Period (days)"
                    value={settings.privacy.dataRetentionDays}
                    onChange={(e) => handleChange('privacy', 'dataRetentionDays', parseInt(e.target.value))}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Data Management */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CloudDownload />
                <Typography variant="h6">Data Management</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="outlined"
                    startIcon={<CloudDownload />}
                    onClick={exportData}
                    fullWidth
                  >
                    Export Data
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="outlined"
                    startIcon={<CloudUpload />}
                    component="label"
                    fullWidth
                  >
                    Import Data
                    <input
                      type="file"
                      hidden
                      accept=".json"
                      onChange={importData}
                    />
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleClearData}
                    fullWidth
                  >
                    Clear All Data
                  </Button>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>

      {isDirty && (
        <Box sx={{ position: 'sticky', bottom: 0, p: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </Box>
      )}
    </Box>
  );
} 