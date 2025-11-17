import type { TimelineFull } from '@/lib/database.types';
import type { TimelineStructuredContent } from '@/lib/timelines/structuredContent';
import type { ThemedTimelineCategory } from './types';
import {
  formatTimelineSummary,
  linkifyTimelineCitations,
} from '@/lib/timelines/formatting';
import { cn } from '@/lib/utils';

interface OverviewSummaryProps {
  timeline: TimelineFull;
  narrative?: TimelineStructuredContent | null;
  categories?: ThemedTimelineCategory[];
}

export default function OverviewSummary({
  timeline,
  narrative,
  categories,
}: OverviewSummaryProps) {
  const overviewText = narrative?.overview?.trim() || timeline.summary;
  if (!overviewText) {
    return null;
  }

  const summaryHtml = linkifyTimelineCitations(
    formatTimelineSummary(overviewText),
    timeline.sources || [],
  );

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
        Overview
      </h2>

      <div
        className="prose prose-lg prose-gray max-w-none"
        dangerouslySetInnerHTML={{ __html: summaryHtml }}
      />

      {categories && categories.length > 0 && (
        <div className="mt-10">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            What this period was really about
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {categories.map(category => (
              <div
                key={category.id}
                className={cn(
                  'rounded-2xl border p-4 shadow-sm',
                  category.colorClass.border,
                  category.colorClass.lightBg,
                )}
              >
                <p
                  className={cn(
                    'text-sm font-semibold uppercase tracking-wide',
                    category.colorClass.text,
                  )}
                >
                  {category.title}
                </p>
                {category.description && (
                  <p className="mt-2 text-sm text-gray-700">
                    {category.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {timeline.map_image_url && (
        <div className="mt-8">
          <img
            src={timeline.map_image_url}
            alt={`Map of ${timeline.title}`}
            className="w-full rounded-lg shadow-lg"
          />
        </div>
      )}
    </div>
  );
}
