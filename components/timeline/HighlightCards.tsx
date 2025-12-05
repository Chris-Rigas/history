import Link from 'next/link';
import type { Timeline, Event } from '@/lib/database.types';
import type { ThemeColorConfig } from './themeColors';
import { cn } from '@/lib/utils';
import { getCategoryColor } from './themeColors';
import { isValidCategory } from '@/lib/timeline/categories';

interface HighlightCardsProps {
  timeline: Timeline;
  events: Event[];
  tagColorMap?: Record<string, ThemeColorConfig>;
}

export default function HighlightCards({ timeline, events, tagColorMap }: HighlightCardsProps) {
  if (events.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          Key Highlights
        </h2>
        <p className="text-gray-600 max-w-3xl">
          These pivotal moments showcase the most dramatic turns in {timeline.title},
          revealing the forces that pushed the era forward.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => {
          const category = event.tags[0];
          const badgeColors: ThemeColorConfig | undefined = category
            ? tagColorMap?.[category] || (isValidCategory(category) ? getCategoryColor(category) : undefined)
            : undefined;

          return (
            <Link
              key={event.id}
              href={`/timelines/${timeline.slug}/events/${event.slug}`}
              className="group block"
            >
              <div className="bg-white rounded-lg border-2 border-parchment-200 p-6 h-full hover:shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    {category && (
                      <div
                        className={cn(
                          'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold mb-3 border',
                          badgeColors?.badge || 'bg-antiqueBronze-100',
                          badgeColors?.badgeText || 'text-antiqueBronze-900',
                          badgeColors?.border || 'border-parchment-200',
                        )}
                      >
                        {event.tags[0]}
                      </div>
                    )}
                    <div className="text-lg font-bold text-antiqueBronze-600 mb-2">
                      {event.start_year}
                      {event.end_year && event.end_year !== event.start_year && (
                        <span className="text-gray-400"> — {event.end_year}</span>
                      )}
                    </div>
                  </div>

                  {event.location && (
                    <div className="flex items-center text-sm text-gray-500 ml-2">
                      <svg
                        className="w-4 h-4"
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
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-red-700 transition-colors line-clamp-2">
                  {event.title}
                </h3>

                {/* Summary */}
                {event.summary && (
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {event.summary}
                  </p>
                )}

                {/* Why It Matters */}
                {event.significance_html && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="text-sm font-semibold text-gray-700 mb-2">
                      Why It Matters
                    </div>
                    <div
                      className="text-sm text-gray-600 line-clamp-2"
                      dangerouslySetInnerHTML={{
                        __html: event.significance_html.replace(/<[^>]*>/g, ''),
                      }}
                    />
                  </div>
                )}

                {/* Read More Arrow */}
                <div className="flex items-center text-antiqueBronze-600 font-medium mt-4 group-hover:text-antiqueBronze-700">
                  <span className="mr-1">Explore Event</span>
                  <svg
                    className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
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
          );
        })}
      </div>
    </div>
  );
}
