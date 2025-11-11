import type { Timeline } from '@/lib/database.types';

interface InterpretationSectionProps {
  timeline: Timeline;
}

export default function InterpretationSection({ timeline }: InterpretationSectionProps) {
  if (!timeline.interpretation_html) {
    return null;
  }

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
