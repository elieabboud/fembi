import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { AccountInfo, EventType } from '@azure/msal-browser';
import msalInstance, { getAccount, loginRedirect, logout, handleRedirectResponse, acquireToken, forceLogout } from '../services/authService';
import { User } from '../types/user';
import { bookingService } from '../services/bookingService';

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
  isAdmin: false,
  login: async () => {},
  logout: () => {},
  loading: true
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        // Handle the redirect response if there is one
        const account = await handleRedirectResponse();
        if (account) {
          setIsAuthenticated(true);
          convertAccountToUser(account);
          
          // Check admin status
          try {
            debugger;
            const isUserAdmin = await bookingService.getIsAdminUser();
            setIsAdmin(isUserAdmin === "true");
          } catch (error) {
            console.error('Error checking admin status:', error);
            setIsAdmin(false);
          }
        } else {
          // Check if user is already logged in
          const currentAccount = getAccount();
          if (currentAccount) {
            setIsAuthenticated(true);
            convertAccountToUser(currentAccount);
            
            try {
              debugger;
              const isUserAdmin = await bookingService.getIsAdminUser();
              setIsAdmin(isUserAdmin === "true");
            } catch (error) {
              console.error('Error checking admin status:', error);
              setIsAdmin(false);
            }
          }
        }
      } catch (error) {
        console.error('Authentication initialization failed:', error);
        // Clear any partial auth state on error
        setIsAuthenticated(false);
        setUser(null);
        setIsAdmin(false);
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
      await loginRedirect();
    } catch (error) {
      console.error('Login failed:', error);
      setLoading(false);
    }
  };

  // 🔥 FIXED: Simple and reliable logout
  const handleLogout = (): void => {
    console.log('AuthContext: Starting logout process...');
    
    // 1. IMMEDIATELY clear React state (this will update UI instantly)
    console.log('AuthContext: Clearing React state...');
    setIsAuthenticated(false);
    setUser(null);
    setIsAdmin(false);
    setLoading(false);
    
    // 2. Clear storage
    try {
      console.log('AuthContext: Clearing storage...');
      sessionStorage.clear();
      localStorage.clear();
    } catch (storageError) {
      console.warn('Error clearing storage:', storageError);
    }
    
    // 3. Call MSAL logout which will redirect
    console.log('AuthContext: Calling MSAL logout...');
    try {
      logout();
    } catch (error) {
      console.error('MSAL logout error:', error);
      // Fallback: direct redirect
      window.location.href = '/login';
    }
  };

  // Subscribe to MSAL events
  useEffect(() => {
    const callbackId = msalInstance.addEventCallback((event) => {
      console.log('MSAL Event:', event.eventType);
      
      if (event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS || 
          event.eventType === EventType.LOGIN_SUCCESS) {
        console.log("Auth event:", event.eventType);
        
        if (event.payload) {
          setIsAuthenticated(true);
          const account = msalInstance.getActiveAccount();
          if (account) {
            convertAccountToUser(account);
          }
        }
      }
      
      // Handle logout events
      if (event.eventType === EventType.LOGOUT_SUCCESS) {
        console.log('MSAL: Logout successful');
        setIsAuthenticated(false);
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
      }
      
      // Handle logout start event
      if (event.eventType === EventType.LOGOUT_START) {
        console.log('MSAL: Logout started');
        setLoading(false); // Don't show loading spinner during logout
      }
    });
    
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