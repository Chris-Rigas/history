import Link from 'next/link';
import type { Timeline, Person, Event } from '@/lib/database.types';

interface RelatedEventsProps {
  timeline: Timeline;
  person: Person;
  events: Event[];
}

export default function RelatedEvents({ timeline, person, events }: RelatedEventsProps) {
  if (events.length === 0) {
    return null;
  }

  // Group events by importance for better display
  const majorEvents = events.filter(e => e.importance === 3);
  const otherEvents = events.filter(e => e.importance !== 3);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          Events Overview
        </h2>
        <p className="text-gray-600">
          All events in {timeline.title} involving {person.name}
        </p>
      </div>

      {/* Major Events Section */}
      {majorEvents.length > 0 && (
        <div className="mb-12">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="w-3 h-3 bg-red-500 rounded-full mr-3" />
            Major Events ({majorEvents.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {majorEvents.map((event) => (
              <Link
                key={event.id}
                href={`/timelines/${timeline.slug}/events/${event.slug}`}
                className="group block"
              >
                <div className="bg-white rounded-lg border-2 border-red-200 p-6 h-full hover:border-red-400 hover:shadow-lg transition-all">
                  {/* Badge */}
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 mb-3">
                    MAJOR EVENT
                  </div>

                  {/* Date */}
                  <div className="text-sm font-medium text-antiqueBronze-600 mb-2">
                    {event.start_year}
                    {event.end_year && event.end_year !== event.start_year && 
                      ` — ${event.end_year}`
                    }
                  </div>

                  {/* Title */}
                  <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-red-700 transition-colors line-clamp-2">
                    {event.title}
                  </h4>

                  {/* Summary */}
                  {event.summary && (
                    <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                      {event.summary}
                    </p>
                  )}

                  {/* Location */}
                  {event.location && (
                    <div className="flex items-center text-xs text-gray-500 mt-2">
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                      </svg>
                      {event.location}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Other Events Section */}
      {otherEvents.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="w-3 h-3 bg-blue-500 rounded-full mr-3" />
            Other Events ({otherEvents.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherEvents.map((event) => (
              <Link
                key={event.id}
                href={`/timelines/${timeline.slug}/events/${event.slug}`}
                className="group block"
              >
                <div className="bg-white rounded-lg border border-gray-200 p-4 h-full hover:border-antiqueBronze-400 hover:shadow-md transition-all">
                  {/* Date */}
                  <div className="text-sm font-medium text-antiqueBronze-600 mb-2">
                    {event.start_year}
                  </div>

                  {/* Title */}
                  <h4 className="text-base font-bold text-gray-900 mb-2 group-hover:text-antiqueBronze-700 transition-colors line-clamp-2">
                    {event.title}
                  </h4>

                  {/* Summary */}
                  {event.summary && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {event.summary}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
