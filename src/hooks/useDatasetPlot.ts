import { useMemo } from 'react';
import type { ChartData } from 'chart.js';

import type {
  ChartDisplayOptions,
  DataSeries,
  PlotStats,
  PolynomialFitType,
  SeriesFitType,
  SeriesStats,
} from '../types/plot';
import {
  DEFAULT_FIT_SAMPLE_COUNT,
  FIT_TYPE_LABELS,
  POLYNOMIAL_FIT_LABELS,
  POLYNOMIAL_FIT_TYPES,
} from '../constants/fit';
import { calculateAreaUnderCurve } from '../utils/calculateAreaUnderCurve';
import {
  evaluatePolynomial,
  getPolynomialDegree,
  polynomialRegression,
} from '../utils/polynomialRegression';

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

const clampSampleCount = (value?: number): number => {
  if (!Number.isFinite(value)) {
    return DEFAULT_FIT_SAMPLE_COUNT;
  }
  const numeric = Math.floor(value as number);
  if (numeric < 20) {
    return 20;
  }
  if (numeric > 600) {
    return 600;
  }
  return numeric;
};

const SMALL_COEFFICIENT_THRESHOLD = 1e-9;

const formatCoefficient = (value: number): string => {
  if (!Number.isFinite(value)) {
    return 'NaN';
  }
  const abs = Math.abs(value);
  if (abs >= 1000 || abs < 0.001) {
    return value.toExponential(3);
  }
  return value.toFixed(4);
};

const buildPolynomialEquation = (coefficients: number[]): string => {
  const terms: string[] = [];

  coefficients.forEach((coefficient, index) => {
    if (Math.abs(coefficient) <= SMALL_COEFFICIENT_THRESHOLD) {
      return;
    }

    const magnitude = formatCoefficient(Math.abs(coefficient));
    let term = '';

    if (index === 0) {
      term = magnitude;
    } else {
      term = `${magnitude}·x`;
      if (index > 1) {
        term += `^${index}`;
      }
    }

    if (!terms.length) {
      terms.push(coefficient < 0 ? `-${term}` : term);
    } else {
      terms.push(`${coefficient < 0 ? '-' : '+'} ${term}`);
    }
  });

  const expression = terms.length ? terms.join(' ') : '0';
  return `y = ${expression}`;
};

const computeFitMetrics = (
  coefficients: number[],
  points: Array<{ x: number; y: number }>
) => {
  const validPairs = points
    .map(({ x, y }) => {
      const predicted = evaluatePolynomial(coefficients, x);
      if (!Number.isFinite(predicted)) {
        return null;
      }
      return { actual: y, predicted };
    })
    .filter(
      (entry): entry is { actual: number; predicted: number } =>
        entry !== null
    );

  if (!validPairs.length) {
    return {
      rSquared: null,
      rmse: null,
    };
  }

  const meanY =
    validPairs.reduce((sum, pair) => sum + pair.actual, 0) / validPairs.length;

  let ssRes = 0;
  let ssTot = 0;

  validPairs.forEach(({ actual, predicted }) => {
    const residual = actual - predicted;
    ssRes += residual * residual;
    const diffMean = actual - meanY;
    ssTot += diffMean * diffMean;
  });

  const rSquared =
    ssTot <= SMALL_COEFFICIENT_THRESHOLD ? null : 1 - ssRes / ssTot;
  const rmse = Math.sqrt(ssRes / validPairs.length);

  return {
    rSquared: Number.isFinite(rSquared) ? rSquared : null,
    rmse: Number.isFinite(rmse) ? rmse : null,
  };
};

interface FitAttemptSuccess {
  ok: true;
  data: {
    type: PolynomialFitType;
    coefficients: number[];
    domain: { min: number; max: number };
    sampleCount: number;
    equation: string;
    rSquared: number | null;
    rmse: number | null;
    sampleXs: number[];
  };
}

interface FitAttemptFailure {
  ok: false;
  reason: string;
}

type FitAttempt = FitAttemptSuccess | FitAttemptFailure;

