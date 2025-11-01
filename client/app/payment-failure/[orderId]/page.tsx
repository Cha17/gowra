'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/src/lib/api';
import { toast } from 'sonner';
import {
  XCircle,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
  CreditCard,
  Clock,
  HelpCircle,
} from 'lucide-react';
import Link from 'next/link';
import Background from '@/src/components/ui/Background';
import { useAuthContext } from '@/src/components/providers/NeonAuthProvider';

export default function PaymentFailurePage() {
  const params = useParams();
  const { user, isAuthenticated } = useAuthContext();
  const orderId = params.orderId as string;

  const [retrying, setRetrying] = useState(false);

  const retryPayment = async () => {
    try {
      setRetrying(true);
      const response = await apiClient.post<{
        success: boolean;
        data: any;
        error?: string;
      }>(`/api/payment-processing/registration/${orderId}/retry-payment`, {
        userId: getUserId(),
        reason: 'User requested retry from failure page',
      });

      if (response.success && response.data) {
        toast.success('Payment retry initiated');
        // Redirect to checkout page
        window.location.href = `/checkout/${orderId}`;
      } else {
        toast.error(response.error || 'Failed to retry payment');
      }
    } catch (error) {
      console.error('Error retrying payment:', error);
      toast.error('Failed to retry payment');
    } finally {
      setRetrying(false);
    }
  };

  const getUserId = () => {
    if (!isAuthenticated || !user) {
      throw new Error('User not authenticated');
    }
    return user.id;
  };

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <Background />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">
              Please log in to view payment details
            </p>
            <Link
              href="/login"
              className="text-purple-600 hover:text-purple-500 mt-2 inline-block"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Background />
      <div className="min-h-screen py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Failure Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Payment Failed
            </h1>
            <p className="text-gray-600">
              We couldn't process your payment. Don't worry, you can try again.
            </p>
          </div>

          {/* Failure Details Card */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6 mb-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                What happened?
              </h2>
              <p className="text-gray-600">
                Your payment could not be completed. This might be due to:
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start text-gray-700">
                <div className="flex-shrink-0 w-8 h-8 bg-red-50 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <CreditCard className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Insufficient funds</p>
                  <p className="text-xs text-gray-500">
                    Check your account balance
                  </p>
                </div>
              </div>

              <div className="flex items-start text-gray-700">
                <div className="flex-shrink-0 w-8 h-8 bg-red-50 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <Clock className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Payment timeout</p>
                  <p className="text-xs text-gray-500">
                    The payment took too long to process
                  </p>
                </div>
              </div>

              <div className="flex items-start text-gray-700">
                <div className="flex-shrink-0 w-8 h-8 bg-red-50 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Technical issue</p>
                  <p className="text-xs text-gray-500">
                    Temporary service interruption
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={retryPayment}
              disabled={retrying}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {retrying ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Retrying Payment...
                </>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5" />
                  Try Payment Again
                </>
              )}
            </button>

            <Link href="/events" className="block">
              <button className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all duration-200">
                <ArrowLeft className="h-4 w-4" />
                Back to Events
              </button>
            </Link>
          </div>

          {/* Help Section */}
          <div className="mt-8 bg-blue-50/80 backdrop-blur-sm rounded-xl p-4">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Need Help?
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Ensure you have sufficient balance in your account</li>
              <li>• Check that your mobile banking app is updated</li>
              <li>• Try using a different payment method</li>
              <li>• Contact your bank if the issue persists</li>
            </ul>
            <div className="mt-3">
              <button className="text-sm text-blue-600 hover:text-blue-500 font-medium">
                Contact Support →
              </button>
            </div>
          </div>

          {/* Payment Tips */}
          <div className="mt-6 bg-yellow-50/80 backdrop-blur-sm rounded-xl p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">Payment Tips</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Make sure you have a stable internet connection</li>
              <li>• Keep your mobile banking app open during payment</li>
              <li>• Complete the payment within the time limit</li>
              <li>• Don't close the app until payment is confirmed</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
