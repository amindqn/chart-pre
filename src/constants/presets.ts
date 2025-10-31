import type { GraphedFunction } from '../types/plot';

export const PRESET_FUNCTIONS: Array<{ label: string; expression: string }> = [
  { label: 'Quadratic (x^2)', expression: 'x^2' },
  { label: 'Cubic (x^3 - 3x)', expression: 'x^3 - 3*x' },
  { label: 'Linear (2x + 1)', expression: '2*x + 1' },
  { label: 'Sine (sin(x))', expression: 'sin(x)' },
  { label: 'Cosine (cos(x))', expression: 'cos(x)' },
  { label: 'Tangent (tan(x))', expression: 'tan(x)' },
  { label: 'Exponential (e^x)', expression: 'e^x' },
  { label: 'Logarithm (log(x))', expression: 'log(x)' },
  { label: 'Natural Log (ln(x))', expression: 'ln(x)' },
  { label: 'Square Root (sqrt(x))', expression: 'sqrt(x)' },
  { label: 'Absolute Value (abs(x))', expression: 'abs(x)' },
  { label: 'Gaussian (e^(-x^2))', expression: 'e^(-x^2)' },
  { label: 'Sinc (sin(x)/x)', expression: 'sin(x)/x' },
];

export const DEFAULT_FUNCTION = {
  id: 'func-1',
  label: 'f1(x)',
  expression: 'x^2',
  color: '#2563eb',
  visible: true,
} satisfies GraphedFunction;
