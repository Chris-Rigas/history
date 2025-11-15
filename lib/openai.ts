import OpenAI from 'openai';
import type {
  Response as OpenAIResponse,
  ResponseOutputMessage,
  ResponseOutputText,
} from 'openai/resources/responses/responses';
import { safeJsonParse } from './utils';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Model configuration
const CHAT_MODEL = 'gpt-4-turbo-preview';
const TIMELINE_MODEL = 'gpt-5';
const MAX_TOKENS = 4000;

interface TimelineSourceLink {
  url: string;
  title?: string;
  source?: string;
}

export interface TimelineStructuredFact {
  title: string;
  detail: string;
}

export interface TimelineStructuredSection {
  heading: string;
  content: string;
}

interface TimelineCitationRaw {
  number?: number;
  source?: string;
  title?: string;
  url?: string;
}

export interface TimelineStructuredContent {
  summary: string;
  mainContent: string;
  keyFacts: TimelineStructuredFact[];
  contextSections: TimelineStructuredSection[];
  citations: TimelineCitationRaw[];
}

export interface TimelineSEOMetadata {
  seoTitle: string;
  metaDescription: string;
  relatedKeywords: string[];
}

export interface TimelineResearchMetadata {
  initialUnderstanding: string;
  researchDigest: string;
  uniqueSources: TimelineSourceLink[];
  primarySources: TimelineSourceLink[];
  totalSources: number;
}

export interface TimelineCitationEntry {
  number: number;
  source: string;
  url: string;
}

export interface TimelineContentResult {
  summary: string;
  interpretation: string;
  citations: TimelineCitationEntry[];
  structured: TimelineStructuredContent;
  seo: TimelineSEOMetadata;
  research: TimelineResearchMetadata;
}

function extractResponseText(response: OpenAIResponse): string {
  if ((response as any).output_text) {
    return String((response as any).output_text).trim();
  }

  if (!Array.isArray(response.output)) {
    return '';
  }

  const segments: string[] = [];

  for (const item of response.output) {
    if ((item as ResponseOutputMessage).type === 'message') {
      const message = item as ResponseOutputMessage;
      for (const content of message.content) {
        if (content.type === 'output_text') {
          segments.push(content.text);
        }
      }
    }
  }

  return segments.join('\n').trim();
}

function extractUrlAnnotations(response: OpenAIResponse): TimelineSourceLink[] {
  if (!Array.isArray(response.output)) {
    return [];
  }

  const urls: TimelineSourceLink[] = [];

  for (const item of response.output) {
    if ((item as ResponseOutputMessage).type !== 'message') {
      continue;
    }

    const message = item as ResponseOutputMessage;
    for (const content of message.content) {
      if (content.type !== 'output_text') {
        continue;
      }

      for (const annotation of content.annotations || []) {
        const urlAnnotation = annotation as ResponseOutputText.URLCitation;
        if (urlAnnotation?.type === 'url_citation' && urlAnnotation.url) {
          urls.push({
            url: urlAnnotation.url,
            title: urlAnnotation.title,
          });
        }
      }
    }
  }

  return urls;
}

function dedupeSourceLinks(groups: TimelineSourceLink[][]): TimelineSourceLink[] {
  const ordered: TimelineSourceLink[] = [];
  const seen = new Set<string>();

  for (const group of groups) {
    for (const entry of group) {
      const url = entry.url?.trim();
      if (!url || seen.has(url)) {
        continue;
      }

      seen.add(url);
      ordered.push({
        url,
        title: entry.title?.trim(),
        source: entry.source?.trim(),
      });
    }
  }

  return ordered;
}

