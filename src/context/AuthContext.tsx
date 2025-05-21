import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { AccountInfo, EventType } from '@azure/msal-browser';
import msalInstance, { getAccount, loginRedirect, logout, handleRedirectResponse } from '../services/authService';
import { User } from '../types/user';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isAdmin: boolean;
  login: () => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  isAdmin: true,
  login: async () => {},
  logout: () => {},
  loading: true
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        // Handle the redirect response if there is one
        const account = await handleRedirectResponse();
        if (account) {
          setIsAuthenticated(true);
          convertAccountToUser(account);
        } else {
          // Check if user is already logged in
          const currentAccount = getAccount();
          if (currentAccount) {
            setIsAuthenticated(true);
            convertAccountToUser(currentAccount);
          }
        }
      } catch (error) {
        console.error('Authentication initialization failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const convertAccountToUser = (account: AccountInfo): void => {
    const user: User = {
      id: account.localAccountId,
      fullName: account.name || 'Unknown User',
      email: account.username
    };
    setUser(user);
  };

  const handleLogin = async (): Promise<void> => {
    try {
      setLoading(true);
      // Use redirect method instead of popup
      await loginRedirect();
      // Note: we won't reach this point immediately as the page will redirect
    } catch (error) {
      console.error('Login failed:', error);
      setLoading(false);
    }
  };

  const handleLogout = (): void => {
    setLoading(true);
    logout();
    setIsAuthenticated(false);
    setUser(null);
    setLoading(false);
  };

  // In AuthContext.tsx, add this inside the AuthProvider:
useEffect(() => {
  // Subscribe to MSAL events
  const callbackId = msalInstance.addEventCallback((event) => {
    if (event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS || 
        event.eventType === EventType.LOGIN_SUCCESS) {
      console.log("Auth event:", event.eventType);
      
      // Update authenticated state when login succeeds
      if (event.payload) {
        setIsAuthenticated(true);
        const account = msalInstance.getActiveAccount();
        if (account) {
          convertAccountToUser(account);
        }
      }
    }
  });
  
  // Clean up subscription
  return () => {
    if (callbackId) {
      msalInstance.removeEventCallback(callbackId);
    }
  };
}, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        isAdmin,
        login: handleLogin,
        logout: handleLogout,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);