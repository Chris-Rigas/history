import HighlightCards from './HighlightCards';
import type { Timeline } from '@/lib/database.types';
import type { ThemeColorConfig } from './themeColors';

interface KeyHighlight {
  eventSlug: string;
  year: number;
  title: string;
  summary: string;
  whyItMatters: string;
  immediateImpact: string;
  tags: string[];
  citations: number[];
}

interface HighlightCardsEnrichedProps {
  keyHighlights: KeyHighlight[];
  timeline: Timeline;
  tagColorMap?: Record<string, ThemeColorConfig>;
  citations?: Array<{ number: number; source: string; url: string }>;
}

export default function HighlightCardsEnriched({
  keyHighlights,
  timeline,
  tagColorMap,
  citations,
}: HighlightCardsEnrichedProps) {
  // Convert keyHighlights to Event-like objects for HighlightCards
  const enrichedEvents = keyHighlights.map((highlight, index) => ({
    id: `highlight-${index}`,
    slug: highlight.eventSlug,
    title: highlight.title,
    start_year: highlight.year,
    end_year: null,
    location: null,
    tags: highlight.tags,
    summary: highlight.summary,
    description_html: null,
    significance_html: `<p>${highlight.whyItMatters}</p><p><strong>Immediate Impact:</strong> ${highlight.immediateImpact}</p>`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  return (
    <HighlightCards
      timeline={timeline}
      events={enrichedEvents}
      tagColorMap={tagColorMap}
    />
  );
}
