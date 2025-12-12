import type { GenerationContext, TimelineSeed } from '@/lib/generation/types';
import { executePhase1Research } from './phases/research';
import { executePhase2Skeleton } from './phases/skeleton';
import { executePhase3Narrative } from './phases/narrative';
import { executePhase4Events } from './phases/events';
import { executePhase4_5People } from './phases/people';
import { executePhase5Enrichment } from './phases/enrichment';
import { executePhase6SEO } from './phases/seo';

export async function generateTimelineComplete(seed: TimelineSeed): Promise<GenerationContext> {
  const context: GenerationContext = { seed };

  // Phase 1: Research
  console.log('📚 Phase 1: Research...');
  context.researchCorpus = await executePhase1Research(context);

  // Phase 2: Skeleton
  console.log('🦴 Phase 2: Skeleton...');
  context.skeleton = await executePhase2Skeleton(context);

  // Phase 3: Main Narrative (WITHOUT event links)
  console.log('📝 Phase 3: Main Narrative...');
  context.mainNarrative = await executePhase3Narrative(context);

  // Phase 4: Event Expansion
  console.log('📅 Phase 4: Events...');
  if (context.skeleton?.events?.length) {
    context.expandedEvents = await executePhase4Events(context, context.skeleton.events);
  } else {
    context.expandedEvents = [];
  }

  // Phase 4c: Add Event Links (NEW LOCATION - after Phase 4)
  console.log('🔗 Phase 4c: Adding event links to narrative...');
  if (context.mainNarrative?.storyBeats && context.expandedEvents?.length) {
    const { addEventLinksToBeats } = await import('./phases/event-links');
    context.mainNarrative.storyBeats = await addEventLinksToBeats(
      context.mainNarrative.storyBeats,
      context.expandedEvents
    );
  }

  // Phase 4.5: People Expansion
  console.log('👥 Phase 4.5: People...');
  context.people = await executePhase4_5People(context);

  // Phase 5: Enrichment
  console.log('✨ Phase 5: Enrichment...');
  context.enrichment = await executePhase5Enrichment(context);

  // Phase 6: SEO
  console.log('🔍 Phase 6: SEO...');
  context.seo = await executePhase6SEO(context);

  console.log('✅ Generation complete!');
  return context;
}
