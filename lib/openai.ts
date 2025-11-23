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
const CHAT_MODEL = 'gpt-5';
const TIMELINE_MODEL = 'gpt-5';
const MAX_TOKENS = 8000;

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

/**
 * Generate storyform recap narrative using GPT
 */
export async function generateStoryformRecap(params: {
  title: string;
  startYear: number;
  endYear: number;
  events: Array<{
    title: string;
    slug: string;
    start_year: number;
    summary?: string | null;
    tags: string[];
  }>;
}): Promise<{
  paragraphs: Array<{
    text: string;
    eventLinks: Array<{
      eventSlug: string;
      textToLink: string;
    }>;
  }>;
}> {
  const { title, startYear, endYear, events } = params;

  const sortedEvents = [...events].sort((a, b) => a.start_year - b.start_year);

  const eventsText = sortedEvents
    .map(e => `
EVENT: ${e.title} (${e.start_year})
SUMMARY: ${e.summary || 'No summary'}
TAGS: ${e.tags.join(', ')}`)
    .join('\n');

  const prompt = `You are a narrative historian in the tradition of Barbara Tuchman and Erik Larson, creating a compelling "Storyform Recap" for: "${title}" (${startYear} - ${endYear})

This recap will appear on the timeline page AFTER users have seen the detailed event timeline. Your goal is to synthesize the full sweep of this era into a dramatic, cohesive narrative that pulls readers through the story arc.

═══════════════════════════════════════════════════════════
EVENTS PROVIDED (chronological order):
═══════════════════════════════════════════════════════════
${eventsText}

═══════════════════════════════════════════════════════════
YOUR MISSION
═══════════════════════════════════════════════════════════
Write a 5-7 paragraph narrative recap (approximately 400-600 words total) that:

1. **BUILDS DRAMATIC ARC**: Don't just list events—show causation, tension, and consequences. Answer "why did THIS lead to THAT?"

2. **USES VIVID, SPECIFIC LANGUAGE**: 
   - Replace generic phrases ("significant event", "major development") with concrete details
   - Include years, names, places, and numbers from the events
   - Show don't tell: instead of "tensions rose", describe what actually happened

3. **CREATES FORWARD MOMENTUM**: 
   - Each paragraph should pull the reader into the next
   - Use temporal connectors that show causation: "This triggered...", "In response...", "Years later, the consequences became clear when..."
   - End paragraphs with hooks that create suspense

4. **MAINTAINS HISTORICAL ACCURACY**:
   - Only reference events provided in the input
   - Don't invent details not present in the event summaries
   - If an event summary is thin, work with what you have

5. **INTEGRATES EVENTS NATURALLY**:
   - Mention events by name, but work them into flowing sentences
   - Don't force every event into the narrative—focus on the most pivotal ones
   - Use thematic grouping when multiple events relate to the same development

6. **PARAGRAPH GUIDANCE**:
   - Paragraph 1: Hook opening that establishes the era's defining tension or question
   - Paragraphs 2-5: Major developments, turning points, and dramatic escalations
   - Paragraph 6-7: Resolution, consequences, and legacy (if applicable)

═══════════════════════════════════════════════════════════
BANNED PHRASES (avoid these at all costs)
═══════════════════════════════════════════════════════════
- "marked a turning point"
- "proved to be significant" 
- "would have lasting consequences"
- "testament to"
- "encapsulated"
- "paved the way"
- "set the stage"

Instead: SHOW the change happening. Use active verbs and concrete details.

═══════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON)
═══════════════════════════════════════════════════════════
Return a JSON object with this structure:

{
  "paragraphs": [
    {
      "text": "Paragraph text here...",
      "eventLinks": [
        {
          "eventSlug": "slug-of-event",
          "textToLink": "exact phrase from paragraph that should link to this event"
        }
      ]
    }
  ]
}

**CRITICAL LINKING RULES**:
- Only link mentions that use the EXACT event title or a clear shortened version
- Each event should be linked at most ONCE in the entire narrative (first meaningful mention)
- eventSlug must match the slug field from the events provided
- textToLink must be an EXACT substring from the paragraph text
- If you mention an event but don't want to link it (e.g., passing reference), omit it from eventLinks

**EXAMPLE**:
If your paragraph says: "The Construction of the Aqua Virgo brought fresh water to Rome's growing population."
And the event title is "Construction of the Aqua Virgo"
Then eventLinks would include:
{
  "eventSlug": "construction-of-the-aqua-virgo",
  "textToLink": "Construction of the Aqua Virgo"
}

Remember: You're not writing an encyclopedia. You're showing readers the dramatic story of how this era unfolded—the tensions, the decisions, the consequences. Make it sing.`;

  const response = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      {
        role: 'system',
        content:
          'You are a narrative historian who creates compelling, accurate historical narratives. Always return valid JSON.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_completion_tokens: 2000,
    temperature: 1,
  });

  const content = response.choices[0].message.content || '';

  try {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/i) || [null, content];
    const jsonText = jsonMatch[1] || content;
    const parsed = JSON.parse(jsonText.trim());

    if (!parsed.paragraphs || !Array.isArray(parsed.paragraphs)) {
      throw new Error('Invalid response structure');
    }

    return {
      paragraphs: parsed.paragraphs.map((p: any) => ({
        text: typeof p.text === 'string' ? p.text.trim() : '',
        eventLinks: Array.isArray(p.eventLinks)
          ? p.eventLinks.map((link: any) => ({
              eventSlug: typeof link.eventSlug === 'string' ? link.eventSlug.trim() : '',
              textToLink: typeof link.textToLink === 'string' ? link.textToLink.trim() : '',
            }))
          : [],
      })),
    };
  } catch (error) {
    console.error('Error parsing storyform recap:', error);
    return {
      paragraphs: [
        {
          text: content.slice(0, 500),
          eventLinks: [],
        },
      ],
    };
  }
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
  const researchPrompt = `Perform comprehensive research on "${topicLabel}" with strict sourcing.

PRIMARY SOURCES (hunt aggressively):
- Find direct quotes from relevant primary sources (e.g., Frontinus/Pliny/Vitruvius for Roman infrastructure; chronicles, letters, inscriptions, newspapers, diaries for other eras).
- For EACH quote: include exact text, who said it, when/why they said it, and a citation number with full URL.

CONCRETE DATA (no vagueness):
- Capture exact numbers (casualties, costs, dimensions, workforce, duration), names, dates, times, and places.
- Translate numbers into modern equivalents where helpful.

HUMAN DETAILS:
- Document reactions, controversies, unexpected problems, physical experience (sounds, colors, smells), and named individuals involved.

OUTPUT FORMAT:
- For every finding, provide: specific fact or quote + source name + URL + citation number.
- Summarize in tight paragraphs or bullet clusters with bracketed citations.
- Prioritize vivid, specific, humanizing details over general overviews.`;

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
    { "id": "", "title": "", "description": "", "focus": "" }
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

