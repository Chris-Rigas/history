import OpenAI from 'openai';
import { buildPhase4EventsPrompt, buildPhase4RecapPrompt } from '@/lib/generation/prompts';
import type {
  ExpandedEvent,
  GenerationContext,
  StoryformRecap,
} from '@/lib/generation/types';
import { safeJsonParse } from '@/lib/utils';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function callJsonCompletion(prompt: string, maxTokens = 4000): Promise<any> {
  const response = await openai.chat.completions.create({
    model: 'gpt-5',
    messages: [
      { role: 'system', content: 'Return JSON only. Do not wrap in fences.' },
      { role: 'user', content: prompt },
    ],
    max_completion_tokens: maxTokens,
    temperature: 1,
  });

  const content = response.choices[0].message?.content || '{}';
  const cleaned = content.replace(/```json|```/g, '').trim();
  return safeJsonParse(cleaned, {});
}

export async function executePhase4Events(
  context: GenerationContext,
  eventsChunk: any[]
): Promise<ExpandedEvent[]> {
  const prompt = buildPhase4EventsPrompt(context, eventsChunk);
  const parsed = await callJsonCompletion(prompt);

  return Array.isArray(parsed.expandedEvents) ? parsed.expandedEvents : [];
}

export async function executePhase4StoryformRecap(context: GenerationContext): Promise<StoryformRecap> {
  const prompt = buildPhase4RecapPrompt(context);
  const parsed = await callJsonCompletion(prompt, 2000);

  return {
    paragraphs: Array.isArray(parsed.paragraphs) ? parsed.paragraphs : [],
  };
}
