'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ArrowRight,
  CreditCard,
  CheckCircle,
  AlertCircle,
  User,
  X,
  Phone,
  Mail,
} from 'lucide-react';
import { apiClient } from '@/src/lib/api';
import { useAuthContext } from '@/src/components/providers/NeonAuthProvider';
import { toast } from 'sonner';
import Image from 'next/image';
import Background from '@/src/components/ui/Background';
import LoginPromptModal from '@/src/components/LoginPromptModal';

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
  paid_registrations?: number;
  pending_registrations?: number;
}

interface EventResponse {
  success: boolean;
  data: {
    event: Event;
  };
  message: string;
}

interface RegistrationResponse {
  success: boolean;
  data?: {
    registration: any;
    event: any;
  };
  error?: string;
  message: string;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, apiCallWithRefresh } = useAuthContext();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showLoginPromptModal, setShowLoginPromptModal] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({
    name: '',
    email: '',
    phone: '',
    emergencyContact: '',
    dietaryRestrictions: '',
    specialRequests: '',
  });
  const [showConfirmation, setShowConfirmation] = useState(false);

  const eventId = params.id as string;

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<EventResponse>(
        `/api/events/${eventId}`
      );

      if (response.success && response.data) {
        setEvent(response.data.event);
      } else {
        toast.error('Event not found');
        router.push('/events');
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Failed to load event');
      router.push('/events');
    } finally {
      setLoading(false);
    }
  };

  const checkRegistrationStatus = async () => {
    if (!isAuthenticated || !user) return;

    try {
      const response = await apiCallWithRefresh(async token => {
        return await apiClient.get(
          '/api/registrations/my-registrations?limit=100'
        );
      });

      if ((response as any).success && (response as any).data) {
        const userRegistrations = (response as any).data.registrations;
        const eventRegistration = userRegistrations.find(
          (reg: any) => reg.event_id === eventId
        );
        setIsRegistered(!!eventRegistration);
      }
    } catch (error) {
      console.error('Error checking registration status:', error);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  useEffect(() => {
    if (event && isAuthenticated) {
      checkRegistrationStatus();
    }
  }, [event, isAuthenticated, user]);

  const handleOpenRegistrationModal = () => {
    if (!isAuthenticated) {
      setShowLoginPromptModal(true);
      return;
    }

    // Pre-fill form with user information
    setRegistrationForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
      emergencyContact: '',
      dietaryRestrictions: '',
      specialRequests: '',
    });
    setShowRegistrationModal(true);
  };

  const handleCloseRegistrationModal = () => {
    setShowRegistrationModal(false);
    setShowConfirmation(false);
    setRegistrationForm({
      name: '',
      email: '',
      phone: '',
      emergencyContact: '',
      dietaryRestrictions: '',
      specialRequests: '',
    });
  };

  const handleRegistrationFormChange = (field: string, value: string) => {
    setRegistrationForm(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Show confirmation step first
    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    try {
      setRegistering(true);
      const response = await apiCallWithRefresh(async token => {
        return await apiClient.post<RegistrationResponse>(
          '/api/registrations',
          {
            eventId: eventId,
            additionalInfo: JSON.stringify(registrationForm),
          }
        );
      });

      if (response.success) {
        toast.success('Successfully registered for the event!');
        setIsRegistered(true);
        setShowRegistrationModal(false);
        setShowConfirmation(false);
        // Refresh event data to update registration count
        fetchEvent();
      } else {
        toast.error(response.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to register for event');
    } finally {
      setRegistering(false);
    }
  };

  const handleBackToForm = () => {
    setShowConfirmation(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    return numPrice === 0 ? 'Free' : `₱${numPrice.toFixed(2)}`;
  };

  const getAvailableSpots = (capacity: number, registrationCount: number) => {
    const available = capacity - registrationCount;
    return available > 0 ? available : 0;
  };

  const isEventPast = (eventDate: string) => {
    return new Date(eventDate) < new Date();
  };

  const isRegistrationClosed = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 w-24 bg-gray-200 rounded mb-8"></div>
            <div className="h-64 bg-gray-200 rounded-2xl mb-8"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
              <div className="h-64 bg-gray-200 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Event Not Found
            </h1>
            <p className="text-gray-600 mb-8">
              The event you're looking for doesn't exist.
            </p>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
            >
              Back to Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const availableSpots = getAvailableSpots(
    event.capacity || 0,
    event.registration_count || 0
  );
  const eventPast = isEventPast(event.date || '');
  const registrationClosed = isRegistrationClosed(
    event.registration_deadline || ''
  );
  const canRegister =
    !eventPast &&
    !registrationClosed &&
    availableSpots > 0 &&
    event.status === 'published';

  return (
    <>
      <Background />
      <div className="min-h-screen  py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Event Hero */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8 border border-gray-100">
            {/* Hero Image Section */}
            <div className="relative h-80 lg:h-96 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 overflow-hidden">
              {event.image_url ? (
                <Image
                  width={500}
                  height={500}
                  src={event.image_url}
                  alt={event.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600">
                  <Calendar className="h-32 w-32 text-white opacity-90" />
                </div>
              )}

              {/* Hero Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

              {/* Status Badge */}
              <div className="absolute top-6 right-6">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-bold backdrop-blur-sm border ${
                    (event.status || 'unknown') === 'published'
                      ? 'bg-green-100/90 text-green-800 border-green-200'
                      : (event.status || 'unknown') === 'draft'
                      ? 'bg-yellow-100/90 text-yellow-800 border-yellow-200'
                      : (event.status || 'unknown') === 'cancelled'
                      ? 'bg-red-100/90 text-red-800 border-red-200'
                      : 'bg-gray-100/90 text-gray-800 border-gray-200'
                  }`}
                >
                  {(event.status || 'unknown').charAt(0).toUpperCase() +
                    (event.status || 'unknown').slice(1)}
                </span>
              </div>

              {/* Price Badge */}
              <div className="absolute top-6 left-6">
                <div className="bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 border border-white/50">
                  <span className="text-purple-600 font-bold text-lg">
                    {formatPrice(event.price || '')}
                  </span>
                </div>
              </div>

              {/* Event Title Overlay */}
              <div className="absolute bottom-6 left-6 right-6">
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2 drop-shadow-lg">
                  {event.name}
                </h1>
                <p className="text-white/90 text-lg font-medium drop-shadow">
                  Organized by {event.organizer}
                </p>
              </div>
            </div>

            {/* Event Details Section */}
            <div className="p-8 lg:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl">
                    <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 mb-1">
                        Date & Time
                      </p>
                      <p className="text-gray-700 font-medium">
                        {formatDate(event.date || '')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-pink-50 to-orange-50 rounded-2xl">
                    <div className="flex-shrink-0 w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-pink-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 mb-1">Venue</p>
                      <p className="text-gray-700 font-medium">
                        {event.venue || 'Venue TBD'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl">
                    <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 mb-1">Capacity</p>
                      <p className="text-gray-700 font-medium">
                        <span className="text-green-600 font-bold">
                          {event.registration_count}
                        </span>
                        /{event.capacity} registered
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {availableSpots > 0 ? (
                          <span className="text-green-600 font-semibold">
                            {availableSpots} spots left
                          </span>
                        ) : (
                          <span className="text-red-600 font-semibold">
                            Fully booked
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl">
                    <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <Clock className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 mb-1">
                        Registration Deadline
                      </p>
                      <p className="text-gray-700 font-medium">
                        {formatDate(event.registration_deadline || '')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Event Description */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 lg:p-10">
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">
                      About This Event
                    </h2>
                  </div>

                  <div className="prose prose-lg max-w-none">
                    <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 rounded-2xl p-6 border border-purple-100">
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap font-medium text-lg">
                        {event.details}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Event Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-8 border-t border-gray-200">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6">
                    <h3 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      Who Should Attend?
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      This event is perfect for anyone interested in{' '}
                      {event.name.toLowerCase()}. Whether you're a beginner or
                      have experience, you'll find valuable insights and
                      connections.
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6">
                    <h3 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      What to Expect
                    </h3>
                    <ul className="text-gray-700 space-y-2">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        Engaging presentations and discussions
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        Networking opportunities
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        Practical takeaways and insights
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Event Organizer Info */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6">
                    <h3 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
                      <User className="h-5 w-5 text-purple-600" />
                      Event Organizer
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {event.organizer.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">
                          {event.organizer}
                        </p>
                        <p className="text-gray-600">Event Organizer</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sticky top-8">
                {/* Price Display */}
                <div className="text-center mb-8">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white mb-4">
                    <div className="text-4xl font-bold mb-2">
                      {formatPrice(event.price || '')}
                    </div>
                    <p className="text-purple-100 font-medium">per ticket</p>
                  </div>
                </div>

                {/* Registration Status */}
                {isRegistered ? (
                  <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl mb-8">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-bold text-green-800 text-lg">
                          Successfully Registered! 🎉
                        </p>
                        <p className="text-green-600 font-medium">
                          You're all set for this event
                        </p>
                      </div>
                    </div>
                  </div>
                ) : eventPast ? (
                  <div className="p-6 bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200 rounded-2xl mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-lg">
                          Event Ended
                        </p>
                        <p className="text-gray-600 font-medium">
                          This event has already taken place
                        </p>
                      </div>
                    </div>
                  </div>
                ) : registrationClosed ? (
                  <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Clock className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-bold text-yellow-800 text-lg">
                          Registration Closed
                        </p>
                        <p className="text-yellow-600 font-medium">
                          Registration deadline has passed
                        </p>
                      </div>
                    </div>
                  </div>
                ) : availableSpots === 0 ? (
                  <div className="p-6 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <p className="font-bold text-red-800 text-lg">
                          Fully Booked
                        </p>
                        <p className="text-red-600 font-medium">
                          No more spots available
                        </p>
                      </div>
                    </div>
                  </div>
                ) : event.status !== 'published' ? (
                  <div className="p-6 bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200 rounded-2xl mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-lg">
                          Not Available
                        </p>
                        <p className="text-gray-600 font-medium">
                          Event is not published yet
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Registration Button */}
                {canRegister && !isRegistered && (
                  <div className="space-y-6">
                    {isAuthenticated ? (
                      <button
                        onClick={handleOpenRegistrationModal}
                        className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        <CreditCard className="h-6 w-6" />
                        <span className="text-lg">Register Now</span>
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <Link
                          href="/login"
                          className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                          <User className="h-6 w-6" />
                          <span className="text-lg">Sign In to Register</span>
                        </Link>
                        <div className="text-center">
                          <p className="text-gray-600 font-medium">
                            Don't have an account?{' '}
                          </p>
                          <Link
                            href="/register"
                            className="text-purple-600 hover:text-purple-700 font-bold text-lg hover:underline"
                          >
                            Create one here
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Registration Modal */}
        {showRegistrationModal && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            {/* Backdrop blur effect */}
            <div className="absolute inset-0 bg-white/30 backdrop-blur-sm"></div>
            <div className="relative z-10 bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  Register for Event
                </h2>
                <button
                  onClick={handleCloseRegistrationModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {!showConfirmation ? (
                  <>
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {event?.name}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Please fill out the registration form below
                      </p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-6">
                      {/* Name (Pre-filled) */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            required
                            value={registrationForm.name}
                            onChange={e =>
                              handleRegistrationFormChange(
                                'name',
                                e.target.value
                              )
                            }
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="Enter your full name"
                          />
                        </div>
                      </div>

                      {/* Email (Pre-filled) */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="email"
                            required
                            value={registrationForm.email}
                            onChange={e =>
                              handleRegistrationFormChange(
                                'email',
                                e.target.value
                              )
                            }
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="Enter your email address"
                          />
                        </div>
                      </div>

                      {/* Submit Button */}
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={handleCloseRegistrationModal}
                          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={
                            !registrationForm.name.trim() ||
                            !registrationForm.email.trim()
                          }
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          <ArrowRight className="h-5 w-5" />
                          <span>Review Registration</span>
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <>
                    {/* Confirmation Step */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Confirm Your Registration
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Please review your information below
                      </p>
                    </div>

                    <div className="space-y-4 mb-6">
                      {/* Event Details */}
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Event Details
                        </h4>
                        <p className="text-gray-700 font-medium">
                          {event?.name}
                        </p>
                        <p className="text-gray-600 text-sm">
                          {formatDate(event?.date || '')}
                        </p>
                        <p className="text-gray-600 text-sm">{event?.venue}</p>
                      </div>

                      {/* Personal Information */}
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">
                          Your Information
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Name:</span>
                            <span className="font-medium text-gray-900">
                              {registrationForm.name}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Email:</span>
                            <span className="font-medium text-gray-900">
                              {registrationForm.email}
                            </span>
                          </div>
                          {registrationForm.emergencyContact && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Emergency Contact:
                              </span>
                              <span className="font-medium text-gray-900">
                                {registrationForm.emergencyContact}
                              </span>
                            </div>
                          )}
                          {registrationForm.dietaryRestrictions && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Dietary Restrictions:
                              </span>
                              <span className="font-medium text-gray-900">
                                {registrationForm.dietaryRestrictions}
                              </span>
                            </div>
                          )}
                          {registrationForm.specialRequests && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Special Requests:
                              </span>
                              <span className="font-medium text-gray-900">
                                {registrationForm.specialRequests}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Confirmation Buttons */}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleBackToForm}
                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200"
                      >
                        Back to Edit
                      </button>
                      <button
                        onClick={handleRegister}
                        disabled={registering}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        {registering ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Registering...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-5 w-5" />
                            <span>Confirm Registration</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Login Prompt Modal */}
      <LoginPromptModal
        isOpen={showLoginPromptModal}
        onClose={() => setShowLoginPromptModal(false)}
        title="Login Required"
        message="You need to be logged in to register for this event. Please log in or create an account to continue."
      />
    </>
  );
}
