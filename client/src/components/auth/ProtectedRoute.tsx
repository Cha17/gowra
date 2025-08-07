'use client';

import { ReactNode } from 'react';
import { useAuthContext } from '@/src/components/providers/NeonAuthProvider';
import { redirect } from 'next/navigation';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  fallback?: ReactNode;
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requireAdmin = false,
  fallback,
}: ProtectedRouteProps) {
  const { user, isLoading, isAdmin } = useAuthContext();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Check if authentication is required but user is not authenticated
  if (requireAuth && !user) {
    if (fallback) {
      return <>{fallback}</>;
    }
    redirect('/login');
  }

  // Check if admin access is required but user is not admin
  if (requireAdmin && !isAdmin) {
    if (fallback) {
      return <>{fallback}</>;
    }
    redirect('/unauthorized');
  }

  return <>{children}</>;
}
