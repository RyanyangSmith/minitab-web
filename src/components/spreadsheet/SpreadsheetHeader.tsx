import React from 'react';
import { ColumnHeader } from './ColumnHeader';
import { Cell } from './Cell';
import type { CellValue } from '../../types';

interface SpreadsheetHeaderProps {
  columns: number;
  subHeaders: Record<number, string>;
  isColumnSelected: (col: number) => boolean;
  onColumnClick: (col: number) => void;
  onSubHeaderChange: (col: number, value: string) => void;
  activeCell: { row: number; col: number } | null;
  colWidth: number;
}

const ROW_NUM_WIDTH = 40;
const CELL_HEIGHT = 28;

export const SpreadsheetHeader: React.FC<SpreadsheetHeaderProps> = ({
  columns,
  subHeaders,
  isColumnSelected,
  onColumnClick,
  onSubHeaderChange,
  activeCell,
  colWidth,
}) => {
  return (
    <div className="flex-shrink-0">
      {/* Row 0: Column titles (C1, C2...) */}
      <div className="flex" style={{ height: CELL_HEIGHT }}>
        {/* Row number spacer for row 0 */}
        <div
          className="flex items-center justify-center border-r border-b border-gray-300 bg-gray-100 flex-shrink-0"
          style={{ width: ROW_NUM_WIDTH, height: CELL_HEIGHT }}
        />
        {Array.from({ length: columns }, (_, c) => (
          <ColumnHeader
            key={`col-${c}`}
            col={c}
            width={colWidth}
            isSelected={isColumnSelected(c)}
            onClick={() => onColumnClick(c)}
          />
        ))}
      </div>
      {/* Row 1: Editable sub-headers */}
      <div className="flex" style={{ height: CELL_HEIGHT }}>
        {/* Row number spacer for row 1 */}
        <div
          className="flex items-center justify-center border-r border-b border-gray-300 bg-gray-100 flex-shrink-0"
          style={{ width: ROW_NUM_WIDTH, height: CELL_HEIGHT }}
        />
        {Array.from({ length: columns }, (_, c) => (
          <Cell
            key={`sub-${c}`}
            value={subHeaders[c] ?? null}
            row={1}
            col={c}
            isSelected={isColumnSelected(c)}
            isActive={activeCell?.row === 1 && activeCell?.col === c}
            onChange={(v) => onSubHeaderChange(c, v)}
            width={colWidth}
          />
        ))}
      </div>
    </div>
  );
};