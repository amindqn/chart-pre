import { useMemo } from 'react';
import type { ChartData } from 'chart.js';

import type {
  ChartDisplayOptions,
  DataSeries,
  PlotStats,
  SeriesStats,
} from '../types/plot';

const EMPTY_DATA: ChartData<'line'> = {
  labels: [],
  datasets: [],
};

const hexToRgba = (hexColor: string, alpha: number) => {
  const sanitized = hexColor.replace('#', '');
  if (sanitized.length !== 6) {
    return hexColor;
  }
  const bigint = Number.parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface UseDatasetPlotResult {
  chartData: ChartData<'line'>;
  warnings: string[];
  stats: PlotStats;
}

export const useDatasetPlot = (
  datasetsInput: DataSeries[],
  options: ChartDisplayOptions
): UseDatasetPlotResult => {
  return useMemo(() => {
    const warnings: string[] = [];

    if (!datasetsInput.length) {
      return {
        chartData: EMPTY_DATA,
        warnings,
        stats: {
          mode: 'dataset',
          sampleCount: 0,
          series: [],
        },
      };
    }

    const xValueSet = new Set<number>();
    const normalizedSeries = datasetsInput.map((series) => {
      const points = series.points
        .map((point) => ({
          x: Number.parseFloat(String(point.x)),
          y: Number.parseFloat(String(point.y)),
        }))
        .filter(
          (point) =>
            Number.isFinite(point.x) && Number.isFinite(point.y)
        );

      points.forEach((point) => xValueSet.add(point.x));

      const map = new Map<number, number>();
      points
        .sort((a, b) => a.x - b.x)
        .forEach((point) => {
          map.set(point.x, point.y);
        });

      const stats: SeriesStats = {
        id: series.id,
        label: series.label,
        visible: series.visible,
        validPoints: points.length,
        minY: points.length ? Math.min(...points.map((p) => p.y)) : null,
        maxY: points.length ? Math.max(...points.map((p) => p.y)) : null,
        minX: points.length ? Math.min(...points.map((p) => p.x)) : null,
        maxX: points.length ? Math.max(...points.map((p) => p.x)) : null,
      };

      if (points.length < 2 && series.visible) {
        warnings.push(
          `Series "${series.label}" requires at least two valid points to render a curve.`
        );
      }

      return {
        meta: series,
        stats,
        map,
      };
    });

    const labels = Array.from(xValueSet).sort((a, b) => a - b);

    const chartData: ChartData<'line'> = {
      labels,
      datasets: normalizedSeries.map(({ meta, map }) => {
        const baseColor = meta.color;
        const fillColor = hexToRgba(baseColor, 0.18);
        const data = labels.map((x) => map.get(x) ?? null);
        return {
          id: meta.id,
          label: `${meta.label}`,
          data,
          borderColor: baseColor,
          backgroundColor: fillColor,
          pointBackgroundColor: baseColor,
          pointRadius: options.showPoints ? 4 : 0,
          pointHoverRadius: options.showPoints ? 6 : 0,
          borderWidth: 2,
          tension: options.smoothCurve ? 0.3 : 0,
          spanGaps: true,
          fill: options.fillArea ? { target: 'origin', above: fillColor } : false,
          hidden: !meta.visible,
        };
      }),
    };

    const aggregateStats = normalizedSeries.map(({ stats }) => stats);
    const domainCandidates = aggregateStats.filter(
      (stat) => stat.minX !== null && stat.maxX !== null
    );

    const domain = domainCandidates.length
      ? {
          minX: Math.min(
            ...domainCandidates.map((stat) => stat.minX as number)
          ),
          maxX: Math.max(
            ...domainCandidates.map((stat) => stat.maxX as number)
          ),
          step:
            labels.length > 1 ? Math.abs(labels[1] - labels[0]) : 0,
        }
      : undefined;

    const stats: PlotStats = {
      mode: 'dataset',
      domain,
      sampleCount: labels.length,
      series: aggregateStats,
    };

    return { chartData, warnings, stats };
  }, [datasetsInput, options]);
};
