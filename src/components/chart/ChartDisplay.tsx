import { useCallback, useMemo, useRef, useState } from 'react';
import type { WheelEvent as ReactWheelEvent } from 'react';
import type { ChartData, ChartOptions as ChartJsOptions } from 'chart.js';
import { Line } from 'react-chartjs-2';

import type { ChartDisplayOptions } from '../../types/plot';
import { Panel } from '../common/Panel';
import { ChartToolbar } from './ChartToolbar';

const parseLabel = (value: number | string): number | null => {
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
};

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
  onZoomIn: (anchor?: number, factor?: number) => void;
  onZoomOut: (anchor?: number, factor?: number) => void;
  onPanLeft: () => void;
  onPanRight: () => void;
  onResetView: () => void;
  onPanByOffset: (delta: number) => void;
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
  onPanByOffset,
}: ChartDisplayProps) => {
  const renderedChartData = useMemo<ChartData<'line'>>(() => {
    const labels = (chartData.labels ?? []) as Array<number | string>;
    const numericLabels = labels.map((label) => parseLabel(label));

    return {
      ...chartData,
      datasets: chartData.datasets.map((dataset) => {
        if (!Array.isArray(dataset.data)) {
          return dataset;
        }

        const points = numericLabels.reduce<Array<{ x: number; y: number }>>(
          (accumulator, label, index) => {
            if (label === null) {
              return accumulator;
            }

            const value = dataset.data[index];
            if (typeof value === 'number' && Number.isFinite(value)) {
              accumulator.push({ x: label, y: value });
            }

            return accumulator;
          },
          []
        );

        return {
          ...dataset,
          parsing: {
            xAxisKey: 'x',
            yAxisKey: 'y',
          },
          data: points,
        };
      }),
    };
  }, [chartData]);

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
            title: (context) => {
              const parsedX = context[0]?.parsed?.x;
              return typeof parsedX === 'number' ? `x = ${parsedX}` : '';
            },
          },
        },
      },
      scales: {
        x: {
          type: 'linear',
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
  const dragStateRef = useRef<{
    pointerId: number;
    lastClientX: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      if (!hasData || !viewport) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      event.nativeEvent.preventDefault();

      const rect = event.currentTarget.getBoundingClientRect();
      if (rect.width <= 0) {
        return;
      }

      const ratio = Math.min(
        Math.max((event.clientX - rect.left) / rect.width, 0),
        1
      );
      const anchor = viewport.xMin + ratio * (viewport.xMax - viewport.xMin);
      const strength = 1 + Math.min(Math.abs(event.deltaY) / 500, 0.7);
      if (event.deltaY < 0) {
        onZoomIn(anchor, 1 / strength);
      } else if (event.deltaY > 0) {
        onZoomOut(anchor, strength);
      }
    },
    [hasData, viewport, onZoomIn, onZoomOut]
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!hasData || !viewport) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      dragStateRef.current = {
        pointerId: event.pointerId,
        lastClientX: event.clientX,
      };
      setIsDragging(true);
      if (event.currentTarget.setPointerCapture) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    },
    [hasData, viewport]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const dragState = dragStateRef.current;
      if (!dragState || dragState.pointerId !== event.pointerId) {
        return;
      }
      if (!viewport) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const rect = event.currentTarget.getBoundingClientRect();
      if (rect.width <= 0) {
        return;
      }

      const deltaX = event.clientX - dragState.lastClientX;
      if (Math.abs(deltaX) < 0.5) {
        return;
      }

      dragState.lastClientX = event.clientX;

      const range = viewport.xMax - viewport.xMin;
      if (range <= 0) {
        return;
      }

      const ratio = deltaX / rect.width;
      const delta = -ratio * range;
      onPanByOffset(delta);
    },
    [viewport, onPanByOffset]
  );

  const endDrag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    dragStateRef.current = null;
    setIsDragging(false);

    if (
      event.currentTarget.releasePointerCapture &&
      event.currentTarget.hasPointerCapture &&
      event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!dragStateRef.current) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      endDrag(event);
    },
    [endDrag]
  );

  const handlePointerLeave = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!dragStateRef.current) {
        return;
      }
      endDrag(event);
    },
    [endDrag]
  );

  const containerClasses = [
    'relative h-[70vh] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/5 via-white to-blue-100 p-4',
    hasData && viewport ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default',
  ].join(' ');

  return (
    <Panel title="Chart" className="space-y-5">
      <ChartToolbar
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onPanLeft={onPanLeft}
        onPanRight={onPanRight}
        onReset={onResetView}
        onDownloadCsv={onDownloadCsv}
      />
      <div
        className={containerClasses}
        onWheelCapture={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerLeave}
        onPointerLeave={handlePointerLeave}
      >
        {hasData ? (
          <Line options={chartOptions} data={renderedChartData} />
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
