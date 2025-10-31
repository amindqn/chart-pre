import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { WheelEvent as ReactWheelEvent } from 'react';
import type {
  ChartData,
  ChartDataset,
  ChartOptions as ChartJsOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

import type { ChartDisplayOptions } from '../../types/plot';
import { Panel } from '../common/Panel';
import { ChartToolbar } from './ChartToolbar';

const parseLabel = (value: number | string): number | null => {
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const EPSILON = 1e-6;

interface IntersectionPoint {
  x: number;
  y: number;
  seriesNames: [string, string];
  datasetIndices: [number, number];
}

const computeIntersections = (
  chartData: ChartData<'line'>
): IntersectionPoint[] => {
  const labels = (chartData.labels ?? []) as Array<number | string>;
  if (!labels.length) {
    return [];
  }

  const numericLabels = labels.map((label) => parseLabel(label));
  const intersections = new Map<string, IntersectionPoint>();

  for (let i = 0; i < chartData.datasets.length; i += 1) {
    const datasetA = chartData.datasets[i];
    if (datasetA.hidden || !Array.isArray(datasetA.data)) {
      continue;
    }
    const dataA = datasetA.data as Array<number | null>;

    for (let j = i + 1; j < chartData.datasets.length; j += 1) {
      const datasetB = chartData.datasets[j];
      if (datasetB.hidden || !Array.isArray(datasetB.data)) {
        continue;
      }
      const dataB = datasetB.data as Array<number | null>;

      for (let index = 0; index < numericLabels.length - 1; index += 1) {
        const x0 = numericLabels[index];
        const x1 = numericLabels[index + 1];

        if (!isFiniteNumber(x0) || !isFiniteNumber(x1)) {
          continue;
        }

        const y0A = dataA[index];
        const y0B = dataB[index];
        const y1A = dataA[index + 1];
        const y1B = dataB[index + 1];

        if (
          !isFiniteNumber(y0A) ||
          !isFiniteNumber(y0B) ||
          !isFiniteNumber(y1A) ||
          !isFiniteNumber(y1B)
        ) {
          continue;
        }

        const diff0 = y0A - y0B;
        const diff1 = y1A - y1B;
        const labelA = datasetA.label ?? `Series ${i + 1}`;
        const labelB = datasetB.label ?? `Series ${j + 1}`;
        const baseKey = `${i}-${j}`;

        if (Math.abs(diff0) <= EPSILON) {
          const key = `${x0.toFixed(6)}|${y0A.toFixed(6)}|${baseKey}`;
          if (!intersections.has(key)) {
            intersections.set(key, {
              x: x0,
              y: y0A,
              seriesNames: [labelA, labelB],
              datasetIndices: [i, j],
            });
          }
        }

        if (Math.abs(diff1) <= EPSILON) {
          const key = `${x1.toFixed(6)}|${y1A.toFixed(6)}|${baseKey}`;
          if (!intersections.has(key)) {
            intersections.set(key, {
              x: x1,
              y: y1A,
              seriesNames: [labelA, labelB],
              datasetIndices: [i, j],
            });
          }
        }

        if ((diff0 < 0 && diff1 > 0) || (diff0 > 0 && diff1 < 0)) {
          const denominator = diff0 - diff1;
          if (!Number.isFinite(denominator) || Math.abs(denominator) < EPSILON) {
            continue;
          }
          const t = diff0 / denominator;
          if (!Number.isFinite(t) || t < 0 || t > 1) {
            continue;
          }
          const x = x0 + t * (x1 - x0);
          const y = y0A + t * (y1A - y0A);
          if (!isFiniteNumber(x) || !isFiniteNumber(y)) {
            continue;
          }
          const key = `${x.toFixed(6)}|${y.toFixed(6)}|${baseKey}`;
          if (!intersections.has(key)) {
            intersections.set(key, {
              x,
              y,
              seriesNames: [labelA, labelB],
              datasetIndices: [i, j],
            });
          }
        }
      }
    }
  }

  return Array.from(intersections.values());
};

const formatCoordinate = (value: number, digits = 4) =>
  Number.isFinite(value) ? value.toFixed(digits) : `${value}`;

const getCoordinateString = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value)
    ? formatCoordinate(value)
    : '';

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
  const intersectionPoints = useMemo(
    () => computeIntersections(chartData),
    [chartData]
  );

  const renderedChartData = useMemo<ChartData<'line'>>(() => {
    const labels = (chartData.labels ?? []) as Array<number | string>;
    const numericLabels = labels.map((label) => parseLabel(label));

    const lineDatasets = chartData.datasets.map((dataset) => {
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
      });

    const datasetsWithIntersections: ChartDataset<'line'>[] = [...lineDatasets];

    if (intersectionPoints.length > 0) {
      const intersectionDataset = {
        type: 'scatter' as const,
        label: 'Intersections',
        data: intersectionPoints.map((point) => ({
          x: point.x,
          y: point.y,
          seriesNames: point.seriesNames,
        })),
        pointBackgroundColor: '#f97316',
        pointBorderColor: '#c2410c',
        pointRadius: 5,
        pointHoverRadius: 7,
        showLine: false,
        parsing: {
          xAxisKey: 'x',
          yAxisKey: 'y',
        },
      };

      datasetsWithIntersections.push(
        intersectionDataset as unknown as ChartDataset<'line'>
      );
    }

    return {
      ...chartData,
      datasets: datasetsWithIntersections,
    };
  }, [chartData, intersectionPoints]);

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
              return typeof parsedX === 'number'
                ? `x = ${formatCoordinate(parsedX)}`
                : '';
            },
            label: (context) => {
              const datasetType = (context.dataset as { type?: string }).type;
              if (datasetType === 'scatter') {
                const raw = context.raw as {
                  x?: number;
                  y?: number;
                  seriesNames?: [string, string];
                };
                const seriesLabel = Array.isArray(raw?.seriesNames)
                  ? raw.seriesNames.join(' ∩ ')
                  : context.dataset.label ?? 'Intersection';
                const xValue =
                  getCoordinateString(context.parsed?.x) ||
                  getCoordinateString(raw?.x);
                const yValue =
                  getCoordinateString(context.parsed?.y) ||
                  getCoordinateString(raw?.y);
                return `${seriesLabel}: (${xValue}, ${yValue})`;
              }
              const datasetLabel = context.dataset.label ?? '';
              const value =
                typeof context.parsed?.y === 'number'
                  ? formatCoordinate(context.parsed.y)
                  : context.formattedValue;
              return datasetLabel ? `${datasetLabel}: ${value}` : `${value}`;
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
  const overflowRestoreRef = useRef<string | null>(null);

  const lockBodyScroll = useCallback(() => {
    if (typeof document === 'undefined') {
      return;
    }
    if (overflowRestoreRef.current !== null) {
      return;
    }
    overflowRestoreRef.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }, []);

  const unlockBodyScroll = useCallback(() => {
    if (typeof document === 'undefined') {
      return;
    }
    if (overflowRestoreRef.current === null) {
      return;
    }
    document.body.style.overflow = overflowRestoreRef.current;
    overflowRestoreRef.current = null;
  }, []);

  useEffect(
    () => () => {
      unlockBodyScroll();
    },
    [unlockBodyScroll]
  );

  useEffect(() => {
    if (!hasData || !viewport) {
      unlockBodyScroll();
    }
  }, [hasData, viewport, unlockBodyScroll]);

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

  const handlePointerEnter = useCallback(() => {
    if (!hasData || !viewport) {
      return;
    }
    lockBodyScroll();
  }, [hasData, viewport, lockBodyScroll]);

  const handleMouseEnter = useCallback(() => {
    if (!hasData || !viewport) {
      return;
    }
    lockBodyScroll();
  }, [hasData, viewport, lockBodyScroll]);

  const handleMouseLeave = useCallback(() => {
    unlockBodyScroll();
  }, [unlockBodyScroll]);

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
      endDrag(event);
      unlockBodyScroll();
    },
    [endDrag, unlockBodyScroll]
  );

  const containerClasses = [
    'relative h-[70vh] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/5 via-white to-blue-100 p-4 touch-none',
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
        onPointerEnter={handlePointerEnter}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
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
