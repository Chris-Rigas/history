interface Perspective {
  category: string;
  title: string;
  content: string;
  citations: number[];
}

interface PerspectivesSectionProps {
  perspectives: Perspective[];
  citations?: Array<{ number: number; source: string; url: string }>;
}

const CATEGORY_COLORS: Record<string, string> = {
  INTERPRETATIONS: 'bg-blue-50 border-blue-200',
  DEBATES: 'bg-purple-50 border-purple-200',
  CONFLICT: 'bg-red-50 border-red-200',
  HISTORIOGRAPHY: 'bg-green-50 border-green-200',
  'WITH HINDSIGHT': 'bg-amber-50 border-amber-200',
  'SOURCES AND BIAS': 'bg-gray-50 border-gray-200',
};

export default function PerspectivesSection({ perspectives, citations }: PerspectivesSectionProps) {
  if (!perspectives || perspectives.length === 0) {
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
              className="text-blue-600 hover:text-blue-800 hover:underline text-xs"
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

  return (
    <div className="bg-parchment-100 border border-parchment-200 rounded-3xl p-8">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
        Perspectives
      </h2>
      <p className="text-gray-600 mb-6">
        How we know what we know—and what people at the time noticed
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {perspectives.map((perspective, index) => {
          const colorClass = CATEGORY_COLORS[perspective.category] || 'bg-gray-50 border-gray-200';

          return (
            <div
              key={index}
              className={`${colorClass} border-2 rounded-2xl p-6`}
            >
              <p className="text-xs uppercase tracking-wider font-bold text-gray-600 mb-2">
                {perspective.category}
              </p>
              <h3 className="text-lg font-bold text-gray-900 mb-3 leading-tight">
                {perspective.title}
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                {renderWithCitations(perspective.content)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
