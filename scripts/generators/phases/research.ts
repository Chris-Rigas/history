import OpenAI from 'openai';
import { buildPhase1ResearchPrompt } from '@/lib/generation/prompts';
import type { GenerationContext, ResearchCorpus } from '@/lib/generation/types';
import { extractResponseText } from '@/lib/openai';
import { safeJsonParse } from '@/lib/utils';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function executePhase1Research(context: GenerationContext): Promise<ResearchCorpus> {
  const prompt = buildPhase1ResearchPrompt(context.seed);
  console.log('\n=== PHASE 1: RESEARCH DEBUG ===');
  console.log(`Prompt length: ${prompt.length} characters`);
  const response = await openai.responses.create({
    model: 'gpt-5',
    reasoning: { effort: 'low' },
    tools: [{ type: 'web_search_preview_2025_03_11' }],
    max_output_tokens: 8000,
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
  console.log(`Response length: ${content.length} characters`);
  console.log(`First 200 chars: ${content.substring(0, 200)}`);

  const cleaned = content.replace(/```json|```/g, '').trim();
  console.log(`Cleaned length: ${cleaned.length} characters`);
  const parsed = safeJsonParse(cleaned, {});
  console.log('Parsed keys:', Object.keys(parsed));
  console.log('Citations count:', Array.isArray(parsed.citations) ? parsed.citations.length : 0);
  console.log('=== END PHASE 1 DEBUG ===\n');

  return {
    digest: parsed.digest || '',
    citations: Array.isArray(parsed.citations) ? parsed.citations : [],
    keyQuotes: Array.isArray(parsed.keyQuotes) ? parsed.keyQuotes : [],
    keyDataPoints: Array.isArray(parsed.keyDataPoints) ? parsed.keyDataPoints : [],
    primarySourcesFound: Array.isArray(parsed.primarySourcesFound) ? parsed.primarySourcesFound : [],
  };
}
