import OpenAI from 'openai';
import { buildPhase3bEventLinksPrompt } from '@/lib/generation/prompts';
import type { StoryBeat, TimelineSkeleton, EventLink } from '@/lib/generation/types';
import { safeJsonParse } from '@/lib/utils';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function callJsonCompletion(prompt: string): Promise<any> {
  console.log(`\n=== PHASE 3b: EVENT LINKS API CALL ===`);
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
    max_completion_tokens: 30000,
    temperature: 1, // GPT-5 only supports temperature: 1
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
  console.log('=== END PHASE 3b DEBUG ===\n');

  return parsed;
}

/**
 * Add event links to story beats using GPT-5
 */
export async function addEventLinksToBeats(
  storyBeats: StoryBeat[],
  skeleton: TimelineSkeleton
): Promise<StoryBeat[]> {
  const prompt = buildPhase3bEventLinksPrompt(storyBeats, skeleton);
  const parsed = await callJsonCompletion(prompt);

  if (!parsed.beats || !Array.isArray(parsed.beats)) {
    console.warn('⚠️  No beats array returned from event links API call');
    return storyBeats;
  }

  // Create a deep copy of story beats to modify
  const updatedBeats = JSON.parse(JSON.stringify(storyBeats));

  // Validation counters
  let validLinks = 0;
  let invalidLinks = 0;
  const invalidReasons: string[] = [];

  // Apply event links from API response
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

        // Validate that the text actually exists in the paragraph
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

        // Valid link
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
