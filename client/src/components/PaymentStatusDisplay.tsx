'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED';

interface PaymentStatusDisplayProps {
  status: PaymentStatus;
  amount: number;
  currency?: string;
  expiresAt?: string;
  lastUpdated?: string;
  onRefresh?: () => void;
  className?: string;
}

export default function PaymentStatusDisplay({
  status,
  amount,
  currency = 'PHP',
  expiresAt,
  lastUpdated,
  onRefresh,
  className = '',
}: PaymentStatusDisplayProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (expiresAt && status === 'PENDING') {
      const interval = setInterval(() => {
        updateTimeRemaining();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [expiresAt, status]);

  const updateTimeRemaining = () => {
    if (!expiresAt) return;

    const now = new Date().getTime();
    const expiresAtTime = new Date(expiresAt).getTime();
    const timeLeft = expiresAtTime - now;

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

  const getStatusIcon = (status: PaymentStatus) => {
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

  const getStatusColor = (status: PaymentStatus) => {
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

  const getStatusMessage = (status: PaymentStatus) => {
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

  const formatAmount = (amount: number, currency: string) => {
    if (currency === 'PHP') {
      return `₱${amount.toFixed(2)}`;
    }
    return `${currency} ${amount.toFixed(2)}`;
  };

  return (
    <div
      className={`bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Payment Status</h2>
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(
            status
          )}`}
        >
          {getStatusIcon(status)}
          <span className="text-sm font-medium">{status}</span>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-gray-700">{getStatusMessage(status)}</p>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>Amount: {formatAmount(amount, currency)}</span>
        <div className="flex items-center gap-4">
          {expiresAt && status === 'PENDING' && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Expires in: {timeRemaining}
            </span>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center gap-1 text-purple-600 hover:text-purple-500 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          )}
        </div>
      </div>

      {lastUpdated && (
        <div className="mt-2 text-xs text-gray-500">
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
}
