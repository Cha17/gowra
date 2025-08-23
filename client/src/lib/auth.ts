// Neon Auth API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

// Authentication utilities
export const isAdmin = (user: any) => {
  if (!user) return false;
  
  // Check if the user object has isAdmin property set to true
  return user.isAdmin === true;
};

// Authentication status types
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

// User type
export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  created_at: string;
  updated_at: string;
  isAdmin?: boolean;
  // Organizer role fields
  role?: 'user' | 'organizer';
  organization_name?: string;
  organization_type?: string;
  event_types?: string[];
  organization_description?: string;
  organization_website?: string;
  organizer_since?: string;
}

// API response types
export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
  refreshToken?: string;
  error?: string;
  isAdmin?: boolean;
  // For upgrade response
  needsUpgrade?: boolean;
  newToken?: string;
}

// Refresh token response type
export interface RefreshResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
  error?: string;
}

// API functions
export const authApi = {
  // Register user
  async register(email: string, password: string, name?: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  },

  // Login user
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  },

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<RefreshResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  },

  // Get current user
  async getCurrentUser(token: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  },

  // Update user profile
  async updateProfile(token: string, name: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  },

  // Logout (revoke refresh token)
  async logout(): Promise<AuthResponse> {
    try {
      const token = tokenManager.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers,
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  },

  // Upgrade user to organizer
  async upgradeToOrganizer(upgradeData: {
    organization_name: string;
    organization_type: string;
    event_types: string[];
    organization_description?: string;
    organization_website?: string;
  }, token?: string): Promise<AuthResponse> {
    try {
      const authToken = token || tokenManager.getToken();
      if (!authToken) {
        return {
          success: false,
          error: 'No authentication token found',
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/upgrade-to-organizer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(upgradeData),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please try again.',
      };
    }
  },
};

// Token management with refresh token support
export const tokenManager = {
  // Store tokens in localStorage
  setTokens(accessToken: string, refreshToken: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      console.log('💾 Tokens stored in localStorage');
    }
  },

  // Store access token only (for refresh scenarios)
  setAccessToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      console.log('💾 Access token updated in localStorage');
    }
  },

  // Get access token from localStorage
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      console.log('🔍 Access token retrieved from localStorage:', token ? 'exists' : 'not found');
      return token;
    }
    return null;
  },

  // Get refresh token from localStorage
  getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('refresh_token');
      console.log('🔍 Refresh token retrieved from localStorage:', token ? 'exists' : 'not found');
      return token;
    }
    return null;
  },

  // Remove all tokens from localStorage
  removeTokens() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      console.log('🗑️  All tokens removed from localStorage');
    }
  },

  // Remove only access token (keep refresh token for auto-refresh)
  removeAccessToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      console.log('🗑️  Access token removed from localStorage');
    }
  },

  // Check if access token is expired
  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true; // Assume expired if we can't decode
    }
  },

  // Check if refresh token is expired
  isRefreshTokenExpired(refreshToken: string): boolean {
    try {
      const payload = JSON.parse(atob(refreshToken.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error checking refresh token expiration:', error);
      return true; // Assume expired if we can't decode
    }
  },
}; 