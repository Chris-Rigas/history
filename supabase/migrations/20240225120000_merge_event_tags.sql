-- Merge legacy event type values into the tags array and remove the redundant column
alter table public.events
  alter column tags set default '{}'::text[];

update public.events as e
set tags = coalesce(
  (
    select array_agg(tag)
    from (
      select distinct merged.tag_value as tag
      from (
        select unnest(coalesce(e.tags, '{}')) as tag_value
        union all
        select nullif(btrim(e.type), '')
      ) as merged(tag_value)
      where merged.tag_value is not null and merged.tag_value <> ''
    ) as dedup
  ),
  '{}'
)
where coalesce(e.type, '') <> '';

alter table public.events
  drop column if exists type;
