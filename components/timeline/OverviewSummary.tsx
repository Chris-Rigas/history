import type { Timeline } from '@/lib/database.types';

interface OverviewSummaryProps {
  timeline: Timeline;
}

export default function OverviewSummary({ timeline }: OverviewSummaryProps) {
  if (!timeline.summary) {
    return null;
  }

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
        Overview
      </h2>
      
      <div className="prose prose-lg prose-gray max-w-none">
        {timeline.summary.split('\n').map((paragraph, index) => (
          paragraph.trim() && (
            <p key={index} className="text-gray-700 leading-relaxed mb-4">
              {paragraph}
            </p>
          )
        ))}
      </div>

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
