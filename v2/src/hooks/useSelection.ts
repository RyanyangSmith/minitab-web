import { useState, useCallback, useRef } from 'react';
import type { SelectionState } from '../types';
import { normalizeRange } from '../utils/range';

export function useSelection() {
  const [selection, setSelection] = useState<SelectionState>({
    ranges: [],
    activeCell: null,
  });
  const isDragging = useRef(false);
  const dragStart = useRef<{ row: number; col: number } | null>(null);

  const startSelection = useCallback((row: number, col: number, ctrlKey: boolean, shiftKey: boolean) => {
    if (ctrlKey || shiftKey) {
      setSelection((prev) => {
        if (ctrlKey) {
          // Add non-contiguous selection
          const newRange = { startRow: row, startCol: col, endRow: row, endCol: col };
          return {
            ranges: [...prev.ranges, newRange],
            activeCell: { row, col },
          };
        } else if (shiftKey && prev.activeCell) {
          // Extend selection
          const lastRange = prev.ranges[prev.ranges.length - 1];
          if (!lastRange) {
            const newRange = {
              startRow: prev.activeCell.row,
              startCol: prev.activeCell.col,
              endRow: row,
              endCol: col,
            };
            return {
              ranges: [normalizeRange(newRange)],
              activeCell: { row, col },
            };
          }
          const newRange = {
            startRow: lastRange.startRow,
            startCol: lastRange.startCol,
            endRow: row,
            endCol: col,
          };
          const ranges = [...prev.ranges];
          ranges[ranges.length - 1] = normalizeRange(newRange);
          return { ranges, activeCell: { row, col } };
        }
        return prev;
      });
    } else {
      setSelection({
        ranges: [{ startRow: row, startCol: col, endRow: row, endCol: col }],
        activeCell: { row, col },
      });
    }
    dragStart.current = { row, col };
    isDragging.current = true;
  }, []);

  const updateDrag = useCallback((row: number, col: number) => {
    if (!isDragging.current || !dragStart.current) return;
    setSelection((prev) => {
      const ranges = [...prev.ranges];
      if (ranges.length === 0) return prev;
      const newRange = {
        startRow: dragStart.current!.row,
        startCol: dragStart.current!.col,
        endRow: row,
        endCol: col,
      };
      ranges[ranges.length - 1] = normalizeRange(newRange);
      return { ...prev, ranges, activeCell: { row, col } };
    });
  }, []);

  const endDrag = useCallback(() => {
    isDragging.current = false;
    dragStart.current = null;
  }, []);

  const selectColumn = useCallback((col: number, rows: number) => {
    setSelection({
      ranges: [{ startRow: 1, startCol: col, endRow: rows - 1, endCol: col }],
      activeCell: { row: 2, col },
    });
  }, []);

  const isSelected = useCallback((row: number, col: number): boolean => {
    return selection.ranges.some(
      (r) =>
        row >= r.startRow &&
        row <= r.endRow &&
        col >= r.startCol &&
        col <= r.endCol
    );
  }, [selection.ranges]);

  return {
    selection,
    isDragging,
    startSelection,
    updateDrag,
    endDrag,
    selectColumn,
    isSelected,
  };
}
