import type { Timeline } from '@/lib/database.types';

interface CitationsSectionProps {
  timeline: Timeline;
  sources: Array<{
    number: number;
    source: string;
    url: string | null;
  }>;
}

export default function CitationsSection({ timeline, sources }: CitationsSectionProps) {
  if (!sources || sources.length === 0) {
    return null;
  }

  const sortedSources = [...sources].sort((a, b) => a.number - b.number);

  return (
    <section className="py-12 bg-white border-t border-gray-200">
      <div className="content-container max-w-4xl">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          Sources &amp; References
        </h2>

        <p className="text-lg text-gray-600 mb-8">
          The following sources were consulted in researching {timeline.title}. Click any reference to visit the source.
        </p>

        <ol className="space-y-4">
          {sortedSources.map(citation => (
            <li key={citation.number} id={`citation-${citation.number}`} className="scroll-mt-24">
              <div className="flex gap-4">
                <span className="text-antiqueBronze-600 font-semibold flex-shrink-0">[{citation.number}]</span>
                <div>
                  {citation.url ? (
                    <a
                      href={citation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {citation.source}
                    </a>
                  ) : (
                    <span className="text-gray-700">{citation.source}</span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
