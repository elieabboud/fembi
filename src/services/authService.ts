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
    
    // Use redirectMethod instead of popup
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

// Function to handle the redirect response
export const handleRedirectResponse = async () => {
  try {
    console.log("Handling redirect response...");
    // Handle the redirect promise
    const response = await msalInstance.handleRedirectPromise();
    debugger;
    console.log("Redirect response:", response);
    
    // Check if we have a response
    if (response) {
      console.log("Authentication successful, setting active account");
      return response.account;
    } else {
      console.log("No redirect response found");
      // Even if no redirect response, check if we have an active account
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
    return ""; // This will not be reached as redirect will navigate away
  }
};

export default msalInstance;