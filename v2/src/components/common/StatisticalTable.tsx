import React from 'react';

interface Column {
  key: string;
  label: string;
  format?: (value: unknown) => string;
}

interface StatisticalTableProps {
  columns: Column[];
  data: Record<string, unknown>[];
  title?: string;
}

export const StatisticalTable: React.FC<StatisticalTableProps> = ({
  columns,
  data,
  title,
}) => {
  const formatValue = (value: unknown, format?: (v: unknown) => string): string => {
    if (format) return format(value);
    if (typeof value === 'number') {
      if (Math.abs(value) < 0.0001 && value !== 0) {
        return value.toExponential(4);
      }
      return value.toFixed(4);
    }
    if (value == null) return '';
    return String(value);
  };

  return (
    <div className="mt-4">
      {title && <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>}
      <div className="overflow-x-auto border border-gray-200 rounded">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((col) => (
                <th key={col.key} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col.key} className="px-3 py-1.5 text-gray-700 whitespace-nowrap">
                    {formatValue(row[col.key], col.format)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
