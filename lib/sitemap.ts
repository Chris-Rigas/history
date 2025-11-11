import { MetadataRoute } from 'next';
import { getAllTimelines } from '@/lib/queries/timelines';
import { supabaseClient } from '@/lib/supabase';

/**
 * Generate dynamic sitemap for all content
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://historytimelines.com';
  
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/timelines`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  try {
    // Get all timelines
    const timelines = await getAllTimelines();
    
    // Timeline pages
    const timelinePages: MetadataRoute.Sitemap = timelines.map((timeline) => ({
      url: `${baseUrl}/timelines/${timeline.slug}`,
      lastModified: new Date(timeline.updated_at),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    // Get all events
    const { data: events } = await supabaseClient
      .from('events')
      .select('slug, updated_at, timeline_events!inner(timeline_id, timelines!inner(slug))')
      .order('updated_at', { ascending: false });

    // Event pages
    const eventPages: MetadataRoute.Sitemap = (events || []).map((event: any) => {
      const timelineSlug = event.timeline_events?.[0]?.timelines?.slug;
      return {
        url: `${baseUrl}/timelines/${timelineSlug}/events/${event.slug}`,
        lastModified: new Date(event.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      };
    });

    // Get all people
    const { data: people } = await supabaseClient
      .from('people')
      .select('slug, updated_at, timeline_people!inner(timeline_id, timelines!inner(slug))')
      .order('updated_at', { ascending: false });

    // Person pages
    const personPages: MetadataRoute.Sitemap = (people || []).map((person: any) => {
      const timelineSlug = person.timeline_people?.[0]?.timelines?.slug;
      return {
        url: `${baseUrl}/timelines/${timelineSlug}/people/${person.slug}`,
        lastModified: new Date(person.updated_at),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      };
    });

    return [
      ...staticPages,
      ...timelinePages,
      ...eventPages,
      ...personPages,
    ];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return at least static pages if database fails
    return staticPages;
  }
}
