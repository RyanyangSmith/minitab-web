import React, { useState } from 'react';
import { Table2, Trash2, Pencil, Plus } from 'lucide-react';
import { useTableStore } from '../../store/tableStore';
import { useAnalysisStore } from '../../store/analysisStore';
import { zh } from '../../i18n/zh';
import type { AnalysisType } from '../../types';

const analysisIcons: Record<AnalysisType, string> = {
  'normality-test': '\u2695',
  'linear-regression': '\u2197',
  'scatter-plot': '\u25CB',
  'box-plot': '\u25A3',
  'pareto-chart': '\u2261',
};

export const Sidebar: React.FC = () => {
  const tables = useTableStore((s) => s.tables);
  const tableOrder = useTableStore((s) => s.tableOrder);
  const activeTableId = useTableStore((s) => s.activeTableId);
  const setActiveTable = useTableStore((s) => s.setActiveTable);
  const createTable = useTableStore((s) => s.createTable);
  const renameTable = useTableStore((s) => s.renameTable);
  const deleteTable = useTableStore((s) => s.deleteTable);

  const results = useAnalysisStore((s) => s.results);
  const resultByTable = useAnalysisStore((s) => s.resultByTable);
  const activeTabId = useAnalysisStore((s) => s.activeTabId);
  const openTab = useAnalysisStore((s) => s.openTab);
  const renameResult = useAnalysisStore((s) => s.renameResult);
  const removeResult = useAnalysisStore((s) => s.removeResult);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editType, setEditType] = useState<'table' | 'result'>('table');

  const startRename = (id: string, currentName: string, type: 'table' | 'result') => {
    setEditingId(id);
    setEditValue(currentName);
    setEditType(type);
  };

  const commitRename = () => {
    if (editingId && editValue.trim()) {
      if (editType === 'table') {
        renameTable(editingId, editValue.trim());
      } else {
        renameResult(editingId, editValue.trim());
      }
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') setEditingId(null);
  };

  const handleTableClick = (tableId: string) => {
    setActiveTable(tableId);
    openTab(tableId);
  };

  const handleResultClick = (resultId: string) => {
    openTab(resultId);
  };

  return (
    <div className="py-2 text-sm">
      <div className="flex items-center justify-between px-3 py-1 mb-1">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">数据管理</span>
        <button
          onClick={() => createTable()}
          className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700"
          title={zh.sidebar.newTable}
        >
          <Plus size={16} />
        </button>
      </div>

      {tableOrder.map((tableId) => {
        const table = tables[tableId];
        if (!table) return null;
        const tableResults = (resultByTable[tableId] || [])
          .map((rid) => results[rid])
          .filter(Boolean);

        const isTableActive = activeTabId === tableId;
        const isEditingTable = editingId === tableId && editType === 'table';

        return (
          <div key={tableId} className="mb-0.5">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 cursor-pointer group ${
                isTableActive ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100 text-gray-700'
              }`}
              onClick={() => handleTableClick(tableId)}
              onContextMenu={(e) => {
                e.preventDefault();
                startRename(tableId, table.name, 'table');
              }}
            >
              <Table2 size={14} className="flex-shrink-0 text-gray-400" />
              {isEditingTable ? (
                <input
                  className="flex-1 bg-white border border-blue-400 rounded px-1 py-0 text-sm outline-none"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="flex-1 truncate">{table.name}</span>
              )}
              <div className="hidden group-hover:flex gap-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); startRename(tableId, table.name, 'table'); }}
                  className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); if (confirm('确定要删除此工作表及其所有分析结果？')) deleteTable(tableId); }}
                  className="p-0.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-600"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {tableResults.map((result) => {
              const isResultActive = activeTabId === result.id;
              const isEditingResult = editingId === result.id && editType === 'result';
              return (
                <div
                  key={result.id}
                  className={`flex items-center gap-1.5 pl-8 pr-3 py-1 cursor-pointer group ${
                    isResultActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  onClick={() => handleResultClick(result.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    startRename(result.id, result.name, 'result');
                  }}
                >
                  <span className="text-xs">{analysisIcons[result.type] || '\u25CF'}</span>
                  {isEditingResult ? (
                    <input
                      className="flex-1 bg-white border border-blue-400 rounded px-1 py-0 text-sm outline-none"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="flex-1 truncate">{result.name}</span>
                  )}
                  <div className="hidden group-hover:flex gap-0.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); startRename(result.id, result.name, 'result'); }}
                      className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeResult(result.id); }}
                      className="p-0.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
