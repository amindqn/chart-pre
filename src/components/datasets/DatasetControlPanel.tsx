import type { DataPoint, DataSeries } from '../../types/plot';
import { Panel } from '../common/Panel';
import { DataSeriesCard } from './DataSeriesCard';

interface DatasetControlPanelProps {
  datasets: DataSeries[];
  activeSeriesId: string;
  onActiveSeriesChange: (id: string) => void;
  onSeriesChange: (id: string, patch: Partial<DataSeries>) => void;
  onSeriesRemove: (id: string) => void;
  onAddSeries: () => void;
  onPointChange: (seriesId: string, pointId: string, patch: Partial<DataPoint>) => void;
  onAddPoint: (seriesId: string) => void;
  onRemovePoint: (seriesId: string, pointId: string) => void;
  onImportPoints: (seriesId: string, file: File) => void;
  onClearPoints: (seriesId: string) => void;
}

const MAX_SERIES = 6;

export const DatasetControlPanel = ({
  datasets,
  activeSeriesId,
  onActiveSeriesChange,
  onSeriesChange,
  onSeriesRemove,
  onAddSeries,
  onPointChange,
  onRemovePoint,
  onAddPoint,
  onImportPoints,
  onClearPoints,
}: DatasetControlPanelProps) => {
  const canAdd = datasets.length < MAX_SERIES;

  return (
    <div className="space-y-5">
      <Panel
        title="Data series"
        actions={
          <button
            type="button"
            onClick={onAddSeries}
            disabled={!canAdd}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Add series
          </button>
        }
      >
        <div className="space-y-4">
          {datasets.map((series) => (
            <DataSeriesCard
              key={series.id}
              series={series}
              isActive={series.id === activeSeriesId}
              disableRemove={datasets.length === 1}
              onActivate={() => onActiveSeriesChange(series.id)}
              onChange={onSeriesChange}
              onRemove={onSeriesRemove}
              onPointChange={onPointChange}
              onAddPoint={onAddPoint}
              onRemovePoint={onRemovePoint}
              onImportPoints={onImportPoints}
              onClearPoints={onClearPoints}
            />
          ))}
          {!canAdd && (
            <p className="text-xs text-slate-500">
              You can plot up to {MAX_SERIES} series at the same time.
            </p>
          )}
        </div>
      </Panel>

      <Panel title="Tips for data upload">
        <ul className="list-disc space-y-1 pl-5 text-xs text-slate-500">
          <li>Accepted formats: CSV, TSV, XLSX, XLS.</li>
          <li>Only the first two columns are used (x then y).</li>
          <li>Ensure numbers use a dot as decimal separator.</li>
          <li>Headers are optional and ignored automatically.</li>
        </ul>
      </Panel>
    </div>
  );
};
