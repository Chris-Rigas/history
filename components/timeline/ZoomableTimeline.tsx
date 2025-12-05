'use client';

import { Fragment, useMemo, useState } from 'react';
import type { Timeline, Event } from '@/lib/database.types';
import type { EventNarrativeBinding, BoundConnector } from '@/lib/timelines/narrative';
import EventCard from './EventCard';
import TimelineFilters from './TimelineFilters';
import NarrativeConnector from './NarrativeConnector';
import { TimelineCategory, TIMELINE_CATEGORIES, isValidCategory } from '@/lib/timeline/categories';
import { getCategoryColor } from './themeColors';

interface ZoomableTimelineProps {
  timeline: Timeline;
  events: Event[];
  eventNarratives?: Record<string, EventNarrativeBinding>;
  connectors?: BoundConnector[];
}

export default function ZoomableTimeline({
  timeline,
  events,
  eventNarratives,
  connectors,
}: ZoomableTimelineProps) {
  const [activeCategories, setActiveCategories] = useState<Set<TimelineCategory>>(
    new Set(Object.keys(TIMELINE_CATEGORIES) as TimelineCategory[]),
  );

  // Filter events based on current filters
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const category =
        event.tags?.[0] && isValidCategory(event.tags[0])
          ? (event.tags[0] as TimelineCategory)
          : 'political';
      return activeCategories.has(category);
    });
  }, [events, activeCategories]);

  const eventCounts = useMemo(() => {
    return events.reduce((acc, event) => {
      const category =
        event.tags?.[0] && isValidCategory(event.tags[0])
          ? (event.tags[0] as TimelineCategory)
          : 'political';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<TimelineCategory, number>);
  }, [events]);

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
        activeCategories={activeCategories}
        onToggleCategory={(category) => {
          setActiveCategories(prev => {
            const next = new Set(prev);
            if (next.has(category)) {
              next.delete(category);
            } else {
              next.add(category);
            }
            return next;
          });
        }}
        eventCounts={eventCounts}
      />

      {/* Event List */}
      {filteredEvents.length > 0 ? (
        <div className="space-y-6">
          {filteredEvents.map(event => {
            const narrative = eventNarratives?.[event.slug];
            const eventCategory =
              event.tags?.[0] && isValidCategory(event.tags[0])
                ? (event.tags[0] as TimelineCategory)
                : 'political';
            const themeColor = getCategoryColor(eventCategory);
            const connectorBlocks = connectorsBySlug.get(event.slug) || [];

            return (
              <Fragment key={event.id}>
                <EventCard
                  event={event}
                  timeline={timeline}
                  narrative={narrative}
                  themeColor={themeColor}
                  themeTitle={
                    TIMELINE_CATEGORIES[eventCategory as keyof typeof TIMELINE_CATEGORIES]?.label ||
                    eventCategory
                  }
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
              setActiveCategories(new Set(Object.keys(TIMELINE_CATEGORIES) as TimelineCategory[]));
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
