import React from 'react';
import { X } from 'lucide-react';
import { useTableStore } from '../../store/tableStore';
import { useAnalysisStore } from '../../store/analysisStore';
import { Spreadsheet } from '../spreadsheet/Spreadsheet';
import { NormalityTest } from '../analysis/NormalityTest/NormalityTest';
import { LinearRegression } from '../analysis/LinearRegression/LinearRegression';
import { ScatterPlot } from '../analysis/ScatterPlot/ScatterPlot';
import { BoxPlotView } from '../analysis/BoxPlot/BoxPlot';
import { ParetoChart } from '../analysis/ParetoChart/ParetoChart';
import type { AnalysisType } from '../../types';

const analysisComponents: Record<AnalysisType, React.ComponentType<{ tableId: string; resultId: string }>> = {
  'normality-test': NormalityTest,
  'linear-regression': LinearRegression,
  'scatter-plot': ScatterPlot,
  'box-plot': BoxPlotView,
  'pareto-chart': ParetoChart,
};

export const Workspace: React.FC<{ sidebarWidth: number }> = ({ sidebarWidth }) => {
  const tables = useTableStore((s) => s.tables);
  const results = useAnalysisStore((s) => s.results);
  const openTabs = useAnalysisStore((s) => s.openTabs);
  const activeTabId = useAnalysisStore((s) => s.activeTabId);
  const closeTab = useAnalysisStore((s) => s.closeTab);
  const setActiveTab = useAnalysisStore((s) => s.setActiveTab);

  if (openTabs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-300 select-none">
        <div className="text-center">
          <p className="text-base font-medium text-gray-400 mb-1">MiniTab Web</p>
          <p className="text-xs text-gray-300">点击侧边栏工作表或顶部功能区开始分析</p>
        </div>
      </div>
    );
  }

  const getTabLabel = (tabId: string): string => {
    if (tables[tabId]) return tables[tabId].name;
    if (results[tabId]) return results[tabId].name;
    return tabId;
  };

  const renderContent = () => {
    if (!activeTabId) return null;
    if (tables[activeTabId]) return <Spreadsheet tableId={activeTabId} />;
    const result = results[activeTabId];
    if (result) {
      const Comp = analysisComponents[result.type];
      if (Comp) return <Comp key={result.id} tableId={result.tableId} resultId={result.id} />;
      return <div className="p-4 text-gray-400 text-sm">未知分析类型</div>;
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center h-7 bg-gray-50 border-b border-gray-200 overflow-x-auto flex-shrink-0">
        {openTabs.map((tabId) => {
          const isActive = tabId === activeTabId;
          return (
            <div key={tabId} className={`flex items-center gap-1 px-3 py-1 text-xs cursor-pointer border-r border-gray-200 select-none flex-shrink-0 max-w-[180px] transition-colors ${isActive ? 'bg-white text-gray-800 font-medium border-t-2 border-t-blue-600 -mt-px' : 'text-gray-500 hover:bg-gray-100'}`} onClick={() => setActiveTab(tabId)}>
              <span className="truncate">{getTabLabel(tabId)}</span>
              <button className="ml-1 p-0.5 rounded hover:bg-gray-200 flex-shrink-0 opacity-40 hover:opacity-80" onClick={(e) => { e.stopPropagation(); closeTab(tabId); }}><X size={10} /></button>
            </div>
          );
        })}
      </div>
      <div className="flex-1 overflow-auto bg-white">{renderContent()}</div>
    </div>
  );
};