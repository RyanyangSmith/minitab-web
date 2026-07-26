import React from 'react';
import { BarChart3, TrendingUp, ScatterChart, LayoutList, BarChartHorizontal } from 'lucide-react';
import { useTableStore } from '../../store/tableStore';
import { useAnalysisStore } from '../../store/analysisStore';
import type { AnalysisType } from '../../types';

const tabs: { type: AnalysisType; label: string; icon: React.ReactNode }[] = [
  { type: 'normality-test', label: '正态检验', icon: <BarChart3 size={16} /> },
  { type: 'linear-regression', label: '线性回归', icon: <TrendingUp size={16} /> },
  { type: 'scatter-plot', label: '散点图', icon: <ScatterChart size={16} /> },
  { type: 'box-plot', label: '箱线图', icon: <LayoutList size={16} /> },
  { type: 'pareto-chart', label: '帕累托图', icon: <BarChartHorizontal size={16} /> },
];

export const Ribbon: React.FC = () => {
  const activeTableId = useTableStore((s) => s.activeTableId);
  const addResult = useAnalysisStore((s) => s.addResult);

  return (
    <div className="flex items-center h-10 bg-white border-b border-gray-200 px-3 gap-0.5 flex-shrink-0 select-none">
      <span className="font-bold text-blue-700 text-base mr-3 tracking-tight">MiniTab</span>
      <div className="w-px h-5 bg-gray-200" />
      {tabs.map((tab) => (
        <button
          key={tab.type}
          onClick={() => activeTableId && addResult(activeTableId, tab.type, {}, {})}
          disabled={!activeTableId}
          className="flex items-center gap-1 px-2.5 py-1 rounded text-xs text-gray-600 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};