TOPIC: ${topicLabel}

INITIAL UNDERSTANDING:
${initialUnderstanding}

RESEARCH DIGEST:
${researchDigest}

SCHEMA:
${schema}

REQUIREMENTS:
- Output valid JSON only
- Every element should advance the STORY
- Think in terms of: setup → rising tension → climax → resolution

═══════════════════════════════════════════════════════════
CRITICAL FIELDS - THE NARRATIVE FOUNDATION
═══════════════════════════════════════════════════════════

1. SUMMARY (2-3 sentences, 100-150 words):
   The "logline" of this historical period. What's the ONE-SENTENCE story?
   Example: "Augustus transformed Rome from a blood-soaked republic into history's first superpower—then discovered his greatest challenge wasn't conquest but succession."

2. CENTRAL QUESTION (1 sentence, 15-30 words):
   The dramatic tension that drives this period. Frame as a question that creates stakes.
   ❌ BAD: "This period saw the transition from republic to empire"
   ✅ GOOD: "Could one man hold absolute power while maintaining the fiction of republican government?"
   ✅ GOOD: "When divine right meets dynastic chaos, who decides the next emperor?"
   
   The question should be something contemporaries worried about, with unclear outcome.

3. STORY CHARACTER (5-10 words):
   What TYPE of story is this? Use evocative language.
   Examples: "A dynasty's rise and tragic fall", "Empire building its own trap", "Succession crisis in slow motion"

