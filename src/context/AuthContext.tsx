import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { AccountInfo } from '@azure/msal-browser';
import msalInstance, { getAccount, login, logout } from '../services/authService';
import { User } from '../types/user';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: () => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => {},
  logout: () => {},
  loading: true
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if user is already logged in
    const account = getAccount();
    if (account) {
      setIsAuthenticated(true);
      convertAccountToUser(account);
    }
    setLoading(false);
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
      const result = await login();
      if (result && result.account) {
        setIsAuthenticated(true);
        convertAccountToUser(result.account);
      }
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
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

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
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