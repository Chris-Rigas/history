import { generatePersonBio, generatePeopleOutline } from '@/lib/openai';
import { createPerson } from '@/lib/queries/people';
import { linkPersonToTimeline } from '@/lib/queries/timelines';
import { linkPersonToEvent as linkToEvent } from '@/lib/queries/events';
import { slugify } from '@/lib/utils';
import type { Timeline, Event } from '@/lib/database.types';
import { serializeError, summarizeError } from '../utils/error';

/**
 * Generate people outline for a timeline
 */
export async function generatePeopleOutline(
  timeline: Timeline,
  events: Event[],
  personCount: number = 10
): Promise<Array<{
  name: string;
  birthYear?: number;
  deathYear?: number;
  role: string;
}>> {
  console.log(`\n👥 Generating people outline for: ${timeline.title}`);
  console.log(`   Requested people: ${personCount}`);

  try {
    const outline = await generatePeopleOutline({
      timelineTitle: timeline.title,
      startYear: timeline.start_year,
      endYear: timeline.end_year,
      events: events.map(e => ({ title: e.title, year: e.start_year })),
      personCount,
    });

    console.log(`   ✅ Generated ${outline.length} people`);
    return outline;
  } catch (error) {
    const message = summarizeError(error);
    console.error(`   ❌ Error generating outline: ${message}`);

    const details = serializeError(error);
    if (details) {
      console.error('   ℹ️  Full error details:', details);
    }

    return [];
  }
}

/**
 * Generate detailed biography for a single person
 */
