import Link from 'next/link';
import type { Timeline, Person } from '@/lib/database.types';

interface KeyPeopleGridProps {
  timeline: Timeline;
  people: Person[];
}

export default function KeyPeopleGrid({ timeline, people }: KeyPeopleGridProps) {
  if (people.length === 0) {
    return null;
  }

  // Format life dates
  const formatLifeDates = (person: Person) => {
    const birth = person.birth_year ? `${person.birth_year}` : '?';
    const death = person.death_year ? `${person.death_year}` : '?';
    
    if (birth === '?' && death === '?') {
      return null;
    }
    
    return `${birth} — ${death}`;
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          Key Figures
        </h2>
        <p className="text-gray-600 max-w-3xl">
          Learn about the influential people who played pivotal roles in {timeline.title}.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {people.slice(0, 12).map((person) => (
          <Link
            key={person.id}
            href={`/timelines/${timeline.slug}/people/${person.slug}`}
            className="group block"
          >
            <div className="bg-parchment-50 rounded-lg border border-parchment-200 p-6 h-full hover:border-antiqueBronze-400 hover:shadow-lg transition-all">
              {/* Avatar Placeholder */}
              <div className="w-16 h-16 bg-antiqueBronze-200 rounded-full flex items-center justify-center mb-4 mx-auto group-hover:bg-antiqueBronze-300 transition-colors">
                <svg
                  className="w-8 h-8 text-antiqueBronze-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>

              {/* Name */}
              <h3 className="text-lg font-bold text-gray-900 mb-2 text-center group-hover:text-antiqueBronze-700 transition-colors">
                {person.name}
              </h3>

              {/* Life Dates */}
              {formatLifeDates(person) && (
                <div className="text-sm text-gray-500 text-center mb-3">
                  {formatLifeDates(person)}
                </div>
              )}

              {/* Bio Short */}
              {person.bio_short && (
                <p className="text-sm text-gray-600 text-center line-clamp-3">
                  {person.bio_short}
                </p>
              )}

              {/* Learn More */}
              <div className="flex items-center justify-center text-blue-600 font-medium text-sm mt-4 group-hover:text-blue-700">
                <span>Learn More</span>
                <svg
                  className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {people.length > 12 && (
        <div className="text-center mt-8">
          <p className="text-gray-500">
            Showing 12 of {people.length} key figures
          </p>
        </div>
      )}
    </div>
  );
}
