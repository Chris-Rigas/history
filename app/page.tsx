import Link from 'next/link';
import { getAllTimelines } from '@/lib/queries/timelines';

export const revalidate = 3600; // Revalidate every hour

export default async function HomePage() {
  const timelines = await getAllTimelines();
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-antiqueBronze-600 to-antiqueBronze-500 text-white py-20">
        <div className="content-container">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-balance">
              Explore History Through Interactive Timelines
            </h1>
            <p className="text-xl md:text-2xl text-parchment-100 mb-8 leading-relaxed">
              Deep dive into the rich narratives of civilizations, empires, and historical periods. 
              Discover key events, influential figures, and turning points that shaped our world.
            </p>
            <Link
              href="/timelines"
              className="inline-block bg-white text-antiqueBronze-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-parchment-100 transition-colors"
            >
              Browse All Timelines
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Timelines */}
      <section className="py-16 bg-white">
        <div className="content-container">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Featured Timelines
          </h2>
          <p className="text-lg text-gray-600 mb-12 max-w-3xl">
            Explore our curated collection of historical timelines spanning different regions and eras.
          </p>

          {timelines.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {timelines.slice(0, 6).map((timeline) => (
                <Link
                  key={timeline.id}
                  href={`/timelines/${timeline.slug}`}
                  className="group block bg-parchment-50 rounded-lg p-6 border border-parchment-200 hover:border-antiqueBronze-400 hover:shadow-lg transition-all"
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
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-antiqueBronze-700 transition-colors">
                    {timeline.title}
                  </h3>
                  
                  {timeline.summary && (
                    <p className="text-gray-600 line-clamp-3">
                      {timeline.summary}
                    </p>
                  )}
                  
                  <div className="mt-4 text-blue-600 font-medium group-hover:text-blue-700">
                    Explore Timeline →
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No timelines available yet. Check back soon!
              </p>
            </div>
          )}

          {timelines.length > 6 && (
            <div className="text-center mt-12">
              <Link
                href="/timelines"
                className="inline-block text-blue-600 font-semibold hover:text-blue-700 text-lg"
              >
                View All {timelines.length} Timelines →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-parchment-50">
        <div className="content-container">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
            How It Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-antiqueBronze-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-3">Choose a Timeline</h3>
              <p className="text-gray-600">
                Browse our collection of historical timelines covering diverse periods and regions.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-antiqueBronze-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-3">Explore Events</h3>
              <p className="text-gray-600">
                Navigate through interactive timelines, filter by importance, and discover key turning points.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-antiqueBronze-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-3">Ask Questions</h3>
              <p className="text-gray-600">
                Use our AI-powered Q&A to dive deeper and get answers to your historical questions.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
