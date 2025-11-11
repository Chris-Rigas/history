import Link from 'next/link';
import type { Event, Timeline } from '@/lib/database.types';

interface EventHeaderProps {
  event: Event;
  timeline: Timeline;
}

export default function EventHeader({ event, timeline }: EventHeaderProps) {
  // Get importance badge
  const getImportanceBadge = () => {
    switch (event.importance) {
      case 3:
        return (
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-red-100 text-red-800 border-2 border-red-300">
            MAJOR EVENT
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-blue-100 text-blue-800 border-2 border-blue-300">
            SIGNIFICANT EVENT
          </span>
        );
      case 1:
      default:
        return (
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
            Notable Event
          </span>
        );
    }
  };

  return (
    <header className="bg-gradient-to-br from-gray-800 to-gray-700 text-white py-12">
      <div className="content-container">
        {/* Timeline Context Link */}
        <Link
          href={`/timelines/${timeline.slug}`}
          className="inline-flex items-center text-parchment-200 hover:text-white mb-4 transition-colors"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to {timeline.title}
        </Link>

        <div className="max-w-4xl">
          {/* Importance Badge */}
          <div className="mb-4">
            {getImportanceBadge()}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
            {event.title}
          </h1>

          {/* Quick Facts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-white/10 backdrop-blur-sm rounded-lg p-6">
            {/* Date */}
            <div>
              <div className="text-parchment-300 text-sm mb-1">Date</div>
              <div className="font-bold text-lg">
                {event.start_year}
                {event.end_year && event.end_year !== event.start_year && (
                  <span> — {event.end_year}</span>
                )}
              </div>
            </div>

            {/* Location */}
            {event.location && (
              <div>
                <div className="text-parchment-300 text-sm mb-1">Location</div>
                <div className="font-bold text-lg">{event.location}</div>
              </div>
            )}

            {/* Type */}
            {event.type && (
              <div>
                <div className="text-parchment-300 text-sm mb-1">Type</div>
                <div className="font-bold text-lg">{event.type}</div>
              </div>
            )}

            {/* Timeline */}
            <div>
              <div className="text-parchment-300 text-sm mb-1">Part of</div>
              <Link
                href={`/timelines/${timeline.slug}`}
                className="font-bold text-lg hover:text-parchment-100 transition-colors underline"
              >
                {timeline.title}
              </Link>
            </div>
          </div>

          {/* Tags */}
          {event.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {event.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-white/20 text-parchment-100"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
