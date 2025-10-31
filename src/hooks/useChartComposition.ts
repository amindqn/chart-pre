import { useMemo } from 'react';
import type { ChartData } from 'chart.js';

import type { PlotStats } from '../types/plot';
import { mergeChartData } from '../utils/mergeChartData';

interface PlotResult {
  chartData: ChartData<'line'>;
  warnings: string[];
  stats: PlotStats;
}

interface ChartCompositionArgs {
  functionPlot: PlotResult;
  datasetPlot: PlotResult;
  importError: string | null;
}

export const useChartComposition = ({
  functionPlot,
  datasetPlot,
  importError,
}: ChartCompositionArgs) => {
  const combinedChart = useMemo(
    () => mergeChartData(functionPlot.chartData, datasetPlot.chartData),
    [functionPlot.chartData, datasetPlot.chartData]
  );

  const warnings = useMemo(() => {
    const collected = new Set<string>([
      ...functionPlot.warnings,
      ...datasetPlot.warnings,
    ]);
    if (importError) {
      collected.add(importError);
    }
    return Array.from(collected);
  }, [functionPlot.warnings, datasetPlot.warnings, importError]);

  return {
    combinedChart,
    warnings,
    functionStats: functionPlot.stats,
    datasetStats: datasetPlot.stats,
  };
};