export async function generatePerson(params: {
  name: string;
  birthYear?: number;
  deathYear?: number;
  role: string;
  timeline: Timeline;
  relatedEvents?: Event[];
}): Promise<{
  success: boolean;
  personId?: string;
  error?: string;
}> {
  const { name, birthYear, deathYear, role, timeline, relatedEvents } = params;

  try {
    console.log(`   👤 Generating person: ${name}`);

    // Generate biography
    const bio = await generatePersonBio({
      name,
      birthYear,
      deathYear,
      timelineContext: timeline.summary || timeline.title,
      relatedEvents: relatedEvents?.map(e => ({ title: e.title, year: e.start_year })),
    });

    // Create person record
    const person = await createPerson({
      name,
      slug: slugify(name),
      birth_year: birthYear || null,
      death_year: deathYear || null,
      bio_short: bio.bioShort,
      bio_long: bio.bioLong,
    });

    // Link to timeline
    await linkPersonToTimeline(timeline.id, person.id, bio.role);

    console.log(`      ✅ Person created: ${person.id}`);

    return {
      success: true,
      personId: person.id,
    };
  } catch (error) {
    const message = summarizeError(error);
    console.error(`      ❌ Error generating person: ${message}`);

    const details = serializeError(error);
    if (details) {
      console.error('      ℹ️  Full error details:', details);
    }

    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Generate all people for a timeline
 */
export async function generateTimelinePeople(
  timeline: Timeline,
  events: Event[],
  personCount: number = 10,
  options?: {
    delayMs?: number;
    onProgress?: (current: number, total: number, person: string) => void;
  }
): Promise<{
  success: boolean;
  peopleIds: string[];
  errors: Array<{ person: string; error: string }>;
}> {
  console.log(`\n👥 Generating people for: ${timeline.title}`);
  
  const peopleIds: string[] = [];
  const errors: Array<{ person: string; error: string }> = [];
  const delayMs = options?.delayMs || 2000; // Rate limiting

  try {
    // First, generate outline
    const outline = await generatePeopleOutline(timeline, events, personCount);

    if (outline.length === 0) {
      throw new Error('Failed to generate people outline');
    }

    // Then generate each person
    for (let i = 0; i < outline.length; i++) {
      const personOutline = outline[i];
      
      if (options?.onProgress) {
        options.onProgress(i + 1, outline.length, personOutline.name);
      }

      // Find related events (events from similar time period)
      const relatedEvents = events.filter(event => {
        if (!personOutline.birthYear || !personOutline.deathYear) return true;
        return event.start_year >= personOutline.birthYear && 
               event.start_year <= personOutline.deathYear;
      }).slice(0, 5); // Limit to 5 most relevant

      const result = await generatePerson({
        name: personOutline.name,
        birthYear: personOutline.birthYear,
        deathYear: personOutline.deathYear,
        role: personOutline.role,
        timeline,
        relatedEvents,
      });

      if (result.success && result.personId) {
        peopleIds.push(result.personId);
        
        // Link person to related events
        for (const event of relatedEvents) {
          try {
            await linkToEvent(event.id, result.personId, personOutline.role);
          } catch (err) {
            const linkError = summarizeError(err);
            console.error(`      ⚠️  Failed to link to event ${event.title}: ${linkError}`);

            const details = serializeError(err);
            if (details) {
              console.error('      ℹ️  Link error details:', details);
            }
          }
        }
      } else {
        errors.push({
          person: personOutline.name,
          error: result.error || 'Unknown error',
        });
      }

      // Delay between requests
      if (i < outline.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    console.log(`\n✅ Generated ${peopleIds.length} people`);
    if (errors.length > 0) {
      console.log(`⚠️  ${errors.length} people failed`);
    }

    return {
      success: true,
      peopleIds,
      errors,
    };
  } catch (error) {
    const message = summarizeError(error);
    console.error(`❌ Error generating timeline people: ${message}`);

    const details = serializeError(error);
    if (details) {
      console.error('ℹ️  Full error details:', details);
    }

    return {
      success: false,
      peopleIds,
      errors: [
        ...errors,
        { person: 'Timeline people', error: message }
      ],
    };
  }
}

/**
 * Regenerate biography for an existing person
 */
export async function regeneratePerson(
  personId: string,
  timeline: Timeline,
  relatedEvents?: Event[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get existing person
    const { supabaseClient } = await import('@/lib/supabase');
    const { data: person } = await supabaseClient
      .from('people')
      .select('*')
      .eq('id', personId)
      .single();

    if (!person) {
      throw new Error('Person not found');
    }

    console.log(`\n🔄 Regenerating person: ${person.name}`);

    // Generate new biography
    const bio = await generatePersonBio({
      name: person.name,
      birthYear: person.birth_year || undefined,
      deathYear: person.death_year || undefined,
      timelineContext: timeline.summary || timeline.title,
      relatedEvents: relatedEvents?.map(e => ({ title: e.title, year: e.start_year })),
    });

    // Update person
    const { supabaseAdmin } = await import('@/lib/supabase');
    await supabaseAdmin
      .from('people')
      .update({
        bio_short: bio.bioShort,
        bio_long: bio.bioLong,
        updated_at: new Date().toISOString(),
      })
      .eq('id', personId);

    console.log(`   ✅ Person regenerated`);

    return { success: true };
  } catch (error) {
    const message = summarizeError(error);
    console.error(`   ❌ Error regenerating person: ${message}`);

    const details = serializeError(error);
    if (details) {
      console.error('   ℹ️  Full error details:', details);
    }

    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Link people to events based on time periods and relevance
 */
export async function linkPeopleToEvents(
  peopleIds: string[],
  events: Event[]
): Promise<void> {
  console.log(`\n🔗 Linking people to events...`);
  
  const { supabaseClient } = await import('@/lib/supabase');
  
  for (const personId of peopleIds) {
    // Get person details
    const { data: person } = await supabaseClient
      .from('people')
      .select('*')
      .eq('id', personId)
      .single();

    if (!person) continue;

    // Find relevant events based on time period
    const relevantEvents = events.filter(event => {
      if (!person.birth_year || !person.death_year) return false;
      return event.start_year >= person.birth_year && 
             event.start_year <= person.death_year;
    });

    // Link to events
    for (const event of relevantEvents) {
      try {
        await linkToEvent(event.id, personId);
      } catch (err) {
        // Ignore duplicate errors
      }
    }
  }
  
  console.log(`   ✅ People linked to events`);
}

/**
 * Get person statistics for a timeline
 */
export async function getPersonStats(timelineId: string): Promise<{
  total: number;
  withBirthDates: number;
  withDeathDates: number;
  averageLifespan: number | null;
}> {
  const { supabaseClient } = await import('@/lib/supabase');
  
  const { data: people } = await supabaseClient
    .from('timeline_people')
    .select('people!inner(*)')
    .eq('timeline_id', timelineId);

  const total = people?.length || 0;
  let withBirthDates = 0;
  let withDeathDates = 0;
  let lifespans: number[] = [];

  people?.forEach((tp: any) => {
    const person = tp.people;
    if (person.birth_year) withBirthDates++;
    if (person.death_year) withDeathDates++;
    if (person.birth_year && person.death_year) {
      lifespans.push(person.death_year - person.birth_year);
    }
  });

  const averageLifespan = lifespans.length > 0
    ? Math.round(lifespans.reduce((a, b) => a + b, 0) / lifespans.length)
    : null;

  return { total, withBirthDates, withDeathDates, averageLifespan };
}
