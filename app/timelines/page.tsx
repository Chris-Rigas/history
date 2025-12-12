import Link from 'next/link';
import type { Metadata } from 'next';
import { getAllTimelines } from '@/lib/queries/timelines';
import { stripTimelineFormatting } from '@/lib/timelines/formatting';
import { REGIONS } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Browse All Historical Timelines',
  description: 'Explore comprehensive interactive timelines of historical events, civilizations, empires, and key figures across different regions and eras.',
  keywords: ['timelines', 'history', 'historical events', 'civilizations', 'empires'],
  openGraph: {
    title: 'Browse All Historical Timelines',
    description: 'Explore comprehensive interactive timelines of historical events, civilizations, empires, and key figures.',
    type: 'website',
  },
};

export const revalidate = 3600; // Revalidate every hour

export default async function TimelinesPage() {
  const timelines = await getAllTimelines();

  return (
    <div className="min-h-screen bg-parchment-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-antiqueBronze-600 to-antiqueBronze-500 text-white py-16">
        <div className="content-container">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Browse Historical Timelines
          </h1>
          <p className="text-xl text-parchment-100 max-w-3xl">
            Explore comprehensive timelines spanning different civilizations, empires, and historical periods. 
            Discover the key events, influential figures, and turning points that shaped our world.
          </p>
        </div>
      </section>

      {/* Timelines Grid */}
      <section className="py-16">
        <div className="content-container">
          {timelines.length > 0 ? (
            <>
              <div className="mb-8">
                <p className="text-gray-600">
                  Showing {timelines.length} timeline{timelines.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {timelines.map((timeline) => {
                  const summaryPlain = timeline.summary
                    ? stripTimelineFormatting(timeline.summary)
                    : '';

                  return (
                    <Link
                      key={timeline.id}
                      href={`/timelines/${timeline.slug}`}
                      className="group block bg-white rounded-lg p-6 border border-parchment-200 hover:border-antiqueBronze-400 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-antiqueBronze-600">
                          {timeline.start_year} - {timeline.end_year}
                        </span>
                        {timeline.region && (
                          <span className="text-sm text-gray-500">
                            {timeline.region}
                          </span>
                        )}
                      </div>

                      <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-antiqueBronze-700 transition-colors">
                        {timeline.title}
                      </h2>

                      {summaryPlain && (
                        <p className="text-gray-600 line-clamp-4 mb-4">
                          {summaryPlain}
                        </p>
                      )}

                      <div className="mt-4 text-antiqueBronze-600 font-medium group-hover:text-antiqueBronze-700">
                        Explore Timeline →
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">
                No timelines available yet. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
