'use client';

import { useState, useMemo } from 'react';
import type { Timeline, Event } from '@/lib/database.types';
import EventCard from './EventCard';
import TimelineFilters, { type FilterState } from './TimelineFilters';

interface ZoomableTimelineProps {
  timeline: Timeline;
  events: Event[];
}

export default function ZoomableTimeline({ timeline, events }: ZoomableTimelineProps) {
  const [filters, setFilters] = useState<FilterState>({
    yearRange: [
      Math.min(...events.map(e => e.start_year)),
      Math.max(...events.map(e => e.start_year))
    ],
    importance: null,
    eventType: null,
    tags: [],
    showMajorOnly: false,
  });

  // Filter events based on current filters
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Year range filter
      if (
        event.start_year < filters.yearRange[0] ||
        event.start_year > filters.yearRange[1]
      ) {
        return false;
      }

      // Importance filter
      if (filters.importance !== null && event.importance !== filters.importance) {
        return false;
      }

      // Event type filter
      if (filters.eventType && event.type !== filters.eventType) {
        return false;
      }

      // Tags filter
      if (
        filters.tags.length > 0 &&
        !filters.tags.some((tag) => event.tags.includes(tag))
      ) {
        return false;
      }

      return true;
    });
  }, [events, filters]);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Detailed Timeline
        </h2>
        <p className="text-gray-600">
          Showing {filteredEvents.length} of {events.length} events
        </p>
      </div>

      {/* Filters */}
      <TimelineFilters events={events} onFilterChange={setFilters} />

      {/* Event List */}
      {filteredEvents.length > 0 ? (
        <div className="space-y-6">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} timeline={timeline} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto mb-4"
            width={64}
            height={64}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No events match your filters
          </h3>
          <p className="text-gray-500 mb-4">
            Try adjusting your filters to see more events
          </p>
          <button
            onClick={() => {
              setFilters({
                yearRange: [
                  Math.min(...events.map(e => e.start_year)),
                  Math.max(...events.map(e => e.start_year))
                ],
                importance: null,
                eventType: null,
                tags: [],
                showMajorOnly: false,
              });
            }}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
}
