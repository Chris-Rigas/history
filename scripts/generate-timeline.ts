#!/usr/bin/env ts-node

/**
 * Main script for generating complete timeline content
 *
 * Usage:
 *   npm run generate -- --timeline "Aztec Empire"
 *   npm run generate -- --all
 *   npm run generate -- --timeline "Aztec Empire" --events-only
 *   npm run generate -- --timeline "Aztec Empire" --people-only
 */

import './load-env';

import { getTimelineSeed, TIMELINE_SEEDS } from './ingest';
import { generateTimelineComplete } from './generators/unified-pipeline';
import { generateTimelinePeople } from './generators/person-generator';
import { createEvent } from '@/lib/queries/events';
import { getTimelineBySlug } from '@/lib/queries/timelines';
import { getEventsByTimelineId } from '@/lib/queries/events';
import { serializeError, summarizeError } from './utils/error';
import { supabaseAdmin } from '@/lib/supabase';
import { slugify } from '@/lib/utils';
import type { GenerationContext, TimelineSeed as UnifiedSeed } from '@/lib/generation/types';
import { createTimeline, linkEventToTimeline } from '@/lib/queries/timelines';

interface GenerationOptions {
  timeline?: string;
  all?: boolean;
  eventsOnly?: boolean;
  peopleOnly?: boolean;
  eventCount?: number;
  personCount?: number;
}

/**
 * Parse command line arguments
 */
function parseArgs(): GenerationOptions {
  const args = process.argv.slice(2);
  const options: GenerationOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--timeline':
        options.timeline = args[++i];
        break;
      case '--all':
        options.all = true;
        break;
      case '--events-only':
        options.eventsOnly = true;
        break;
      case '--people-only':
        options.peopleOnly = true;
        break;
      case '--event-count':
        options.eventCount = parseInt(args[++i]);
        break;
      case '--person-count':
        options.personCount = parseInt(args[++i]);
        break;
    }
  }

  return options;
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
    console.log(`\nAvailable timelines:`);
    TIMELINE_SEEDS.forEach(s => console.log(`  - ${s.title}`));
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

    // Step 1: Generate timeline and events using unified pipeline (unless people-only)
    if (!options.peopleOnly) {
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
        const eventIds: string[] = [];

        console.log(`\n📅 Saving ${context.expandedEvents.length} events...`);

        for (const expandedEvent of context.expandedEvents) {
          const event = await createEvent({
            title: expandedEvent.title,
            slug: expandedEvent.slug || slugify(expandedEvent.title),
            start_year: expandedEvent.year,
            end_year: (expandedEvent as any).endYear || null,
            location: null,
            tags: expandedEvent.tags || [],
            importance: expandedEvent.importance || 2,
            summary: expandedEvent.summary,
            description_html: formatAsHtml(expandedEvent.description),
            significance_html: formatAsHtml(expandedEvent.significance),
          });

          await linkEventToTimeline(timeline.id, event.id);
          eventIds.push(event.id);
        }

        console.log(`✅ Saved ${eventIds.length} events`);
      }

      // Refresh timeline data after updates
      timeline = (await getTimelineBySlug(slug, { client: supabaseAdmin })) ?? timeline;
    }

    // Load events for subsequent steps
    events = await getEventsByTimelineId(timeline.id, { client: supabaseAdmin });

    // Step 3: Generate people (unless events-only)
    if (!options.eventsOnly) {
      console.log(`\n${'─'.repeat(80)}`);
      console.log('STEP 3: Generating People');
      console.log(`${'─'.repeat(80)}`);

      const personCount = options.personCount || seed.peopleCount || 10;
      const peopleResult = await generateTimelinePeople(timeline, events, personCount, {
        delayMs: 2000,
        onProgress: (current, total, person) => {
          console.log(`\n   [${current}/${total}] ${person}`);
        },
      });

      if (!peopleResult.success) {
        console.error(`⚠️  People generation completed with errors`);
      }
    }

    // Summary
    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ GENERATION COMPLETE: ${timelineTitle}`);
    console.log(`${'='.repeat(80)}\n`);
    console.log(`Timeline ID: ${timeline?.id}`);
    console.log(`URL: /timelines/${slug}`);
    console.log();

  } catch (error) {
    const message = summarizeError(error);
    console.error(`\n❌ GENERATION FAILED: ${message}`);

    const details = serializeError(error);
    if (details) {
      console.error('ℹ️  Error details:', details);
    }

    console.log();
    process.exit(1);
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
  const { supabaseAdmin } = await import('@/lib/supabase');
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
    people: context.enrichment?.people || [],
    turningPoints: context.enrichment?.turningPoints || [],
    perspectives: context.enrichment?.perspectives || [],
    themeInsights: context.enrichment?.themeInsights || [],
    keyFacts: context.enrichment?.keyFacts || [],
    interpretationSections: context.enrichment?.interpretationSections || [],
    keyHighlights: context.enrichment?.keyHighlights || [],
  };

  console.log('Enrichment counts:');
  console.log(`  - interpretationSections: ${enrichmentData.interpretationSections.length}`);
  console.log(`  - keyHighlights: ${enrichmentData.keyHighlights.length}`);
  console.log(`  - perspectives: ${enrichmentData.perspectives.length}`);

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
    storyformRecap: context.storyformRecap as any,
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

function formatAsHtml(text: string): string {
  if (!text) return '';

  // Split into paragraphs and wrap in <p> tags
  const paragraphs = text.split(/\n\n+/);
  return paragraphs.map(p => `<p>${p.trim()}</p>`).join('\n');
}

/**
 * Main execution
 */
async function main() {
  const options = parseArgs();

  const maskKey = (value?: string) => {
    if (!value) return 'undefined';
    if (value.length <= 8) return `${value} (length ${value.length})`;
    return `${value.slice(0, 4)}...${value.slice(-4)} (length ${value.length})`;
  };

  console.log('Supabase environment variables:');
  console.log('  NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'undefined');
  console.log(
    '  NEXT_PUBLIC_SUPABASE_ANON_KEY:',
    maskKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
  console.log(
    '  SUPABASE_SERVICE_ROLE_KEY:',
    maskKey(process.env.SUPABASE_SERVICE_ROLE_KEY)
  );

  // Show help if no options
  if (!options.timeline && !options.all) {
    console.log(`
