import { generateTimelineContent } from '@/lib/openai';
import {
  createTimeline,
  getTimelineBySlug,
  linkEventToTimeline,
  linkPersonToTimeline,
  updateTimeline,
} from '@/lib/queries/timelines';
import { slugify } from '@/lib/utils';
import type { TimelineSeed } from '../ingest';
import { serializeError, summarizeError } from '../utils/error';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Generate and save a complete timeline
 */
export async function generateTimeline(seed: TimelineSeed): Promise<{
  success: boolean;
  timelineId?: string;
  error?: string;
}> {
  try {
    console.log(`\n📜 Generating timeline: ${seed.title}`);
    console.log(`   Period: ${seed.startYear} - ${seed.endYear}`);

    // Generate content using GPT
    console.log('   🤖 Generating narrative content...');
    const content = await generateTimelineContent({
      title: seed.title,
      startYear: seed.startYear,
      endYear: seed.endYear,
      region: seed.region,
      context: seed.summary,
    });

    // Create timeline record
    const slug = slugify(seed.title);
    const existingTimeline = await getTimelineBySlug(slug, { client: supabaseAdmin });

    console.log('   💾 Saving to database...');
    const timeline = existingTimeline
      ? await updateTimeline(existingTimeline.id, {
          title: seed.title,
          slug,
          start_year: seed.startYear,
          end_year: seed.endYear,
          region: seed.region || null,
          summary: content.summary,
          interpretation_html: formatAsHtml(content.interpretation),
          map_image_url: existingTimeline.map_image_url || null,
        })
      : await createTimeline({
          title: seed.title,
          slug,
          start_year: seed.startYear,
          end_year: seed.endYear,
          region: seed.region || null,
          summary: content.summary,
          interpretation_html: formatAsHtml(content.interpretation),
          map_image_url: null, // Could integrate with image generation API
        });

    console.log(
      existingTimeline
        ? `   🔄 Timeline updated: ${timeline.id}`
        : `   ✅ Timeline created: ${timeline.id}`
    );

    return {
      success: true,
      timelineId: timeline.id,
    };
  } catch (error) {
    const message = summarizeError(error);
    console.error(`   ❌ Error generating timeline: ${message}`);

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
 * Generate multiple timelines in batch
 */
export async function generateTimelines(
  seeds: TimelineSeed[],
  options?: {
    delayMs?: number;
    onProgress?: (current: number, total: number) => void;
  }
): Promise<Array<{ seed: TimelineSeed; result: any }>> {
  const results: Array<{ seed: TimelineSeed; result: any }> = [];
  const delayMs = options?.delayMs || 1000; // Rate limiting

  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i];
    
    if (options?.onProgress) {
      options.onProgress(i + 1, seeds.length);
    }

    const result = await generateTimeline(seed);
    results.push({ seed, result });

    // Delay between requests to avoid rate limits
    if (i < seeds.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

/**
 * Update an existing timeline's content
 */
export async function regenerateTimelineContent(
  timelineId: string,
  seed: TimelineSeed
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`\n🔄 Regenerating content for: ${seed.title}`);

    const content = await generateTimelineContent({
      title: seed.title,
      startYear: seed.startYear,
      endYear: seed.endYear,
      region: seed.region,
      context: seed.summary,
    });

    // Update timeline record
    const { supabaseAdmin } = await import('@/lib/supabase');
    await supabaseAdmin
      .from('timelines')
      .update({
        summary: content.summary,
        interpretation_html: formatAsHtml(content.interpretation),
        updated_at: new Date().toISOString(),
      })
      .eq('id', timelineId);

    console.log(`   ✅ Content regenerated`);

    return { success: true };
  } catch (error) {
    console.error(`   ❌ Error regenerating content: ${error}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Format text as HTML with proper paragraphs and structure
 */
function formatAsHtml(text: string): string {
  // Split into sections based on headings
  const sections = text.split(/\n(?=[A-Z][a-z]+:)/);
  
  let html = '';
  
  for (const section of sections) {
    const lines = section.trim().split('\n');
    
    // Check if first line is a heading
    if (lines[0].match(/^([A-Z][a-z\s]+):/)) {
      const heading = lines[0].replace(':', '').trim();
      html += `<h3>${heading}</h3>\n`;
      
      // Process remaining paragraphs
      const paragraphs = lines.slice(1).join('\n').split('\n\n');
      for (const para of paragraphs) {
        if (para.trim()) {
          html += `<p>${para.trim()}</p>\n`;
        }
      }
    } else {
      // No heading, just paragraphs
      const paragraphs = section.split('\n\n');
      for (const para of paragraphs) {
        if (para.trim()) {
          html += `<p>${para.trim()}</p>\n`;
        }
      }
    }
  }
  
  return html;
}

/**
 * Link events to timeline (used after events are generated)
 */
export async function linkEventsToTimeline(
  timelineId: string,
  eventIds: string[]
): Promise<void> {
  console.log(`   🔗 Linking ${eventIds.length} events to timeline...`);
  
  for (let i = 0; i < eventIds.length; i++) {
    await linkEventToTimeline(timelineId, eventIds[i], i);
  }
  
  console.log(`   ✅ Events linked`);
}

/**
 * Link people to timeline (used after people are generated)
 */
export async function linkPeopleToTimeline(
  timelineId: string,
  peopleIds: string[],
  roles?: Record<string, string>
): Promise<void> {
  console.log(`   🔗 Linking ${peopleIds.length} people to timeline...`);
  
  for (let i = 0; i < peopleIds.length; i++) {
    const personId = peopleIds[i];
    const role = roles?.[personId];
    await linkPersonToTimeline(timelineId, personId, role, i);
  }
  
  console.log(`   ✅ People linked`);
}
