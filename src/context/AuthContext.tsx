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

  useEffect(() => {
    // Prevent double execution in development
    if (hasInitialized.current) {
      return;
    }
    
    hasInitialized.current = true;
    const initializeAuth = async () => {
      setLoading(true);
      
      try {
        // Handle redirect response first
        const account = await handleRedirectResponse();
        
        if (account) {
          setIsAuthenticated(true);
          convertAccountToUser(account);
          
          // Check admin status
          const adminStatus = await checkAdminStatus();
          setIsAdmin(adminStatus);
          
        } else {
          // Check for existing account
          const currentAccount = getAccount();
          
          if (currentAccount) {
            setIsAuthenticated(true);
            convertAccountToUser(currentAccount);
            
            const adminStatus = await checkAdminStatus();
            setIsAdmin(adminStatus);
            
          } else {
            setIsAuthenticated(false);
            setUser(null);
            setIsAdmin(false);
          }
        }
      } catch (error) {
        setIsAuthenticated(false);
        setUser(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [checkAdminStatus, convertAccountToUser]);

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
    loading
  }), [isAuthenticated, user, isAdmin, handleLogin, handleLogout, loading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);