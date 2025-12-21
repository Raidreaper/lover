import React, { useState, useEffect, ReactNode, useCallback } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { User, AuthContextType } from './AuthContextTypes';
import { AuthContext } from './AuthContextDefinition';
import logger from '../lib/logger';



interface AuthProviderProps {
  children: ReactNode;
}

// Token storage utility - using sessionStorage for better security (cleared on tab close)
const getStoredToken = (): string | null => {
  try {
    return sessionStorage.getItem('token');
  } catch (error) {
    logger.error('Failed to read token from storage:', error);
    return null;
  }
};

const setStoredToken = (token: string | null): void => {
  try {
    if (token) {
      sessionStorage.setItem('token', token);
    } else {
      sessionStorage.removeItem('token');
    }
  } catch (error) {
    logger.error('Failed to write token to storage:', error);
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = getStoredToken();
      
      if (storedToken) {
        try {
          const response = await fetch(API_ENDPOINTS.AUTH_ME, {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            setToken(storedToken);
          } else {
            // Token is invalid, remove it
            logger.log('Token validation failed, removing from storage');
            setStoredToken(null);
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          logger.error('Auth check failed:', error);
          setStoredToken(null);
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []); // Only run on mount, not when token changes





  const login = async (username: string, password: string) => {
    try {
      setError(null);
      const response = await fetch(API_ENDPOINTS.AUTH_LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setStoredToken(data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      setError(null);
      const response = await fetch(API_ENDPOINTS.AUTH_REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setStoredToken(data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Registration failed');
      throw error;
    }
  };

  const logout = () => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
    setError(null);
  };

    // Refresh authentication state (useful for page refreshes)
  const refreshAuth = useCallback(async () => {
    const storedToken = getStoredToken();
    if (storedToken && !user) {
      try {
        const response = await fetch(API_ENDPOINTS.AUTH_ME, {
          headers: {
            'Authorization': `Bearer ${storedToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setToken(storedToken);
          return true;
        }
      } catch (error) {
        logger.error('Auth refresh failed:', error);
      }
    }
    return false;
  }, [user]);

  // Listen for window focus to refresh authentication state
  useEffect(() => {
    const handleFocus = () => {
      if (token && user) {
        // User is already authenticated, just verify token is still valid
        refreshAuth();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [token, user, refreshAuth]);

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    refreshAuth,
    loading,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 