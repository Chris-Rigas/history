import OpenAI from 'openai';
import type {
  Response as OpenAIResponse,
  ResponseOutputMessage,
  ResponseOutputText,
} from 'openai/resources/responses/responses';
import { safeJsonParse } from './utils';
import {
  normalizeStructuredContent,
  type TimelineCitationRaw,
  type TimelineStructuredContent,
  type TimelineStructuredSection,
} from './timelines/structuredContent';

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
  "centralQuestion": "",
  "storyCharacter": "",
  "overview": "",
  "keyFacts": [
    { "title": "", "detail": "" }
  ],
  "themes": [
    { "id": "", "title": "", "description": "" }
  ],
  "eventNotes": [
    {
      "title": "",
      "categoryId": "",
      "summary": "",
      "soWhat": "",
      "relationships": [
        { "type": "led_to", "targetTitle": "", "detail": "" }
      ],
      "humanDetail": ""
    }
  ],
  "narrativeConnectors": [
    { "afterEventTitle": "", "text": "" }
  ],
  "turningPoints": [
    { "title": "", "description": "", "whyItMatters": "" }
  ],
  "perspectives": {
    "evidence": { "available": [], "gaps": [] },
    "interpretations": { "debates": [], "contested": [] },
    "context": { "contemporary": "", "hindsight": "" }
  },
  "themeInsights": [
    { "title": "", "insight": "" }
  ],
  "contextSections": [
    { "heading": "", "content": "" }
  ],
  "citations": []
}`;

  const contentPrompt = `You are a narrative historian in the tradition of Barbara Tuchman and Erik Larson. Using the initial understanding and research digest, create a structured JSON object that tells a COMPELLING STORY while maintaining historical rigor.

Your mission: Transform historical facts into a narrative that pulls readers through time. Every element should reveal character, causation, or consequence. Avoid academic dryness—write as if describing events to someone who wants to understand not just WHAT happened, but WHY it mattered and HOW it felt to live through it.

Using that sensibility, create a structured JSON object following the schema below.

TOPIC: ${topicLabel}

INITIAL UNDERSTANDING:
${initialUnderstanding}

RESEARCH DIGEST:
${researchDigest}

SCHEMA:
${schema}

REQUIREMENTS:
- Output valid JSON only.

CRITICAL - OVERVIEW FIELD (3-4 rich paragraphs, 400-500 words total):
This is the STORY of the period. Structure it dramatically:

Paragraph 1 - THE SETUP (100-120 words):
- What was the situation before this period began?
- What crisis, question, or possibility did people face?
- Use concrete, vivid details that ground the reader in time and place
- Make them feel the instability, danger, or opportunity
- Example opening: "The Year of the Four Emperors shattered any illusion that imperial succession followed orderly rules..."

Paragraph 2 - THE STAKES (100-120 words):
- What was being tested, negotiated, or fought over?
- What could have gone wrong? What was at risk?
- Frame this as dramatic questions the reader wants answered
- What did contemporaries think was happening?
- Example: "Could a military upstart establish a stable dynasty? Could Rome's shattered finances be repaired?"

Paragraph 3 - THE STORY (120-150 words):
- How did it unfold? Who were the key personalities?
- What unexpected things happened?
- How did the situation evolve and change?
- Include specific human details—quotes, personality traits, dramatic moments, decisions
- Use active, vivid language: not "reforms were implemented" but "Vespasian slashed spending and..."
- Example: "Vespasian's answer was pragmatic and theatrical. He stabilized finances through fiscal discipline and the wealth of conquered Judaea..."

Paragraph 4 - THE RESOLUTION (80-100 words):
- How did it end? What changed as a result?
- What legacy or patterns were established?
- What became clear only in retrospect?
- Connect to larger historical patterns
- Example: "The Flavian dynasty restored stability but couldn't solve succession's central problem..."

Write in a style that is historically RIGOROUS but dramatically COMPELLING. Every sentence should advance the narrative or reveal character. Use specific details, active voice, and vivid verbs. Make the reader want to know what happens next.

- Identify the period's central tension and story character in 1-2 sentences each.

- Create 4-6 thematic categories (NOT generic "Major/Significant/Notable"). Categories must:
  * Represent the actual FORCES, DYNAMICS, or TENSIONS of this specific period
  * Be specific enough to reveal what the period is about
  * Be broad enough that multiple events fit each category
  * Examples: "Power Consolidation", "Succession Crises", "Public Works & Legitimacy", "Military Expansion", "Court Politics"
  * BAD examples: "Important Events", "Political Developments", "Major Changes"

- Every event note must include:
  * summary (2-3 sentences of what happened)
  * soWhat (1 sentence: what it led to, established, or revealed—NOT "this was important" but WHAT THE CONSEQUENCE WAS)
  * relationships with specific targets (led_to, response_to, parallel, foreshadows)
  * humanDetail (a quote, personal observation, or specific detail that makes it tangible—not required for every event, but sprinkle throughout)

- Narrative connectors (every 3-5 events): Brief transitional text explaining how events relate:
  * "During this period, X was responding to Y's earlier reforms..."
  * "These victories set the stage for..."
  * "At the same time, parallel developments in..."