4. OVERVIEW (3-4 rich paragraphs, 400-500 words total):
   This is the STORY of the period, structured dramatically:

   Paragraph 1 - THE SETUP (100-120 words):
   - What was the world before this period? Paint the scene.
   - What tensions or forces were building?
   - Make it feel like something HAD to happen
   - Example opening: "By 27 BCE, Rome was exhausted. A century of civil wars had..."

   Paragraph 2 - RISING ACTION (120-150 words):
   - How did the main forces/figures try to solve the setup's problems?
   - What new complications arose?
   - Show the building momentum
   - Include specific turning points with dates
   
   Paragraph 3 - CLIMAX & TRANSFORMATION (100-120 words):
   - What was the decisive moment or period?
   - How did everything change?
   - Make the reader feel the weight of the shift
   
   Paragraph 4 - RESOLUTION & CONSEQUENCES (80-110 words):
   - How did this period end?
   - What was fundamentally different after?
   - Bridge to what came next
   - Include the legacy/pattern that outlasted the period

═══════════════════════════════════════════════════════════
5. THEMES ARRAY - THE NARRATIVE CATEGORIZATION
═══════════════════════════════════════════════════════════

Create 4-6 thematic categories that reveal the FORCES at play in this period.

CRITICAL: These are NOT generic categories like "Major/Significant/Notable"
CRITICAL: These should reveal the STORY's structure and conflicts

For each theme:
- **id**: kebab-case identifier (e.g., "power-consolidation")
- **title**: Active, evocative name (3-6 words)
- **description**: What this force/pattern means (2-3 sentences)
- **focus**: Why this matters to the overall story (1-2 sentences)

Examples for Julio-Claudian dynasty:
{
  "id": "power-consolidation",
  "title": "Building the Imperial Machine",
  "description": "Augustus and his successors transformed personal authority into institutional power through legal reforms, military loyalty, and public works. Each emperor added another layer to the system.",
  "focus": "This theme tracks how autocracy disguised itself as restored republic, creating precedents that would define emperorship for centuries."
}

{
  "id": "succession-crisis",
  "title": "The Dynasty's Fatal Flaw",
  "description": "With no clear rules for imperial succession, each transition became a potential civil war. Adoption, murder, and mob politics determined who ruled Rome.",
  "focus": "The lack of succession mechanism created constant instability and would ultimately destroy this dynasty."
}

{
  "id": "legitimacy-performance",
  "title": "Performing Power",
  "description": "Emperors used gladiatorial games, public building projects, and military victories to demonstrate their right to rule. Politics became theater.",
  "focus": "This reveals how power in Rome required constant public validation—bread and circuses weren't luxuries but necessities."
}

Think about: What FORCES were in conflict? What PATTERNS emerged? What CONTRADICTIONS existed?

═══════════════════════════════════════════════════════════
6. EVENT NOTES - NARRATIVE ENRICHMENT FOR EACH EVENT
═══════════════════════════════════════════════════════════

For each major event in the timeline, provide:

- **title**: Exact event title (must match an actual event)
- **categoryId**: Which theme does this event belong to? (use theme 'id')
- **summary**: One-sentence "what happened" (20-40 words)
- **soWhat**: Why this matters to the larger story—the CONSEQUENCES or SIGNIFICANCE (40-80 words)
  * NOT just "this was important" 
  * Explain WHAT CHANGED or what became possible/impossible
  * Connect to the central question or story arc
  * Put the "so what" front and center—make causation explicit
  
