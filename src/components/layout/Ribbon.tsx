import React from 'react';
import { BarChart3, TrendingUp, ScatterChart, LayoutList, BarChartHorizontal } from 'lucide-react';
import { zh } from '../../i18n/zh';
import { useTableStore } from '../../store/tableStore';
import { useAnalysisStore } from '../../store/analysisStore';
import { normalityTest } from '../../stats/normality';
import { linearRegression } from '../../stats/regression';
import type { AnalysisType } from '../../types';

interface RibbonTabDef {
  type: AnalysisType;
  label: string;
  icon: React.ReactNode;
}

const tabs: RibbonTabDef[] = [
  { type: 'normality-test', label: zh.ribbon.normalityTest, icon: <BarChart3 size={18} /> },
  { type: 'linear-regression', label: zh.ribbon.linearRegression, icon: <TrendingUp size={18} /> },
  { type: 'scatter-plot', label: zh.ribbon.scatterPlot, icon: <ScatterChart size={18} /> },
  { type: 'box-plot', label: zh.ribbon.LayoutList, icon: <LayoutList size={18} /> },
  { type: 'pareto-chart', label: zh.ribbon.paretoChart, icon: <BarChartHorizontal size={18} /> },
];

export const Ribbon: React.FC = () => {
  const activeTableId = useTableStore((s) => s.activeTableId);
  const addResult = useAnalysisStore((s) => s.addResult);

  const handleAnalysis = (type: AnalysisType) => {
    if (!activeTableId) return;
    addResult(activeTableId, type, {}, {});
  };

  return (
    <div className="flex items-center h-12 bg-gray-100 border-b border-gray-300 px-2 gap-1 flex-shrink-0 select-none">
      <div className="flex items-center mr-4">
        <span className="font-bold text-blue-700 text-lg">MiniTab</span>
      </div>
      <div className="w-px h-8 bg-gray-300 mx-1" />
      {tabs.map((tab) => (
        <button
          key={tab.type}
          onClick={() => handleAnalysis(tab.type)}
          disabled={!activeTableId}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-gray-700 hover:bg-gray-200 active:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};
