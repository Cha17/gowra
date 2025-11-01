'use client';

import { useAuthContext } from '@/src/components/providers/NeonAuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Building2,
  Plus,
  Calendar,
  Users,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import Background from '@/src/components/ui/Background';
import { apiClient, API_ENDPOINTS } from '@/src/lib/api';
import { toast } from 'sonner';

interface DashboardAnalytics {
  totalEvents: number;
  totalAttendees: number;
  avgAttendance: number;
  activeEvents: number;
}

export default function OrganizerDashboard() {
  const { user, isAuthenticated } = useAuthContext();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<DashboardAnalytics>({
    totalEvents: 0,
    totalAttendees: 0,
    avgAttendance: 0,
    activeEvents: 0,
  });
  const [loading, setLoading] = useState(true);

  // Set page title
  useEffect(() => {
    document.title = 'Manage My Events - Gowwra';
  }, []);

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

  // Load dashboard analytics
  useEffect(() => {
    const loadAnalytics = async () => {
      if (!isAuthenticated || user?.role !== 'organizer') return;

      try {
        setLoading(true);
        const response = await apiClient.get<{
          success: boolean;
          analytics: DashboardAnalytics;
        }>(API_ENDPOINTS.dashboardAnalytics);

        if (
          response &&
          (response as any).success &&
          (response as any).analytics
        ) {
          setAnalytics((response as any).analytics);
        }
      } catch (error) {
        console.error('Failed to load analytics:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [isAuthenticated, user?.role]);

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
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-10 h-10 text-purple-600" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Manage My Events
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Create, manage, and track your events and registrations
              </p>
            </div>
          </div>

          {/* Organization Info */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Your Organization
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {user.organization_name || 'Organization Name'}
                </h3>
                <p className="text-gray-600 mb-2">
                  {user.organization_type || 'Organization Type'}
                </p>
                {user.organization_description && (
                  <p className="text-gray-700 text-sm">
                    {user.organization_description}
                  </p>
                )}
                {user.organization_website && (
                  <a
                    href={user.organization_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                  >
                    Visit Website →
                  </a>
                )}
              </div>

              <div className="bg-gradient-to-r from-pink-50 to-orange-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Organizer Info
                </h3>
                <p className="text-gray-600 text-sm">
                  Organizer since:{' '}
                  {user.organizer_since
                    ? new Date(user.organizer_since).toLocaleDateString()
                    : 'Recently'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Quick Actions
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link
                href="/organizer/events/create"
                className="group bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105"
              >
                <div className="flex items-center justify-between mb-4">
                  <Plus className="w-8 h-8" />
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Create Event</h3>
                <p className="text-purple-100 text-sm">
                  Start a new event and begin accepting registrations
                </p>
              </Link>

              <Link
                href="/organizer/events"
                className="group bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-6 text-white hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 transform hover:scale-105"
              >
                <div className="flex items-center justify-between mb-4">
                  <Calendar className="w-8 h-8" />
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
                <h3 className="text-xl font-semibold mb-2">My Events</h3>
                <p className="text-blue-100 text-sm">
                  View and manage all your created events
                </p>
              </Link>

              <Link
                href="/organizer/analytics"
                className="group bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white hover:from-green-600 hover:to-emerald-600 transition-all duration-200 transform hover:scale-105"
              >
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-8 h-8" />
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Analytics</h3>
                <p className="text-green-100 text-sm">
                  Track event performance and attendee engagement
                </p>
              </Link>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Overview</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {loading ? '...' : analytics.totalEvents}
                </h3>
                <p className="text-gray-600 text-sm">Total Events</p>
              </div>

              <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {loading ? '...' : analytics.totalAttendees}
                </h3>
                <p className="text-gray-600 text-sm">Total Attendees</p>
              </div>

              <div className="text-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {loading ? '...' : `${analytics.avgAttendance}%`}
                </h3>
                <p className="text-gray-600 text-sm">Avg. Attendance</p>
              </div>

              <div className="text-center p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {loading ? '...' : analytics.activeEvents}
                </h3>
                <p className="text-gray-600 text-sm">Active Events</p>
              </div>
            </div>
          </div>

          {/* Getting Started */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Create your first event and start building your community. It's
              easy to get started with our step-by-step event creation process.
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
    </>
  );
}
