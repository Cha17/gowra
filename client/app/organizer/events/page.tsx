'use client';

import { useAuthContext } from '@/src/components/providers/NeonAuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Plus,
  Calendar,
  MapPin,
  Image as ImageIcon,
  Users,
  Ticket,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import Background from '@/src/components/ui/Background';
import { apiClient, API_ENDPOINTS } from '@/src/lib/api';
import { toast } from 'sonner';

interface OrganizerEvent {
  id: string;
  name: string;
  details?: string | null;
  date?: string | null;
  image_url?: string | null;
  venue?: string | null;
  status?: string | null;
  price?: number | null;
  capacity?: number | null;
  registration_count?: number | null;
  created_at?: string | null;
}

export default function OrganizerEventsPage() {
  const { user, isAuthenticated } = useAuthContext();
  const router = useRouter();

  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Redirect if not an organizer
  useEffect(() => {
    if (isAuthenticated && user?.role !== 'organizer') {
      router.push('/organizer/upgrade');
    }
  }, [isAuthenticated, user?.role, router]);

  const canRender = useMemo(
    () => isAuthenticated && user?.role === 'organizer',
    [isAuthenticated, user?.role]
  );

  // Load my events
  useEffect(() => {
    const loadEvents = async () => {
      if (!canRender) return;
      setLoading(true);
      try {
        const response = await apiClient.get<{
          success: boolean;
          events: OrganizerEvent[];
        }>(API_ENDPOINTS.myEvents);

        console.log('My Events API Response:', response);

        if (response && (response as any).success && (response as any).events) {
          setEvents((response as any).events);
        } else {
          setEvents([]);
        }
      } catch (error) {
        console.error('Failed to load events:', error);
        toast.error('Failed to load events');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, [canRender]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'draft':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (!canRender) return null;

  return (
    <>
      <Background />
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  My Events
                </h1>
                <p className="text-xl text-gray-600">
                  Manage all your created events
                </p>
              </div>

              <Link
                href="/organizer/events/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                Create Event
              </Link>
            </div>
          </div>

          {/* Events List */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-pulse text-gray-500">
                  Loading events...
                </div>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  No Events Yet
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  You haven't created any events yet. Start building your
                  community by creating your first event!
                </p>
                <Link
                  href="/organizer/events/create"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Event
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {events.map(event => {
                  const formattedDate = event.date
                    ? new Date(event.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'TBD';

                  const isPast = event.date
                    ? new Date(event.date) < new Date()
                    : false;

                  return (
                    <div
                      key={event.id}
                      className={`border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all duration-200 ${
                        isPast ? 'opacity-75' : ''
                      }`}
                    >
                      {/* Event Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg line-clamp-1">
                              {event.name}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              {getStatusIcon(event.status || 'draft')}
                              <span className="capitalize">
                                {event.status || 'draft'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            event.status || 'draft'
                          )}`}
                        >
                          {event.status === 'published' ? 'Live' : 'Draft'}
                        </div>
                      </div>

                      {/* Event Details */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{formattedDate}</span>
                        </div>

                        {event.venue && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span className="line-clamp-1">{event.venue}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {event.capacity && (
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>
                                {event.registration_count || 0}/{event.capacity}
                              </span>
                            </div>
                          )}

                          {event.price !== null &&
                            event.price !== undefined && (
                              <div className="flex items-center gap-1">
                                <Ticket className="w-4 h-4" />
                                <span>₱{event.price}</span>
                              </div>
                            )}

                          {event.created_at && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>
                                {new Date(
                                  event.created_at
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Event Actions */}
                      <div className="pt-4 border-t border-gray-100">
                        <Link
                          href={`/organizer/events/${event.id}`}
                          className="block w-full text-center py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          Manage Event
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
