'use client';

import { useState } from 'react';
import { apiClient } from '@/src/lib/api';
import { toast } from 'sonner';
import Background from '@/src/components/ui/Background';

export default function TestNextPayPage() {
  const [loading, setLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState<any>(null);

  const checkHealth = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/nextpay/health');
      setHealthStatus(response);
      if (response.success) {
        toast.success('NextPay is healthy!');
      } else {
        toast.error('NextPay health check failed');
      }
    } catch (error) {
      console.error('Health check error:', error);
      setHealthStatus({
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      });
      toast.error('Failed to check NextPay health');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Background />
      <div className="min-h-screen py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            NextPay Health Check
          </h1>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6 mb-6">
            <button
              onClick={checkHealth}
              disabled={loading}
              className="w-full py-3 px-6 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Checking...' : 'Check NextPay Health'}
            </button>
          </div>

          {healthStatus && (
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6">
              <h2 className="text-xl font-semibold mb-4">Health Status</h2>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(healthStatus, null, 2)}
              </pre>
            </div>
          )}

          <div className="bg-blue-50/80 backdrop-blur-sm rounded-xl p-4 mt-6">
            <h3 className="font-semibold text-blue-900 mb-2">What to check:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✅ If success is true: NextPay is configured correctly</li>
              <li>❌ If success is false: Check the error message</li>
              <li>
                ⚠️ If you see "Missing NextPay credentials": Configure the
                secrets in wrangler.jsonc
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
