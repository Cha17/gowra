'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Clock, Tag, User } from 'lucide-react';
import { useAuthContext } from '@/src/components/providers/NeonAuthProvider';
import { apiClient } from '@/src/lib/api';
import { toast } from 'sonner';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';
import Background from '@/src/components/ui/Background';

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
  ticket_quantity: number;
  event_status: string;
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

// Simplified UI: payments list and analytics removed

export default function MyEventsAndRegistrationsPage() {
  const { user, apiCallWithRefresh } = useAuthContext();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  // Set page title
  useEffect(() => {
    document.title = 'My Tickets - Gowwra';
  }, []);

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
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load tickets');
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
    return isNaN(numPrice) || numPrice === 0
      ? 'Free'
      : `₱ ${numPrice.toFixed(2)}`;
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

  const upcomingEvents = getUpcomingEvents();
  const pastEvents = getPastEvents();

  return (
    <ProtectedRoute>
      <Background />
      <div className="min-h-screen  py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              My Tickets
            </h1>
            <p className="text-base text-gray-600">
              Hi {user?.name || 'there'} — here are your tickets.
            </p>
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
              <div className="space-y-8">
                {/* Upcoming Tickets */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-5 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Upcoming tickets
                    </h2>
                  </div>
                  <div className="p-5">
                    {upcomingEvents.length === 0 ? (
                      <div className="text-center py-10">
                        <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600 mb-4">
                          No upcoming tickets.
                        </p>
                        <Link
                          href="/events"
                          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          Browse events
                        </Link>
                      </div>
                    ) : (
                      <ul className="space-y-4">
                        {upcomingEvents.map(registration => (
                          <li
                            key={registration.id}
                            className="p-4 border border-gray-200 rounded-lg"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 truncate">
                                  {registration.event_name}
                                </h3>
                                <div className="mt-1 text-sm text-gray-500">
                                  {registration.ticket_quantity} ticket
                                  {registration.ticket_quantity > 1
                                    ? 's'
                                    : ''}{' '}
                                  • ₱{registration.payment_amount}
                                </div>
                                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                  <span className="inline-flex items-center">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    {formatDate(registration.event_date)}
                                  </span>
                                  <span className="inline-flex items-center">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    {registration.event_venue}
                                  </span>
                                  <span className="inline-flex items-center">
                                    <User className="h-4 w-4 mr-1" />
                                    {registration.event_organizer}
                                  </span>
                                </div>
                                {registration.event_status === 'cancelled' && (
                                  <div className="mt-2">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                      Event Cancelled
                                    </span>
                                  </div>
                                )}
                                {registration.event_status === 'published' && (
                                  <div className="mt-2">
                                    {(() => {
                                      const eventDate = new Date(
                                        registration.event_date
                                      );
                                      const now = new Date();
                                      const daysUntilEvent = Math.ceil(
                                        (eventDate.getTime() - now.getTime()) /
                                          (1000 * 60 * 60 * 24)
                                      );

                                      if (daysUntilEvent < 0) {
                                        return (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                            Event Passed
                                          </span>
                                        );
                                      } else if (daysUntilEvent <= 3) {
                                        return (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                            Event Soon ({daysUntilEvent} day
                                            {daysUntilEvent !== 1 ? 's' : ''})
                                          </span>
                                        );
                                      } else if (daysUntilEvent <= 7) {
                                        return (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                            <Calendar className="h-3 w-3 mr-1" />
                                            Upcoming ({daysUntilEvent} days)
                                          </span>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                )}
                              </div>
                              <div className="flex-shrink-0 flex items-center gap-3">
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
                                  href={`/tickets/${registration.id}`}
                                  className="px-3 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700"
                                >
                                  View ticket
                                </Link>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>

                {/* Past Tickets */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-5 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Past tickets
                    </h2>
                  </div>
                  <div className="p-5">
                    {pastEvents.length === 0 ? (
                      <div className="text-center py-10">
                        <p className="text-gray-600">No past tickets yet.</p>
                      </div>
                    ) : (
                      <ul className="space-y-4">
                        {pastEvents.map(registration => (
                          <li
                            key={registration.id}
                            className="p-4 border border-gray-200 rounded-lg"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 truncate">
                                  {registration.event_name}
                                </h3>
                                <div className="mt-1 text-sm text-gray-500">
                                  {registration.ticket_quantity} ticket
                                  {registration.ticket_quantity > 1
                                    ? 's'
                                    : ''}{' '}
                                  • ₱{registration.payment_amount}
                                </div>
                                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                  <span className="inline-flex items-center">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    {formatDate(registration.event_date)}
                                  </span>
                                  <span className="inline-flex items-center">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    {registration.event_venue}
                                  </span>
                                  <span className="inline-flex items-center">
                                    <User className="h-4 w-4 mr-1" />
                                    {registration.event_organizer}
                                  </span>
                                </div>
                                {registration.event_status === 'cancelled' && (
                                  <div className="mt-2">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                      Event Cancelled
                                    </span>
                                  </div>
                                )}
                                {registration.event_status === 'published' && (
                                  <div className="mt-2">
                                    {(() => {
                                      const eventDate = new Date(
                                        registration.event_date
                                      );
                                      const now = new Date();
                                      const daysUntilEvent = Math.ceil(
                                        (eventDate.getTime() - now.getTime()) /
                                          (1000 * 60 * 60 * 24)
                                      );

                                      if (daysUntilEvent < 0) {
                                        return (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                            Event Passed
                                          </span>
                                        );
                                      } else if (daysUntilEvent <= 3) {
                                        return (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                            Event Soon ({daysUntilEvent} day
                                            {daysUntilEvent !== 1 ? 's' : ''})
                                          </span>
                                        );
                                      } else if (daysUntilEvent <= 7) {
                                        return (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                            <Calendar className="h-3 w-3 mr-1" />
                                            Upcoming ({daysUntilEvent} days)
                                          </span>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                )}
                              </div>
                              <div className="flex-shrink-0 flex items-center gap-3">
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
                                  href={`/tickets/${registration.id}`}
                                  className="px-3 py-2 bg-white border border-gray-300 text-sm rounded-md hover:bg-gray-50"
                                >
                                  View ticket
                                </Link>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
