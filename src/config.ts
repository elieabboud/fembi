// src/config.ts
const loadRuntimeConfig = async (): Promise<string> => {
  try {
    // Fetch the .env file directly
    const response = await fetch('/.env');
    const envContent = await response.text();
    
    // Parse .env file to find REACT_APP_BACKEND_URL
    const lines = envContent.split('\n');
    for (const line of lines) {
      if (line.startsWith('REACT_APP_BACKEND_URL=')) {
        const value = line.split('=')[1]?.trim();
        if (value) return value;
      }
    }
  } catch (error) {
    console.warn('Could not load runtime .env file:', error);
  }
  
  // Fallback to build-time env
  return process.env.REACT_APP_BACKEND_URL || "https://localhost:44349";
};
export const config = {
    // MSAL Configuration
    msalConfig: {
      auth: {
        clientId: "a562a01f-ff94-4e2f-a44a-572988520927",
        authority: "https://login.microsoftonline.com/e92a9830-3803-4b7c-8006-1d9ca42ddf4a",
        redirectUri: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
        navigateToLoginRequestUrl: true,
      },
      cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: false,
      }
    },
    // API Configuration
    apiConfig: {
      baseUrl: (async () => {
        const backendUrl = await loadRuntimeConfig();
        return backendUrl;
      })(),
      scopes: ["https://graph.microsoft.com/.default"]
    },
    // App Configuration
    appConfig: {
      appName: "First National Title & Insurance Services, Inc.",
      appShortName: "FNTIS",
      primaryColor: "#1a3c75", // Dark blue from the logo
      secondaryColor: "#D3323A" // Red color used in the app
    },
  };