function normalizeStructuredContent(raw: any): TimelineStructuredContent {
  const summary = typeof raw?.summary === 'string' ? raw.summary.trim() : '';
  const mainContent = typeof raw?.mainContent === 'string' ? raw.mainContent.trim() : '';

  const keyFacts = Array.isArray(raw?.keyFacts)
    ? (raw.keyFacts
        .map((fact: any) => {
          if (typeof fact === 'string') {
            const text = fact.trim();
            if (!text) return null;
            return { title: text, detail: text } as TimelineStructuredFact;
          }

          const title = typeof fact?.title === 'string' ? fact.title.trim() : '';
          const detailCandidate =
            typeof fact?.detail === 'string'
              ? fact.detail.trim()
              : typeof fact?.text === 'string'
              ? fact.text.trim()
              : '';

          const detail = detailCandidate || title;
          const finalTitle = title || detailCandidate;

          if (!finalTitle && !detail) {
            return null;
          }

          return {
            title: finalTitle || '',
            detail: detail || '',
          } as TimelineStructuredFact;
        })
        .filter(Boolean) as TimelineStructuredFact[])
    : [];

  const contextSections = Array.isArray(raw?.contextSections)
    ? (raw.contextSections
        .map((section: any) => {
          if (typeof section === 'string') {
            const text = section.trim();
            if (!text) return null;
            return {
              heading: 'Context',
              content: text,
            } as TimelineStructuredSection;
          }

          const headingCandidate =
            typeof section?.heading === 'string'
              ? section.heading.trim()
              : typeof section?.title === 'string'
              ? section.title.trim()
              : 'Context';

          const contentCandidate =
            typeof section?.content === 'string'
              ? section.content.trim()
              : typeof section?.body === 'string'
              ? section.body.trim()
              : '';

          if (!contentCandidate) {
            return null;
          }

          return {
            heading: headingCandidate || 'Context',
            content: contentCandidate,
          } as TimelineStructuredSection;
        })
        .filter(Boolean) as TimelineStructuredSection[])
    : [];

  const citations = Array.isArray(raw?.citations)
    ? (raw.citations
        .map((citation: any) => ({
          number: typeof citation?.number === 'number' ? citation.number : undefined,
          source:
            typeof citation?.source === 'string'
              ? citation.source.trim()
              : typeof citation?.title === 'string'
              ? citation.title.trim()
              : undefined,
          title:
            typeof citation?.title === 'string'
              ? citation.title.trim()
              : undefined,
          url: typeof citation?.url === 'string' ? citation.url.trim() : undefined,
        }))
        .filter((citation: TimelineCitationRaw) => Boolean(citation.url && (citation.source || citation.title))) as TimelineCitationRaw[])
    : [];

  return {
    summary,
    mainContent,
    keyFacts,
    contextSections,
    citations,
  };
}

function buildInterpretationFromSections(sections: TimelineStructuredSection[]): string {
  if (!sections.length) {
    return '';
  }

  return sections
    .map(section => {
      const heading = section.heading?.trim() || 'Context';
      const content = section.content?.trim() || '';
      return content ? `${heading}:\n${content}` : `${heading}:`;
    })
    .join('\n\n');
}

function enforceSeoLimits(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  return value.slice(0, maxLength).trim();
}

/**
 * Generate timeline content using GPT
 */
