import React, { useCallback, useRef, useState } from 'react';
import { useTableStore } from '../../store/tableStore';
import { useSelection } from '../../hooks/useSelection';
import { cellsToTsv, tsvToCells } from '../../utils/tsv';
import { SpreadsheetHeader } from './SpreadsheetHeader';
import { SpreadsheetBody } from './SpreadsheetBody';
import type { CellValue } from '../../types';

const COL_WIDTH = 100;

interface SpreadsheetProps {
  tableId: string;
}

export const Spreadsheet: React.FC<SpreadsheetProps> = ({ tableId }) => {
  const table = useTableStore((s) => s.tables[tableId]);
  const setCellValue = useTableStore((s) => s.setCellValue);
  const setCellValues = useTableStore((s) => s.setCellValues);
  const setSubHeader = useTableStore((s) => s.setSubHeader);
  const getCellValue = useTableStore((s) => s.getCellValue);
  const ensureSize = useTableStore((s) => s.ensureSize);

  const containerRef = useRef<HTMLDivElement>(null);
  const [autoEditCell, setAutoEditCell] = useState<{ row: number; col: number } | null>(null);

  const {
    selection,
    isDragging,
    startSelection,
    updateDrag,
    endDrag,
    selectColumn,
    isSelected,
  } = useSelection();

  if (!table) {
    return <div className="p-4 text-gray-500">工作表不存在</div>;
  }

  const isColumnSelected = useCallback(
    (col: number): boolean => {
      return selection.ranges.some(
        (r) => r.startCol === col && r.endCol === col && r.startRow === 1 && r.endRow >= table.rows - 1
      );
    },
    [selection.ranges, table.rows]
  );

  const handleMouseDown = useCallback(
    (row: number, col: number, e: React.MouseEvent) => {
      if (e.button !== 0) return;
      setAutoEditCell(null);
      startSelection(row, col, e.ctrlKey || e.metaKey, e.shiftKey);
      containerRef.current?.focus();
    },
    [startSelection]
  );

  const handleMouseEnter = useCallback(
    (row: number, col: number, _e: React.MouseEvent) => {
      if (isDragging.current) {
        updateDrag(row, col);
      }
    },
    [updateDrag]
  );

  const handleMouseUp = useCallback(() => {
    endDrag();
  }, [endDrag]);

  const handleColumnClick = useCallback(
    (col: number) => {
      setAutoEditCell(null);
      selectColumn(col, table.rows);
    },
    [selectColumn, table.rows]
  );

  const handleCellChange = useCallback(
    (row: number, col: number, value: string) => {
      if (row === 1) {
        setSubHeader(tableId, col, value);
      } else {
        const numVal = value === '' ? null : isNaN(Number(value)) ? value : Number(value);
        setCellValue(tableId, row, col, numVal);
      }
    },
    [tableId, setCellValue, setSubHeader]
  );

  // Copy selected range as TSV
  const handleCopy = useCallback(() => {
    if (selection.ranges.length === 0) return;
    const rowSet = new Set<number>();
    for (const r of selection.ranges) {
      for (let row = r.startRow; row <= r.endRow && row < table.rows; row++) {
        rowSet.add(row);
      }
    }
    const sortedRows = [...rowSet].sort((a, b) => a - b);
    const minCol = Math.min(...selection.ranges.map((r) => r.startCol));
    const maxCol = Math.max(...selection.ranges.map((r) => r.endCol));

    const cells: CellValue[][] = sortedRows.map((row) => {
      const rowData: CellValue[] = [];
      for (let c = minCol; c <= maxCol && c < table.columns; c++) {
        const isInRange = selection.ranges.some(
          (r) => row >= r.startRow && row <= r.endRow && c >= r.startCol && c <= r.endCol
        );
        rowData.push(isInRange ? getCellValue(tableId, row, c) : null);
      }
      return rowData;
    });

    const tsv = cellsToTsv(cells);
    navigator.clipboard.writeText(tsv).catch(() => {});
  }, [selection.ranges, table, tableId, getCellValue]);

  // Paste TSV data at active cell
  const handlePaste = useCallback(
    (text: string) => {
      const active = selection.activeCell;
      if (!active) return;
      const data = tsvToCells(text);
      if (data.length === 0) return;

      const updates: { row: number; col: number; value: CellValue }[] = [];
      const targetRow = active.row;
      const targetCol = active.col;

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

      const maxR = targetRow + data.length;
      const maxC = targetCol + Math.max(...data.map((row) => row.length));
      ensureSize(tableId, maxR, maxC);
      setCellValues(tableId, updates);
    },
    [selection.activeCell, tableId, ensureSize, setCellValues]
  );

  // Native paste event handler (works without clipboard permissions)
  const onPasteNative = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      if (text) handlePaste(text);
    },
    [handlePaste]
  );

  // Keyboard navigation - set autoEdit before moving selection
  const navigateTo = useCallback(
    (row: number, col: number) => {
      setAutoEditCell({ row, col });
      startSelection(row, col, false, false);
    },
    [startSelection]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const active = selection.activeCell;
      if (!active) return;

      // Ctrl+C copy
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        handleCopy();
        return;
      }

      // Ctrl+V paste (fallback to native paste event which we handle via onPaste)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
        // Native onPaste event will handle the actual paste
        return;
      }

      // Navigation
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (active.row > 2) navigateTo(active.row - 1, active.col);
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (active.row < table.rows - 1) {
            navigateTo(active.row + 1, active.col);
          } else {
            // Auto-expand: add 5 more rows
            ensureSize(tableId, table.rows + 1, table.columns);
            navigateTo(active.row + 1, active.col);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (active.col > 0) navigateTo(active.row, active.col - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (active.col < table.columns - 1) {
            navigateTo(active.row, active.col + 1);
          } else {
            // Auto-expand: add 5 more columns
            ensureSize(tableId, table.rows, table.columns + 1);
            navigateTo(active.row, active.col + 1);
          }
          break;
        case 'Tab':
          e.preventDefault();
          if (active.col < table.columns - 1) {
            navigateTo(active.row, active.col + 1);
          } else if (active.row < table.rows - 1) {
            navigateTo(active.row + 1, 0);
          } else {
            // At last cell: expand both
            ensureSize(tableId, table.rows + 1, table.columns + 1);
            navigateTo(active.row + 1, 0);
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (active.row < table.rows - 1) {
            navigateTo(active.row + 1, active.col);
          } else {
            ensureSize(tableId, table.rows + 1, table.columns);
            navigateTo(active.row + 1, active.col);
          }
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          for (const range of selection.ranges) {
            for (let r = range.startRow; r <= range.endRow && r < table.rows; r++) {
              for (let c = range.startCol; c <= range.endCol && c < table.columns; c++) {
                if (r === 0) continue;
                handleCellChange(r, c, '');
              }
            }
          }
          break;
      }
    },
    [selection, table, handleCopy, navigateTo, handleCellChange, tableId, ensureSize]
  );

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full outline-none bg-white"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onKeyDown={handleKeyDown}
      onPaste={onPasteNative}
      tabIndex={0}
    >
      {/* Fixed header area - overflow-y:scroll reserves scrollbar space */}
      <div className="flex-shrink-0 overflow-y-scroll overflow-x-hidden border-b border-gray-300" style={{ scrollbarGutter: 'stable' }}>
        <SpreadsheetHeader
          columns={table.columns}
          subHeaders={table.subHeaders}
          isColumnSelected={isColumnSelected}
          onColumnClick={handleColumnClick}
          onSubHeaderChange={(col, val) => setSubHeader(tableId, col, val)}
          activeCell={selection.activeCell}
          colWidth={COL_WIDTH}
        />
      </div>

      {/* Scrollable body - overflow-y:scroll matches header scrollbar */}
      <div className="flex-1 overflow-auto" style={{ scrollbarGutter: 'stable' }}>
        <SpreadsheetBody
          rows={table.rows}
          columns={table.columns}
          getCellValue={(r, c) => getCellValue(tableId, r, c)}
          onCellChange={handleCellChange}
          isSelected={isSelected}
          activeCell={selection.activeCell}
          onMouseDown={handleMouseDown}
          onMouseEnter={handleMouseEnter}
          colWidth={COL_WIDTH}
          autoEditCell={autoEditCell}
        />
      </div>
    </div>
  );
};