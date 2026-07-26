import { useCallback } from 'react';
import type { CellValue, CellRange } from '../types';
import { useTableStore } from '../store/tableStore';
import { cellsToTsv, tsvToCells } from '../utils/tsv';

export function useClipboard() {
  const setCellValues = useTableStore((s) => s.setCellValues);
  const ensureSize = useTableStore((s) => s.ensureSize);
  const getCellValue = useTableStore((s) => s.getCellValue);

  const copy = useCallback(
    async (tableId: string, ranges: CellRange[], rows: number, cols: number) => {
      // Collect data from ranges
      const rowSet = new Set<number>();
      for (const r of ranges) {
        for (let row = r.startRow; row <= r.endRow && row < rows; row++) {
          rowSet.add(row);
        }
      }
      const sortedRows = [...rowSet].sort((a, b) => a - b);

      const minCol = Math.min(...ranges.map((r) => r.startCol));
      const maxCol = Math.max(...ranges.map((r) => r.endCol));

      const cells: CellValue[][] = sortedRows.map((row) => {
        const rowData: CellValue[] = [];
        for (let c = minCol; c <= maxCol && c < cols; c++) {
          const isInRange = ranges.some(
            (r) => row >= r.startRow && row <= r.endRow && c >= r.startCol && c <= r.endCol
          );
          rowData.push(isInRange ? getCellValue(tableId, row, c) : null);
        }
        return rowData;
      });

      const tsv = cellsToTsv(cells);
      await navigator.clipboard.writeText(tsv);
    },
    [getCellValue]
  );

  const paste = useCallback(
    async (tableId: string, targetRow: number, targetCol: number) => {
      try {
        const text = await navigator.clipboard.readText();
        const data = tsvToCells(text);
        if (data.length === 0) return;

        const updates: { row: number; col: number; value: CellValue }[] = [];

        for (let r = 0; r < data.length; r++) {
          for (let c = 0; c < data[r].length; c++) {
            const val = data[r][c];
            updates.push({
              row: targetRow + r,
              col: targetCol + c,
              value: val === '' ? null : isNaN(Number(val)) ? val : Number(val),
            });
          }
        }

        // Ensure the table is large enough
        const maxR = targetRow + data.length;
        const maxC = targetCol + Math.max(...data.map((r) => r.length));
        ensureSize(tableId, maxR, maxC);

        setCellValues(tableId, updates);
      } catch {
        // Clipboard read failed (permission or empty)
      }
    },
    [setCellValues, ensureSize]
  );

  return { copy, paste };
}
