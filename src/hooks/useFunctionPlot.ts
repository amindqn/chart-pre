import { useMemo } from 'react';
import type { ChartData } from 'chart.js';

import { evaluateExpression } from '../utils/evaluateExpression';
import type {
  ChartDisplayOptions,
  DomainSettings,
  GraphedFunction,
  PlotStats,
  SeriesStats,
} from '../types/plot';

const EMPTY_DATA: ChartData<'line'> = {
  labels: [],
  datasets: [],
};

const MAX_POINTS = 5000;

const clampStep = (step: number) => {
  if (!Number.isFinite(step) || step === 0) {
    return 0.1;
  }
  return Math.abs(step);
};

const toFixedNumber = (value: number, digits: number) =>
  Number.parseFloat(value.toFixed(digits));

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

interface UseFunctionPlotResult {
  chartData: ChartData<'line'>;
  warnings: string[];
  stats: PlotStats;
}

export const useFunctionPlot = (
  functions: GraphedFunction[],
  domain: DomainSettings,
  options: ChartDisplayOptions
): UseFunctionPlotResult => {
  return useMemo(() => {
    const warnings: string[] = [];

    const { minX, maxX } = domain;

    if (!Number.isFinite(minX) || !Number.isFinite(maxX)) {
      warnings.push('Minimum or maximum X is not a valid number.');
      return {
        chartData: EMPTY_DATA,
        warnings,
        stats: {
          mode: 'function',
          domain,
          sampleCount: 0,
          series: functions.map((fn) => ({
            id: fn.id,
            label: fn.label,
            visible: fn.visible,
            validPoints: 0,
            minY: null,
            maxY: null,
            minX: null,
            maxX: null,
          })),
        },
      };
    }

    if (maxX <= minX) {
      warnings.push('Max X must be greater than Min X.');
      return {
        chartData: EMPTY_DATA,
        warnings,
        stats: {
          mode: 'function',
          domain,
          sampleCount: 0,
          series: functions.map((fn) => ({
            id: fn.id,
            label: fn.label,
            visible: fn.visible,
            validPoints: 0,
            minY: null,
            maxY: null,
            minX: null,
            maxX: null,
          })),
        },
      };
    }

    let effectiveStep = clampStep(domain.step);
    const range = maxX - minX;
    let estimatedPoints = Math.floor(range / effectiveStep) + 1;

    if (estimatedPoints > MAX_POINTS) {
      const adjustedStep = range / (MAX_POINTS - 1);
      warnings.push(
        'Sampling step was automatically adjusted to avoid performance issues.'
      );
      effectiveStep = adjustedStep;
      estimatedPoints = MAX_POINTS;
    }

    const labels: number[] = [];
    const datasets = functions.map(() => [] as Array<number | null>);
    const statsPerFunction: SeriesStats[] = functions.map((fn) => ({
      id: fn.id,
      label: fn.label,
      visible: fn.visible,
      validPoints: 0,
      minY: null,
      maxY: null,
      minX: null,
      maxX: null,
    }));

    for (
      let x = minX, index = 0;
      x <= maxX + effectiveStep / 2 && index < estimatedPoints;
      x += effectiveStep, index += 1
    ) {
      const roundedX = toFixedNumber(x, 6);
      labels.push(roundedX);

      functions.forEach((fn, idx) => {
        if (!fn.expression.trim()) {
          datasets[idx].push(null);
          return;
        }

        const value = evaluateExpression(fn.expression, roundedX);
        if (value === null || !Number.isFinite(value)) {
          datasets[idx].push(null);
          return;
        }

        const roundedY = toFixedNumber(value, 6);
        datasets[idx].push(roundedY);
        const stat = statsPerFunction[idx];
        stat.validPoints += 1;
        stat.minY =
          stat.minY === null ? roundedY : Math.min(stat.minY, roundedY);
        stat.maxY =
          stat.maxY === null ? roundedY : Math.max(stat.maxY, roundedY);
        stat.minX = stat.minX === null ? roundedX : Math.min(stat.minX, roundedX);
        stat.maxX = stat.maxX === null ? roundedX : Math.max(stat.maxX, roundedX);
      });
    }

    const chartData: ChartData<'line'> = {
      labels,
      datasets: functions.map((fn, idx) => {
        const baseColor = fn.color;
        const fillColor = hexToRgba(baseColor, 0.16);
        return {
          id: fn.id,
          label: `${fn.label}(x) = ${fn.expression}`,
          data: datasets[idx],
          borderColor: baseColor,
          backgroundColor: fillColor,
          pointRadius: options.showPoints ? 3 : 0,
          pointHoverRadius: options.showPoints ? 5 : 0,
          pointBackgroundColor: baseColor,
          borderWidth: 2,
          tension: options.smoothCurve ? 0.3 : 0,
          spanGaps: true,
          cubicInterpolationMode: options.smoothCurve ? 'monotone' : 'default',
          fill: options.fillArea ? { target: 'origin', above: fillColor } : false,
          hidden: !fn.visible,
        };
      }),
    };

    statsPerFunction.forEach((stat) => {
      if (stat.validPoints === 0) {
        stat.minY = null;
        stat.maxY = null;
        stat.minX = null;
        stat.maxX = null;
        if (stat.visible) {
          warnings.push(
            `Function "${stat.label}" did not produce valid values in the selected domain.`
          );
        }
      }
    });

    const stats: PlotStats = {
      mode: 'function',
      domain: {
        ...domain,
        step: effectiveStep,
      },
      sampleCount: labels.length,
      series: statsPerFunction,
    };

    return { chartData, warnings, stats };
  }, [functions, domain, options]);
}; 
