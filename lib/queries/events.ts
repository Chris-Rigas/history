import type { SupabaseClient } from '@supabase/supabase-js';

import { supabaseClient, supabaseAdmin } from '../supabase';
import type {
  Event,
  EventInsert,
  EventUpdate,
  EventWithPeople,
  EventWithTimeline,
  Person,
  Timeline,
} from '../database.types';

/**
 * Get an event by slug
 */
export async function getEventBySlug(slug: string): Promise<Event | null> {
  const { data, error } = await supabaseClient
    .from('events')
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
 * Get an event with its associated people
 */
export async function getEventWithPeople(slug: string): Promise<EventWithPeople | null> {
  const event = await getEventBySlug(slug);
  if (!event) return null;

  const { data: peopleData, error } = await supabaseClient
    .from('event_people')
    .select(`
      role,
      people (*)
    `)
    .eq('event_id', event.id);

  if (error) throw error;

  const people = (peopleData || [])
    .map(ep => ep.people as Person)
    .filter(Boolean);

  return {
    ...event,
    people,
  };
}

/**
 * Get an event with its parent timeline (for a specific timeline context)
 */
export async function getEventWithTimeline(
  eventSlug: string,
  timelineSlug: string
): Promise<EventWithTimeline | null> {
  const event = await getEventBySlug(eventSlug);
  if (!event) return null;

  const { data: timelineData, error } = await supabaseClient
    .from('timeline_events')
    .select(`
      timelines (*)
    `)
    .eq('event_id', event.id);

  if (error) throw error;

  // Find the specific timeline by slug
  const timeline = (timelineData || [])
    .map(te => te.timelines as Timeline)
    .filter(Boolean)
    .find(t => t.slug === timelineSlug);

  if (!timeline) return null;

  return {
    ...event,
    timeline,
  };
}

/**
 * Get events for a specific timeline (by timeline ID)
 */
type QueryClient = SupabaseClient<Database>;

interface QueryOptions {
  client?: QueryClient;
  limit?: number;
  importance?: number;
  type?: string;
  tags?: string[];
}

function getClient(options?: QueryOptions) {
  return options?.client ?? supabaseClient;
}

export async function getEventsByTimelineId(
  timelineId: string,
  options?: QueryOptions
): Promise<Event[]> {
  const client = getClient(options);

  let query = client
    .from('timeline_events')
    .select(`
      display_order,
      events (*)
    `)
    .eq('timeline_id', timelineId);

  const { data, error } = await query.order('display_order', { ascending: true });

  if (error) throw error;

  let events = (data || [])
    .map(te => te.events as Event)
    .filter(Boolean);

  // Apply filters if provided
  if (options?.importance) {
    events = events.filter(e => e.importance === options.importance);
  }

  if (options?.type) {
    events = events.filter(e => e.type === options.type);
  }

  if (options?.tags && options.tags.length > 0) {
    events = events.filter(e => 
      options.tags!.some(tag => e.tags.includes(tag))
    );
  }

  if (options?.limit) {
    events = events.slice(0, options.limit);
  }

  return events;
}

/**
 * Get neighboring events (before and after) for an event in a timeline
 */
export async function getNeighborEvents(
  eventId: string,
  timelineId: string,
  beforeCount: number = 3,
  afterCount: number = 3
): Promise<{ before: Event[]; after: Event[] }> {
  // Get the event's display order
  const { data: currentEventData, error: currentError } = await supabaseClient
    .from('timeline_events')
    .select('display_order')
    .eq('timeline_id', timelineId)
    .eq('event_id', eventId)
    .single();

  if (currentError) throw currentError;

  const currentOrder = currentEventData?.display_order || 0;

  // Get events before
  const { data: beforeData, error: beforeError } = await supabaseClient
    .from('timeline_events')
    .select(`
      display_order,
      events (*)
    `)
    .eq('timeline_id', timelineId)
    .lt('display_order', currentOrder)
    .order('display_order', { ascending: false })
    .limit(beforeCount);

  if (beforeError) throw beforeError;

  // Get events after
  const { data: afterData, error: afterError } = await supabaseClient
    .from('timeline_events')
    .select(`
      display_order,
      events (*)
    `)
    .eq('timeline_id', timelineId)
    .gt('display_order', currentOrder)
    .order('display_order', { ascending: true })
    .limit(afterCount);

  if (afterError) throw afterError;

  const before = (beforeData || [])
    .map(te => te.events as Event)
    .filter(Boolean)
    .reverse(); // Reverse to get chronological order

  const after = (afterData || [])
    .map(te => te.events as Event)
    .filter(Boolean);

  return { before, after };
}

/**
 * Create a new event (admin/generation only)
 */
export async function createEvent(event: EventInsert): Promise<Event> {
  const { data, error } = await supabaseAdmin
    .from('events')
    .insert(event)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an event (admin/generation only)
 */
export async function updateEvent(id: string, updates: EventUpdate): Promise<Event> {
  const { data, error } = await supabaseAdmin
    .from('events')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Link a person to an event
 */
export async function linkPersonToEvent(
  eventId: string,
  personId: string,
  role?: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('event_people')
    .insert({
      event_id: eventId,
      person_id: personId,
      role,
    });

  if (error) throw error;
}

/**
 * Get events by year range
 */
export async function getEventsByYearRange(
  startYear: number,
  endYear: number
): Promise<Event[]> {
  const { data, error } = await supabaseClient
    .from('events')
    .select('*')
    .gte('start_year', startYear)
    .lte('start_year', endYear)
    .order('start_year', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Get events by tags
 */
export async function getEventsByTags(tags: string[]): Promise<Event[]> {
  const { data, error } = await supabaseClient
    .from('events')
    .select('*')
    .overlaps('tags', tags)
    .order('start_year', { ascending: true });

  if (error) throw error;
  return data || [];
}
