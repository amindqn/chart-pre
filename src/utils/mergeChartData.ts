import type { ChartData, ChartDataset } from 'chart.js';

const normaliseLabel = (label: unknown): number | null => {
  if (typeof label === 'number') {
    return Number.isFinite(label) ? Number(label) : null;
  }
  const parsed = Number.parseFloat(String(label));
  return Number.isFinite(parsed) ? parsed : null;
};

const cloneDataset = <TType extends 'line'>(
  dataset: ChartDataset<TType>,
  labels: Array<number>
): ChartDataset<TType> => {
  return {
    ...dataset,
    data: labels.map(() => null),
  } as ChartDataset<TType>;
};

const mapDatasetValues = <TType extends 'line'>(
  dataset: ChartDataset<TType>,
  labels?: Array<number | string>
) => {
  const valueMap = new Map<number, number | null>();
  if (!Array.isArray(dataset.data)) {
    return valueMap;
  }

  labels?.forEach((label, index) => {
    const key = normaliseLabel(label);
    if (key === null) {
      return;
    }
    const value = dataset.data[index];
    if (typeof value === 'number') {
      valueMap.set(key, value);
    } else if (value === null) {
      valueMap.set(key, null);
    }
  });

  return valueMap;
};

export const mergeChartData = (
  primary: ChartData<'line'>,
  secondary: ChartData<'line'>
): ChartData<'line'> => {
  const labelSet = new Set<number>();
  const addLabels = (labels: Array<number | string> | undefined) => {
    labels?.forEach((label) => {
      const value = normaliseLabel(label);
      if (value !== null) {
        labelSet.add(Number.parseFloat(value.toFixed(6)));
      }
    });
  };

  addLabels(primary.labels as Array<number | string> | undefined);
  addLabels(secondary.labels as Array<number | string> | undefined);

  const labels = Array.from(labelSet).sort((a, b) => a - b);

  const buildDatasets = (
    chartData: ChartData<'line'>
  ): ChartDataset<'line'>[] => {
    return chartData.datasets.map((dataset) => {
      const valueMap = mapDatasetValues(dataset, chartData.labels as Array<number | string> | undefined);
      const cloned = cloneDataset(dataset, labels);
      cloned.data = labels.map((label) =>
        valueMap.has(label) ? valueMap.get(label) ?? null : null
      );
      return cloned;
    });
  };

  const mergedDatasets = [
    ...buildDatasets(primary),
    ...buildDatasets(secondary),
  ];

  return {
    labels,
    datasets: mergedDatasets,
  };
};
