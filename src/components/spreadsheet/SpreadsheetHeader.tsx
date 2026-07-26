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
    <div className="flex flex-shrink-0" style={{ marginLeft: 40 }}>
      {/* Row 0: Column titles (C1, C2...) */}
      <div className="flex">
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
      <div className="flex">
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
