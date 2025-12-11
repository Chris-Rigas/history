#!/usr/bin/env ts-node

/**
 * Batch timeline generation script
 * Generates 3 timelines at a time, in order, skipping already-generated ones
 *
 * Usage:
 *   npm run batch-generate
 */

import './load-env';

import { TIMELINE_SEEDS, getTimelineSeed } from './ingest';
import { generateTimelineComplete } from './generators/unified-pipeline';
import { saveExpandedEvents } from './generators/event-generator';
import { getEventsByTimelineId, linkPersonToEvent } from '@/lib/queries/events';
import {
  createTimeline,
  getTimelineBySlug,
  linkPersonToTimeline,
} from '@/lib/queries/timelines';
import { serializeError, summarizeError } from './utils/error';
import { supabaseAdmin } from '@/lib/supabase';
import { slugify } from '@/lib/utils';
import type { GenerationContext, TimelineSeed as UnifiedSeed } from '@/lib/generation/types';
import { createPerson } from '@/lib/queries/people';

interface GenerationOptions {
  eventCount?: number;
  personCount?: number;
}

/**
 * Check if a timeline has already been fully generated
 */
async function isTimelineGenerated(slug: string): Promise<boolean> {
  try {
    const timeline = await getTimelineBySlug(slug, { client: supabaseAdmin });
    
    if (!timeline) {
      return false;
    }

    // Check if it has content (summary and interpretation)
    if (!timeline.summary || !timeline.interpretation_html) {
      return false;
    }

    // Check if it has events
    const { data: events } = await supabaseAdmin
      .from('timeline_events')
      .select('event_id')
      .eq('timeline_id', timeline.id)
      .limit(1);

    return events && events.length > 0;
  } catch (error) {
    console.error(`Error checking timeline ${slug}:`, error);
    return false;
  }
}

/**
 * Generate a complete timeline with events and people
 */
async function generateCompleteTimeline(
  timelineTitle: string,
  options: GenerationOptions
): Promise<void> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🚀 Starting generation for: ${timelineTitle}`);
  console.log(`${'='.repeat(80)}\n`);

  // Get seed data
  const seed = getTimelineSeed(timelineTitle);
  if (!seed) {
    console.error(`❌ Timeline seed not found: ${timelineTitle}`);
    return;
  }

  try {
    const slug = slugify(seed.title);
    let timeline = await getTimelineBySlug(slug, { client: supabaseAdmin });

    if (!timeline) {
      timeline = await createTimeline({
        title: seed.title,
        slug,
        start_year: seed.startYear,
        end_year: seed.endYear,
        region: seed.region || null,
        summary: '',
        interpretation_html: '',
        map_image_url: null,
      });
    }

    let context: GenerationContext | undefined;
    let events: any[] = [];

    // Generate timeline and events using unified pipeline
    console.log(`\n${'─'.repeat(80)}`);
    console.log('STEP 1: Generating Timeline with Unified Pipeline');
    console.log(`${'─'.repeat(80)}`);

    const unifiedSeed: UnifiedSeed = {
      title: seed.title,
      startYear: seed.startYear,
      endYear: seed.endYear,
      region: seed.region,
      context: seed.summary,
    };

    console.log('🤖 Running unified generation pipeline...');
    context = await generateTimelineComplete(unifiedSeed);

    await saveUnifiedPipelineResults(timeline.id, context);

    // Save expanded events from unified pipeline
    if (context.expandedEvents && context.expandedEvents.length > 0) {
      console.log(`\n📅 Saving ${context.expandedEvents.length} events...`);
      const eventIds = await saveExpandedEvents(timeline, context.expandedEvents as any);
      console.log(`✅ Saved ${eventIds.length} events using unified event saver`);
    }

    // Refresh timeline data after updates
    timeline = (await getTimelineBySlug(slug, { client: supabaseAdmin })) ?? timeline;

    // Retrieve saved events
    events = await getEventsByTimelineId(timeline.id);

    if (!events || events.length === 0) {
      console.warn('⚠️  No events were saved');
    } else {
      console.log(`✅ Found ${events.length} events in database`);
    }

    // Step 2: Generate people (if we have events and enriched people)
    if (context?.people && context.people.length > 0 && events.length > 0) {
      console.log(`\n${'─'.repeat(80)}`);
      console.log('STEP 2: Saving People from Enrichment Phase');
      console.log(`${'─'.repeat(80)}`);

      await savePeopleToDatabase(context.people, timeline, events);
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ GENERATION COMPLETE: ${seed.title}`);
    console.log(`${'='.repeat(80)}\n`);

  } catch (error) {
    const message = summarizeError(error);
    console.error(`\n❌ Fatal error generating ${timelineTitle}: ${message}`);

    const details = serializeError(error);
    if (details) {
      console.error('ℹ️  Error details:', details);
    }
  }
}

