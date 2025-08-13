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
        console.log('🔄 Initializing auth state...');
        const token = tokenManager.getToken();
        const refreshToken = tokenManager.getRefreshToken();
        
        console.log('🔍 Found access token:', token ? 'yes' : 'no');
        console.log('🔍 Found refresh token:', refreshToken ? 'yes' : 'no');
        
        if (token && refreshToken) {
          // Check if access token is expired
          if (tokenManager.isTokenExpired(token)) {
            console.log('⏰ Access token expired, attempting refresh...');
            const refreshResult = await refreshAccessToken(refreshToken);
            if (refreshResult.success && refreshResult.token) {
              console.log('✅ Token refreshed successfully');
              tokenManager.setAccessToken(refreshResult.token);
              if (refreshResult.user) {
                setUser(refreshResult.user);
              }
            } else {
              console.log('❌ Token refresh failed, clearing tokens...');
              tokenManager.removeTokens();
            }
          } else {
            // Token is valid, get current user
            const result = await authApi.getCurrentUser(token);
            if (result.success && result.user) {
              console.log('✅ User authenticated:', result.user.email);
              setUser(result.user);
            } else {
              console.log('❌ Invalid token, attempting refresh...');
              const refreshResult = await refreshAccessToken(refreshToken);
              if (refreshResult.success && refreshResult.token) {
                console.log('✅ Token refreshed successfully');
                tokenManager.setAccessToken(refreshResult.token);
                if (refreshResult.user) {
                  setUser(refreshResult.user);
                }
              } else {
                console.log('❌ Token refresh failed, clearing tokens...');
                tokenManager.removeTokens();
              }
            }
          }
        } else {
          console.log('ℹ️  No tokens found, user not authenticated');
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        tokenManager.removeTokens();
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
        console.log('✅ Auth initialization completed');
      }
    };

    initializeAuth();
  }, []);

  // Token refresh function
  const refreshAccessToken = useCallback(async (refreshToken: string) => {
    try {
      console.log('🔄 Refreshing access token...');
      const result = await authApi.refreshToken(refreshToken);
      
      if (result.success && result.token) {
        console.log('✅ Access token refreshed successfully');
        return { success: true, token: result.token, user: result.user };
      } else {
        console.log('❌ Token refresh failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      return { success: false, error: 'Token refresh failed' };
    }
  }, []);

  // Enhanced API call wrapper with automatic token refresh
  const apiCallWithRefresh = useCallback(async <T>(
    apiCall: (token: string) => Promise<T>
  ): Promise<T> => {
    try {
      const token = tokenManager.getToken();
      if (!token) {
        throw new Error('No access token available');
      }

      // Check if token is expired
      if (tokenManager.isTokenExpired(token)) {
        console.log('⏰ Access token expired, refreshing...');
        const refreshToken = tokenManager.getRefreshToken();
        if (refreshToken) {
          const refreshResult = await refreshAccessToken(refreshToken);
          if (refreshResult.success && refreshResult.token) {
            tokenManager.setAccessToken(refreshResult.token);
            // Retry the API call with new token
            return await apiCall(refreshResult.token);
          } else {
            // Refresh failed, clear tokens and throw error
            tokenManager.removeTokens();
            setUser(null);
            throw new Error('Token refresh failed');
          }
        } else {
          // No refresh token, clear tokens and throw error
          tokenManager.removeTokens();
          setUser(null);
          throw new Error('No refresh token available');
        }
      }

      // Token is valid, make the API call
      return await apiCall(token);
    } catch (error) {
      console.error('❌ API call with refresh failed:', error);
      throw error;
    }
  }, [refreshAccessToken]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await authApi.login(email, password);
      
      if (result.success && result.user && result.token && result.refreshToken) {
        // Ensure isAdmin is included in the user object
        const userWithAdmin = {
          ...result.user,
          isAdmin: result.isAdmin || false
        };
        setUser(userWithAdmin);
        tokenManager.setTokens(result.token, result.refreshToken);
        return { success: true, isAdmin: result.isAdmin };
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
      
      if (result.success && result.user && result.token && result.refreshToken) {
        setUser(result.user);
        tokenManager.setTokens(result.token, result.refreshToken);
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
      console.log('🔄 Logging out...');
      
      // Call the logout API to revoke refresh token
      const result = await authApi.logout();
      
      // Clear local state regardless of API response
      console.log('🗑️  Clearing local auth state...');
      setUser(null);
      tokenManager.removeTokens();
      
      console.log('✅ Logout completed');
      return { success: true };
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Even if API fails, clear local state
      setUser(null);
      tokenManager.removeTokens();
      return { success: false, error: error instanceof Error ? error.message : 'Logout failed' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (name: string) => {
    try {
      const result = await apiCallWithRefresh(async (token: string) => {
        return await authApi.updateProfile(token, name);
      });
      
      if (result.success && result.user) {
        setUser(result.user);
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Profile update failed' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Profile update failed' };
    }
  }, [apiCallWithRefresh]);

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
    apiCallWithRefresh, // Expose for use in other components
  };
}