- **relationships**: Array of connections to other events
  * Type: "led_to", "response_to", "parallel", "foreshadows"
  * Target event title
  * Detail: How/why they're connected (1-2 sentences)
  * Emphasize causation—show how one event made the next inevitable or more likely
  
- **humanDetail**: A specific, tangible detail that makes this feel REAL (1-2 sentences)
  * What did someone see, feel, say, or do?
  * A quote, a gesture, a weather detail, a price, a specific location
  * Example: "Tiberius reportedly said he was 'holding a wolf by the ears'—ruling Rome meant grasping something that could devour you if you let go."

Example:
{
  "title": "Augustus' Consolidation of Power",
  "categoryId": "power-consolidation",
  "summary": "Augustus transformed his position from military strongman to constitutional monarch through the settlements of 27-23 BCE.",
  "soWhat": "This established the template for all future emperors: concentrate real power while preserving republican appearances. The Senate kept its prestige, Augustus kept control—a compromise that would define Roman governance for 300 years.",
  "relationships": [
    {
      "type": "led_to",
      "targetTitle": "Introduction of the Praetorian Guard",
      "detail": "Absolute power required absolute protection—Augustus created a new military unit loyal only to him, not the state."
    }
  ],
  "humanDetail": "When the Senate offered Augustus the title of dictator, he theatrically refused it three times—the same number of times Caesar had refused the crown. Everyone understood the script."
}

═══════════════════════════════════════════════════════════
7. NARRATIVE CONNECTORS - THE STORY GLUE
═══════════════════════════════════════════════════════════

Create 5-10 transitional phrases that show causation between events:

{
  "afterEventTitle": "[Event name]",
  "text": "A 1-2 sentence connector showing how this led to what comes next"
}

Examples:
- "This power grab set a precedent that would haunt every succession..."
- "But consolidating power created a new problem: who would inherit it?"
- "Meanwhile, in the provinces, a different crisis was building..."
- "This seemingly minor reform would prove decisive when..."

═══════════════════════════════════════════════════════════
8. TURNING POINTS - THE GAME-CHANGERS
═══════════════════════════════════════════════════════════

Identify 3-5 events where everything changed. These are moments where:
- The outcome was genuinely uncertain
- Multiple futures were possible
- What happened fundamentally altered what came after

For each:
- **title**: The event name
- **description**: What happened and what was at stake (2-3 sentences)
- **whyItMatters**: The PATTERN or PRECEDENT this established (2-3 sentences)

❌ BAD: "Claudius invaded Britain in 43 CE, expanding the empire."

✅ GOOD: "Claudius' invasion of Britain proved that even 'weak' emperors needed military glory to survive. This established the precedent that every emperor must win a war—real or manufactured—to secure legitimacy. Future emperors would launch increasingly desperate campaigns just to maintain this tradition."

═══════════════════════════════════════════════════════════
9. KEY FACTS - THE VITAL STATISTICS
═══════════════════════════════════════════════════════════

4-8 quick facts that establish scope and context:
- Start/end dates
- Duration
- Primary location/region  
- Key figures count
- Major outcomes/changes
- Deaths/casualties if relevant
- Territory gained/lost
- Population affected

Make them SPECIFIC and TANGIBLE, not generic.

═══════════════════════════════════════════════════════════
REMAINING FIELDS (Keep existing instructions)
═══════════════════════════════════════════════════════════

- turningPoints (already covered above)
- perspectives (evidence, interpretations, context)
- themeInsights (analytical takeaways for each theme)
- contextSections (deeper dives on specific aspects)
- citations (bracketed numeric references with full URLs)

