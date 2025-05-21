import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { MsalProvider } from '@azure/msal-react';
import msalInstance from './services/authService';
import { config } from './config';
import App from './App';
import './index.css';
import './App.css';

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
    MuiTextField: {
      styleOverrides: {
        root: {
          background: 'none',
          boxShadow: 'none',
          border: 'none',
        },
      }
    }
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Handle the redirect before rendering the app
msalInstance.handleRedirectPromise()
  .then(response => {
    // If we got a successful authentication response, set the active account
    if (response !== null) {
      msalInstance.setActiveAccount(response.account);
    }
    
    // Now render the app with authentication state properly initialized
    root.render(
      // <React.StrictMode>
        <BrowserRouter>
          <MsalProvider instance={msalInstance}>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <App />
            </ThemeProvider>
          </MsalProvider>
        </BrowserRouter>
      // </React.StrictMode>
    );
  })
  .catch(error => {
    console.error("Error handling redirect:", error);
    
    // Even if there was an error, still render the app
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
  });