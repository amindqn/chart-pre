import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChartData } from 'chart.js';

interface Bounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

const extractBounds = (chartData: ChartData<'line'>): Bounds | null => {
  const labels = (chartData.labels ?? []) as Array<number | string>;
  const numericLabels = labels
    .map((value) => {
      const parsed = Number.parseFloat(String(value));
      return Number.isFinite(parsed) ? parsed : null;
    })
    .filter((value): value is number => value !== null);

  const yValues = chartData.datasets.flatMap((dataset) => {
    if (!Array.isArray(dataset.data)) {
      return [];
    }
    return dataset.data
      .map((value) => (typeof value === 'number' ? value : null))
      .filter((value): value is number => value !== null && Number.isFinite(value));
  });

  if (!numericLabels.length || !yValues.length) {
    return null;
  }

  return {
    xMin: Math.min(...numericLabels),
    xMax: Math.max(...numericLabels),
    yMin: Math.min(...yValues),
    yMax: Math.max(...yValues),
  };
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const useChartViewport = (chartData: ChartData<'line'>) => {
  const bounds = useMemo(() => extractBounds(chartData), [chartData]);
  const [viewport, setViewport] = useState<Bounds | null>(bounds);

  useEffect(() => {
    if (bounds) {
      setViewport(bounds);
    } else {
      setViewport(null);
    }
  }, [bounds?.xMin, bounds?.xMax, bounds?.yMin, bounds?.yMax]);

  const zoom = useCallback(
    (factor: number) => {
      if (!viewport || !bounds) {
        return;
      }
      const range = viewport.xMax - viewport.xMin;
      if (range <= 0) {
        return;
      }
      const center = viewport.xMin + range / 2;
      const newHalfRange = (range * factor) / 2;
      const newMin = clamp(center - newHalfRange, bounds.xMin, bounds.xMax);
      const newMax = clamp(center + newHalfRange, bounds.xMin, bounds.xMax);
      if (newMax - newMin < 1e-6) {
        return;
      }
      setViewport((prev) =>
        prev
          ? {
              ...prev,
              xMin: newMin,
              xMax: newMax,
            }
          : prev
      );
    },
    [viewport, bounds]
  );

  const pan = useCallback(
    (direction: 'left' | 'right') => {
      if (!viewport || !bounds) {
        return;
      }
      const range = viewport.xMax - viewport.xMin;
      const delta = range * 0.25 * (direction === 'left' ? -1 : 1);
      const newMin = clamp(viewport.xMin + delta, bounds.xMin, bounds.xMax);
      const newMax = clamp(viewport.xMax + delta, bounds.xMin, bounds.xMax);
      if (newMax - newMin < 1e-6) {
        return;
      }
      setViewport((prev) =>
        prev
          ? {
              ...prev,
              xMin: newMin,
              xMax: newMax,
            }
          : prev
      );
    },
    [viewport, bounds]
  );

  const reset = useCallback(() => {
    if (bounds) {
      setViewport(bounds);
    }
  }, [bounds]);

  return {
    viewport,
    zoomIn: () => zoom(0.6),
    zoomOut: () => zoom(1.4),
    panLeft: () => pan('left'),
    panRight: () => pan('right'),
    reset,
  };
};
