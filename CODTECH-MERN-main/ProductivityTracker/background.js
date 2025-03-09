// Store active tab information
let activeTab = {
  id: null,
  url: null,
  startTime: null
};

// Store states with proper initialization
let blockedSites = [];
let siteSchedules = {};
let productivityScore = 100;
let pomodoroState = {
  isActive: false,
  isBreak: false,
  timeLeft: 0,
  totalSessions: 0
};

// Default settings with all features
let settings = {
  notifications: {
    enabled: true,
    productivityAlerts: true,
    dailyReports: true,
    soundEnabled: true,
  },
  timeManagement: {
    dailyLimit: 120,
    workSessionDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsBeforeLongBreak: 4,
  },
  categories: {
    productive: ['github.com', 'stackoverflow.com', 'docs.google.com'],
    distracting: ['facebook.com', 'instagram.com', 'twitter.com', 'youtube.com'],
    learning: [],
    work: [],
    custom: [],
  },
  focusMode: {
    enabled: false,
    blockAllDistracting: true,
    allowedSites: [],
    strictMode: false
  },
  theme: {
    mode: 'light'
  }
};

// Initialize storage and settings with proper error handling
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['blockedSites', 'siteSchedules', 'productivityScore', 'settings'], (result) => {
    try {
      // Initialize with saved values or defaults
      blockedSites = result.blockedSites || [];
      siteSchedules = result.siteSchedules || {};
      productivityScore = result.productivityScore || 100;
      
      if (result.settings) {
        settings = {
          ...settings,
          ...result.settings,
          focusMode: {
            ...settings.focusMode,
            ...(result.settings.focusMode || {}),
            allowedSites: result.settings.focusMode?.allowedSites || []
          },
          categories: {
            ...settings.categories,
            ...(result.settings.categories || {})
          }
        };
      }
      
      // Ensure settings are saved
      chrome.storage.local.set({ 
        settings,
        blockedSites,
        siteSchedules,
        productivityScore
      });
    } catch (error) {
      console.error('Error initializing settings:', error);
    }
  });
});

// Track tab activation with error handling
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      handleTabChange(tab);
    }
  } catch (error) {
    console.error('Error handling tab activation:', error);
  }
});

// Track tab URL updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    handleTabChange(tab);
  }
});

// Handle tab changes with improved error handling
async function handleTabChange(tab) {
  try {
    if (activeTab.id) {
      await saveTimeSpent();
    }

    // Skip invalid URLs or chrome:// URLs
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.includes(chrome.runtime.id)) {
      return;
    }
    
    const hostname = getHostname(tab.url);
    if (!hostname) return;

    // Update productivity score based on site category
    updateProductivityScoreForSite(hostname);

    activeTab = {
      id: tab.id,
      url: hostname,
      startTime: Date.now()
    };

    // Check if site should be blocked
    const blockResult = shouldBlockSite(hostname);
    if (blockResult.blocked) {
      chrome.tabs.update(tab.id, { url: chrome.runtime.getURL('blocked.html') });
    }
  } catch (error) {
    console.error('Error in handleTabChange:', error);
  }
}

function shouldBlockSite(hostname) {
  const currentHour = new Date().getHours();
  let blockReason = '';

  try {
    // Check regular blocking first
    if (blockedSites.includes(hostname)) {
      blockReason = 'This site has been manually blocked to help you stay productive.';
      return { blocked: true, reason: blockReason };
    }

    // Check scheduled blocking
    const schedule = siteSchedules[hostname];
    if (schedule) {
      if (schedule.some(timeSlot => {
        const [start, end] = timeSlot.split('-').map(Number);
        return currentHour >= start && currentHour < end;
      })) {
        blockReason = `This site is scheduled to be blocked during this time period (${currentHour}:00).`;
        return { blocked: true, reason: blockReason };
      }
    }

    // Check focus mode
    if (settings.focusMode.enabled) {
      // If site is in allowed sites list, allow it
      const isAllowed = settings.focusMode.allowedSites.some(
        allowedSite => hostname.includes(allowedSite.toLowerCase())
      );
      if (isAllowed) {
        return { blocked: false };
      }

      // If site is in distracting list, block it
      if (settings.categories.distracting.some(site => hostname.includes(site))) {
        blockReason = 'This site is marked as distracting and is blocked during Focus Mode.';
        return { blocked: true, reason: blockReason };
      }

      // If blockAllDistracting is true, block everything except allowed sites
      if (settings.focusMode.blockAllDistracting) {
        blockReason = 'Focus Mode is active. Only allowed sites can be accessed.';
        return { blocked: true, reason: blockReason };
      }
    }

    return { blocked: false };
  } catch (error) {
    console.error('Error in shouldBlockSite:', error);
    return { blocked: false };
  }
}

