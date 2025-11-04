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

const shiftRangeWithinBounds = (
  min: number,
  max: number,
  delta: number,
  boundMin: number,
  boundMax: number
) => {
  let nextMin = min + delta;
  let nextMax = max + delta;

  if (nextMin < boundMin) {
    const adjustment = boundMin - nextMin;
    nextMin += adjustment;
    nextMax += adjustment;
  }

  if (nextMax > boundMax) {
    const adjustment = nextMax - boundMax;
    nextMin -= adjustment;
    nextMax -= adjustment;
  }

  nextMin = clamp(nextMin, boundMin, boundMax);
  nextMax = clamp(nextMax, boundMin, boundMax);

  if (nextMax - nextMin < 1e-6) {
    return { changed: false as const, min, max };
  }

  if (Math.abs(nextMin - min) < 1e-9 && Math.abs(nextMax - max) < 1e-9) {
    return { changed: false as const, min, max };
  }

  return { changed: true as const, min: nextMin, max: nextMax };
};

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
      return;
    }
    setViewport(null);
  }, [bounds]);

  const zoomXAxis = useCallback(
    (factor: number, anchor?: number) => {
      if (!bounds || factor <= 0) {
        return;
      }

      setViewport((prev) => {
        if (!prev) {
          return prev;
        }

        const range = prev.xMax - prev.xMin;
        if (range <= 0) {
          return prev;
        }

        const effectiveAnchor =
          anchor !== undefined && anchor >= bounds.xMin && anchor <= bounds.xMax
            ? anchor
            : prev.xMin + range / 2;

        const leftPortion = effectiveAnchor - prev.xMin;
        const rightPortion = prev.xMax - effectiveAnchor;
        const newLeftPortion = leftPortion * factor;
        const newRightPortion = rightPortion * factor;

        const candidate: Bounds = {
          xMin: effectiveAnchor - newLeftPortion,
          xMax: effectiveAnchor + newRightPortion,
          yMin: prev.yMin,
          yMax: prev.yMax,
        };

        return clampViewport(bounds, candidate);
      });
    },
    [bounds]
  );

  const zoomYAxis = useCallback(
    (factor: number, anchor?: number) => {
      if (!bounds || factor <= 0) {
        return;
      }

      setViewport((prev) => {
        if (!prev) {
          return prev;
        }

        const range = prev.yMax - prev.yMin;
        if (range <= 0) {
          return prev;
        }

        const effectiveAnchor =
          anchor !== undefined && anchor >= bounds.yMin && anchor <= bounds.yMax
            ? anchor
            : prev.yMin + range / 2;

        const lowerPortion = effectiveAnchor - prev.yMin;
        const upperPortion = prev.yMax - effectiveAnchor;
        const newLowerPortion = lowerPortion * factor;
        const newUpperPortion = upperPortion * factor;

        const candidate: Bounds = {
          xMin: prev.xMin,
          xMax: prev.xMax,
          yMin: effectiveAnchor - newLowerPortion,
          yMax: effectiveAnchor + newUpperPortion,
        };

        return clampViewport(bounds, candidate);
      });
    },
    [bounds]
  );

  const pan = useCallback(
    (direction: 'left' | 'right') => {
      if (!bounds) {
        return;
      }
      setViewport((prev) => {
        if (!prev) {
          return prev;
        }
        const range = prev.xMax - prev.xMin;
        if (range <= 0) {
          return prev;
        }
        const delta = range * 0.25 * (direction === 'left' ? -1 : 1);
        const shifted = shiftRangeWithinBounds(
          prev.xMin,
          prev.xMax,
          delta,
          bounds.xMin,
          bounds.xMax
        );
        if (!shifted.changed) {
          return prev;
        }
        return { ...prev, xMin: shifted.min, xMax: shifted.max };
      });
    },
    [bounds]
  );

  const panVertical = useCallback(
    (direction: 'up' | 'down') => {
      if (!bounds) {
        return;
      }
      setViewport((prev) => {
        if (!prev) {
          return prev;
        }
        const range = prev.yMax - prev.yMin;
        if (range <= 0) {
          return prev;
        }
        const delta = range * 0.25 * (direction === 'up' ? 1 : -1);
        const shifted = shiftRangeWithinBounds(
          prev.yMin,
          prev.yMax,
          delta,
          bounds.yMin,
          bounds.yMax
        );
        if (!shifted.changed) {
          return prev;
        }
        return { ...prev, yMin: shifted.min, yMax: shifted.max };
      });
    },
    [bounds]
  );

  const panByOffset = useCallback(
    (delta: number) => {
      if (!bounds || Math.abs(delta) < 1e-12) {
        return;
      }

      setViewport((prev) => {
        if (!prev) {
          return prev;
        }
        const shifted = shiftRangeWithinBounds(
          prev.xMin,
          prev.xMax,
          delta,
          bounds.xMin,
          bounds.xMax
        );
        if (!shifted.changed) {
          return prev;
        }
        return { ...prev, xMin: shifted.min, xMax: shifted.max };
      });
    },
    [bounds]
  );

  const panYByOffset = useCallback(
    (delta: number) => {
      if (!bounds || Math.abs(delta) < 1e-12) {
        return;
      }

      setViewport((prev) => {
        if (!prev) {
          return prev;
        }
        const shifted = shiftRangeWithinBounds(
          prev.yMin,
          prev.yMax,
          delta,
          bounds.yMin,
          bounds.yMax
        );
        if (!shifted.changed) {
          return prev;
        }
        return { ...prev, yMin: shifted.min, yMax: shifted.max };
      });
    },
    [bounds]
  );

  const reset = useCallback(() => {
    if (bounds) {
      setViewport(bounds);
    }
  }, [bounds]);

  return {
    viewport,
    zoomIn: (anchor?: number, factor = 0.85) =>
      zoomXAxis(Math.max(Math.min(factor, 0.99), 0.01), anchor),
    zoomOut: (anchor?: number, factor = 1.15) =>
      zoomXAxis(Math.max(factor, 1.01), anchor),
    zoomYIn: (anchor?: number, factor = 0.85) =>
      zoomYAxis(Math.max(Math.min(factor, 0.99), 0.01), anchor),
    zoomYOut: (anchor?: number, factor = 1.15) =>
      zoomYAxis(Math.max(factor, 1.01), anchor),
    panLeft: () => pan('left'),
    panRight: () => pan('right'),
    panUp: () => panVertical('up'),
    panDown: () => panVertical('down'),
    reset,
    panByOffset,
    panYByOffset,
  };
};
