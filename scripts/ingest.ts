import { slugify } from '@/lib/utils';
import { validateTimeline, validateEvent, validatePerson } from '@/lib/validation';

/**
 * Timeline seed data structure
 */
export interface TimelineSeed {
  title: string;
  startYear: number;
  endYear: number;
  region?: string;
  summary?: string;
  eventCount?: number;
  peopleCount?: number;
}

/**
 * Predefined timeline seeds for initial content
 */
export const TIMELINE_SEEDS: TimelineSeed[] = [
  {
    title: 'Aztec Empire',
    startYear: 1345,
    endYear: 1521,
    region: 'Central America',
    summary: 'The rise and fall of the Aztec civilization in Mesoamerica.',
    eventCount: 20,
    peopleCount: 10,
  },
  {
    title: 'Hun Conquests',
    startYear: 370,
    endYear: 469,
    region: 'Europe and Asia',
    summary: 'The expansion and military campaigns of the Hunnic Empire.',
    eventCount: 15,
    peopleCount: 8,
  },
  {
    title: 'Roman Republic',
    startYear: -509,
    endYear: -27,
    region: 'Mediterranean',
    summary: 'The political evolution of Rome from kingdom to republic to empire.',
    eventCount: 25,
    peopleCount: 15,
  },
  {
    title: 'Mongol Empire',
    startYear: 1206,
    endYear: 1368,
    region: 'Asia',
    summary: 'The vast conquests and cultural exchanges of the Mongol Empire.',
    eventCount: 20,
    peopleCount: 12,
  },
  {
    title: 'Ancient Egypt - New Kingdom',
    startYear: -1550,
    endYear: -1077,
    region: 'Africa',
    summary: 'The golden age of ancient Egypt, marked by military expansion and monumental building.',
    eventCount: 22,
    peopleCount: 14,
  },
  {
    title: 'Byzantine Empire',
    startYear: 330,
    endYear: 1453,
    region: 'Mediterranean',
    summary: 'The Eastern Roman Empire from the founding of Constantinople to its fall.',
    eventCount: 30,
    peopleCount: 18,
  },
  {
    title: 'Islamic Golden Age',
    startYear: 750,
    endYear: 1258,
    region: 'Middle East',
    summary: 'A period of cultural, economic, and scientific flourishing in the Islamic world.',
    eventCount: 25,
    peopleCount: 16,
  },
  {
    title: 'Viking Age',
    startYear: 793,
    endYear: 1066,
    region: 'Northern Europe',
    summary: 'The expansion, exploration, and cultural impact of Norse seafarers.',
    eventCount: 18,
    peopleCount: 10,
  },
  {
    title: 'Han Dynasty',
    startYear: -206,
    endYear: 220,
    region: 'East Asia',
    summary: 'A period of Chinese consolidation, cultural development, and territorial expansion.',
    eventCount: 24,
    peopleCount: 14,
  },
  {
    title: 'Renaissance Italy',
    startYear: 1300,
    endYear: 1600,
    region: 'Europe',
    summary: 'A period of cultural rebirth in art, science, and humanism.',
    eventCount: 28,
    peopleCount: 20,
  },
  {
    title: 'Inca Empire',
    startYear: 1438,
    endYear: 1533,
    region: 'South America',
    summary: 'The largest empire in pre-Columbian America.',
    eventCount: 16,
    peopleCount: 8,
  },
  {
    title: 'Persian Empire - Achaemenid',
    startYear: -550,
    endYear: -330,
    region: 'Middle East',
    summary: 'The first Persian Empire, spanning three continents.',
    eventCount: 20,
    peopleCount: 12,
  },
  {
    title: 'Crusades',
    startYear: 1095,
    endYear: 1291,
    region: 'Europe and Middle East',
    summary: 'Religious military campaigns for control of the Holy Land.',
    eventCount: 22,
    peopleCount: 15,
  },
  {
    title: 'Mali Empire',
    startYear: 1235,
    endYear: 1670,
    region: 'Africa',
    summary: 'A wealthy West African empire known for its gold trade and scholarly centers.',
    eventCount: 18,
    peopleCount: 10,
  },
  {
    title: 'Maurya Empire',
    startYear: -322,
    endYear: -185,
    region: 'South Asia',
    summary: 'The first major empire in ancient India.',
    eventCount: 16,
    peopleCount: 9,
  },
  {
    title: 'Ottoman Empire Rise',
    startYear: 1299,
    endYear: 1566,
    region: 'Middle East and Europe',
    summary: 'The rise of the Ottoman Empire to its peak under Suleiman the Magnificent.',
    eventCount: 26,
    peopleCount: 16,
  },
  {
    title: 'Spanish Reconquista',
    startYear: 718,
    endYear: 1492,
    region: 'Europe',
    summary: 'Christian kingdoms reclaiming the Iberian Peninsula from Muslim rule.',
    eventCount: 24,
    peopleCount: 14,
  },
  {
    title: 'Warring States Period',
    startYear: -475,
    endYear: -221,
    region: 'East Asia',
    summary: 'A period of intense warfare among Chinese states before unification.',
    eventCount: 20,
    peopleCount: 12,
  },
  {
    title: 'Heian Period',
    startYear: 794,
    endYear: 1185,
    region: 'East Asia',
    summary: 'The golden age of Japanese imperial court culture.',
    eventCount: 18,
    peopleCount: 11,
  },
  {
    title: 'Khmer Empire',
    startYear: 802,
    endYear: 1431,
    region: 'Southeast Asia',
    summary: 'A powerful empire known for Angkor Wat and cultural achievements.',
    eventCount: 20,
    peopleCount: 10,
  },
];

