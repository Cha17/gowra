'use client';

import { useAuthContext } from '@/src/components/providers/NeonAuthProvider';
import { ProtectedRoute } from '@/src/components/auth/ProtectedRoute';
import {
  createAdminApiWithRefresh,
  type AdminStats,
  type AdminEvent,
} from '@/src/lib/adminApi';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Users,
  Calendar,
  CreditCard,
  BarChart3,
  Settings,
  Plus,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';

function AdminDashboardContent() {
  const { user, apiCallWithRefresh } = useAuthContext();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create admin API with token refresh functionality
  const adminApi = createAdminApiWithRefresh(apiCallWithRefresh);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // Fetch stats and events in parallel using the new API
        const [statsResult, eventsResult] = await Promise.all([
          adminApi.getStats(),
          adminApi.getEvents(),
        ]);

        if (statsResult.success && statsResult.stats) {
          setStats(statsResult.stats);
        }

        if (eventsResult.success && eventsResult.events) {
          setEvents(eventsResult.events);
        }
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
        toast.error('Failed to load admin data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, [adminApi]);

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      const result = await adminApi.deleteEvent(eventId);

      if (result.success) {
        toast.success('Event deleted successfully');
        // Remove the event from the local state
        setEvents(prev => prev.filter(event => event.id !== eventId));
        // Refresh stats
        const statsResult = await adminApi.getStats();
        if (statsResult.success && statsResult.stats) {
          setStats(statsResult.stats);
        }
      } else {
        toast.error(result.error || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Failed to delete event:', error);
      toast.error('Failed to delete event');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome back, {user?.name || user?.email}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                <Plus className="h-5 w-5 inline mr-2" />
                New Event
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.totalUsers || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Active Events
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.totalEvents || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Revenue
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${stats?.totalRevenue?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Registrations
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.totalRegistrations || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Events */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Events</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registrations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No events found
                    </td>
                  </tr>
                ) : (
                  events.map(event => (
                    <tr key={event.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {event.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {event.venue}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(event.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            event.status === 'published'
                              ? 'bg-green-100 text-green-800'
                              : event.status === 'draft'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {event.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {event.registration_count} / {event.capacity || '∞'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-indigo-600 hover:text-indigo-900">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleDeleteEvent(event.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                <Plus className="h-4 w-4 inline mr-2" />
                Create New Event
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                <Users className="h-4 w-4 inline mr-2" />
                Manage Users
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                <BarChart3 className="h-4 w-4 inline mr-2" />
                View Reports
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              System Status
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Database</span>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  Online
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">API</span>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  Online
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Storage</span>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                  75% Used
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              <div className="text-sm">
                <p className="text-gray-900">New user registered</p>
                <p className="text-gray-500">2 minutes ago</p>
              </div>
              <div className="text-sm">
                <p className="text-gray-900">Event published</p>
                <p className="text-gray-500">1 hour ago</p>
              </div>
              <div className="text-sm">
                <p className="text-gray-900">Payment received</p>
                <p className="text-gray-500">3 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute requireAuth={true} requireAdmin={true}>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
