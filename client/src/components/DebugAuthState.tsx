'use client';

import { useAuthContext } from './providers/NeonAuthProvider';

export default function DebugAuthState() {
  const { user, isAuthenticated, isLoading, isInitialized } = useAuthContext();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono max-w-xs z-50">
      <div className="font-bold mb-2">🔍 Auth Debug</div>
      <div>
        Status:{' '}
        {isLoading ? '🔄 Loading' : isAuthenticated ? '✅ Auth' : '❌ Not Auth'}
      </div>
      <div>Initialized: {isInitialized ? '✅' : '❌'}</div>
      {user && (
        <>
          <div>User: {user.email}</div>
          <div>Role: {user.role}</div>
          <div>ID: {user.id?.slice(0, 8)}...</div>
        </>
      )}
    </div>
  );
}
