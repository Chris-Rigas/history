import type { TimelineFull, Event } from '@/lib/database.types';
import type { ThemeColorConfig } from './themeColors';
import { cn } from '@/lib/utils';
import { Fragment } from 'react';
import { getCategoryColor } from './themeColors';
import { isValidCategory } from '@/lib/timeline/categories';

interface DramaticSummaryProps {
  timeline: TimelineFull;
  events: Event[];
  tagColorMap?: Record<string, ThemeColorConfig>;
}

function chunkEvents(events: Event[], chunkSize: number): Event[][] {
  if (chunkSize <= 0) {
    return [events];
  }

  const chunks: Event[][] = [];
  for (let i = 0; i < events.length; i += chunkSize) {
    chunks.push(events.slice(i, i + chunkSize));
  }
  return chunks;
}

function cleanSummary(summary: string | null): string {
  if (!summary) {
    return '';
  }
  const trimmed = summary.replace(/\s+/g, ' ').trim();
  return trimmed.replace(/[.?!]+$/, '');
}

function EventAnchor({
  event,
  color,
}: {
  event: Event;
  color?: ThemeColorConfig;
}) {
  return (
    <a
      href={`#event-${event.slug}`}
      className={cn('sticky-link', color?.text)}
      aria-label={`Jump to ${event.title}`}
    >
      {event.title}
    </a>
  );
}

export default function DramaticSummary({
  timeline,
  events,
  tagColorMap,
}: DramaticSummaryProps) {
  if (!events.length) {
    return null;
  }

  const chunkSize = events.length <= 6
    ? Math.max(1, Math.ceil(events.length / 2))
    : 3;
  const paragraphs = chunkEvents(events, chunkSize);

  return (
    <div>
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-antiqueBronze-600">
          Storyform Recap
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-3">
          The drama of {timeline.title}
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl">
          Follow the full sweep of this era with jump links that tug you straight
          to each chapter of the timeline.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        <aside className="lg:w-1/3">
          <div className="lg:sticky lg:top-28 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Sticky jump links
            </h3>
            <div className="flex flex-col gap-3">
              {events.map(event => {
                const tag = event.tags[0];
                const color = tag
                  ? tagColorMap?.[tag] || (isValidCategory(tag) ? getCategoryColor(tag) : undefined)
                  : undefined;
                return (
                  <a
                    key={event.id}
                    href={`#event-${event.slug}`}
                    className={cn(
                      'timeline-jump-link',
                      color?.lightBg || 'bg-parchment-100/80',
                      color?.border || 'border-parchment-200',
                      color?.text || 'text-gray-900'
                    )}
                  >
                    <span className="text-xs uppercase tracking-wide text-gray-500">
                      {event.start_year}
                    </span>
                    <span className="font-semibold leading-snug">
                      {event.title}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </aside>

        <div className="lg:flex-1 space-y-6 text-lg leading-relaxed text-gray-700">
          {paragraphs.map((chunk, index) => (
            <p key={`narrative-${index}`}>
              {chunk.map((event, eventIndex) => {
                const intro = eventIndex === 0
                  ? `In ${event.start_year},`
                  : eventIndex === chunk.length - 1
                  ? `Finally, in ${event.start_year},`
                  : `Then in ${event.start_year},`;
                const detail = cleanSummary(event.summary);
                const category = event.tags[0];
                const color = category
                  ? tagColorMap?.[category] || (isValidCategory(category) ? getCategoryColor(category) : undefined)
                  : undefined;

                return (
                  <Fragment key={event.id}>
                    {eventIndex > 0 && ' '}
                    <span>
                      {intro} <EventAnchor event={event} color={color} />
                      {detail ? ` — ${detail}.` : ' reshaped the story.'}
                    </span>
                  </Fragment>
                );
              })}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
