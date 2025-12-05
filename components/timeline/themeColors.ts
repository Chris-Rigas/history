import { TimelineCategory, TIMELINE_CATEGORIES } from '@/lib/timeline/categories';

export interface ThemeColorConfig {
  dot: string;
  badge: string;
  badgeText: string;
  lightBg: string;
  border: string;
  text: string;
  line: string;
}

const PALETTE: ThemeColorConfig[] = [
  {
    dot: 'bg-rose-500',
    badge: 'bg-rose-100',
    badgeText: 'text-rose-800',
    lightBg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-900',
    line: 'bg-rose-200',
  },
  {
    dot: 'bg-amber-500',
    badge: 'bg-amber-100',
    badgeText: 'text-amber-900',
    lightBg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-900',
    line: 'bg-amber-200',
  },
  {
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-100',
    badgeText: 'text-emerald-900',
    lightBg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-900',
    line: 'bg-emerald-200',
  },
  {
    dot: 'bg-indigo-500',
    badge: 'bg-indigo-100',
    badgeText: 'text-indigo-900',
    lightBg: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-900',
    line: 'bg-indigo-200',
  },
  {
    dot: 'bg-cyan-500',
    badge: 'bg-cyan-100',
    badgeText: 'text-cyan-900',
    lightBg: 'bg-cyan-50',
    border: 'border-cyan-200',
    text: 'text-cyan-900',
    line: 'bg-cyan-200',
  },
  {
    dot: 'bg-fuchsia-500',
    badge: 'bg-fuchsia-100',
    badgeText: 'text-fuchsia-900',
    lightBg: 'bg-fuchsia-50',
    border: 'border-fuchsia-200',
    text: 'text-fuchsia-900',
    line: 'bg-fuchsia-200',
  },
];

export function getThemeColor(index: number): ThemeColorConfig {
  return PALETTE[index % PALETTE.length];
}

export const CATEGORY_COLORS: Record<TimelineCategory, ThemeColorConfig> = {
  military: {
    dot: 'bg-red-500',
    badge: 'bg-red-100',
    badgeText: 'text-red-800',
    lightBg: 'bg-red-50',
    border: 'border-red-400',
    text: 'text-red-700',
    line: 'bg-red-200',
  },
  political: {
    dot: 'bg-purple-500',
    badge: 'bg-purple-100',
    badgeText: 'text-purple-800',
    lightBg: 'bg-purple-50',
    border: 'border-purple-400',
    text: 'text-purple-700',
    line: 'bg-purple-200',
  },
  diplomatic: {
    dot: 'bg-blue-500',
    badge: 'bg-blue-100',
    badgeText: 'text-blue-800',
    lightBg: 'bg-blue-50',
    border: 'border-blue-400',
    text: 'text-blue-700',
    line: 'bg-blue-200',
  },
  economic: {
    dot: 'bg-amber-500',
    badge: 'bg-amber-100',
    badgeText: 'text-amber-800',
    lightBg: 'bg-amber-50',
    border: 'border-amber-400',
    text: 'text-amber-700',
    line: 'bg-amber-200',
  },
  cultural: {
    dot: 'bg-green-500',
    badge: 'bg-green-100',
    badgeText: 'text-green-800',
    lightBg: 'bg-green-50',
    border: 'border-green-400',
    text: 'text-green-700',
    line: 'bg-green-200',
  },
  crisis: {
    dot: 'bg-orange-500',
    badge: 'bg-orange-100',
    badgeText: 'text-orange-800',
    lightBg: 'bg-orange-50',
    border: 'border-orange-400',
    text: 'text-orange-700',
    line: 'bg-orange-200',
  },
  legal: {
    dot: 'bg-slate-500',
    badge: 'bg-slate-100',
    badgeText: 'text-slate-800',
    lightBg: 'bg-slate-50',
    border: 'border-slate-400',
    text: 'text-slate-700',
    line: 'bg-slate-200',
  },
  administrative: {
    dot: 'bg-teal-500',
    badge: 'bg-teal-100',
    badgeText: 'text-teal-800',
    lightBg: 'bg-teal-50',
    border: 'border-teal-400',
    text: 'text-teal-700',
    line: 'bg-teal-200',
  },
};

export function getCategoryColor(category: string): ThemeColorConfig {
  if (category in TIMELINE_CATEGORIES) {
    return CATEGORY_COLORS[category as TimelineCategory];
  }
  // Fallback
  return CATEGORY_COLORS.political;
}
