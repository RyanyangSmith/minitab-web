import React, { useState } from 'react';
import { ColumnSelector } from './ColumnSelector';
import type { AnalysisType } from '../../types';

interface ColumnConfig {
  key: string;
  label: string;
  allowEmpty?: boolean;
}

interface AnalysisPanelProps {
  tableId: string;
  type: AnalysisType;
  columns: ColumnConfig[];
  onRun: (config: Record<string, number | null>) => void;
  children?: React.ReactNode;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  tableId,
  columns,
  onRun,
  children,
}) => {
  const [config, setConfig] = useState<Record<string, number | null>>(() => {
    const init: Record<string, number | null> = {};
    columns.forEach((c) => {
      init[c.key] = null;
    });
    return init;
  });

  const canRun = columns.every((c) => c.allowEmpty || config[c.key] != null);

  const handleChange = (key: string, value: number | null) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleRun = () => {
    if (!canRun) return;
    onRun(config);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">配置参数</h3>
        {columns.map((col) => (
          <ColumnSelector
            key={col.key}
            tableId={tableId}
            value={config[col.key]}
            onChange={(v) => handleChange(col.key, v)}
            label={col.label}
            allowEmpty={col.allowEmpty}
          />
        ))}
        <button
          onClick={handleRun}
          disabled={!canRun}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          执行分析
        </button>
      </div>

      {children && (
        <div className="space-y-4">
          {children}
        </div>
      )}
    </div>
  );
};
