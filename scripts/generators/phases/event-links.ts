import OpenAI from 'openai';
import { buildPhase4cEventLinksPrompt } from '@/lib/generation/prompts';
import type { StoryBeat, EventLink, ExpandedEvent } from '@/lib/generation/types';
import { safeJsonParse } from '@/lib/utils';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function callJsonCompletion(prompt: string): Promise<any> {
  console.log(`\n=== PHASE 4c: EVENT LINKS API CALL ===`);
  console.log(`Prompt length: ${prompt.length} characters`);

  const response = await openai.chat.completions.create({
    model: 'gpt-5',
    messages: [
      {
        role: 'system',
        content: 'You are an expert at identifying natural places to add hyperlinks in narrative text. Return valid JSON only.'
      },
      { role: 'user', content: prompt },
    ],
    max_completion_tokens: 4000,
    temperature: 1,
  });

  const content = response.choices[0].message?.content || '{}';
  console.log(`Response length: ${content.length} characters`);
  console.log(`Finish reason: ${response.choices[0].finish_reason}`);

  if (response.choices[0].finish_reason === 'length') {
    console.error('⚠️  WARNING: Response truncated due to max_tokens!');
  }

  const cleaned = content.replace(/```json|```/g, '').trim();
  const parsed = safeJsonParse(cleaned, {});
  
  console.log(`Beats with links:`, Array.isArray(parsed.beats) ? parsed.beats.length : 0);
  const totalLinks = Array.isArray(parsed.beats)
    ? parsed.beats.reduce((sum: number, beat: any) => 
        sum + (Array.isArray(beat.eventLinks) ? beat.eventLinks.length : 0), 0)
    : 0;
  console.log(`Total links to add:`, totalLinks);
  console.log('=== END PHASE 4c DEBUG ===\n');

  return parsed;
}

/**
 * Add event links to story beats using GPT-5
 * Now Phase 4c - runs after Phase 4 (events) so we have database slugs
 */
export async function addEventLinksToBeats(
  storyBeats: StoryBeat[],
  expandedEvents: ExpandedEvent[]
): Promise<StoryBeat[]> {
  // Build set of valid event slugs from database (with year suffixes)
  const validEventSlugs = new Set(expandedEvents.map(e => e.slug));
  
  console.log(`\n=== VALID EVENT SLUGS FROM DATABASE ===`);
  console.log(`Total expanded events: ${expandedEvents.length}`);
  console.log(`Sample slugs:`, Array.from(validEventSlugs).slice(0, 5));
  console.log('===================================\n');

  const prompt = buildPhase4cEventLinksPrompt(storyBeats, expandedEvents);
  const parsed = await callJsonCompletion(prompt);

  if (!parsed.beats || !Array.isArray(parsed.beats)) {
    console.warn('⚠️  No beats array returned from event links API call');
    return storyBeats;
  }

  const updatedBeats = JSON.parse(JSON.stringify(storyBeats));

  let validLinks = 0;
  let invalidLinks = 0;
  const invalidReasons: string[] = [];

  parsed.beats.forEach((beatWithLinks: any) => {
    const beatIndex = beatWithLinks.beatIndex;
    
    if (beatIndex < 0 || beatIndex >= updatedBeats.length) {
      console.warn(`⚠️  Invalid beatIndex ${beatIndex}`);
      return;
    }

    const eventLinks: EventLink[] = [];

    if (Array.isArray(beatWithLinks.eventLinks)) {
      beatWithLinks.eventLinks.forEach((link: any) => {
        const { textToLink, eventSlug, paragraphIndex } = link;
        
        if (!textToLink || !eventSlug) {
          invalidLinks++;
          invalidReasons.push(`Missing textToLink or eventSlug`);
          return;
        }

        const paragraph = updatedBeats[beatIndex].paragraphs[paragraphIndex];
        if (!paragraph) {
          invalidLinks++;
          invalidReasons.push(`Invalid paragraphIndex ${paragraphIndex} for beat ${beatIndex}`);
          return;
        }

        if (!paragraph.includes(textToLink)) {
          invalidLinks++;
          invalidReasons.push(`Text "${textToLink}" not found in paragraph`);
          console.warn(`⚠️  Text "${textToLink}" not found in beat ${beatIndex}, paragraph ${paragraphIndex}`);
          return;
        }

        // Validate event slug exists in database
        if (!validEventSlugs.has(eventSlug)) {
          invalidLinks++;
          invalidReasons.push(`Event slug "${eventSlug}" not in database`);
          console.warn(`⚠️  Event slug "${eventSlug}" not in database. Text was: "${textToLink}"`);
          return;
        }

        eventLinks.push({ textToLink, eventSlug });
        validLinks++;
      });
    }

    updatedBeats[beatIndex].eventLinks = eventLinks;
  });

  console.log(`\n=== EVENT LINKS VALIDATION ===`);
  console.log(`Valid links added: ${validLinks}`);
  console.log(`Invalid links rejected: ${invalidLinks}`);
  if (invalidReasons.length > 0) {
    console.log(`Sample rejection reasons:`, invalidReasons.slice(0, 5));
  }
  console.log(`=== END VALIDATION ===\n`);

  return updatedBeats;
}
