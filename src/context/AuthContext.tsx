import React, { createContext, useState, useEffect, useContext, ReactNode, useMemo, useCallback, useRef } from 'react';
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
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  isAdmin: false,
  login: async () => {},
  logout: () => {},
  loading: true,
  refreshAuth: async () => {}
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  
  const hasInitialized = useRef(false);

  const handleLogin = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      await loginRedirect();
    } catch (error) {
      console.error('Login failed:', error);
      setLoading(false);
    }
  }, []);

  const handleLogout = useCallback((): void => {
    
    setIsAuthenticated(false);
    setUser(null);
    setIsAdmin(false);
    setLoading(false);
    
    try {
      sessionStorage.clear();
      localStorage.clear();
    } catch (storageError) {
      console.warn('Error clearing storage:', storageError);
    }
    
    // Call MSAL logout
    try {
      logout();
    } catch (error) {
      console.error('MSAL logout error:', error);
      window.location.href = '/login';
    }
  }, []);

  const checkAdminStatus = useCallback(async (): Promise<boolean> => {
    try {
      const response = await bookingService.getIsAdminUser();

      let isAdminResult = false;
      
      if (response === "true" || response === true || response === 1) {
        isAdminResult = true;
      } else if (typeof response === 'object' && response?.isAdmin) {
        isAdminResult = true;
      }
      
      return isAdminResult;
      
    } catch (error) {
      return false;
    }
  }, []);

  const convertAccountToUser = useCallback((account: AccountInfo): void => {
    const user: User = {
      id: account.localAccountId,
      fullName: account.name || 'Unknown User',
      email: account.username
    };
    setUser(user);
  }, []);

  const refreshAuth = useCallback(async (): Promise<void> => {
    try {
      
      const currentAccount = getAccount();
      
      if (currentAccount) {
        
        try {
          await acquireToken();
          
          setIsAuthenticated(true);
          convertAccountToUser(currentAccount);
          
          // Check admin status
          const adminStatus = await checkAdminStatus();
          setIsAdmin(adminStatus);
          
        } catch (tokenError) {
          console.warn('⚠️ Token refresh failed, clearing auth state:', tokenError);
          setIsAuthenticated(false);
          setUser(null);
          setIsAdmin(false);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('❌ Error refreshing auth:', error);
      setIsAuthenticated(false);
      setUser(null);
      setIsAdmin(false);
    }
  }, [checkAdminStatus, convertAccountToUser]);

  // Initial authentication setup
  useEffect(() => {
    // Prevent double execution in development
    if (hasInitialized.current) {
      return;
    }
    
    hasInitialized.current = true;
    const initializeAuth = async () => {
      setLoading(true);
      
      try {
        // Handle redirect response first (for returning from Microsoft login)
        const account = await handleRedirectResponse();
        
        if (account) {
          // User just logged in via redirect
          setIsAuthenticated(true);
          convertAccountToUser(account);
          
          // Check admin status
          const adminStatus = await checkAdminStatus();
          setIsAdmin(adminStatus);
          
        } else {
          // No redirect, check for existing authentication
          await refreshAuth();
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        setIsAuthenticated(false);
        setUser(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [checkAdminStatus, convertAccountToUser, refreshAuth]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Check if MSAL-related storage changed
      if (event.key?.startsWith('msal.') || event.key === 'msal.account.keys') {
        
        setTimeout(() => {
          refreshAuth();
        }, 100);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshAuth]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        
        if (!isAuthenticated) {
          refreshAuth();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, refreshAuth]);

  // MSAL event listeners
  useEffect(() => {
    const callbackId = msalInstance.addEventCallback((event) => {
      
      if (event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS || 
          event.eventType === EventType.LOGIN_SUCCESS) {
        
        if (event.payload) {
          setIsAuthenticated(true);
          const account = msalInstance.getActiveAccount();
          if (account) {
            convertAccountToUser(account);
            checkAdminStatus().then(setIsAdmin);
          }
        }
      }
      
      if (event.eventType === EventType.LOGOUT_SUCCESS) {
        setIsAuthenticated(false);
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
      }
      
      if (event.eventType === EventType.LOGOUT_START) {
        setLoading(false);
      }
    });
    
    return () => {
      if (callbackId) {
        msalInstance.removeEventCallback(callbackId);
      }
    };
  }, [convertAccountToUser, checkAdminStatus]);

  const contextValue = useMemo(() => ({
    isAuthenticated,
    user,
    isAdmin,
    login: handleLogin,
    logout: handleLogout,
    loading,
    refreshAuth
  }), [isAuthenticated, user, isAdmin, handleLogin, handleLogout, loading, refreshAuth]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);