import React, { startTransition } from 'react';
import { useTableStore } from '../../store/tableStore';
import { analysisRegistry } from '../../analysis/registry';
import { createAnalysis } from '../../analysis/createAnalysis';
import { zh } from '../../i18n/zh';

export const Ribbon: React.FC = () => {
  const activeTableId = useTableStore((s) => s.activeTableId);
  const items = Object.values(analysisRegistry);

  return (
    <div className="flex items-center h-10 bg-white border-b border-gray-200 px-3 gap-0.5 flex-shrink-0 select-none">
      <span className="font-bold text-blue-700 text-base mr-3 tracking-tight">
        {zh.app.name}
      </span>
      <div className="w-px h-5 bg-gray-200" />
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.type}
            onClick={() =>
              startTransition(() => {
                if (activeTableId) createAnalysis(activeTableId, item.type);
              })
            }
            disabled={!activeTableId}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs text-gray-600 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <Icon size={16} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
