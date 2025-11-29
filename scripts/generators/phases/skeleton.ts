import OpenAI from 'openai';
import { buildPhase2SkeletonPrompt } from '@/lib/generation/prompts';
import type { GenerationContext, TimelineSkeleton } from '@/lib/generation/types';
import { safeJsonParse } from '@/lib/utils';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function callJsonCompletion(prompt: string): Promise<any> {
  console.log(`\n=== PHASE 2: SKELETON API CALL ===`);
  console.log(`Prompt length: ${prompt.length} characters`);

  const response = await openai.chat.completions.create({
    model: 'gpt-5',
    messages: [
      { role: 'system', content: 'You produce concise JSON without prose. Avoid markdown fences.' },
      { role: 'user', content: prompt },
    ],
    max_completion_tokens: 6000,
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
  console.log('Parsed keys:', Object.keys(parsed));
  console.log('Events count:', Array.isArray(parsed.events) ? parsed.events.length : 0);
  console.log('People count:', Array.isArray(parsed.people) ? parsed.people.length : 0);
  console.log('Themes count:', Array.isArray(parsed.themes) ? parsed.themes.length : 0);
  console.log('=== END PHASE 2 DEBUG ===\n');

  return parsed;
}

export async function executePhase2Skeleton(context: GenerationContext): Promise<TimelineSkeleton> {
  if (!context.researchCorpus) {
    throw new Error('Research corpus missing for skeleton phase');
  }

  const prompt = buildPhase2SkeletonPrompt(context.seed, context.researchCorpus);
  const parsed = await callJsonCompletion(prompt);

  return {
    events: Array.isArray(parsed.events) ? parsed.events : [],
    people: Array.isArray(parsed.people) ? parsed.people : [],
    themes: Array.isArray(parsed.themes) ? parsed.themes : [],
    periodization: Array.isArray(parsed.periodization) ? parsed.periodization : [],
  };
}
