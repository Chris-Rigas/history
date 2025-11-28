import type { Perspective } from '@/lib/generation/types';
import { renderTextWithCitations } from '@/lib/timelines/citationRenderer';

interface PerspectivesEnrichmentSectionProps {
  perspectives: Perspective[];
  citations?: any[];
}

export default function PerspectivesEnrichmentSection({
  perspectives,
  citations,
}: PerspectivesEnrichmentSectionProps) {
  if (!perspectives?.length) {
    return null;
  }

  return (
    <div className="bg-parchment-100 border border-parchment-200 rounded-3xl p-8">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
        Scholarly Perspectives
      </h2>
      <p className="text-gray-600 mb-6">
        Different interpretive lenses on this historical period
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        {perspectives.map((perspective, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-6 border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {perspective.viewpoint}
            </h3>

            <p className="text-gray-700 text-sm mb-4">
              {citations
                ? renderTextWithCitations(perspective.summary, citations)
                : perspective.summary}
            </p>

            {perspective.keyArguments?.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  Key Arguments:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  {perspective.keyArguments.map((arg, i) => (
                    <li key={i} className="text-sm text-gray-700">
                      {citations
                        ? renderTextWithCitations(arg, citations)
                        : arg}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {perspective.tensions && (
              <p className="text-sm text-gray-600 italic">
                {citations
                  ? renderTextWithCitations(perspective.tensions, citations)
                  : perspective.tensions}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
