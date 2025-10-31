import { useCallback, useMemo, useRef, useState } from 'react';

import type { DataPoint, DataSeries } from '../types/plot';
import { getNextColor } from '../utils/colors';
import { parseDataFile } from '../utils/dataImport';
import { createPointId, createSeriesId } from '../utils/id';
import { createSeedPoints } from '../utils/seedData';

const initDatasets = (): DataSeries[] => [
  {
    id: createSeriesId(),
    label: 'Series 1',
    color: getNextColor(),
    visible: true,
    points: createSeedPoints(0),
  },
];

export const useDatasetManager = () => {
  const seedRef = useRef<DataSeries[] | null>(null);
  if (!seedRef.current) {
    seedRef.current = initDatasets();
  }

  const [datasets, setDatasets] = useState<DataSeries[]>(
    () => seedRef.current as DataSeries[]
  );
  const [activeSeriesId, setActiveSeriesId] = useState<string>(
    () => datasets[0]?.id ?? createSeriesId()
  );
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const updateSeries = useCallback(
    (id: string, patch: Partial<DataSeries>) => {
      setDatasets((prev) =>
        prev.map((series) => (series.id === id ? { ...series, ...patch } : series))
      );
    },
    []
  );

  const removeSeries = useCallback(
    (id: string) => {
      setDatasets((prev) => {
        if (prev.length === 0) {
          return prev;
        }
        const next = prev.filter((series) => series.id !== id);
        if (!next.length) {
          return next;
        }
        if (!next.some((series) => series.id === activeSeriesId)) {
          setActiveSeriesId(next[0].id);
        }
        return next;
      });
    },
    [activeSeriesId]
  );

  const addSeries = useCallback(() => {
    const nextSeries: DataSeries = {
      id: createSeriesId(),
      label: `Series ${datasets.length + 1}`,
      color: getNextColor(),
      visible: true,
      points: createSeedPoints(datasets.length + 1),
    };
    setDatasets((prev) => [...prev, nextSeries]);
    setActiveSeriesId(nextSeries.id);
  }, [datasets.length]);

  const updatePoint = useCallback(
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

  const addPoint = useCallback((seriesId: string) => {
    setDatasets((prev) =>
      prev.map((series) => {
        if (series.id !== seriesId) {
          return series;
        }
        const lastPoint = series.points[series.points.length - 1];
        const nextX = lastPoint
          ? Number.parseFloat((lastPoint.x + 1).toFixed(2))
          : 0;
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

  const removePoint = useCallback((seriesId: string, pointId: string) => {
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

  const clearPoints = useCallback((seriesId: string) => {
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

  const importFromFile = useCallback(async (seriesId: string, file: File) => {
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
        error instanceof Error
          ? error.message
          : 'Unable to import the selected file.';
      setImportError(message);
      setImportFeedback(null);
    }
  }, []);

  const resetImportFeedback = useCallback(() => {
    setImportFeedback(null);
    setImportError(null);
  }, []);

  return useMemo(
    () => ({
      datasets,
      activeSeriesId,
      setActiveSeriesId,
      updateSeries,
      removeSeries,
      addSeries,
      updatePoint,
      addPoint,
      removePoint,
      clearPoints,
      importFromFile,
      importFeedback,
      importError,
      resetImportFeedback,
    }),
    [
      datasets,
      activeSeriesId,
      updateSeries,
      removeSeries,
      addSeries,
      updatePoint,
      addPoint,
      removePoint,
      clearPoints,
      importFromFile,
      importFeedback,
      importError,
      resetImportFeedback,
    ]
  );
};