Include bracketed numeric references [1], [2] wherever facts need support and list them in citations array with source name and URL.`;

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
  existingEvents?: Array<{
    title: string;
    year: number;
    summary?: string;
    description?: string;
    significance?: string;
  }>;
}): Promise<{
  summary: string;
  description: string;
  significance: string;
  tags: string[];
  type: string;
  importance: number;
}> {
  const { title, year, timelineContext, existingEvents } = params;

  const existingEventsText = existingEvents?.length
    ? `\nNARRATIVE CONTEXT FROM PREVIOUS EVENTS (build continuity and answer their tensions):\n${existingEvents
        .map(e => {
          const summary = e.summary?.replace(/\n+/g, ' ') || 'No summary provided yet.';
          const significance = e.significance?.replace(/\n+/g, ' ') || 'Consequences not yet detailed.';
          const description = e.description?.replace(/\n+/g, ' ') || '';
          return `EVENT: ${e.title} (${e.year})\nSUMMARY: ${summary}\nDESCRIPTION: ${description}\nCONSEQUENCES: ${significance}`;
        })
        .join('\n\n')}`
    : '\nNo previous events generated—establish the opening tension for the timeline.';

  const prompt = `You are a narrative historian writing about: "${title}" (${year})

Timeline context: ${timelineContext}${existingEventsText}

Write historically accurate content that is also dramatically compelling. Channel Erik Larson and Barbara Tuchman: everything must be true, vivid, and sourced. Every sentence should answer "what did this FEEL like to live through?" while grounding dramatic claims in citations.

═══════════════════════════════════════════════════════════
NON-NEGOTIABLE GROUNDING & CONTINUITY
═══════════════════════════════════════════════════════════
- EVERY dramatic statement must be backed by a citation.
- Minimum 2-3 PRIMARY SOURCE quotes per event (Frontinus, Pliny, Vitruvius, inscriptions, letters, newspapers, etc.). Use format: "As [author] wrote in [work]: '[exact quote]'[citation]".
- Every claim about numbers/dates/actions must include the specific figure, source, and citation. Translate numbers into modern context when useful.
- BANNED VAGUE PHRASES: "symbol of", "testament to", "encapsulated", "insatiable thirst", "magnificent" without specifics, "many", "several", "significant/important" without explanation.
- REQUIRED sensory anchors each event: at least one COLOR, one SOUND, specific PLACES, and exact NUMBERS.
- If previous events exist, explicitly reference them, answer or complicate questions they raised, and end with a tension that propels the next event (“And THEN what happened?”).

Provide:

═══════════════════════════════════════════════════════════
1. SUMMARY (2-3 sentences, 100-150 words)
═══════════════════════════════════════════════════════════

The hook. Make someone care in three sentences.

- Lead with ACTION: WHO did WHAT and WHERE
- Use active voice and vivid verbs ("seized power" not "came to power")
- Include ONE concrete detail that makes it real
- End with a hint of significance

❌ BAD: "Augustus consolidated power in 27 BCE."
✅ GOOD: "In January 27 BCE, Augustus stood before the Roman Senate and theatrically offered to resign all his powers—knowing they would beg him to stay. They did, granting him unprecedented authority wrapped in republican titles. In one choreographed moment, he transformed from warlord to constitutional monarch."

═══════════════════════════════════════════════════════════
2. DESCRIPTION (4-6 paragraphs, 600-800 words)
═══════════════════════════════════════════════════════════

Tell this as a STORY with dramatic structure. Use chronological narrative within each section, but organize by causation:

**SECTION A: CAUSES (1-2 paragraphs, 150-250 words)**

Set the scene before this event. Answer:
- What was the situation before this happened?
- What pressures or tensions were building?
- What made this event inevitable (or likely)?
- What did people at the time think was happening?

Use CONCRETE language:
- ✅ "By 23 BCE, Augustus had survived three assassination plots"
- ❌ "There was growing instability"

Include specific dates, numbers, names. Make readers see the powder keg. Include at least one primary source quote here showing the perceived problem.

**SECTION B: THE EVENT ITSELF (2-3 paragraphs, 300-400 words)**

The chronological narrative of what actually happened.

CRITICAL: Make this VISUAL and SENSORY
- What time of day was it?
- What did people see, hear, smell?
- Who was there? What did they say or do?
- What were the specific actions taken?
- Were there pivotal moments or decisions?

Include direct quotes from primary sources where available (mark them clearly as quotes). Use the statistical + visceral combo at least once: state a number with a citation, then immediately follow with a sensory, concrete detail with a citation.

