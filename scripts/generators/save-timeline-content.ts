import type { GenerationContext } from '@/lib/generation/types';
import type { Json } from '@/lib/database.types';
import {
  createTimeline,
  updateTimeline,
  replaceTimelineSources,
  upsertTimelineMetadata,
  getTimelineBySlug,
} from '@/lib/queries/timelines';
import { supabaseAdmin } from '@/lib/supabase';
import { slugify } from '@/lib/utils';
import {
  dedupeTimelineCitations,
  linkifyTimelineCitations,
} from '@/lib/timelines/formatting';

interface SaveTimelineResult {
  timelineId: string;
  isNew: boolean;
}

/**
 * Save unified pipeline output to database
 */
export async function saveTimelineFromContext(
  context: GenerationContext
): Promise<SaveTimelineResult> {
  const { seed, mainNarrative, enrichment, seo } = context;

  if (!mainNarrative) {
    throw new Error('Main narrative is required');
  }

  const slug = slugify(seed.title);
  const existingTimeline = await getTimelineBySlug(slug, { client: supabaseAdmin });

  // Build structured content with enrichment
  const structuredContent = {
    summary: mainNarrative.summary,
    centralQuestion: mainNarrative.centralQuestion,
    storyCharacter: mainNarrative.storyCharacter,
    overviewSections: mainNarrative.overview,
    themes: mainNarrative.themes,
    keyFacts: mainNarrative.keyFacts,
    eventNotes: mainNarrative.eventNotes,
    connectors: mainNarrative.connectors,
    turningPoints: mainNarrative.turningPoints,
    perspectives: mainNarrative.perspectives,
    themeInsights: mainNarrative.themeInsights,
    contextSections: mainNarrative.contextSections,
    citations: mainNarrative.citations,

    // Include Phase 5 enrichment if available
    ...(enrichment && { enrichment }),
  };

  // Build interpretation HTML from contextSections
  const interpretationHtml =
    mainNarrative.contextSections
      ?.map(section => {
        const heading = section.heading?.trim() || '';
        const content = section.content?.trim() || '';
        if (!content) return '';
        return heading
          ? `<h3>${heading}</h3>\n<p>${content}</p>`
          : `<p>${content}</p>`;
      })
      .filter(Boolean)
      .join('\n\n') || '';

  // Dedupe and linkify citations
  const citations = dedupeTimelineCitations(
    (mainNarrative.citations || []).map((c: any) => ({
      number: c.number,
      source: c.source || c.title || '',
      url: c.url || '',
    }))
  );

  const linkedInterpretation = linkifyTimelineCitations(interpretationHtml, citations);

  // Create or update timeline
  const timeline = existingTimeline
    ? await updateTimeline(existingTimeline.id, {
        title: seed.title,
        slug,
        start_year: seed.startYear,
        end_year: seed.endYear,
        region: seed.region || null,
        summary: mainNarrative.summary,
        interpretation_html: linkedInterpretation,
        map_image_url: existingTimeline.map_image_url || null,
      })
    : await createTimeline({
        title: seed.title,
        slug,
        start_year: seed.startYear,
        end_year: seed.endYear,
        region: seed.region || null,
        summary: mainNarrative.summary,
        interpretation_html: linkedInterpretation,
        map_image_url: null,
      });

  // Save citations
  await replaceTimelineSources(
    timeline.id,
    citations.map(citation => ({
      number: citation.number,
      source: citation.source,
      url: citation.url,
    }))
  );

  // Save metadata
  const structuredContentJson = JSON.parse(
    JSON.stringify(structuredContent)
  ) as Json;

  const metadataPayload = {
    seoTitle: seo?.seoTitle || null,
    metaDescription: seo?.metaDescription || null,
    relatedKeywords: seo?.keywords?.length ? seo.keywords : null,
    structuredContent: structuredContentJson,
  };

  await upsertTimelineMetadata(timeline.id, metadataPayload);

  return {
    timelineId: timeline.id,
    isNew: !existingTimeline,
  };
}
