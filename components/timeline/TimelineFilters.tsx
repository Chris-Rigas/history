'use client';

import { useState, useEffect } from 'react';
import type { ThemedTimelineCategory } from './types';
import { cn } from '@/lib/utils';

interface TimelineFiltersProps {
  events: any[];
  onFilterChange: (filters: FilterState) => void;
  categories?: ThemedTimelineCategory[];
}

export interface FilterState {
  yearRange: [number, number];
  eventType: string | null;
  tags: string[];
  categories: string[];
}

export default function TimelineFilters({
  events,
  onFilterChange,
  categories,
}: TimelineFiltersProps) {
  // Extract unique values from events
  const minYear = Math.min(...events.map(e => e.start_year));
  const maxYear = Math.max(...events.map(e => e.start_year));
  
  const categoryLabelMap = new Map(
    (categories || []).map(category => [category.id, category.title] as const),
  );

  const eventTypes = Array.from(
    new Set(events.map(e => e.type).filter(Boolean)),
  ).sort();
  
  const allTags = Array.from(new Set(
    events.flatMap(e => e.tags || [])
  )).sort();

  const [filters, setFilters] = useState<FilterState>({
    yearRange: [minYear, maxYear],
    eventType: null,
    tags: [],
    categories: [],
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Notify parent of filter changes
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleYearRangeChange = (index: 0 | 1, value: number) => {
    const newRange: [number, number] = [...filters.yearRange] as [number, number];
    newRange[index] = value;
    setFilters({ ...filters, yearRange: newRange });
  };

  const resetFilters = () => {
    setFilters({
      yearRange: [minYear, maxYear],
      eventType: null,
      tags: [],
      categories: [],
    });
  };

  const hasActiveFilters =
    filters.eventType !== null ||
    filters.tags.length > 0 ||
    filters.categories.length > 0 ||
    filters.yearRange[0] !== minYear ||
    filters.yearRange[1] !== maxYear;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
      {/* Filter Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Filter Events</h3>
        <div className="flex items-center space-x-3">
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Reset Filters
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center space-x-1"
          >
            <span>{isExpanded ? 'Hide' : 'Show'} Filters</span>
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              width={16}
              height={16}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="space-y-6 pt-4 border-t border-gray-200">
          {categories && categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Focus by theme
              </label>
              <div className="flex flex-wrap gap-3">
                {categories.map(category => {
                  const isActive = filters.categories.includes(category.id);
                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        const nextCategories = isActive
                          ? filters.categories.filter(id => id !== category.id)
                          : [...filters.categories, category.id];
                        setFilters({ ...filters, categories: nextCategories });
                      }}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm font-semibold transition-colors',
                        isActive
                          ? `${category.colorClass.dot} text-white`
                          : `${category.colorClass.badge} ${category.colorClass.badgeText}`,
                      )}
                    >
                      {category.title}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Year Range Slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Year Range: {filters.yearRange[0]} — {filters.yearRange[1]}
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min={minYear}
                max={maxYear}
                value={filters.yearRange[0]}
                onChange={(e) => handleYearRangeChange(0, parseInt(e.target.value))}
                className="flex-1"
              />
              <input
                type="range"
                min={minYear}
                max={maxYear}
                value={filters.yearRange[1]}
                onChange={(e) => handleYearRangeChange(1, parseInt(e.target.value))}
                className="flex-1"
              />
            </div>
          </div>

          {/* Event Type */}
          {eventTypes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Type
              </label>
              <select
                value={filters.eventType || ''}
                onChange={(e) =>
                  setFilters({ ...filters, eventType: e.target.value || null })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                {eventTypes.map((type) => (
                  <option key={type} value={type}>
                    {categoryLabelMap.get(type) || type}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tags */}
          {allTags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      const newTags = filters.tags.includes(tag)
                        ? filters.tags.filter((t) => t !== tag)
                        : [...filters.tags, tag];
                      setFilters({ ...filters, tags: newTags });
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      filters.tags.includes(tag)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filters.tags.includes(tag) ? '✓ ' : ''}
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
