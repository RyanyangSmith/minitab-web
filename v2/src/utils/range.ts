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
