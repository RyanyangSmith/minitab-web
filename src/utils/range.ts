import type { CellRange } from '../types';

/**
 * Check if a cell is within a range (data rows only, row >= 2).
 */
export function isInRange(row: number, col: number, range: CellRange): boolean {
  return (
    row >= range.startRow &&
    row <= range.endRow &&
    col >= range.startCol &&
    col <= range.endCol
  );
}

/**
 * Check if a cell is within any of the given ranges.
 */
export function isInAnyRange(
  row: number,
  col: number,
  ranges: CellRange[]
): boolean {
  return ranges.some((r) => isInRange(row, col, r));
}

/**
 * Normalize a range so startRow <= endRow and startCol <= endCol.
 */
export function normalizeRange(range: CellRange): CellRange {
  return {
    startRow: Math.min(range.startRow, range.endRow),
    startCol: Math.min(range.startCol, range.endCol),
    endRow: Math.max(range.startRow, range.endRow),
    endCol: Math.max(range.startCol, range.endCol),
  };
}

/**
 * Get all data rows covered by the cell ranges (row >= 2, the subheader row is 1).
 */
export function getSelectedDataCells(
  ranges: CellRange[],
  cols: number,
  rows: number,
  getCell: (row: number, col: number) => string | number | null
): { row: number; col: number; value: string | number | null }[][] {
  const result: { row: number; col: number; value: string | number | null }[][] = [];
  const seenRows = new Set<number>();

  for (const range of ranges) {
    for (let r = range.startRow; r <= range.endRow; r++) {
      // Skip header and subheader rows
      if (r < 2) continue;
      if (r >= rows) continue;
      if (seenRows.has(r)) continue;
      seenRows.add(r);

      const rowData: { row: number; col: number; value: string | number | null }[] = [];
      for (let c = range.startCol; c <= range.endCol; c++) {
        if (c >= cols) continue;
        rowData.push({ row: r, col: c, value: getCell(r, c) });
      }
      if (rowData.length > 0) {
        result.push(rowData);
      }
    }
  }
  return result;
}
