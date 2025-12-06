export interface TimelineSeed {
  title: string;
  startYear: number;
  endYear: number;
  region?: string;
  context?: string;
  slug?: string;
}

export interface Citation {
  number: number;
  source: string;
  url?: string;
  type: 'primary' | 'secondary' | 'modern';
  reliability: 'high' | 'medium' | 'low';
}

export interface KeyQuote {
  text: string;
  citationNumber: number;
  context: string;
}

export interface ResearchCorpus {
  digest: string;
  citations: Citation[];
  keyQuotes: KeyQuote[];
  keyDataPoints: string[];
  primarySourcesFound: string[];
}

export interface SkeletonEvent {
  title: string;
  year: number;
  endYear?: number;
  oneSentence: string;
  keyFacts: string[];
  citationsToUse: number[];
  importance: 1 | 2 | 3;
  type: string;
  category: string;
}

export interface SkeletonPerson {
  name: string;
  birthYear?: number;
  deathYear?: number;
  role: string;
  oneSentence: string;
  keyFacts: string[];
  citationsToUse: number[];
  relatedEvents: string[];
}

export interface SkeletonTheme {
  id: string;
  title: string;
  oneSentence: string;
  relatedEvents: string[];
}

export interface PeriodBreakdown {
  name: string;
  startYear: number;
  endYear: number;
  eventCount: number;
}

export interface TimelineSkeleton {
  events: SkeletonEvent[];
  people: SkeletonPerson[];
  themes: SkeletonTheme[];
  periodization: PeriodBreakdown[];
}

export interface OverviewSection {
  subheading?: string;
  content: string;
  citationsUsed: number[];
}

export interface EventLink {
  textToLink: string;
  eventSlug: string;
}

export interface StoryBeat {
  beatType: string;
  title: string;
  paragraphs: string[];
  eventLinks: EventLink[];
}

export interface ExpandedTheme {
  id: string;
  title: string;
  description: string;
  icon?: string;
  relatedEventSlugs: string[];
}

export interface MainNarrative {
  pageTitle: string;
  centralQuestion: string;
  summary: string;
  storyBeats: StoryBeat[];
  overview?: OverviewSection[];
  themes: ExpandedTheme[];
  storyCharacter: string;
  keyPeople: string[];
}

export interface ExpandedEvent {
  title: string;
  year: number;
  slug: string;
  summary: string;
  description: string;
  significance: string;
  importance: 1 | 2 | 3;
  type: string;
  category: string;      // Fixed category: military, political, etc.
  themeId: string;       // Links to thematic thread
  tags?: string[];
}

export interface ExpandedPerson {
  name: string;
  slug: string;
  birthYear?: number;
  deathYear?: number;
  role: string;
  bioShort: string;
  bioLong: string;
  relatedEventSlugs: string[];
}

export interface TurningPoint {
  title: string;
  eventSlug: string;
  description: string;
  beforeAfter: {
    before: string;
    after: string;
  };
}

export interface InterpretationSection {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  citations: number[];
}

export interface KeyHighlight {
  eventSlug: string;
  year: number;
  title: string;
  summary: string;
  whyItMatters: string;
  immediateImpact: string;
  tags: string[];
  citations: number[];
}

export interface Perspective {
  category: 'INTERPRETATIONS' | 'DEBATES' | 'CONFLICT' | 'HISTORIOGRAPHY' | 'WITH HINDSIGHT' | 'SOURCES AND BIAS';
  title: string;
  content: string;
  citations: number[];
}

export interface ThemeInsight {
  themeId: string;
  insight: string;
  supportingEvents: string[];
  analysis?: string;
  modernRelevance?: string;
  citations?: number[];
}

export interface KeyFact {
  label: string;
  value: string;
  citation?: number;
}

export interface Enrichment {
  people: ExpandedPerson[];
  turningPoints: TurningPoint[];
  perspectives: Perspective[];
  themeInsights: ThemeInsight[];
  keyFacts: KeyFact[];
  interpretationSections: InterpretationSection[];
  keyHighlights: KeyHighlight[];
}

export interface SEOMetadata {
  seoTitle: string;
  metaDescription: string;
  keywords: string[];
  ogTitle: string;
  ogDescription: string;
  schemaSuggestions: {
    timeline: object;
    events: object;
    people: object;
  };
}

export interface GenerationContext {
  seed: TimelineSeed;
  researchCorpus?: ResearchCorpus;
  skeleton?: TimelineSkeleton;
  mainNarrative?: MainNarrative;
  expandedEvents?: ExpandedEvent[];
  enrichment?: Enrichment;
  seo?: SEOMetadata;
}
