import { useCallback, useMemo, useState } from 'react';

import './lib/registerChart';
import { ChartDisplay } from './components/chart/ChartDisplay';
import { FunctionControlPanel } from './components/controls/ControlPanel';
import { DatasetControlPanel } from './components/datasets/DatasetControlPanel';
import { DatasetSummary } from './components/info/DatasetSummary';
import { FunctionSummary } from './components/info/FunctionSummary';
import { InstructionsCard } from './components/info/InstructionsCard';
import { WarningsList } from './components/info/WarningsList';
import { ModeToggle } from './components/layout/ModeToggle';
import { DEFAULT_FUNCTION } from './constants/presets';
import { useDatasetPlot } from './hooks/useDatasetPlot';
import { useFunctionPlot } from './hooks/useFunctionPlot';
import type {
  ChartDisplayOptions,
  DataPoint,
  DataSeries,
  DomainSettings,
  GraphedFunction,
  PlotMode,
} from './types/plot';
import { getNextColor, resetColorCycle } from './utils/colors';
import { createPointId, parseDataFile } from './utils/dataImport';
import { mergeChartData } from './utils/mergeChartData';

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

const createFunctionId = () =>
  `func-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;

const createSeriesId = () =>
  `series-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;

const createSeedPoints = (seed: number): DataPoint[] => {
  const offsets = [-2, -1, 0, 1, 2];
  return offsets.map((x) => {
    const y = Number.parseFloat(((seed + 1) * x + x * x).toFixed(2));
    return {
      id: createPointId(),
      x,
      y,
    };
  });
};

