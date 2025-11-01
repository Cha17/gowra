'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/src/lib/api';

interface PaymentStatus {
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
  qrCode?: string;
  amount: number;
  currency: string;
  expiresAt?: string;
  lastUpdated: string;
}

interface UsePaymentPollingOptions {
  registrationId: string;
  userId: string;
  enabled?: boolean;
  interval?: number;
  onStatusChange?: (status: PaymentStatus) => void;
  onError?: (error: string) => void;
}

export function usePaymentPolling({
  registrationId,
  userId,
  enabled = true,
  interval = 3000,
  onStatusChange,
  onError
}: UsePaymentPollingOptions) {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  const fetchPaymentStatus = useCallback(async () => {
    if (!registrationId || !userId || isPollingRef.current) return;

    try {
      isPollingRef.current = true;
      setLoading(true);
      setError(null);

      const response = await apiClient.get<{
        success: boolean;
        data: PaymentStatus;
        error?: string;
      }>(`/api/payment-processing/registration/${registrationId}/payment-status?userId=${userId}`);

      if (response.success && response.data) {
        const newStatus = response.data;
        setPaymentStatus(newStatus);
        
        // Call onStatusChange if status changed
        if (onStatusChange) {
          onStatusChange(newStatus);
        }

        // Stop polling if payment is completed or failed
        if (['COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED'].includes(newStatus.status)) {
          stopPolling();
        }
      } else {
        const errorMessage = response.error || 'Failed to fetch payment status';
        setError(errorMessage);
        if (onError) {
          onError(errorMessage);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
      isPollingRef.current = false;
    }
  }, [registrationId, userId, onStatusChange, onError]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;

    // Fetch immediately
    fetchPaymentStatus();

    // Then poll at intervals
    intervalRef.current = setInterval(() => {
      fetchPaymentStatus();
    }, interval);
  }, [fetchPaymentStatus, interval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const refreshStatus = useCallback(() => {
    fetchPaymentStatus();
  }, [fetchPaymentStatus]);

  useEffect(() => {
    if (enabled && registrationId && userId) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enabled, registrationId, userId, startPolling, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    paymentStatus,
    loading,
    error,
    refreshStatus,
    startPolling,
    stopPolling,
    isPolling: intervalRef.current !== null
  };
}
