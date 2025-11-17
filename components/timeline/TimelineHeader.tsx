import type { TimelineFull } from '@/lib/database.types';
import type { TimelineStructuredContent } from '@/lib/timelines/structuredContent';
import type { ThemedTimelineCategory } from './types';
import { stripTimelineFormatting } from '@/lib/timelines/formatting';
import { cn } from '@/lib/utils';

interface TimelineHeaderProps {
  timeline: TimelineFull;
  narrative?: TimelineStructuredContent | null;
  categories?: ThemedTimelineCategory[];
}

export default function TimelineHeader({
  timeline,
  narrative,
  categories,
}: TimelineHeaderProps) {
  const summaryPlain = timeline.summary ? stripTimelineFormatting(timeline.summary) : '';
  const metaDescription = timeline.metadata?.meta_description?.trim();
  const subheadingSource = metaDescription || summaryPlain;
  const firstSentence = subheadingSource
    ? subheadingSource.split(/(?<=[.?!])\s+/)[0]
    : '';
  const headingTitle =
    timeline.metadata?.seo_title?.trim() || `${timeline.title} — Timeline & Key Events`;

  return (
    <header className="bg-gradient-to-br from-antiqueBronze-600 to-antiqueBronze-500 text-white py-12">
      <div className="content-container">
        {/* Title */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-balance">
          {headingTitle}
        </h1>

        {/* Subheading */}
        {firstSentence && (
          <p className="text-xl md:text-2xl text-parchment-100 mb-8 max-w-4xl">
            {firstSentence}
          </p>
        )}

        {/* Fast Facts */}
        <div className="flex flex-wrap gap-6 text-parchment-100">
          <div className="flex items-center space-x-2">
            <svg
              className="w-5 h-5"
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="font-medium">
              {timeline.start_year} — {timeline.end_year}
            </span>
          </div>

          {timeline.region && (
            <div className="flex items-center space-x-2">
              <svg
                className="w-5 h-5"
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
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="font-medium">{timeline.region}</span>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <svg
              className="w-5 h-5"
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
            <span className="font-medium">
              {timeline.end_year - timeline.start_year} years
            </span>
          </div>
        </div>

        {narrative?.centralQuestion && (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
              <p className="text-sm uppercase tracking-widest text-parchment-200 font-semibold">
                Central question
              </p>
              <p className="text-2xl font-semibold text-white mt-3">
                {narrative.centralQuestion}
              </p>
              {narrative.storyCharacter && (
                <p className="mt-4 text-parchment-100">
                  Story type:{' '}
                  <span className="font-semibold">{narrative.storyCharacter}</span>
                </p>
              )}
            </div>

            {categories && categories.length > 0 && (
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <p className="text-sm uppercase tracking-widest text-parchment-200 font-semibold">
                  Thematic threads
                </p>
                <div className="mt-4 space-y-3">
                  {categories.slice(0, 4).map(category => (
                    <div key={category.id} className="flex items-start gap-3">
                      <span
                        className={cn(
                          'mt-1 inline-flex h-3 w-3 rounded-full border border-white/40',
                          category.colorClass.dot,
                        )}
                      />
                      <div>
                        <p className="text-base font-semibold text-white">
                          {category.title}
                        </p>
                        {category.description && (
                          <p className="text-sm text-parchment-100">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
