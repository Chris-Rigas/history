import type { Event } from '@/lib/database.types';

interface EventNarrativeProps {
  event: Event;
}

export default function EventNarrative({ event }: EventNarrativeProps) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Summary */}
      {event.summary && (
        <div className="mb-8">
          <p className="text-xl md:text-2xl text-gray-700 leading-relaxed font-serif">
            {event.summary}
          </p>
        </div>
      )}

      {/* Main Description */}
      {event.description_html && (
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            What Happened
          </h2>
          <div
            className="prose-historical"
            dangerouslySetInnerHTML={{ __html: event.description_html }}
          />
        </div>
      )}

      {/* Significance */}
      {event.significance_html && (
        <div className="bg-parchment-50 rounded-lg border-2 border-antiqueBronze-300 p-8 md:p-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Why This Matters
          </h2>
          <div
            className="prose-historical"
            dangerouslySetInnerHTML={{ __html: event.significance_html }}
          />
        </div>
      )}
    </div>
  );
}
