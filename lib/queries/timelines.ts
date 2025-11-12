import type { SupabaseClient } from '@supabase/supabase-js';

import { supabaseClient, supabaseAdmin } from '../supabase';
import type {
  Timeline,
  TimelineInsert,
  TimelineUpdate,
  TimelineWithEvents,
  TimelineWithPeople,
  TimelineFull,
  Event,
  Person,
} from '../database.types';

/**
 * Get all timelines (for listing/browse pages)
 */
export async function getAllTimelines(): Promise<Timeline[]> {
  const { data, error } = await supabaseClient
    .from('timelines')
    .select('*')
    .order('start_year', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Get a timeline by slug
 */
type QueryClient = SupabaseClient<Database>;

interface QueryOptions {
  client?: QueryClient;
}

function getClient(options?: QueryOptions) {
  return options?.client ?? supabaseClient;
}

export async function getTimelineBySlug(
  slug: string,
  options?: QueryOptions
): Promise<Timeline | null> {
  const client = getClient(options);

  const { data, error } = await client
    .from('timelines')
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
 * Get a timeline with all its events (ordered by year)
 */
export async function getTimelineWithEvents(
  slug: string,
  options?: QueryOptions
): Promise<TimelineWithEvents | null> {
  // First get the timeline
  const timeline = await getTimelineBySlug(slug, options);
  if (!timeline) return null;

  // Then get its events through the join table
  const client = getClient(options);

  const { data: eventData, error } = await client
    .from('timeline_events')
    .select(`
      display_order,
      events (*)
    `)
    .eq('timeline_id', timeline.id)
    .order('display_order', { ascending: true });

  if (error) throw error;

  // Extract events from the joined data and sort by year if no display_order
  const events = (eventData || [])
    .map(te => te.events as Event)
    .filter(Boolean)
    .sort((a, b) => a.start_year - b.start_year);

  return {
    ...timeline,
    events,
  };
}

/**
 * Get a timeline with its key people
 */
export async function getTimelineWithPeople(
  slug: string,
  options?: QueryOptions
): Promise<TimelineWithPeople | null> {
  const timeline = await getTimelineBySlug(slug, options);
  if (!timeline) return null;

  const client = getClient(options);

  const { data: peopleData, error } = await client
    .from('timeline_people')
    .select(`
      role,
      display_order,
      people (*)
    `)
    .eq('timeline_id', timeline.id)
    .order('display_order', { ascending: true });

  if (error) throw error;

  const people = (peopleData || [])
    .map(tp => tp.people as Person)
    .filter(Boolean);

  return {
    ...timeline,
    people,
  };
}

/**
 * Get a timeline with all related data (events and people)
 */
export async function getTimelineFull(
  slug: string,
  options?: QueryOptions
): Promise<TimelineFull | null> {
  const timelineWithEvents = await getTimelineWithEvents(slug, options);
  if (!timelineWithEvents) return null;

  const timelineWithPeople = await getTimelineWithPeople(slug, options);
  if (!timelineWithPeople) return null;

  return {
    ...timelineWithEvents,
    people: timelineWithPeople.people,
  };
}

/**
 * Get highlight events for a timeline (importance = 3)
 */
export async function getTimelineHighlightEvents(
  timelineId: string,
  limit: number = 8,
  options?: QueryOptions
): Promise<Event[]> {
  const client = getClient(options);

  const { data, error } = await client
    .from('timeline_events')
    .select(`
      events (*)
    `)
    .eq('timeline_id', timelineId)
    .order('display_order', { ascending: true });

  if (error) throw error;

  const events = (data || [])
    .map(te => te.events as Event)
    .filter(Boolean)
    .filter(event => event.importance === 3)
    .slice(0, limit);

  return events;
}

/**
 * Create a new timeline (admin/generation only)
 */
export async function createTimeline(timeline: TimelineInsert): Promise<Timeline> {
  const { data, error } = await supabaseAdmin
    .from('timelines')
    .insert(timeline)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a timeline (admin/generation only)
 */
export async function updateTimeline(
  id: string,
  updates: TimelineUpdate
): Promise<Timeline> {
  const { data, error } = await supabaseAdmin
    .from('timelines')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Link an event to a timeline
 */
export async function linkEventToTimeline(
  timelineId: string,
  eventId: string,
  displayOrder?: number
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('timeline_events')
    .insert({
      timeline_id: timelineId,
      event_id: eventId,
      display_order: displayOrder,
    });

  if (error) throw error;
}

/**
 * Link a person to a timeline
 */
export async function linkPersonToTimeline(
  timelineId: string,
  personId: string,
  role?: string,
  displayOrder?: number
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('timeline_people')
    .insert({
      timeline_id: timelineId,
      person_id: personId,
      role,
      display_order: displayOrder,
    });

  if (error) throw error;
}
