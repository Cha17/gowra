'use client';

import { useCallback, useState, useEffect } from 'react';
import { isAdmin, type User, authApi, tokenManager } from '../lib/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = tokenManager.getToken();
        if (token) {
          const result = await authApi.getCurrentUser(token);
          if (result.success && result.user) {
            setUser(result.user);
          } else {
            // Invalid token, remove it
            tokenManager.removeToken();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        tokenManager.removeToken();
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await authApi.login(email, password);
      
      if (result.success && result.user && result.token) {
        setUser(result.user);
        tokenManager.setToken(result.token);
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    setIsLoading(true);
    try {
      const result = await authApi.register(email, password, name);
      
      if (result.success && result.user && result.token) {
        setUser(result.user);
        tokenManager.setToken(result.token);
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Registration failed' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
      setUser(null);
      tokenManager.removeToken();
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Logout failed' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (name: string) => {
    try {
      const token = tokenManager.getToken();
      if (!token) {
        return { success: false, error: 'No authentication token' };
      }

      const result = await authApi.updateProfile(token, name);
      
      if (result.success && result.user) {
        setUser(result.user);
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Profile update failed' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Profile update failed' };
    }
  }, []);

  const checkIsAdmin = useCallback((user: User | null) => {
    return isAdmin(user);
  }, []);

  return {
    user,
    isLoading,
    isInitialized,
    login,
    register,
    logout,
    updateProfile,
    isAdmin: checkIsAdmin(user),
    isAuthenticated: !!user,
  };
}
