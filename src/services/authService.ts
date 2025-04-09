import { PublicClientApplication, AuthenticationResult, AccountInfo } from "@azure/msal-browser";
import { config } from "../config";

// Initialize MSAL instance
const msalInstance = new PublicClientApplication(config.msalConfig);

// Function to handle login
export const login = async () => {
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

// Function to handle logout
export const logout = () => {
  const logoutRequest = {
    account: msalInstance.getActiveAccount() as AccountInfo,
  };
  
  return msalInstance.logout(logoutRequest);
};

// Function to get active account
export const getAccount = (): AccountInfo | null => {
  return msalInstance.getActiveAccount();
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
    console.error("Silent token acquisition failed, trying popup:", error);
    const response = await msalInstance.acquireTokenPopup(silentRequest);
    return response.accessToken;
  }
};

export default msalInstance;