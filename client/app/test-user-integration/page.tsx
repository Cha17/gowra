'use client';

import { useAuthContext } from '@/src/components/providers/NeonAuthProvider';
import { useState } from 'react';

export default function TestUserIntegration() {
  const { user, isAuthenticated, isLoading } = useAuthContext();
  const [testResult, setTestResult] = useState<string>('');

  const testUserId = () => {
    if (!isAuthenticated || !user) {
      setTestResult('❌ User not authenticated');
      return;
    }

    if (!user.id) {
      setTestResult('❌ User ID not found');
      return;
    }

    setTestResult(`✅ User ID: ${user.id}`);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">User ID Integration Test</h1>

      <div className="space-y-4">
        <div>
          <strong>Authentication Status:</strong>{' '}
          {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
        </div>

        {user && (
          <div>
            <strong>User Info:</strong>
            <pre className="bg-gray-100 p-2 rounded mt-2">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        )}

        <button
          onClick={testUserId}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test User ID
        </button>

        {testResult && (
          <div className="p-4 bg-gray-100 rounded">{testResult}</div>
        )}
      </div>
    </div>
  );
}
