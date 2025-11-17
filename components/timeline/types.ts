import type { TimelineThemeCategory } from '@/lib/timelines/structuredContent';
import type { ThemeColorConfig } from './themeColors';

export type ThemedTimelineCategory = TimelineThemeCategory & {
  colorClass: ThemeColorConfig;
};
