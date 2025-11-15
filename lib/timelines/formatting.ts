export interface TimelineCitation {
  number: number;
  source: string;
  url: string;
}

interface CitationLike {
  number?: number;
  source?: string;
  url?: string;
}

function applyInlineFormatting(text: string): string {
  if (!text) return '';

  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(\d+)\]/g, '<sup>[$1]</sup>');
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean);
}

export function formatTimelineSummary(summary: string): string {
  if (!summary) {
    return '';
  }

  return splitParagraphs(summary)
    .map(paragraph => `<p>${applyInlineFormatting(paragraph)}</p>`)
    .join('\n');
}

export function formatTimelineInterpretation(text: string): string {
  if (!text) {
    return '';
  }

  const sections = text.split(/\n(?=[A-Z][^\n]*:)/);

  let html = '';

  for (const rawSection of sections) {
    const section = rawSection.trim();
    if (!section) continue;

    const lines = section.split('\n');
    const headingMatch = lines[0].match(/^([^:]+):\s*(.*)$/);

    if (headingMatch) {
      const [, heading, firstLineRemainder] = headingMatch;
      html += `<h3>${heading.trim()}</h3>\n`;

      const remainderText = [firstLineRemainder, ...lines.slice(1)]
        .join('\n')
        .trim();

      if (remainderText) {
        const paragraphs = splitParagraphs(remainderText);
        for (const paragraph of paragraphs) {
          html += `<p>${applyInlineFormatting(paragraph)}</p>\n`;
        }
      }
    } else {
      const paragraphs = splitParagraphs(section);
      for (const paragraph of paragraphs) {
        html += `<p>${applyInlineFormatting(paragraph)}</p>\n`;
      }
    }
  }

  return html.trim();
}

export function dedupeTimelineCitations(citations: CitationLike[]): TimelineCitation[] {
  const map = new Map<string, TimelineCitation>();

  citations.forEach(citation => {
    const url = citation.url?.trim();
    const source = citation.source?.trim();
    if (!url || !source) {
      return;
    }

    if (!map.has(url)) {
      map.set(url, {
        number: map.size + 1,
        source,
        url,
      });
    }
  });

  return Array.from(map.values()).map((citation, index) => ({
    ...citation,
    number: index + 1,
  }));
}

export function linkifyTimelineCitations(html: string, citations: TimelineCitation[]): string {
  if (!html) {
    return html;
  }

  const citationMap = new Map<string, string>();

  citations.forEach(citation => {
    citationMap.set(`[${citation.number}]`, citation.url);
  });

  return html.replace(/<sup>\[(\d+)\]<\/sup>/g, (match, num) => {
    const key = `[${num}]`;
    const url = citationMap.get(key);

    if (url) {
      return `<sup><a href="${url}" target="_blank" rel="noopener noreferrer" class="citation-link">${num}</a></sup>`;
    }

    return match;
  });
}

export function stripTimelineFormatting(text: string): string {
  if (!text) {
    return '';
  }

  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\[(\d+)\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
