import React from 'react';

interface RowNumberCellProps {
  row: number;
  isSelected: boolean;
}

export const RowNumberCell: React.FC<RowNumberCellProps> = ({ row, isSelected }) => {
  // Rows 0 and 1 are header rows - show nothing
  if (row < 2) {
    return (
      <div
        className={`flex items-center justify-center border-r border-b border-gray-300 bg-gray-100 text-xs select-none`}
        style={{ width: 40, height: 28 }}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center border-r border-b border-gray-300 text-xs select-none ${
        isSelected ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'
      }`}
      style={{ width: 40, height: 28 }}
    >
      {row - 1}
    </div>
  );
};
