import Link from 'next/link';
import type { Timeline } from '@/lib/database.types';
import type { BoundTurningPoint } from '@/lib/timelines/narrative';

interface TurningPointsSectionProps {
  turningPoints: BoundTurningPoint[];
  timeline: Timeline;
}

export default function TurningPointsSection({ turningPoints, timeline }: TurningPointsSectionProps) {
  if (!turningPoints.length) {
    return null;
  }

  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
        Key turning points
      </h2>
      <p className="text-gray-600 mb-6">
        Moments when the trajectory could have shifted in another direction
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        {turningPoints.map(point => (
          <div
            key={point.title}
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
          >
            <p className="text-sm uppercase tracking-wide text-antiqueBronze-600 font-semibold">
              {point.title}
            </p>
            <p className="text-gray-800 mt-3">{point.description}</p>
            {point.whyItMatters && (
              <p className="text-sm text-gray-600 mt-2">{point.whyItMatters}</p>
            )}
            {point.eventSlug && (
              <Link
                href={`/timelines/${timeline.slug}/events/${point.eventSlug}`}
                className="inline-flex items-center text-blue-600 text-sm font-semibold mt-4"
              >
                Read the event
                <svg
                  className="w-4 h-4 ml-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
