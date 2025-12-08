import OpenAI from 'openai';
import { buildPhase4_5PeoplePrompt } from '@/lib/generation/prompts';
import type { GenerationContext, ExpandedPerson } from '@/lib/generation/types';
import { safeJsonParse } from '@/lib/utils';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function callJsonCompletion(prompt: string): Promise<any> {
  console.log(`\n=== PHASE 4.5: PEOPLE API CALL ===`);
  console.log(`Prompt length: ${prompt.length} characters`);

  const response = await openai.chat.completions.create({
    model: 'gpt-5',
    messages: [
      { role: 'system', content: 'You are an expert biographer who writes engaging, accurate biographical content about historical figures. Return valid JSON only.' },
      { role: 'user', content: prompt },
    ],
    max_completion_tokens: 16000,
    temperature: 1,
  });

  const content = response.choices[0].message?.content || '{}';
  console.log(`Response length: ${content.length} characters`);
  console.log(`Finish reason: ${response.choices[0].finish_reason}`);
  console.log(`First 200 chars: ${content.substring(0, 200)}`);

  if (response.choices[0].finish_reason === 'length') {
    console.error('⚠️  WARNING: Response truncated due to max_tokens!');
    console.error('⚠️  People biographies may be incomplete!');
  }

  const cleaned = content.replace(/```json|```/g, '').trim();
  const parsed = safeJsonParse(cleaned, {});

  console.log(`Parsed keys:`, Object.keys(parsed));
  console.log(`People count:`, Array.isArray(parsed.people) ? parsed.people.length : 0);
  if (Array.isArray(parsed.people)) {
    console.log(`  People names:`, parsed.people.map((p: any) => p.name).join(', '));
  }
  console.log('=== END PHASE 4.5 DEBUG ===\n');

  return parsed;
}

export async function executePhase4_5People(context: GenerationContext): Promise<ExpandedPerson[]> {
  if (!context.mainNarrative?.keyPeople?.length) {
    console.warn('⚠️  No key people selected by narrative. Skipping people generation.');
    return [];
  }

  const prompt = buildPhase4_5PeoplePrompt(context);
  const parsed = await callJsonCompletion(prompt);

  return Array.isArray(parsed.people) ? parsed.people : [];
}
