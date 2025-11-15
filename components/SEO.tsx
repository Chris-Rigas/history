import Script from 'next/script';
import type { Timeline, Event, Person } from '@/lib/database.types';
import { stripTimelineFormatting } from '@/lib/timelines/formatting';

interface BaseSchemaProps {
  type: 'timeline' | 'event' | 'person';
}

interface TimelineSchemaProps extends BaseSchemaProps {
  type: 'timeline';
  timeline: Timeline;
  events?: Event[];
}

interface EventSchemaProps extends BaseSchemaProps {
  type: 'event';
  event: Event;
  timeline: Timeline;
  people?: Person[];
}

interface PersonSchemaProps extends BaseSchemaProps {
  type: 'person';
  person: Person;
  timeline: Timeline;
  events?: Event[];
}

type SEOSchemaProps = TimelineSchemaProps | EventSchemaProps | PersonSchemaProps;

export default function SEOSchema(props: SEOSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://historytimelines.com';

  // Generate JSON-LD based on type
  const generateSchema = () => {
    switch (props.type) {
      case 'timeline':
        return generateTimelineSchema(props, baseUrl);
      case 'event':
        return generateEventSchema(props, baseUrl);
      case 'person':
        return generatePersonSchema(props, baseUrl);
    }
  };

  const schema = generateSchema();

  return (
    <Script
      id={`schema-${props.type}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

function generateTimelineSchema(
  props: TimelineSchemaProps,
  baseUrl: string
) {
  const { timeline, events = [] } = props;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'EventSeries',
    name: timeline.title,
    description: timeline.summary ? stripTimelineFormatting(timeline.summary) : '',
    startDate: `${timeline.start_year}-01-01`,
    endDate: `${timeline.end_year}-12-31`,
    location: timeline.region
      ? {
          '@type': 'Place',
          name: timeline.region,
        }
      : undefined,
    url: `${baseUrl}/timelines/${timeline.slug}`,
    image: timeline.map_image_url || undefined,
    subEvent: events.map((event) => ({
      '@type': 'Event',
      name: event.title,
      startDate: `${event.start_year}-01-01`,
      endDate: event.end_year ? `${event.end_year}-12-31` : undefined,
      description: event.summary || '',
      url: `${baseUrl}/timelines/${timeline.slug}/events/${event.slug}`,
    })),
  };
}

function generateEventSchema(
  props: EventSchemaProps,
  baseUrl: string
) {
  const { event, timeline, people = [] } = props;

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.summary || '',
    startDate: `${event.start_year}-01-01`,
    endDate: event.end_year ? `${event.end_year}-12-31` : undefined,
    location: event.location
      ? {
          '@type': 'Place',
          name: event.location,
        }
      : undefined,
    url: `${baseUrl}/timelines/${timeline.slug}/events/${event.slug}`,
    organizer: people.length > 0
      ? people.map((person) => ({
          '@type': 'Person',
          name: person.name,
          url: `${baseUrl}/timelines/${timeline.slug}/people/${person.slug}`,
        }))
      : undefined,
    keywords: event.tags.join(', '),
    superEvent: {
      '@type': 'EventSeries',
      name: timeline.title,
      url: `${baseUrl}/timelines/${timeline.slug}`,
    },
  };
}

function generatePersonSchema(
  props: PersonSchemaProps,
  baseUrl: string
) {
  const { person, timeline, events = [] } = props;

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    description: person.bio_short || '',
    birthDate: person.birth_year ? `${person.birth_year}-01-01` : undefined,
    deathDate: person.death_year ? `${person.death_year}-12-31` : undefined,
    url: `${baseUrl}/timelines/${timeline.slug}/people/${person.slug}`,
    subjectOf: events.map((event) => ({
      '@type': 'Event',
      name: event.title,
      startDate: `${event.start_year}-01-01`,
      url: `${baseUrl}/timelines/${timeline.slug}/events/${event.slug}`,
    })),
  };
}

// Breadcrumb schema component
interface BreadcrumbSchemaProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <Script
      id="breadcrumb-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
