'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Background from '@/src/components/ui/Background';
import {
  Calendar,
  MapPin,
  Users,
  ArrowLeft,
  CheckCircle,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  UploadCloud,
  Globe,
  Users2,
  CalendarDays,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { apiClient, API_ENDPOINTS } from '@/src/lib/api';
import { toast } from 'sonner';
import { useAuthContext } from '@/src/components/providers/NeonAuthProvider';
import { useEffect } from 'react';

export default function PreviewEventPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, isAuthenticated } = useAuthContext();

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

  const draft = useMemo(() => {
    const name = params.get('name') || '';
    const details = params.get('details') || '';
    const date = params.get('date') || '';
    const venue = params.get('venue') || '';
    const image_url = params.get('image_url') || '';
    const price = params.get('price') ? Number(params.get('price')) : 0;
    const capacity = params.get('capacity')
      ? Number(params.get('capacity'))
      : null;
    const registration_deadline = params.get('registration_deadline') || '';
    return {
      name,
      details,
      date,
      venue,
      image_url,
      price,
      capacity,
      registration_deadline,
    };
  }, [params]);

  const [publishing, setPublishing] = useState(false);
  const [imageError, setImageError] = useState(false);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Pick date & time';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const formatPrice = (price?: number | null) => {
    if (price === null || price === undefined) return '₱0.00';
    return price === 0 ? 'Free' : `₱${price.toFixed(2)}`;
  };

  const handleBack = () => {
    const backParams = new URLSearchParams();
    backParams.set('name', draft.name);
    if (draft.details) backParams.set('details', draft.details);
    if (draft.date) backParams.set('date', draft.date);
    if (draft.venue) backParams.set('venue', draft.venue);
    if (draft.image_url) backParams.set('image_url', draft.image_url);
    if (typeof draft.price === 'number')
      backParams.set('price', String(draft.price));
    if (typeof draft.capacity === 'number')
      backParams.set('capacity', String(draft.capacity));
    if (draft.registration_deadline)
      backParams.set('registration_deadline', draft.registration_deadline);
    router.push(`/organizer/events/create?${backParams.toString()}`);
  };

  const handlePublish = async () => {
    try {
      setPublishing(true);
      const payload = {
        name: draft.name,
        details: draft.details || null,
        date: draft.date,
        imageUrl: draft.image_url || null, // Fixed: backend expects imageUrl
        venue: draft.venue,
        price: typeof draft.price === 'number' ? draft.price : 0,
        capacity: typeof draft.capacity === 'number' ? draft.capacity : null,
        registrationDeadline: draft.registration_deadline || null,
      };
      const res = await apiClient.post<{
        success: boolean;
        event?: { id: string };
      }>(API_ENDPOINTS.events, payload);
      if ((res as any).success && (res as any).event?.id) {
        toast.success('Event published');
        router.push(`/organizer/events/${(res as any).event.id}/edit`);
      } else {
        toast.error('Failed to publish event');
      }
    } catch (e) {
      console.error('Publish error:', e);
      toast.error('Failed to publish event');
    } finally {
      setPublishing(false);
    }
  };

  if (!isAuthenticated || user?.role !== 'organizer') {
    return null;
  }

  // Loading Screen when Publishing
  if (publishing) {
    return (
      <>
        <Background />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            {/* Animated Loading Icon */}
            <div className="relative mb-8">
              <div className="w-32 h-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Loader2 className="w-16 h-16 text-white animate-spin" />
              </div>
              {/* Floating Sparkles */}
              <div className="absolute -top-4 -left-4 animate-bounce">
                <Sparkles className="w-8 h-8 text-yellow-400" />
              </div>
              <div
                className="absolute -top-4 -right-4 animate-bounce"
                style={{ animationDelay: '0.5s' }}
              >
                <Sparkles className="w-8 h-8 text-pink-400" />
              </div>
              <div
                className="absolute -bottom-4 -left-4 animate-bounce"
                style={{ animationDelay: '1s' }}
              >
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>
              <div
                className="absolute -bottom-4 -right-4 animate-bounce"
                style={{ animationDelay: '1.5s' }}
              >
                <Sparkles className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            {/* Loading Text */}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Publishing Your Event
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
              We're setting up your event and making it live for everyone to
              see...
            </p>

            {/* Progress Steps */}
            <div className="space-y-4 max-w-sm mx-auto">
              <div className="flex items-center gap-3 text-left">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <span className="text-gray-700">Validating event details</span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <span className="text-gray-700">Creating event page</span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center animate-pulse">
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                </div>
                <span className="text-gray-700">Publishing to database</span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-500 text-xs">4</span>
                </div>
                <span className="text-gray-500">Finalizing setup</span>
              </div>
            </div>

            {/* Loading Bar */}
            <div className="mt-8 max-w-md mx-auto">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full animate-pulse"
                  style={{ width: '75%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Background />
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Preview Event</h1>
            <p className="text-gray-600">Review your event before publishing</p>
          </div>

          {/* Preview Card similar to event detail */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8 border border-gray-100">
            <div className="relative h-72 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 overflow-hidden">
              {draft.image_url && !imageError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={draft.image_url}
                  alt={draft.name}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                  onLoad={() => setImageError(false)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-24 w-24 text-white opacity-80" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <div className="absolute top-6 left-6">
                <div className="bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 border border-white/50">
                  <span className="text-purple-600 font-bold text-lg">
                    {formatPrice(draft.price)}
                  </span>
                </div>
              </div>
              <div className="absolute bottom-6 left-6 right-6">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {draft.name || 'Untitled Event'}
                </h2>
                <p className="text-white/90 text-lg font-medium">
                  Organized by You
                </p>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 mb-1">Date & Time</p>
                    <p className="text-gray-800 font-medium">
                      {formatDate(draft.date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-pink-50 to-orange-50 rounded-2xl">
                  <div className="flex-shrink-0 w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-pink-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 mb-1">Venue</p>
                    <p className="text-gray-800 font-medium">
                      {draft.venue || 'Venue TBD'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl md:col-span-2">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 mb-1">Capacity</p>
                    <p className="text-gray-800 font-medium">
                      {draft.capacity ?? 'Unlimited'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Details */}
              {draft.details && (
                <div className="mt-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    About This Event
                  </h3>
                  <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 rounded-2xl p-6 border border-purple-100">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap font-medium text-lg">
                      {draft.details}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleBack}
              className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 hover:border-gray-400 transition-all"
            >
              Back to Edit
            </button>
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg disabled:opacity-50"
            >
              {publishing ? 'Publishing...' : 'Publish Event'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