export async function generateTimelineContent(params: {
  title: string;
  startYear: number;
  endYear: number;
  region?: string;
  context?: string;
}): Promise<TimelineContentResult> {
  const { title, startYear, endYear, region, context } = params;
  const topicLabel = `${title} (${startYear} - ${endYear}${region ? `, ${region}` : ''})`;

  // Phase 1: Primer
  const primerPrompt = `You are preparing background knowledge for a historical writing project about ${topicLabel}.

${context ? `Additional context: ${context}\n\n` : ''}Compose a neutral, informative primer of 150-200 words. Blend essential chronology, key themes, and tone guidance for an educational but engaging timeline. Do not include headings or bullet points.`;

  const primerResponse = await openai.responses.create({
    model: TIMELINE_MODEL,
    reasoning: { effort: 'low' },
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: primerPrompt,
          },
        ],
      },
    ],
  });

  const initialUnderstanding = extractResponseText(primerResponse);

  // Phase 2: Research digest
  const researchPrompt = `Perform comprehensive research on "${topicLabel}".
- Identify authoritative background on origins, turning points, sociopolitical dynamics, cultural or technological developments, and legacy.
- Use reputable primary or secondary sources (museums, academic presses, major news organizations).
- Summarize findings in clear paragraphs or bullet clusters with bracketed citations.
- Provide full source URLs so they can be referenced later.`;

  const researchResponse = await openai.responses.create({
    model: TIMELINE_MODEL,
    reasoning: { effort: 'low' },
    tools: [{ type: 'web_search_preview_2025_03_11' }],
    include: ['web_search_call.action.sources'] as any,
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: researchPrompt,
          },
        ],
      },
    ],
  });

  const researchDigest = extractResponseText(researchResponse);
  const researchSources = extractUrlAnnotations(researchResponse);

  // Phase 3: Main content generation
  const schema = `{
  "summary": "",
  "mainContent": "",
  "keyFacts": [],
  "contextSections": [],
  "citations": []
}`;

  const contentPrompt = `Using the initial understanding and research digest, create a structured JSON object following the schema below.

TOPIC: ${topicLabel}

INITIAL UNDERSTANDING:
${initialUnderstanding}

RESEARCH DIGEST:
${researchDigest}

SCHEMA:
${schema}

REQUIREMENTS:
- Output valid JSON only.
- Include bracketed numeric references [1], [2], ... inside the prose wherever facts appear.
- Every factual statement must map to a citation number listed in the citations array.
- Use concise, SEO-aware language without keyword stuffing.
- Organize mainContent into scannable paragraphs.
- Provide at least three contextSections with descriptive headings.`;

  const contentResponse = await openai.responses.create({
    model: TIMELINE_MODEL,
    reasoning: { effort: 'medium' },
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: contentPrompt,
          },
        ],
      },
    ],
  });

  const contentText = extractResponseText(contentResponse) || '{}';
  const parsed = safeJsonParse(contentText, {
    summary: '',
    mainContent: '',
    keyFacts: [],
    contextSections: [],
    citations: [],
  });

  const structured = normalizeStructuredContent(parsed);

  const sanitizedCitations: TimelineCitationEntry[] = structured.citations
    .map((citation, index) => {
      const url = citation.url?.trim();
      const label = citation.source?.trim() || citation.title?.trim() || '';

      if (!url || !label) {
        return null;
      }

      return {
        number: typeof citation.number === 'number' ? citation.number : index + 1,
        source: label,
        url,
      } satisfies TimelineCitationEntry;
    })
    .filter(Boolean) as TimelineCitationEntry[];

  const interpretation = buildInterpretationFromSections(structured.contextSections);

  // Phase 4: SEO metadata
  const seoSchema = `{
  "seoTitle": "",
  "metaDescription": "",
  "relatedKeywords": []
}`;

  const keyFactsSummary = structured.keyFacts
    .map(fact => `- ${fact.title}: ${fact.detail}`)
    .join('\n');

  const seoPrompt = `Generate SEO metadata for the timeline detailed below.

TOPIC: ${topicLabel}

SUMMARY:
${structured.summary}

KEY FACTS:
${keyFactsSummary}

REQUIREMENTS:
- Output valid JSON only.
- SEO title must be 60 characters or fewer and place the primary keyword early.
- Meta description must be between 140 and 155 characters, summarizing the timeline's value.
- Include 3-6 natural, semantically related keywords.

SCHEMA:
${seoSchema}`;

  const seoResponse = await openai.responses.create({
    model: TIMELINE_MODEL,
    reasoning: { effort: 'low' },
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: seoPrompt,
          },
        ],
      },
    ],
  });

  const seoText = extractResponseText(seoResponse) || '{}';
  const seoParsed = safeJsonParse(seoText, {
    seoTitle: '',
    metaDescription: '',
    relatedKeywords: [] as string[],
  });

  const seo: TimelineSEOMetadata = {
    seoTitle: enforceSeoLimits(
      typeof seoParsed?.seoTitle === 'string' ? seoParsed.seoTitle.trim() : '',
      60,
    ),
    metaDescription: enforceSeoLimits(
      typeof seoParsed?.metaDescription === 'string' ? seoParsed.metaDescription.trim() : '',
      155,
    ),
    relatedKeywords: Array.isArray(seoParsed?.relatedKeywords)
      ? Array.from(
          new Set(
            seoParsed.relatedKeywords
              .filter((keyword: unknown): keyword is string => typeof keyword === 'string')
              .map(keyword => keyword.trim())
              .filter(Boolean),
          ),
        )
      : [],
  };

  const citationSources: TimelineSourceLink[] = sanitizedCitations.map(citation => ({
    url: citation.url,
    source: citation.source,
  }));

  const uniqueSources = dedupeSourceLinks([citationSources, researchSources]);
  const primarySources = uniqueSources.slice(0, 3);

  return {
    summary: structured.summary,
    interpretation,
    citations: sanitizedCitations,
    structured,
    seo,
    research: {
      initialUnderstanding: initialUnderstanding.trim(),
      researchDigest: researchDigest.trim(),
      uniqueSources,
      primarySources,
      totalSources: uniqueSources.length,
    },
  };
}

