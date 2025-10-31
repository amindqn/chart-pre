const ALLOWED_IDENTIFIERS = new Set([
  'x',
  'pi',
  'e',
  'sin',
  'cos',
  'tan',
  'asin',
  'acos',
  'atan',
  'sinh',
  'cosh',
  'tanh',
  'asinh',
  'acosh',
  'atanh',
  'exp',
  'log',
  'ln',
  'sqrt',
  'cbrt',
  'abs',
  'ceil',
  'floor',
  'round',
  'sign',
  'min',
  'max',
  'pow',
  'mod',
  'log10',
  'log2',
]);

type CompiledExpression = (x: number) => number;

const cache = new Map<string, CompiledExpression>();

const normalizeExpression = (expression: string) =>
  expression.replace(/\s+/g, ' ').trim();

const sanitizeExpression = (expression: string): string => {
  if (!expression) {
    return expression;
  }

  const invalidCharMatch = expression.match(/[^0-9a-z+\-*/^%().,\s]/);
  if (invalidCharMatch) {
    throw new Error(`Unsupported character "${invalidCharMatch[0]}" detected.`);
  }

  const identifiers = expression.match(/\b[a-z_]\w*\b/g) ?? [];
  for (const identifier of identifiers) {
    if (!ALLOWED_IDENTIFIERS.has(identifier)) {
      throw new Error(`Identifier "${identifier}" is not supported.`);
    }
  }

  return expression;
};

const prepareExpression = (expression: string): string => {
  const replacements: Array<[RegExp, string]> = [
    [/\^/g, '**'],
    [/\bpi\b/g, 'PI'],
    [/\be\b/g, 'E'],
    [/\bmod\b/g, '%'],
    [/\blog\b/g, 'logBase'],
    [/\bln\b/g, 'ln'],
  ];

  let transformed = expression;
  for (const [pattern, target] of replacements) {
    transformed = transformed.replace(pattern, target);
  }

  return transformed;
};

const compileExpression = (expression: string): CompiledExpression => {
  const canonical = normalizeExpression(expression).toLowerCase();
  const sanitized = sanitizeExpression(canonical);
  const transformed = prepareExpression(sanitized);

  const body = `"use strict";
const {
  abs,
  sin,
  cos,
  tan,
  asin,
  acos,
  atan,
  sinh,
  cosh,
  tanh,
  asinh,
  acosh,
  atanh,
  exp,
  sqrt,
  cbrt,
  floor,
  ceil,
  round,
  sign,
  pow,
  max,
  min,
  log: lnInternal,
  log10,
  log2
} = Math;
const ln = lnInternal;
const PI = Math.PI;
const E = Math.E;
const logBase = (value, base = 10) => {
  if (base === 10) {
    if (typeof log10 === "function") {
      return log10(value);
    }
    return lnInternal(value) / Math.LN10;
  }
  if (base === Math.E) {
    return lnInternal(value);
  }
  return lnInternal(value) / lnInternal(base);
};

const result = (${transformed});
return Number.isFinite(result) ? result : NaN;`;

  const compiled = new Function('x', body) as CompiledExpression;
  return compiled;
};

export const evaluateExpression = (
  expression: string,
  x: number
): number | null => {
  if (!Number.isFinite(x)) {
    return null;
  }

  const canonical = normalizeExpression(expression).toLowerCase();
  if (!canonical) {
    return null;
  }

  let compiled = cache.get(canonical);
  if (!compiled) {
    try {
      compiled = compileExpression(expression);
      cache.set(canonical, compiled);
    } catch {
      cache.set(canonical, () => NaN);
      return null;
    }
  }

  try {
    const value = compiled(x);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
};