Use scene-setting: "In the Senate chamber on the Ides of January..."
Use specific details: "The vote was 400 to 7..."
Use human actions: "Augustus paused, then removed his signet ring..."

Make readers feel like they're THERE.

**SECTION C: IMMEDIATE CONSEQUENCES (1-2 paragraphs, 150-200 words)**

What changed in the hours, days, and weeks after? Cite specific sources documenting reactions.

- POLITICAL BACKLASH: Who opposed this immediately after and what actions did they take?
- UNEXPECTED PROBLEMS: What broke, failed, or went wrong in the first days/weeks?
- IMMEDIATE REACTIONS with QUOTES: What did contemporaries actually say?
- PHYSICAL CHANGES: What was different the next day or week? Include numbers.

Ban emotional generalities ("jubilation" or "relief") without a cited quote. Name individuals and give dates. Show at least one concrete change (prices, openings, casualties) with citations.

═══════════════════════════════════════════════════════════
3. SIGNIFICANCE (2-3 paragraphs, 300-400 words)
═══════════════════════════════════════════════════════════

Answer the "SO WHAT?"—with mechanisms, precedents, and sourced consequences. Avoid generic claims.

**Paragraph 1: IMMEDIATE IMPACT (100-150 words)**
- State the specific mechanism or pattern established and how it worked.
- Show exactly who could now do what because of this event.
- Include at least one cited fact or quote that proves the shift.

**Paragraph 2: LONGER-TERM CONSEQUENCES (100-150 words)**
- Name later events that depended on this one and trace the causal chain explicitly.
- Explain what would be different without this event (counterfactual clarity).
- Use numbers/names/dates with citations.

**Paragraph 3: HISTORICAL PERSPECTIVE (100-150 words)**
- Quote at least one modern historian for perspective (with attribution and citation).
- Note any scholarly debate and why historians still study this.
- Connect to broader patterns that persist today.

BANNED: "symbol of power," "testament to," "encapsulated," or any unsourced emotional claim. Use vivid, specific facts instead.

═══════════════════════════════════════════════════════════
4. TYPE & IMPORTANCE (for categorization)
═══════════════════════════════════════════════════════════

Based on the content above, assign:
- **type**: Brief category (e.g., "Political Reform", "Military Conquest", "Succession Crisis")
- **importance**: 1 (notable detail), 2 (significant event), 3 (major turning point)

Importance 3 should be reserved for events that fundamentally changed what came after or where the outcome was genuinely uncertain.

═══════════════════════════════════════════════════════════
RETURN FORMAT
═══════════════════════════════════════════════════════════

Return as JSON:
{
  "summary": "...",
  "description": "...",
  "significance": "...",
  "tags": ["category"],
  "type": "category name",
  "importance": 2
}

Remember: You're not writing an encyclopedia entry. You're telling the story of a moment that mattered. Make it sing.`
;

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
    max_completion_tokens: MAX_TOKENS,
    temperature: 1,
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
    max_completion_tokens: MAX_TOKENS,
    temperature: 1,
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
    max_completion_tokens: 2000,
    temperature: 1,
  });

  console.log('=== DEBUG: Full API Response ===');
  console.log(JSON.stringify(response, null, 2));
  console.log('=== DEBUG: Message Content ===');
  console.log(response.choices?.[0]?.message?.content);

  const content = response.choices[0].message.content || '';
  try {
    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Error parsing event outline:', error);
    console.error('Raw response content (truncated to 500 chars):', content.slice(0, 500));
  }

  console.error('Event outline generation returned no parsable results. Raw content (truncated to 500 chars):', content.slice(0, 500));
  throw new Error('No events were generated by the model');
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
    max_completion_tokens: 2000,
    temperature: 1,
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
    console.error('Raw response content (truncated to 500 chars):', content.slice(0, 500));
  }

  console.error('People outline generation returned no parsable results. Raw content (truncated to 500 chars):', content.slice(0, 500));
  throw new Error('No people were generated by the model');
}
