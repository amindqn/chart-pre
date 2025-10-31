import { useMemo } from 'react';
import type { ChartData, ChartOptions as ChartJsOptions } from 'chart.js';
import { Line } from 'react-chartjs-2';

import type { ChartDisplayOptions } from '../../types/plot';
import { Panel } from '../common/Panel';

interface ChartDisplayProps {
  chartData: ChartData<'line'>;
  options: ChartDisplayOptions;
  onDownloadCsv: () => void;
}

export const ChartDisplay = ({
  chartData,
  options,
  onDownloadCsv,
}: ChartDisplayProps) => {
  const chartOptions = useMemo<ChartJsOptions<'line'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: options.maintainAspectRatio,
      animation: false,
      interaction: {
        intersect: false,
        mode: 'nearest',
      },
      plugins: {
        legend: {
          display: options.showLegend,
          position: 'top',
        },
        title: {
          display: Boolean(options.chartTitle),
          text: options.chartTitle,
        },
        tooltip: {
          callbacks: {
            title: (context) => `x = ${context[0]?.label ?? ''}`,
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'x',
          },
          grid: {
            display: options.showGrid,
          },
        },
        y: {
          title: {
            display: true,
            text: 'f(x)',
          },
          grid: {
            display: options.showGrid,
          },
        },
      },
    }),
    [options]
  );

  const hasData = (chartData.labels ?? []).length > 0;

  return (
      <Panel
          title="Chart"
          actions={
              <button
                  type="button"
                  onClick={onDownloadCsv}
                  disabled={!hasData}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                  Download CSV
              </button>
          }
          // className="h-full"
      >
          <div className="relative h-[70vh] w-full overflow-hidden rounded-2xl bg-linear-to-br from-slate-900/5 via-white to-blue-100 p-4">
              {hasData ? (
                  <Line
                      options={chartOptions}
                      data={chartData}
                  />
              ) : (
                  <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/70">
                      <p className="text-sm font-medium text-slate-500">Configure a function or import data to see the graph.</p>
                  </div>
              )}
          </div>
      </Panel>
  );
};
