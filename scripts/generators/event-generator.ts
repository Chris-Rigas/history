import { createEvent } from '@/lib/queries/events';
import { linkEventToTimeline } from '@/lib/queries/timelines';
import { slugify } from '@/lib/utils';
import type { Timeline } from '@/lib/database.types';
import { isValidCategory } from '@/lib/timeline/categories';

export interface ExpandedEventInput {
  title: string;
  slug?: string;
  year: number;
  endYear?: number | null;
  summary: string;
  description: string;
  significance: string;
  category: string;
  themeId?: string;
  tags?: string[];
  importance?: number;
}

/**
 * Persist expanded events from the unified pipeline to the database.
 */
export async function saveExpandedEvents(
  timeline: Timeline,
  expandedEvents: ExpandedEventInput[]
): Promise<string[]> {
  const eventIds: string[] = [];

  for (const expandedEvent of expandedEvents) {
    if (!isValidCategory(expandedEvent.category)) {
      console.warn(
        `Invalid category "${expandedEvent.category}" for event "${expandedEvent.title}", defaulting to "political"`,
      );
      expandedEvent.category = 'political';
    }

    const event = await createEvent({
      title: expandedEvent.title,
      slug: expandedEvent.slug || slugify(expandedEvent.title),
      start_year: expandedEvent.year,
      end_year: expandedEvent.endYear || null,
      location: null,
      tags: [expandedEvent.category],
      importance: expandedEvent.importance || 2,
      summary: expandedEvent.summary,
      description_html: formatAsHtml(expandedEvent.description),
      significance_html: formatAsHtml(expandedEvent.significance),
    });

    await linkEventToTimeline(timeline.id, event.id);
    eventIds.push(event.id);
  }

  return eventIds;
}

function formatAsHtml(text: string): string {
  if (!text) return '';

  // Split into paragraphs and wrap in <p> tags
  const paragraphs = text.split(/\n\n+/);
  return paragraphs.map(p => `<p>${p.trim()}</p>`).join('\n');
}