function getHostname(urlString) {
  try {
    const url = new URL(urlString);
    return url.hostname;
  } catch (error) {
    console.error('Invalid URL:', urlString);
    return null;
  }
}

function getSiteCategory(hostname) {
  try {
    if (settings.categories.productive.some(site => hostname.includes(site))) return 'productive';
    if (settings.categories.distracting.some(site => hostname.includes(site))) return 'distracting';
    if (settings.categories.learning.some(site => hostname.includes(site))) return 'learning';
    if (settings.categories.work.some(site => hostname.includes(site))) return 'work';
    return 'neutral';
  } catch (error) {
    console.error('Error in getSiteCategory:', error);
    return 'neutral';
  }
}

function updateProductivityScore(change) {
  productivityScore = Math.max(0, Math.min(100, productivityScore + change));
  chrome.storage.local.set({ productivityScore });
}

function updateProductivityScoreForSite(hostname) {
  const category = getSiteCategory(hostname);
  switch (category) {
    case 'productive':
      updateProductivityScore(2);
      break;
    case 'distracting':
      updateProductivityScore(-2);
      break;
    default:
      // Neutral sites don't affect score
      break;
  }
}

// Save time spent on the previous site
async function saveTimeSpent() {
  if (!activeTab.startTime || !activeTab.url) return;

  const timeSpent = Date.now() - activeTab.startTime;
  const date = new Date().toISOString().split('T')[0];

  chrome.storage.local.get(['timeTracking', 'categoryTracking'], (result) => {
    const timeTracking = result.timeTracking || {};
    const categoryTracking = result.categoryTracking || {};

    if (!timeTracking[date]) {
      timeTracking[date] = {};
      categoryTracking[date] = {
        productive: 0,
        neutral: 0,
        distracting: 0
      };
    }

    // Update time tracking
    if (!timeTracking[date][activeTab.url]) {
      timeTracking[date][activeTab.url] = 0;
    }
    timeTracking[date][activeTab.url] += timeSpent;

    // Update category tracking
    const category = getSiteCategory(activeTab.url);
    if (!categoryTracking[date][category]) {
      categoryTracking[date][category] = 0;
    }
    categoryTracking[date][category] += timeSpent;
    
    chrome.storage.local.set({ timeTracking, categoryTracking });
  });
}

