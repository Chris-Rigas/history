import type { Json } from '@/lib/database.types';
import { slugify } from '../utils';

export type TimelineEventRelationshipType =
  | 'led_to'
  | 'response_to'
  | 'parallel'
  | 'foreshadows';

export interface TimelineStructuredFact {
  title: string;
  detail: string;
}

export interface TimelineStructuredSection {
  heading: string;
  content: string;
}

export interface TimelineThemeCategory {
  id: string;
  title: string;
  description?: string;
  focus?: string;
}

export interface TimelineEventRelationship {
  type: TimelineEventRelationshipType;
  targetTitle: string;
  detail?: string;
}

export interface TimelineEventNote {
  title: string;
  categoryId?: string;
  summary?: string;
  soWhat?: string;
  relationships: TimelineEventRelationship[];
  humanDetail?: string;
  quote?: string;
}

export interface TimelineNarrativeConnector {
  afterEventTitle?: string;
  text: string;
}

export interface TimelineTurningPoint {
  title: string;
  description: string;
  whyItMatters?: string;
}

export interface TimelinePerspectives {
  evidence: {
    available: string[];
    gaps: string[];
  };
  interpretations: {
    debates: string[];
    contested: string[];
  };
  context: {
    contemporary: string;
    hindsight: string;
  };
}

export interface TimelineThemeInsight {
  title: string;
  insight: string;
  analysis?: string;
  modernRelevance?: string;
  supportingEvents?: string[];
  citations?: number[];
}

export interface TimelineCitationRaw {
  number?: number;
  source?: string;
  title?: string;
  url?: string;
}

export interface TimelineOverviewSection {
  subheading?: string;
  content: string;
  citationsUsed?: number[];
}

export interface TimelineStructuredContent {
  summary: string;
  centralQuestion?: string;
  storyCharacter?: string;
  overview?: string;
  overviewSections?: TimelineOverviewSection[];
  keyFacts: TimelineStructuredFact[];
  themes: TimelineThemeCategory[];
  eventNotes: TimelineEventNote[];
  connectors: TimelineNarrativeConnector[];
  turningPoints: TimelineTurningPoint[];
  perspectives: TimelinePerspectives;
  themeInsights: TimelineThemeInsight[];
  contextSections: TimelineStructuredSection[];
  citations: TimelineCitationRaw[];
}

const RELATIONSHIP_KEYWORDS: Record<string, TimelineEventRelationshipType> = {
  'led to': 'led_to',
  'leads to': 'led_to',
  cause: 'led_to',
  caused: 'led_to',
  catalyst: 'led_to',
  triggered: 'led_to',
  'response to': 'response_to',
  response: 'response_to',
  reaction: 'response_to',
  counter: 'response_to',
  replied: 'response_to',
  parallel: 'parallel',
  simultaneous: 'parallel',
  concurrent: 'parallel',
  'at the same time': 'parallel',
  meanwhile: 'parallel',
  foreshadow: 'foreshadows',
  foreshadows: 'foreshadows',
  'set the stage': 'foreshadows',
  'would later': 'foreshadows',
  groundwork: 'foreshadows',
};

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeId(value: string, fallback: string, index: number): string {
  const base = slugify(value || fallback || `theme-${index + 1}`);
  return base || `theme-${index + 1}`;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(item => cleanText(item))
    .filter(Boolean);
}

function normalizeRelationshipType(value: string): TimelineEventRelationshipType | null {
  const normalized = value.toLowerCase();
  if (RELATIONSHIP_KEYWORDS[normalized]) {
    return RELATIONSHIP_KEYWORDS[normalized];
  }

  const stripped = normalized.replace(/[^a-z]+/g, ' ').trim();
  if (RELATIONSHIP_KEYWORDS[stripped]) {
    return RELATIONSHIP_KEYWORDS[stripped];
  }

  if (stripped.includes('lead')) return 'led_to';
  if (stripped.includes('response') || stripped.includes('reply')) return 'response_to';
  if (stripped.includes('parallel') || stripped.includes('meanwhile')) return 'parallel';
  if (stripped.includes('foreshadow') || stripped.includes('stage')) return 'foreshadows';

  return null;
}

