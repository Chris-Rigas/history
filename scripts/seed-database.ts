#!/usr/bin/env ts-node

/**
 * Database seeding script for initial setup
 * 
 * Usage:
 *   npm run seed
 */

import './load-env';
import { supabaseAdmin } from '@/lib/supabase';
import { TIMELINE_SEEDS, parseTimelineSeed } from './ingest';

/**
 * Check database connection
 */
async function checkConnection(): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.from('timelines').select('count').limit(1);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Clear all data from database (use with caution!)
 */
async function clearDatabase(): Promise<void> {
  console.log('🗑️  Clearing database...');
  
  // Delete in reverse order of dependencies
  await supabaseAdmin.from('event_people').delete().neq('event_id', '00000000-0000-0000-0000-000000000000');
  await supabaseAdmin.from('timeline_people').delete().neq('timeline_id', '00000000-0000-0000-0000-000000000000');
  await supabaseAdmin.from('timeline_events').delete().neq('timeline_id', '00000000-0000-0000-0000-000000000000');
  await supabaseAdmin.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabaseAdmin.from('people').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabaseAdmin.from('timelines').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log('✅ Database cleared');
}

/**
 * Seed timeline placeholders (without content)
 */
async function seedTimelinePlaceholders(): Promise<void> {
  console.log(`\n📝 Seeding ${TIMELINE_SEEDS.length} timeline placeholders...\n`);
  
  for (const seed of TIMELINE_SEEDS) {
    try {
      const timeline = parseTimelineSeed(seed);
      
      // Check if already exists
      const { data: existing } = await supabaseAdmin
        .from('timelines')
        .select('id')
        .eq('slug', timeline.slug)
        .single();
      
      if (existing) {
        console.log(`   ⏭️  Skipped: ${seed.title} (already exists)`);
        continue;
      }
      
      // Insert placeholder
      await supabaseAdmin.from('timelines').insert({
        title: timeline.title,
        slug: timeline.slug,
        start_year: timeline.start_year,
        end_year: timeline.end_year,
        region: timeline.region,
        summary: seed.summary || null,
      });
      
      console.log(`   ✅ Seeded: ${seed.title}`);
    } catch (error) {
      console.error(`   ❌ Error seeding ${seed.title}: ${error}`);
    }
  }
  
  console.log(`\n✅ Timeline placeholders seeded`);
}

/**
 * Show database statistics
 */
async function showStats(): Promise<void> {
  console.log(`\n${'='.repeat(80)}`);
  console.log('DATABASE STATISTICS');
  console.log(`${'='.repeat(80)}\n`);
  
  // Count timelines
  const { count: timelineCount } = await supabaseAdmin
    .from('timelines')
    .select('*', { count: 'exact', head: true });
  console.log(`Timelines: ${timelineCount || 0}`);
  
  // Count events
  const { count: eventCount } = await supabaseAdmin
    .from('events')
    .select('*', { count: 'exact', head: true });
  console.log(`Events: ${eventCount || 0}`);
  
  // Count people
  const { count: peopleCount } = await supabaseAdmin
    .from('people')
    .select('*', { count: 'exact', head: true });
  console.log(`People: ${peopleCount || 0}`);
  
  // Events by importance
  const { data: eventsByImportance } = await supabaseAdmin
    .from('events')
    .select('importance');
  
  const importanceCounts = { 1: 0, 2: 0, 3: 0 };
  eventsByImportance?.forEach((e: any) => {
    if (e.importance) {
      importanceCounts[e.importance as 1 | 2 | 3]++;
    }
  });
  
  console.log(`\nEvents by importance:`);
  console.log(`  - Notable (1): ${importanceCounts[1]}`);
  console.log(`  - Significant (2): ${importanceCounts[2]}`);
  console.log(`  - Major (3): ${importanceCounts[3]}`);
  
  // Timeline with most events
  const { data: timelinesWithEvents } = await supabaseAdmin
    .from('timelines')
    .select('title, timeline_events(count)');
  
  if (timelinesWithEvents && timelinesWithEvents.length > 0) {
    const sorted = timelinesWithEvents
      .map((t: any) => ({
        title: t.title,
        count: t.timeline_events?.[0]?.count || 0,
      }))
      .sort((a, b) => b.count - a.count);
    
    console.log(`\nTop timelines by event count:`);
    sorted.slice(0, 5).forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.title}: ${t.count} events`);
    });
  }
  
  console.log();
}

/**
 * Validate database schema
 */
async function validateSchema(): Promise<boolean> {
  console.log('🔍 Validating database schema...\n');
  
  const tables = ['timelines', 'events', 'people', 'timeline_events', 'event_people', 'timeline_people'];
  let allValid = true;
  
  for (const table of tables) {
    try {
      const { error } = await supabaseAdmin.from(table).select('*').limit(0);
      if (error) {
        console.error(`   ❌ Table '${table}' error: ${error.message}`);
        allValid = false;
      } else {
        console.log(`   ✅ Table '${table}' exists`);
      }
    } catch (error) {
      console.error(`   ❌ Table '${table}' not accessible`);
      allValid = false;
    }
  }
  
  console.log();
  return allValid;
}

/**
 * Main execution
 */
async function main() {
  console.log(`
${'='.repeat(80)}
History Timelines - Database Seeder
${'='.repeat(80)}
`);

  // Check connection
  console.log('🔌 Checking database connection...');
  const connected = await checkConnection();
  if (!connected) {
    console.error('❌ Failed to connect to database');
    console.error('Please check your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }
  console.log('✅ Connected to database\n');

  // Validate schema
  const schemaValid = await validateSchema();
  if (!schemaValid) {
    console.error('❌ Database schema is invalid');
    console.error('Please run the schema.sql file first');
    process.exit(1);
  }

  // Parse command line args
  const args = process.argv.slice(2);
  const shouldClear = args.includes('--clear');
  const shouldSeed = args.includes('--seed') || args.length === 0;
  const shouldStats = args.includes('--stats') || args.length === 0;

  // Clear database if requested
  if (shouldClear) {
    console.log('\n⚠️  WARNING: This will delete all data!');
    await new Promise(resolve => setTimeout(resolve, 2000));
    await clearDatabase();
  }

  // Seed placeholders if requested
  if (shouldSeed) {
    await seedTimelinePlaceholders();
  }

  // Show stats
  if (shouldStats) {
    await showStats();
  }

  console.log(`${'='.repeat(80)}`);
  console.log('✅ SEEDING COMPLETE');
  console.log(`${'='.repeat(80)}\n`);
  
  console.log('Next steps:');
  console.log('  1. Run: npm run generate -- --timeline "Aztec Empire"');
  console.log('  2. Or run: npm run generate -- --all (to generate all timelines)');
  console.log();
}

// Run the script
main().catch(error => {
  console.error(`\n❌ Fatal error: ${error}`);
  process.exit(1);
});
