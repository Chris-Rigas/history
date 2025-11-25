import OpenAI from 'openai';
import { buildPhase1ResearchPrompt } from '@/lib/generation/prompts';
import type { GenerationContext, ResearchCorpus } from '@/lib/generation/types';
import { extractResponseText } from '@/lib/openai';
import { safeJsonParse } from '@/lib/utils';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function executePhase1Research(context: GenerationContext): Promise<ResearchCorpus> {
  const prompt = buildPhase1ResearchPrompt(context.seed);
  const response = await openai.responses.create({
    model: 'gpt-5',
    reasoning: { effort: 'low' },
    tools: [{ type: 'web_search_preview_2025_03_11' }],
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: prompt,
          },
        ],
      },
    ],
  });

  const content = extractResponseText(response);
  const cleaned = content.replace(/```json|```/g, '').trim();
  const parsed = safeJsonParse(cleaned, {});

  return {
    digest: parsed.digest || '',
    citations: Array.isArray(parsed.citations) ? parsed.citations : [],
    keyQuotes: Array.isArray(parsed.keyQuotes) ? parsed.keyQuotes : [],
    keyDataPoints: Array.isArray(parsed.keyDataPoints) ? parsed.keyDataPoints : [],
    primarySourcesFound: Array.isArray(parsed.primarySourcesFound) ? parsed.primarySourcesFound : [],
  };
}
