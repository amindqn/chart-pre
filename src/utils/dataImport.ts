import type { DataPoint } from '../types/plot';

declare global {
  interface Window {
    XLSX?: any;
  }
}

const SUPPORTED_EXTENSIONS = ['csv', 'tsv', 'txt', 'xlsx', 'xls'];

const detectDelimiter = (line: string): string => {
  if (line.includes(';')) {
    return ';';
  }
  if (line.includes('\t')) {
    return '\t';
  }
  return ',';
};

const sanitizeRows = (rows: string[][]): string[][] => {
  return rows
    .map((row) =>
      row
        .map((cell) => cell.replace(/"/g, '').trim())
        .filter((cell) => cell.length > 0)
    )
    .filter((row) => row.length >= 2);
};

const normalizePoints = (rows: string[][]): Array<Omit<DataPoint, 'id'>> => {
  const cleaned = sanitizeRows(rows);
  const points: Array<Omit<DataPoint, 'id'>> = [];

  cleaned.forEach((row, rowIndex) => {
    const [xRaw, yRaw] = row;
    const x = Number.parseFloat(xRaw);
    const y = Number.parseFloat(yRaw);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      points.push({ x, y });
    } else if (rowIndex === 0) {
      // If the first row looks like a header, skip silently.
      return;
    }
  });

  return points;
};

const parseDelimitedText = (text: string): Array<Omit<DataPoint, 'id'>> => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (!lines.length) {
    return [];
  }

  const delimiter = detectDelimiter(lines[0]);
  const rows = lines.map((line) => line.split(delimiter));
  return normalizePoints(rows);
};

const loadXlsxLibrary = async () => {
  if (window.XLSX) {
    return window.XLSX;
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(
        new Error('Failed to load XLSX parser. Check your internet connection.')
      );
    document.body.appendChild(script);
  });

  if (!window.XLSX) {
    throw new Error('Excel parser is unavailable.');
  }

  return window.XLSX;
};

const parseWorkbook = async (file: File) => {
  const XLSX = await loadXlsxLibrary();
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];
  return normalizePoints(rows);
};

export const parseDataFile = async (file: File): Promise<Array<Omit<DataPoint, 'id'>>> => {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (!extension || !SUPPORTED_EXTENSIONS.includes(extension)) {
    throw new Error('Unsupported file type. Please upload CSV or Excel files.');
  }

  if (extension === 'csv' || extension === 'tsv' || extension === 'txt') {
    const text = await file.text();
    return parseDelimitedText(text);
  }

  return parseWorkbook(file);
};

export const createPointId = () =>
  `point-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;

