import { MetadataRoute } from 'next';
import { getAllTimelines } from '@/lib/queries/timelines';
import { supabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://historical-timelines.com';
  
  try {
    // Fetch all timelines
    const timelines = await getAllTimelines();

    // Fetch all events with their timeline relationships
    const { data: events } = await supabaseClient
      .from('timeline_events')
      .select(`
        event_id,
        timeline_id,
        events!inner(slug, updated_at),
        timelines!inner(slug)
      `)
      .order('events(updated_at)', { ascending: false });

    // Fetch all people with their timeline relationships
    const { data: people } = await supabaseClient
      .from('timeline_people')
      .select(`
        person_id,
        timeline_id,
        people!inner(slug, updated_at),
        timelines!inner(slug)
      `)
      .order('people(updated_at)', { ascending: false });

    // Build URL entries
    const urlEntries: string[] = [];

    // Static pages
    urlEntries.push(createUrlEntry(baseUrl, new Date(), 'daily', 1.0));
    urlEntries.push(createUrlEntry(`${baseUrl}/timelines`, new Date(), 'daily', 0.9));
    urlEntries.push(createUrlEntry(`${baseUrl}/about`, new Date(), 'monthly', 0.5));

    // Timeline pages
    timelines.forEach((timeline) => {
      urlEntries.push(
        createUrlEntry(
          `${baseUrl}/timelines/${timeline.slug}`,
          new Date(timeline.updated_at),
          'weekly',
          0.8
        )
      );
    });

    // Event pages
    (events || []).forEach((item: any) => {
      const timelineSlug = item.timelines?.slug;
      const eventSlug = item.events?.slug;
      const eventUpdatedAt = item.events?.updated_at;
      
      if (timelineSlug && eventSlug) {
        urlEntries.push(
          createUrlEntry(
            `${baseUrl}/timelines/${timelineSlug}/events/${eventSlug}`,
            new Date(eventUpdatedAt),
            'weekly',
            0.7
          )
        );
      }
    });

    // Person pages
    (people || []).forEach((item: any) => {
      const timelineSlug = item.timelines?.slug;
      const personSlug = item.people?.slug;
      const personUpdatedAt = item.people?.updated_at;
      
      if (timelineSlug && personSlug) {
        urlEntries.push(
          createUrlEntry(
            `${baseUrl}/timelines/${timelineSlug}/people/${personSlug}`,
            new Date(personUpdatedAt),
            'monthly',
            0.6
          )
        );
      }
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join('\n')}
</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate',
      },
    });
  } catch (error) {
    console.error('Failed to generate sitemap:', error);

    // Return minimal valid sitemap on error
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

    return new Response(fallbackXml, {
      status: 500,
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }
}

function createUrlEntry(
  url: string,
  lastModified: Date,
  changeFreq: string,
  priority: number
): string {
  const lastMod = lastModified.toISOString().split('T')[0];
  return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>${changeFreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}
