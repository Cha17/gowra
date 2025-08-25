'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Calendar, MapPin, Users, ArrowRight } from 'lucide-react';
import { apiClient } from '@/src/lib/api';
import { toast } from 'sonner';
import Background from '@/src/components/ui/Background';
import Image from 'next/image';
import { EVENT_TYPES_WITH_ALL } from '@/src/lib/constants';

interface Event {
  id: string;
  name: string;
  organizer: string;
  details?: string | null;
  date?: string | null;
  image_url?: string | null;
  venue?: string | null;
  status?: string | null;
  price?: string | null;
  capacity?: number | null;
  registration_deadline?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  registration_count?: number;
}

interface EventsResponse {
  success: boolean;
  data: {
    events: Event[];
  };
  message: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (eventTypeFilter && eventTypeFilter !== 'All Events') {
        // For now, we'll use the search parameter for event type filtering
        // You may need to update your API to support event type filtering
        params.append('search', `${searchTerm} ${eventTypeFilter}`.trim());
      }
      // Remove pagination - fetch all events
      params.append('limit', '100');

      const response = await apiClient.get<EventsResponse>(
        `/api/events?${params.toString()}`
      );

      console.log('Events API Response:', response); // Debug log

      if (response.success && response.data) {
        setEvents(response.data.events || []);
      } else {
        toast.error('Failed to fetch events');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [searchTerm, eventTypeFilter]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Date TBD';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Date TBD';
    }
  };

  const formatPrice = (price: string | null | undefined) => {
    if (!price) return 'Free';
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return 'Free';
    return numPrice === 0 ? 'Free' : `₱${numPrice.toFixed(2)}`;
  };

  const getAvailableSpots = (
    capacity: number | null | undefined,
    registrationCount: number | null | undefined
  ) => {
    const cap = capacity || 0;
    const regCount = registrationCount || 0;
    const available = cap - regCount;
    return available > 0 ? available : 0;
  };

  return (
    <>
      <Background />
      <div className="min-h-screen  py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Discover Amazing Events
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Find and register for events that match your interests
            </p>
          </div>

          {/* Minimal Search and Filters */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-4xl">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Search className="h-4 w-4 text-purple-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500"
                />
              </div>

              {/* Event Type Filter */}
              <div className="flex-1 max-w-xs">
                <select
                  value={eventTypeFilter}
                  onChange={e => setEventTypeFilter(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all duration-200 text-gray-500 placeholder-gray-500"
                >
                  {EVENT_TYPES_WITH_ALL.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              {(searchTerm ||
                (eventTypeFilter && eventTypeFilter !== 'All Events')) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setEventTypeFilter('');
                  }}
                  className="px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all duration-200"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-pulse"
                >
                  <div className="h-56 bg-gradient-to-br from-gray-100 to-gray-200"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 rounded-lg w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="space-y-2 mb-4">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="h-8 bg-gray-200 rounded w-20"></div>
                      <div className="h-10 bg-gray-200 rounded-full w-32"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-12 max-w-md mx-auto">
                <Calendar className="h-20 w-20 text-purple-300 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  No events found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search or filters to discover amazing
                  events.
                </p>
                <Link
                  href="/events"
                  onClick={() => {
                    setSearchTerm('');
                    setEventTypeFilter('');
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-full hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105"
                >
                  <Search className="h-4 w-4" />
                  Clear Filters
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {events.map(event => {
                const isEventPast = event.date
                  ? new Date(event.date) < new Date()
                  : false;
                const spotsLeft = getAvailableSpots(
                  event.capacity,
                  event.registration_count
                );
                const isSoldOut = spotsLeft === 0;

                return (
                  <div
                    key={event.id}
                    className="group bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-purple-200 transition-all duration-300 transform hover:-translate-y-2"
                  >
                    {/* Event Image */}
                    <div className="relative h-56 bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 overflow-hidden">
                      {event.image_url ? (
                        <Image
                          width={500}
                          height={500}
                          src={event.image_url}
                          alt={event.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500">
                          <Calendar className="h-20 w-20 text-white opacity-90" />
                        </div>
                      )}

                      {/* Status Badge */}
                      <div className="absolute top-4 right-4">
                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm border ${
                            event.status === 'published'
                              ? 'bg-green-100/90 text-green-800 border-green-200'
                              : event.status === 'draft'
                              ? 'bg-yellow-100/90 text-yellow-800 border-yellow-200'
                              : event.status === 'cancelled'
                              ? 'bg-red-100/90 text-red-800 border-red-200'
                              : 'bg-gray-100/90 text-gray-800 border-gray-200'
                          }`}
                        >
                          {(event.status || 'unknown').charAt(0).toUpperCase() +
                            (event.status || 'unknown').slice(1)}
                        </span>
                      </div>

                      {/* Sold Out / Past Event Overlay */}
                      {(isSoldOut || isEventPast) && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white font-bold text-sm border border-white/30">
                            {isEventPast ? 'Event Ended' : 'Sold Out'}
                          </span>
                        </div>
                      )}

                      {/* Price Tag */}
                      <div className="absolute top-4 left-4">
                        <div className="bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/50">
                          <span className="text-purple-600 font-bold text-sm">
                            {formatPrice(event.price)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Event Details */}
                    <div className="p-6">
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                          {event.name}
                        </h3>

                        <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                          {event.details || 'No details available'}
                        </p>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center text-gray-700">
                          <div className="flex-shrink-0 w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center mr-3">
                            <Calendar className="h-4 w-4 text-purple-600" />
                          </div>
                          <span className="text-sm font-medium">
                            {formatDate(event.date)}
                          </span>
                        </div>

                        <div className="flex items-center text-gray-700">
                          <div className="flex-shrink-0 w-8 h-8 bg-pink-50 rounded-full flex items-center justify-center mr-3">
                            <MapPin className="h-4 w-4 text-pink-600" />
                          </div>
                          <span className="text-sm font-medium truncate">
                            {event.venue || 'Venue TBD'}
                          </span>
                        </div>

                        <div className="flex items-center text-gray-700">
                          <div className="flex-shrink-0 w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center mr-3">
                            <Users className="h-4 w-4 text-orange-600" />
                          </div>
                          <span className="text-sm font-medium">
                            {spotsLeft > 0 ? (
                              <>
                                <span className="text-green-600 font-semibold">
                                  {spotsLeft}
                                </span>{' '}
                                spots left
                              </>
                            ) : (
                              <span className="text-red-600 font-semibold">
                                Sold out
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Link
                        href={`/events/${event.id}`}
                        className="block w-full"
                      >
                        <button className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl hover:from-purple-700 hover:to-pink-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl">
                          <span>View Details</span>
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
