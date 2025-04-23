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
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
      }
    },
    // API Configuration
    apiConfig: {
      baseUrl: "https://api.firstnationaltitle.com/api", 
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