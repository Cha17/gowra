'use client';

import { useState, useEffect, useMemo } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { apiClient } from '@/src/lib/api';
import { toast } from 'sonner';
import Background from '@/src/components/ui/Background';
import {
  EventCard,
  EventCardSkeleton,
  EventsEmptyState,
  EventsPagination,
  EventFilters,
  type Event,
  type EventFiltersState,
} from '@/src/components/events';

interface EventsResponse {
  success: boolean;
  data: {
    events: Event[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  message: string;
}

type SortOption = 'date' | 'price' | 'popularity' | 'name';
type SortOrder = 'asc' | 'desc';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const [filters, setFilters] = useState<EventFiltersState>({
    search: '',
    eventType: 'All Events',
    minPrice: '',
    maxPrice: '',
    startDate: '',
    endDate: '',
    status: '',
    organizer: '',
    hasCapacity: false,
  });

  // Debounce search to avoid too many API calls
  const [searchDebounce, setSearchDebounce] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(filters.search);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.search]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      // Server-side filters
      if (searchDebounce) {
        params.append('search', searchDebounce);
      }
      if (filters.status) {
        params.append('status', filters.status);
      }
      if (filters.organizer) {
        params.append('organizer', filters.organizer);
      }

      // Check if we need to fetch all events for client-side filtering
      const hasClientSideFilters =
        filters.minPrice ||
        filters.maxPrice ||
        filters.startDate ||
        filters.endDate ||
        filters.hasCapacity;

      // If client-side filters are active, fetch more events (or all)
      // Otherwise use server-side pagination
      if (hasClientSideFilters) {
        params.append('limit', '1000'); // Fetch a large number for client-side filtering
      } else {
        params.append('page', page.toString());
        params.append('limit', limit.toString());
      }

      const response = await apiClient.get<EventsResponse>(
        `/api/events?${params.toString()}`
      );

