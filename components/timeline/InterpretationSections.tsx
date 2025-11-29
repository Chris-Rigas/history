interface InterpretationSection {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  citations: number[];
}

interface InterpretationSectionsProps {
  sections: InterpretationSection[];
  citations?: Array<{ number: number; source: string; url: string }>;
}

export default function InterpretationSections({
  sections,
  citations,
}: InterpretationSectionsProps) {
  if (!sections || sections.length === 0) {
    return null;
  }

  const renderWithCitations = (text: string) => {
    if (!text || !citations) return text;

    const parts = text.split(/(\[\d+\])/g);

    return parts.map((part, index) => {
      const match = part.match(/\[(\d+)\]/);

      if (match) {
        const number = parseInt(match[1], 10);
        const citation = citations.find(c => c.number === number);

        return (
          <sup key={`${part}-${index}`}>
            <a
              href={citation?.url || `#citation-${number}`}
              className="text-blue-600 hover:text-blue-800 hover:underline"
              title={citation?.source}
              target="_blank"
              rel="noopener noreferrer"
            >
              [{number}]
            </a>
          </sup>
        );
      }

      return <span key={`${part}-${index}`}>{part}</span>;
    });
  };

  const renderParagraphs = (content: string) => {
    const paragraphs = content.split(/\n\n+/);

    return paragraphs.map((paragraph, index) => (
      <p key={index} className="text-gray-700 leading-relaxed mb-4 last:mb-0">
        {renderWithCitations(paragraph.trim())}
      </p>
    ));
  };

  return (
    <div className="space-y-12 mt-10">
      {sections.map((section) => (
        <div
          key={section.id}
          className="border-l-4 border-antiqueBronze-400 pl-6 py-2"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight uppercase">
            {section.title}
          </h3>
          {section.subtitle && (
            <p className="text-sm text-gray-600 italic mb-4">
              {section.subtitle}
            </p>
          )}
          <div className="prose prose-lg max-w-none">
            {renderParagraphs(section.content)}
          </div>
        </div>
      ))}
    </div>
  );
}
