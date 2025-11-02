import { useRef } from 'react';

import {
  DEFAULT_FIT_SAMPLE_COUNT,
  DEFAULT_FIT_TYPE,
  FIT_SAMPLE_COUNT_OPTIONS,
  FIT_TYPE_LABELS,
  FIT_TYPE_ORDER,
  POLYNOMIAL_FIT_LABELS,
} from '../../constants/fit';
import type {
  DataPoint,
  DataSeries,
  SeriesFitConfig,
  SeriesFitStats,
  SeriesFitType,
} from '../../types/plot';
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
  fitSummary?: SeriesFitStats;
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
  fitSummary,
}: DataSeriesCardProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const triggerFileDialog = () => {
    fileInputRef.current?.click();
  };

  const buildFitConfig = (patch?: Partial<SeriesFitConfig>): SeriesFitConfig => ({
    type: patch?.type ?? series.fit?.type ?? DEFAULT_FIT_TYPE,
    sampleCount: patch?.sampleCount ?? series.fit?.sampleCount ?? DEFAULT_FIT_SAMPLE_COUNT,
  });

  const handleFitToggle = (enabled: boolean) => {
    if (enabled) {
      onChange(series.id, { fit: buildFitConfig() });
    } else {
      onChange(series.id, { fit: undefined });
    }
  };

  const handleFitConfigChange = (patch: Partial<SeriesFitConfig>) => {
    onChange(series.id, { fit: buildFitConfig(patch) });
  };

  const fitEnabled = Boolean(series.fit);
  const formatMetric = (value: number | null) =>
    value === null
      ? 'N/A'
      : value.toLocaleString(undefined, {
          maximumFractionDigits: 4,
        });

  const formatCoefficient = (value: number) =>
    value.toLocaleString(undefined, { maximumFractionDigits: 6 });

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
        'rounded-xl border p-4 transition-colors focus:outline-none max-h-120 overflow-auto',
        isActive
          ? 'border-blue-500 shadow-md ring-2 ring-blue-200'
          : 'border-slate-200 hover:border-blue-300',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
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
              className="w-full min-w-[140px] flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:w-36"
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

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <input
              type="color"
              value={series.color}
              onChange={(event) =>
                onChange(series.id, { color: event.target.value })
              }
              onClick={(event) => event.stopPropagation()}
              className="h-10 w-16 cursor-pointer rounded-md border border-slate-200 bg-white sm:h-9 sm:w-12"
            />
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                triggerFileDialog();
              }}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-blue-400 hover:text-blue-600 sm:w-auto"
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
              className="w-full rounded-md border border-transparent px-3 py-2 text-xs font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700 sm:w-auto"
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
              className="w-full rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              Remove
            </button>
          </div>
        </div>

        <div
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Curve fitting
            </span>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={fitEnabled}
                onChange={(event) => handleFitToggle(event.target.checked)}
                className="h-4 w-4"
              />
              Enable
            </label>
          </div>

          {fitEnabled && (
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
                Fit type
                <select
                  value={series.fit?.type ?? DEFAULT_FIT_TYPE}
                  onChange={(event) =>
                    handleFitConfigChange({
                      type: event.target.value as SeriesFitType,
                    })
                  }
                  className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  {FIT_TYPE_ORDER.map((fitType) => (
                    <option key={fitType} value={fitType}>
                      {FIT_TYPE_LABELS[fitType]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
                Samples
                <select
                  value={series.fit?.sampleCount ?? DEFAULT_FIT_SAMPLE_COUNT}
                  onChange={(event) =>
                    handleFitConfigChange({
                      sampleCount: Number.parseInt(event.target.value, 10),
                    })
                  }
                  className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  {FIT_SAMPLE_COUNT_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>

              <p className="sm:col-span-3 text-xs text-slate-500">
                Uses least squares regression to draw a smooth curve over your data. Higher samples increase smoothness.
              </p>

              {fitSummary && (
                <div className="sm:col-span-3 space-y-2 rounded-md border border-slate-200 bg-white px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Current fit
                  </p>
                  <p className="text-xs font-mono text-slate-700">{fitSummary.equation}</p>
                  <div className="flex flex-wrap gap-3 text-[11px] text-slate-500">
                    <span>Mode: {FIT_TYPE_LABELS[fitSummary.selectedType]}</span>
                    <span>Resolved: {POLYNOMIAL_FIT_LABELS[fitSummary.resolvedType]}</span>
                    <span>Samples: {fitSummary.sampleCount}</span>
                    <span>R²: {formatMetric(fitSummary.rSquared)}</span>
                    <span>RMSE: {formatMetric(fitSummary.rmse)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] font-mono text-slate-500">
                    {fitSummary.coefficients.map((coefficient, index) => (
                      <span key={index}>a{index}={formatCoefficient(coefficient)}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
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
