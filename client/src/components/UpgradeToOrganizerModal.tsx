import { useState } from 'react';
import {
  X,
  Building2,
  Users,
  Calendar,
  Globe,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { OrganizerUpgradeData } from '../hooks/useAuth';

interface UpgradeToOrganizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (
    data: OrganizerUpgradeData
  ) => Promise<{ success: boolean; error?: string }>;
  isLoading?: boolean;
}

const ORGANIZATION_TYPES = [
  'Community Group',
  'Educational Institution',
  'Non-Profit Organization',
  'Business/Company',
  'Government Agency',
  'Religious Organization',
  'Sports Club',
  'Cultural Group',
  'Professional Association',
  'Other',
];

const EVENT_TYPES = [
  'Workshop',
  'Conference',
  'Meetup',
  'Seminar',
  'Training',
  'Webinar',
  'Hackathon',
  'Competition',
  'Exhibition',
  'Concert',
  'Sports Event',
  'Charity Event',
  'Networking Event',
  'Other',
];

export default function UpgradeToOrganizerModal({
  isOpen,
  onClose,
  onUpgrade,
  isLoading = false,
}: UpgradeToOrganizerModalProps) {
  const [formData, setFormData] = useState<OrganizerUpgradeData>({
    organization_name: '',
    organization_type: '',
    event_types: [],
    organization_description: '',
    organization_website: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleInputChange = (
    field: keyof OrganizerUpgradeData,
    value: string | string[]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleEventTypeToggle = (eventType: string) => {
    const currentTypes = formData.event_types;
    if (currentTypes.includes(eventType)) {
      handleInputChange(
        'event_types',
        currentTypes.filter(type => type !== eventType)
      );
    } else {
      handleInputChange('event_types', [...currentTypes, eventType]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.organization_name.trim()) {
      newErrors.organization_name = 'Organization name is required';
    }

    if (!formData.organization_type) {
      newErrors.organization_type = 'Organization type is required';
    }

    if (formData.event_types.length === 0) {
      newErrors.event_types = 'Please select at least one event type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const result = await onUpgrade(formData);
      if (result.success) {
        // Show success message before closing
        toast.success(
          '🎉 Upgrade successful! Redirecting to organizer dashboard...'
        );

        // Small delay to show success message
        setTimeout(() => {
          onClose();
          // Reset form
          setFormData({
            organization_name: '',
            organization_type: '',
            event_types: [],
            organization_description: '',
            organization_website: '',
          });
          setErrors({});
        }, 1500);
      } else {
        toast.error(result.error || 'Upgrade failed. Please try again.');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      // Reset form and errors
      setFormData({
        organization_name: '',
        organization_type: '',
        event_types: [],
        organization_description: '',
        organization_website: '',
      });
      setErrors({});
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
      {/* Enhanced backdrop with better blur */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-md"></div>

      {/* Enhanced Modal with better contrast */}
      <div className="relative z-10 bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
        {/* Enhanced Header with better contrast */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                Become an Organizer
              </h2>
              <p className="text-base text-gray-700 font-medium">
                Upgrade your account to create and manage events
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 hover:bg-white/80 rounded-full transition-all duration-200 disabled:opacity-50 group"
          >
            <X className="w-6 h-6 text-gray-600 group-hover:text-gray-800" />
          </button>
        </div>

        {/* Enhanced Content with better spacing and contrast */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Organization Name */}
          <div>
            <label className="block text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              Organization Name *
            </label>
            <input
              type="text"
              value={formData.organization_name}
              onChange={e =>
                handleInputChange('organization_name', e.target.value)
              }
              className={`w-full px-4 py-4 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-200 transition-all text-gray-900 placeholder-gray-500 font-medium ${
                errors.organization_name
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-300 hover:border-purple-400 focus:border-purple-500'
              }`}
              placeholder="Enter your organization name"
              disabled={isLoading}
            />
            {errors.organization_name && (
              <p className="mt-2 text-sm font-medium text-red-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                {errors.organization_name}
              </p>
            )}
          </div>

          {/* Organization Type */}
          <div>
            <label className="block text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-pink-600" />
              Organization Type *
            </label>
            <select
              value={formData.organization_type}
              onChange={e =>
                handleInputChange('organization_type', e.target.value)
              }
              className={`w-full px-4 py-4 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-200 transition-all text-gray-900 font-medium ${
                errors.organization_type
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-300 hover:border-purple-400 focus:border-purple-500'
              }`}
              disabled={isLoading}
            >
              <option value="" className="text-gray-500">
                Select organization type
              </option>
              {ORGANIZATION_TYPES.map(type => (
                <option key={type} value={type} className="text-gray-900">
                  {type}
                </option>
              ))}
            </select>
            {errors.organization_type && (
              <p className="mt-2 text-sm font-medium text-red-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                {errors.organization_type}
              </p>
            )}
          </div>

          {/* Event Types */}
          <div>
            <label className="block text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-600" />
              Event Types You'll Host *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {EVENT_TYPES.map(eventType => (
                <label
                  key={eventType}
                  className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    formData.event_types.includes(eventType)
                      ? 'border-purple-500 bg-purple-100 text-purple-900 shadow-md'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50 text-gray-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.event_types.includes(eventType)}
                    onChange={() => handleEventTypeToggle(eventType)}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                    disabled={isLoading}
                  />
                  <span className="text-sm font-semibold">{eventType}</span>
                </label>
              ))}
            </div>
            {errors.event_types && (
              <p className="mt-2 text-sm font-medium text-red-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                {errors.event_types}
              </p>
            )}
          </div>

          {/* Organization Description */}
          <div>
            <label className="block text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Organization Description
            </label>
            <textarea
              value={formData.organization_description}
              onChange={e =>
                handleInputChange('organization_description', e.target.value)
              }
              rows={4}
              className="w-full px-4 py-4 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all text-gray-900 placeholder-gray-500 font-medium resize-none"
              placeholder="Brief description of your organization (optional)"
              disabled={isLoading}
            />
          </div>

          {/* Organization Website */}
          <div>
            <label className="block text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-600" />
              Organization Website
            </label>
            <input
              type="url"
              value={formData.organization_website}
              onChange={e =>
                handleInputChange('organization_website', e.target.value)
              }
              className="w-full px-4 py-4 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all text-gray-900 placeholder-gray-500 font-medium hover:border-purple-400"
              placeholder="https://your-organization.com (optional)"
              disabled={isLoading}
            />
          </div>

          {/* Enhanced Benefits Info with better contrast */}
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 border border-purple-200">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
              What you'll get as an Organizer:
            </h3>
            <ul className="text-base text-gray-800 space-y-2 font-medium">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Create and manage your own events
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Track registrations and attendees
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Access to event analytics
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Professional event management tools
              </li>
            </ul>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-8 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl hover:from-purple-700 hover:to-pink-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 text-base"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  <span>Upgrading...</span>
                </>
              ) : (
                <>
                  <Building2 className="w-6 h-6" />
                  <span>Upgrade to Organizer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
