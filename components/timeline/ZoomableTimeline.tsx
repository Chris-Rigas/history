'use client';

import { Fragment, useMemo, useState } from 'react';
import type { Timeline, Event } from '@/lib/database.types';
import type { EventNarrativeBinding, BoundConnector } from '@/lib/timelines/narrative';
import type { ThemedTimelineCategory } from './types';
import EventCard from './EventCard';
import TimelineFilters, { type FilterState } from './TimelineFilters';
import NarrativeConnector from './NarrativeConnector';

interface ZoomableTimelineProps {
  timeline: Timeline;
  events: Event[];
  categories?: ThemedTimelineCategory[];
  eventNarratives?: Record<string, EventNarrativeBinding>;
  connectors?: BoundConnector[];
}

export default function ZoomableTimeline({
  timeline,
  events,
  categories,
  eventNarratives,
  connectors,
}: ZoomableTimelineProps) {
  const [filters, setFilters] = useState<FilterState>({
    yearRange: [
      Math.min(...events.map(e => e.start_year)),
      Math.max(...events.map(e => e.start_year)),
    ],
    themes: [],
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

      const themeId = event.tags?.[0];
      if (filters.themes.length > 0 && (!themeId || !filters.themes.includes(themeId))) {
        return false;
      }

      return true;
    });
  }, [events, filters, eventNarratives]);

  const themeColorMap = useMemo(() => {
    const map = new Map<string, ThemedTimelineCategory['colorClass']>();
    categories?.forEach(category => {
      map.set(category.id, category.colorClass);
    });
    return map;
  }, [categories]);

  const connectorsBySlug = useMemo(() => {
    const map = new Map<string, BoundConnector[]>();
    connectors?.forEach(connector => {
      if (!connector.afterEventSlug) {
        return;
      }
      const existing = map.get(connector.afterEventSlug) || [];
      map.set(connector.afterEventSlug, [...existing, connector]);
    });
    return map;
  }, [connectors]);

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
      <TimelineFilters
        events={events}
        onFilterChange={setFilters}
        categories={categories}
      />

      {/* Event List */}
      {filteredEvents.length > 0 ? (
        <div className="space-y-6">
          {filteredEvents.map(event => {
            const narrative = eventNarratives?.[event.slug];
            const eventThemeId = event.tags?.[0] || narrative?.category?.id;
            const themeColor = eventThemeId
              ? themeColorMap.get(eventThemeId)
              : undefined;
            const connectorBlocks = connectorsBySlug.get(event.slug) || [];

            return (
              <Fragment key={event.id}>
                <EventCard
                  event={event}
                  timeline={timeline}
                  narrative={narrative}
                  themeColor={themeColor}
                  themeTitle={eventThemeId ? categories?.find(c => c.id === eventThemeId)?.title : undefined}
                />
                {connectorBlocks.map((connector, index) => (
                  <NarrativeConnector key={`${event.id}-connector-${index}`} text={connector.text} />
                ))}
              </Fragment>
            );
          })}
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
                  Math.max(...events.map(e => e.start_year)),
                ],
                themes: [],
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