/**
 * Save unified pipeline results to database
 */
async function saveUnifiedPipelineResults(
  timelineId: string,
  context: GenerationContext
): Promise<void> {
  console.log('\n=== SAVING TO DATABASE ===');
  const { replaceTimelineSources, upsertTimelineMetadata } = await import('@/lib/queries/timelines');

  // Save research corpus citations as timeline sources
  if (context.researchCorpus?.citations) {
    await replaceTimelineSources(
      timelineId,
      context.researchCorpus.citations.map((citation, index) => ({
        number: index + 1,
        source: citation.source || '',
        url: citation.url || '',
      }))
    );
  }

  const enrichmentData = {
    people: context.people || context.enrichment?.people || [],
    turningPoints: context.enrichment?.turningPoints || [],
    perspectives: context.enrichment?.perspectives || [],
    themeInsights: context.enrichment?.themeInsights || [],
    keyFacts: context.enrichment?.keyFacts || [],
    interpretationSections: context.enrichment?.interpretationSections || [],
    keyHighlights: context.enrichment?.keyHighlights || [],
  };

  console.log(`\n=== SAVING ENRICHMENT ===`);
  console.log(`keyFacts count being saved:`, context.enrichment?.keyFacts?.length || 0);
  if (context.enrichment?.keyFacts?.length) {
    console.log(`Sample fact:`, JSON.stringify(context.enrichment.keyFacts[0]));
  }

  console.log('Enrichment counts:');
  console.log(`  - interpretationSections: ${enrichmentData.interpretationSections.length}`);
  console.log(`  - keyHighlights: ${enrichmentData.keyHighlights.length}`);
  console.log(`  - perspectives: ${enrichmentData.perspectives.length}`);
  console.log(`  - turningPoints: ${enrichmentData.turningPoints.length}`);
  console.log(`  - themeInsights: ${enrichmentData.themeInsights.length}`);
  console.log(`  - people: ${enrichmentData.people.length}`);

  // Save all phase outputs to metadata
  await upsertTimelineMetadata(timelineId, {
    researchCorpus: context.researchCorpus as any,
    skeleton: context.skeleton as any,
    structuredContent: {
      overview: context.mainNarrative?.overview || [],
      storyBeats: context.mainNarrative?.storyBeats || [],
      themes: context.mainNarrative?.themes || [],
      centralQuestion: context.mainNarrative?.centralQuestion || '',
      storyCharacter: context.mainNarrative?.storyCharacter || '',
      pageTitle: context.mainNarrative?.pageTitle || '',
      summary: context.mainNarrative?.summary || '',
    } as any,
    enrichment: enrichmentData as any,
    seoTitle: context.seo?.seoTitle || null,
    metaDescription: context.seo?.metaDescription || null,
    relatedKeywords: context.seo?.keywords || null,
  });

  console.log('✅ Metadata saved to database');
  console.log('=== END DATABASE SAVE ===\n');

  // Update timeline record with main narrative content
  await supabaseAdmin
    .from('timelines')
    .update({
      summary: context.mainNarrative?.summary || null,
      interpretation_html: formatStoryBeatsAsHtml(context.mainNarrative?.storyBeats || []),
    })
    .eq('id', timelineId);
}

/**
 * Format story beats as HTML paragraphs
 */
