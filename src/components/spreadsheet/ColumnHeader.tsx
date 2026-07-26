import React from 'react';
import { columnName } from '../../utils/columnName';

interface ColumnHeaderProps {
  col: number;
  width: number;
  isSelected: boolean;
  onClick: () => void;
}

export const ColumnHeader: React.FC<ColumnHeaderProps> = ({ col, width, isSelected, onClick }) => {
  return (
    <div
      className={`flex items-center justify-center border-r border-b border-gray-300 text-xs font-semibold cursor-pointer select-none ${
        isSelected ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
      style={{ width, minWidth: width, height: 28 }}
      onClick={onClick}
    >
      {columnName(col)}
    </div>
  );
};
