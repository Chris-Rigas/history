import OpenAI from 'openai';
import { buildPhase6SEOPrompt } from '@/lib/generation/prompts';
import type { GenerationContext, SEOMetadata } from '@/lib/generation/types';
import { safeJsonParse } from '@/lib/utils';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function callJsonCompletion(prompt: string): Promise<any> {
  const response = await openai.chat.completions.create({
    model: 'gpt-5',
    messages: [
      { role: 'system', content: 'Return SEO metadata JSON only.' },
      { role: 'user', content: prompt },
    ],
    max_completion_tokens: 1500,
    temperature: 1,
  });

  const content = response.choices[0].message?.content || '{}';
  const cleaned = content.replace(/```json|```/g, '').trim();
  return safeJsonParse(cleaned, {});
}

export async function executePhase6SEO(context: GenerationContext): Promise<SEOMetadata> {
  const prompt = buildPhase6SEOPrompt(context);
  const parsed = await callJsonCompletion(prompt);

  return {
    seoTitle: parsed.seoTitle || '',
    metaDescription: parsed.metaDescription || '',
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
    ogTitle: parsed.ogTitle || '',
    ogDescription: parsed.ogDescription || '',
    schemaSuggestions: parsed.schemaSuggestions || { timeline: {}, events: {}, people: {} },
  };
}
