import type { Event } from '@/lib/database.types';
import type {
  TimelineEventNote,
  TimelineEventRelationship,
  TimelineStructuredContent,
  TimelineThemeCategory,
  TimelineTurningPoint,
} from './structuredContent';

interface NormalizedEvent {
  event: Event;
  key: string;
}

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function buildEventIndex(events: Event[]): NormalizedEvent[] {
  return events.map(event => ({
    event,
    key: normalizeKey(event.title),
  }));
}

function findEventByTitle(index: NormalizedEvent[], title: string): Event | null {
  if (!title) {
    return null;
  }

  const normalized = normalizeKey(title);
  if (!normalized) {
    return null;
  }

  let direct = index.find(item => item.key === normalized);
  if (direct) {
    return direct.event;
  }

  direct = index.find(item => item.key.includes(normalized) || normalized.includes(item.key));
  return direct ? direct.event : null;
}

export interface BoundRelationship extends TimelineEventRelationship {
  targetSlug?: string;
}

export interface EventNarrativeBinding {
  note?: TimelineEventNote;
  category?: TimelineThemeCategory;
  relationships: BoundRelationship[];
}

export interface BoundConnector {
  text: string;
  afterEventSlug?: string;
}

export interface BoundTurningPoint extends TimelineTurningPoint {
  eventSlug?: string;
}

export interface NarrativeBindings {
  eventNarratives: Record<string, EventNarrativeBinding>;
  connectors: BoundConnector[];
  turningPoints: BoundTurningPoint[];
}

export function bindNarrativeData(
  events: Event[],
  structured?: TimelineStructuredContent | null
): NarrativeBindings {
  const eventNarratives: Record<string, EventNarrativeBinding> = {};
  const baseIndex = buildEventIndex(events);

  events.forEach(event => {
    eventNarratives[event.slug] = { relationships: [] };
  });

  if (!structured) {
    return { eventNarratives, connectors: [], turningPoints: [] };
  }

  const themesById = new Map<string, TimelineThemeCategory>();
  structured.themes.forEach(theme => themesById.set(theme.id, theme));

  structured.eventNotes.forEach(note => {
    const match = findEventByTitle(baseIndex, note.title);
    if (!match) {
      return;
    }

    const binding = eventNarratives[match.slug] || { relationships: [] };
    const relationships = note.relationships.map(rel => {
      const targetEvent = findEventByTitle(baseIndex, rel.targetTitle);
      return {
        ...rel,
        targetSlug: targetEvent?.slug,
      } satisfies BoundRelationship;
    });

    eventNarratives[match.slug] = {
      note,
      category: note.categoryId ? themesById.get(note.categoryId) : undefined,
      relationships,
    };
  });

  const connectors: BoundConnector[] = structured.connectors.map(connector => {
    const afterEvent = connector.afterEventTitle
      ? findEventByTitle(baseIndex, connector.afterEventTitle)
      : null;

    return {
      text: connector.text,
      afterEventSlug: afterEvent?.slug,
    };
  });

  const turningPoints: BoundTurningPoint[] = structured.turningPoints.map(point => {
    const event = findEventByTitle(baseIndex, point.title);
    return {
      ...point,
      eventSlug: event?.slug,
    };
  });

  return { eventNarratives, connectors, turningPoints };
}
