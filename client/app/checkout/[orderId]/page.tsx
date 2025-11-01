'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/src/lib/api';
import { toast } from 'sonner';
import {
  QrCode,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  ArrowLeft,
  CreditCard,
  Smartphone,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import Background from '@/src/components/ui/Background';
import { useAuthContext } from '@/src/components/providers/NeonAuthProvider';

interface PaymentStatus {
  status:
    | 'PENDING'
    | 'PROCESSING'
    | 'COMPLETED'
    | 'FAILED'
    | 'CANCELLED'
    | 'EXPIRED';
  qrCode?: string;
  amount: number;
  currency: string;
  expiresAt?: string;
  lastUpdated: string;
}

interface RegistrationData {
  registrationId: string;
  paymentStatus: string;
  paymentIntentStatus?: string;
  amount: number;
  currency: string;
  lastUpdated: string;
  qrCode?: string;
  expiresAt?: string;
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthContext();
  const orderId = params.orderId as string;

  const [registrationData, setRegistrationData] =
    useState<RegistrationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [retryingPayment, setRetryingPayment] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null
  );

  // Get registration ID from order (this would need to be implemented in the backend)
  const registrationId = orderId; // For now, assuming orderId is the registrationId

  useEffect(() => {
    if (registrationId) {
      fetchPaymentStatus();
    }
  }, [registrationId]);

  useEffect(() => {
    // Start polling for payment status if payment is pending
    if (registrationData?.paymentIntentStatus === 'PENDING') {
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [registrationData?.paymentIntentStatus]);

  useEffect(() => {
    // Update time remaining
    if (registrationData?.expiresAt) {
      const interval = setInterval(() => {
        updateTimeRemaining();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [registrationData?.expiresAt]);

  const fetchPaymentStatus = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{
        success: boolean;
        data: RegistrationData;
        error?: string;
      }>(
        `/api/payment-processing/registration/${registrationId}/payment-status?userId=${getUserId()}`
      );

      if (response.success && response.data) {
        setRegistrationData(response.data);
      } else {
        toast.error(response.error || 'Failed to fetch payment status');
      }
    } catch (error) {
      console.error('Error fetching payment status:', error);
      toast.error('Failed to load payment status');
    } finally {
      setLoading(false);
    }
  };

  const createPaymentIntent = async () => {
    try {
      setCreatingPayment(true);

      console.log('=== STARTING PAYMENT INTENT CREATION ===');
      console.log('Registration ID:', registrationId);
      console.log('User ID:', getUserId());
      console.log(
        'API URL:',
        `${'https://gowwra-api-worker-staging.charlcrtz17.workers.dev'}/api/payment-processing/registration/${registrationId}/v1/payment-intents`
      );

      const response = await apiClient.post<{
        success: boolean;
        data: any;
        error?: string;
        message?: string;
      }>(
        `/api/payment-processing/registration/${registrationId}/payment-intent`,
        {
          userId: getUserId(),
        }
      );

      console.log('=== RAW API RESPONSE ===');
      console.log('Full response object:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response || {}));
      console.log('Success:', response?.success);
      console.log('Data:', response?.data);
      console.log('Error:', response?.error);
      console.log('Message:', response?.message);

      if (response.success && response.data) {
        toast.success('Payment intent created successfully');
        await fetchPaymentStatus();
      } else {
        // Try to extract error message from various possible fields
        console.error('=== PAYMENT INTENT CREATION FAILED ===');
        console.error('Full response:', JSON.stringify(response, null, 2));
        console.error('Success flag:', response.success);
        console.error('Error field:', response.error);
        console.error('Message field:', response.message);
        console.error('Data field:', response.data);

        // Extract details from response if available
        const details = (response as any).details || '';

        let errorMsg =
          response.error ||
          response.message ||
          'Failed to create payment intent';

        // Provide helpful message based on the error
        if (
          details.includes('NextPayError') ||
          details.includes('Unknown error occurred')
        ) {
          errorMsg =
            'Payment processing is not configured. Please contact support.';
        }

        console.error('Extracted error message:', errorMsg);
        toast.error(errorMsg, {
          description: details
            ? 'Check console for full error details'
            : undefined,
          duration: 8000,
        });
      }
    } catch (error) {
      console.error('=== CAUGHT EXCEPTION DURING PAYMENT INTENT CREATION ===');
      console.error('Error type:', typeof error);
      console.error('Error object:', error);

      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }

      let errorMessage = 'Unknown error occurred';
      let errorDetails: any = null;

      if (error instanceof Error) {
        errorMessage = error.message;
        errorDetails = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        };

        // Try to extract more details from the error
        if (error.message.includes('NextPay')) {
          errorMessage =
            'NextPay credentials not configured. Please contact support.';
        } else if (error.message.includes('not configured')) {
          errorMessage =
            'Payment processing is not configured yet. Please try again later.';
        }
      } else {
        errorDetails = error;
        errorMessage = JSON.stringify(error);
      }

      console.error('=== FINAL ERROR SUMMARY ===');
      console.error('Error message to show user:', errorMessage);
      console.error(
        'Full error details:',
        JSON.stringify(errorDetails, null, 2)
      );

      toast.error(errorMessage, {
        description: errorDetails
          ? JSON.stringify(errorDetails, null, 2)
          : undefined,
        duration: 5000,
      });
    } finally {
      setCreatingPayment(false);
    }
  };

  const retryPayment = async () => {
    try {
      setRetryingPayment(true);
      const response = await apiClient.post<{
        success: boolean;
        data: any;
        error?: string;
      }>(
        `/api/payment-processing/registration/${registrationId}/retry-payment`,
        {
          userId: getUserId(),
          reason: 'User requested retry',
        }
      );

      if (response.success && response.data) {
        toast.success('Payment retry initiated');
        await fetchPaymentStatus();
      } else {
        toast.error(response.error || 'Failed to retry payment');
      }
    } catch (error) {
      console.error('Error retrying payment:', error);
      toast.error('Failed to retry payment');
    } finally {
      setRetryingPayment(false);
    }
  };

  const startPolling = () => {
    const interval = setInterval(() => {
      fetchPaymentStatus();
    }, 3000); // Poll every 3 seconds
    setPollingInterval(interval);
  };

  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  const updateTimeRemaining = () => {
    if (!registrationData?.expiresAt) return;

    const now = new Date().getTime();
    const expiresAt = new Date(registrationData.expiresAt).getTime();
    const timeLeft = expiresAt - now;

    if (timeLeft <= 0) {
      setTimeRemaining('Expired');
      return;
    }

    const minutes = Math.floor(timeLeft / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    if (minutes > 0) {
      setTimeRemaining(`${minutes}m ${seconds}s`);
    } else {
      setTimeRemaining(`${seconds}s`);
    }
  };

  const getUserId = () => {
    if (!isAuthenticated || !user) {
      throw new Error('User not authenticated');
    }
    return user.id;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'FAILED':
      case 'CANCELLED':
      case 'EXPIRED':
        return <XCircle className="h-6 w-6 text-red-500" />;
      case 'PROCESSING':
        return <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-6 w-6 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'FAILED':
      case 'CANCELLED':
      case 'EXPIRED':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'PROCESSING':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Payment successful! Your ticket has been issued.';
      case 'FAILED':
        return 'Payment failed. Please try again.';
      case 'CANCELLED':
        return 'Payment was cancelled.';
      case 'EXPIRED':
        return 'Payment expired. Please create a new payment.';
      case 'PROCESSING':
        return 'Payment is being processed...';
      default:
        return 'Waiting for payment...';
    }
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
              Please log in to complete your payment
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

  if (loading) {
    return (
      <>
        <Background />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 text-purple-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading payment information...</p>
          </div>
        </div>
      </>
    );
  }

  if (!registrationData) {
    return (
      <>
        <Background />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Registration not found</p>
            <Link
              href="/events"
              className="text-purple-600 hover:text-purple-500 mt-2 inline-block"
            >
              Back to Events
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
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/events"
              className="inline-flex items-center text-purple-600 hover:text-purple-500 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Complete Your Payment
            </h1>
            <p className="text-gray-600">
              Scan the QR code below to complete your event registration payment
            </p>
          </div>

          {/* Payment Status Card */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Payment Status
              </h2>
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(
                  registrationData.paymentIntentStatus || 'PENDING'
                )}`}
              >
                {getStatusIcon(
                  registrationData.paymentIntentStatus || 'PENDING'
                )}
                <span className="text-sm font-medium">
                  {registrationData.paymentIntentStatus || 'PENDING'}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-gray-700">
                {getStatusMessage(
                  registrationData.paymentIntentStatus || 'PENDING'
                )}
              </p>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Amount: ₱{registrationData.amount.toFixed(2)}</span>
              {registrationData.expiresAt && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Expires in: {timeRemaining}
                </span>
              )}
            </div>
          </div>

          {/* QR Code Section */}
          {registrationData.qrCode &&
            registrationData.paymentIntentStatus === 'PENDING' && (
              <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6 mb-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Scan QR Code to Pay
                  </h3>

                  <div className="bg-white rounded-xl p-4 inline-block shadow-lg">
                    <img
                      src={`data:image/png;base64,${registrationData.qrCode}`}
                      alt="Payment QR Code"
                      className="w-64 h-64 mx-auto"
                    />
                  </div>

                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-600">
                      Use your mobile banking app or e-wallet to scan this QR
                      code
                    </p>
                    <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Smartphone className="h-4 w-4" />
                        Mobile Banking
                      </div>
                      <div className="flex items-center gap-1">
                        <CreditCard className="h-4 w-4" />
                        E-Wallet
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Action Buttons */}
          <div className="space-y-4">
            {!registrationData.paymentIntentStatus ||
            registrationData.paymentIntentStatus === 'PENDING' ? (
              <button
                onClick={createPaymentIntent}
                disabled={creatingPayment}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {creatingPayment ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    Creating Payment...
                  </>
                ) : (
                  <>
                    <QrCode className="h-5 w-5" />
                    Generate Payment QR Code
                  </>
                )}
              </button>
            ) : ['FAILED', 'CANCELLED', 'EXPIRED'].includes(
                registrationData.paymentIntentStatus || ''
              ) ? (
              <button
                onClick={retryPayment}
                disabled={retryingPayment}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {retryingPayment ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    Retrying Payment...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-5 w-5" />
                    Retry Payment
                  </>
                )}
              </button>
            ) : registrationData.paymentIntentStatus === 'COMPLETED' ? (
              <Link href="/tickets" className="block w-full">
                <button className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-blue-700 transition-all duration-200">
                  <CheckCircle className="h-5 w-5" />
                  View Your Tickets
                </button>
              </Link>
            ) : null}

            {/* Refresh Status Button */}
            <button
              onClick={fetchPaymentStatus}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Status
            </button>
          </div>

          {/* Help Section */}
          <div className="mt-8 bg-blue-50/80 backdrop-blur-sm rounded-xl p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Need Help?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Make sure you have sufficient balance in your account</li>
              <li>• Ensure your mobile banking app is updated</li>
              <li>• If payment fails, you can retry up to 3 times</li>
              <li>• Contact support if you continue to experience issues</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
