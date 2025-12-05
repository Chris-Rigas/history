import Link from 'next/link';
import type { Event } from '@/lib/database.types';
import type {
  TimelineEventLink,
  TimelineStoryBeat,
  TimelineStructuredContent,
  TimelineCitationRaw,
} from '@/lib/timelines/structuredContent';
import clsx from 'clsx';

interface StoryBeatsSectionProps {
  narrative: TimelineStructuredContent;
  timelineSlug: string;
  events?: Event[];
}

function applyEventLinks(
  paragraph: string,
  links: TimelineEventLink[],
  timelineSlug: string,
  validEventSlugs: Set<string>
): Array<string | JSX.Element> {
  return links.reduce<Array<string | JSX.Element>>((nodes, link, linkIndex) => {
    if (!link.textToLink || !link.eventSlug || !validEventSlugs.has(link.eventSlug)) {
      return nodes;
    }

    return nodes.flatMap((node, nodeIndex) => {
      if (typeof node !== 'string') {
        return [node];
      }

      const parts = node.split(link.textToLink);
      if (parts.length === 1) return [node];

      const interleaved: Array<string | JSX.Element> = [];

      parts.forEach((part, partIndex) => {
        if (part) {
          interleaved.push(part);
        }

        if (partIndex < parts.length - 1) {
          interleaved.push(
            <Link
              key={`${link.textToLink}-${linkIndex}-${nodeIndex}-${partIndex}`}
              href={`/timelines/${timelineSlug}/events/${link.eventSlug}`}
              className="text-antiqueBronze-700 underline underline-offset-4 decoration-2 decoration-antiqueBronze-400 hover:text-antiqueBronze-900"
            >
              {link.textToLink}
            </Link>
          );
        }
      });

      return interleaved;
    });
  }, [paragraph]);
}

function renderWithCitations(
  nodes: Array<string | JSX.Element>,
  citations?: TimelineCitationRaw[]
): JSX.Element[] {
  return nodes.flatMap((node, nodeIndex) => {
    if (typeof node !== 'string') {
      return [node];
    }

    const parts = node.split(/(\[\d+\])/g);

    return parts.map((part, index) => {
      const match = part.match(/\[(\d+)\]/);

      if (match) {
        const number = parseInt(match[1], 10);
        const citation = citations?.find(entry => entry.number === number);

        return (
          <sup key={`citation-${nodeIndex}-${index}`}>
            <a
              href={`#citation-${number}`}
              className="text-blue-600 hover:underline"
              title={citation?.source || citation?.title || undefined}
            >
              [{number}]
            </a>
          </sup>
        );
      }

      return <span key={`text-${nodeIndex}-${index}`}>{part}</span>;
    });
  });
}

function getBeatStyle(beatType: string) {
  const opening = ['world-before', 'origins', 'seeds-of-change', 'the-question', 'the-hook'];
  const pivot = ['turning-point', 'crisis', 'confrontation', 'breakthrough', 'twist', 'decision'];
  const resolution = ['aftermath', 'legacy', 'synthesis', 'new-order', 'transformation', 'echoes', 'open-questions'];

  if (opening.includes(beatType)) {
    return 'border-l-4 border-parchment-400 bg-parchment-50';
  }

  if (pivot.includes(beatType)) {
    return 'border-l-4 border-amber-400 bg-amber-50';
  }

  if (resolution.includes(beatType)) {
    return 'border-l-4 border-emerald-400 bg-emerald-50';
  }

  return 'border-l-4 border-antiqueBronze-200';
}

function BeatTitle({ beat }: { beat: TimelineStoryBeat }) {
  return (
    <p className="text-xs font-semibold tracking-[0.3em] uppercase text-antiqueBronze-700 mb-2">
      {beat.title}
    </p>
  );
}

export default function StoryBeatsSection({ narrative, timelineSlug, events = [] }: StoryBeatsSectionProps) {
  const beats = narrative.storyBeats || [];

  if (!beats.length) {
    return null;
  }

  const validEventSlugs = new Set(events.map(event => event.slug).filter(Boolean));

  // DEBUG LOGGING - remove after diagnosis
  if (typeof window === 'undefined') {
    const totalLinks = beats.reduce((sum, beat) => sum + (beat.eventLinks?.length || 0), 0);
    const validLinks = beats.reduce(
      (sum, beat) =>
        sum + (beat.eventLinks || []).filter(link => validEventSlugs.has(link.eventSlug)).length,
      0
    );
    const invalidSlugs = beats.flatMap(beat =>
      (beat.eventLinks || [])
        .filter(link => !validEventSlugs.has(link.eventSlug))
        .map(link => link.eventSlug)
    );

    console.log(`[StoryBeatsSection] Events passed: ${events.length}`);
    console.log(`[StoryBeatsSection] Valid event slugs: ${validEventSlugs.size}`);
    console.log(`[StoryBeatsSection] Total eventLinks in beats: ${totalLinks}`);
    console.log(`[StoryBeatsSection] Valid eventLinks (will render): ${validLinks}`);
    if (invalidSlugs.length > 0) {
      console.log(`[StoryBeatsSection] Invalid slugs (won't render):`, invalidSlugs.slice(0, 5));
    }

    beats.forEach((beat, beatIndex) => {
      (beat.eventLinks || []).forEach(link => {
        const foundInParagraphs = (beat.paragraphs || []).some(paragraph =>
          paragraph.includes(link.textToLink)
        );

        if (!foundInParagraphs) {
          console.log(`[StoryBeatsSection] ⚠️ textToLink NOT FOUND in paragraphs:`);
          console.log(`   Beat ${beatIndex + 1}: "${link.textToLink}"`);
          console.log(
            `   Looking in: "${(beat.paragraphs || []).join(' ').substring(0, 100)}..."`
          );
        }
      });
    });
  }
  // END DEBUG LOGGING

  return (
    <section className="py-12 bg-white">
      <div className="content-container max-w-4xl">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">The Story</h2>

        <div className="space-y-8">
          {beats.map((beat, beatIndex) => (
            <div
              key={`${beat.title}-${beatIndex}`}
              className={clsx('p-6 rounded-xl shadow-sm', getBeatStyle(beat.beatType))}
            >
              <BeatTitle beat={beat} />
              <div className="prose prose-lg prose-gray max-w-none space-y-4">
                {(beat.paragraphs || []).map((paragraph, paragraphIndex) => {
                  const withLinks = applyEventLinks(
                    paragraph,
                    beat.eventLinks || [],
                    timelineSlug,
                    validEventSlugs
                  );
                  const rendered = renderWithCitations(withLinks, narrative.citations);

                  return (
                    <p key={`${beatIndex}-${paragraphIndex}`} className="text-gray-800 leading-relaxed">
                      {rendered}
                    </p>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {narrative.storyCharacter && (
          <div className="mt-10 p-6 bg-parchment-50 rounded-xl border border-parchment-200">
            <p className="text-sm uppercase tracking-wide text-antiqueBronze-600 font-semibold mb-2">
              Story Character
            </p>
            <p className="text-gray-700 text-lg">{narrative.storyCharacter}</p>
          </div>
        )}
      </div>
    </section>
  );
}
