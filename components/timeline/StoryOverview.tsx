import type { TimelineStructuredContent } from '@/lib/timelines/structuredContent';

interface StoryOverviewProps {
  narrative: TimelineStructuredContent;
}

export default function StoryOverview({ narrative }: StoryOverviewProps) {
  if (!narrative.overview) {
    return null;
  }

  const paragraphs = narrative.overview
    .split('\n\n')
    .map(paragraph => paragraph.trim())
    .filter(Boolean);

  return (
    <section className="py-12 bg-white">
      <div className="content-container max-w-4xl">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
          The Story
        </h2>

        <div className="prose prose-lg prose-gray max-w-none">
          {paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className="text-gray-700 leading-relaxed mb-6 first:text-xl first:leading-relaxed"
            >
              {paragraph}
            </p>
          ))}
        </div>

        {narrative.storyCharacter && (
          <div className="mt-8 p-6 bg-parchment-50 rounded-xl border border-parchment-200">
            <p className="text-sm uppercase tracking-wide text-antiqueBronze-600 font-semibold mb-2">
              Story Character
            </p>
            <p className="text-gray-700 text-lg">
              {narrative.storyCharacter}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
