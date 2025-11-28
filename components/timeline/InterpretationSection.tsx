import type { TimelineFull } from '@/lib/database.types';
import type { TimelineStructuredContent } from '@/lib/timelines/structuredContent';
import type { ThemeInsight as EnrichedThemeInsight } from '@/lib/generation/types';
import type { ThemedTimelineCategory } from './types';
import { cn } from '@/lib/utils';
import { renderTextWithCitations } from '@/lib/timelines/citationRenderer';

interface InterpretationSectionProps {
  timeline: TimelineFull;
  narrative?: TimelineStructuredContent | null;
  categories?: ThemedTimelineCategory[];
}

export default function InterpretationSection({
  timeline,
  narrative,
  categories,
}: InterpretationSectionProps) {
  if (!timeline.interpretation_html) {
    return null;
  }

  const themeInsights = (
    narrative?.enrichment?.themeInsights ?? narrative?.themeInsights ?? []
  ) as Array<EnrichedThemeInsight | NonNullable<TimelineStructuredContent['themeInsights']>[number]>;
  const hasEnrichment = !!narrative?.enrichment?.themeInsights;

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          Interpretation & Significance
        </h2>
        <p className="text-gray-600">
          Understanding the broader historical context and lasting impact of {timeline.title}
        </p>
      </div>

      {themeInsights.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {themeInsights.map((insight, index) => {
            const displayTitle = hasEnrichment
              ? (insight as EnrichedThemeInsight).themeId || insight.title
              : insight.title;

            return (
              <div
                key={displayTitle || index}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
              >
                <p className="text-sm uppercase tracking-wide text-antiqueBronze-600 font-semibold">
                  {displayTitle}
                </p>
                <div className="prose prose-gray max-w-none mt-3">
                  <p className="text-gray-700">
                    {renderTextWithCitations(insight.insight, narrative.citations)}
                  </p>

                  {insight.analysis && (
                    <p className="text-gray-700 mt-2">
                      {renderTextWithCitations(insight.analysis, narrative.citations)}
                    </p>
                  )}

                  {insight.modernRelevance && (
                    <p className="text-gray-600 italic text-sm mt-2">
                      {renderTextWithCitations(
                        insight.modernRelevance,
                        narrative.citations,
                      )}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {categories && categories.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Thematic weight
          </h3>
          <div className="flex flex-wrap gap-3">
            {categories.map(category => (
              <span
                key={category.id}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-semibold',
                  category.colorClass.badge,
                  category.colorClass.badgeText,
                )}
              >
                {category.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 md:p-10">
        <div
          className="prose-historical"
          dangerouslySetInnerHTML={{ __html: timeline.interpretation_html }}
        />
      </div>

      {/* Visual Divider */}
      <div className="flex items-center justify-center my-8">
        <div className="h-1 w-24 bg-gradient-to-r from-transparent via-antiqueBronze-400 to-transparent rounded-full" />
      </div>
    </div>
  );
}
