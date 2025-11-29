import OpenAI from 'openai';
import { buildPhase5EnrichmentPrompt } from '@/lib/generation/prompts';
import type { Enrichment, GenerationContext } from '@/lib/generation/types';
import { safeJsonParse } from '@/lib/utils';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function callJsonCompletion(prompt: string): Promise<any> {
  const response = await openai.chat.completions.create({
    model: 'gpt-5',
    messages: [
      { role: 'system', content: 'Return enrichment JSON only.' },
      { role: 'user', content: prompt },
    ],
    max_completion_tokens: 30000,
    temperature: 1,
  });

  const content = response.choices[0].message?.content || '{}';
  const cleaned = content.replace(/```json|```/g, '').trim();
  return safeJsonParse(cleaned, {});
}

export async function executePhase5Enrichment(context: GenerationContext): Promise<Enrichment> {
  const prompt = buildPhase5EnrichmentPrompt(context);
  const parsed = await callJsonCompletion(prompt);

  return {
    people: Array.isArray(parsed.people) ? parsed.people : [],
    turningPoints: Array.isArray(parsed.turningPoints) ? parsed.turningPoints : [],
    perspectives: Array.isArray(parsed.perspectives) ? parsed.perspectives : [],
    themeInsights: Array.isArray(parsed.themeInsights) ? parsed.themeInsights : [],
    keyFacts: Array.isArray(parsed.keyFacts) ? parsed.keyFacts : [],
  };
}
