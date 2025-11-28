import { generateStoryformRecap, generateTimelineContent } from '@/lib/openai';
import {
  createTimeline,
  getTimelineBySlug,
  getTimelineWithEvents,
  linkEventToTimeline,
  linkPersonToTimeline,
  replaceTimelineSources,
  updateTimeline,
  upsertTimelineMetadata,
} from '@/lib/queries/timelines';
import { slugify } from '@/lib/utils';
import type { TimelineSeed } from '../ingest';
import { serializeError, summarizeError } from '../utils/error';
import { supabaseAdmin } from '@/lib/supabase';
import {
  dedupeTimelineCitations,
  formatTimelineInterpretation,
  linkifyTimelineCitations,
} from '@/lib/timelines/formatting';
import type { Json } from '@/lib/database.types';

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

    const citations = dedupeTimelineCitations(content.citations || []);
    const interpretationHtml = linkifyTimelineCitations(
      formatTimelineInterpretation(content.interpretation),
      citations,
    );

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
          interpretation_html: interpretationHtml,
          map_image_url: existingTimeline.map_image_url || null,
        })
      : await createTimeline({
          title: seed.title,
          slug,
          start_year: seed.startYear,
          end_year: seed.endYear,
          region: seed.region || null,
          summary: content.summary,
          interpretation_html: interpretationHtml,
          map_image_url: null, // Could integrate with image generation API
        });

    await replaceTimelineSources(
      timeline.id,
      citations.map(citation => ({
        number: citation.number,
        source: citation.source,
        url: citation.url,
      })),
    );

    const structuredContentJson = JSON.parse(
      JSON.stringify(content.structured),
    ) as Json;
    const uniqueSourcesJson = content.research.uniqueSources.length
      ? (JSON.parse(JSON.stringify(content.research.uniqueSources)) as Json)
      : null;
    const primarySourcesJson = content.research.primarySources.length
      ? (JSON.parse(JSON.stringify(content.research.primarySources)) as Json)
      : null;

    let metadataPayload = {
      seoTitle: content.seo.seoTitle || null,
      metaDescription: content.seo.metaDescription || null,
      relatedKeywords:
        content.seo.relatedKeywords.length > 0
          ? content.seo.relatedKeywords
          : null,
      initialUnderstanding: content.research.initialUnderstanding || null,
      researchDigest: content.research.researchDigest || null,
      uniqueSources: uniqueSourcesJson,
      primarySources: primarySourcesJson,
      totalSources: content.research.totalSources || null,
      structuredContent: structuredContentJson,
    };

    await upsertTimelineMetadata(timeline.id, metadataPayload);

    // Generate storyform recap once events are available
    const timelineWithEvents = await getTimelineWithEvents(slug, { client: supabaseAdmin });
    const events = timelineWithEvents?.events ?? [];

    if (events.length > 0) {
      console.log(`\n   📝 Generating storyform recap...`);

      const recapResult = await generateStoryformRecap({
        title: timeline.title,
        startYear: timeline.start_year,
        endYear: timeline.end_year,
        events: events.map(e => ({
          title: e.title,
          slug: e.slug,
          start_year: e.start_year,
          summary: e.summary,
          tags: e.tags,
        })),
      });

      metadataPayload = {
        ...metadataPayload,
        storyformRecap: recapResult as Json,
      };

      await upsertTimelineMetadata(timeline.id, metadataPayload);

      console.log(`   ✅ Storyform recap generated`);
    }

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

    const citations = dedupeTimelineCitations(content.citations || []);
    const interpretationHtml = linkifyTimelineCitations(
      formatTimelineInterpretation(content.interpretation),
      citations,
    );

    // Update timeline record
    const { supabaseAdmin } = await import('@/lib/supabase');
    await supabaseAdmin
      .from('timelines')
      .update({
        summary: content.summary,
        interpretation_html: interpretationHtml,
        updated_at: new Date().toISOString(),
      })
      .eq('id', timelineId);

    await replaceTimelineSources(
      timelineId,
      citations.map(citation => ({
        number: citation.number,
        source: citation.source,
        url: citation.url,
      })),
    );

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
 * Link events to timeline (used after events are generated)
 */
export async function linkEventsToTimeline(
  timelineId: string,
  eventIds: string[]
): Promise<void> {
  console.log(`   🔗 Linking ${eventIds.length} events to timeline...`);

  for (let i = 0; i < eventIds.length; i++) {
    await linkEventToTimeline(timelineId, eventIds[i]);
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
    await linkPersonToTimeline(timelineId, personId, role);
  }

  console.log(`   ✅ People linked`);
}