History Timelines Generator
===========================

Usage:
  npm run generate -- --timeline "Timeline Name"
  npm run generate -- --all
  npm run generate -- --timeline "Timeline Name" --events-only
  npm run generate -- --timeline "Timeline Name" --people-only
  npm run generate -- --timeline "Timeline Name" --event-count 30 --person-count 15

Options:
  --timeline <name>      Generate a specific timeline
  --all                  Generate all available timelines
  --events-only          Only generate events (timeline must exist)
  --people-only          Only generate people (timeline and events must exist)
  --event-count <n>      Number of events to generate (default: 20)
  --person-count <n>     Number of people to generate (default: 10)

Available timelines:
${TIMELINE_SEEDS.map(s => `  - ${s.title}`).join('\n')}
`);
    return;
  }

  // Generate single timeline
  if (options.timeline) {
    await generateCompleteTimeline(options.timeline, options);
    return;
  }

  // Generate all timelines
  if (options.all) {
    console.log(`\n🚀 Generating all ${TIMELINE_SEEDS.length} timelines...\n`);
    
    for (let i = 0; i < TIMELINE_SEEDS.length; i++) {
      const seed = TIMELINE_SEEDS[i];
      console.log(`\n[${ i + 1}/${TIMELINE_SEEDS.length}] ${seed.title}`);
      
      await generateCompleteTimeline(seed.title, options);
      
      // Delay between timelines
      if (i < TIMELINE_SEEDS.length - 1) {
        console.log(`\n⏳ Waiting 5 seconds before next timeline...\n`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ ALL TIMELINES GENERATED`);
    console.log(`${'='.repeat(80)}\n`);
  }
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
