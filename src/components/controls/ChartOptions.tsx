import type { ChangeEvent } from 'react';
import type { ChartDisplayOptions } from '../../types/plot';

type BooleanOptionKey = Exclude<keyof ChartDisplayOptions, 'chartTitle'>;

interface ChartOptionsProps {
  options: ChartDisplayOptions;
  onChange: (patch: Partial<ChartDisplayOptions>) => void;
}

const OPTION_LABELS: Array<{
  key: BooleanOptionKey;
  label: string;
}> = [
  { key: 'showGrid', label: 'Show grid lines' },
  { key: 'showPoints', label: 'Show sample points' },
  { key: 'smoothCurve', label: 'Smooth interpolation' },
  { key: 'showLegend', label: 'Show legend' },
  { key: 'fillArea', label: 'Fill area under curve' },
  { key: 'maintainAspectRatio', label: 'Maintain aspect ratio' },
];

export const ChartOptions = ({ options, onChange }: ChartOptionsProps) => {
  const handleToggle = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    onChange({ [name as BooleanOptionKey]: checked } as Partial<ChartDisplayOptions>);
  };

  return (
    <div className="grid gap-3">
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-600">
          Chart title
        </label>
        <input
          type="text"
          name="chartTitle"
          value={options.chartTitle}
          onChange={(event) =>
            onChange({
              chartTitle: event.target.value,
            })
          }
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          placeholder="e.g. Graph of f(x)"
        />
      </div>
      {OPTION_LABELS.map((option) => (
        <label
          key={option.key}
          className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:border-blue-300"
        >
          <input
            type="checkbox"
            name={option.key}
            checked={options[option.key]}
            onChange={handleToggle}
            className="h-4 w-4"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
};
