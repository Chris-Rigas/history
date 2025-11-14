import Link from 'next/link';
import type { Timeline, Person, Event } from '@/lib/database.types';

interface PersonTimelineProps {
  timeline: Timeline;
  person: Person;
  events: Event[];
}

export default function PersonTimeline({ timeline, person, events }: PersonTimelineProps) {
  if (events.length === 0) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          {person.name}'s Timeline
        </h2>
        <p className="text-gray-600">
          Key events involving {person.name} in chronological order
        </p>
      </div>

      {/* Vertical Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* Timeline Events */}
        <div className="space-y-8">
          {events.map((event, index) => (
            <div key={event.id} className="relative pl-20">
              {/* Timeline Dot */}
              <div className="absolute left-0 flex items-center justify-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  event.importance === 3
                    ? 'bg-red-100 border-4 border-red-500'
                    : event.importance === 2
                    ? 'bg-blue-100 border-4 border-blue-500'
                    : 'bg-gray-100 border-4 border-gray-400'
                }`}>
                  <span className="text-lg font-bold text-gray-700">
                    {index + 1}
                  </span>
                </div>
              </div>

              {/* Event Card */}
              <Link
                href={`/timelines/${timeline.slug}/events/${event.slug}`}
                className="block group"
              >
                <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-antiqueBronze-400 hover:shadow-lg transition-all">
                  {/* Date and Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="text-lg font-bold text-antiqueBronze-600">
                        {event.start_year}
                        {event.end_year && event.end_year !== event.start_year && (
                          <span className="text-gray-400"> — {event.end_year}</span>
                        )}
                      </div>
                      {event.importance === 3 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                          MAJOR
                        </span>
                      )}
                    </div>

                    {event.location && (
                      <div className="text-sm text-gray-500">
                        {event.location}
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-antiqueBronze-700 transition-colors">
                    {event.title}
                  </h3>

                  {/* Summary */}
                  {event.summary && (
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {event.summary}
                    </p>
                  )}

                  {/* Tags */}
                  {event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {event.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-parchment-100 text-gray-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Read More Arrow */}
                  <div className="flex items-center text-blue-600 font-medium text-sm mt-4 group-hover:text-blue-700">
                    <span>View Event Details</span>
                    <svg
                      className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform"
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
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-12 bg-parchment-50 rounded-lg border border-parchment-200 p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-antiqueBronze-600">
              {events.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Events</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-red-600">
              {events.filter(e => e.importance === 3).length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Major Events</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-700">
              {events.length > 0 ? events[0].start_year : '—'}
            </div>
            <div className="text-sm text-gray-600 mt-1">First Event</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-700">
              {events.length > 0 ? events[events.length - 1].start_year : '—'}
            </div>
            <div className="text-sm text-gray-600 mt-1">Last Event</div>
          </div>
        </div>
      </div>
    </div>
  );
}