const attemptPolynomialFit = (
  fitType: PolynomialFitType,
  points: Array<{ x: number; y: number }>,
  sampleCount: number,
  seriesLabel: string
): FitAttempt => {
  const degree = getPolynomialDegree(fitType);
  const requiredPoints = degree + 1;
  if (points.length < requiredPoints) {
    return {
      ok: false,
      reason: `Series "${seriesLabel}" needs at least ${requiredPoints} unique points for a ${POLYNOMIAL_FIT_LABELS[fitType].toLowerCase()}.`,
    };
  }

  const domainMin = points[0].x;
  const domainMax = points[points.length - 1].x;
  if (
    !Number.isFinite(domainMin) ||
    !Number.isFinite(domainMax) ||
    Math.abs(domainMax - domainMin) <= 1e-9
  ) {
    return {
      ok: false,
      reason: `Series "${seriesLabel}" requires at least two distinct x values to compute a fit.`,
    };
  }

  try {
    const { coefficients } = polynomialRegression(points, degree);
    const equation = buildPolynomialEquation(coefficients);
    const { rSquared, rmse } = computeFitMetrics(coefficients, points);
    const range = domainMax - domainMin;
    const step = sampleCount > 1 ? range / (sampleCount - 1) : 0;
    const sampleXs: number[] = [];

    for (let index = 0; index < sampleCount; index += 1) {
      const x =
        index === sampleCount - 1
          ? domainMax
          : domainMin + step * index;
      if (Number.isFinite(x)) {
        sampleXs.push(x);
      }
    }

    return {
      ok: true,
      data: {
        type: fitType,
        coefficients,
        domain: { min: domainMin, max: domainMax },
        sampleCount,
        equation,
        rSquared,
        rmse,
        sampleXs,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to complete regression.';
    return {
      ok: false,
      reason: `Could not compute ${POLYNOMIAL_FIT_LABELS[fitType].toLowerCase()} for "${seriesLabel}": ${message}`,
    };
  }
};

const isBetterFit = (candidate: FitAttemptSuccess, best: FitAttemptSuccess) => {
  const candidateRSquared = candidate.data.rSquared ?? Number.NEGATIVE_INFINITY;
  const bestRSquared = best.data.rSquared ?? Number.NEGATIVE_INFINITY;

  if (Math.abs(candidateRSquared - bestRSquared) > 1e-9) {
    return candidateRSquared > bestRSquared;
  }

  const candidateRmse = candidate.data.rmse ?? Number.POSITIVE_INFINITY;
  const bestRmse = best.data.rmse ?? Number.POSITIVE_INFINITY;

  if (Math.abs(candidateRmse - bestRmse) > 1e-9) {
    return candidateRmse < bestRmse;
  }

  const candidateDegree = getPolynomialDegree(candidate.data.type);
  const bestDegree = getPolynomialDegree(best.data.type);

  return candidateDegree < bestDegree;
};

const getLegendLabel = (
  selectedType: SeriesFitType,
  resolvedType: PolynomialFitType
) => {
  const resolvedLabel = POLYNOMIAL_FIT_LABELS[resolvedType];
  if (selectedType === 'auto') {
    return `${FIT_TYPE_LABELS.auto}: ${resolvedLabel}`;
  }
  return resolvedLabel;
};

interface NormalizedSeriesEntry {
  meta: DataSeries;
  stats: SeriesStats;
  map: Map<number, number>;
  points: Array<{ x: number; y: number }>;
  fit: {
    selectedType: SeriesFitType;
    resolvedType: PolynomialFitType;
    coefficients: number[];
    domain: { min: number; max: number };
    sampleCount: number;
    equation: string;
    rSquared: number | null;
    rmse: number | null;
  } | null;
}

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

    const chartXValueSet = new Set<number>();
    const baseXValueSet = new Set<number>();
    const normalizedSeries: NormalizedSeriesEntry[] = datasetsInput.map((series) => {
      const sanitizedPoints = series.points
        .map((point) => ({
          x: Number.parseFloat(String(point.x)),
          y: Number.parseFloat(String(point.y)),
        }))
        .filter(
          (point) =>
            Number.isFinite(point.x) && Number.isFinite(point.y)
        );

      const sortedPoints = sanitizedPoints.sort((a, b) => a.x - b.x);

      const pointMap = new Map<number, number>();
      sortedPoints.forEach((point) => {
        pointMap.set(point.x, point.y);
      });

      const uniquePoints = Array.from(pointMap.entries()).map(([x, y]) => ({
        x,
        y,
      }));

      uniquePoints.forEach((point) => {
        chartXValueSet.add(point.x);
        baseXValueSet.add(point.x);
      });

      const stats: SeriesStats = {
        id: series.id,
        label: series.label,
        visible: series.visible,
        validPoints: sortedPoints.length,
        minY: sortedPoints.length ? Math.min(...sortedPoints.map((p) => p.y)) : null,
        maxY: sortedPoints.length ? Math.max(...sortedPoints.map((p) => p.y)) : null,
        minX: sortedPoints.length ? Math.min(...sortedPoints.map((p) => p.x)) : null,
        maxX: sortedPoints.length ? Math.max(...sortedPoints.map((p) => p.x)) : null,
        areaUnderCurve: null,
        fit: undefined,
      };

      if (sortedPoints.length < 2 && series.visible) {
        warnings.push(
          `Series "${series.label}" requires at least two valid points to render a curve.`
        );
      }

      let fit: NormalizedSeriesEntry['fit'] = null;

      if (series.fit) {
        if (!uniquePoints.length) {
          warnings.push(
            `At least two numeric data points are required to compute a fit for "${series.label}".`
          );
        } else {
          const sampleCount = clampSampleCount(series.fit.sampleCount ?? DEFAULT_FIT_SAMPLE_COUNT);
          if (series.fit.type === 'auto') {
            const attempts: FitAttempt[] = POLYNOMIAL_FIT_TYPES.map((fitType) =>
              attemptPolynomialFit(fitType, uniquePoints, sampleCount, series.label)
            );
            const successes = attempts.filter(
              (attempt): attempt is FitAttemptSuccess => attempt.ok
            );
            if (successes.length) {
              let best = successes[0];
              for (let index = 1; index < successes.length; index += 1) {
                const candidate = successes[index];
                if (isBetterFit(candidate, best)) {
                  best = candidate;
                }
              }
              best.data.sampleXs.forEach((x) => chartXValueSet.add(x));
              fit = {
                selectedType: 'auto',
                resolvedType: best.data.type,
                coefficients: best.data.coefficients,
                domain: best.data.domain,
                sampleCount: best.data.sampleCount,
                equation: best.data.equation,
                rSquared: best.data.rSquared,
                rmse: best.data.rmse,
              };
            } else {
              const failureReasons = attempts
                .filter((attempt): attempt is FitAttemptFailure => !attempt.ok)
                .map((failure) => failure.reason);
              warnings.push(
                failureReasons[0] ??
                  `Unable to compute an auto fit for "${series.label}".`
              );
            }
          } else {
            const attempt = attemptPolynomialFit(
              series.fit.type,
              uniquePoints,
              sampleCount,
              series.label
            );
            if (attempt.ok) {
              attempt.data.sampleXs.forEach((x) => chartXValueSet.add(x));
              fit = {
                selectedType: series.fit.type,
                resolvedType: attempt.data.type,
                coefficients: attempt.data.coefficients,
                domain: attempt.data.domain,
                sampleCount: attempt.data.sampleCount,
                equation: attempt.data.equation,
                rSquared: attempt.data.rSquared,
                rmse: attempt.data.rmse,
              };
            } else {
              warnings.push(attempt.reason);
            }
          }
        }
      }

      return {
        meta: series,
        stats,
        map: pointMap,
        points: uniquePoints,
        fit,
      };
    });

    const labels = Array.from(chartXValueSet).sort((a, b) => a - b);
    const chartDatasets: ChartData<'line'>['datasets'] = [];

    normalizedSeries.forEach(({ meta, map, fit, stats, points }) => {
      const baseColor = meta.color;
      const fillColor = hexToRgba(baseColor, 0.18);
      const tolerance = 1e-9;
      let pointIndex = 0;
      const data = labels.map((label) => {
        if (map.has(label)) {
          return map.get(label) ?? null;
        }

        while (
          pointIndex < points.length &&
          points[pointIndex].x < label - tolerance
        ) {
          pointIndex += 1;
        }

        const leftIndex = pointIndex - 1;
        const rightIndex = pointIndex;

        if (
          leftIndex >= 0 &&
          rightIndex < points.length &&
          points[leftIndex].x < label &&
          label < points[rightIndex].x
        ) {
          const left = points[leftIndex];
          const right = points[rightIndex];
          const span = right.x - left.x;
          if (!Number.isFinite(span) || Math.abs(span) <= tolerance) {
            return null;
          }
          const t = (label - left.x) / span;
          return left.y + t * (right.y - left.y);
        }

        return null;
      });

      chartDatasets.push({
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
      });

      if (options.fillArea && meta.visible) {
        stats.areaUnderCurve = calculateAreaUnderCurve(labels, data);
      } else {
        stats.areaUnderCurve = null;
      }

      if (fit) {
        const fitData = labels.map((x) => {
          if (x < fit.domain.min - 1e-9 || x > fit.domain.max + 1e-9) {
            return null;
          }
          const value = evaluatePolynomial(fit.coefficients, x);
          return Number.isFinite(value) ? value : null;
        });

        const legendLabel = getLegendLabel(fit.selectedType, fit.resolvedType);
        chartDatasets.push({
          label: `${meta.label} (${legendLabel})`,
          data: fitData,
          borderColor: baseColor,
          backgroundColor: hexToRgba(baseColor, 0.1),
          pointRadius: 0,
          pointHoverRadius: 0,
          borderWidth: 2,
          tension: 0.2,
          spanGaps: true,
          fill: false,
          hidden: !meta.visible,
          borderDash: [6, 4],
        });

        stats.fit = {
          selectedType: fit.selectedType,
          resolvedType: fit.resolvedType,
          coefficients: fit.coefficients,
          sampleCount: fit.sampleCount,
          equation: fit.equation,
          rSquared: fit.rSquared,
          rmse: fit.rmse,
        };
      }
    });

    const chartData: ChartData<'line'> = {
      labels,
      datasets: chartDatasets,
    };

    const baseLabels = Array.from(baseXValueSet).sort((a, b) => a - b);
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
            baseLabels.length > 1 ? Math.abs(baseLabels[1] - baseLabels[0]) : 0,
        }
      : undefined;

    const stats: PlotStats = {
      mode: 'dataset',
      domain,
      sampleCount: baseLabels.length,
      series: aggregateStats,
    };

    return { chartData, warnings, stats };
  }, [datasetsInput, options]);
};
