import { supabaseClient, supabaseAdmin } from '../supabase';
import type {
  Person,
  PersonInsert,
  PersonUpdate,
  PersonWithEvents,
  PersonWithTimeline,
  Event,
  Timeline,
} from '../database.types';

/**
 * Get a person by slug
 */
export async function getPersonBySlug(slug: string): Promise<Person | null> {
  const { data, error } = await supabaseClient
    .from('people')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return data;
}

/**
 * Get a person with all events they're involved in
 */
export async function getPersonWithEvents(slug: string): Promise<PersonWithEvents | null> {
  const person = await getPersonBySlug(slug);
  if (!person) return null;

  const { data: eventData, error } = await supabaseClient
    .from('event_people')
    .select(`
      role,
      events (*)
    `)
    .eq('person_id', person.id);

  if (error) throw error;

  const events = (eventData || [])
    .map(ep => ep.events as Event)
    .filter(Boolean)
    .sort((a, b) => a.start_year - b.start_year); // Sort chronologically

  return {
    ...person,
    events,
  };
}

/**
 * Get a person with their parent timeline (for timeline-specific context)
 */
export async function getPersonWithTimeline(
  personSlug: string,
  timelineSlug: string
): Promise<PersonWithTimeline | null> {
  const person = await getPersonBySlug(personSlug);
  if (!person) return null;

  const { data: timelineData, error } = await supabaseClient
    .from('timeline_people')
    .select(`
      role,
      timelines (*)
    `)
    .eq('person_id', person.id);

  if (error) throw error;

  // Find the specific timeline by slug
  const timeline = (timelineData || [])
    .map(tp => tp.timelines as Timeline)
    .filter(Boolean)
    .find(t => t.slug === timelineSlug);

  if (!timeline) return null;

  return {
    ...person,
    timeline,
  };
}

/**
 * Get people for a specific timeline (by timeline ID)
 */
export async function getPeopleByTimelineId(timelineId: string): Promise<Person[]> {
  const { data, error } = await supabaseClient
    .from('timeline_people')
    .select(`
      role,
      people (*)
    `)
    .eq('timeline_id', timelineId)
    .order('name', { ascending: true, foreignTable: 'people' });

  if (error) throw error;

  const people = (data || [])
    .map(tp => tp.people as Person)
    .filter(Boolean);

  return people;
}

/**
 * Get people involved in a specific event
 */
export async function getPeopleByEventId(eventId: string): Promise<Person[]> {
  const { data, error } = await supabaseClient
    .from('event_people')
    .select(`
      role,
      people (*)
    `)
    .eq('event_id', eventId);

  if (error) throw error;

  const people = (data || [])
    .map(ep => ep.people as Person)
    .filter(Boolean);

  return people;
}

/**
 * Get a person-centric timeline showing events they were involved in
 * within a specific timeline context
 */
export async function getPersonTimelineEvents(
  personId: string,
  timelineId: string
): Promise<Event[]> {
  // Get all events the person was involved in
  const { data: personEventData, error: personError } = await supabaseClient
    .from('event_people')
    .select(`
      events (*)
    `)
    .eq('person_id', personId);

  if (personError) throw personError;

  const personEvents = (personEventData || [])
    .map(ep => ep.events as Event)
    .filter(Boolean);

  // Get all events in the timeline
  const { data: timelineEventData, error: timelineError } = await supabaseClient
    .from('timeline_events')
    .select(`
      event_id
    `)
    .eq('timeline_id', timelineId);

  if (timelineError) throw timelineError;

  const timelineEventIds = new Set(
    (timelineEventData || []).map(te => te.event_id)
  );

  // Filter person events to only those in the timeline, and sort chronologically
  const filteredEvents = personEvents
    .filter(event => timelineEventIds.has(event.id))
    .sort((a, b) => a.start_year - b.start_year);

  return filteredEvents;
}

/**
 * Create a new person (admin/generation only)
 */
export async function createPerson(person: PersonInsert): Promise<Person> {
  const { data, error } = await supabaseAdmin
    .from('people')
    .insert(person)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a person (admin/generation only)
 */
export async function updatePerson(id: string, updates: PersonUpdate): Promise<Person> {
  const { data, error } = await supabaseAdmin
    .from('people')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get all people (for listing purposes)
 */
export async function getAllPeople(): Promise<Person[]> {
  const { data, error } = await supabaseClient
    .from('people')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Search people by name
 */
export async function searchPeopleByName(searchTerm: string): Promise<Person[]> {
  const { data, error } = await supabaseClient
    .from('people')
    .select('*')
    .ilike('name', `%${searchTerm}%`)
    .order('name', { ascending: true })
    .limit(20);

  if (error) throw error;
  return data || [];
}

/**
 * Get people by birth year range
 */
export async function getPeopleByBirthYearRange(
  startYear: number,
  endYear: number
): Promise<Person[]> {
  const { data, error } = await supabaseClient
    .from('people')
    .select('*')
    .gte('birth_year', startYear)
    .lte('birth_year', endYear)
    .order('birth_year', { ascending: true });

  if (error) throw error;
  return data || [];
}
