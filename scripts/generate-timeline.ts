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

import { getTimelineSeed, TIMELINE_SEEDS } from './ingest';
import { generateTimeline } from './generators/timeline-generator';
import { generateTimelineEvents } from './generators/event-generator';
import { generateTimelinePeople } from './generators/person-generator';
import { getTimelineBySlug } from '@/lib/queries/timelines';
import { getEventsByTimelineId } from '@/lib/queries/events';

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
    let timelineId: string | undefined;

    // Step 1: Generate timeline (unless events/people only)
    if (!options.eventsOnly && !options.peopleOnly) {
      console.log(`\n${'─'.repeat(80)}`);
      console.log('STEP 1: Generating Timeline');
      console.log(`${'─'.repeat(80)}`);
      
      const timelineResult = await generateTimeline(seed);
      if (!timelineResult.success) {
        throw new Error(timelineResult.error);
      }
      timelineId = timelineResult.timelineId;
    } else {
      // Find existing timeline
      const timeline = await getTimelineBySlug(seed.slug || '');
      if (!timeline) {
        throw new Error('Timeline not found. Run without --events-only or --people-only first.');
      }
      timelineId = timeline.id;
    }

    if (!timelineId) {
      throw new Error('Failed to get timeline ID');
    }

    // Get timeline data
    const timeline = await getTimelineBySlug(seed.slug || '');
    if (!timeline) {
      throw new Error('Timeline not found after creation');
    }

    // Step 2: Generate events (unless people-only)
    let events: any[] = [];
    if (!options.peopleOnly) {
      console.log(`\n${'─'.repeat(80)}`);
      console.log('STEP 2: Generating Events');
      console.log(`${'─'.repeat(80)}`);

      const eventCount = options.eventCount || seed.eventCount || 20;
      const eventsResult = await generateTimelineEvents(timeline, eventCount, {
        delayMs: 2000,
        onProgress: (current, total, event) => {
          console.log(`\n   [${current}/${total}] ${event}`);
        },
      });

      if (!eventsResult.success) {
        console.error(`⚠️  Events generation completed with errors`);
      }

      // Get generated events
      events = await getEventsByTimelineId(timelineId);
    } else {
      // Load existing events
      events = await getEventsByTimelineId(timelineId);
    }

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
    console.log(`Timeline ID: ${timelineId}`);
    console.log(`URL: /timelines/${seed.slug || ''}`);
    console.log();

  } catch (error) {
    console.error(`\n❌ GENERATION FAILED: ${error}`);
    console.log();
    process.exit(1);
  }
}

/**
 * Main execution
 */
async function main() {
  const options = parseArgs();

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
  console.error(`\n❌ Fatal error: ${error}`);
  process.exit(1);
});
