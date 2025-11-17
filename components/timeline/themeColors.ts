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
