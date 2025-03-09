import { createTheme } from '@mui/material/styles';

export function createAppTheme(settings = {}) {
  const appearance = settings?.appearance || {};
  
  return createTheme({
    palette: {
      primary: {
        main: appearance.primaryColor || '#2196f3',
        light: appearance.primaryColorLight || '#64b5f6',
        dark: appearance.primaryColorDark || '#1976d2',
        contrastText: '#ffffff',
      },
      secondary: {
        main: appearance.secondaryColor || '#ff9800',
        light: appearance.secondaryColorLight || '#ffb74d',
        dark: appearance.secondaryColorDark || '#f57c00',
        contrastText: '#000000',
      },
      background: {
        default: appearance.backgroundColor || '#f5f5f5',
        paper: appearance.surfaceColor || '#ffffff',
      },
      text: {
        primary: appearance.textColor || '#212121',
        secondary: appearance.secondaryTextColor || '#757575',
      },
      error: {
        main: '#f44336',
      },
      success: {
        main: '#4caf50',
      },
      warning: {
        main: '#ff9800',
      },
      info: {
        main: '#2196f3',
      },
      mode: appearance.darkMode ? 'dark' : 'light',
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
      fontFamily: appearance.fontFamily || '"Roboto", "Helvetica", "Arial", sans-serif',
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
} 