import type { PlotMode } from '../../types/plot';

interface ModeToggleProps {
  mode: PlotMode;
  onModeChange: (mode: PlotMode) => void;
}

const OPTIONS: Array<{ value: PlotMode; label: string; description: string }> = [
  {
    value: 'function',
    label: 'Function mode',
    description: 'Define analytic expressions and configure the domain.',
  },
  {
    value: 'dataset',
    label: 'Dataset mode',
    description: 'Upload or enter sampled data points manually.',
  },
];

export const ModeToggle = ({ mode, onModeChange }: ModeToggleProps) => {
  return (
    <div className="grid gap-3">
      <div className="inline-flex rounded-full bg-slate-200/60 p-1 text-sm font-medium text-slate-600">
        {OPTIONS.map((option) => (
          <button
            type="button"
            key={option.value}
            onClick={() => onModeChange(option.value)}
            className={[
              'flex-1 rounded-full px-4 py-2 transition-colors',
              option.value === mode
                ? 'bg-white text-slate-900 shadow'
                : 'hover:text-slate-900',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500">
        {OPTIONS.find((option) => option.value === mode)?.description}
      </p>
    </div>
  );
};
