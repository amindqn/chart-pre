import { useCallback, useMemo, useState } from 'react';

import './lib/registerChart';
import { ChartDisplay } from './components/chart/ChartDisplay';
import { DatasetControlPanel } from './components/datasets/DatasetControlPanel';
import { FunctionControlPanel } from './components/controls/ControlPanel';
import { DatasetSummary } from './components/info/DatasetSummary';
import { FunctionSummary } from './components/info/FunctionSummary';
import { InstructionsCard } from './components/info/InstructionsCard';
import { WarningsList } from './components/info/WarningsList';
import { ModeToggle } from './components/layout/ModeToggle';
import { useChartComposition } from './hooks/useChartComposition';
import { useChartViewport } from './hooks/useChartViewport';
import { useDatasetManager } from './hooks/useDatasetManager';
import { useDatasetPlot } from './hooks/useDatasetPlot';
import { useFunctionManager } from './hooks/useFunctionManager';
import { useFunctionPlot } from './hooks/useFunctionPlot';
import type { ChartDisplayOptions, DomainSettings, PlotMode } from './types/plot';

const DEFAULT_DOMAIN: DomainSettings = {
  minX: -10,
  maxX: 10,
  step: 0.1,
};

const DEFAULT_CHART_OPTIONS: ChartDisplayOptions = {
  showGrid: true,
  showPoints: true,
  smoothCurve: false,
  showLegend: true,
  fillArea: false,
  maintainAspectRatio: true,
  chartTitle: 'Function plot',
};

function App() {
  const [mode, setMode] = useState<PlotMode>('function');
  const functionManager = useFunctionManager();
  const datasetManager = useDatasetManager();

  const [domain, setDomain] = useState<DomainSettings>(DEFAULT_DOMAIN);
  const [chartOptions, setChartOptions] =
    useState<ChartDisplayOptions>(DEFAULT_CHART_OPTIONS);

  const functionPlot = useFunctionPlot(
    functionManager.functions,
    domain,
    chartOptions
  );
  const datasetPlot = useDatasetPlot(
    datasetManager.datasets,
    chartOptions
  );

  const chartComposition = useChartComposition({
    functionPlot,
    datasetPlot,
    importError: datasetManager.importError,
  });

  const viewportControls = useChartViewport(chartComposition.combinedChart);

  const expressions = useMemo(
    () =>
      functionManager.functions.map((fn) => ({
        id: fn.id,
        expression: fn.expression,
      })),
    [functionManager.functions]
  );

  const handleModeChange = useCallback(
    (value: PlotMode) => {
      setMode(value);
      datasetManager.resetImportFeedback();
    },
    [datasetManager]
  );

  const handleDomainChange = useCallback((patch: Partial<DomainSettings>) => {
    setDomain((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleOptionsChange = useCallback(
    (patch: Partial<ChartDisplayOptions>) => {
      setChartOptions((prev) => ({ ...prev, ...patch }));
    },
    []
  );

  const handleDownloadCsv = useCallback(() => {
    const labels = (chartComposition.combinedChart.labels ?? []) as Array<
      number | string
    >;
    if (!labels.length) {
      return;
    }

    const headers = [
      'x',
      ...chartComposition.combinedChart.datasets.map(
        (dataset) => dataset.label ?? 'Series'
      ),
    ];
    const rows = [headers.join(',')];

    labels.forEach((label, rowIndex) => {
      const row = [String(label)];
      chartComposition.combinedChart.datasets.forEach((dataset) => {
        const dataArray = Array.isArray(dataset.data)
          ? (dataset.data as Array<number | null>)
          : [];
        const value = dataArray[rowIndex];
        row.push(
          value === null || value === undefined ? '' : Number(value).toString()
        );
      });
      rows.push(row.join(','));
    });

    const blob = new Blob([rows.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.setAttribute('download', 'chart-data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  }, [chartComposition.combinedChart]);

  return (
    <div className="min-h-screen pb-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
              Function & dataset grapher
            </h1>
            <p className="text-sm text-slate-600">
              Plot analytic formulas alongside imported data on a single interactive chart.
            </p>
          </div>
          <ModeToggle mode={mode} onModeChange={handleModeChange} />
        </header>

        <div className="grid gap-8 xl:grid-cols-[2fr,1fr]">
          <main className="space-y-6">
            <ChartDisplay
              chartData={chartComposition.combinedChart}
              options={chartOptions}
              viewport={viewportControls.viewport}
              onDownloadCsv={handleDownloadCsv}
              onZoomIn={viewportControls.zoomIn}
              onZoomOut={viewportControls.zoomOut}
              onPanLeft={viewportControls.panLeft}
              onPanRight={viewportControls.panRight}
              onResetView={viewportControls.reset}
            />

            {datasetManager.importFeedback && (
              <div className="flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <span>{datasetManager.importFeedback}</span>
                <button
                  type="button"
                  onClick={datasetManager.resetImportFeedback}
                  className="text-xs font-semibold uppercase tracking-wide text-emerald-700/80 hover:text-emerald-900"
                >
                  Dismiss
                </button>
              </div>
            )}

            <WarningsList warnings={chartComposition.warnings} />

            <div className="grid gap-5 lg:grid-cols-2">
              <FunctionSummary
                stats={chartComposition.functionStats}
                expressions={expressions}
              />
              <DatasetSummary stats={chartComposition.datasetStats} />
            </div>
          </main>

          <aside className="space-y-6">
            <FunctionControlPanel
              functions={functionManager.functions}
              activeFunctionId={functionManager.activeFunctionId}
              onActiveFunctionChange={functionManager.setActiveFunctionId}
              onFunctionChange={functionManager.updateFunction}
              onFunctionRemove={functionManager.removeFunction}
              onAddFunction={functionManager.addFunction}
              domain={domain}
              options={chartOptions}
              onDomainChange={handleDomainChange}
              onOptionsChange={handleOptionsChange}
            />

            <DatasetControlPanel
              datasets={datasetManager.datasets}
              activeSeriesId={datasetManager.activeSeriesId}
              onActiveSeriesChange={datasetManager.setActiveSeriesId}
              onSeriesChange={datasetManager.updateSeries}
              onSeriesRemove={datasetManager.removeSeries}
              onAddSeries={datasetManager.addSeries}
              onPointChange={datasetManager.updatePoint}
              onRemovePoint={datasetManager.removePoint}
              onAddPoint={datasetManager.addPoint}
              onImportPoints={datasetManager.importFromFile}
              onClearPoints={datasetManager.clearPoints}
            />

            <InstructionsCard />
          </aside>
        </div>
      </div>
    </div>
  );
}

export default App;
