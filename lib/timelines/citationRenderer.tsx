import type { ReactNode } from 'react';
import type { TimelineCitationRaw } from './structuredContent';

export function renderTextWithCitations(
  text: string,
  citations?: TimelineCitationRaw[],
): ReactNode {
  if (!text) {
    return null;
  }

  const parts = text.split(/(\[\d+\])/g);

  return parts.map((part, index) => {
    const match = part.match(/\[(\d+)\]/);

    if (match) {
      const number = parseInt(match[1], 10);
      const citation = citations?.find(entry => entry.number === number);

      return (
        <sup key={`citation-${number}-${index}`}>
          <a
            href={`#citation-${number}`}
            className="text-blue-600 hover:underline"
            title={citation?.source || citation?.title || `Source [${number}]`}
          >
            [{number}]
          </a>
        </sup>
      );
    }

    return <span key={`text-${index}`}>{part}</span>;
  });
}
