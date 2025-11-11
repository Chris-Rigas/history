import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Model configuration
const DEFAULT_MODEL = 'gpt-4-turbo-preview';
const MAX_TOKENS = 4000;

/**
 * Generate timeline content using GPT
 */
export async function generateTimelineContent(params: {
  title: string;
  startYear: number;
  endYear: number;
  region?: string;
  context?: string;
}): Promise<{
  summary: string;
  interpretation: string;
}> {
  const { title, startYear, endYear, region, context } = params;

  const prompt = `You are a historical content writer. Generate comprehensive content for a timeline about "${title}" (${startYear} - ${endYear}${region ? `, ${region}` : ''}).

${context ? `Context: ${context}\n` : ''}

Generate two sections:

1. SUMMARY (2-3 paragraphs, 150-250 words):
   - Overview of the timeline's scope
   - Major phases or periods
   - Key themes

2. INTERPRETATION (600-800 words, structured with subheadings):
   - Rise: How this civilization/period began
   - Peak: Its height and major accomplishments
   - Decline/Legacy: How it ended or evolved, and its lasting impact

Write in an engaging, educational style. Use clear, accessible language.`;

  const response = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      {
        role: 'system',
        content: 'You are an expert historical content writer who creates engaging, accurate, and well-structured content about historical periods and civilizations.',
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
  const summaryMatch = content.match(/SUMMARY[:\s]*([\s\S]*?)(?=INTERPRETATION|$)/i);
  const interpretationMatch = content.match(/INTERPRETATION[:\s]*([\s\S]*?)$/i);

  return {
    summary: summaryMatch ? summaryMatch[1].trim() : content.slice(0, 500),
    interpretation: interpretationMatch ? interpretationMatch[1].trim() : content,
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
    model: DEFAULT_MODEL,
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
    model: DEFAULT_MODEL,
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
    model: DEFAULT_MODEL,
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
- Birth Year: (if known)
- Death Year: (if known)
- Role: Brief descriptor (e.g., "Emperor", "General", "Religious Leader")

Include the most influential figures who shaped this period.

Return as JSON array with format: [{"name": "Person Name", "birthYear": 1234, "deathYear": 1290, "role": "Emperor"}, ...]`;

  const response = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
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
