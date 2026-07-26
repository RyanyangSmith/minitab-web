import React, { useCallback, useRef, useState } from 'react';
import { useTableStore } from '../../store/tableStore';
import { useSelection } from '../../hooks/useSelection';
import { useClipboard } from '../../hooks/useClipboard';
import { SpreadsheetHeader } from './SpreadsheetHeader';
import { SpreadsheetBody } from './SpreadsheetBody';
import { columnName } from '../../utils/columnName';

const COL_WIDTH = 100;

interface SpreadsheetProps {
  tableId: string;
}

export const Spreadsheet: React.FC<SpreadsheetProps> = ({ tableId }) => {
  const table = useTableStore((s) => s.tables[tableId]);
  const setCellValue = useTableStore((s) => s.setCellValue);
  const setSubHeader = useTableStore((s) => s.setSubHeader);
  const getCellValue = useTableStore((s) => s.getCellValue);
  const addRows = useTableStore((s) => s.addRows);
  const addColumns = useTableStore((s) => s.addColumns);
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

  const { copy, paste } = useClipboard();

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

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          copy(tableId, selection.ranges, table.rows, table.columns);
        }
        if (e.key === 'v' || e.key === 'V') {
          e.preventDefault();
          paste(tableId, active.row, active.col);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (active.row > 2) navigateTo(active.row - 1, active.col);
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (active.row < table.rows - 1) navigateTo(active.row + 1, active.col);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (active.col > 0) navigateTo(active.row, active.col - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (active.col < table.columns - 1) navigateTo(active.row, active.col + 1);
          break;
        case 'Tab':
          e.preventDefault();
          if (active.col < table.columns - 1) {
            navigateTo(active.row, active.col + 1);
          } else if (active.row < table.rows - 1) {
            navigateTo(active.row + 1, 0);
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (active.row < table.rows - 1) navigateTo(active.row + 1, active.col);
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
    [selection, table, copy, paste, navigateTo, handleCellChange, tableId]
  );

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full outline-none bg-white"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Fixed header area */}
      <div className="flex-shrink-0 overflow-hidden border-b border-gray-300">
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

      {/* Scrollable body */}
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
  );
};