/**
 * Generate event content using GPT
 */
export async function generateEventContent(params: {
  title: string;
  year: number;
  timelineContext: string;
  existingEvents?: Array<{ title: string; year: number }>;
}): Promise<{
  summary: string;
  description: string;
  significance: string;
  tags: string[];
  type: string;
  importance: number;
}> {
  const { title, year, timelineContext, existingEvents } = params;

  const existingEventsText = existingEvents
    ? `\nOther events in this timeline: ${existingEvents.map(e => `${e.title} (${e.year})`).join(', ')}`
    : '';

  const prompt = `Generate detailed content for the historical event: "${title}" (${year})

Timeline context: ${timelineContext}${existingEventsText}

Provide:

1. SUMMARY (1-2 sentences, 100-150 words): Brief overview of what happened

2. DESCRIPTION (3-5 paragraphs, 400-600 words):
   - Causes: What led to this event
   - Event: What actually happened
   - Consequences: Immediate results and impact

3. SIGNIFICANCE (2-3 paragraphs, 200-300 words): Why this event matters historically

4. METADATA:
   - Type: (e.g., Battle, Treaty, Coronation, Discovery, Revolution, Conquest, etc.)
   - Importance: 1 (notable), 2 (significant), or 3 (major turning point)
   - Tags: 3-5 relevant keywords

Format as JSON with keys: summary, description, significance, type, importance, tags`;

  const response = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      {
        role: 'system',
        content: 'You are an expert historian who writes detailed, accurate content about historical events. Always provide JSON output when requested.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: MAX_TOKENS,
    temperature: 0.7,
  });

  const content = response.choices[0].message.content || '';
  
  try {
    // Try to parse as JSON
    const parsed = JSON.parse(content);
    return {
      summary: parsed.summary || '',
      description: parsed.description || '',
      significance: parsed.significance || '',
      tags: parsed.tags || [],
      type: parsed.type || 'Event',
      importance: parsed.importance || 2,
    };
  } catch {
    // Fallback: extract manually
    return {
      summary: content.slice(0, 200),
      description: content,
      significance: '',
      tags: [],
      type: 'Event',
      importance: 2,
    };
  }
}

/**
 * Generate person biography using GPT
 */
