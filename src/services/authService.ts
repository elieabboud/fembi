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

// 🔥 FIXED: Simple and reliable logout
export const logout = (): void => {
  try {
    console.log('authService: Starting logout...');
    
    const account = msalInstance.getActiveAccount();
    console.log('authService: Active account:', account?.username || 'None');
    
    // Clear the active account
    msalInstance.setActiveAccount(null);
    console.log('authService: Active account cleared');
    
    if (account) {
      console.log('authService: Performing logout redirect...');
      
      const logoutRequest = {
        account: account,
        postLogoutRedirectUri: window.location.origin + '/login'
      };
      
      // Use logoutRedirect - this will cause a page redirect
      msalInstance.logoutRedirect(logoutRequest);
      
    } else {
      console.log('authService: No active account, redirecting to login...');
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('authService: Logout error:', error);
    // Fallback: direct redirect
    window.location.href = '/login';
  }
};

// 🔥 IMPROVED: Enhanced force logout with better cleanup
export const forceLogout = async (): Promise<void> => {
  try {
    console.log('authService: Force logout initiated...');
    
    // 1. Clear MSAL active account
    msalInstance.setActiveAccount(null);
    console.log('authService: MSAL active account cleared');
    
    // 2. Try to clear MSAL cache if possible
    try {
      const accounts = msalInstance.getAllAccounts();
      console.log('authService: Found', accounts.length, 'accounts in cache');
      
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
      console.log('authService: Clearing all storage...');
      sessionStorage.clear();
      localStorage.clear();
    } catch (storageError) {
      console.warn('authService: Error clearing storage:', storageError);
    }
    
    // 4. Final fallback - redirect to login
    console.log('authService: Redirecting to login...');
    window.location.href = '/login';
    
  } catch (error) {
    console.error('authService: Force logout error:', error);
    
    // Ultimate fallback - reload the page to clear everything
    console.log('authService: Ultimate fallback - reloading page...');
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
    console.log("authService: Handling redirect response...");
    const response = await msalInstance.handleRedirectPromise();
    console.log("authService: Redirect response:", response);
    
    if (response) {
      console.log("authService: Authentication successful, setting active account");
      return response.account;
    } else {
      console.log("authService: No redirect response found");
      const account = msalInstance.getActiveAccount();
      console.log("authService: Current active account:", account);
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