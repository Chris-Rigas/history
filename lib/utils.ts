import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for merging Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a year or year range for display
 */
export function formatYearRange(startYear: number, endYear?: number | null): string {
  if (!endYear || endYear === startYear) {
    return `${startYear}`;
  }
  return `${startYear} — ${endYear}`;
}

/**
 * Format life dates for a person
 */
export function formatLifeDates(birthYear?: number | null, deathYear?: number | null): string | null {
  const birth = birthYear ? `${birthYear}` : '?';
  const death = deathYear ? `${deathYear}` : '?';
  
  if (birth === '?' && death === '?') {
    return null;
  }
  
  return `${birth} — ${death}`;
}

/**
 * Calculate lifespan from birth and death years
 */
export function calculateLifespan(birthYear?: number | null, deathYear?: number | null): number | null {
  if (birthYear && deathYear) {
    return deathYear - birthYear;
  }
  return null;
}

/**
 * Create a URL-friendly slug from a string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Truncate text to a specified length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Strip HTML tags from a string
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Extract first N words from text
 */
export function extractWords(text: string, wordCount: number): string {
  const words = text.split(/\s+/);
  if (words.length <= wordCount) {
    return text;
  }
  return words.slice(0, wordCount).join(' ') + '...';
}

/**
 * Format a number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Calculate time period duration
 */
export function calculateDuration(startYear: number, endYear: number): {
  years: number;
  decades: number;
  centuries: number;
} {
  const years = endYear - startYear;
  const decades = Math.floor(years / 10);
  const centuries = Math.floor(years / 100);
  
  return { years, decades, centuries };
}

/**
 * Format duration in human-readable form
 */
export function formatDuration(startYear: number, endYear: number): string {
  const duration = calculateDuration(startYear, endYear);
  
  if (duration.centuries > 0) {
    const remainingYears = duration.years % 100;
    if (remainingYears === 0) {
      return `${duration.centuries} ${duration.centuries === 1 ? 'century' : 'centuries'}`;
    }
    return `${duration.centuries} ${duration.centuries === 1 ? 'century' : 'centuries'} and ${remainingYears} years`;
  }
  
  if (duration.decades > 0) {
    const remainingYears = duration.years % 10;
    if (remainingYears === 0) {
      return `${duration.decades} ${duration.decades === 1 ? 'decade' : 'decades'}`;
    }
    return `${duration.decades} ${duration.decades === 1 ? 'decade' : 'decades'} and ${remainingYears} years`;
  }
  
  return `${duration.years} ${duration.years === 1 ? 'year' : 'years'}`;
}

/**
 * Safely parse JSON with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Debounce function for rate-limiting function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Check if a year is BCE/CE
 */
export function formatYearWithEra(year: number): string {
  if (year < 0) {
    return `${Math.abs(year)} BCE`;
  }
  return `${year} CE`;
}

/**
 * Group items by a key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Chunk array into smaller arrays
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
