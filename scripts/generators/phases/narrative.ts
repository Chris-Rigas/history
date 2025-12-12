import OpenAI from 'openai';
import { buildPhase3NarrativePrompt } from '@/lib/generation/prompts';
import { addEventLinksToBeats } from './add-event-links';
import type { GenerationContext, MainNarrative } from '@/lib/generation/types';
import { safeJsonParse } from '@/lib/utils';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function callJsonCompletion(prompt: string): Promise<any> {
  console.log(`\n=== PHASE 3: NARRATIVE API CALL ===`);
  console.log(`Prompt length: ${prompt.length} characters`);

  const response = await openai.chat.completions.create({
    model: 'gpt-5',
    messages: [
      { role: 'system', content: 'Return valid JSON for narrative content.' },
      { role: 'user', content: prompt },
    ],
    max_completion_tokens: 30000,
    temperature: 1,
  });

  const content = response.choices[0].message?.content || '{}';
  console.log(`Response length: ${content.length} characters`);
  console.log(`Finish reason: ${response.choices[0].finish_reason}`);
  console.log(`First 200 chars: ${content.substring(0, 200)}`);

  if (response.choices[0].finish_reason === 'length') {
    console.error('⚠️  WARNING: Response truncated due to max_tokens!');
  }

  const cleaned = content.replace(/```json|```/g, '').trim();
  const parsed = safeJsonParse(cleaned, {});
  console.log(`Key people selected:`, Array.isArray(parsed.keyPeople) ? parsed.keyPeople.length : 0);
  if (Array.isArray(parsed.keyPeople)) {
    console.log(`  Names:`, parsed.keyPeople.join(', '));
  }
  console.log(`Parsed keys:`, Object.keys(parsed));
  console.log(`Has pageTitle:`, !!parsed.pageTitle);
  console.log(`Has centralQuestion:`, !!parsed.centralQuestion);
  console.log(`Story beats:`, Array.isArray(parsed.storyBeats) ? parsed.storyBeats.length : 0);
  console.log(`Themes:`, Array.isArray(parsed.themes) ? parsed.themes.length : 0);
  console.log('=== END PHASE 3 DEBUG ===\n');

  return parsed;
}

export async function executePhase3Narrative(context: GenerationContext): Promise<MainNarrative> {
  const prompt = buildPhase3NarrativePrompt(context);
  const parsed = await callJsonCompletion(prompt);

  let storyBeats = Array.isArray(parsed.storyBeats) ? parsed.storyBeats : [];

  // Phase 3b: Add event links via GPT-5
  if (context.skeleton && storyBeats.length > 0) {
    console.log('\n🔗 Phase 3b: Adding event links to narrative...');
    storyBeats = await addEventLinksToBeats(storyBeats, context.skeleton);
  }

  return {
    pageTitle: parsed.pageTitle || '',
    centralQuestion: parsed.centralQuestion || '',
    summary: parsed.summary || '',
    storyBeats,
    overview: Array.isArray(parsed.overview) ? parsed.overview : [],
    themes: Array.isArray(parsed.themes) ? parsed.themes : [],
    storyCharacter: parsed.storyCharacter || '',
    keyPeople: Array.isArray(parsed.keyPeople) ? parsed.keyPeople : [],
  };
}
