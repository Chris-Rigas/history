'use client';

import { useMemo, useState } from 'react';
import type { Timeline, Event } from '@/lib/database.types';
import type { EventNarrativeBinding } from '@/lib/timelines/narrative';
import { cn } from '@/lib/utils';
import { getCategoryColor } from './themeColors';
import { TIMELINE_CATEGORIES, isValidCategory } from '@/lib/timeline/categories';

interface BirdsEyeStripProps {
  timeline: Timeline;
  events: Event[];
  eventNarratives?: Record<string, EventNarrativeBinding>;
}

export default function BirdsEyeStrip({
  timeline,
  events,
  eventNarratives,
}: BirdsEyeStripProps) {
  const [hoveredEvent, setHoveredEvent] = useState<Event | null>(null);
  const [showRelationships, setShowRelationships] = useState(false);

  const eventBySlug = useMemo(() => {
    return new Map(events.map(event => [event.slug, event] as const));
  }, [events]);

  // Calculate position percentage for each event
  const getEventPosition = (year: number) => {
    const totalYears = timeline.end_year - timeline.start_year;
    const yearFromStart = year - timeline.start_year;
    return (yearFromStart / totalYears) * 100;
  };

  const eventPositions = useMemo(() => {
    const map = new Map<string, number>();
    events.forEach(event => {
      map.set(event.slug, getEventPosition(event.start_year));
    });
    return map;
  }, [events, timeline.start_year, timeline.end_year]);

  const relationshipLines = useMemo(() => {
    if (!eventNarratives) {
      return [];
    }

    const lines: Array<{
      sourceSlug: string;
      targetSlug: string;
      type: string;
      colorClass?: string;
    }> = [];

    Object.entries(eventNarratives).forEach(([slug, narrative]) => {
      narrative.relationships.forEach(relationship => {
        if (!relationship.targetSlug) {
          return;
        }

        const sourceEvent = eventBySlug.get(slug);
        const sourceCategory =
          (sourceEvent?.tags?.[0] && isValidCategory(sourceEvent.tags[0])
            ? sourceEvent.tags[0]
            : 'political');
        const color = getCategoryColor(sourceCategory).line;
        lines.push({
          sourceSlug: slug,
          targetSlug: relationship.targetSlug,
          type: relationship.type,
          colorClass: color,
        });
      });
    });

    return lines;
  }, [eventNarratives, eventBySlug]);

  const hoveredCategory =
    hoveredEvent?.tags?.[0] && isValidCategory(hoveredEvent.tags[0])
      ? hoveredEvent.tags[0]
      : 'political';
  const hoveredThemeColors = getCategoryColor(hoveredCategory);
  const hoveredCategoryLabel = TIMELINE_CATEGORIES[hoveredCategory as keyof typeof TIMELINE_CATEGORIES]?.label || hoveredCategory;

  const handleEventClick = (eventSlug: string) => {
    const element = document.getElementById(`event-${eventSlug}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Timeline Overview
      </h2>

      {/* Timeline Strip */}
      <div className="relative bg-white rounded-lg shadow-md p-6 overflow-x-auto">
        {/* Main timeline bar */}
        <div className="relative h-24">
          {showRelationships && relationshipLines.length > 0 && (
            <div className="absolute inset-0 pointer-events-none">
              {relationshipLines.map((line, index) => {
                const source = eventPositions.get(line.sourceSlug);
                const target = eventPositions.get(line.targetSlug);
                if (source === undefined || target === undefined) {
                  return null;
                }

                const left = Math.min(source, target);
                const width = Math.abs(target - source);
                const color = line.colorClass || 'bg-slate-300';
                const isDashed = line.type === 'response_to' || line.type === 'parallel';

                return (
                  <div
                    key={`${line.sourceSlug}-${line.targetSlug}-${index}`}
                    className={`absolute top-1/2 -translate-y-1/2 h-0.5 ${color} ${
                      isDashed ? 'opacity-80' : ''
                    }`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  >
                    {isDashed && (
                      <div className="absolute inset-0 border-t border-dashed border-white/60" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {/* Background bar */}
          <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-200 rounded-full transform -translate-y-1/2" />

          {/* Start and end markers */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 bg-antiqueBronze-600 rounded-full" />
            <div className="absolute top-full mt-2 text-sm font-medium text-gray-700 whitespace-nowrap">
              {timeline.start_year}
            </div>
          </div>

          <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 bg-antiqueBronze-600 rounded-full" />
            <div className="absolute top-full mt-2 text-sm font-medium text-gray-700 whitespace-nowrap -translate-x-1/2">
              {timeline.end_year}
            </div>
          </div>

          {/* Event dots */}
          {events.map((event) => {
            const position = getEventPosition(event.start_year);
            const category =
              event.tags[0] && isValidCategory(event.tags[0])
                ? event.tags[0]
                : 'political';
            const colorClass = getCategoryColor(category);

            return (
              <button
                key={event.id}
                className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 cursor-pointer transition-transform hover:scale-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full"
                style={{ left: `${position}%` }}
                onMouseEnter={() => setHoveredEvent(event)}
                onMouseLeave={() => setHoveredEvent(null)}
                onClick={() => handleEventClick(event.slug)}
                aria-label={`Jump to ${event.title}`}
              >
                <div className={cn('timeline-dot', colorClass.dot || 'bg-gray-400')} />
              </button>
            );
          })}
        </div>

        {/* Hover tooltip */}
        {hoveredEvent && (
          <div className="mt-6 p-4 bg-parchment-50 rounded-lg border border-parchment-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-antiqueBronze-600 mb-1">
                  {hoveredEvent.start_year}
                  {hoveredEvent.end_year && hoveredEvent.end_year !== hoveredEvent.start_year && 
                    ` - ${hoveredEvent.end_year}`
                  }
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {hoveredEvent.title}
                </h3>
                {hoveredCategoryLabel && (
                  <span
                    className={cn(
                      'inline-flex text-xs font-semibold px-2 py-0.5 rounded-full mb-2',
                      hoveredThemeColors?.badge || 'bg-parchment-200',
                      hoveredThemeColors?.badgeText || 'text-gray-800',
                    )}
                  >
                    {hoveredCategoryLabel}
                  </span>
                )}
                {hoveredEvent.summary && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {hoveredEvent.summary}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 justify-center mt-4">
          {Object.entries(TIMELINE_CATEGORIES).map(([key, { label }]) => {
            const colors = getCategoryColor(key);
            return (
              <div key={key} className="flex items-center gap-1.5">
                <span className={cn('w-2.5 h-2.5 rounded-full', colors.dot)} />
                <span className="text-sm text-gray-600">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-4">
        <span>Hover over dots to preview events • Click to jump to detailed view</span>
        {relationshipLines.length > 0 && (
          <button
            onClick={() => setShowRelationships(value => !value)}
            className="text-blue-600 font-semibold"
          >
            {showRelationships ? 'Hide' : 'Show'} relationships
          </button>
        )}
      </div>
    </div>
  );
}
