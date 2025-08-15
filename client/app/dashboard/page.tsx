'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Clock,
  CreditCard,
  User,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Activity,
  Award,
  ArrowRight,
} from 'lucide-react';
import { useAuthContext } from '@/src/components/providers/NeonAuthProvider';
import { apiClient } from '@/src/lib/api';
import { toast } from 'sonner';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';

interface Registration {
  id: string;
  event_id: string;
  payment_status: string;
  payment_reference: string;
  payment_amount: string;
  registration_date: string;
  created_at: string;
  event_name: string;
  event_date: string;
  event_venue: string;
  event_organizer: string;
  event_image?: string;
}

interface RegistrationsResponse {
  success: boolean;
  data: {
    registrations: Registration[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

interface Payment {
  id: string;
  registration_id: string;
  payment_reference: string;
  amount: string;
  status: string;
  payment_method: string;
  transaction_date: string;
  event_name: string;
  event_date: string;
}

interface PaymentsResponse {
  success: boolean;
  data: {
    payments: Payment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export default function DashboardPage() {
  const { user, apiCallWithRefresh } = useAuthContext();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'events' | 'payments'
  >('overview');

  const fetchUserData = async () => {
    try {
      setLoading(true);

      // Fetch user registrations
      const registrationsResponse = await apiCallWithRefresh(async token => {
        return await apiClient.get<RegistrationsResponse>(
          '/api/registrations/my-registrations?limit=10'
        );
      });

      if (registrationsResponse.success) {
        setRegistrations(registrationsResponse.data.registrations);
      }

      // Fetch recent payments
      const paymentsResponse = await apiCallWithRefresh(async token => {
        return await apiClient.get<PaymentsResponse>(
          '/api/payments/my-payments?limit=5'
        );
      });

      if (paymentsResponse.success) {
        setRecentPayments(paymentsResponse.data.payments);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    return numPrice === 0 ? 'Free' : `$${numPrice.toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
      case 'refunded':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    return registrations.filter(reg => new Date(reg.event_date) > now);
  };

  const getPastEvents = () => {
    const now = new Date();
    return registrations.filter(reg => new Date(reg.event_date) <= now);
  };

  const getTotalSpent = () => {
    return recentPayments
      .filter(payment => payment.status === 'completed')
      .reduce((total, payment) => total + parseFloat(payment.amount), 0);
  };

  const upcomingEvents = getUpcomingEvents();
  const pastEvents = getPastEvents();
  const totalSpent = getTotalSpent();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.name || 'User'}!
            </h1>
            <p className="text-lg text-gray-600">
              Here's what's happening with your events
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'events'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                My Events
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'payments'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Payment History
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse"
                >
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-purple-100 rounded-xl">
                          <Calendar className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            Upcoming Events
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {upcomingEvents.length}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-xl">
                          <Award className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            Events Attended
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {pastEvents.length}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-blue-100 rounded-xl">
                          <TrendingUp className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            Total Spent
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            ${totalSpent.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Upcoming Events */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">
                          Upcoming Events
                        </h2>
                        <Link
                          href="/events"
                          className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                        >
                          Browse Events
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                    <div className="p-6">
                      {upcomingEvents.length === 0 ? (
                        <div className="text-center py-8">
                          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-600">No upcoming events</p>
                          <Link
                            href="/events"
                            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            Discover Events
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {upcomingEvents.slice(0, 3).map(registration => (
                            <div
                              key={registration.id}
                              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                            >
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">
                                  {registration.event_name}
                                </h3>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {formatDate(registration.event_date)}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {registration.event_venue}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                    registration.payment_status
                                  )}`}
                                >
                                  {registration.payment_status
                                    .charAt(0)
                                    .toUpperCase() +
                                    registration.payment_status.slice(1)}
                                </span>
                                <Link
                                  href={`/events/${registration.event_id}`}
                                  className="text-purple-600 hover:text-purple-700 font-medium"
                                >
                                  View
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                      <h2 className="text-xl font-bold text-gray-900">
                        Recent Activity
                      </h2>
                    </div>
                    <div className="p-6">
                      {registrations.length === 0 ? (
                        <div className="text-center py-8">
                          <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-600">No recent activity</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {registrations.slice(0, 5).map(registration => (
                            <div
                              key={registration.id}
                              className="flex items-center gap-4"
                            >
                              <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                              <div className="flex-1">
                                <p className="text-sm text-gray-900">
                                  Registered for{' '}
                                  <strong>{registration.event_name}</strong>
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatDate(registration.registration_date)}
                                </p>
                              </div>
                              <span
                                className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                                  registration.payment_status
                                )}`}
                              >
                                {registration.payment_status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Events Tab */}
              {activeTab === 'events' && (
                <div className="space-y-6">
                  {registrations.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                      <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        No Events Yet
                      </h3>
                      <p className="text-gray-600 mb-6">
                        You haven't registered for any events yet.
                      </p>
                      <Link
                        href="/events"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Discover Events
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {registrations.map(registration => (
                        <div
                          key={registration.id}
                          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                        >
                          <div className="h-32 bg-gradient-to-br from-purple-400 to-pink-400 relative">
                            {registration.event_image ? (
                              <img
                                src={registration.event_image}
                                alt={registration.event_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Calendar className="h-12 w-12 text-white opacity-80" />
                              </div>
                            )}
                            <div className="absolute top-3 right-3">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                  registration.payment_status
                                )}`}
                              >
                                {registration.payment_status
                                  .charAt(0)
                                  .toUpperCase() +
                                  registration.payment_status.slice(1)}
                              </span>
                            </div>
                          </div>

                          <div className="p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                              {registration.event_name}
                            </h3>
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center text-gray-600 text-sm">
                                <Calendar className="h-4 w-4 mr-2" />
                                {formatDate(registration.event_date)}
                              </div>
                              <div className="flex items-center text-gray-600 text-sm">
                                <MapPin className="h-4 w-4 mr-2" />
                                {registration.event_venue}
                              </div>
                              <div className="flex items-center text-gray-600 text-sm">
                                <User className="h-4 w-4 mr-2" />
                                {registration.event_organizer}
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="text-lg font-bold text-purple-600">
                                {formatPrice(registration.payment_amount)}
                              </div>
                              <Link
                                href={`/events/${registration.event_id}`}
                                className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                              >
                                View Event
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Payments Tab */}
              {activeTab === 'payments' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">
                      Payment History
                    </h2>
                  </div>
                  <div className="p-6">
                    {recentPayments.length === 0 ? (
                      <div className="text-center py-8">
                        <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">No payment history</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recentPayments.map(payment => (
                          <div
                            key={payment.id}
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                          >
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">
                                {payment.event_name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {formatDate(payment.transaction_date)} •{' '}
                                {payment.payment_method}
                              </p>
                              <p className="text-xs text-gray-500">
                                Reference: {payment.payment_reference}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-900">
                                {formatPrice(payment.amount)}
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                  payment.status
                                )}`}
                              >
                                {payment.status.charAt(0).toUpperCase() +
                                  payment.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
