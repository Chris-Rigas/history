-- Add storage for unified pipeline outputs and citation quotes
alter table public.timeline_metadata
  add column if not exists research_corpus jsonb,
  add column if not exists skeleton jsonb,
  add column if not exists generation_version integer default 1;

alter table public.timeline_sources
  add column if not exists quote text;
