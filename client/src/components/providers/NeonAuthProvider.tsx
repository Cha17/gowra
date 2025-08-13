'use client';

import { ReactNode, createContext, useContext } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { User } from '../../lib/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    email: string,
    password: string,
    name?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  updateProfile: (
    name: string
  ) => Promise<{ success: boolean; error?: string }>;
  isAdmin: boolean;
  isAuthenticated: boolean;
  apiCallWithRefresh: <T>(apiCall: (token: string) => Promise<T>) => Promise<T>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface NeonAuthProviderProps {
  children: ReactNode;
}

export function NeonAuthProvider({ children }: NeonAuthProviderProps) {
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within a NeonAuthProvider');
  }
  return context;
}
