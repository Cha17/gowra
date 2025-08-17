'use client';

import { useAuthContext } from '@/src/components/providers/NeonAuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Building2, Plus, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Background from '@/src/components/ui/Background';

export default function OrganizerEventsPage() {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/organizer"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>

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
          </div>
        </div>
      </div>
    </>
  );
}
