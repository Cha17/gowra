'use client';

import { useAuthContext } from '@/src/components/providers/NeonAuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Building2, Plus, ArrowLeft } from 'lucide-react';
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
            <Link
              href="/organizer/events"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to My Events
            </Link>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Plus className="w-10 h-10 text-purple-600" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Create New Event
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Start building your community with a new event
              </p>
            </div>
          </div>

          {/* Coming Soon */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Event Creation Coming Soon!
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              We're working hard to bring you a powerful event creation tool.
              This will be available in Day 4 of our implementation!
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/organizer"
                className="inline-flex items-center gap-2 px-6 py-3 border border-purple-600 text-purple-600 font-semibold rounded-2xl hover:bg-purple-600 hover:text-white transition-all duration-200"
              >
                Back to Dashboard
              </Link>
              <Link
                href="/organizer/events"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
              >
                View My Events
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