      if (response.success && response.data) {
        let fetchedEvents = response.data.events || [];

        // Store raw events for client-side filtering
        setRawEvents(fetchedEvents);

        // Client-side filtering for price range, date range, and capacity
        const filtered = applyClientSideFilters(fetchedEvents, filters);

        // Store filtered events (sorting will be applied in useMemo)
        setEvents(filtered);

        // Calculate pagination based on filtered results (only available events)
        const availableCount = filtered.filter(e => {
          if (!e.date) return true;
          return new Date(e.date) >= new Date();
        }).length;

        if (hasClientSideFilters) {
          // Client-side pagination (after filtering)
          const totalPages = Math.ceil(availableCount / limit);
          setPagination({
            page: 1, // Reset to first page
            limit,
            total: availableCount,
            totalPages,
          });
          setPage(1);
        } else {
          // Server-side pagination
          if (response.data.pagination) {
            // Filter to count only available events
            setPagination({
              page: response.data.pagination.page,
              limit: response.data.pagination.limit,
              total: availableCount,
              totalPages: Math.ceil(availableCount / limit),
            });
          } else {
            // Fallback if pagination not provided
            const totalPages = Math.ceil(availableCount / limit);
            setPagination({
              page,
              limit,
              total: availableCount,
              totalPages,
            });
          }
        }
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

  const applyClientSideFilters = (
    events: Event[],
    filters: EventFiltersState
  ): Event[] => {
    return events.filter(event => {
      // Price range filter
      if (filters.minPrice || filters.maxPrice) {
        const price = parseFloat(event.price || '0');
        const minPrice = filters.minPrice ? parseFloat(filters.minPrice) : 0;
        const maxPrice = filters.maxPrice
          ? parseFloat(filters.maxPrice)
          : Infinity;

        if (price < minPrice || price > maxPrice) {
          return false;
        }
      }

      // Date range filter
      if (filters.startDate || filters.endDate) {
        const eventDate = event.date ? new Date(event.date) : null;
        if (!eventDate) return false;

        if (filters.startDate) {
          const startDate = new Date(filters.startDate);
          if (eventDate < startDate) return false;
        }

        if (filters.endDate) {
          const endDate = new Date(filters.endDate);
          endDate.setHours(23, 59, 59, 999); // End of day
          if (eventDate > endDate) return false;
        }
      }

      // Has capacity filter
      if (filters.hasCapacity) {
        const spotsLeft =
          (event.capacity || 0) - (event.registration_count || 0);
        if (spotsLeft <= 0) return false;
      }

      // Event type filter (if it's not "All Events")
      if (filters.eventType && filters.eventType !== 'All Events') {
        // This would require an event_type field in the Event interface
        // For now, we'll skip this or use search
      }

      return true;
    });
  };

  const applySorting = (
    events: Event[],
    sortBy: SortOption,
    order: SortOrder
  ): Event[] => {
    const sorted = [...events].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          comparison = dateA - dateB;
          break;

        case 'price':
          const priceA = parseFloat(a.price || '0');
          const priceB = parseFloat(b.price || '0');
          comparison = priceA - priceB;
          break;

        case 'popularity':
          const regA = a.registration_count || 0;
          const regB = b.registration_count || 0;
          comparison = regA - regB;
          break;

        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
      }

      return order === 'asc' ? comparison : -comparison;
    });

    return sorted;
  };

  // Store raw fetched events (before client-side filtering)
  const [rawEvents, setRawEvents] = useState<Event[]>([]);

  useEffect(() => {
    fetchEvents();
  }, [page, limit, searchDebounce, filters.status, filters.organizer]);

  // Re-apply client-side filters when they change (without re-fetching)
  useEffect(() => {
    const hasClientSideFilters =
      filters.minPrice ||
      filters.maxPrice ||
      filters.startDate ||
      filters.endDate ||
      filters.hasCapacity;

    if (hasClientSideFilters && rawEvents.length > 0) {
      // Re-apply client-side filters to raw events
      const filtered = applyClientSideFilters(rawEvents, filters);
      setEvents(filtered);

      // Update pagination
      const totalPages = Math.ceil(filtered.length / limit);
      setPagination({
        page: 1, // Reset to first page when filters change
        limit,
        total: filtered.length,
        totalPages,
      });
      setPage(1);
    }
  }, [
    filters.minPrice,
    filters.maxPrice,
    filters.startDate,
    filters.endDate,
    filters.hasCapacity,
  ]);

  const handleFilterChange = (newFilters: Partial<EventFiltersState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      eventType: 'All Events',
      minPrice: '',
      maxPrice: '',
      startDate: '',
      endDate: '',
      status: '',
      organizer: '',
      hasCapacity: false,
    });
    setPage(1);
  };

  const handleSortChange = () => {
    // Cycle through sort options
    const sortOptions: SortOption[] = ['date', 'price', 'popularity', 'name'];
    const currentIndex = sortOptions.indexOf(sortBy);
    const nextIndex = (currentIndex + 1) % sortOptions.length;
    setSortBy(sortOptions[nextIndex]);
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const getSortLabel = () => {
    const labels: Record<SortOption, string> = {
      date: 'Date',
      price: 'Price',
      popularity: 'Popularity',
      name: 'Name',
    };
    return `Sort by ${labels[sortBy]} (${sortOrder === 'asc' ? '↑' : '↓'})`;
  };

  // Separate available and ended events, then apply sorting and pagination
  const { availableEvents, endedEvents } = useMemo(() => {
    const now = new Date();
    const available = events.filter(event => {
      if (!event.date) return true; // Include events without date as available
      return new Date(event.date) >= now;
    });
    const ended = events.filter(event => {
      if (!event.date) return false;
      return new Date(event.date) < now;
    });

    // Apply sorting to both groups
    const sortedAvailable = applySorting(available, sortBy, sortOrder);
    const sortedEnded = applySorting(ended, sortBy, sortOrder);

    return {
      availableEvents: sortedAvailable,
      endedEvents: sortedEnded,
    };
  }, [events, sortBy, sortOrder]);

  // Apply pagination only to available events (main display)
  const displayedEvents = useMemo(() => {
    const start = (page - 1) * limit;
    const end = start + limit;
    return availableEvents.slice(start, end);
  }, [availableEvents, page, limit]);

  return (
    <>
      <Background />
      <div className="min-h-screen py-8">
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

          {/* Filters */}
          <EventFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClear={handleClearFilters}
          />

          {/* Sort and Results Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="text-sm text-gray-600">
              {loading ? (
                'Loading...'
              ) : (
                <>
                  {pagination.total > 0 ? (
                    <>
                      Showing {displayedEvents.length} of {pagination.total}{' '}
                      events
                    </>
                  ) : (
                    'No events found'
                  )}
                </>
              )}
            </div>

            <button
              onClick={handleSortChange}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium"
            >
              <ArrowUpDown className="h-4 w-4" />
              {getSortLabel()}
            </button>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <EventCardSkeleton key={index} />
              ))}
            </div>
          ) : displayedEvents.length === 0 && endedEvents.length === 0 ? (
            <EventsEmptyState onClearFilters={handleClearFilters} />
          ) : (
            <>
              {/* Available Events */}
              {displayedEvents.length > 0 && (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Available Events ({availableEvents.length})
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
                    {displayedEvents.map(event => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <EventsPagination
                      pagination={pagination}
                      onPageChange={newPage => {
                        setPage(newPage);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      onLimitChange={newLimit => {
                        setLimit(newLimit);
                        setPage(1);
                      }}
                    />
                  )}
                </>
              )}

              {/* Separator between available and ended events */}
              {displayedEvents.length > 0 && endedEvents.length > 0 && (
                <div className="my-12 flex items-center gap-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                  <span className="text-sm font-medium text-gray-500 px-4">
                    Past Events
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                </div>
              )}

              {/* Ended Events */}
              {endedEvents.length > 0 && (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 opacity-75">
                      Past Events ({endedEvents.length})
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 opacity-75">
                    {endedEvents.map(event => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
