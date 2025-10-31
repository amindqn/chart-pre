import type { ChangeEvent } from 'react';

import type { DataPoint } from '../../types/plot';

interface DataPointsEditorProps {
  points: DataPoint[];
  onChange: (id: string, patch: Partial<DataPoint>) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  disableRemove?: boolean;
}

export const DataPointsEditor = ({
  points,
  onChange,
  onRemove,
  onAdd,
  disableRemove,
}: DataPointsEditorProps) => {
  const handleValueChange = (
    event: ChangeEvent<HTMLInputElement>,
    pointId: string,
    key: 'x' | 'y'
  ) => {
    const numericValue = Number.parseFloat(event.target.value);
    onChange(pointId, {
      [key]: Number.isFinite(numericValue) ? numericValue : 0,
    });
  };

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-md border border-slate-200">
        <table className="w-full table-fixed border-collapse text-left text-sm text-slate-600">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-3 font-semibold">#</th>
              <th className="px-3 py-3 font-semibold">x</th>
              <th className="px-3 py-3 font-semibold">y</th>
              <th className="px-3 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point, index) => (
              <tr
                key={point.id}
                className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
              >
                <td className="px-3 py-2 align-middle text-xs font-medium text-slate-400">
                  {index + 1}
                </td>
                <td className="px-3 py-2 align-middle">
                  <input
                    type="number"
                    value={point.x}
                    onChange={(event) => handleValueChange(event, point.id, 'x')}
                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    step="any"
                  />
                </td>
                <td className="px-3 py-2 align-middle">
                  <input
                    type="number"
                    value={point.y}
                    onChange={(event) => handleValueChange(event, point.id, 'y')}
                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    step="any"
                  />
                </td>
                <td className="px-3 py-2 align-middle text-right">
                  <button
                    type="button"
                    onClick={() => onRemove(point.id)}
                    disabled={disableRemove}
                    className="rounded-md border border-transparent px-2 py-1 text-xs font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onAdd}
          className="rounded-md border border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-blue-400 hover:text-blue-600"
        >
          Add point
        </button>
      </div>
    </div>
  );
};
