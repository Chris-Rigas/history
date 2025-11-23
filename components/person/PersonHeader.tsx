import Link from 'next/link';
import type { Person, Timeline } from '@/lib/database.types';

interface PersonHeaderProps {
  person: Person;
  timeline: Timeline;
}

export default function PersonHeader({ person, timeline }: PersonHeaderProps) {
  const formatYear = (year?: number | null) => {
    if (year === null || year === undefined) return null;
    return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
  };

  const formatLifeDates = () => {
    const birth = formatYear(person.birth_year);
    const death = formatYear(person.death_year);

    if (!birth && !death) {
      return 'Dates unknown';
    }

    if (birth && death) {
      return `${birth} – ${death}`;
    }

    if (birth) {
      return `Born ${birth}`;
    }

    return `Died ${death}`;
  };

  // Calculate age at death if both dates available
  const getLifespan = () => {
    if (person.birth_year !== null && person.birth_year !== undefined && person.death_year !== null && person.death_year !== undefined) {
      return person.death_year - person.birth_year;
    }
    return null;
  };

  const lifespan = getLifespan();

  return (
    <header className="bg-gradient-to-br from-antiqueBronze-600 to-antiqueBronze-500 text-white py-12">
      <div className="content-container">
        {/* Timeline Context Link */}
        <Link
          href={`/timelines/${timeline.slug}`}
          className="inline-flex items-center text-parchment-200 hover:text-white mb-4 transition-colors"
        >
          <svg
            className="w-4 h-4 mr-2"
            width={16}
            height={16}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to {timeline.title}
        </Link>

        <div className="max-w-4xl">
          {/* Avatar and Name */}
          <div className="flex items-start space-x-6 mb-6">
            {/* Large Avatar */}
            <div className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 bg-parchment-100 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 md:w-16 md:h-16 text-antiqueBronze-600"
                width={48}
                height={48}
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

            <div className="flex-1">
              {/* Name */}
              <h1 className="text-4xl md:text-5xl font-bold mb-3">
                {person.name}
              </h1>

              {/* Life Dates */}
              {formatLifeDates() && (
                <div className="flex items-center space-x-4 text-parchment-100 text-lg md:text-xl mb-4">
                  <span className="font-medium">{formatLifeDates()}</span>
                  {lifespan && (
                    <span className="text-parchment-200">
                      (lived {lifespan} years)
                    </span>
                  )}
                </div>
              )}

              {/* Short Bio */}
              {person.bio_short && (
                <p className="text-xl text-parchment-100 leading-relaxed">
                  {person.bio_short}
                </p>
              )}
            </div>
          </div>

          {/* Full Biography */}
          {person.bio_long && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mt-6">
              <h2 className="text-xl font-bold mb-4">Biography</h2>
              <div className="text-parchment-100 leading-relaxed space-y-3">
                {person.bio_long.split('\n').map((paragraph, index) => (
                  paragraph.trim() && (
                    <p key={index}>{paragraph}</p>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Timeline Context */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <div className="flex items-center text-parchment-200">
              <svg
                className="w-5 h-5 mr-2"
                width={20}
                height={20}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                Key figure in{' '}
                <Link
                  href={`/timelines/${timeline.slug}`}
                  className="text-white font-semibold hover:text-parchment-100 transition-colors underline"
                >
                  {timeline.title}
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
