'use client';

import { useAuthContext } from '@/src/components/providers/NeonAuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Plus,
  ArrowLeft,
  Calendar,
  MapPin,
  Image as ImageIcon,
  Ticket,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import Background from '@/src/components/ui/Background';

export default function CreateEventPage() {
  const { user, isAuthenticated } = useAuthContext();
  const router = useRouter();

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

  if (!isAuthenticated || user?.role !== 'organizer') {
    return null;
  }

  return (
    <>
      <Background />
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="text-center mt-5">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Create New Event
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Start building your community with a new event
              </p>
            </div>
          </div>

          {/* Create Event Form */}
          <CreateEventForm
            onSuccess={id => router.push(`/organizer/events/${id}/edit`)}
          />
        </div>
      </div>
    </>
  );
}

function CreateEventForm({ onSuccess }: { onSuccess: (id: string) => void }) {
  const [name, setName] = useState('');
  const [details, setDetails] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [capacity, setCapacity] = useState<number | ''>('');
  const [imageUrl, setImageUrl] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const router = useRouter();

  // Prefill from query when navigating back from preview
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const qName = params.get('name');
    const qDetails = params.get('details');
    const qDate = params.get('date');
    const qVenue = params.get('venue');
    const qImage = params.get('image_url');
    const qPrice = params.get('price');
    const qCapacity = params.get('capacity');
    const qDeadline = params.get('registration_deadline');
    if (qName) setName(qName);
    if (qDetails) setDetails(qDetails);
    if (qDate) setDate(qDate);
    if (qVenue) setVenue(qVenue);
    if (qImage) setImageUrl(qImage);
    if (qPrice && !isNaN(Number(qPrice))) setPrice(Number(qPrice));
    if (qCapacity && !isNaN(Number(qCapacity))) setCapacity(Number(qCapacity));
    if (qDeadline) setRegistrationDeadline(qDeadline);
  }, []);

  const handlePreview = () => {
    const params = new URLSearchParams();
    params.set('name', name);
    if (details) params.set('details', details);
    params.set('date', date);
    params.set('venue', venue);
    if (imageUrl) params.set('image_url', imageUrl);
    if (typeof price === 'number') params.set('price', String(price));
    if (typeof capacity === 'number') params.set('capacity', String(capacity));
    if (registrationDeadline)
      params.set('registration_deadline', registrationDeadline);
    router.push(`/organizer/events/preview?${params.toString()}`);
  };

  return (
    <form className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-8">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900">Event Information</h3>
        <p className="text-sm text-gray-600">
          Provide details about your event.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <label className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span>
                Event Name <span className="text-red-500">*</span>
              </span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Tech Community Meetup"
              className="w-full px-4 py-4 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all text-gray-900 placeholder-gray-400 font-medium hover:border-purple-400"
              required
            />
          </div>

          <div>
            <label className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
              Details
            </label>
            <textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Describe your event, agenda, and who should attend"
              rows={5}
              className="w-full px-4 py-4 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all text-gray-900 placeholder-gray-400 font-medium resize-none"
            />
          </div>

          <fieldset className="border border-gray-200 rounded-2xl p-4">
            <legend className="px-2 text-sm font-bold text-gray-900">
              Schedule
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Date & Time <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <input
                    type="datetime-local"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-4 py-3 border-2 text-gray-900  border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500  transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Registration Deadline
                </label>
                <input
                  type="datetime-local"
                  value={registrationDeadline}
                  onChange={e => setRegistrationDeadline(e.target.value)}
                  className="w-full px-4 py-3 border-2 text-gray-900  border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all"
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="border border-gray-200 rounded-2xl p-4">
            <legend className="px-2 text-sm font-bold text-gray-900">
              Location & Capacity
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Venue <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={venue}
                    onChange={e => setVenue(e.target.value)}
                    placeholder="e.g., City Hall Conference Room"
                    className="w-full px-4 py-3 border-2 text-gray-900 placeholder-gray-400 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Capacity
                </label>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <input
                    type="number"
                    min="1"
                    value={capacity}
                    onChange={e =>
                      setCapacity(
                        e.target.value === '' ? '' : Number(e.target.value)
                      )
                    }
                    placeholder="e.g., 100"
                    className="w-full px-4 py-3 border-2 text-gray-900 placeholder-gray-400 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </fieldset>

          <fieldset className="border border-gray-200 rounded-2xl p-4">
            <legend className="px-2 text-sm font-bold text-gray-900">
              Pricing & Media
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Price
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-base">₱</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={e =>
                      setPrice(
                        e.target.value === '' ? '' : Number(e.target.value)
                      )
                    }
                    placeholder="0.00"
                    className="w-full px-4 py-3 border-2 text-gray-900 placeholder-gray-400 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Image URL
                </label>
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-gray-500" />
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-3 border-2 text-gray-900 placeholder-gray-400 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all"
                  />
                </div>
                {/* Live preview removed */}
              </div>
            </div>
          </fieldset>

          <div className="flex gap-4 pt-2">
            <Link
              href="/organizer/events"
              className="flex-1 px-8 py-4 border-2 text-center border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={handlePreview}
              className="flex-1 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl hover:from-purple-700 hover:to-pink-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              View Preview
            </button>
          </div>
        </div>
        {/* Removed live preview column */}
      </div>
    </form>
  );
}
