import type { SupabaseClient } from '@supabase/supabase-js';

import { supabaseClient, supabaseAdmin } from '../supabase';
import type {
  Database,
  Timeline,
  TimelineInsert,
  TimelineUpdate,
  TimelineWithEvents,
  TimelineWithPeople,
  TimelineFull,
  Event,
  Person,
  TimelineSource,
  TimelineSourceInsert,
  TimelineMetadata,
  TimelineMetadataInsert,
} from '../database.types';
import type { Json } from '../database.types';

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
      position,
      events (*)
    `)
    .eq('timeline_id', timeline.id)
    .order('position', { ascending: true, nullsFirst: false });

  if (error) throw error;

  // Extract events from the joined data and sort by year for consistency
  const events = ((eventData || []) as Array<{
    position?: number | null;
    events?: Event | null;
  }>)
    .map(row => ({
      position: row.position ?? null,
      event: row.events ?? null,
    }))
    .filter(item => item.event)
    .sort((a, b) => {
      const positionA = a.position ?? Number.MAX_SAFE_INTEGER;
      const positionB = b.position ?? Number.MAX_SAFE_INTEGER;
      if (positionA !== positionB) {
        return positionA - positionB;
      }

      const yearA = a.event?.start_year ?? Number.MAX_SAFE_INTEGER;
      const yearB = b.event?.start_year ?? Number.MAX_SAFE_INTEGER;
      if (yearA !== yearB) {
        return yearA - yearB;
      }

      const titleA = a.event?.title ?? '';
      const titleB = b.event?.title ?? '';
      return titleA.localeCompare(titleB);
    })
    .map(item => item.event as Event);

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
      people (*)
    `)
    .eq('timeline_id', timeline.id)
    .order('name', { ascending: true, foreignTable: 'people' });

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
 * Get stored citation sources for a timeline
 */
export async function getTimelineSources(
  timelineId: string,
  options?: QueryOptions
): Promise<TimelineSource[]> {
  const client = getClient(options);

  const { data, error } = await client
    .from('timeline_sources')
    .select('*')
    .eq('timeline_id', timelineId)
    .order('number', { ascending: true });

  if (error) {
    // Handle deployments where the optional timeline_sources table has not been
    // created yet. Supabase returns PGRST205 when a table is missing from the
    // schema cache, so in that case we silently fall back to returning no
    // sources rather than surfacing an exception that prevents generation.
    if (error.code === 'PGRST205') {
      console.warn(
        'timeline_sources table not found; skipping citation retrieval. '
          + 'Run the latest database migrations if you need citation support.'
      );
      return [];
    }

    throw error;
  }

  return (data as TimelineSource[]) || [];
}

/**
 * Get stored metadata for a timeline (if available)
 */
export async function getTimelineMetadata(
  timelineId: string,
  options?: QueryOptions
): Promise<TimelineMetadata | null> {
  const client = getClient(options);

  const { data, error } = await client
    .from('timeline_metadata')
    .select('*')
    .eq('timeline_id', timelineId)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    if (error.code === 'PGRST205') {
      console.warn(
        'timeline_metadata table not found; skipping metadata retrieval. '
          + 'Run the latest database migrations if you need metadata support.'
      );
      return null;
    }

    throw error;
  }

  return (data as TimelineMetadata) ?? null;
}

/**
 * Payload for storing timeline metadata details
 */
export interface TimelineMetadataPayload {
  seoTitle?: string | null;
  metaDescription?: string | null;
  relatedKeywords?: string[] | null;
  initialUnderstanding?: string | null;
  researchDigest?: string | null;
  uniqueSources?: Json | null;
  primarySources?: Json | null;
  totalSources?: number | null;
  structuredContent?: Json | null;
  researchCorpus?: Json | null;
  skeleton?: Json | null;
  enrichment?: Json | null;
}

/**
 * Upsert metadata for a timeline
 */
