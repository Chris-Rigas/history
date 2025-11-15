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
    title: 'Julio-Claudian Dynasty Timeline',
    startYear: -27,
    endYear: 68,
    region: 'Roman Empire',
    summary: 'From Augustus to Nero, the founding imperial dynasty consolidates Roman power.',
    eventCount: 18,
    peopleCount: 10,
  },
  {
    title: 'Year of the Four Emperors Timeline',
    startYear: 68,
    endYear: 69,
    region: 'Roman Empire',
    summary: 'Civil war and rapid succession usher in the Flavian dynasty after Nero’s death.',
    eventCount: 12,
    peopleCount: 6,
  },
  {
    title: 'Flavian Dynasty Timeline',
    startYear: 69,
    endYear: 96,
    region: 'Roman Empire',
    summary: 'Vespasian and his heirs restore stability and oversee monumental building projects.',
    eventCount: 16,
    peopleCount: 8,
  },
  {
    title: 'Five Good Emperors Timeline',
    startYear: 96,
    endYear: 180,
    region: 'Roman Empire',
    summary: 'Nerva through Marcus Aurelius guide Rome through an era of prosperity and expansion.',
    eventCount: 20,
    peopleCount: 10,
  },
  {
    title: 'Crisis of the Third Century Timeline',
    startYear: 235,
    endYear: 284,
    region: 'Roman Empire',
    summary: 'A near-collapse marked by invasions, usurpations, and economic turmoil.',
    eventCount: 22,
    peopleCount: 12,
  },
  {
    title: 'Fall of the Western Roman Empire Timeline',
    startYear: 376,
    endYear: 476,
    region: 'Western Roman Empire',
    summary: 'Barbarian migrations and internal weakness culminate in the deposition of Romulus Augustulus.',
    eventCount: 24,
    peopleCount: 12,
  },
  {
    title: 'Punic Wars Timeline',
    startYear: -264,
    endYear: -146,
    region: 'Mediterranean',
    summary: 'Rome and Carthage clash for Mediterranean supremacy across three epic wars.',
    eventCount: 18,
    peopleCount: 10,
  },
  {
    title: 'Roman Conquest of Gaul Timeline',
    startYear: -58,
    endYear: -50,
    region: 'Western Europe',
    summary: 'Julius Caesar subdues the Gallic tribes and expands Roman territory to the Atlantic.',
    eventCount: 14,
    peopleCount: 8,
  },
  {
    title: 'Roman Conquest of Britain Timeline',
    startYear: 43,
    endYear: 84,
    region: 'Britannia',
    summary: 'From Claudius’s invasion to Agricola’s campaigns in northern Britain.',
    eventCount: 14,
    peopleCount: 8,
  },
  {
    title: 'Roman Parthian Wars Timeline',
    startYear: -54,
    endYear: 217,
    region: 'Near East',
    summary: 'Centuries of conflict between Rome and Parthia for dominance in Mesopotamia.',
    eventCount: 20,
    peopleCount: 10,
  },
  {
    title: 'Roman Germanic Wars Timeline',
    startYear: -113,
    endYear: 476,
    region: 'Northern Frontiers',
    summary: 'Recurring conflicts with Germanic peoples from the Cimbrian War to the fall of the West.',
    eventCount: 24,
    peopleCount: 12,
  },
  {
    title: 'Jewish Roman Wars Timeline',
    startYear: 66,
    endYear: 135,
    region: 'Judea',
    summary: 'Jewish revolts challenge Roman rule from the Great Revolt to the Bar Kokhba uprising.',
    eventCount: 16,
    peopleCount: 8,
  },
  {
    title: 'Julius Caesar Timeline',
    startYear: -100,
    endYear: -44,
    region: 'Roman Republic',
    summary: 'The life, military campaigns, and assassination of Rome’s most famous general.',
    eventCount: 18,
    peopleCount: 10,
  },
  {
    title: 'Augustus Timeline',
    startYear: -63,
    endYear: 14,
    region: 'Roman Empire',
    summary: 'Octavian’s rise to power and transformation of Rome into an enduring empire.',
    eventCount: 18,
    peopleCount: 10,
  },
  {
    title: 'Constantine the Great Timeline',
    startYear: 272,
    endYear: 337,
    region: 'Roman Empire',
    summary: 'The emperor who embraced Christianity and refounded the empire at Constantinople.',
    eventCount: 16,
    peopleCount: 8,
  },
  {
    title: 'Marcus Aurelius Timeline',
    startYear: 121,
    endYear: 180,
    region: 'Roman Empire',
    summary: 'The philosopher-emperor balances Stoic ideals with frontier warfare.',
    eventCount: 14,
    peopleCount: 8,
  },
  {
    title: 'Nero Timeline',
    startYear: 37,
    endYear: 68,
    region: 'Roman Empire',
    summary: 'A controversial reign marked by cultural patronage and catastrophic scandals.',
    eventCount: 12,
    peopleCount: 6,
  },
  {
    title: 'Trajan Timeline',
    startYear: 53,
    endYear: 117,
    region: 'Roman Empire',
    summary: 'The optimus princeps expands Rome to its greatest territorial extent.',
    eventCount: 14,
    peopleCount: 8,
  },
  {
    title: 'Severan Dynasty Timeline',
    startYear: 193,
    endYear: 235,
    region: 'Roman Empire',
    summary: 'Military emperors from Septimius Severus to Alexander Severus reshape imperial politics.',
    eventCount: 16,
    peopleCount: 8,
  },
  {
    title: 'Tetrarchy Reforms Timeline',
    startYear: 293,
    endYear: 313,
    region: 'Roman Empire',
    summary: 'Diocletian’s system of shared rule attempts to stabilize the empire’s governance.',
    eventCount: 14,
    peopleCount: 8,
  },
  {
    title: 'Roman Civil Wars Timeline',
    startYear: -133,
    endYear: -30,
    region: 'Roman Republic',
    summary: 'Internal conflicts from the Gracchi era to Octavian’s triumph at Actium.',
    eventCount: 22,
    peopleCount: 12,
  },
  {
    title: 'Social War Timeline',
    startYear: -91,
    endYear: -87,
    region: 'Italian Peninsula',
    summary: 'Rome’s Italian allies fight for citizenship and political rights.',
    eventCount: 10,
    peopleCount: 6,
  },
  {
    title: 'Roman Expansion into Hispania Timeline',
    startYear: -218,
    endYear: -19,
    region: 'Iberian Peninsula',
    summary: 'From the Second Punic War to the Cantabrian campaigns, Rome secures Iberia.',
    eventCount: 18,
    peopleCount: 10,
  },
  {
    title: 'Roman Dacian Wars Timeline',
    startYear: 85,
    endYear: 106,
    region: 'Danubian Frontier',
    summary: 'Conflicts culminating in Trajan’s conquest of Dacia and the creation of a new province.',
    eventCount: 12,
    peopleCount: 6,
  },
  {
    title: 'Macedonian Wars Timeline',
    startYear: -214,
    endYear: -148,
    region: 'Eastern Mediterranean',
    summary: 'Rome dismantles Macedonian power through a series of decisive wars.',
    eventCount: 14,
    peopleCount: 8,
  },
  {
    title: 'Roman Seleucid Conflict Timeline',
    startYear: -192,
    endYear: -188,
    region: 'Eastern Mediterranean',
    summary: 'The Roman-Seleucid War ends Hellenistic dominance in Asia Minor.',
    eventCount: 10,
    peopleCount: 6,
  },
  {
    title: 'Third Servile War Timeline',
    startYear: -73,
    endYear: -71,
    region: 'Italian Peninsula',
    summary: 'Spartacus leads the largest slave uprising against the Roman Republic.',
    eventCount: 10,
    peopleCount: 6,
  },
  {
    title: 'Carthaginian Decline Timeline',
    startYear: -241,
    endYear: -146,
    region: 'Western Mediterranean',
    summary: 'Carthage struggles to recover after the First Punic War before Rome destroys the city.',
    eventCount: 12,
    peopleCount: 6,
  },
  {
    title: 'Rise of Rome over the Hellenistic Kingdoms Timeline',
    startYear: -200,
    endYear: -30,
    region: 'Mediterranean',
    summary: 'Rome absorbs Hellenistic realms culminating in the annexation of Egypt.',
    eventCount: 16,
    peopleCount: 8,
  },
  {
    title: 'Early Byzantine Empire Timeline',
    startYear: 330,
    endYear: 602,
    region: 'Eastern Roman Empire',
    summary: 'From Constantinople’s founding to the Heraclian reforms, the eastern empire evolves.',
    eventCount: 22,
    peopleCount: 12,
  },
  {
    title: 'Roman Populism Timeline',
    startYear: -133,
    endYear: -27,
    region: 'Roman Republic',
    summary: 'Popularis leaders challenge senatorial dominance from the Gracchi to Caesar.',
    eventCount: 14,
    peopleCount: 8,
  },
  {
    title: 'Roman Slavery Timeline',
    startYear: -200,
    endYear: 476,
    region: 'Roman World',
    summary: 'The role of enslaved people in Roman society, economy, and resistance movements.',
    eventCount: 20,
    peopleCount: 10,
  },
  {
    title: 'Roman Stoicism Timeline',
    startYear: -150,
    endYear: 200,
    region: 'Roman Empire',
    summary: 'The adaptation of Stoic philosophy from Panaetius to Marcus Aurelius.',
    eventCount: 12,
    peopleCount: 6,
  },
  {
    title: 'Roman Citizenship Timeline',
    startYear: -90,
    endYear: 212,
    region: 'Roman Empire',
    summary: 'Legal milestones culminating in the Constitutio Antoniniana extending citizenship empire-wide.',
    eventCount: 12,
    peopleCount: 6,
  },
  {
    title: 'Roman Republicanism Timeline',
    startYear: -509,
    endYear: -27,
    region: 'Roman Republic',
    summary: 'Institutions and ideals of Rome’s republic from the expulsion of the kings to Augustus.',
    eventCount: 20,
    peopleCount: 10,
  },
  {
    title: 'Roman Urbanization Timeline',
    startYear: -500,
    endYear: 400,
    region: 'Roman World',
    summary: 'City planning, public amenities, and civic life across the expanding empire.',
    eventCount: 18,
    peopleCount: 10,
  },
  {
    title: 'Roman Roads Timeline',
    startYear: -312,
    endYear: 400,
    region: 'Roman World',
    summary: 'The construction and maintenance of Rome’s vast network of roads.',
    eventCount: 16,
    peopleCount: 8,
  },
  {
    title: 'Roman Aqueducts Timeline',
    startYear: -312,
    endYear: 226,
    region: 'Roman World',
    summary: 'Engineering feats that delivered water to Roman cities for centuries.',
    eventCount: 14,
    peopleCount: 8,
  },
  {
    title: 'Roman Concrete Timeline',
    startYear: -200,
    endYear: 476,
    region: 'Roman World',
    summary: 'Innovation and architectural achievements made possible by opus caementicium.',
    eventCount: 14,
    peopleCount: 8,
  },
  {
    title: 'Roman Military Engineering Timeline',
    startYear: -264,
    endYear: 378,
    region: 'Roman World',
    summary: 'Siege works, camps, and machines that sustained Roman battlefield supremacy.',
    eventCount: 18,
    peopleCount: 10,
  },
  {
    title: 'Roman Siege Weapons Timeline',
    startYear: -396,
    endYear: 410,
    region: 'Roman World',
    summary: 'Development and deployment of artillery from early ballistae to late empire defenses.',
    eventCount: 14,
    peopleCount: 8,
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
