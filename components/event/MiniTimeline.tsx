import Link from 'next/link';
import type { Timeline, Event } from '@/lib/database.types';

interface MiniTimelineProps {
  timeline: Timeline;
  currentEvent: Event;
  beforeEvents: Event[];
  afterEvents: Event[];
}

export default function MiniTimeline({
  timeline,
  currentEvent,
  beforeEvents,
  afterEvents,
}: MiniTimelineProps) {
  const EventItem = ({ event, position }: { event: Event; position: 'before' | 'current' | 'after' }) => {
    const isCurrentEvent = position === 'current';

    return (
      <div
        className={`flex flex-col items-center ${
          isCurrentEvent ? 'scale-110 z-10' : 'opacity-70 hover:opacity-100'
        } transition-all`}
      >
        {/* Dot */}
        <div
          className={`w-4 h-4 rounded-full border-2 border-white shadow-md ${
            isCurrentEvent
              ? 'bg-red-600 w-6 h-6'
              : event.importance === 3
              ? 'bg-red-500'
              : event.importance === 2
              ? 'bg-blue-500'
              : 'bg-gray-400'
          }`}
        />

        {/* Event Card */}
        {isCurrentEvent ? (
          <div className="mt-3 bg-red-50 border-2 border-red-600 rounded-lg p-4 text-center max-w-xs">
            <div className="text-sm font-bold text-red-800 mb-1">
              YOU ARE HERE
            </div>
            <div className="text-xs font-medium text-red-700 mb-2">
              {event.start_year}
            </div>
            <div className="font-bold text-gray-900 text-sm">
              {event.title}
            </div>
          </div>
        ) : (
          <Link
            href={`/timelines/${timeline.slug}/events/${event.slug}`}
            className="mt-3 bg-white border border-gray-200 rounded-lg p-3 text-center hover:border-antiqueBronze-400 hover:shadow-md transition-all max-w-xs"
          >
            <div className="text-xs font-medium text-antiqueBronze-600 mb-1">
              {event.start_year}
            </div>
            <div className="font-semibold text-gray-900 text-sm line-clamp-2">
              {event.title}
            </div>
          </Link>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          Event in Context
        </h2>
        <p className="text-gray-600">
          See what happened before and after this event in the timeline
        </p>
      </div>

      {/* Timeline Strip */}
      <div className="bg-white rounded-lg shadow-md p-8 overflow-x-auto">
        <div className="relative min-w-max">
          {/* Connection Line */}
          <div className="absolute top-2 left-0 right-0 h-0.5 bg-gray-300" />

          {/* Events Grid */}
          <div className="relative flex items-start justify-center gap-8 md:gap-12">
            {/* Before Section */}
            {beforeEvents.length > 0 && (
              <>
                {beforeEvents.map((event) => (
                  <EventItem key={event.id} event={event} position="before" />
                ))}
              </>
            )}

            {/* Current Event */}
            <EventItem event={currentEvent} position="current" />

            {/* After Section */}
            {afterEvents.length > 0 && (
              <>
                {afterEvents.map((event) => (
                  <EventItem key={event.id} event={event} position="after" />
                ))}
              </>
            )}
          </div>

          {/* Labels */}
          <div className="flex justify-between mt-8 text-sm text-gray-500">
            {beforeEvents.length > 0 && (
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Earlier Events
              </div>
            )}
            
            {afterEvents.length > 0 && (
              <div className="flex items-center ml-auto">
                Later Events
                <svg
                  className="w-4 h-4 ml-1"
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Back to Full Timeline Link */}
      <div className="text-center mt-6">
        <Link
          href={`/timelines/${timeline.slug}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
        >
          <svg
            className="w-5 h-5 mr-2"
            width={20}
            height={20}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          View Full Timeline
        </Link>
      </div>
    </div>
  );
}
