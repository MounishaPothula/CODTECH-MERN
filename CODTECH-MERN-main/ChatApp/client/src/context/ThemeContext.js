import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || 'light';
  });

  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'light' ? '#2563eb' : '#60a5fa',
        light: mode === 'light' ? '#3b82f6' : '#93c5fd',
        dark: mode === 'light' ? '#1d4ed8' : '#2563eb',
        contrastText: '#ffffff',
      },
      secondary: {
        main: mode === 'light' ? '#4f46e5' : '#818cf8',
        light: mode === 'light' ? '#6366f1' : '#a5b4fc',
        dark: mode === 'light' ? '#4338ca' : '#4f46e5',
        contrastText: '#ffffff',
      },
      background: {
        default: mode === 'light' ? '#f8fafc' : '#0f172a',
        paper: mode === 'light' ? '#ffffff' : '#1e293b',
        message: mode === 'light' ? '#f1f5f9' : '#334155',
      },
      text: {
        primary: mode === 'light' ? '#0f172a' : '#f8fafc',
        secondary: mode === 'light' ? '#475569' : '#cbd5e1',
      },
      divider: mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
    },
    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 700 },
      h4: { fontWeight: 700 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 500 },
      subtitle2: { fontWeight: 500 },
      body1: { fontWeight: 400 },
      body2: { fontWeight: 400 },
      button: { fontWeight: 600 },
    },
    shape: {
      borderRadius: 16,
    },
    shadows: [
      'none',
      '0px 1px 3px rgba(0, 0, 0, 0.08)',
      '0px 2px 6px rgba(0, 0, 0, 0.08)',
      '0px 4px 12px rgba(0, 0, 0, 0.08)',
      ...Array(21).fill('none'),
    ],
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 12,
            padding: '8px 16px',
            fontWeight: 600,
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b',
              '& fieldset': {
                borderColor: mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
              },
              '&:hover fieldset': {
                borderColor: mode === 'light' ? '#2563eb' : '#60a5fa',
              },
              '&.Mui-focused fieldset': {
                borderColor: mode === 'light' ? '#2563eb' : '#60a5fa',
              },
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b',
            borderRadius: 16,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            padding: 24,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
          },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'light' ? '#2563eb' : '#60a5fa',
            color: '#ffffff',
          },
        },
      },
    },
  });

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}; 