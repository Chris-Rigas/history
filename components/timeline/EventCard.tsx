import Link from 'next/link';
import type { Event, Timeline } from '@/lib/database.types';
import type { EventNarrativeBinding } from '@/lib/timelines/narrative';
import type { ThemeColorConfig } from './themeColors';
import { cn } from '@/lib/utils';

interface EventCardProps {
  event: Event;
  timeline: Timeline;
  narrative?: EventNarrativeBinding;
  themeColor?: ThemeColorConfig;
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  led_to: 'Led to',
  response_to: 'In response to',
  parallel: 'Meanwhile',
  foreshadows: 'Foreshadowed',
};

export default function EventCard({ event, timeline, narrative, themeColor }: EventCardProps) {
  // Get importance badge color
  const getImportanceBadge = () => {
    switch (event.importance) {
      case 3:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Major Event
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Significant
          </span>
        );
      case 1:
      default:
        return null;
    }
  };

  return (
    <div
      id={`event-${event.slug}`}
      className="group bg-white rounded-lg border border-gray-200 p-6 hover:border-antiqueBronze-400 hover:shadow-lg transition-all scroll-mt-24"
    >
      {/* Date and Importance */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="text-lg font-bold text-antiqueBronze-600">
            {event.start_year}
            {event.end_year && event.end_year !== event.start_year && (
              <span className="text-gray-400"> — {event.end_year}</span>
            )}
          </div>
          {getImportanceBadge()}
        </div>

        {event.location && (
          <div className="flex items-center text-sm text-gray-500">
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
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {event.location}
          </div>
        )}
      </div>

      {/* Title */}
      <Link
        href={`/timelines/${timeline.slug}/events/${event.slug}`}
        className="block group"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-antiqueBronze-700 transition-colors">
          {event.title}
        </h3>
      </Link>

      {narrative?.category && (
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mb-3',
            themeColor?.badge || 'bg-gray-100',
            themeColor?.badgeText || 'text-gray-700',
          )}
        >
          {narrative.category.title}
        </span>
      )}

      {/* Summary */}
      {event.summary && (
        <p className="text-gray-600 mb-4 line-clamp-3">
          {event.summary}
        </p>
      )}

      {narrative?.note?.soWhat && (
        <div className="bg-parchment-100 border border-parchment-200 rounded-lg p-4 mb-4">
          <p className="text-xs uppercase tracking-wide text-antiqueBronze-600 font-semibold mb-1">
            So what?
          </p>
          <p className="text-sm text-gray-800">{narrative.note.soWhat}</p>
        </div>
      )}

      {narrative?.relationships.length ? (
        <div className="mb-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">
            Relationship cues
          </p>
          <div className="flex flex-wrap gap-2">
            {narrative.relationships.map((relationship, index) => (
              <a
                key={`${relationship.type}-${relationship.targetSlug || relationship.targetTitle}-${index}`}
                href={relationship.targetSlug ? `#event-${relationship.targetSlug}` : undefined}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-sm text-gray-700 hover:bg-gray-200"
              >
                <span className="font-semibold">
                  {RELATIONSHIP_LABELS[relationship.type] || 'Linked to'}:
                </span>
                <span>{relationship.targetTitle}</span>
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {narrative?.note?.humanDetail && (
        <p className="text-sm text-gray-700 italic mb-4">
          “{narrative.note.humanDetail}”
        </p>
      )}

      {/* Tags and Link */}
      <div className="flex items-center justify-between">
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
            {event.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium text-gray-500">
                +{event.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        <Link
          href={`/timelines/${timeline.slug}/events/${event.slug}`}
          className="text-blue-600 hover:text-blue-700 font-medium text-sm ml-auto flex items-center space-x-1"
        >
          <span>Read More</span>
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}
