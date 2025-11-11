import type { Metadata } from 'next';
import type { Timeline, Event, Person } from './database.types';

/**
 * Get the base URL for the site
 */
export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://historytimelines.com';
}

/**
 * Generate timeline page metadata
 */
export function generateTimelineMetadata(timeline: Timeline): Metadata {
  const baseUrl = getBaseUrl();
  
  return {
    title: `${timeline.title} — Timeline & Key Events`,
    description: timeline.summary || `Explore the complete timeline of ${timeline.title} with key events, turning points, and historical figures from ${timeline.start_year} to ${timeline.end_year}.`,
    keywords: [
      timeline.title,
      'timeline',
      'history',
      'historical events',
      timeline.region || '',
      `${timeline.start_year}`,
      `${timeline.end_year}`,
    ].filter(Boolean),
    openGraph: {
      title: `${timeline.title} — Timeline & Key Events`,
      description: timeline.summary || '',
      type: 'website',
      url: `${baseUrl}/timelines/${timeline.slug}`,
      siteName: 'History Timelines',
      images: timeline.map_image_url ? [
        {
          url: timeline.map_image_url,
          width: 1200,
          height: 630,
          alt: `Map of ${timeline.title}`,
        }
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${timeline.title} — Timeline & Key Events`,
      description: timeline.summary || '',
      images: timeline.map_image_url ? [timeline.map_image_url] : [],
    },
    alternates: {
      canonical: `${baseUrl}/timelines/${timeline.slug}`,
    },
  };
}

/**
 * Generate event page metadata
 */
export function generateEventMetadata(event: Event, timeline: Timeline): Metadata {
  const baseUrl = getBaseUrl();
  
  return {
    title: `${event.title} (${event.start_year}) — ${timeline.title}`,
    description: event.summary || `Learn about ${event.title}, a key event in ${timeline.title} that occurred in ${event.start_year}.`,
    keywords: [
      event.title,
      timeline.title,
      'historical event',
      `${event.start_year}`,
      ...(event.tags || []),
      event.location || '',
      event.type || '',
    ].filter(Boolean),
    openGraph: {
      title: `${event.title} — ${timeline.title}`,
      description: event.summary || '',
      type: 'article',
      url: `${baseUrl}/timelines/${timeline.slug}/events/${event.slug}`,
      siteName: 'History Timelines',
      publishedTime: `${event.start_year}-01-01`,
      tags: event.tags,
    },
    twitter: {
      card: 'summary',
      title: `${event.title} — ${timeline.title}`,
      description: event.summary || '',
    },
    alternates: {
      canonical: `${baseUrl}/timelines/${timeline.slug}/events/${event.slug}`,
    },
  };
}

/**
 * Generate person page metadata
 */
export function generatePersonMetadata(person: Person, timeline: Timeline): Metadata {
  const baseUrl = getBaseUrl();
  
  const lifeDates = [
    person.birth_year ? `${person.birth_year}` : null,
    person.death_year ? `${person.death_year}` : null,
  ]
    .filter(Boolean)
    .join(' – ');

  return {
    title: `${person.name} ${lifeDates ? `(${lifeDates})` : ''} — ${timeline.title}`,
    description: person.bio_short || `Learn about ${person.name}, a key figure in ${timeline.title}.`,
    keywords: [
      person.name,
      timeline.title,
      'historical figure',
      'biography',
      ...(person.birth_year ? [`${person.birth_year}`] : []),
    ].filter(Boolean),
    openGraph: {
      title: `${person.name} — ${timeline.title}`,
      description: person.bio_short || '',
      type: 'profile',
      url: `${baseUrl}/timelines/${timeline.slug}/people/${person.slug}`,
      siteName: 'History Timelines',
    },
    twitter: {
      card: 'summary',
      title: `${person.name} — ${timeline.title}`,
      description: person.bio_short || '',
    },
    alternates: {
      canonical: `${baseUrl}/timelines/${timeline.slug}/people/${person.slug}`,
    },
  };
}

/**
 * Generate breadcrumb list for structured data
 */
export function generateBreadcrumbList(items: Array<{ name: string; url: string }>) {
  const baseUrl = getBaseUrl();
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
    })),
  };
}

/**
 * Extract excerpt from HTML content
 */
export function extractExcerpt(html: string, maxLength: number = 160): string {
  // Strip HTML tags
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  
  if (text.length <= maxLength) {
    return text;
  }
  
  // Try to break at sentence
  const sentences = text.match(/[^.!?]+[.!?]+/g);
  if (sentences) {
    let excerpt = '';
    for (const sentence of sentences) {
      if ((excerpt + sentence).length <= maxLength) {
        excerpt += sentence;
      } else {
        break;
      }
    }
    if (excerpt) {
      return excerpt.trim();
    }
  }
  
  // Break at word
  return text.slice(0, maxLength).split(' ').slice(0, -1).join(' ') + '...';
}

/**
 * Generate default metadata for the site
 */
export function getDefaultMetadata(): Metadata {
  const baseUrl = getBaseUrl();
  
  return {
    metadataBase: new URL(baseUrl),
    title: {
      template: '%s | History Timelines',
      default: 'History Timelines - Interactive Historical Timelines & Events',
    },
    description: 'Explore comprehensive interactive timelines of historical events, civilizations, and key figures. Deep dive into the Aztec Empire, Hun conquests, and more.',
    keywords: ['history', 'timeline', 'historical events', 'civilizations', 'world history', 'historical figures'],
    authors: [{ name: 'History Timelines' }],
    creator: 'History Timelines',
    publisher: 'History Timelines',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: baseUrl,
      siteName: 'History Timelines',
      title: 'History Timelines - Interactive Historical Timelines & Events',
      description: 'Explore comprehensive interactive timelines of historical events, civilizations, and key figures.',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'History Timelines',
      description: 'Explore comprehensive interactive timelines of historical events',
      creator: '@historytimelines',
    },
  };
}
