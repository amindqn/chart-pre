import type { SeriesFitType } from '../types/plot';

export interface PolynomialFitResult {
  coefficients: number[];
  degree: number;
}

const EPSILON = 1e-12;

const degreeByFitType: Record<SeriesFitType, number> = {
  linear: 1,
  quadratic: 2,
  cubic: 3,
};

export const getPolynomialDegree = (fitType: SeriesFitType): number =>
  degreeByFitType[fitType];

export const evaluatePolynomial = (coefficients: number[], x: number): number => {
  // Horner's method for numerical stability
  let result = 0;
  for (let index = coefficients.length - 1; index >= 0; index -= 1) {
    result = result * x + coefficients[index];
  }
  return result;
};

const swapRows = (matrix: number[][], rowA: number, rowB: number) => {
  const temp = matrix[rowA];
  matrix[rowA] = matrix[rowB];
  matrix[rowB] = temp;
};

export const polynomialRegression = (
  points: Array<{ x: number; y: number }>,
  degree: number
): PolynomialFitResult => {
  if (degree < 1) {
    throw new Error('Polynomial degree must be at least 1.');
  }

  const requiredPoints = degree + 1;
  if (points.length < requiredPoints) {
    throw new Error(`At least ${requiredPoints} data points are required for a degree ${degree} fit.`);
  }

  const augmentedSize = degree + 1;
  const system: number[][] = Array.from({ length: augmentedSize }, () =>
    new Array(augmentedSize + 1).fill(0)
  );

  const sums: number[] = new Array(degree * 2 + 1).fill(0);
  const sumY: number[] = new Array(augmentedSize).fill(0);

  points.forEach(({ x, y }) => {
    let xPow = 1;
    for (let power = 0; power <= degree * 2; power += 1) {
      sums[power] += xPow;
      xPow *= x;
    }

    xPow = 1;
    for (let row = 0; row < augmentedSize; row += 1) {
      sumY[row] += y * xPow;
      xPow *= x;
    }
  });

  for (let row = 0; row < augmentedSize; row += 1) {
    for (let col = 0; col < augmentedSize; col += 1) {
      system[row][col] = sums[row + col];
    }
    system[row][augmentedSize] = sumY[row];
  }

  for (let pivotIndex = 0; pivotIndex < augmentedSize; pivotIndex += 1) {
    let maxRow = pivotIndex;
    let maxValue = Math.abs(system[pivotIndex][pivotIndex]);

    for (let row = pivotIndex + 1; row < augmentedSize; row += 1) {
      const candidate = Math.abs(system[row][pivotIndex]);
      if (candidate > maxValue) {
        maxValue = candidate;
        maxRow = row;
      }
    }

    if (maxValue <= EPSILON) {
      throw new Error('Unable to compute a stable polynomial fit for the provided points.');
    }

    if (maxRow !== pivotIndex) {
      swapRows(system, pivotIndex, maxRow);
    }

    const pivotValue = system[pivotIndex][pivotIndex];
    for (let column = pivotIndex; column <= augmentedSize; column += 1) {
      system[pivotIndex][column] /= pivotValue;
    }

    for (let row = 0; row < augmentedSize; row += 1) {
      if (row === pivotIndex) {
        continue;
      }
      const factor = system[row][pivotIndex];
      if (Math.abs(factor) <= EPSILON) {
        continue;
      }
      for (let column = pivotIndex; column <= augmentedSize; column += 1) {
        system[row][column] -= factor * system[pivotIndex][column];
      }
    }
  }

  const coefficients = new Array(augmentedSize).fill(0);
  for (let row = 0; row < augmentedSize; row += 1) {
    coefficients[row] = system[row][augmentedSize];
  }

  return {
    coefficients,
    degree,
  };
};
