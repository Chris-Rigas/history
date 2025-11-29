-- Add enrichment column to timeline_metadata
ALTER TABLE public.timeline_metadata
  ADD COLUMN IF NOT EXISTS enrichment JSONB;

COMMENT ON COLUMN public.timeline_metadata.enrichment IS 'Enrichment data from Phase 5: people, perspectives, interpretationSections, keyHighlights, etc.';
