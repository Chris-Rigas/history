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
  tagColor?: ThemeColorConfig;
}

export default function EventCard({ event, timeline, narrative, themeColor, tagColor }: EventCardProps) {
  const eventNarrative = narrative?.note;
  const relationships = narrative?.relationships ?? [];
  const primaryTag = event.tags[0];
  const supplementalTags = event.tags.filter((tag, index) => index !== 0);
  const badgeColor = tagColor || themeColor;

  return (
    <div
      id={`event-${event.slug}`}
      className="group bg-white rounded-lg border border-gray-200 p-6 hover:border-antiqueBronze-400 hover:shadow-lg transition-all scroll-mt-24"
    >
      {/* Date and Importance */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-lg font-bold text-antiqueBronze-600">
            {event.start_year}
            {event.end_year && event.end_year !== event.start_year && (
              <span className="text-gray-400"> — {event.end_year}</span>
            )}
          </div>
          {event.location && (
            <div className="flex items-center text-sm text-gray-500 mt-1">
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
        {primaryTag && (
          <span
            className={cn(
              'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold',
              badgeColor?.badge || 'bg-antiqueBronze-100',
              badgeColor?.badgeText || 'text-antiqueBronze-900',
            )}
          >
            {primaryTag}
          </span>
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
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Theme: {narrative.category.title}
        </p>
      )}

      {/* Summary */}
      {event.summary && (
        <p className="text-gray-600 mb-4 line-clamp-3">
          {event.summary}
        </p>
      )}

      {eventNarrative?.soWhat && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm font-semibold text-antiqueBronze-600 mb-1">
            Why it matters:
          </p>
          <p className="text-sm text-gray-700">
            {eventNarrative.soWhat}
          </p>
        </div>
      )}

      {eventNarrative?.humanDetail && (
        <div className="mt-3 pt-3 border-t border-gray-200 italic">
          <p className="text-sm text-gray-600">
            {eventNarrative.humanDetail}
          </p>
        </div>
      )}

      {relationships.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {relationships.slice(0, 2).map((relationship, idx) => {
            const targetLabel = relationship.targetTitle || 'Related event';
            return (
              <a
                key={`${relationship.type}-${relationship.targetSlug || relationship.targetTitle}-${idx}`}
                href={relationship.targetSlug ? `#event-${relationship.targetSlug}` : undefined}
                className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded"
              >
                {relationship.type === 'led_to' && '→ '}
                {relationship.type === 'response_to' && '← '}
                {relationship.type === 'parallel' && '|| '}
                {targetLabel.substring(0, 30)}...
              </a>
            );
          })}
        </div>
      )}

      {/* Tags and Link */}
      <div className="flex items-center justify-between">
        {supplementalTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {supplementalTags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-parchment-100 text-gray-700"
              >
                {tag}
              </span>
            ))}
            {supplementalTags.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium text-gray-500">
                +{supplementalTags.length - 3} more
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
