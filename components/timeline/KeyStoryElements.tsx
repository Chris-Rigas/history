import type { TimelineFull } from '@/lib/database.types';
import type { TimelineStructuredContent } from '@/lib/timelines/structuredContent';
import type { ThemedTimelineCategory } from './types';
import { stripTimelineFormatting } from '@/lib/timelines/formatting';
import { cn } from '@/lib/utils';
import { renderTextWithCitations } from '@/lib/timelines/citationRenderer';

interface EnrichmentKeyFact {
  title: string;
  detail: string;
  citations?: number[];
}

interface KeyStoryElementsProps {
  timeline: TimelineFull;
  narrative?: TimelineStructuredContent | null;
  categories?: ThemedTimelineCategory[];
  enrichmentKeyFacts?: EnrichmentKeyFact[];
}

export default function KeyStoryElements({
  timeline,
  narrative,
  categories,
  enrichmentKeyFacts,
}: KeyStoryElementsProps) {
  const keyFacts = enrichmentKeyFacts?.length
    ? enrichmentKeyFacts
    : narrative?.keyFacts?.length
      ? narrative.keyFacts
      : null;

  const keyFactsSource = keyFacts
    ? enrichmentKeyFacts?.length
      ? 'enrichment'
      : narrative?.keyFacts?.length
        ? 'narrative'
        : 'defaults'
    : 'defaults';

  console.log(`[KeyStoryElements] enrichmentKeyFacts: ${enrichmentKeyFacts?.length || 0}`);
  console.log(`[KeyStoryElements] narrative.keyFacts: ${narrative?.keyFacts?.length || 0}`);
  console.log(`[KeyStoryElements] using source: ${keyFactsSource}`);

  const defaultFacts = [
    { title: 'Start', detail: `${timeline.start_year}` },
    { title: 'End', detail: `${timeline.end_year}` },
    {
      title: 'Duration',
      detail:
        timeline.end_year && timeline.start_year
          ? `${Math.max(1, timeline.end_year - timeline.start_year)} years`
          : 'Single-year focus',
    },
    ...(timeline.region
      ? [{ title: 'Primary Region', detail: timeline.region }]
      : []),
  ];

  const factsToRender = keyFacts || defaultFacts;
  const definingSummary = narrative?.summary ||
    (timeline.summary ? stripTimelineFormatting(timeline.summary) : '');

  if (!narrative && factsToRender.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-parchment-50">
      <div className="content-container">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
          <div className="lg:w-2/5 space-y-6">
            <div className="bg-white rounded-2xl border border-parchment-200 p-6 shadow-sm">
              <p className="text-sm uppercase tracking-wide text-antiqueBronze-600 font-semibold mb-2">
                Key Story Elements
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                What defined this period?
              </h3>
              {definingSummary && (
                <p className="text-gray-700 leading-relaxed mb-6">
                  {renderTextWithCitations(definingSummary, narrative?.citations)}
                </p>
              )}
              {narrative?.storyCharacter && (
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">
                    Story Character
                  </p>
                  <p className="text-lg text-gray-800">
                    {narrative.storyCharacter}
                  </p>
                </div>
              )}

              {categories && categories.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-3">
                    Thematic Threads
                  </p>
                  <div className="space-y-3">
                    {categories.map(category => (
                      <div key={category.id} className="flex items-start gap-3">
                        <span
                          className={cn(
                            'mt-1 inline-flex h-3 w-3 rounded-full border border-white',
                            category.colorClass.dot,
                          )}
                        />
                        <div>
                          <p className="text-base font-semibold text-gray-900">
                            {category.title}
                          </p>
                          {category.description && (
                            <p className="text-sm text-gray-600">
                              {renderTextWithCitations(
                                category.description,
                                narrative?.citations,
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {timeline.map_image_url && (
              <div className="rounded-2xl overflow-hidden shadow-lg border border-parchment-200">
                <img
                  src={timeline.map_image_url}
                  alt={`Map of ${timeline.title}`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          <div className="lg:flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-4">
              Quick Facts
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {factsToRender.map(fact => {
                return (
                  <div
                    key={`${fact.title}-${fact.detail}`}
                    className="p-4 rounded-xl bg-parchment-100 border border-parchment-200"
                  >
                    <p className="text-sm text-gray-500 font-semibold uppercase tracking-wide">
                      {fact.title}
                    </p>
                    <p className="text-lg font-medium text-gray-900 mt-1">
                      {renderTextWithCitations(fact.detail, narrative?.citations)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