/**
 * Parse and validate timeline seed data
 */
export function parseTimelineSeed(seed: TimelineSeed) {
  const slug = slugify(seed.title);
  
  const timeline = {
    title: seed.title,
    slug,
    start_year: seed.startYear,
    end_year: seed.endYear,
    region: seed.region || null,
    summary: seed.summary || null,
  };

  // Validate
  return validateTimeline(timeline);
}

/**
 * Extract timeline metadata from various sources
 */
export function extractTimelineMetadata(source: string): Partial<TimelineSeed> {
  // This is a placeholder for more sophisticated extraction
  // Could integrate with APIs, scraping, or structured data sources
  
  return {
    title: 'Unknown Timeline',
    startYear: 0,
    endYear: 0,
  };
}

/**
 * Batch import timelines from seed data
 */
export async function batchImportTimelines(
  seeds: TimelineSeed[],
  onProgress?: (current: number, total: number, timeline: string) => void
): Promise<Array<{ success: boolean; timeline: string; error?: string }>> {
  const results: Array<{ success: boolean; timeline: string; error?: string }> = [];

  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i];
    
    if (onProgress) {
      onProgress(i + 1, seeds.length, seed.title);
    }

    try {
      parseTimelineSeed(seed);
      results.push({
        success: true,
        timeline: seed.title,
      });
    } catch (error) {
      results.push({
        success: false,
        timeline: seed.title,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * Validate batch of events
 */
export function validateEventBatch(events: any[]) {
  const results: Array<{ success: boolean; event: string; error?: string }> = [];

  for (const event of events) {
    try {
      validateEvent(event);
      results.push({
        success: true,
        event: event.title || 'Unknown',
      });
    } catch (error) {
      results.push({
        success: false,
        event: event.title || 'Unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * Validate batch of people
 */
export function validatePeopleBatch(people: any[]) {
  const results: Array<{ success: boolean; person: string; error?: string }> = [];

  for (const person of people) {
    try {
      validatePerson(person);
      results.push({
        success: true,
        person: person.name || 'Unknown',
      });
    } catch (error) {
      results.push({
        success: false,
        person: person.name || 'Unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * Get a specific timeline seed by title
 */
export function getTimelineSeed(title: string): TimelineSeed | undefined {
  return TIMELINE_SEEDS.find(
    seed => seed.title.toLowerCase() === title.toLowerCase()
  );
}

/**
 * Get timeline seeds by region
 */
export function getTimelineSeedsByRegion(region: string): TimelineSeed[] {
  return TIMELINE_SEEDS.filter(
    seed => seed.region?.toLowerCase().includes(region.toLowerCase())
  );
}

/**
 * Get timeline seeds by date range
 */
export function getTimelineSeedsByDateRange(
  startYear: number,
  endYear: number
): TimelineSeed[] {
  return TIMELINE_SEEDS.filter(
    seed => seed.startYear >= startYear && seed.endYear <= endYear
  );
}
