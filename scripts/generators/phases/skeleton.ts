import OpenAI from 'openai';
import { buildPhase2SkeletonPrompt } from '@/lib/generation/prompts';
import type { GenerationContext, TimelineSkeleton } from '@/lib/generation/types';
import { safeJsonParse } from '@/lib/utils';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function callJsonCompletion(prompt: string): Promise<any> {
  const response = await openai.chat.completions.create({
    model: 'gpt-5',
    messages: [
      { role: 'system', content: 'You produce concise JSON without prose. Avoid markdown fences.' },
      { role: 'user', content: prompt },
    ],
    max_completion_tokens: 3000,
    temperature: 1,
  });

  const content = response.choices[0].message?.content || '{}';
  const cleaned = content.replace(/```json|```/g, '').trim();
  return safeJsonParse(cleaned, {});
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
