import OpenAI from 'openai';
import { buildPhase3NarrativePrompt } from '@/lib/generation/prompts';
import type { GenerationContext, MainNarrative } from '@/lib/generation/types';
import { safeJsonParse } from '@/lib/utils';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function callJsonCompletion(prompt: string): Promise<any> {
  const response = await openai.chat.completions.create({
    model: 'gpt-5',
    messages: [
      { role: 'system', content: 'Return valid JSON for narrative content.' },
      { role: 'user', content: prompt },
    ],
    max_completion_tokens: 3500,
    temperature: 0.6,
  });

  const content = response.choices[0].message?.content || '{}';
  const cleaned = content.replace(/```json|```/g, '').trim();
  return safeJsonParse(cleaned, {});
}

export async function executePhase3Narrative(context: GenerationContext): Promise<MainNarrative> {
  const prompt = buildPhase3NarrativePrompt(context);
  const parsed = await callJsonCompletion(prompt);

  return {
    pageTitle: parsed.pageTitle || '',
    centralQuestion: parsed.centralQuestion || '',
    overview: Array.isArray(parsed.overview) ? parsed.overview : [],
    summary: parsed.summary || '',
    themes: Array.isArray(parsed.themes) ? parsed.themes : [],
    storyCharacter: parsed.storyCharacter || '',
  };
}
