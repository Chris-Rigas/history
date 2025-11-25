-- Allow timeline sources to omit URLs
alter table public.timeline_sources
  alter column url drop not null;
