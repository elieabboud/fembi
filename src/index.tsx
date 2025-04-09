import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { MsalProvider } from '@azure/msal-react';
import msalInstance from './services/authService';
import { config } from './config';
import App from './App';

// Create theme based on config
const theme = createTheme({
  palette: {
    primary: {
      main: config.appConfig.primaryColor,
    },
    secondary: {
      main: config.appConfig.secondaryColor,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          textTransform: 'none',
        },
      },
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <MsalProvider instance={msalInstance}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </MsalProvider>
    </BrowserRouter>
  </React.StrictMode>
);