// Message handling with improved error handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request);
  
  try {
    if (request.action === 'checkIfBlocked') {
      const hostname = getHostname(request.url);
      if (hostname) {
        const result = shouldBlockSite(hostname);
        sendResponse(result);
        if (result.blocked) {
          updateProductivityScore(-5);
        }
      } else {
        sendResponse({ blocked: false });
      }
    } else {
      switch (request.action) {
        case 'updateFocusMode':
          // Handle focus mode settings update
          settings.focusMode = {
            ...settings.focusMode,
            ...request.focusMode
          };
          
          // Ensure allowedSites is always an array
          if (!Array.isArray(settings.focusMode.allowedSites)) {
            settings.focusMode.allowedSites = [];
          }

          // Normalize all allowed sites
          settings.focusMode.allowedSites = settings.focusMode.allowedSites.map(
            site => normalizeUrl(site)
          );
          
          console.log('Updating focus mode settings:', settings.focusMode);
          
          chrome.storage.local.set({ settings }, () => {
            if (chrome.runtime.lastError) {
              console.error('Error saving focus mode settings:', chrome.runtime.lastError);
              sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
              if (settings.focusMode.enabled) {
                chrome.tabs.query({}, (tabs) => {
                  tabs.forEach(tab => {
                    if (tab.url && !tab.url.startsWith('chrome://')) {
                      chrome.tabs.reload(tab.id);
                    }
                  });
                });
              }
              sendResponse({ success: true, settings: settings });
            }
          });
          break;

        case 'addAllowedSite':
          const siteToAdd = normalizeUrl(request.site);
          if (!settings.focusMode.allowedSites.includes(siteToAdd)) {
            settings.focusMode.allowedSites.push(siteToAdd);
            chrome.storage.local.set({ settings }, () => {
              if (chrome.runtime.lastError) {
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
              } else {
                if (settings.focusMode.enabled) {
                  chrome.tabs.query({}, (tabs) => {
                    tabs.forEach(tab => {
                      if (tab.url && !tab.url.startsWith('chrome://')) {
                        chrome.tabs.reload(tab.id);
                      }
                    });
                  });
                }
                sendResponse({ success: true, allowedSites: settings.focusMode.allowedSites });
              }
            });
          } else {
            sendResponse({ success: false, error: 'Site already in allowed list' });
          }
          break;

        case 'removeAllowedSite':
          const siteToRemove = normalizeUrl(request.site);
          settings.focusMode.allowedSites = settings.focusMode.allowedSites.filter(
            site => site !== siteToRemove
          );
          chrome.storage.local.set({ settings }, () => {
            if (chrome.runtime.lastError) {
              sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
              if (settings.focusMode.enabled) {
                chrome.tabs.query({}, (tabs) => {
                  tabs.forEach(tab => {
                    if (tab.url && !tab.url.startsWith('chrome://')) {
                      chrome.tabs.reload(tab.id);
                    }
                  });
                });
              }
              sendResponse({ success: true, allowedSites: settings.focusMode.allowedSites });
            }
          });
          break;

        case 'getAllowedSites':
          sendResponse({ sites: settings.focusMode.allowedSites });
          break;

        case 'toggleFocusMode':
          settings.focusMode.enabled = request.enabled;
          chrome.storage.local.set({ settings }, () => {
            chrome.tabs.query({}, (tabs) => {
              tabs.forEach(tab => {
                if (tab.url && !tab.url.startsWith('chrome://')) {
                  chrome.tabs.reload(tab.id);
                }
              });
            });
            sendResponse({ success: true, enabled: settings.focusMode.enabled });
          });
          break;

        case 'updateSettings':
          // For other settings updates
          settings = { ...settings, ...request.settings };
          chrome.storage.local.set({ settings }, () => {
            sendResponse({ success: true, settings: settings });
          });
          break;

        case 'getSettings':
          sendResponse({ settings });
          break;

        case 'startPomodoro':
          pomodoroState.isBreak = false;
          pomodoroState.totalSessions = 0;
          startPomodoroSession();
          sendResponse({ success: true });
          break;

        case 'stopPomodoro':
          pomodoroState.isActive = false;
          chrome.action.setBadgeText({ text: '' });
          sendResponse({ success: true });
          break;

        case 'getPomodoroState':
          sendResponse(pomodoroState);
          break;

        default:
          sendResponse({ error: 'Unknown action' });
      }
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ error: error.message });
  }
  return true;
});

// Pomodoro Timer Functions
function startPomodoroSession() {
  const duration = pomodoroState.isBreak 
    ? (pomodoroState.totalSessions % settings.timeManagement.sessionsBeforeLongBreak === 0 
      ? settings.timeManagement.longBreakDuration 
      : settings.timeManagement.breakDuration)
    : settings.timeManagement.workSessionDuration;

  pomodoroState.timeLeft = duration * 60;
  pomodoroState.isActive = true;

  updatePomodoroTimer();
}

