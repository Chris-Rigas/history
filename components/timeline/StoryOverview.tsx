import type {
  TimelineCitationRaw,
  TimelineOverviewSection,
  TimelineStructuredContent,
} from '@/lib/timelines/structuredContent';

interface StoryOverviewProps {
  narrative: TimelineStructuredContent;
}

export default function StoryOverview({ narrative }: StoryOverviewProps) {
  if (!narrative.overview && !narrative.overviewSections?.length) {
    return null;
  }

  const renderWithCitations = (text: string) => {
    if (!text) {
      return null;
    }

    const parts = text.split(/(\[\d+\])/g);

    return parts.map((part, index) => {
      const match = part.match(/\[(\d+)\]/);

      if (match) {
        const number = parseInt(match[1], 10);
        const citation = narrative.citations?.find(
          (entry: TimelineCitationRaw) => entry.number === number
        );

        return (
          <sup key={`${part}-${index}`}>
            <a
              href={`#citation-${number}`}
              className="text-blue-600 hover:underline"
              title={citation?.source || citation?.title}
            >
              [{number}]
            </a>
          </sup>
        );
      }

      return <span key={`${part}-${index}`}>{part}</span>;
    });
  };

  const sections: TimelineOverviewSection[] = narrative.overviewSections?.length
    ? narrative.overviewSections
    : (narrative.overview || '')
        .split('\n\n')
        .map(paragraph => paragraph.trim())
        .filter(Boolean)
        .map(content => ({ content }));

  return (
    <section className="py-12 bg-white">
      <div className="content-container max-w-4xl">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
          The Story
        </h2>

        <div className="prose prose-lg prose-gray max-w-none space-y-6">
          {sections.map((section, index) => (
            <div key={index}>
              {section.subheading && (
                <h3 className="text-xl font-semibold mb-2">{section.subheading}</h3>
              )}
              <p className="text-gray-700 leading-relaxed first:text-xl first:leading-relaxed">
                {renderWithCitations(section.content)}
              </p>
            </div>
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
