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
  overview: OverviewSection[];
  summary: string;
  themes: ExpandedTheme[];
  storyCharacter: string;
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
  category: string;
  tags: string[];
}

export interface RecapParagraph {
  text: string;
  eventLinks: Array<{ eventSlug: string; textToLink: string }>;
}

export interface StoryformRecap {
  paragraphs: RecapParagraph[];
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

export interface Perspective {
  viewpoint: string;
  summary: string;
  keyArguments: string[];
}

export interface ThemeInsight {
  themeId: string;
  insight: string;
  supportingEvents: string[];
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
  storyformRecap?: StoryformRecap;
  enrichment?: Enrichment;
  seo?: SEOMetadata;
}
