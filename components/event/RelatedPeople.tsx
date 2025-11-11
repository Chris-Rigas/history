import Link from 'next/link';
import type { Timeline, Event, Person } from '@/lib/database.types';

interface RelatedPeopleProps {
  timeline: Timeline;
  event: Event;
  people: Person[];
}

export default function RelatedPeople({ timeline, event, people }: RelatedPeopleProps) {
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
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          People Involved
        </h2>
        <p className="text-gray-600">
          Key figures who played a role in {event.title}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {people.map((person) => (
          <Link
            key={person.id}
            href={`/timelines/${timeline.slug}/people/${person.slug}`}
            className="group block"
          >
            <div className="bg-white rounded-lg border border-gray-200 p-6 h-full hover:border-antiqueBronze-400 hover:shadow-lg transition-all">
              {/* Avatar */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-16 h-16 bg-antiqueBronze-200 rounded-full flex items-center justify-center group-hover:bg-antiqueBronze-300 transition-colors">
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

                <div className="flex-1 min-w-0">
                  {/* Name */}
                  <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-antiqueBronze-700 transition-colors">
                    {person.name}
                  </h3>

                  {/* Life Dates */}
                  {formatLifeDates(person) && (
                    <div className="text-sm text-gray-500 mb-2">
                      {formatLifeDates(person)}
                    </div>
                  )}

                  {/* Bio Short */}
                  {person.bio_short && (
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {person.bio_short}
                    </p>
                  )}
                </div>
              </div>

              {/* Learn More */}
              <div className="flex items-center text-blue-600 font-medium text-sm mt-4 group-hover:text-blue-700">
                <span>View Profile</span>
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
    </div>
  );
}
