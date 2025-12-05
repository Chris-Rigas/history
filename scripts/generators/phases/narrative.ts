import OpenAI from 'openai';
import { buildPhase3NarrativePrompt } from '@/lib/generation/prompts';
import type { GenerationContext, MainNarrative } from '@/lib/generation/types';
import { safeJsonParse, slugify } from '@/lib/utils';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function callJsonCompletion(prompt: string): Promise<any> {
  console.log(`\n=== PHASE 3: NARRATIVE API CALL ===`);
  console.log(`Prompt length: ${prompt.length} characters`);

  const response = await openai.chat.completions.create({
    model: 'gpt-5',
    messages: [
      { role: 'system', content: 'Return valid JSON for narrative content.' },
      { role: 'user', content: prompt },
    ],
    max_completion_tokens: 30000,
    temperature: 1,
  });

  const content = response.choices[0].message?.content || '{}';
  console.log(`Response length: ${content.length} characters`);
  console.log(`Finish reason: ${response.choices[0].finish_reason}`);
  console.log(`First 200 chars: ${content.substring(0, 200)}`);

  if (response.choices[0].finish_reason === 'length') {
    console.error('⚠️  WARNING: Response truncated due to max_tokens!');
  }

  const cleaned = content.replace(/```json|```/g, '').trim();
  const parsed = safeJsonParse(cleaned, {});
  console.log(`Key people selected:`, Array.isArray(parsed.keyPeople) ? parsed.keyPeople.length : 0);
  if (Array.isArray(parsed.keyPeople)) {
    console.log(`  Names:`, parsed.keyPeople.join(', '));
  }
  console.log(`Parsed keys:`, Object.keys(parsed));
  console.log(`Has pageTitle:`, !!parsed.pageTitle);
  console.log(`Has centralQuestion:`, !!parsed.centralQuestion);
  console.log(`Story beats:`, Array.isArray(parsed.storyBeats) ? parsed.storyBeats.length : 0);
  console.log(`Themes:`, Array.isArray(parsed.themes) ? parsed.themes.length : 0);
  console.log('=== END PHASE 3 DEBUG ===\n');

  return parsed;
}

export async function executePhase3Narrative(context: GenerationContext): Promise<MainNarrative> {
  const prompt = buildPhase3NarrativePrompt(context);
  const parsed = await callJsonCompletion(prompt);

  const storyBeats = Array.isArray(parsed.storyBeats) ? parsed.storyBeats : [];

  const skeletonEventSlugs = new Set(
    (context.skeleton?.events || [])
      .map(event => slugify((event as any).slug ?? event.title ?? ''))
      .filter(Boolean)
  );

  storyBeats.forEach((beat: any, beatIndex: number) => {
    (beat?.eventLinks || []).forEach((link: any) => {
      if (!link?.eventSlug) return;
      if (!skeletonEventSlugs.has(link.eventSlug)) {
        console.warn(
          `⚠️  Event link slug not found in skeleton (beat ${beatIndex + 1}): ${link.eventSlug}`
        );
      }
    });
  });

  console.log(`\n=== EVENT LINKS SUMMARY ===`);
  let totalLinks = 0;
  let validLinks = 0;
  const invalidLinks: string[] = [];

  storyBeats.forEach((beat: any, beatIndex: number) => {
    const links = beat?.eventLinks || [];
    totalLinks += links.length;

    links.forEach((link: any) => {
      if (link?.eventSlug && skeletonEventSlugs.has(link.eventSlug)) {
        validLinks++;
      } else if (link?.eventSlug) {
        invalidLinks.push(`Beat ${beatIndex + 1}: "${link.eventSlug}"`);
      }
    });

    console.log(`   Beat ${beatIndex + 1} "${beat?.title || 'untitled'}": ${links.length} links`);
  });

  console.log(`Total eventLinks: ${totalLinks}`);
  console.log(`Valid (matching skeleton): ${validLinks}`);
  console.log(`Invalid slugs: ${invalidLinks.length}`);
  if (invalidLinks.length > 0) {
    console.log(`   Invalid:`, invalidLinks.slice(0, 10).join(', '));
  }
  console.log(`=== END EVENT LINKS SUMMARY ===\n`);

  return {
    pageTitle: parsed.pageTitle || '',
    centralQuestion: parsed.centralQuestion || '',
    summary: parsed.summary || '',
    storyBeats,
    overview: Array.isArray(parsed.overview) ? parsed.overview : [],
    themes: Array.isArray(parsed.themes) ? parsed.themes : [],
    storyCharacter: parsed.storyCharacter || '',
    keyPeople: Array.isArray(parsed.keyPeople) ? parsed.keyPeople : [],
  };
}
