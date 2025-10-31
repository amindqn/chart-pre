const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export const calculateAreaUnderCurve = (
  labels: number[],
  values: Array<number | null>
): number | null => {
  if (labels.length !== values.length || labels.length < 2) {
    return null;
  }

  let area = 0;
  let hasSegment = false;

  for (let index = 1; index < labels.length; index += 1) {
    const x0 = labels[index - 1];
    const x1 = labels[index];
    const y0 = values[index - 1];
    const y1 = values[index];

    if (!isFiniteNumber(x0) || !isFiniteNumber(x1)) {
      continue;
    }
    if (y0 === null || y1 === null) {
      continue;
    }
    if (!isFiniteNumber(y0) || !isFiniteNumber(y1)) {
      continue;
    }

    const deltaX = x1 - x0;
    if (!Number.isFinite(deltaX) || Math.abs(deltaX) < Number.EPSILON) {
      continue;
    }

    area += ((y0 + y1) / 2) * deltaX;
    hasSegment = true;
  }

  return hasSegment ? area : null;
};
