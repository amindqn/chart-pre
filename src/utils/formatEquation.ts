const SUPERSCRIPTS: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
};

const toSuperscript = (value: string) =>
  value
    .split('')
    .map((char) => SUPERSCRIPTS[char] ?? char)
    .join('');

export const formatEquationForDisplay = (expression: string): string => {
  if (!expression.trim()) {
    return 'N/A';
  }

  return expression
    .replace(/Math\./g, '')
    .replace(/\*\*/g, '^')
    .replace(/\^(-?\d+(\.\d+)?)/g, (_, power: string) => toSuperscript(power))
    .replace(/\*/g, '·')
    .replace(/\bpi\b/gi, 'π')
    .replace(/\be\b/g, 'e')
    .replace(/\babs\(/gi, '|')
    .replace(/\)/g, (match, offset, str) =>
      str[offset - 1] === '|' ? '|' : match
    )
    .replace(/\bsqrt\(/gi, '√(')
    .replace(/\blog\b/gi, 'log')
    .replace(/\bln\b/gi, 'ln')
    .replace(/\bsin\b/gi, 'sin')
    .replace(/\bcos\b/gi, 'cos')
    .replace(/\btan\b/gi, 'tan');
};
