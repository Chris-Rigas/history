import OpenAI from 'openai';
import { buildPhase4EventsPrompt, buildPhase4RecapPrompt } from '@/lib/generation/prompts';
import type {
  ExpandedEvent,
  GenerationContext,
  StoryformRecap,
} from '@/lib/generation/types';
import { safeJsonParse } from '@/lib/utils';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function callJsonCompletion(prompt: string, maxTokens = 10000): Promise<any> {
  console.log(`\n=== PHASE 4: EVENTS API CALL ===`);
  console.log(`Prompt length: ${prompt.length} characters`);

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
  console.log(`Response length: ${content.length} characters`);
  console.log(`Finish reason: ${response.choices[0].finish_reason}`);
  console.log(`First 200 chars: ${content.substring(0, 200)}`);

  if (response.choices[0].finish_reason === 'length') {
    console.error('⚠️  WARNING: Response truncated due to max_tokens!');
  }

  const cleaned = content.replace(/```json|```/g, '').trim();
  const parsed = safeJsonParse(cleaned, {});
  console.log('Parsed keys:', Object.keys(parsed));
  console.log('Expanded events count:', Array.isArray((parsed as any).expandedEvents) ? parsed.expandedEvents.length : 0);
  console.log('Paragraphs count:', Array.isArray((parsed as any).paragraphs) ? parsed.paragraphs.length : 0);
  console.log('=== END PHASE 4 DEBUG ===\n');

  return parsed;
}

export async function executePhase4Events(
  context: GenerationContext,
  eventsChunk: any[],
  isRetry: boolean = false,
): Promise<ExpandedEvent[]> {
  const prompt = buildPhase4EventsPrompt(context, eventsChunk);
  console.log(`\n=== Generating batch of ${eventsChunk.length} events ===`);
  console.log('Event titles:', eventsChunk.map(e => e.title).join(', '));

  const parsed = await callJsonCompletion(prompt);

  if (!parsed.expandedEvents || !Array.isArray(parsed.expandedEvents)) {
    console.error('❌ No expandedEvents array in response');
    console.error('Raw parsed response:', JSON.stringify(parsed, null, 2));
    return [];
  }

  const events = parsed.expandedEvents;

  events.forEach((event: any) => {
    const missingFields: string[] = [];
    if (!event.summary) missingFields.push('summary');
    if (!event.description) missingFields.push('description');
    if (!event.significance) missingFields.push('significance');

    if (missingFields.length > 0) {
      console.warn(
        `⚠️  Event "${event.title}" missing fields: ${missingFields.join(', ')}`,
      );
    } else {
      console.log(`✓ Event "${event.title}" generated successfully`);
    }
  });

  const failedEvents = events.filter(
    (event: any) => !event.summary || !event.description,
  );

  if (!isRetry && failedEvents.length > 0) {
    console.log(`\n🔄 Retrying ${failedEvents.length} failed events...`);

    for (const failedEvent of failedEvents) {
      console.log(`   Retrying: ${failedEvent.title}`);
      const retryResult = await executePhase4Events(context, [failedEvent], true);
      if (retryResult.length > 0 && retryResult[0].summary) {
        const index = events.findIndex(
          (event: any) => event.title === failedEvent.title,
        );
        if (index !== -1) {
          events[index] = retryResult[0];
        }
        console.log('   ✓ Retry successful');
      } else {
        console.log('   ✗ Retry failed');
      }
    }
  }

  return events;
}

export async function executePhase4StoryformRecap(context: GenerationContext): Promise<StoryformRecap> {
  const prompt = buildPhase4RecapPrompt(context);
  const parsed = await callJsonCompletion(prompt, 4000);

  return {
    paragraphs: Array.isArray(parsed.paragraphs) ? parsed.paragraphs : [],
  };
}
