import type { TimelineStructuredContent } from '@/lib/timelines/structuredContent';

interface PerspectivesSectionProps {
  narrative: TimelineStructuredContent;
}

export default function PerspectivesSection({ narrative }: PerspectivesSectionProps) {
  const { perspectives } = narrative;

  if (!perspectives) {
    return null;
  }

  return (
    <div className="bg-parchment-100 border border-parchment-200 rounded-3xl p-8">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
        Perspectives
      </h2>
      <p className="text-gray-600 mb-6">
        How we know what we know—and what people at the time noticed
      </p>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <p className="text-sm uppercase tracking-wide text-antiqueBronze-600 font-semibold">
            Evidence
          </p>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            {perspectives.evidence.available.map((item, index) => (
              <li key={`available-${index}`}>{item}</li>
            ))}
          </ul>
          {perspectives.evidence.gaps.length > 0 && (
            <div className="mt-4 text-sm text-gray-600">
              <p className="font-semibold">Gaps &amp; silences</p>
              <ul className="list-disc list-inside">
                {perspectives.evidence.gaps.map((gap, index) => (
                  <li key={`gap-${index}`}>{gap}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <p className="text-sm uppercase tracking-wide text-antiqueBronze-600 font-semibold">
            Interpretations
          </p>
          <div className="mt-3 text-sm text-gray-700 space-y-3">
            {perspectives.interpretations.debates.length > 0 && (
              <div>
                <p className="font-semibold">Debates</p>
                <ul className="list-disc list-inside">
                  {perspectives.interpretations.debates.map((debate, index) => (
                    <li key={`debate-${index}`}>{debate}</li>
                  ))}
                </ul>
              </div>
            )}
            {perspectives.interpretations.contested.length > 0 && (
              <div>
                <p className="font-semibold">Contested points</p>
                <ul className="list-disc list-inside">
                  {perspectives.interpretations.contested.map((item, index) => (
                    <li key={`contested-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <p className="text-sm uppercase tracking-wide text-antiqueBronze-600 font-semibold">
            Context
          </p>
          <div className="mt-3 text-sm text-gray-700 space-y-4">
            {perspectives.context.contemporary && (
              <div>
                <p className="font-semibold">On the ground</p>
                <p>{perspectives.context.contemporary}</p>
              </div>
            )}
            {perspectives.context.hindsight && (
              <div>
                <p className="font-semibold">With hindsight</p>
                <p>{perspectives.context.hindsight}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
