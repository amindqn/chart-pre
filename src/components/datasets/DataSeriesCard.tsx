import { useRef } from 'react';

import type { DataPoint, DataSeries } from '../../types/plot';
import { DataPointsEditor } from './DataPointsEditor';

interface DataSeriesCardProps {
  series: DataSeries;
  isActive: boolean;
  disableRemove: boolean;
  onActivate: () => void;
  onChange: (id: string, patch: Partial<DataSeries>) => void;
  onRemove: (id: string) => void;
  onPointChange: (seriesId: string, pointId: string, patch: Partial<DataPoint>) => void;
  onAddPoint: (seriesId: string) => void;
  onRemovePoint: (seriesId: string, pointId: string) => void;
  onImportPoints: (seriesId: string, file: File) => void;
  onClearPoints: (seriesId: string) => void;
}

export const DataSeriesCard = ({
  series,
  isActive,
  disableRemove,
  onActivate,
  onChange,
  onRemove,
  onPointChange,
  onAddPoint,
  onRemovePoint,
  onImportPoints,
  onClearPoints,
}: DataSeriesCardProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const triggerFileDialog = () => {
    fileInputRef.current?.click();
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
        'rounded-xl border p-4 transition-colors focus:outline-none',
        isActive
          ? 'border-blue-500 shadow-md ring-2 ring-blue-200'
          : 'border-slate-200 hover:border-blue-300',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="h-3 w-3 rounded-full border border-slate-200"
              style={{ backgroundColor: series.color }}
            />
            <input
              aria-label="Series label"
              value={series.label}
              onChange={(event) =>
                onChange(series.id, { label: event.target.value })
              }
              onClick={(event) => event.stopPropagation()}
              className="w-36 rounded-md border border-slate-300 px-2 py-1 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Series label"
            />
            <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <input
                type="checkbox"
                checked={series.visible}
                onChange={(event) =>
                  onChange(series.id, { visible: event.target.checked })
                }
                onClick={(event) => event.stopPropagation()}
                className="h-4 w-4"
              />
              Visible
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="color"
              value={series.color}
              onChange={(event) =>
                onChange(series.id, { color: event.target.value })
              }
              onClick={(event) => event.stopPropagation()}
              className="h-9 w-12 cursor-pointer rounded-md border border-slate-200 bg-white"
            />
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                triggerFileDialog();
              }}
              className="rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-blue-400 hover:text-blue-600"
            >
              Import file
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.txt,.xlsx,.xls"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  onImportPoints(series.id, file);
                  event.target.value = '';
                }
              }}
            />
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onClearPoints(series.id);
              }}
              className="rounded-md border border-transparent px-3 py-2 text-xs font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                if (!disableRemove) {
                  onRemove(series.id);
                }
              }}
              disabled={disableRemove}
              className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        </div>

        <DataPointsEditor
          points={series.points}
          onChange={(pointId, patch) => onPointChange(series.id, pointId, patch)}
          onRemove={(pointId) => onRemovePoint(series.id, pointId)}
          onAdd={() => onAddPoint(series.id)}
          disableRemove={series.points.length <= 2}
        />
      </div>
    </div>
  );
};
