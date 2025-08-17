'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/src/components/providers/NeonAuthProvider';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Building2, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import UpgradeToOrganizerModal from '@/src/components/UpgradeToOrganizerModal';
import Background from '@/src/components/ui/Background';

export default function OrganizerUpgradePage() {
  const { user, upgradeToOrganizer, isAuthenticated } = useAuthContext();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Redirect if already an organizer
  useEffect(() => {
    if (isAuthenticated && user?.role === 'organizer') {
      router.push('/organizer');
    }
  }, [isAuthenticated, user?.role, router]);

  // Don't render if redirecting
  if (!isAuthenticated || user?.role === 'organizer') {
    return null;
  }

  const handleUpgrade = async (upgradeData: any) => {
    setIsUpgrading(true);
    try {
      const result = await upgradeToOrganizer(upgradeData);

      if (result.success) {
        toast.success('🎉 Congratulations! You are now an organizer!');

        // Small delay to show success message and ensure state is updated
        setTimeout(() => {
          // Redirect to organizer dashboard
          router.push('/organizer');
        }, 1000);

        return { success: true };
      } else {
        toast.error(result.error || 'Upgrade failed. Please try again.');
        return { success: false, error: result.error };
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <>
      <Background />
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-10 h-10 text-purple-600" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Become an Organizer
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Transform your account and start creating amazing events for
                your community
              </p>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Why Become an Organizer?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Event Creation
                  </h3>
                  <p className="text-gray-600">
                    Create professional events with detailed information,
                    pricing, and registration options
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-pink-50 to-orange-50 rounded-2xl">
                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-pink-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Registration Management
                  </h3>
                  <p className="text-gray-600">
                    Track attendees, manage capacity, and handle registrations
                    efficiently
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Analytics & Insights
                  </h3>
                  <p className="text-gray-600">
                    Get detailed analytics on event performance and attendee
                    engagement
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Professional Tools
                  </h3>
                  <p className="text-gray-600">
                    Access advanced features for event promotion and management
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Current User Info */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Your Account
            </h2>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {user?.name || 'User'}
                  </h3>
                  <p className="text-gray-600">{user?.email}</p>
                  <p className="text-sm text-purple-600 font-medium">
                    Current Role: Regular User
                  </p>
                </div>
              </div>

              <p className="text-gray-700">
                Ready to take the next step? Upgrade your account to start
                creating and managing events.
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Building2 className="w-6 h-6" />
              Start Your Organizer Journey
            </button>

            <p className="text-gray-600 mt-4">
              It only takes a few minutes to set up your organizer profile
            </p>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeToOrganizerModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={handleUpgrade}
        isLoading={isUpgrading}
      />
    </>
  );
}
