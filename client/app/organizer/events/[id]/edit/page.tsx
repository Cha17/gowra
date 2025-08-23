'use client';

import { useAuthContext } from '@/src/components/providers/NeonAuthProvider';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Image as ImageIcon,
  Users,
  Save,
  Building2,
  FileText,
  Clock,
  Globe,
  Tag,
} from 'lucide-react';
import Link from 'next/link';
import Background from '@/src/components/ui/Background';
import { apiClient, API_ENDPOINTS } from '@/src/lib/api';
import { toast } from 'sonner';

interface EventData {
  id: string;
  name: string;
  details?: string | null;
  date?: string | null;
  image_url?: string | null;
  venue?: string | null;
  status?: string | null;
  price?: number | null;
  capacity?: number | null;
  registration_deadline?: string | null;
}

export default function EditEventPage() {
  const { user, isAuthenticated, apiCallWithRefresh } = useAuthContext();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const eventId = params?.id as string;

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
    () => isAuthenticated && user?.role === 'organizer' && !!eventId,
    [isAuthenticated, user?.role, eventId]
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    details: '',
    date: '',
    venue: '',
    price: '' as number | '',
    capacity: '' as number | '',
    imageUrl: '',
    registrationDeadline: '',
    status: 'draft',
  });

  useEffect(() => {
    const load = async () => {
      if (!canRender) return;
      setLoading(true);
      try {
        const res = await apiCallWithRefresh(async (token: string) => {
          return await apiClient.get<{
            success: boolean;
            data: { event: EventData };
          }>(API_ENDPOINTS.event(eventId));
        });

        if (res && (res as any).success && (res as any).data?.event) {
          const e = (res as any).data.event as EventData;
          setForm({
            name: e.name || '',
            details: e.details || '',
            date: e.date ? new Date(e.date).toISOString().slice(0, 16) : '',
            venue: e.venue || '',
            price: typeof e.price === 'number' ? e.price : '',
            capacity: typeof e.capacity === 'number' ? e.capacity : '',
            imageUrl: e.image_url || '',
            registrationDeadline: e.registration_deadline
              ? new Date(e.registration_deadline).toISOString().slice(0, 16)
              : '',
            status: e.status || 'draft',
          });
        } else {
          toast.error('Event not found');
          router.push('/organizer/events');
        }
      } catch (e) {
        toast.error('Failed to load event');
        router.push('/organizer/events');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [canRender, eventId, router]);

  const handleChange = (field: keyof typeof form, value: any) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        details: form.details || null,
        date: form.date,
        imageUrl: form.imageUrl || null,
        venue: form.venue,
        price: typeof form.price === 'number' ? form.price : 0,
        capacity: typeof form.capacity === 'number' ? form.capacity : null,
        registrationDeadline: form.registrationDeadline || null,
        status: form.status || 'draft',
      };
      const res = await apiCallWithRefresh(async (token: string) => {
        return await apiClient.put<{ success: boolean }>(
          API_ENDPOINTS.event(eventId),
          payload
        );
      });

      if (res && (res as any).success) {
        toast.success('Event updated successfully!');
        router.push('/organizer/events');
      } else {
        toast.error('Failed to update event');
      }
    } catch (e) {
      console.error('Update error:', e);
      toast.error('Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  if (!canRender) return null;

  return (
    <>
      <Background />
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 mt-5">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-10 h-10 text-purple-600" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Edit Event
              </h1>
              <p className="text-xl text-gray-600">
                Update your event details and settings
              </p>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading event details...</p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  {/* Event Name */}
                  <div>
                    <label className="block text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Tag className="w-5 h-5 text-purple-600" />
                      Event Name
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => handleChange('name', e.target.value)}
                      placeholder="e.g., Tech Community Meetup"
                      className="w-full px-4 py-4 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all text-gray-900 placeholder-gray-400 font-medium hover:border-purple-400"
                      required
                    />
                  </div>

                  {/* Event Details */}
                  <div>
                    <label className="block text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      Event Details
                    </label>
                    <textarea
                      value={form.details}
                      onChange={e => handleChange('details', e.target.value)}
                      placeholder="Describe your event, agenda, and who should attend"
                      rows={5}
                      className="w-full px-4 py-4 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all text-gray-900 placeholder-gray-400 font-medium resize-none hover:border-purple-400"
                    />
                  </div>
                </div>

                {/* Schedule Section */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-purple-600" />
                    Schedule
                  </h3>

                  <div>
                    <label className="block text-base font-semibold text-gray-800 mb-2">
                      Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={form.date}
                      onChange={e => handleChange('date', e.target.value)}
                      className="w-full px-4 py-3 border-2 text-gray-900 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all hover:border-purple-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-base font-semibold text-gray-800 mb-2">
                      Registration Deadline
                    </label>
                    <input
                      type="datetime-local"
                      value={form.registrationDeadline}
                      onChange={e =>
                        handleChange('registrationDeadline', e.target.value)
                      }
                      className="w-full px-4 py-3 border-2 text-gray-900 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all hover:border-purple-400"
                    />
                  </div>
                </div>

                {/* Location & Capacity Section */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-pink-600" />
                    Location & Capacity
                  </h3>

                  <div>
                    <label className="block text-base font-semibold text-gray-800 mb-2">
                      Venue
                    </label>
                    <input
                      type="text"
                      value={form.venue}
                      onChange={e => handleChange('venue', e.target.value)}
                      placeholder="e.g., City Hall Conference Room"
                      className="w-full px-4 py-3 border-2 text-gray-900 placeholder-gray-400 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all hover:border-purple-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-base font-semibold text-gray-800 mb-2">
                      Capacity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={form.capacity}
                      onChange={e =>
                        handleChange(
                          'capacity',
                          e.target.value === '' ? '' : Number(e.target.value)
                        )
                      }
                      placeholder="e.g., 100"
                      className="w-full px-4 py-3 border-2 text-gray-900 placeholder-gray-400 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all hover:border-purple-400"
                    />
                  </div>
                </div>

                {/* Pricing & Media Section */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-green-600">₱</span>
                    Pricing & Media
                  </h3>

                  <div>
                    <label className="block text-base font-semibold text-gray-800 mb-2">
                      Price (₱)
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 font-base">₱</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.price}
                        onChange={e =>
                          handleChange(
                            'price',
                            e.target.value === '' ? '' : Number(e.target.value)
                          )
                        }
                        placeholder="0.00"
                        className="w-full px-4 py-3 border-2 text-gray-900 placeholder-gray-400 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all hover:border-purple-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-base font-semibold text-gray-800 mb-2">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={form.imageUrl}
                      onChange={e => handleChange('imageUrl', e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-4 py-3 border-2 text-gray-900 placeholder-gray-400 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all hover:border-purple-400"
                    />
                  </div>
                </div>

                {/* Status Section */}
                <div className="lg:col-span-2">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Globe className="w-6 h-6 text-blue-600" />
                    Event Status
                  </h3>
                  <div>
                    <label className="block text-base font-semibold text-gray-800 mb-2">
                      Current Status
                    </label>
                    <select
                      value={form.status}
                      onChange={e => handleChange('status', e.target.value)}
                      className="w-full px-4 py-3 border-2 text-gray-900 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all hover:border-purple-400"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
                <Link
                  href="/organizer/events"
                  className="flex-1 px-8 py-4 border-2 text-center border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl hover:from-purple-700 hover:to-pink-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
