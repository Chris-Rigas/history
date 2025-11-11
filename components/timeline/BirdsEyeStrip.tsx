'use client';

import { useState } from 'react';
import type { Timeline, Event } from '@/lib/database.types';

interface BirdsEyeStripProps {
  timeline: Timeline;
  events: Event[];
}

export default function BirdsEyeStrip({ timeline, events }: BirdsEyeStripProps) {
  const [hoveredEvent, setHoveredEvent] = useState<Event | null>(null);

  // Calculate position percentage for each event
  const getEventPosition = (year: number) => {
    const totalYears = timeline.end_year - timeline.start_year;
    const yearFromStart = year - timeline.start_year;
    return (yearFromStart / totalYears) * 100;
  };

  // Get dot color based on importance
  const getDotClass = (importance: number | null) => {
    switch (importance) {
      case 3:
        return 'timeline-dot-3'; // Red - most important
      case 2:
        return 'timeline-dot-2'; // Blue - moderate
      case 1:
      default:
        return 'timeline-dot-1'; // Gray - less important
    }
  };

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
                <div className={`timeline-dot ${getDotClass(event.importance)}`} />
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
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {hoveredEvent.title}
                </h3>
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
        <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="timeline-dot timeline-dot-3" />
            <span className="text-sm text-gray-600">Major Event</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="timeline-dot timeline-dot-2" />
            <span className="text-sm text-gray-600">Significant Event</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="timeline-dot timeline-dot-1" />
            <span className="text-sm text-gray-600">Notable Event</span>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500 mt-4">
        Hover over dots to preview events • Click to jump to detailed view
      </p>
    </div>
  );
}
