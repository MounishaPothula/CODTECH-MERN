import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Switch,
  FormControlLabel,
  Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ScheduleIcon from '@mui/icons-material/Schedule';
import BlockIcon from '@mui/icons-material/Block';

export default function BlockList() {
  const [sites, setSites] = useState([]);
  const [schedules, setSchedules] = useState({});
  const [newSite, setNewSite] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState([]);
  const [isScheduled, setIsScheduled] = useState(false);

  useEffect(() => {
    // Load blocked sites and schedules
    chrome.storage.local.get(['blockedSites', 'siteSchedules'], (result) => {
      setSites(result.blockedSites || []);
      setSchedules(result.siteSchedules || {});
    });
  }, []);

  const handleAddSite = () => {
    if (!newSite) return;

    try {
      const url = new URL(newSite.startsWith('http') ? newSite : `http://${newSite}`);
      const hostname = url.hostname;
      
      if (sites.includes(hostname)) {
        alert('This site is already blocked');
        return;
      }

      const updatedSites = [...sites, hostname];
      chrome.storage.local.set({ blockedSites: updatedSites }, () => {
        setSites(updatedSites);
        setNewSite('');
      });
    } catch (e) {
      alert('Please enter a valid URL');
    }
  };

  const handleRemoveSite = (hostname) => {
    const updatedSites = sites.filter(site => site !== hostname);
    const updatedSchedules = { ...schedules };
    delete updatedSchedules[hostname];

    chrome.storage.local.set({ 
      blockedSites: updatedSites,
      siteSchedules: updatedSchedules
    }, () => {
      setSites(updatedSites);
      setSchedules(updatedSchedules);
    });
  };

  const handleScheduleClick = (hostname) => {
    setSelectedSite(hostname);
    setSelectedSchedule(schedules[hostname] || []);
    setIsScheduled(!!schedules[hostname]);
    setDialogOpen(true);
  };

  const handleSaveSchedule = () => {
    const updatedSchedules = { ...schedules };
    if (isScheduled) {
      updatedSchedules[selectedSite] = selectedSchedule;
    } else {
      delete updatedSchedules[selectedSite];
    }

    chrome.storage.local.set({ siteSchedules: updatedSchedules }, () => {
      setSchedules(updatedSchedules);
      setDialogOpen(false);
    });
  };

  const timeSlots = Array.from({ length: 24 }, (_, i) => ({
    value: `${i}-${i + 1}`,
    label: `${i.toString().padStart(2, '0')}:00 - ${(i + 1).toString().padStart(2, '0')}:00`
  }));

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Blocked Websites
      </Typography>

      <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Enter website URL"
          value={newSite}
          onChange={(e) => setNewSite(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddSite()}
        />
        <Button variant="contained" onClick={handleAddSite}>
          Add
        </Button>
      </Box>

      <List>
        {sites.map((site) => (
          <ListItem key={site}>
            <ListItemText 
              primary={site}
              secondary={schedules[site] ? 
                `Blocked during: ${schedules[site].map(slot => slot.split('-')[0].padStart(2, '0') + ':00').join(', ')}` : 
                'Always blocked'
              }
            />
            <ListItemSecondaryAction>
              <Tooltip title="Schedule blocking">
                <IconButton edge="end" onClick={() => handleScheduleClick(site)} sx={{ mr: 1 }}>
                  <ScheduleIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Remove site">
                <IconButton edge="end" onClick={() => handleRemoveSite(site)}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      {sites.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          No blocked websites yet
        </Typography>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule Blocking for {selectedSite}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                />
              }
              label="Enable scheduled blocking"
            />

            {isScheduled && (
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Blocked Hours</InputLabel>
                <Select
                  multiple
                  value={selectedSchedule}
                  onChange={(e) => setSelectedSchedule(e.target.value)}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip
                          key={value}
                          label={timeSlots.find(slot => slot.value === value)?.label}
                          size="small"
                        />
                      ))}
                    </Box>
                  )}
                >
                  {timeSlots.map((slot) => (
                    <MenuItem key={slot.value} value={slot.value}>
                      {slot.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveSchedule} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 