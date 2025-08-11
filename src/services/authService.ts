import { PublicClientApplication, AuthenticationResult, AccountInfo } from "@azure/msal-browser";
import { config } from "../config";

// Initialize MSAL instance
const msalInstance = new PublicClientApplication(config.msalConfig);

// Function to handle login with redirect
export const loginRedirect = async (redirectStartPage?: string) => {
  try {
    const loginRequest = {
      scopes: config.apiConfig.scopes,
      redirectStartPage: redirectStartPage || window.location.href
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

// 🔥 FIXED: Simple and reliable logout
export const logout = (): void => {
  try {

    
    const account = msalInstance.getActiveAccount();    
    // Clear the active account
    msalInstance.setActiveAccount(null);
    
    if (account) {
      
      const logoutRequest = {
        account: account,
        postLogoutRedirectUri: window.location.origin + '/login'
      };
      
      // Use logoutRedirect - this will cause a page redirect
      msalInstance.logoutRedirect(logoutRequest);
      
    } else {
      window.location.href = '/login';
    }
  } catch (error) {
    // Fallback: direct redirect
    window.location.href = '/login';
  }
};

// 🔥 IMPROVED: Enhanced force logout with better cleanup
export const forceLogout = async (): Promise<void> => {
  try {
    
    // 1. Clear MSAL active account
    msalInstance.setActiveAccount(null);
    
    // 2. Try to clear MSAL cache if possible
    try {
      const accounts = msalInstance.getAllAccounts();
      
      // For each account, try to remove it
      for (const account of accounts) {
        try {
          await msalInstance.logoutRedirect({
            account: account,
            postLogoutRedirectUri: window.location.origin + '/login'
          });
          break; // Only need to logout one account
        } catch (logoutError) {
          console.warn('authService: Failed to logout account:', account.username, logoutError);
        }
      }
    } catch (cacheError) {
      console.warn('authService: Error accessing MSAL cache:', cacheError);
    }
    
    // 3. Clear all storage as fallback
    try {
      sessionStorage.clear();
      localStorage.clear();
    } catch (storageError) {
      console.warn('authService: Error clearing storage:', storageError);
    }
    
    // 4. Final fallback - redirect to login
    window.location.href = '/login';
    
  } catch (error) {
    console.error('authService: Force logout error:', error);
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
    const response = await msalInstance.handleRedirectPromise();
    
    if (response) {
      return response.account;
    } else {
      const account = msalInstance.getActiveAccount();
      return account;
    }
  } catch (error) {
    console.error("authService: Error handling redirect:", error);
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
    console.error("authService: Silent token acquisition failed, using redirect:", error);
    msalInstance.acquireTokenRedirect(silentRequest);
    return "";
  }
};

export default msalInstance;