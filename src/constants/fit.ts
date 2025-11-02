import type { PolynomialFitType, SeriesFitType } from '../types/plot';

export const DEFAULT_FIT_TYPE: SeriesFitType = 'linear';
export const DEFAULT_FIT_SAMPLE_COUNT = 120;

export const FIT_SAMPLE_COUNT_OPTIONS = [50, 100, 200, 400];

export const POLYNOMIAL_FIT_TYPES: PolynomialFitType[] = ['linear', 'quadratic', 'cubic', 'quartic', 'quintic'];
export const FIT_TYPE_ORDER: SeriesFitType[] = [...POLYNOMIAL_FIT_TYPES, 'auto'];

export const POLYNOMIAL_FIT_LABELS: Record<PolynomialFitType, string> = {
  linear: 'Linear fit',
  quadratic: 'Quadratic fit',
  cubic: 'Cubic fit',
  quartic: 'Quartic fit',
  quintic: 'Quintic fit',
};

export const FIT_TYPE_LABELS: Record<SeriesFitType, string> = {
  linear: 'Linear (degree 1)',
  quadratic: 'Quadratic (degree 2)',
  cubic: 'Cubic (degree 3)',
  quartic: 'Quartic (degree 4)',
  quintic: 'Quintic (degree 5)',
  auto: 'Auto (best polynomial)',
};
