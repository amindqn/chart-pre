import { useMemo } from 'react';
import type { WheelEvent as ReactWheelEvent } from 'react';
import type { ChartData, ChartOptions as ChartJsOptions } from 'chart.js';
import { Line } from 'react-chartjs-2';

import type { ChartDisplayOptions } from '../../types/plot';
import { Panel } from '../common/Panel';
import { ChartToolbar } from './ChartToolbar';

interface ChartViewport {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

interface ChartDisplayProps {
  chartData: ChartData<'line'>;
  options: ChartDisplayOptions;
  viewport: ChartViewport | null;
  onDownloadCsv: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPanLeft: () => void;
  onPanRight: () => void;
  onResetView: () => void;
}

export const ChartDisplay = ({
  chartData,
  options,
  viewport,
  onDownloadCsv,
  onZoomIn,
  onZoomOut,
  onPanLeft,
  onPanRight,
  onResetView,
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
          min: viewport?.xMin,
          max: viewport?.xMax,
          grid: {
            display: options.showGrid,
          },
        },
        y: {
          title: {
            display: true,
            text: 'f(x)',
          },
          min: viewport?.yMin,
          max: viewport?.yMax,
          grid: {
            display: options.showGrid,
          },
        },
      },
    }),
    [options, viewport]
  );

  const hasData = (chartData.labels ?? []).length > 0;

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (!hasData) {
      return;
    }
    event.preventDefault();
    if (event.deltaY < 0) {
      onZoomIn();
    } else if (event.deltaY > 0) {
      onZoomOut();
    }
  };

  return (
    <Panel title="Chart" className=" space-y-5">
      <ChartToolbar
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onPanLeft={onPanLeft}
        onPanRight={onPanRight}
        onReset={onResetView}
        onDownloadCsv={onDownloadCsv}
      />
      <div
        className="relative h-[70vh] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/5 via-white to-blue-100 p-4"
        onWheel={handleWheel}
      >
        {hasData ? (
          <Line options={chartOptions} data={chartData} />
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/70">
            <p className="text-sm font-medium text-slate-500">
              Configure a function or import data to see the graph.
            </p>
          </div>
        )}
      </div>
    </Panel>
  );
};
