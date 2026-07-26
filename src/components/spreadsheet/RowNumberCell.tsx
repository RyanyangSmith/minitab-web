import React from 'react';

interface RowNumberCellProps {
  row: number;
  isSelected: boolean;
}

const CELL_HEIGHT = 28;
const ROW_NUM_WIDTH = 40;

export const RowNumberCell: React.FC<RowNumberCellProps> = ({ row, isSelected }) => {
  // Rows 0 and 1 are header rows - show empty cells
  if (row < 2) {
    return (
      <div
        className="flex items-center justify-center border-r border-b border-gray-200 bg-gray-100 text-xs select-none flex-shrink-0"
        style={{ width: ROW_NUM_WIDTH, minWidth: ROW_NUM_WIDTH, height: CELL_HEIGHT }}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center border-r border-b border-gray-200 text-xs select-none flex-shrink-0 ${
        isSelected ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'
      }`}
      style={{ width: ROW_NUM_WIDTH, minWidth: ROW_NUM_WIDTH, height: CELL_HEIGHT }}
    >
      {row - 1}
    </div>
  );
};