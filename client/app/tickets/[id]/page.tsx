'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, User } from 'lucide-react';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';
import { useAuthContext } from '@/src/components/providers/NeonAuthProvider';
import { apiClient } from '@/src/lib/api';
import { toast } from 'sonner';
import Image from 'next/image';
import Background from '@/src/components/ui/Background';

interface RegistrationDetailResponse {
  success: boolean;
  data: any;
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [registration, setRegistration] = useState<any>(null);
  const [eventImageUrl, setEventImageUrl] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const registrationId = (params?.id as string) || '';

  useEffect(() => {
    document.title = 'Ticket Details - Gowwra';
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!registrationId) return;
      try {
        setLoading(true);
        const res = await apiClient.get<RegistrationDetailResponse>(
          `/api/registrations/${registrationId}`
        );
        if (res.success) {
          setRegistration(res.data);
          // Prefer image on registration if present
          if (res.data?.event_image) {
            setEventImageUrl(res.data.event_image);
          } else if (res.data?.event_id) {
            // Fallback: fetch event to get image_url
            try {
              const eventRes = await apiClient.get<any>(
                `/api/events/${res.data.event_id}`
              );
              const url =
                eventRes?.data?.event?.image_url ||
                eventRes?.data?.event?.imageUrl;
              if (url) setEventImageUrl(url);
            } catch (e) {
              // ignore image load failure
            }
          }
        } else {
          toast.error('Failed to load ticket');
        }
      } catch (e) {
        toast.error('Failed to load ticket');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [registrationId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatPrice = (price?: string) => {
    if (!price) return 'Free';
    const n = parseFloat(price);
    return isNaN(n) || n === 0 ? 'Free' : `₱ ${n.toFixed(2)}`;
  };

  const getPaymentStatusClasses = (status?: string) => {
    switch ((status || '').toLowerCase()) {
      case 'paid':
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'failed':
      case 'refunded':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleCancelTicket = async () => {
    try {
      setCancelling(true);
      const response = await apiClient.delete<{
        success: boolean;
        error?: string;
      }>(`/api/registrations/${registrationId}`);

      if (response.success) {
        toast.success('Ticket cancelled successfully');
        router.push('/dashboard');
      } else {
        toast.error(response.error || 'Failed to cancel ticket');
      }
    } catch (error) {
      console.error('Cancel ticket error:', error);
      toast.error('Failed to cancel ticket');
    } finally {
      setCancelling(false);
      setShowCancelConfirm(false);
    }
  };

  const canCancelTicket = () => {
    if (!registration) return false;
    const eventDate = new Date(registration.event_date);
    const now = new Date();
    return eventDate > now && registration.payment_status !== 'paid';
  };

  const downloadTicket = () => {
    if (!registration) return;

    const ticketContent = `
===========================================
                EVENT TICKET
===========================================

Event: ${registration.event_name}
Date: ${formatDate(registration.event_date)}
Venue: ${registration.event_venue}
Organizer: ${registration.event_organizer}

Ticket Details:
- Quantity: ${registration.ticket_quantity} ticket${
      registration.ticket_quantity > 1 ? 's' : ''
    }
- Total Amount: ₱${registration.payment_amount}
- Status: ${registration.payment_status}

Registration ID: ${registration.id}
Registration Date: ${new Date(
      registration.registration_date
    ).toLocaleDateString()}

===========================================
This ticket is valid for entry to the event.
Please present this ticket at the venue.
===========================================
    `.trim();

    const blob = new Blob([ticketContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${registration.event_name.replace(
      /[^a-zA-Z0-9]/g,
      '-'
    )}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Ticket downloaded successfully!');
  };

  return (
    <ProtectedRoute>
      <Background />
      <div className="min-h-screen  py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Ticket details</h1>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : !registration ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
              <p className="text-gray-700">Ticket not found.</p>
              <Link
                href="/dashboard"
                className="inline-block mt-4 px-4 py-2 bg-purple-600 text-white rounded-md"
              >
                Back to tickets
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Event Image */}
              {eventImageUrl && (
                <div className="h-48 bg-gray-100 relative">
                  <Image
                    src={eventImageUrl}
                    alt={registration?.event_name || 'Event'}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div className="p-6">
                {/* Event Status Badge */}
                {registration?.event_status === 'cancelled' && (
                  <div className="mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
                      Event Cancelled
                    </span>
                  </div>
                )}

                {/* Event Details */}
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {registration?.event_name}
                  </h2>
                  <div className="text-lg text-gray-600 mb-4">
                    <span className="font-medium">
                      {registration?.ticket_quantity}
                    </span>{' '}
                    ticket{registration?.ticket_quantity > 1 ? 's' : ''} •
                    <span className="font-medium ml-1">
                      {registration?.payment_amount == 0
                        ? 'Free'
                        : `₱ ${registration?.payment_amount}`}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {formatDate(registration?.event_date)}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      {registration?.event_venue}
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      {registration?.event_organizer}
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2 text-gray-400">Status:</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusClasses(
                          registration?.payment_status
                        )}`}
                      >
                        {registration?.payment_status?.charAt(0).toUpperCase() +
                          registration?.payment_status?.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ticket Expiration Warning */}
                {registration?.event_status === 'published' &&
                  (() => {
                    const eventDate = new Date(registration.event_date);
                    const now = new Date();
                    const daysUntilEvent = Math.ceil(
                      (eventDate.getTime() - now.getTime()) /
                        (1000 * 60 * 60 * 24)
                    );

                    if (daysUntilEvent < 0) {
                      return (
                        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                          <div className="flex items-center">
                            <span className="text-gray-600 text-sm">
                              ⚠️ This event has already passed. This ticket is
                              no longer valid.
                            </span>
                          </div>
                        </div>
                      );
                    } else if (daysUntilEvent <= 3) {
                      return (
                        <div className="mb-6 p-4 bg-orange-100 rounded-lg">
                          <div className="flex items-center">
                            <span className="text-orange-700 text-sm">
                              ⏰ Event is happening soon! ({daysUntilEvent} day
                              {daysUntilEvent !== 1 ? 's' : ''} remaining)
                            </span>
                          </div>
                        </div>
                      );
                    } else if (daysUntilEvent <= 7) {
                      return (
                        <div className="mb-6 p-4 bg-blue-100 rounded-lg">
                          <div className="flex items-center">
                            <span className="text-blue-700 text-sm flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              Event is coming up! ({daysUntilEvent} days
                              remaining)
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                {/* Action Buttons */}
                <div className="pt-4 border-t border-gray-200 flex gap-3">
                  <button
                    onClick={downloadTicket}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Download Ticket
                  </button>
                  {canCancelTicket() && (
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      disabled={cancelling}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cancelling ? 'Cancelling...' : 'Cancel Ticket'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cancel Confirmation Modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="absolute inset-0 bg-black bg-opacity-50"></div>
            <div className="relative z-10 bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Cancel Ticket
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel this ticket? This action cannot
                be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Keep Ticket
                </button>
                <button
                  onClick={handleCancelTicket}
                  disabled={cancelling}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Ticket'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
