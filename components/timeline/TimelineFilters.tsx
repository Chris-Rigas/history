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
  themes: string[];
}

export default function TimelineFilters({
  events,
  onFilterChange,
  categories,
}: TimelineFiltersProps) {
  // Extract unique values from events
  const minYear = Math.min(...events.map(e => e.start_year));
  const maxYear = Math.max(...events.map(e => e.start_year));

  const themesWithCounts = (categories || []).map(category => {
    const count = events.filter(event => (event.tags?.[0] || '') === category.id).length;
    return { ...category, count };
  });

  const [filters, setFilters] = useState<FilterState>({
    yearRange: [minYear, maxYear],
    themes: [],
  });

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
      themes: [],
    });
  };

  const hasActiveFilters =
    filters.themes.length > 0 ||
    filters.yearRange[0] !== minYear ||
    filters.yearRange[1] !== maxYear;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
      {/* Filter Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Filter Events</h3>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Reset Filters
          </button>
        )}
      </div>

      <div className="space-y-6">
        {themesWithCounts.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setFilters({ ...filters, themes: [] })}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-semibold border',
                filters.themes.length === 0
                  ? 'bg-antiqueBronze-600 text-white border-antiqueBronze-700'
                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200',
              )}
            >
              All Events
            </button>
            {themesWithCounts.map(theme => {
              const isActive = filters.themes.includes(theme.id);
              return (
                <button
                  key={theme.id}
                  onClick={() => {
                    const nextThemes = isActive
                      ? filters.themes.filter(id => id !== theme.id)
                      : [...filters.themes, theme.id];
                    setFilters({ ...filters, themes: nextThemes });
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-semibold border flex items-center gap-2',
                    isActive
                      ? `${theme.colorClass.badge} ${theme.colorClass.badgeText} ${theme.colorClass.border}`
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200',
                  )}
                >
                  <span className={cn('h-2 w-2 rounded-full', theme.colorClass.dot)} />
                  {theme.title}
                  <span className="text-xs text-gray-500">({theme.count})</span>
                </button>
              );
            })}
          </div>
        )}

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
      </div>
    </div>
  );
}
