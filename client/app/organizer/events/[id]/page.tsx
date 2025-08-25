'use client';

import { useAuthContext } from '@/src/components/providers/NeonAuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import Image from 'next/image';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Pencil,
  Trash2,
  Eye,
  ArrowLeft,
  Ticket,
  Tag,
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
  updated_at?: string | null;
}

interface EventAnalytics {
  totalRegistrations: number;
  capacityUtilization: number;
  registrationBreakdown: {
    confirmed: number;
    pending: number;
    cancelled: number;
  };
  recentRegistrations: Array<{
    id: string;
    attendee_name: string;
    email: string;
    status: string;
    registered_at: string;
  }>;
}

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, isAuthenticated } = useAuthContext();
  const router = useRouter();
  const { id: eventId } = use(params);

  const [event, setEvent] = useState<OrganizerEvent | null>(null);
  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [deleteReason, setDeleteReason] = useState<string>('');
  const [showStatusConfirm, setShowStatusConfirm] = useState<boolean>(false);
  const [pendingStatus, setPendingStatus] = useState<string>('');

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

  // Load event data
  useEffect(() => {
    const loadEvent = async () => {
      if (!isAuthenticated || user?.role !== 'organizer') return;
      setLoading(true);
      try {
        const response = await apiClient.get<{
          success: boolean;
          data: { event: OrganizerEvent };
        }>(API_ENDPOINTS.event(eventId));

        if (response && response.success && response.data?.event) {
          setEvent(response.data.event);
        } else {
          toast.error('Event not found');
          router.push('/organizer/events');
        }
      } catch (error) {
        console.error('Failed to load event:', error);
        toast.error('Failed to load event');
        router.push('/organizer/events');
      } finally {
        setLoading(false);
      }
    };
    loadEvent();
  }, [eventId, isAuthenticated, user?.role, router]);

  // Load event analytics
  useEffect(() => {
    const loadAnalytics = async () => {
      if (!event || !isAuthenticated || user?.role !== 'organizer') return;
      setLoadingAnalytics(true);
      try {
        // Call the real analytics API endpoint
        const analyticsUrl = `${API_ENDPOINTS.event(eventId)}/analytics`;
        console.log('🔍 Calling analytics API:', analyticsUrl);

        const response = await apiClient.get<{
          success: boolean;
          analytics: EventAnalytics;
        }>(analyticsUrl);

        console.log('📊 Analytics API response:', response);

        if (response && response.success && response.analytics) {
          setAnalytics(response.analytics);
          console.log('✅ Analytics loaded successfully:', response.analytics);
        } else {
          console.error('Failed to load analytics:', response);
        }
      } catch (error) {
        console.error('Failed to load analytics:', error);
        // Fallback to basic analytics if API fails
        const fallbackAnalytics: EventAnalytics = {
          totalRegistrations: event.registration_count || 0,
          capacityUtilization: event.capacity
            ? Math.round(
                ((event.registration_count || 0) / event.capacity) * 100
              )
            : 0,
          registrationBreakdown: {
            confirmed: event.registration_count || 0,
            pending: 0,
            cancelled: 0,
          },
          recentRegistrations: [],
        };
        setAnalytics(fallbackAnalytics);
      } finally {
        setLoadingAnalytics(false);
      }
    };
    loadAnalytics();
  }, [event, isAuthenticated, user?.role, eventId]);

  const handleDelete = async () => {
    if (!deleteReason.trim()) {
      toast.error('Please provide a reason for archiving this event');
      return;
    }

    try {
      setDeleting(true);
      // Instead of deleting, we'll archive the event by updating its status
      const res = await apiClient.put<{
        success: boolean;
        message?: string;
      }>(API_ENDPOINTS.event(eventId), {
        ...event,
        status: 'cancelled',
      });

      if ((res as any).success) {
        toast.success('Event archived (cancelled) successfully');
        router.push('/organizer/events');
      } else {
        toast.error('Failed to archive event');
      }
    } catch (e) {
      console.error('Archive error:', e);
      toast.error('Failed to archive event');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteReason('');
    }
  };

  const handleStatusToggle = async () => {
    if (!event) return;
    const newStatus = event.status === 'published' ? 'draft' : 'published';
    try {
      setUpdatingStatus(true);

      const res = await apiClient.put<{
        success: boolean;
        message?: string;
      }>(API_ENDPOINTS.event(eventId), {
        ...event,
        status: newStatus,
      });

      if ((res as any).success) {
        toast.success(
          `Event ${newStatus === 'published' ? 'published' : 'moved to draft'}`
        );
        setEvent(prev => (prev ? { ...prev, status: newStatus } : null));
      } else {
        toast.error('Failed to update event status');
      }
    } catch (error) {
      console.error('Status update error:', error);
      toast.error('Failed to update event status');
    } finally {
      setUpdatingStatus(false);
      setShowStatusConfirm(false);
      setPendingStatus('');
    }
  };

  const confirmStatusChange = (newStatus: string) => {
    setPendingStatus(newStatus);
    setShowStatusConfirm(true);
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(true);
  };

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

  if (!isAuthenticated || user?.role !== 'organizer') return null;
  if (loading) {
    return (
      <>
        <Background />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-2 border-purple-600 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading event...</p>
          </div>
        </div>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <Background />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Event Not Found
            </h1>
          </div>
        </div>
      </>
    );
  }

  const formattedDate = event.date
    ? new Date(event.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'TBD';

  return (
    <>
      <Background />
      <div className="min-h-screen py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              {getStatusIcon(event.status || 'draft')}
              <span className="capitalize text-gray-600 text-sm">
                {event.status || 'draft'}
              </span>
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  event.status || 'draft'
                )}`}
              >
                {event.status === 'published'
                  ? 'Live'
                  : event.status === 'cancelled'
                  ? 'Cancelled'
                  : 'Draft'}
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Event Image */}
            <div className="lg:col-span-1">
              {event.image_url ? (
                <div className="sticky top-8">
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <Image
                      src={event.image_url}
                      alt={event.name}
                      width={600}
                      height={600}
                      className="w-full h-auto object-cover"
                      priority
                    />
                  </div>
                  {/* Quick Actions */}
                  <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Quick Actions
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Link
                        href={`/events/${event.id}`}
                        target="_blank"
                        className="flex items-center justify-center gap-2 px-4 py-3 text-blue-700 hover:text-white hover:bg-blue-600 border border-blue-200 rounded-xl text-sm transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Link>

                      <Link
                        href={`/organizer/events/${event.id}/edit`}
                        className="flex items-center justify-center gap-2 px-4 py-3 text-purple-700 hover:text-white hover:bg-purple-600 border border-purple-200 rounded-xl text-sm transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </Link>

                      <button
                        onClick={() =>
                          confirmStatusChange(
                            event.status === 'published' ? 'draft' : 'published'
                          )
                        }
                        disabled={updatingStatus}
                        className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                          event.status === 'published'
                            ? 'text-yellow-700 hover:text-white hover:bg-yellow-600 border border-yellow-200'
                            : 'text-green-700 hover:text-white hover:bg-green-600 border border-green-200'
                        } disabled:opacity-50`}
                      >
                        {updatingStatus
                          ? 'Updating...'
                          : event.status === 'published'
                          ? 'Move to Draft'
                          : 'Publish Event'}
                      </button>

                      <button
                        onClick={confirmDelete}
                        disabled={deleting}
                        className="flex items-center justify-center gap-2 px-4 py-3 text-red-700 hover:text-white hover:bg-red-600 border border-red-200 rounded-xl text-sm transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Archive
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="sticky top-8">
                  <div className="bg-gray-100 rounded-2xl h-80 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Calendar className="w-8 h-8" />
                      </div>
                      <p className="text-sm">No image</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Event Details & Actions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Event Information */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Event Information
                </h2>

                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Date & Time
                      </p>
                      <p className="text-sm text-gray-600">{formattedDate}</p>
                    </div>
                  </div>

                  {event.venue && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-pink-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Venue
                        </p>
                        <p className="text-sm text-gray-600">{event.venue}</p>
                      </div>
                    </div>
                  )}

                  {event.capacity && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Capacity
                        </p>
                        <p className="text-sm text-gray-600">
                          {event.capacity} slots
                        </p>
                      </div>
                    </div>
                  )}

                  {event.price !== null && event.price !== undefined && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Tag className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Price
                        </p>
                        <p className="text-sm text-gray-600">₱{event.price}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Created On
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(event.created_at || '').toLocaleDateString(
                          'en-US',
                          {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          }
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Description */}
              {event.details && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Description
                  </h2>
                  <p className="text-gray-700 leading-relaxed text-sm">
                    {event.details}
                  </p>
                </div>
              )}

              {/* Event Analytics */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Event Analytics
                </h2>

                {loadingAnalytics ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent"></div>
                    <span className="ml-2 text-gray-600">
                      Loading analytics...
                    </span>
                  </div>
                ) : analytics ? (
                  <div className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-blue-600 font-medium">
                              Total Registrations
                            </p>
                            <p className="text-2xl font-bold text-blue-900">
                              {analytics.totalRegistrations}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-green-600 font-medium">
                              Capacity Utilization
                            </p>
                            <p className="text-2xl font-bold text-green-900">
                              {analytics.capacityUtilization}%
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                            <Tag className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-purple-600 font-medium">
                              Available Slots
                            </p>
                            <p className="text-2xl font-bold text-purple-900">
                              {event.capacity
                                ? event.capacity -
                                  (event.registration_count || 0)
                                : '∞'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Registration Breakdown */}
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">
                        Registration Status
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {analytics.registrationBreakdown.confirmed}
                          </div>
                          <div className="text-sm text-gray-600">Confirmed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">
                            {analytics.registrationBreakdown.pending}
                          </div>
                          <div className="text-sm text-gray-600">Pending</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {analytics.registrationBreakdown.cancelled}
                          </div>
                          <div className="text-sm text-gray-600">Cancelled</div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Registrations */}
                    {analytics.recentRegistrations.length > 0 && (
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <h3 className="text-lg font-medium text-gray-900 mb-3">
                          Recent Registrations
                        </h3>
                        <div className="space-y-3">
                          {analytics.recentRegistrations.map(registration => (
                            <div
                              key={registration.id}
                              className="flex items-center justify-between bg-white p-3 rounded-lg border"
                            >
                              <div>
                                <p className="font-medium text-gray-900">
                                  {registration.attendee_name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {registration.email}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    registration.status === 'confirmed'
                                      ? 'bg-green-100 text-green-700'
                                      : registration.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}
                                >
                                  {registration.status}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(
                                    registration.registered_at
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No Registrations Message */}
                    {analytics.totalRegistrations === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-lg font-medium">
                          No registrations yet
                        </p>
                        <p className="text-sm">
                          Share your event to start getting attendees!
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Analytics not available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Change Confirmation Modal */}
      {showStatusConfirm && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Status Change
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to{' '}
              {pendingStatus === 'published' ? 'publish' : 'move to draft'} this
              event?
              {pendingStatus === 'published'
                ? ' This will make it visible to the public.'
                : ' This will hide it from public view.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowStatusConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusToggle}
                disabled={updatingStatus}
                className={`flex-1 px-4 py-2 rounded-xl transition-colors ${
                  pendingStatus === 'published'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-yellow-600 text-white hover:bg-yellow-700'
                } disabled:opacity-50`}
              >
                {updatingStatus ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Archive Event
            </h3>
            <p className="text-gray-600 mb-4">
              This will archive the event instead of permanently deleting it.
              You can restore it later if needed.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type "Archive" to confirm *
              </label>
              <input
                type="text"
                value={deleteReason}
                onChange={e => setDeleteReason(e.target.value)}
                placeholder="Type 'Archive' to confirm"
                className="w-full px-3 py-2 border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || deleteReason.trim() !== 'Archive'}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Archiving...' : 'Archive Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
