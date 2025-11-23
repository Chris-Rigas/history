import OpenAI from 'openai';
import { buildPhase1ResearchPrompt } from '@/lib/generation/prompts';
import type { GenerationContext, ResearchCorpus } from '@/lib/generation/types';
import { safeJsonParse } from '@/lib/utils';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function callJsonCompletion(prompt: string): Promise<any> {
  const response = await openai.chat.completions.create({
    model: 'gpt-5',
    messages: [
      { role: 'system', content: 'You are a careful historian. Always return valid JSON.' },
      { role: 'user', content: prompt },
    ],
    max_tokens: 2000,
    temperature: 0.4,
  });

  const content = response.choices[0].message?.content || '{}';
  const cleaned = content.replace(/```json|```/g, '').trim();
  return safeJsonParse(cleaned, {});
}

export async function executePhase1Research(context: GenerationContext): Promise<ResearchCorpus> {
  const prompt = buildPhase1ResearchPrompt(context.seed);
  const parsed = await callJsonCompletion(prompt);

  return {
    digest: parsed.digest || '',
    citations: Array.isArray(parsed.citations) ? parsed.citations : [],
    keyQuotes: Array.isArray(parsed.keyQuotes) ? parsed.keyQuotes : [],
    keyDataPoints: Array.isArray(parsed.keyDataPoints) ? parsed.keyDataPoints : [],
    primarySourcesFound: Array.isArray(parsed.primarySourcesFound) ? parsed.primarySourcesFound : [],
  };
}
