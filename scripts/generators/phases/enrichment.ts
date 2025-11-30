import OpenAI from 'openai';
import { buildPhase5EnrichmentPrompt } from '@/lib/generation/prompts';
import type { Enrichment, GenerationContext } from '@/lib/generation/types';
import { safeJsonParse } from '@/lib/utils';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function callJsonCompletion(prompt: string): Promise<any> {
  console.log(`\n=== PHASE 5: ENRICHMENT API CALL ===`);
  console.log(`Prompt length: ${prompt.length} characters`);

  const response = await openai.chat.completions.create({
    model: 'gpt-5',
    messages: [
      { role: 'system', content: 'Return enrichment JSON only.' },
      { role: 'user', content: prompt },
    ],
    max_completion_tokens: 32000, // Increased limit for enrichment output
    temperature: 1,
  });

  const content = response.choices[0].message?.content || '{}';
  console.log(`Response length: ${content.length} characters`);
  console.log(`Finish reason: ${response.choices[0].finish_reason}`);
  console.log(`First 200 chars: ${content.substring(0, 200)}`);

  if (response.choices[0].finish_reason === 'length') {
    console.error('⚠️  WARNING: Response truncated due to max_tokens!');
    console.error('⚠️  Enrichment data will be incomplete!');
  }

  const cleaned = content.replace(/```json|```/g, '').trim();
  const parsed = safeJsonParse(cleaned, {});

  console.log(`Parsed keys:`, Object.keys(parsed));
  console.log(`People count:`, Array.isArray(parsed.people) ? parsed.people.length : 0);
  console.log(`Turning points:`, Array.isArray(parsed.turningPoints) ? parsed.turningPoints.length : 0);
  console.log(`Perspectives:`, Array.isArray(parsed.perspectives) ? parsed.perspectives.length : 0);
  console.log(`Theme insights:`, Array.isArray(parsed.themeInsights) ? parsed.themeInsights.length : 0);
  console.log(`Interpretation sections:`, Array.isArray(parsed.interpretationSections) ? parsed.interpretationSections.length : 0);
  console.log(`Key highlights:`, Array.isArray(parsed.keyHighlights) ? parsed.keyHighlights.length : 0);
  console.log('=== END PHASE 5 DEBUG ===\n');

  return parsed;
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
    interpretationSections: Array.isArray(parsed.interpretationSections) ? parsed.interpretationSections : [],
    keyHighlights: Array.isArray(parsed.keyHighlights) ? parsed.keyHighlights : [],
  };
}
