import { PublicClientApplication, AuthenticationResult, AccountInfo } from "@azure/msal-browser";
import { config } from "../config";

// Initialize MSAL instance
const msalInstance = new PublicClientApplication(config.msalConfig);

// Function to handle login with redirect
export const loginRedirect = async () => {
  try {
    const loginRequest = {
      scopes: config.apiConfig.scopes
    };
    
    return msalInstance.loginRedirect(loginRequest);
  } catch (error) {
    console.error("Error during login:", error);
    throw error;
  }
};

// Function to handle login with popup (keeping for reference)
export const loginPopup = async () => {
  try {
    const loginRequest = {
      scopes: config.apiConfig.scopes
    };
    
    return await msalInstance.loginPopup(loginRequest);
  } catch (error) {
    console.error("Error during login:", error);
    throw error;
  }
};

// FIXED: Function to handle logout with proper error handling
export const logout = () => {
  try {
    console.log('Starting logout process...');
    
    const account = msalInstance.getActiveAccount();
    
    if (account) {
      console.log('Active account found, logging out:', account.username);
      
      const logoutRequest = {
        account: account,
        postLogoutRedirectUri: window.location.origin + '/login',
        mainWindowRedirectUri: window.location.origin + '/login'
      };
      
      // Clear the active account first
      msalInstance.setActiveAccount(null);
      
      // Use logoutRedirect for better reliability
      return msalInstance.logoutRedirect(logoutRequest);
    } else {
      console.log('No active account found, redirecting to login');
      // If no active account, just redirect to login
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Logout error:', error);
    // Fallback: force redirect to login
    forceLogout();
  }
};

// NEW: Force logout utility function
export const forceLogout = () => {
  try {
    console.log('Force logout initiated...');
    
    // Clear all local storage and session storage
    sessionStorage.clear();
    localStorage.clear();
    
    // Clear MSAL active account
    msalInstance.setActiveAccount(null);
    
    // Note: MSAL v2 doesn't have clearCache() or removeAccount()
    // The cache will be cleared when the user logs in again
    // or when the tokens expire
    
    // Force redirect to login
    window.location.href = '/login';
  } catch (error) {
    console.error('Force logout error:', error);
    // Ultimate fallback - reload the page
    window.location.reload();
  }
};

// Function to get active account
export const getAccount = (): AccountInfo | null => {
  return msalInstance.getActiveAccount();
};

// Function to handle the redirect response
export const handleRedirectResponse = async () => {
  try {
    console.log("Handling redirect response...");
    const response = await msalInstance.handleRedirectPromise();
    console.log("Redirect response:", response);
    
    if (response) {
      console.log("Authentication successful, setting active account");
      return response.account;
    } else {
      console.log("No redirect response found");
      const account = msalInstance.getActiveAccount();
      console.log("Current active account:", account);
      return account;
    }
  } catch (error) {
    console.error("Error handling redirect:", error);
    throw error;
  }
};

// Function to acquire access token
export const acquireToken = async (): Promise<string> => {
  const account = msalInstance.getActiveAccount();
  
  if (!account) {
    throw new Error("No active account! Sign in required.");
  }
  
  const silentRequest = {
    scopes: config.apiConfig.scopes,
    account
  };
  
  try {
    const response: AuthenticationResult = await msalInstance.acquireTokenSilent(silentRequest);
    return response.accessToken;
  } catch (error) {
    console.error("Silent token acquisition failed, using redirect:", error);
    msalInstance.acquireTokenRedirect(silentRequest);
    return "";
  }
};

export default msalInstance;