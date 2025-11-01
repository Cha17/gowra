'use client';

import Link from 'next/link';
import { Calendar, Search } from 'lucide-react';

interface EventsEmptyStateProps {
  onClearFilters?: () => void;
}

export default function EventsEmptyState({
  onClearFilters,
}: EventsEmptyStateProps) {
  return (
    <div className="text-center py-20">
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-12 max-w-md mx-auto">
        <Calendar className="h-20 w-20 text-purple-300 mx-auto mb-6" />
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          No events found
        </h3>
        <p className="text-gray-600 mb-6">
          Try adjusting your search or filters to discover amazing events.
        </p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-full hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105"
          >
            <Search className="h-4 w-4" />
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}
