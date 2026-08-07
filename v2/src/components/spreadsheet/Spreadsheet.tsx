import React, { useCallback, useRef, useState } from 'react';
import { useTableStore } from '../../store/tableStore';
import { useSelection } from '../../hooks/useSelection';
import { cellsToTsv, splitTsvBlocks, tsvToCells } from '../../utils/tsv';
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
  const undo = useTableStore((s) => s.undo);
  const redo = useTableStore((s) => s.redo);

  const containerRef = useRef<HTMLDivElement>(null);
  const headerScrollRef = useRef<HTMLDivElement>(null);
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

  const rowCount = table?.rows ?? 0;
  const colCount = table?.columns ?? 0;

  // Stable per-table cell reader so memoized cells can skip re-renders.
  const getCell = useCallback(
    (row: number, col: number) => getCellValue(tableId, row, col),
    [tableId, getCellValue]
  );

  const handleSubHeaderChange = useCallback(
    (col: number, value: string) => setSubHeader(tableId, col, value),
    [tableId, setSubHeader]
  );

  const isColumnSelected = useCallback(
    (col: number): boolean => {
      return selection.ranges.some(
        (r) => r.startCol === col && r.endCol === col && r.startRow === 1 && r.endRow >= rowCount - 1
      );
    },
    [selection.ranges, rowCount]
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
    (row: number, col: number) => {
      if (isDragging.current) {
        updateDrag(row, col);
      }
    },
    [updateDrag, isDragging]
  );

  const handleMouseUp = useCallback(() => {
    endDrag();
  }, [endDrag]);

  const handleColumnClick = useCallback(
    (col: number) => {
      setAutoEditCell(null);
      selectColumn(col, rowCount);
    },
    [selectColumn, rowCount]
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
    const blocks = selection.ranges.map((range) => {
      const rows: CellValue[][] = [];
      for (
        let row = range.startRow;
        row <= range.endRow && row < rowCount;
        row++
      ) {
        const rowData: CellValue[] = [];
        for (
          let col = range.startCol;
          col <= range.endCol && col < colCount;
          col++
        ) {
          rowData.push(getCell(row, col));
        }
        rows.push(rowData);
      }
      return cellsToTsv(rows);
    });
    const tsv = blocks.join('\n\n');
    navigator.clipboard.writeText(tsv).catch(() => {});
  }, [selection.ranges, rowCount, colCount, getCell]);

  // Paste TSV data at active cell
  const handlePaste = useCallback(
    (text: string) => {
      const active = selection.activeCell;
      if (!active) return;
      const blocks = splitTsvBlocks(text);
      if (blocks.length === 0) return;

      const updates: { row: number; col: number; value: CellValue }[] = [];
      let cursorRow = active.row;
      const targetCol = active.col;
      let lastRow = active.row;
      let lastCol = active.col;
      let maxC = targetCol;

      for (const block of blocks) {
        const data = tsvToCells(block.join('\n'));
        for (let r = 0; r < data.length; r++) {
          for (let c = 0; c < data[r].length; c++) {
            const val = data[r][c];
            const row = cursorRow + r;
            const col = targetCol + c;
            updates.push({
              row,
              col,
              value: val === '' ? null : isNaN(Number(val)) ? val : Number(val),
            });
            lastRow = row;
            lastCol = col;
          }
        }
        maxC = Math.max(
          maxC,
          targetCol + Math.max(...data.map((row) => row.length))
        );
        cursorRow += data.length + 1;
      }

      const maxR = cursorRow - 1;
      ensureSize(tableId, maxR, maxC);
      setCellValues(tableId, updates);
      startSelection(lastRow, lastCol, false, false);
      setAutoEditCell(null);
    },
    [selection.activeCell, tableId, ensureSize, setCellValues, startSelection]
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

      // Undo / redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        redo();
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
          if (active.row < rowCount - 1) {
            navigateTo(active.row + 1, active.col);
          } else {
            // Auto-expand: add 5 more rows
            ensureSize(tableId, rowCount + 1, colCount);
            navigateTo(active.row + 1, active.col);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (active.col > 0) navigateTo(active.row, active.col - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (active.col < colCount - 1) {
            navigateTo(active.row, active.col + 1);
          } else {
            // Auto-expand: add 5 more columns
            ensureSize(tableId, rowCount, colCount + 1);
            navigateTo(active.row, active.col + 1);
          }
          break;
        case 'Tab':
          e.preventDefault();
          if (active.col < colCount - 1) {
            navigateTo(active.row, active.col + 1);
          } else if (active.row < rowCount - 1) {
            navigateTo(active.row + 1, 0);
          } else {
            // At last cell: expand both
            ensureSize(tableId, rowCount + 1, colCount + 1);
            navigateTo(active.row + 1, 0);
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (active.row < rowCount - 1) {
            navigateTo(active.row + 1, active.col);
          } else {
            ensureSize(tableId, rowCount + 1, colCount);
            navigateTo(active.row + 1, active.col);
          }
          break;
        case 'Delete':
        case 'Backspace': {
          e.preventDefault();
          const updates: { row: number; col: number; value: CellValue }[] = [];
          const subHeaderCols = new Set<number>();
          for (const range of selection.ranges) {
            for (let r = range.startRow; r <= range.endRow && r < rowCount; r++) {
              for (let c = range.startCol; c <= range.endCol && c < colCount; c++) {
                if (r === 0) continue;
                if (r === 1) {
                  subHeaderCols.add(c);
                } else {
                  updates.push({ row: r, col: c, value: null });
                }
              }
            }
          }
          if (updates.length > 0) setCellValues(tableId, updates);
          for (const c of subHeaderCols) setSubHeader(tableId, c, '');
          break;
        }
      }
    },
    [selection, rowCount, colCount, handleCopy, navigateTo, tableId, ensureSize, setCellValues, setSubHeader, undo, redo]
  );

  const syncHeaderScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  }, []);

  if (!table) {
    return <div className="p-4 text-gray-500">工作表不存在</div>;
  }

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
      <div ref={headerScrollRef} className="flex-shrink-0 overflow-y-scroll overflow-x-hidden border-b border-gray-300" style={{ scrollbarGutter: 'stable' }}>
        <SpreadsheetHeader
          columns={colCount}
          subHeaders={table.subHeaders}
          isColumnSelected={isColumnSelected}
          onColumnClick={handleColumnClick}
          onSubHeaderChange={handleSubHeaderChange}
          activeCell={selection.activeCell}
          colWidth={COL_WIDTH}
        />
      </div>

      {/* Scrollable body - single scroll container; header is synced via onScroll */}
      <div className="flex-1 min-h-0 overflow-hidden flex">
        <SpreadsheetBody
          rows={rowCount}
          columns={colCount}
          getCellValue={getCell}
          onCellChange={handleCellChange}
          isSelected={isSelected}
          activeCell={selection.activeCell}
          onMouseDown={handleMouseDown}
          onMouseEnter={handleMouseEnter}
          onScroll={syncHeaderScroll}
          colWidth={COL_WIDTH}
          autoEditCell={autoEditCell}
        />
      </div>
    </div>
  );
};
