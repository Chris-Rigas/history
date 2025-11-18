import { generateEventContent, generateEventOutline } from '@/lib/openai';
import { createEvent } from '@/lib/queries/events';
import { linkEventToTimeline } from '@/lib/queries/timelines';
import { slugify } from '@/lib/utils';
import type { Timeline } from '@/lib/database.types';
import { stripTimelineFormatting } from '@/lib/timelines/formatting';
import { serializeError, summarizeError } from '../utils/error';

/**
 * Generate events outline for a timeline
 */
export async function generateEventsOutline(
  timeline: Timeline,
  eventCount: number = 20
): Promise<Array<{ title: string; year: number; importance: number }>> {
  console.log(`\n📝 Generating events outline for: ${timeline.title}`);
  console.log(`   Requested events: ${eventCount}`);

  try {
    const outline = await generateEventOutline({
      timelineTitle: timeline.title,
      startYear: timeline.start_year,
      endYear: timeline.end_year,
      region: timeline.region || undefined,
      eventCount,
    });

    console.log(`   ✅ Generated ${outline.length} events`);
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
 * Generate detailed content for a single event
 */
export async function generateEvent(params: {
  title: string;
  year: number;
  importance: number;
  timeline: Timeline;
  existingEvents?: Array<{ title: string; year: number }>;
}): Promise<{
  success: boolean;
  eventId?: string;
  error?: string;
}> {
  const { title, year, importance, timeline, existingEvents } = params;

  try {
    console.log(`   📅 Generating event: ${title} (${year})`);

    // Generate content
    const content = await generateEventContent({
      title,
      year,
      timelineContext: timeline.summary
        ? stripTimelineFormatting(timeline.summary)
        : timeline.title,
      existingEvents,
    });

    // Map event type to thematic category when available
    const timelineMetadata = (timeline.metadata as any)?.structured_content;
    let mappedCategory = content.type;

    if (
      timelineMetadata &&
      typeof timelineMetadata === 'object' &&
      'eventNotes' in timelineMetadata
    ) {
      const eventNotes = (timelineMetadata as any).eventNotes;
      if (Array.isArray(eventNotes)) {
        const normalizedTitle = title.toLowerCase();
        const matchingNote = eventNotes.find((note: any) => {
          const noteTitle = typeof note?.title === 'string' ? note.title.toLowerCase() : '';
          if (!noteTitle) {
            return false;
          }
          const snippet = noteTitle.substring(0, 20);
          return snippet ? normalizedTitle.includes(snippet) : false;
        });

        if (matchingNote?.categoryId) {
          mappedCategory = matchingNote.categoryId;
        }
      }
    }

    // Create event record
    const event = await createEvent({
      title,
      slug: slugify(title),
      start_year: year,
      end_year: null,
      location: null,
      type: mappedCategory || content.type,
      tags: [mappedCategory || content.type].filter(Boolean),
      importance: content.importance || importance,
      summary: content.summary,
      description_html: formatAsHtml(content.description),
      significance_html: formatAsHtml(content.significance),
    });

    // Link to timeline
    await linkEventToTimeline(timeline.id, event.id);

    console.log(`      ✅ Event created: ${event.id}`);

    return {
      success: true,
      eventId: event.id,
    };
  } catch (error) {
    const message = summarizeError(error);
    console.error(`      ❌ Error generating event: ${message}`);

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
 * Generate all events for a timeline
 */
export async function generateTimelineEvents(
  timeline: Timeline,
  eventCount: number = 20,
  options?: {
    delayMs?: number;
    onProgress?: (current: number, total: number, event: string) => void;
  }
): Promise<{
  success: boolean;
  eventIds: string[];
  errors: Array<{ event: string; error: string }>;
}> {
  console.log(`\n📅 Generating events for: ${timeline.title}`);
  
  const eventIds: string[] = [];
  const errors: Array<{ event: string; error: string }> = [];
  const delayMs = options?.delayMs || 2000; // Rate limiting

  try {
    // First, generate outline
    const outline = await generateEventsOutline(timeline, eventCount);

    if (outline.length === 0) {
      throw new Error('Failed to generate event outline');
    }

    // Then generate each event
    for (let i = 0; i < outline.length; i++) {
      const eventOutline = outline[i];
      
      if (options?.onProgress) {
        options.onProgress(i + 1, outline.length, eventOutline.title);
      }

      // Pass existing events for context
      const existingEvents = outline
        .slice(0, i)
        .map(e => ({ title: e.title, year: e.year }));

      const result = await generateEvent({
        title: eventOutline.title,
        year: eventOutline.year,
        importance: eventOutline.importance,
        timeline,
        existingEvents,
      });

      if (result.success && result.eventId) {
        eventIds.push(result.eventId);
      } else {
        errors.push({
          event: eventOutline.title,
          error: result.error || 'Unknown error',
        });
      }

      // Delay between requests
      if (i < outline.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    console.log(`\n✅ Generated ${eventIds.length} events`);
    if (errors.length > 0) {
      console.log(`⚠️  ${errors.length} events failed`);
    }

    return {
      success: true,
      eventIds,
      errors,
    };
  } catch (error) {
    const message = summarizeError(error);
    console.error(`❌ Error generating timeline events: ${message}`);

    const details = serializeError(error);
    if (details) {
      console.error('ℹ️  Full error details:', details);
    }

    return {
      success: false,
      eventIds,
      errors: [
        ...errors,
        { event: 'Timeline events', error: message }
      ],
    };
  }
}

/**
 * Regenerate content for an existing event
 */
export async function regenerateEvent(
  eventId: string,
  timeline: Timeline
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get existing event
    const { supabaseClient } = await import('@/lib/supabase');
    const { data: event } = await supabaseClient
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (!event) {
      throw new Error('Event not found');
    }

    console.log(`\n🔄 Regenerating event: ${event.title}`);

    // Generate new content
    const content = await generateEventContent({
      title: event.title,
      year: event.start_year,
      timelineContext: timeline.summary || timeline.title,
    });

    const timelineMetadata = (timeline.metadata as any)?.structured_content;
    let mappedCategory = content.type;

    if (
      timelineMetadata &&
      typeof timelineMetadata === 'object' &&
      'eventNotes' in timelineMetadata
    ) {
      const eventNotes = (timelineMetadata as any).eventNotes;
      if (Array.isArray(eventNotes)) {
        const normalizedTitle = event.title.toLowerCase();
        const matchingNote = eventNotes.find((note: any) => {
          const noteTitle = typeof note?.title === 'string' ? note.title.toLowerCase() : '';
          if (!noteTitle) {
            return false;
          }
          const snippet = noteTitle.substring(0, 20);
          return snippet ? normalizedTitle.includes(snippet) : false;
        });

        if (matchingNote?.categoryId) {
          mappedCategory = matchingNote.categoryId;
        }
      }
    }

    // Update event
    const { supabaseAdmin } = await import('@/lib/supabase');
    await supabaseAdmin
      .from('events')
      .update({
        summary: content.summary,
        description_html: formatAsHtml(content.description),
        significance_html: formatAsHtml(content.significance),
        tags: [mappedCategory || content.type].filter(Boolean),
        type: mappedCategory || content.type,
        importance: content.importance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    console.log(`   ✅ Event regenerated`);

    return { success: true };
  } catch (error) {
    const message = summarizeError(error);
    console.error(`   ❌ Error regenerating event: ${message}`);

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
 * Format text as HTML with proper paragraphs
 */
function formatAsHtml(text: string): string {
  if (!text) return '';
  
  // Split into paragraphs
  const paragraphs = text.split(/\n\n+/);
  
  let html = '';
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (trimmed) {
      // Check if it's a heading (starts with capital, ends with colon)
      if (trimmed.match(/^[A-Z][^.!?]*:$/)) {
        html += `<h4>${trimmed.replace(':', '')}</h4>\n`;
      } else {
        html += `<p>${trimmed}</p>\n`;
      }
    }
  }
  
  return html;
}

/**
 * Get event statistics for a timeline
 */
export async function getEventStats(timelineId: string): Promise<{
  total: number;
  byImportance: { [key: number]: number };
  byType: { [key: string]: number };
}> {
  const { supabaseClient } = await import('@/lib/supabase');
  
  const { data: events } = await supabaseClient
    .from('timeline_events')
    .select('events!inner(*)')
    .eq('timeline_id', timelineId);

  const total = events?.length || 0;
  const byImportance: { [key: number]: number } = { 1: 0, 2: 0, 3: 0 };
  const byType: { [key: string]: number } = {};

  events?.forEach((te: any) => {
    const event = te.events;
    if (event.importance) {
      byImportance[event.importance]++;
    }
    if (event.type) {
      byType[event.type] = (byType[event.type] || 0) + 1;
    }
  });

  return { total, byImportance, byType };
}
