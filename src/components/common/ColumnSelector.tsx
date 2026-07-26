import React, { useMemo } from 'react';
import { useTableStore } from '../../store/tableStore';
import { columnName } from '../../utils/columnName';

interface ColumnSelectorProps {
  tableId: string;
  value: number | null;
  onChange: (colIdx: number | null) => void;
  label: string;
  placeholder?: string;
  allowEmpty?: boolean;
}

export const ColumnSelector: React.FC<ColumnSelectorProps> = ({
  tableId,
  value,
  onChange,
  label,
  placeholder = '请选择列...',
  allowEmpty = false,
}) => {
  const table = useTableStore((s) => s.tables[tableId]);
  const getSubHeader = useTableStore((s) => s.getSubHeader);

  const options = useMemo(() => {
    if (!table) return [];
    return Array.from({ length: table.columns }, (_, i) => {
      const sub = getSubHeader(tableId, i);
      const label_text = sub ? `${columnName(i)} - ${sub}` : columnName(i);
      return { value: i, label: label_text };
    });
  }, [table, tableId, getSubHeader]);

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-600 whitespace-nowrap min-w-[80px]">
        {label}
      </label>
      <select
        className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
        value={value == null ? '' : value}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === '' ? null : Number(v));
        }}
      >
        {allowEmpty && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};