export async function upsertTimelineMetadata(
  timelineId: string,
  payload: TimelineMetadataPayload
): Promise<void> {
  const record: TimelineMetadataInsert = {
    timeline_id: timelineId,
    seo_title: payload.seoTitle ?? null,
    meta_description: payload.metaDescription ?? null,
    related_keywords: payload.relatedKeywords ?? null,
    initial_understanding: payload.initialUnderstanding ?? null,
    research_digest: payload.researchDigest ?? null,
    unique_sources: payload.uniqueSources ?? null,
    primary_sources: payload.primarySources ?? null,
    total_sources: payload.totalSources ?? null,
    structured_content: payload.structuredContent ?? null,
    research_corpus: payload.researchCorpus ?? null,
    skeleton: payload.skeleton ?? null,
    enrichment: payload.enrichment ?? null,
  };

  const { error } = await supabaseAdmin
    .from('timeline_metadata')
    .upsert(record, { onConflict: 'timeline_id' });

  if (error) {
    if (error.code === 'PGRST205') {
      console.warn(
        'timeline_metadata table not found; skipping metadata storage. '
          + 'Run the latest database migrations if you need metadata support.'
      );
      return;
    }

    throw error;
  }
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

  const sources = await getTimelineSources(timelineWithEvents.id, options);
  const metadata = await getTimelineMetadata(timelineWithEvents.id, options);

  return {
    ...timelineWithEvents,
    people: timelineWithPeople.people,
    sources,
    metadata: metadata ?? null,
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
      position,
      events (*)
    `)
    .eq('timeline_id', timelineId)
    .order('position', { ascending: true, nullsFirst: false });

  if (error) throw error;

  const events = ((data || []) as Array<{
    position?: number | null;
    events?: Event | null;
  }>)
    .map(row => ({
      position: row.position ?? null,
      event: row.events ?? null,
    }))
    .filter(item => item.event)
    .sort((a, b) => {
      const positionA = a.position ?? Number.MAX_SAFE_INTEGER;
      const positionB = b.position ?? Number.MAX_SAFE_INTEGER;
      if (positionA !== positionB) {
        return positionA - positionB;
      }

      const yearA = a.event?.start_year ?? Number.MAX_SAFE_INTEGER;
      const yearB = b.event?.start_year ?? Number.MAX_SAFE_INTEGER;
      if (yearA !== yearB) {
        return yearA - yearB;
      }

      const titleA = a.event?.title ?? '';
      const titleB = b.event?.title ?? '';
      return titleA.localeCompare(titleB);
    })
    .map(item => item.event as Event)
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
 * Replace timeline citation sources
 */
export async function replaceTimelineSources(
  timelineId: string,
  sources: TimelineSourceInsert[]
): Promise<void> {
  const { error: deleteError } = await supabaseAdmin
    .from('timeline_sources')
    .delete()
    .eq('timeline_id', timelineId);

  if (deleteError) {
    if (deleteError.code === 'PGRST205') {
      console.warn(
        'timeline_sources table not found; skipping citation storage. '
          + 'Run the latest database migrations if you need citation support.'
      );
      return;
    }

    throw deleteError;
  }

  if (sources.length === 0) {
    return;
  }

  const payload = sources.map(source => ({
    timeline_id: timelineId,
    number: source.number,
    source: source.source,
    url: source.url,
  }));

  const { error } = await supabaseAdmin
    .from('timeline_sources')
    .insert(payload);

  if (error) {
    if (error.code === 'PGRST205') {
      console.warn(
        'timeline_sources table not found; skipping citation storage. '
          + 'Run the latest database migrations if you need citation support.'
      );
      return;
    }

    throw error;
  }
}

/**
 * Link an event to a timeline
 */
export async function linkEventToTimeline(
  timelineId: string,
  eventId: string
): Promise<void> {
  const { data: existingRows, error: existingError } = await supabaseAdmin
    .from('timeline_events')
    .select('position')
    .eq('timeline_id', timelineId);

  if (existingError) throw existingError;

  const positions = (existingRows || [])
    .map(row => row.position)
    .filter((value): value is number => typeof value === 'number');

  const nextPosition = positions.length > 0
    ? Math.max(...positions) + 1
    : ((existingRows?.length ?? 0) + 1);

  const { error } = await supabaseAdmin
    .from('timeline_events')
    .insert({
      timeline_id: timelineId,
      event_id: eventId,
      position: nextPosition,
    });

  if (error) throw error;
}

/**
 * Link a person to a timeline
 */
export async function linkPersonToTimeline(
  timelineId: string,
  personId: string,
  role?: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('timeline_people')
    .insert({
      timeline_id: timelineId,
      person_id: personId,
      role,
    });

  if (error) throw error;
}
