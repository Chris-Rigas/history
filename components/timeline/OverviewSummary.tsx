import type { TimelineFull } from '@/lib/database.types';
import {
  formatTimelineSummary,
  linkifyTimelineCitations,
} from '@/lib/timelines/formatting';

interface OverviewSummaryProps {
  timeline: TimelineFull;
}

export default function OverviewSummary({ timeline }: OverviewSummaryProps) {
  if (!timeline.summary) {
    return null;
  }

  const summaryHtml = linkifyTimelineCitations(
    formatTimelineSummary(timeline.summary),
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