function normalizeContextSections(raw: any): TimelineStructuredSection[] {
  const sections = Array.isArray(raw)
    ? raw
    : typeof raw === 'string'
    ? raw.split(/\n(?=[A-Z][^\n]*:)/)
    : [];

  const parsed: TimelineStructuredSection[] = [];

  for (const section of sections) {
    if (!section) continue;

    const headingCandidate = cleanText(section.heading ?? section.title ?? '');
    const contentCandidate = cleanText(section.content ?? section.body ?? section.text ?? '');

    if (headingCandidate || contentCandidate) {
      parsed.push({
        heading: headingCandidate || 'Context',
        content: contentCandidate || '',
      });
      continue;
    }

    if (typeof section === 'string') {
      const headingMatch = section.match(/^([^:]+):\s*(.*)$/);
      if (headingMatch) {
        parsed.push({
          heading: cleanText(headingMatch[1]) || 'Context',
          content: cleanText(headingMatch[2]),
        });
      } else {
        parsed.push({ heading: 'Context', content: cleanText(section) });
      }
    }
  }

  return parsed;
}

export function normalizeStructuredContent(raw: any): TimelineStructuredContent {
  const summary = cleanText(raw?.summary);
  const centralQuestion = cleanText(raw?.centralQuestion ?? raw?.central_tension);
  const storyCharacter = cleanText(raw?.storyCharacter ?? raw?.storyType);
  const overview = cleanText(raw?.overview ?? raw?.mainContent);

  const usedIds = new Set<string>();
  const rawThemes = Array.isArray(raw?.themes) ? raw.themes : [];
  const themes = rawThemes
    .map((theme: any, index: number) => {
      const title = cleanText(theme?.title ?? theme?.name ?? '');
      if (!title) {
        return null;
      }

      const idSource = cleanText(theme?.id ?? theme?.key ?? theme?.slug ?? title);
      let id = normalizeId(idSource, title, index);
      let counter = 1;
      while (usedIds.has(id)) {
        id = `${id}-${counter++}`;
      }
      usedIds.add(id);

      return {
        id,
        title,
        description: cleanText(theme?.description ?? theme?.summary ?? ''),
        focus: cleanText(theme?.focus ?? theme?.insight ?? ''),
      } satisfies TimelineThemeCategory;
    })
    .filter(Boolean) as TimelineThemeCategory[];

  const themeIdByTitle = new Map<string, string>();
  themes.forEach(theme => {
    const lower = theme.title.toLowerCase();
    const slug = slugify(lower);
    themeIdByTitle.set(lower, theme.id);
    if (slug) {
      themeIdByTitle.set(slug, theme.id);
    }
    themeIdByTitle.set(theme.id, theme.id);
  });

  const rawEventNotes = Array.isArray(raw?.eventNotes ?? raw?.events)
    ? raw.eventNotes ?? raw.events
    : [];

  const eventNotes = rawEventNotes
    .map((note: any) => {
      const title = cleanText(note?.title ?? note?.event ?? '');
      if (!title) {
        return null;
      }

      const categoryRaw = cleanText(
        note?.categoryId ?? note?.category ?? note?.theme ?? ''
      ).toLowerCase();
      const slugCategory = categoryRaw ? slugify(categoryRaw) : '';
      const resolvedCategoryId =
        themeIdByTitle.get(categoryRaw) ||
        (slugCategory ? themeIdByTitle.get(slugCategory) : undefined) ||
        (slugCategory || undefined);

      const relationships = Array.isArray(note?.relationships)
        ? (note.relationships
            .map((relationship: any) => {
              const typeValue = cleanText(relationship?.type ?? relationship?.relationship ?? '');
              const type = normalizeRelationshipType(typeValue);
              const targetTitle = cleanText(
                relationship?.targetTitle ?? relationship?.target ?? relationship?.event ?? ''
              );

              if (!type || !targetTitle) {
                return null;
              }

              return {
                type,
                targetTitle,
                detail: cleanText(relationship?.detail ?? relationship?.explanation ?? ''),
              } satisfies TimelineEventRelationship;
            })
            .filter(Boolean) as TimelineEventRelationship[])
        : [];

      return {
        title,
        categoryId: resolvedCategoryId,
        summary: cleanText(note?.summary ?? note?.description ?? ''),
        soWhat: cleanText(note?.soWhat ?? note?.significance ?? ''),
        relationships,
        humanDetail: cleanText(note?.humanDetail ?? note?.human ?? note?.quote ?? ''),
        quote: cleanText(note?.quote ?? ''),
      } satisfies TimelineEventNote;
    })
    .filter(Boolean) as TimelineEventNote[];

  const rawConnectors = Array.isArray(raw?.narrativeConnectors ?? raw?.connectors)
    ? raw?.narrativeConnectors ?? raw?.connectors
    : [];

  const connectors = rawConnectors
    .map((connector: any) => {
      const text = cleanText(connector?.text ?? connector?.summary ?? '');
      if (!text) {
        return null;
      }

      return {
        text,
        afterEventTitle: cleanText(connector?.afterEventTitle ?? connector?.after ?? ''),
      } satisfies TimelineNarrativeConnector;
    })
    .filter(Boolean) as TimelineNarrativeConnector[];

  const rawTurningPoints = Array.isArray(raw?.turningPoints)
    ? raw.turningPoints
    : [];
  const turningPoints = rawTurningPoints
    .map((point: any) => {
      const title = cleanText(point?.title ?? point?.event ?? '');
      const description = cleanText(point?.description ?? point?.why ?? '');

      if (!title || !description) {
        return null;
      }

      return {
        title,
        description,
        whyItMatters: cleanText(point?.whyItMatters ?? ''),
      } satisfies TimelineTurningPoint;
    })
    .filter(Boolean) as TimelineTurningPoint[];

  const perspectivesRaw = raw?.perspectives ?? {};
  const perspectives: TimelinePerspectives = {
    evidence: {
      available: toStringArray(
        perspectivesRaw?.evidence?.available ?? perspectivesRaw?.evidence?.sources
      ),
      gaps: toStringArray(perspectivesRaw?.evidence?.gaps),
    },
    interpretations: {
      debates: toStringArray(perspectivesRaw?.interpretations?.debates),
      contested: toStringArray(
        perspectivesRaw?.interpretations?.contested ?? perspectivesRaw?.interpretations?.questions
      ),
    },
    context: {
      contemporary: cleanText(perspectivesRaw?.context?.contemporary ?? ''),
      hindsight: cleanText(perspectivesRaw?.context?.hindsight ?? ''),
    },
  };

  const rawThemeInsights = Array.isArray(raw?.themeInsights ?? raw?.themesAnalysis)
    ? raw?.themeInsights ?? raw?.themesAnalysis
    : [];
  const themeInsights = rawThemeInsights
    .map((insight: any) => {
      const title = cleanText(insight?.title ?? insight?.theme ?? '');
      const detail = cleanText(insight?.insight ?? insight?.summary ?? '');
      const analysis = cleanText(insight?.analysis ?? '');
      const modernRelevance = cleanText(
        insight?.modernRelevance ?? insight?.relevance ?? '',
      );
      const supportingEvents = toStringArray(
        insight?.supportingEvents ?? insight?.relatedEvents,
      );
      const citationsList = Array.isArray(insight?.citations)
        ? insight.citations
            .map((value: any) => {
              if (typeof value === 'number') return value;
              const parsed = parseInt(String(value), 10);
              return Number.isNaN(parsed) ? null : parsed;
            })
            .filter((value): value is number => value !== null)
        : [];
      if (!title || !detail) {
        return null;
      }

      return {
        title,
        insight: detail,
        analysis: analysis || undefined,
        modernRelevance: modernRelevance || undefined,
        supportingEvents,
        citations: citationsList,
      } satisfies TimelineThemeInsight;
    })
    .filter(Boolean) as TimelineThemeInsight[];

  const keyFacts = Array.isArray(raw?.keyFacts)
    ? (raw.keyFacts
        .map((fact: any) => {
          const title = cleanText(fact?.title ?? fact?.label ?? '');
          const detail = cleanText(fact?.detail ?? fact?.text ?? '');
          if (!title && !detail) {
            return null;
          }
          return {
            title: title || detail,
            detail: detail || title,
          } satisfies TimelineStructuredFact;
        })
        .filter(Boolean) as TimelineStructuredFact[])
    : [];

  const contextSections = normalizeContextSections(raw?.contextSections ?? raw?.context);

  const citations = Array.isArray(raw?.citations)
    ? (raw.citations
        .map((citation: any) => ({
          number: typeof citation?.number === 'number' ? citation.number : undefined,
          source: cleanText(citation?.source ?? citation?.title ?? ''),
          title: cleanText(citation?.title ?? ''),
          url: cleanText(citation?.url ?? ''),
        }))
        .filter((citation: TimelineCitationRaw) => Boolean(citation.url && (citation.source || citation.title))) as TimelineCitationRaw[])
    : [];

  return {
    summary,
    centralQuestion,
    storyCharacter,
    overview,
    keyFacts,
    themes,
    eventNotes,
    connectors,
    turningPoints,
    perspectives,
    themeInsights,
    contextSections,
    citations,
  } satisfies TimelineStructuredContent;
}

export function parseStructuredContent(json: Json | null): TimelineStructuredContent | null {
  if (!json || typeof json !== 'object') {
    return null;
  }

  return normalizeStructuredContent(json);
}
