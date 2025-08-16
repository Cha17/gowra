import { X, LogIn, UserPlus } from 'lucide-react';
import Link from 'next/link';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export default function LoginPromptModal({
  isOpen,
  onClose,
  title = 'Login Required',
  message = 'You need to be logged in to register for this event. Please log in or create an account to continue.',
}: LoginPromptModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
      {/* Backdrop blur effect */}
      <div className="absolute inset-0 bg-white/30 backdrop-blur-sm"></div>

      {/* Modal */}
      <div className="relative z-10 bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-gray-600 leading-relaxed">{message}</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/login"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl hover:from-purple-700 hover:to-pink-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <LogIn className="w-5 h-5" />
              Log In
            </Link>

            <Link
              href="/register"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-purple-600 text-purple-600 font-semibold rounded-2xl hover:bg-purple-600 hover:text-white transition-all duration-200"
            >
              <UserPlus className="w-5 h-5" />
              Create Account
            </Link>
          </div>

          {/* Additional Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-2xl">
            <p className="text-sm text-gray-600 text-center">
              Don't have an account? Creating one is free and only takes a
              minute!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