- Turning points (2-4 pivotal moments): These are NOT event summaries. A turning point is a moment when:
  * The trajectory fundamentally shifted
  * Things could have gone differently
  * A pattern or precedent was established
  * Multiple threads converged
  
  For each turning point, explain:
  * What was DECIDED or became INEVITABLE at this moment?
  * What possibilities were FORECLOSED?
  * What could have happened if things went differently?
  * What PATTERN or PRECEDENT was established for the future?
  
  Example of GOOD turning point: "Vespasian's rise to power answered Rome's most dangerous question: succession would be decided by military force, not law. This established three precedents: (1) provincial armies could make emperors, (2) military competence trumped aristocratic birth, (3) emperors must buy loyalty with monuments. Every future succession crisis would replay this pattern."
  
  Example of BAD turning point: "Vespasian became emperor in 69 CE, ending the Year of the Four Emperors and founding the Flavian dynasty."

- Perspectives must cover:
  * evidence (available primary sources + gaps/limitations)
  * interpretations (what historians debate + what's contested/uncertain)
  * context (what people living through it noticed vs. what only became clear later)

- Include bracketed numeric references [1], [2] wherever facts need support and list them in citations array with source name and URL.`;

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
    centralQuestion: '',
    storyCharacter: '',
    overview: '',
    keyFacts: [],
    themes: [],
    eventNotes: [],
    narrativeConnectors: [],
    turningPoints: [],
    perspectives: {
      evidence: { available: [], gaps: [] },
      interpretations: { debates: [], contested: [] },
      context: { contemporary: '', hindsight: '' },
    },
    themeInsights: [],
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
function tryParseJson(jsonString: string | null | undefined): any | null {
  if (!jsonString) {
    return null;
  }

  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
}

function parseEventContentJson(rawContent: string): any | null {
  const trimmed = rawContent.trim();
  if (!trimmed) {
    return null;
  }

  const direct = tryParseJson(trimmed);
  if (direct) {
    return direct;
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch) {
    const parsed = tryParseJson(fencedMatch[1]);
    if (parsed) {
      return parsed;
    }
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const parsed = tryParseJson(trimmed.slice(firstBrace, lastBrace + 1));
    if (parsed) {
      return parsed;
    }
  }

  return null;
}

function normalizeEventTags(tags: unknown): string[] {
  if (Array.isArray(tags)) {
    return tags
      .map(tag => (typeof tag === 'string' ? tag.trim() : String(tag)))
      .filter(Boolean);
  }

  if (typeof tags === 'string') {
    return tags
      .split(/[,;\n]+/)
      .map(tag => tag.trim())
      .filter(Boolean);
  }

  return [];
}

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

  const prompt = `You are a narrative historian writing about: "${title}" (${year})

Timeline context: ${timelineContext}${existingEventsText}

Write historically accurate content that is also dramatically compelling. Think Erik Larson—use specific details that make history feel lived.

Provide:

1. SUMMARY (2-3 sentences, 100-150 words):
   - What happened in concrete, specific terms
   - Include WHO did WHAT and WHERE
   - Use active voice and vivid verbs

2. DESCRIPTION (3-5 paragraphs, 500-700 words):
   Write this as a STORY with three movements:
   
   **Causes (1-2 paragraphs):** What led to this event?
   - Set the scene: what was the situation before?
   - What tensions or forces were building?
   - Include specific details: what did people think was happening?
   - Use concrete language: "Tensions had been building since..." not "The situation deteriorated..."
   
   **Event (2-3 paragraphs):** What actually happened?
   - Chronological narrative of the event itself
   - Include human details: what did participants see, feel, decide?
   - Use specific observations from primary sources where possible
   - Make it visual and tangible
   - If there are quotes from participants, include them
   
   **Consequences (1 paragraph):** What resulted immediately?
   - Direct, immediate results
   - How did this change the situation?
   - What became possible or impossible after this?

3. SIGNIFICANCE (2-3 paragraphs, 250-350 words):
   Why does this matter to the larger story?
   - How did this shape what came after?
   - What patterns or precedents did it establish?
   - How do historians view this event?
   - What became clear only in retrospect?
   - Connect to broader historical forces

4. METADATA:
   - Type: Use ONLY these broad categories when they fit:
     * Military (battles, campaigns, conquests)
     * Political (laws, reforms, power transfers)
     * Diplomatic (treaties, alliances, negotiations)
     * Cultural (artistic, religious, intellectual developments)
     * Crisis (disasters, revolts, famines, plagues)
     * Ceremonial (coronations, celebrations, inaugurations)
     * Infrastructure (buildings, roads, public works)
     If none fit perfectly, choose the closest or use "Historical Event"
   
   - Importance:
     * 1 = Notable (contextual/supportive event)
     * 2 = Significant (clear impact on period)
     * 3 = Major turning point (changed trajectory fundamentally)
   
   - Tags: 2-3 specific, relevant keywords (people, places, concepts)
     * Be specific: "Vespasian", "Jerusalem", "Colosseum" not generic terms
     * These are secondary to Type—keep them minimal

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
  
  const parsed = parseEventContentJson(content);

  if (parsed) {
    const importance = Number(parsed.importance);
    return {
      summary: typeof parsed.summary === 'string' ? parsed.summary.trim() : '',
      description: typeof parsed.description === 'string' ? parsed.description.trim() : '',
      significance: typeof parsed.significance === 'string' ? parsed.significance.trim() : '',
      tags: normalizeEventTags(parsed.tags),
      type: typeof parsed.type === 'string' && parsed.type.trim() ? parsed.type.trim() : 'Event',
      importance: Number.isFinite(importance) ? importance : 2,
    };
  }

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
