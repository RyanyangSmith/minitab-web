import React, { useState, useRef, useEffect } from 'react';
import type { CellValue } from '../../types';

interface CellProps {
  value: CellValue;
  row: number;
  col: number;
  isSelected: boolean;
  isActive: boolean;
  isHeader?: boolean;
  readOnly?: boolean;
  autoEdit?: boolean;
  onChange?: (value: string) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onDoubleClick?: () => void;
  width?: number;
}

export const Cell: React.FC<CellProps> = ({
  value,
  row,
  col,
  isSelected,
  isActive,
  isHeader = false,
  readOnly = false,
  autoEdit = false,
  onChange,
  onMouseDown,
  onMouseEnter,
  onDoubleClick,
  width = 100,
}) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const prevActive = useRef(isActive);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  // Auto-enter edit mode when activated by keyboard navigation
  useEffect(() => {
    if (isActive && !prevActive.current && autoEdit && !readOnly) {
      setEditValue(value == null ? '' : String(value));
      setEditing(true);
    }
    prevActive.current = isActive;
  }, [isActive, autoEdit, readOnly, value]);

  const handleDoubleClick = () => {
    if (readOnly) return;
    setEditValue(value == null ? '' : String(value));
    setEditing(true);
    onDoubleClick?.();
  };

  const commitEdit = () => {
    setEditing(false);
    onChange?.(editValue);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditValue(value == null ? '' : String(value));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit();
    }
    if (e.key === 'Escape') {
      cancelEdit();
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      commitEdit();
    }
  };

  // Start editing on keypress when cell is active
  const handleActivationKey = (e: React.KeyboardEvent) => {
    if (readOnly || editing) return;
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      setEditValue(e.key);
      setEditing(true);
    }
  };

  const displayValue = value == null ? '' : String(value);

  return (
    <div
      className={`relative border-r border-b border-gray-200 flex items-center px-1 overflow-hidden select-none ${
        isHeader
          ? 'bg-gray-100 font-medium text-gray-600 text-xs justify-center'
          : isSelected
          ? 'bg-blue-50'
          : 'bg-white'
      } ${isActive && !editing ? 'ring-2 ring-blue-500 ring-inset z-10' : ''}`}
      style={{
        width,
        minWidth: width,
        height: 28,
        gridRow: row + 1,
        gridColumn: col + 1,
      }}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleActivationKey}
      tabIndex={isActive ? 0 : -1}
    >
      {editing && !readOnly ? (
        <input
          ref={inputRef}
          className="absolute inset-0 w-full h-full px-1 border-2 border-blue-500 outline-none text-sm bg-white z-20"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <span className="text-sm truncate w-full">
          {displayValue}
        </span>
      )}
    </div>
  );
};