import type { ChangeEvent } from 'react';
import type { DomainSettings } from '../../types/plot';

interface DomainControlsProps {
  domain: DomainSettings;
  onChange: (patch: Partial<DomainSettings>) => void;
}

export const DomainControls = ({
  domain,
  onChange,
}: DomainControlsProps) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const numericValue = Number.parseFloat(value);
    onChange({ [name]: Number.isFinite(numericValue) ? numericValue : 0 });
  };

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-600">
            Min X
          </label>
          <input
            type="number"
            name="minX"
            value={domain.minX}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-600">
            Max X
          </label>
          <input
            type="number"
            name="maxX"
            value={domain.maxX}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-600">
          Sampling step
        </label>
        <input
          type="number"
          name="step"
          value={domain.step}
          onChange={handleChange}
          step="0.01"
          min="0.0001"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
        <p className="text-xs text-slate-500">
          Smaller values create smoother curves but require more work.
        </p>
      </div>
    </div>
  );
};
