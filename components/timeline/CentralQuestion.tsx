import type { TimelineStructuredContent } from '@/lib/timelines/structuredContent';

interface CentralQuestionProps {
  narrative?: TimelineStructuredContent | null;
}

export default function CentralQuestion({ narrative }: CentralQuestionProps) {
  if (!narrative?.centralQuestion) {
    return null;
  }

  return (
    <section className="py-12 bg-antiqueBronze-900 text-white">
      <div className="content-container max-w-4xl">
        <p className="text-sm uppercase tracking-[0.35em] text-parchment-200 font-semibold mb-3">
          Central Question
        </p>
        <p className="text-3xl md:text-4xl font-semibold leading-tight text-balance">
          {narrative.centralQuestion}
        </p>
      </div>
    </section>
  );
}
