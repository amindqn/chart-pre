import type { PlotStats } from '../../types/plot';
import { Panel } from '../common/Panel';

interface DatasetSummaryProps {
  stats: PlotStats;
}

export const DatasetSummary = ({ stats }: DatasetSummaryProps) => {
  if (stats.mode !== 'dataset') {
    return null;
  }

  return (
    <Panel title="Series overview">
      <div className="space-y-3 text-sm text-slate-600">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div>
            <span className="font-medium text-slate-700">Series count:</span>{' '}
            {stats.series.length}
          </div>
          <div>
            <span className="font-medium text-slate-700">Samples:</span>{' '}
            {stats.sampleCount}
          </div>
          {stats.domain && (
            <div>
              <span className="font-medium text-slate-700">X range:</span>{' '}
              [{stats.domain.minX}, {stats.domain.maxX}]
            </div>
          )}
        </div>

        <div className="space-y-2">
          {stats.series.map((series) => (
            <div
              key={series.id}
              className="rounded-md border border-slate-200 bg-slate-50/60 px-3 py-2"
            >
              <p className="font-semibold text-slate-700">{series.label}</p>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-600">
                <span>Valid points: {series.validPoints}</span>
                <span>
                  X span: {series.minX ?? 'N/A'} → {series.maxX ?? 'N/A'}
                </span>
                <span>
                  Y span: {series.minY ?? 'N/A'} → {series.maxY ?? 'N/A'}
                </span>
                <span>Visible: {series.visible ? 'yes' : 'no'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
};
