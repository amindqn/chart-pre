import type { DataPoint } from '../types/plot';
import { createPointId } from './id';

export const createSeedPoints = (seed: number): DataPoint[] => {
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