function updatePomodoroTimer() {
  if (!pomodoroState.isActive) return;

  if (pomodoroState.timeLeft > 0) {
    pomodoroState.timeLeft--;
    setTimeout(updatePomodoroTimer, 1000);
  } else {
    handlePomodoroSessionEnd();
  }

  // Update badge text
  const minutes = Math.floor(pomodoroState.timeLeft / 60);
  const seconds = pomodoroState.timeLeft % 60;
  chrome.action.setBadgeText({
    text: `${minutes}:${seconds.toString().padStart(2, '0')}`
  });
}

function handlePomodoroSessionEnd() {
  if (!pomodoroState.isBreak) {
    pomodoroState.totalSessions++;
  }
  
  pomodoroState.isBreak = !pomodoroState.isBreak;

  if (settings.notifications.enabled) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: pomodoroState.isBreak ? 'Take a Break!' : 'Back to Work!',
      message: pomodoroState.isBreak 
        ? 'Time for a refreshing break.' 
        : 'Break is over. Time to focus!'
    });

    if (settings.notifications.soundEnabled) {
      playNotificationSound();
    }
  }

  startPomodoroSession();
}

function playNotificationSound() {
  const audio = new Audio(chrome.runtime.getURL('notification.mp3'));
  audio.play();
}

async function generateDailyReport() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const date = yesterday.toISOString().split('T')[0];

  chrome.storage.local.get(['timeTracking', 'categoryTracking'], (result) => {
    if (result.timeTracking?.[date]) {
      const stats = result.timeTracking[date];
      const categories = result.categoryTracking[date];
      const totalTime = Object.values(stats).reduce((a, b) => a + b, 0);
      
      const productivePercentage = (categories.productive / totalTime * 100).toFixed(1);
      const distractingPercentage = (categories.distracting / totalTime * 100).toFixed(1);

      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Daily Productivity Report',
        message: `Yesterday's stats:\nTotal: ${Math.round(totalTime / 1000 / 60)}min\nProductive: ${productivePercentage}%\nDistracting: ${distractingPercentage}%`
      });
    }
  });
}

function checkProductivityAndNotify() {
  chrome.storage.local.get(['settings', 'timeTracking'], (result) => {
    const settings = result.settings || {};
    if (!settings.notifications) return;

    const date = new Date().toISOString().split('T')[0];
    const timeTracking = result.timeTracking?.[date] || {};
    const totalTime = Object.values(timeTracking).reduce((a, b) => a + b, 0);
    
    if (totalTime > settings.dailyLimit * 60 * 1000) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Daily Limit Reached',
        message: 'You have reached your daily browsing limit. Time to take a break!'
      });
    }
  });
}

// Set up alarms
chrome.alarms.create('dailyReset', { periodInMinutes: 1440 }); // 24 hours
chrome.alarms.create('productivityReminder', { periodInMinutes: 30 }); // 30 minutes
chrome.alarms.create('saveData', { periodInMinutes: 5 }); // Save data every 5 minutes

chrome.alarms.onAlarm.addListener((alarm) => {
  switch (alarm.name) {
    case 'dailyReset':
      generateDailyReport();
      break;
    case 'productivityReminder':
      checkProductivityAndNotify();
      break;
    case 'saveData':
      saveTimeSpent(); // Save current session data
      break;
  }
});

// Add navigation handling
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  // Skip if it's not the main frame
  if (details.frameId !== 0) return;
  
  // Get the tab
  chrome.tabs.get(details.tabId, (tab) => {
    if (chrome.runtime.lastError) return;
    
    // Handle the navigation
    handleTabChange(tab);
  });
});

// Helper function to normalize URLs
function normalizeUrl(url) {
  try {
    // If the URL doesn't start with http:// or https://, add https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    const urlObj = new URL(url);
    // Return just the hostname, lowercase
    return urlObj.hostname.toLowerCase();
  } catch (error) {
    // If URL parsing fails, return the original input lowercase
    return url.toLowerCase();
  }
} 