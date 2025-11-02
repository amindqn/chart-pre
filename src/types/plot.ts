export type PlotMode = 'function' | 'dataset';

export interface GraphedFunction {
  id: string;
  label: string;
  expression: string;
  color: string;
  visible: boolean;
}

export interface DomainSettings {
  minX: number;
  maxX: number;
  step: number;
}

export interface ChartDisplayOptions {
  showGrid: boolean;
  showPoints: boolean;
  smoothCurve: boolean;
  showLegend: boolean;
  fillArea: boolean;
  maintainAspectRatio: boolean;
  chartTitle: string;
}

export interface DataPoint {
  id: string;
  x: number;
  y: number;
}

export type SeriesFitType = 'linear' | 'quadratic' | 'cubic' | 'quartic' | 'quintic' | 'auto';
export type PolynomialFitType = Exclude<SeriesFitType, 'auto'>;

export interface SeriesFitConfig {
  type: SeriesFitType;
  sampleCount: number;
}

export interface SeriesFitStats {
  selectedType: SeriesFitType;
  resolvedType: PolynomialFitType;
  coefficients: number[];
  sampleCount: number;
  equation: string;
  rSquared: number | null;
  rmse: number | null;
}

export interface DataSeries {
  id: string;
  label: string;
  color: string;
  visible: boolean;
  points: DataPoint[];
  fit?: SeriesFitConfig;
}

export interface SeriesStats {
  id: string;
  label: string;
  visible: boolean;
  validPoints: number;
  minY: number | null;
  maxY: number | null;
  minX: number | null;
  maxX: number | null;
  areaUnderCurve: number | null;
  fit?: SeriesFitStats;
}

export interface PlotStats {
  mode: PlotMode;
  domain?: DomainSettings;
  sampleCount: number;
  series: SeriesStats[];
}
