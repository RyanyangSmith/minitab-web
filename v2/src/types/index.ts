export type CellValue = string | number | null;

export interface TableData {
  id: string;
  name: string;
  columns: number;
  rows: number;
  subHeaders: Record<number, string>;
  cells: Record<string, CellValue>;
}

export type AnalysisType =
  | 'capability-analysis'
  | 'normality-test'
  | 'linear-regression'
  | 'scatter-plot'
  | 'box-plot'
  | 'pareto-chart'
  | 'descriptive-statistics'
  | 'spc-control-chart'
  | 'hypothesis-test'
  | 'gage-rr';

export interface AnalysisResult {
  id: string;
  tableId: string;
  type: AnalysisType;
  name: string;
  config: Record<string, unknown>;
  data: Record<string, unknown>;
}

export interface CellRange {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export interface SelectionState {
  ranges: CellRange[];
  activeCell: { row: number; col: number } | null;
}
