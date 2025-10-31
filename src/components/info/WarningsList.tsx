interface WarningsListProps {
  warnings: string[];
}

export const WarningsList = ({ warnings }: WarningsListProps) => {
  if (!warnings.length) {
    return null;
  }

  return (
    <div className="space-y-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-700">
      <p className="font-medium">Warnings:</p>
      <ul className="list-inside list-disc space-y-1">
        {warnings.map((warning, index) => (
          <li key={`${warning}-${index}`}>{warning}</li>
        ))}
      </ul>
    </div>
  );
};
