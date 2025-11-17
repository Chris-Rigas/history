interface NarrativeConnectorProps {
  text: string;
}

export default function NarrativeConnector({ text }: NarrativeConnectorProps) {
  if (!text) {
    return null;
  }

  return (
    <div className="bg-parchment-100 border border-parchment-200 rounded-2xl p-4 text-gray-700 text-sm italic">
      {text}
    </div>
  );
}