function App() {
  const [mode, setMode] = useState<PlotMode>('function');
  const [functions, setFunctions] = useState<GraphedFunction[]>(() => {
    resetColorCycle();
    return [
      {
        ...DEFAULT_FUNCTION,
        id: createFunctionId(),
        color: getNextColor(),
      },
    ];
  });

  const [datasets, setDatasets] = useState<DataSeries[]>(() => [
    {
      id: createSeriesId(),
      label: 'Series 1',
      color: getNextColor(),
      visible: true,
      points: createSeedPoints(0),
    },
  ]);

  const [activeFunctionId, setActiveFunctionId] = useState<string>(
    () => functions[0]?.id ?? createFunctionId()
  );
  const [activeSeriesId, setActiveSeriesId] = useState<string>(
    () => datasets[0]?.id ?? createSeriesId()
  );

  const [domain, setDomain] = useState<DomainSettings>(DEFAULT_DOMAIN);
  const [chartOptions, setChartOptions] =
    useState<ChartDisplayOptions>(DEFAULT_CHART_OPTIONS);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const functionPlot = useFunctionPlot(functions, domain, chartOptions);
  const datasetPlot = useDatasetPlot(datasets, chartOptions);
  const combinedChart = useMemo(
    () => mergeChartData(functionPlot.chartData, datasetPlot.chartData),
    [functionPlot.chartData, datasetPlot.chartData]
  );

  const warnings = useMemo(() => {
    const collected = new Set<string>([...functionPlot.warnings, ...datasetPlot.warnings]);
    if (importError) {
      collected.add(importError);
    }
    return Array.from(collected);
  }, [functionPlot.warnings, datasetPlot.warnings, importError]);

  const handleModeChange = useCallback((nextMode: PlotMode) => {
    setMode(nextMode);
    setImportFeedback(null);
    setImportError(null);
  }, []);

  const handleFunctionChange = useCallback(
    (id: string, patch: Partial<GraphedFunction>) => {
      setFunctions((prev) =>
        prev.map((fn) => (fn.id === id ? { ...fn, ...patch } : fn))
      );
    },
    []
  );

  const handleFunctionRemove = useCallback(
    (id: string) => {
      setFunctions((prev) => {
        if (prev.length === 0) {
          return prev;
        }

        const updated = prev.filter((fn) => fn.id !== id);
        if (!updated.length) {
          return updated;
        }

        if (!updated.some((fn) => fn.id === activeFunctionId)) {
          setActiveFunctionId(updated[0].id);
        }
        return updated;
      });
    },
    [activeFunctionId]
  );

  const handleAddFunction = useCallback(() => {
    setFunctions((prev) => {
      const nextIndex = prev.length + 1;
      const newFn: GraphedFunction = {
        id: createFunctionId(),
        label: `f${nextIndex}(x)`,
        expression: '',
        color: getNextColor(),
        visible: true,
      };
      setActiveFunctionId(newFn.id);
      return [...prev, newFn];
    });
  }, []);

  const handleDomainChange = useCallback((patch: Partial<DomainSettings>) => {
    setDomain((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleOptionsChange = useCallback(
    (patch: Partial<ChartDisplayOptions>) => {
      setChartOptions((prev) => ({ ...prev, ...patch }));
    },
    []
  );

  const handleSeriesChange = useCallback(
    (id: string, patch: Partial<DataSeries>) => {
      setDatasets((prev) =>
        prev.map((series) =>
          series.id === id
            ? {
                ...series,
                ...patch,
              }
            : series
        )
      );
    },
    []
  );

  const handleSeriesRemove = useCallback(
    (id: string) => {
      setDatasets((prev) => {
        if (prev.length === 0) {
          return prev;
        }

        const updated = prev.filter((series) => series.id !== id);
        if (!updated.length) {
          return updated;
        }

        if (!updated.some((series) => series.id === activeSeriesId)) {
          setActiveSeriesId(updated[0].id);
        }
        return updated;
      });
    },
    [activeSeriesId]
  );

  const handleAddSeries = useCallback(() => {
    setDatasets((prev) => {
      const newSeries: DataSeries = {
        id: createSeriesId(),
        label: `Series ${prev.length + 1}`,
        color: getNextColor(),
        visible: true,
        points: createSeedPoints(prev.length + 1),
      };
      setActiveSeriesId(newSeries.id);
      return [...prev, newSeries];
    });
  }, []);

  const handlePointChange = useCallback(
    (seriesId: string, pointId: string, patch: Partial<DataPoint>) => {
      setDatasets((prev) =>
        prev.map((series) =>
          series.id === seriesId
            ? {
                ...series,
                points: series.points.map((point) =>
                  point.id === pointId ? { ...point, ...patch } : point
                ),
              }
            : series
        )
      );
    },
    []
  );

  const handleAddPoint = useCallback((seriesId: string) => {
    setDatasets((prev) =>
      prev.map((series) => {
        if (series.id !== seriesId) {
          return series;
        }
        const lastPoint = series.points[series.points.length - 1];
        const nextX = lastPoint ? Number.parseFloat((lastPoint.x + 1).toFixed(2)) : 0;
        return {
          ...series,
          points: [
            ...series.points,
            {
              id: createPointId(),
              x: nextX,
              y: 0,
            },
          ],
        };
      })
    );
  }, []);

  const handleRemovePoint = useCallback((seriesId: string, pointId: string) => {
    setDatasets((prev) =>
      prev.map((series) =>
        series.id === seriesId
          ? {
              ...series,
              points: series.points.filter((point) => point.id !== pointId),
            }
          : series
      )
    );
  }, []);

  const handleClearPoints = useCallback((seriesId: string) => {
    setDatasets((prev) =>
      prev.map((series) =>
        series.id === seriesId
          ? {
              ...series,
              points: [
                { id: createPointId(), x: 0, y: 0 },
                { id: createPointId(), x: 1, y: 1 },
              ],
            }
          : series
      )
    );
  }, []);

  const handleImportPoints = useCallback(async (seriesId: string, file: File) => {
    try {
      const parsed = await parseDataFile(file);
      if (!parsed.length) {
        throw new Error('No numeric data points were detected in the file.');
      }

      setDatasets((prev) =>
        prev.map((series) =>
          series.id === seriesId
            ? {
                ...series,
                points: parsed.map((point) => ({
                  id: createPointId(),
                  x: point.x,
                  y: point.y,
                })),
              }
            : series
        )
      );
      setImportFeedback(`Imported ${parsed.length} points from “${file.name}”.`);
      setImportError(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to import the selected file.';
      setImportError(message);
      setImportFeedback(null);
    }
  }, []);

  const handleDownloadCsv = useCallback(() => {
    const labels = (combinedChart.labels ?? []) as Array<number | string>;
    if (!labels.length) {
      return;
    }

    const headers = [
      'x',
      ...combinedChart.datasets.map((dataset) => dataset.label ?? 'Series'),
    ];
    const rows = [headers.join(',')];

    labels.forEach((label, rowIndex) => {
      const row = [String(label)];
      combinedChart.datasets.forEach((dataset) => {
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
    link.setAttribute('download', `${mode}-plot-data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  }, [combinedChart, mode]);

  const expressions = useMemo(
    () => functions.map((fn) => ({ id: fn.id, expression: fn.expression })),
    [functions]
  );

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
              chartData={combinedChart}
              options={chartOptions}
              onDownloadCsv={handleDownloadCsv}
            />

            {mode === 'dataset' && importFeedback && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {importFeedback}
              </div>
            )}

            <WarningsList warnings={warnings} />

            <div className="grid gap-5 lg:grid-cols-2">
              <FunctionSummary stats={functionPlot.stats} expressions={expressions} />
              <DatasetSummary stats={datasetPlot.stats} />
            </div>
          </main>

          <aside className="space-y-6">
            <FunctionControlPanel
              functions={functions}
              activeFunctionId={activeFunctionId}
              onActiveFunctionChange={setActiveFunctionId}
              onFunctionChange={handleFunctionChange}
              onFunctionRemove={handleFunctionRemove}
              onAddFunction={handleAddFunction}
              domain={domain}
              onDomainChange={handleDomainChange}
              options={chartOptions}
              onOptionsChange={handleOptionsChange}
            />

            <DatasetControlPanel
              datasets={datasets}
              activeSeriesId={activeSeriesId}
              onActiveSeriesChange={setActiveSeriesId}
              onSeriesChange={handleSeriesChange}
              onSeriesRemove={handleSeriesRemove}
              onAddSeries={handleAddSeries}
              onPointChange={handlePointChange}
              onRemovePoint={handleRemovePoint}
              onAddPoint={handleAddPoint}
              onImportPoints={handleImportPoints}
              onClearPoints={handleClearPoints}
            />

            <InstructionsCard mode={mode} />
          </aside>
        </div>
      </div>
    </div>
  );
}

export default App;
