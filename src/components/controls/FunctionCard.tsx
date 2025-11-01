import type { ChangeEvent } from 'react';
import { PRESET_FUNCTIONS } from '../../constants/presets';
import type { GraphedFunction } from '../../types/plot';

interface FunctionCardProps {
  fn: GraphedFunction;
  isActive: boolean;
  disableRemove: boolean;
  onActivate: () => void;
  onChange: (id: string, patch: Partial<GraphedFunction>) => void;
  onRemove: (id: string) => void;
}

const PRESET_PLACEHOLDER = '---';

export const FunctionCard = ({
  fn,
  isActive,
  disableRemove,
  onActivate,
  onChange,
  onRemove,
}: FunctionCardProps) => {
  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    onChange(fn.id, { [name]: value } as Partial<GraphedFunction>);
  };

  const handleVisibilityToggle = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(fn.id, { visible: event.target.checked });
  };

  const handlePresetChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target;
    if (value && value !== PRESET_PLACEHOLDER) {
      onChange(fn.id, { expression: value });
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onActivate}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          onActivate();
        }
      }}
      className={[
        'rounded-xl border p-4 space-y-3 focus:outline-none transition-colors backdrop-blur',
        isActive
          ? 'border-blue-500 shadow-lg ring-2 ring-blue-200 ring-offset-0'
          : 'border-slate-200 hover:border-blue-300',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3 sm:flex-nowrap">
          <span
            className="inline-block h-3 w-3 rounded-full border border-slate-200"
            style={{ backgroundColor: fn.color }}
          />
          <input
            aria-label="Function label"
            name="label"
            value={fn.label}
            onChange={handleInputChange}
            onClick={(event) => event.stopPropagation()}
            className="w-full min-w-[140px] flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:w-32"
            placeholder="f(x)"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={fn.visible}
              onChange={handleVisibilityToggle}
              onClick={(event) => event.stopPropagation()}
              className="h-4 w-4"
            />
            Visible
          </label>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (!disableRemove) {
                onRemove(fn.id);
              }
            }}
            className="w-full rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            disabled={disableRemove}
          >
            Remove
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-slate-600">
          Function expression
        </label>
        <textarea
          name="expression"
          value={fn.expression}
          onChange={handleInputChange}
          onClick={(event) => event.stopPropagation()}
          rows={2}
          className="w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          placeholder="e.g. sin(x) / x"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,auto),1fr]">
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-600">
            Series color
          </label>
          <input
            type="color"
            name="color"
            value={fn.color}
            onChange={handleInputChange}
            onClick={(event) => event.stopPropagation()}
            className="h-10 w-16 cursor-pointer rounded-md border border-slate-300 bg-white"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-600">
            Presets
          </label>
          <select
            defaultValue={PRESET_PLACEHOLDER}
            onChange={handlePresetChange}
            onClick={(event) => event.stopPropagation()}
            className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value={PRESET_PLACEHOLDER}>Select function</option>
            {PRESET_FUNCTIONS.map((preset) => (
              <option key={preset.expression} value={preset.expression}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
