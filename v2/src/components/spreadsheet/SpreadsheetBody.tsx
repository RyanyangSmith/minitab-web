import React, { useCallback, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Cell } from './Cell';
import { RowNumberCell } from './RowNumberCell';
import type { CellValue } from '../../types';

const ROW_HEIGHT = 28;
const OVERSCAN = 8;
const ROW_NUM_WIDTH = 40;

interface SpreadsheetBodyProps {
  rows: number;
  columns: number;
  getCellValue: (row: number, col: number) => CellValue;
  onCellChange: (row: number, col: number, value: string) => void;
  isSelected: (row: number, col: number) => boolean;
  activeCell: { row: number; col: number } | null;
  onMouseDown: (row: number, col: number, e: React.MouseEvent) => void;
  onMouseEnter: (row: number, col: number, e: React.MouseEvent) => void;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  colWidth: number;
  autoEditCell: { row: number; col: number } | null;
}

export const SpreadsheetBody: React.FC<SpreadsheetBodyProps> = ({
  rows,
  columns,
  getCellValue,
  onCellChange,
  isSelected,
  activeCell,
  onMouseDown,
  onMouseEnter,
  onScroll,
  colWidth,
  autoEditCell,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dataRows = Math.max(0, rows - 2);

  const rowVirtualizer = useVirtualizer({
    count: dataRows,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  const columnVirtualizer = useVirtualizer({
    count: columns,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => colWidth,
    horizontal: true,
    overscan: 4,
  });

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      onScroll?.(e);
    },
    [onScroll]
  );

  const rowItems = rowVirtualizer.getVirtualItems();
  const columnItems = columnVirtualizer.getVirtualItems();

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-auto"
      onScroll={handleScroll}
    >
      <div
        style={{
          height: rowVirtualizer.getTotalSize(),
          width: ROW_NUM_WIDTH + columnVirtualizer.getTotalSize(),
          position: 'relative',
        }}
      >
        {rowItems.map((virtualRow) => {
          const row = virtualRow.index + 2;
          return (
            <div
              key={virtualRow.key}
              data-row={virtualRow.index}
              className="flex"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: virtualRow.size,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <RowNumberCell row={row} isSelected={false} />
              {columnItems.map((virtualColumn) => {
                const col = virtualColumn.index;
                const cellAutoEdit =
                  autoEditCell?.row === row && autoEditCell?.col === col;
                return (
                  <Cell
                    key={virtualColumn.key}
                    value={getCellValue(row, col)}
                    row={row}
                    col={col}
                    isSelected={isSelected(row, col)}
                    isActive={activeCell?.row === row && activeCell?.col === col}
                    autoEdit={cellAutoEdit}
                    onChange={onCellChange}
                    onMouseDown={onMouseDown}
                    onMouseEnter={onMouseEnter}
                    width={colWidth}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
