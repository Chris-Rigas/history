import { MetadataRoute } from 'next';
import { getAllTimelines } from '@/lib/queries/timelines';
import { supabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://historical-timelines.com';
  
  try {
    // Fetch all published timelines
    const timelines = await getAllTimelines();
    const publishedTimelines = timelines.filter((t) => t.is_published !== false);

    // Fetch all events from published timelines
    const { data: events } = await supabaseClient
      .from('events')
      .select('slug, updated_at, timeline_events!inner(timeline_id, timelines!inner(slug, is_published))')
      .order('updated_at', { ascending: false });

    // Fetch all people from published timelines
    const { data: people } = await supabaseClient
      .from('people')
      .select('slug, updated_at, timeline_people!inner(timeline_id, timelines!inner(slug, is_published))')
      .order('updated_at', { ascending: false });

    // Build URL entries
    const urlEntries: string[] = [];

    // Static pages
    urlEntries.push(createUrlEntry(baseUrl, new Date(), 'daily', 1.0));
    urlEntries.push(createUrlEntry(`${baseUrl}/timelines`, new Date(), 'daily', 0.9));
    urlEntries.push(createUrlEntry(`${baseUrl}/about`, new Date(), 'monthly', 0.5));

    // Timeline pages
    publishedTimelines.forEach((timeline) => {
      urlEntries.push(
        createUrlEntry(
          `${baseUrl}/timelines/${timeline.slug}`,
          new Date(timeline.updated_at),
          'weekly',
          0.8
        )
      );
    });

    // Event pages - only from published timelines
    (events || [])
      .filter((event: any) => event.timeline_events?.[0]?.timelines?.is_published)
      .forEach((event: any) => {
        const timelineSlug = event.timeline_events[0].timelines.slug;
        urlEntries.push(
          createUrlEntry(
            `${baseUrl}/timelines/${timelineSlug}/events/${event.slug}`,
            new Date(event.updated_at),
            'weekly',
            0.7
          )
        );
      });

    // Person pages - only from published timelines
    (people || [])
      .filter((person: any) => person.timeline_people?.[0]?.timelines?.is_published)
      .forEach((person: any) => {
        const timelineSlug = person.timeline_people[0].timelines.slug;
        urlEntries.push(
          createUrlEntry(
            `${baseUrl}/timelines/${timelineSlug}/people/${person.slug}`,
            new Date(person.updated_at),
            'monthly',
            0.6
          )
        );
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
