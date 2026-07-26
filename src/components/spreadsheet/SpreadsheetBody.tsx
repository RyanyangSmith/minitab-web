import React from 'react';
import { Cell } from './Cell';
import { RowNumberCell } from './RowNumberCell';
import type { CellValue } from '../../types';

interface SpreadsheetBodyProps {
  rows: number;
  columns: number;
  getCellValue: (row: number, col: number) => CellValue;
  onCellChange: (row: number, col: number, value: string) => void;
  isSelected: (row: number, col: number) => boolean;
  activeCell: { row: number; col: number } | null;
  onMouseDown: (row: number, col: number, e: React.MouseEvent) => void;
  onMouseEnter: (row: number, col: number, e: React.MouseEvent) => void;
  colWidth: number;
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
  colWidth,
}) => {
  // Only render data rows (starting from row 2)
  const dataRows = rows - 2;

  return (
    <div className="flex-1 overflow-auto">
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {Array.from({ length: dataRows }, (_, i) => {
          const row = i + 2;
          return (
            <div key={`row-${row}`} className="flex">
              <RowNumberCell row={row} isSelected={false} />
              {Array.from({ length: columns }, (_, c) => (
                <Cell
                  key={`cell-${row}-${c}`}
                  value={getCellValue(row, c)}
                  row={row}
                  col={c}
                  isSelected={isSelected(row, c)}
                  isActive={activeCell?.row === row && activeCell?.col === c}
                  onChange={(v) => onCellChange(row, c, v)}
                  onMouseDown={(e) => onMouseDown(row, c, e)}
                  onMouseEnter={(e) => onMouseEnter(row, c, e)}
                  width={colWidth}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
