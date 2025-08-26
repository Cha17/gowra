'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Calendar, Edit3, Save, X, Shield } from 'lucide-react';
import { useAuthContext } from '@/src/components/providers/NeonAuthProvider';
import { toast } from 'sonner';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';
import Background from '@/src/components/ui/Background';

export default function ProfilePage() {
  const { user, updateProfile } = useAuthContext();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      setLoading(true);
      const result = await updateProfile(formData.name.trim());

      if (result.success) {
        toast.success('Profile updated successfully!');
        setIsEditing(false);
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
      });
    }
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <ProtectedRoute>
      <Background />
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Profile Settings
            </h1>
            <p className="text-lg text-gray-600">
              Manage your account information and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Profile Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-12 text-center">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-12 h-12 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {user?.name || 'User'}
                  </h2>
                  <p className="text-purple-100">{user?.email}</p>
                  {user?.isAdmin && (
                    <div className="mt-3">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 text-white rounded-full text-sm font-semibold">
                        <Shield className="w-4 h-4" />
                        Admin
                      </span>
                    </div>
                  )}
                </div>

                {/* Profile Form */}
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">
                      Personal Information
                    </h3>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:text-purple-700 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={handleCancel}
                          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-700 transition-colors"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name Field */}
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                      >
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          id="name"
                          type="text"
                          value={formData.name}
                          onChange={e =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          disabled={!isEditing}
                          className={`w-full pl-10 pr-4 py-3 text-gray-700 border border-gray-200 rounded-xl transition-all duration-200 ${
                            isEditing
                              ? 'bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                              : 'bg-gray-50 cursor-not-allowed'
                          }`}
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>

                    {/* Email Field */}
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                      >
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          id="email"
                          type="email"
                          value={formData.email}
                          disabled={true}
                          className="w-full pl-10 pr-4 py-3 text-gray-700 border border-gray-200 rounded-xl bg-gray-50 cursor-not-allowed"
                          placeholder="Email address"
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Email address cannot be changed. Contact support if you
                        need to update it.
                      </p>
                    </div>

                    {/* Account Details */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Account Type
                      </label>
                      <div className="flex items-center gap-2 px-4 py-3 text-gray-700 border border-gray-200 rounded-xl bg-gray-50">
                        <Shield className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-700">
                          {user?.isAdmin ? 'Administrator' : 'Regular User'}
                        </span>
                      </div>
                    </div>

                    {/* Account Created */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Member Since
                      </label>
                      <div className="flex items-center gap-2 px-4 py-3 text-gray-700 border border-gray-200 rounded-xl bg-gray-50">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-700">
                          {user?.created_at
                            ? formatDate(user.created_at)
                            : 'Unknown'}
                        </span>
                      </div>
                    </div>

                    {/* Save Button */}
                    {isEditing && (
                      <div className="pt-4">
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-5 h-5" />
                              Save Changes
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Account Stats */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Account Overview
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Account Status</span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                      Active
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Profile Completion</span>
                    <span className="text-gray-900 font-semibold">
                      {user?.name ? '100%' : '80%'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Last Updated</span>
                    <span className="text-gray-900 font-semibold text-sm">
                      {user?.updated_at ? formatDate(user.updated_at) : 'Never'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Security Section */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Security
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-green-600">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span className="text-sm">
                      Account secured with password
                    </span>
                  </div>
                  {/* <div className="flex items-center gap-3 text-green-600">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span className="text-sm">Email verified</span>
                  </div> */}
                  <div className="flex items-center gap-3 text-green-600">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span className="text-sm">
                      Profile information complete
                    </span>
                  </div>
                </div>
                {/* <button className="w-full mt-4 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                  Change Password
                </button> */}
              </div>

              {/* Quick Actions */}
              {/* <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors text-sm text-gray-700">
                    Download Account Data
                  </button>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors text-sm text-gray-700">
                    Privacy Settings
                  </button>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors text-sm text-gray-700">
                    Notification Preferences
                  </button>
                  <button className="w-full text-left px-4 py-2 hover:bg-red-50 rounded-lg transition-colors text-sm text-red-600">
                    Delete Account
                  </button>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