export async function generatePersonBio(params: {
  name: string;
  timelineContext: string;
  relatedEvents?: Array<{ title: string; year: number }>;
  birthYear?: number;
  deathYear?: number;
}): Promise<{
  bioShort: string;
  bioLong: string;
  role: string;
}> {
  const { name, timelineContext, relatedEvents, birthYear, deathYear } = params;

  const lifeDates = birthYear && deathYear 
    ? `(${birthYear} - ${deathYear})`
    : birthYear 
    ? `(b. ${birthYear})`
    : '';

  const eventsText = relatedEvents
    ? `\nRelated events: ${relatedEvents.map(e => `${e.title} (${e.year})`).join(', ')}`
    : '';

  const prompt = `Generate a biography for: ${name} ${lifeDates}

Timeline context: ${timelineContext}${eventsText}

Provide:

1. SHORT BIO (1-2 sentences, 80-150 words): Concise description of who they were and their main role

2. LONG BIO (3-5 paragraphs, 400-600 words):
   - Early life and background
   - Major accomplishments and role in historical events
   - Legacy and historical significance

3. ROLE: Brief descriptor of their primary role (e.g., "Emperor", "Military Commander", "Religious Leader", "Explorer")

Write in an engaging, biographical style.`;

  const response = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      {
        role: 'system',
        content: 'You are an expert biographer who writes engaging, accurate content about historical figures.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: MAX_TOKENS,
    temperature: 0.7,
  });

  const content = response.choices[0].message.content || '';
  
  // Parse sections
  const shortMatch = content.match(/SHORT BIO[:\s]*([\s\S]*?)(?=LONG BIO|$)/i);
  const longMatch = content.match(/LONG BIO[:\s]*([\s\S]*?)(?=ROLE|$)/i);
  const roleMatch = content.match(/ROLE[:\s]*(.+?)$/im);

  return {
    bioShort: shortMatch ? shortMatch[1].trim() : content.slice(0, 200),
    bioLong: longMatch ? longMatch[1].trim() : content,
    role: roleMatch ? roleMatch[1].trim() : 'Historical Figure',
  };
}

/**
 * Generate event list outline using GPT
 */
export async function generateEventOutline(params: {
  timelineTitle: string;
  startYear: number;
  endYear: number;
  region?: string;
  eventCount?: number;
}): Promise<Array<{
  title: string;
  year: number;
  importance: number;
}>> {
  const { timelineTitle, startYear, endYear, region, eventCount = 20 } = params;

  const prompt = `Generate a list of ${eventCount} key historical events for: "${timelineTitle}" (${startYear} - ${endYear}${region ? `, ${region}` : ''})

For each event, provide:
- Title: Clear, descriptive name
- Year: When it occurred
- Importance: 1 (notable), 2 (significant), or 3 (major turning point)

Focus on the most significant events that shaped this period. Include a mix of:
- Political events (battles, treaties, coronations)
- Cultural milestones
- Economic changes
- Social transformations

Return as JSON array with format: [{"title": "Event Name", "year": 1234, "importance": 2}, ...]`;

  const response = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      {
        role: 'system',
        content: 'You are a historian creating event timelines. Always return valid JSON arrays.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 2000,
    temperature: 0.7,
  });

  const content = response.choices[0].message.content || '';
  
  try {
    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Error parsing event outline:', error);
  }

  return [];
}

/**
 * Generate person list outline using GPT
 */
export async function generatePeopleOutline(params: {
  timelineTitle: string;
  startYear: number;
  endYear: number;
  events: Array<{ title: string; year: number }>;
  personCount?: number;
}): Promise<Array<{
  name: string;
  birthYear?: number;
  deathYear?: number;
  role: string;
}>> {
  const { timelineTitle, startYear, endYear, events, personCount = 10 } = params;

  const eventsText = events.slice(0, 10).map(e => `${e.title} (${e.year})`).join(', ');

  const prompt = `Generate a list of ${personCount} key historical figures for: "${timelineTitle}" (${startYear} - ${endYear})

Key events in this timeline: ${eventsText}

For each person, provide:
- Name: Full name
- Birth Year: Integer year if known (use negative numbers for BCE). If the year is unknown, use null. Never use text like "Unknown", "circa", or "c.".
- Death Year: Integer year if known (use negative numbers for BCE). If the year is unknown, use null. Never use text like "Unknown", "circa", or "c.".
- Role: Brief descriptor (e.g., "Emperor", "General", "Religious Leader")

Include the most influential figures who shaped this period.

Return as JSON array with format: [{"name": "Person Name", "birthYear": 1234, "deathYear": 1290, "role": "Emperor"}, ...]`;

  const response = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      {
        role: 'system',
        content: 'You are a historian identifying key historical figures. Always return valid JSON arrays.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 2000,
    temperature: 0.7,
  });

  const content = response.choices[0].message.content || '';
  
  try {
    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Error parsing people outline:', error);
  }

  return [];
}
