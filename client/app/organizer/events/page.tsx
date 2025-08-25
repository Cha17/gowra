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
  Tag,
} from 'lucide-react';
import Link from 'next/link';
import Background from '@/src/components/ui/Background';
import { apiClient, API_ENDPOINTS } from '@/src/lib/api';
import { toast } from 'sonner';
import Image from 'next/image';

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
      <div className="min-h-screen py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  My Events
                </h1>
                <p className="text-gray-600">Manage all your created events</p>
              </div>

              <Link
                href="/organizer/events/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                Create Event
              </Link>
            </div>
          </div>

          {/* Events List */}
          {/* <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"> */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-pulse text-gray-500">
                Loading events...
              </div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                No Events Yet
              </h3>
              <p className="text-gray-600 mb-4 max-w-md mx-auto">
                You haven't created any events yet. Start building your
                community by creating your first event!
              </p>
              <Link
                href="/organizer/events/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                Create Your First Event
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map(event => {
                const formattedDate = event.date
                  ? new Date(event.date).toLocaleDateString('en-US', {
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
                    className={`border border-gray-100 bg-white rounded-xl p-4 hover:shadow-md transition-all duration-200 ${
                      isPast ? 'opacity-75' : ''
                    }`}
                  >
                    {/* Event Image */}
                    {event.image_url ? (
                      <div className="mb-3">
                        <Image
                          src={event.image_url}
                          alt={event.name}
                          width={100}
                          height={100}
                          className="w-full h-32 object-cover rounded-lg"
                          loading="lazy"
                          onError={e => {
                            // Fallback to placeholder if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            // Show placeholder instead
                            const placeholder =
                              target.nextElementSibling as HTMLElement;
                            if (placeholder) {
                              placeholder.style.display = 'flex';
                            }
                          }}
                        />
                        {/* Hidden placeholder that shows on error */}
                        <div className="w-full h-32 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg hidden items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-purple-400" />
                        </div>
                      </div>
                    ) : (
                      <div className="mb-3">
                        <div className="w-full h-32 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-purple-400" />
                        </div>
                      </div>
                    )}

                    {/* Event Header */}
                    <div className="flex justify-between mb-3">
                      {/* <div className="flex items-center gap-4 col-span-2"> */}
                      {/* <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-purple-600" />
                        </div> */}
                      {/* <div className="flex items-center gap-2"> */}
                      <h2 className="font-semibold text-gray-900 text-xl line-clamp-1">
                        {event.name}
                      </h2>

                      <div
                        className={`px-2 py-1 rounded-full text-sm font-light border ${getStatusColor(
                          event.status || 'draft'
                        )}`}
                      >
                        {event.status === 'published'
                          ? 'Live'
                          : event.status === 'cancelled'
                          ? 'Cancelled'
                          : 'Draft'}
                      </div>
                      {/* </div> */}
                      {/* </div> */}
                    </div>

                    {/* Event Details */}
                    <div className="space-y-2 mb-3 text-sm text-gray-600 grid grid-cols-2">
                      {/* <div className="flex items-center gap-10"> */}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formattedDate}</span>
                      </div>
                      {event.venue && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span className="line-clamp-1">{event.venue}</span>
                        </div>
                      )}

                      {/* </div> */}
                      {/* <div className="flex items-center gap-23"> */}

                      {event.capacity && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{event.capacity} slots</span>
                        </div>
                      )}
                      {event.price !== null && event.price !== undefined && (
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4" />
                          <span>
                            {event.price == 0.0 ? 'Free' : `₱ ${event.price}`}
                          </span>
                        </div>
                      )}
                      {/* </div> */}
                    </div>

                    {/* Event Actions */}
                    <div className="pt-3 border-t border-gray-100">
                      <Link
                        href={`/organizer/events/${event.id}`}
                        className="block w-full text-center py-2 px-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 text-sm"
                      >
                        Manage Event
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* </div> */}
        </div>
      </div>
    </>
  );
}
