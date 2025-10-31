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

const clampViewport = (
  bounds: Bounds,
  candidate: Bounds
): Bounds => {
  const xMin = clamp(candidate.xMin, bounds.xMin, bounds.xMax);
  const xMax = clamp(candidate.xMax, bounds.xMin, bounds.xMax);
  const yMin = clamp(candidate.yMin, bounds.yMin, bounds.yMax);
  const yMax = clamp(candidate.yMax, bounds.yMin, bounds.yMax);

  if (xMax - xMin < 1e-6 || yMax - yMin < 1e-6) {
    return bounds;
  }

  return { xMin, xMax, yMin, yMax };
};

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

  const zoomByFactor = useCallback(
    (factor: number, anchor?: number) => {
      if (!viewport || !bounds || factor <= 0) {
        return;
      }
      const range = viewport.xMax - viewport.xMin;
      if (range <= 0) {
        return;
      }
      const effectiveAnchor =
        anchor !== undefined && anchor >= bounds.xMin && anchor <= bounds.xMax
          ? anchor
          : viewport.xMin + range / 2;

      const leftPortion = effectiveAnchor - viewport.xMin;
      const rightPortion = viewport.xMax - effectiveAnchor;
      const newLeftPortion = leftPortion * factor;
      const newRightPortion = rightPortion * factor;

      const candidate: Bounds = {
        xMin: effectiveAnchor - newLeftPortion,
        xMax: effectiveAnchor + newRightPortion,
        yMin: viewport.yMin,
        yMax: viewport.yMax,
      };

      setViewport(clampViewport(bounds, candidate));
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
    zoomIn: (anchor?: number, factor = 0.85) =>
      zoomByFactor(Math.max(Math.min(factor, 0.99), 0.01), anchor),
    zoomOut: (anchor?: number, factor = 1.15) =>
      zoomByFactor(Math.max(factor, 1.01), anchor),
    panLeft: () => pan('left'),
    panRight: () => pan('right'),
    reset,
  };
};