function formatStoryBeatsAsHtml(
  beats: Array<{ paragraphs?: string[] }> = []
): string {
  return beats
    .flatMap(beat => beat?.paragraphs || [])
    .map(p => `<p>${p}</p>`)
    .join('\n');
}

/**
 * Save enrichment people to database with event links
 */
async function savePeopleToDatabase(
  enrichedPeople: any[],
  timeline: any,
  events: any[]
): Promise<void> {
  console.log(`\n👥 Saving ${enrichedPeople.length} people from enrichment phase...`);

  // Build event slug → event record map for linking
  const eventSlugMap = new Map(events.map(e => [e.slug, e]));

  const savedPeopleIds: string[] = [];

  for (let i = 0; i < enrichedPeople.length; i++) {
    const enrichedPerson = enrichedPeople[i];

    console.log(`   [${i + 1}/${enrichedPeople.length}] ${enrichedPerson.name}`);

    try {
      // 1. Create person record
      const person = await createPerson({
        name: enrichedPerson.name,
        slug: enrichedPerson.slug,
        birth_year: enrichedPerson.birthYear || null,
        death_year: enrichedPerson.deathYear || null,
        bio_short: enrichedPerson.bioShort,
        bio_long: enrichedPerson.bioLong,
      });

      // 2. Link to timeline
      await linkPersonToTimeline(timeline.id, person.id, enrichedPerson.role);

      savedPeopleIds.push(person.id);

      // 3. Link to related events based on relatedEventSlugs from enrichment
      if (enrichedPerson.relatedEventSlugs?.length) {
        for (const eventSlug of enrichedPerson.relatedEventSlugs) {
          const event = eventSlugMap.get(eventSlug);
          if (event) {
            await linkPersonToEvent(event.id, person.id);
            console.log(`      ✓ Linked to event: ${event.title}`);
          } else {
            console.warn(`      ⚠️  Event slug not found: ${eventSlug}`);
          }
        }
      }

      console.log(`      ✅ Person saved: ${person.id}`);
    } catch (error) {
      console.error(`      ❌ Error saving ${enrichedPerson.name}:`, error);
    }
  }

  console.log(`\n✅ Saved ${savedPeopleIds.length} people to database`);
}

/**
 * Main execution
 */
async function main() {
  console.log(`
${'='.repeat(80)}
BATCH TIMELINE GENERATION
${'='.repeat(80)}

This script will generate 3 timelines at a time, in order.
Timelines that have already been generated will be skipped.

Total timelines in seed list: ${TIMELINE_SEEDS.length}
`);

  // Find the next 3 ungrenerated timelines
  const toGenerate: string[] = [];
  
  console.log('🔍 Checking which timelines need generation...\n');
  
  for (const seed of TIMELINE_SEEDS) {
    if (toGenerate.length >= 3) {
      break;
    }

    const slug = slugify(seed.title);
    const isGenerated = await isTimelineGenerated(slug);
    
    if (!isGenerated) {
      toGenerate.push(seed.title);
      console.log(`   📝 Queued: ${seed.title}`);
    } else {
      console.log(`   ✅ Already generated: ${seed.title}`);
    }
  }

  if (toGenerate.length === 0) {
    console.log('\n🎉 All timelines have been generated!');
    return;
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`Generating ${toGenerate.length} timelines...`);
  console.log(`${'='.repeat(80)}\n`);

  // Generate each timeline
  for (let i = 0; i < toGenerate.length; i++) {
    const title = toGenerate[i];
    console.log(`\n[${i + 1}/${toGenerate.length}] ${title}`);
    
    await generateCompleteTimeline(title, {});
    
    // Delay between timelines
    if (i < toGenerate.length - 1) {
      console.log(`\n⏳ Waiting 5 seconds before next timeline...\n`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`✅ BATCH COMPLETE - Generated ${toGenerate.length} timelines`);
  console.log(`${'='.repeat(80)}\n`);
}

// Run the script
main().catch(error => {
  const message = summarizeError(error);
  console.error(`\n❌ Fatal error: ${message}`);

  const details = serializeError(error);
  if (details) {
    console.error('ℹ️  Error details:', details);
  }

  process.exit(1);
});
