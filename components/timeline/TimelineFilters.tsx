'use client';

import { TIMELINE_CATEGORIES, TimelineCategory } from '@/lib/timeline/categories';
import { cn } from '@/lib/utils';
import { getCategoryColor } from './themeColors';

interface TimelineFiltersProps {
  activeCategories: Set<TimelineCategory>;
  onToggleCategory: (category: TimelineCategory) => void;
  eventCounts: Record<TimelineCategory, number>;
}

export default function TimelineFilters({
  activeCategories,
  onToggleCategory,
  eventCounts,
}: TimelineFiltersProps) {
  const categoriesWithEvents = Object.entries(TIMELINE_CATEGORIES).filter(
    ([key]) => (eventCounts[key as TimelineCategory] || 0) > 0,
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Filter Events</h3>
        <p className="text-sm text-gray-500">Toggle categories to show or hide</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {categoriesWithEvents.map(([key, { label }]) => {
          const category = key as TimelineCategory;
          const isActive = activeCategories.has(category);
          const colors = getCategoryColor(category);
          const count = eventCounts[category] || 0;

          return (
            <button
              key={category}
              onClick={() => onToggleCategory(category)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-all border',
                isActive
                  ? cn(colors.badge, colors.badgeText, colors.border)
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border-transparent',
              )}
            >
              <span className={cn('inline-block w-2 h-2 rounded-full mr-1.5', colors.dot)} />
              {label}
              <span className="ml-1 text-xs opacity-70">({count})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
