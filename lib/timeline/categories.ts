export const TIMELINE_CATEGORIES = {
  military: { label: 'Military', color: 'red' },
  political: { label: 'Political', color: 'purple' },
  diplomatic: { label: 'Diplomatic', color: 'blue' },
  economic: { label: 'Economic', color: 'amber' },
  cultural: { label: 'Cultural', color: 'green' },
  crisis: { label: 'Crisis', color: 'orange' },
  legal: { label: 'Legal', color: 'slate' },
  administrative: { label: 'Administrative', color: 'teal' },
} as const;

export type TimelineCategory = keyof typeof TIMELINE_CATEGORIES;

export function isValidCategory(value: string): value is TimelineCategory {
  return value in TIMELINE_CATEGORIES;
}
