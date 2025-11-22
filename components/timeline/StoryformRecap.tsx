import type { TimelineFull, Event } from '@/lib/database.types';
import type { ThemeColorConfig } from './themeColors';
import { cn } from '@/lib/utils';

interface StoryformRecapProps {
  timeline: TimelineFull;
  events: Event[];
  tagColorMap?: Record<string, ThemeColorConfig>;
}

interface RecapParagraph {
  text: string;
  eventLinks: Array<{
    eventSlug: string;
    textToLink: string;
  }>;
}

function renderParagraphWithLinks(
  paragraph: RecapParagraph,
  events: Event[],
  tagColorMap?: Record<string, ThemeColorConfig>
) {
  if (!paragraph.eventLinks || paragraph.eventLinks.length === 0) {
    return <p>{paragraph.text}</p>;
  }

  const eventMap = new Map(events.map(e => [e.slug, e]));
  const sortedLinks = [...paragraph.eventLinks].sort(
    (a, b) => b.textToLink.length - a.textToLink.length
  );

  let processedText = paragraph.text;
  const replacements: Array<{ text: string; slug: string; color?: ThemeColorConfig }> = [];

  sortedLinks.forEach(link => {
    const event = eventMap.get(link.eventSlug);
    if (!event) return;

    const index = processedText.indexOf(link.textToLink);
    if (index === -1) return;

    const placeholder = `__LINK_${replacements.length}__`;
    processedText = processedText.replace(link.textToLink, placeholder);

    const tag = event.tags[0];
    const color = tag ? tagColorMap?.[tag] : undefined;

    replacements.push({
      text: link.textToLink,
      slug: event.slug,
      color,
    });
  });

  const parts = processedText.split(/(__LINK_\d+__)/);

  return (
    <p>
      {parts.map((part, index) => {
        const linkMatch = part.match(/__LINK_(\d+)__/);
        if (linkMatch) {
          const linkIndex = parseInt(linkMatch[1], 10);
          const replacement = replacements[linkIndex];
          if (!replacement) return part;

          return (
            <a
              key={index}
              href={`#event-${replacement.slug}`}
              className={cn('sticky-link', replacement.color?.text)}
              aria-label={`Jump to ${replacement.text}`}
            >
              {replacement.text}
            </a>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </p>
  );
}

export default function StoryformRecap({
  timeline,
  events,
  tagColorMap,
}: StoryformRecapProps) {
  if (!events.length) {
    return null;
  }

  const recap = (timeline.metadata as any)?.storyform_recap as {
    paragraphs: RecapParagraph[];
  } | null;

  if (!recap || !recap.paragraphs || recap.paragraphs.length === 0) {
    return null;
  }

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
          Follow the full sweep of this era through a compelling narrative that connects
          the key moments and turning points.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        <aside className="lg:w-1/3">
          <div className="lg:sticky lg:top-28 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Jump to events
            </h3>
            <div className="flex flex-col gap-3">
              {events.map(event => {
                const tag = event.tags[0];
                const color = tag ? tagColorMap?.[tag] : undefined;
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
          {recap.paragraphs.map((paragraph, index) => (
            <div key={`paragraph-${index}`}>
              {renderParagraphWithLinks(paragraph, events, tagColorMap)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
