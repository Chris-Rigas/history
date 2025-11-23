| create_table_ddl                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CREATE TABLE event_people (
    event_id uuid,
    person_id uuid,
    role text
);                                                                                                                                                                                                                                                                                                                                                    |
| CREATE TABLE events (
    id uuid,
    slug text,
    title text,
    start_year integer,
    end_year integer,
    location text,
    tags text[],
    importance integer,
    summary text,
    description_html text,
    significance_html text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);                                                                                               |
| CREATE TABLE people (
    id uuid,
    name text,
    slug text,
    birth_year integer,
    death_year integer,
    bio_short text,
    bio_long text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);                                                                                                                                                                                            |
| CREATE TABLE timeline_events (
    timeline_id uuid,
    event_id uuid,
    position integer,
    display_order integer
);                                                                                                                                                                                                                                                                                                             |
| CREATE TABLE timeline_metadata (
    id uuid,
    timeline_id uuid,
    seo_title text,
    meta_description text,
    related_keywords text[],
    initial_understanding text,
    research_digest text,
    unique_sources jsonb,
    primary_sources jsonb,
    total_sources integer,
    structured_content jsonb,
    storyform_recap jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
); |
| CREATE TABLE timeline_people (
    timeline_id uuid,
    person_id uuid,
    role text
);                                                                                                                                                                                                                                                                                                                                              |
| CREATE TABLE timeline_sources (
    id uuid,
    timeline_id uuid,
    number integer,
    source text,
    url text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);                                                                                                                                                                                                                              |
| CREATE TABLE timelines (
    id uuid,
    title text,
    slug text,
    start_year integer,
    end_year integer,
    region text,
    summary text,
    interpretation_html text,
    map_image_url text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);                                                                                                                                        |
