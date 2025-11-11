/**
 * Site-wide constants and configuration
 */

// Site Information
export const SITE_NAME = 'History Timelines';
export const SITE_DESCRIPTION = 'Explore comprehensive interactive timelines of historical events, civilizations, and key figures.';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://historytimelines.com';

// Social Media
export const TWITTER_HANDLE = '@historytimelines';
export const FACEBOOK_URL = 'https://facebook.com/historytimelines';

// Pagination
export const TIMELINES_PER_PAGE = 20;
export const EVENTS_PER_PAGE = 50;
export const PEOPLE_PER_PAGE = 30;

// Content Limits
export const MAX_TIMELINE_EVENTS = 100;
export const MAX_TIMELINE_PEOPLE = 50;
export const MAX_EVENT_PEOPLE = 20;

// Display Limits
export const HIGHLIGHT_EVENTS_COUNT = 8;
export const KEY_PEOPLE_DISPLAY_COUNT = 12;
export const SUGGESTED_QUESTIONS_COUNT = 5;
export const NEIGHBOR_EVENTS_COUNT = 3;

// Word Count Targets (for content generation)
export const TIMELINE_WORD_COUNT_MIN = 1000;
export const TIMELINE_WORD_COUNT_MAX = 1800;
export const EVENT_WORD_COUNT_MIN = 400;
export const EVENT_WORD_COUNT_MAX = 900;
export const PERSON_WORD_COUNT_MIN = 600;
export const PERSON_WORD_COUNT_MAX = 1000;

// Importance Levels
export const IMPORTANCE_LEVELS = {
  NOTABLE: 1,
  SIGNIFICANT: 2,
  MAJOR: 3,
} as const;

export const IMPORTANCE_LABELS = {
  [IMPORTANCE_LEVELS.NOTABLE]: 'Notable Event',
  [IMPORTANCE_LEVELS.SIGNIFICANT]: 'Significant Event',
  [IMPORTANCE_LEVELS.MAJOR]: 'Major Event',
} as const;

export const IMPORTANCE_COLORS = {
  [IMPORTANCE_LEVELS.NOTABLE]: 'gray',
  [IMPORTANCE_LEVELS.SIGNIFICANT]: 'blue',
  [IMPORTANCE_LEVELS.MAJOR]: 'red',
} as const;

// Event Types
export const EVENT_TYPES = [
  'Battle',
  'Treaty',
  'Coronation',
  'Discovery',
  'Revolution',
  'Conquest',
  'Foundation',
  'Collapse',
  'Reform',
  'Cultural',
  'Economic',
  'Religious',
  'Technological',
] as const;

// Regions
export const REGIONS = [
  'Europe',
  'Asia',
  'Africa',
  'Americas',
  'Middle East',
  'Oceania',
  'Mediterranean',
  'Central Asia',
  'East Asia',
  'South Asia',
  'Southeast Asia',
  'North America',
  'South America',
  'Central America',
  'Caribbean',
] as const;

// Cache & Revalidation
export const REVALIDATE_TIME = 3600; // 1 hour in seconds
export const CACHE_TAGS = {
  TIMELINES: 'timelines',
  EVENTS: 'events',
  PEOPLE: 'people',
  TIMELINE: (slug: string) => `timeline-${slug}`,
  EVENT: (slug: string) => `event-${slug}`,
  PERSON: (slug: string) => `person-${slug}`,
} as const;

// API Configuration
export const GEMINI_MODEL = 'gemini-1.5-pro';
export const GEMINI_MAX_TOKENS = 1000;
export const GEMINI_CONTEXT_WINDOW = 1000000; // 1M tokens
export const GPT_MODEL = 'gpt-4-turbo-preview';
export const GPT_MAX_TOKENS = 4000;
export const GPT_CONTEXT_WINDOW = 400000; // 400k tokens

// Rate Limits
export const GEMINI_REQUESTS_PER_MINUTE = 10;
export const GPT_REQUESTS_PER_MINUTE = 5;

// Date Ranges
export const MIN_YEAR = -3000; // 3000 BCE
export const MAX_YEAR = new Date().getFullYear();
export const DEFAULT_YEAR_RANGE = [MIN_YEAR, MAX_YEAR] as const;

// Search
export const SEARCH_RESULTS_LIMIT = 20;
export const SEARCH_MIN_QUERY_LENGTH = 2;

// Navigation
export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Timelines', href: '/timelines' },
  { label: 'About', href: '/about' },
] as const;

export const FOOTER_LINKS = {
  explore: [
    { label: 'All Timelines', href: '/timelines' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  TIMELINE_NOT_FOUND: 'Timeline not found',
  EVENT_NOT_FOUND: 'Event not found',
  PERSON_NOT_FOUND: 'Person not found',
  GENERIC_ERROR: 'An error occurred. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  VALIDATION_ERROR: 'Invalid input. Please check your data.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  DATA_LOADED: 'Data loaded successfully',
  SEARCH_COMPLETE: 'Search completed',
} as const;

// Loading States
export const LOADING_MESSAGES = {
  LOADING_TIMELINE: 'Loading timeline...',
  LOADING_EVENT: 'Loading event...',
  LOADING_PERSON: 'Loading person...',
  GENERATING_ANSWER: 'Generating answer...',
  SEARCHING: 'Searching...',
} as const;

// Breakpoints (matching Tailwind defaults)
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// Animation Durations (in milliseconds)
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  RECENT_SEARCHES: 'history-timelines:recent-searches',
  FAVORITES: 'history-timelines:favorites',
  THEME: 'history-timelines:theme',
} as const;
