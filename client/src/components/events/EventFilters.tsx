'use client';

import { Search, X } from 'lucide-react';
import { EVENT_TYPES_WITH_ALL } from '@/src/lib/constants';

export interface EventFiltersState {
  search: string;
  eventType: string;
  minPrice: string;
  maxPrice: string;
  startDate: string;
  endDate: string;
  status: string;
  organizer: string;
  hasCapacity: boolean;
}

interface EventFiltersProps {
  filters: EventFiltersState;
  onFilterChange: (filters: Partial<EventFiltersState>) => void;
  onClear: () => void;
}

export default function EventFilters({
  filters,
  onFilterChange,
  onClear,
}: EventFiltersProps) {
  const hasActiveFilters =
    filters.search ||
    (filters.eventType && filters.eventType !== 'All Events') ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.startDate ||
    filters.endDate ||
    filters.status ||
    filters.organizer ||
    filters.hasCapacity;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 mb-8">
      {/* Basic Filters Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-center mb-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-4xl w-full">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <Search className="h-4 w-4 text-purple-400" />
          </div>
          <input
            type="text"
            placeholder="Search events..."
            value={filters.search}
            onChange={e => onFilterChange({ search: e.target.value })}
            className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500"
          />
        </div>

        {/* Event Type Filter */}
        <div className="flex-1 max-w-xs w-full">
          <select
            value={filters.eventType}
            onChange={e => onFilterChange({ eventType: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all duration-200 text-gray-900"
          >
            {EVENT_TYPES_WITH_ALL.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all duration-200 flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>

      {/* Advanced Filters - Collapsible */}
      <details className="group">
        <summary className="cursor-pointer text-sm font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-2">
          <span>Advanced Filters</span>
          <span className="text-xs text-gray-500">
            {hasActiveFilters ? '(Active)' : ''}
          </span>
        </summary>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          {/* Price Range */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Price Range (₱)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.minPrice}
                onChange={e => onFilterChange({ minPrice: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white text-gray-900"
                min="0"
                step="0.01"
              />
              <span className="self-center text-gray-500">-</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={e => onFilterChange({ maxPrice: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white text-gray-900"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Date Range
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={filters.startDate}
                onChange={e => onFilterChange({ startDate: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white text-gray-900"
              />
              <span className="self-center text-gray-500">to</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={e => onFilterChange({ endDate: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white text-gray-900"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Status
            </label>
            <select
              value={filters.status}
              onChange={e => onFilterChange({ status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white text-gray-900"
            >
              <option value="">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Organizer Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Organizer
            </label>
            <input
              type="text"
              placeholder="Filter by organizer..."
              value={filters.organizer}
              onChange={e => onFilterChange({ organizer: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white text-gray-900 placeholder-gray-500"
            />
          </div>

          {/* Has Capacity Checkbox */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Availability
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.hasCapacity}
                onChange={e =>
                  onFilterChange({ hasCapacity: e.target.checked })
                }
                className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">
                Only show events with capacity
              </span>
            </label>
          </div>
        </div>
      </details>
    </div>
  );
}
