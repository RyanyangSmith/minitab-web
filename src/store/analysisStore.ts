import { create } from 'zustand';
import type { AnalysisResult, AnalysisType } from '../types';
import { zh } from '../i18n/zh';

let resultCounters: Record<string, number> = {};

function getDefaultName(type: AnalysisType): string {
  const base = zh.analysis.defaultNames[type] || type;
  const key = type;
  if (!resultCounters[key]) resultCounters[key] = 0;
  resultCounters[key]++;
  return `${base}${resultCounters[key]}`;
}

interface AnalysisStore {
  results: Record<string, AnalysisResult>;
  resultByTable: Record<string, string[]>;
  openTabs: string[];
  activeTabId: string | null;

  addResult: (
    tableId: string,
    type: AnalysisType,
    config: Record<string, unknown>,
    data: Record<string, unknown>
  ) => string;
  renameResult: (id: string, name: string) => void;
  removeResult: (id: string) => void;

  openTab: (id: string) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;

  getResultsForTable: (tableId: string) => AnalysisResult[];
}

export const useAnalysisStore = create<AnalysisStore>((set, get) => ({
  results: {},
  resultByTable: {},
  openTabs: [],
  activeTabId: null,

  addResult: (tableId, type, config, data) => {
    const id = crypto.randomUUID();
    const name = getDefaultName(type);
    const result: AnalysisResult = { id, tableId, type, name, config, data };
    set((s) => {
      const byTable = s.resultByTable[tableId] || [];
      return {
        results: { ...s.results, [id]: result },
        resultByTable: { ...s.resultByTable, [tableId]: [...byTable, id] },
        openTabs: [...s.openTabs.filter((t) => t !== tableId), id],
        activeTabId: id,
      };
    });
    return id;
  },

  renameResult: (id, name) => {
    set((s) => {
      const r = s.results[id];
      if (!r) return s;
      return {
        results: { ...s.results, [id]: { ...r, name } },
      };
    });
  },

  removeResult: (id) => {
    set((s) => {
      const r = s.results[id];
      if (!r) return s;
      const { [id]: _, ...rest } = s.results;
      const byTable = (s.resultByTable[r.tableId] || []).filter((rid) => rid !== id);
      const newByTable = { ...s.resultByTable };
      if (byTable.length === 0) {
        delete newByTable[r.tableId];
      } else {
        newByTable[r.tableId] = byTable;
      }
      const newTabs = s.openTabs.filter((tid) => tid !== id);
      const newActive =
        s.activeTabId === id
          ? newTabs.length > 0
            ? newTabs[newTabs.length - 1]
            : null
          : s.activeTabId;
      return {
        results: rest,
        resultByTable: newByTable,
        openTabs: newTabs,
        activeTabId: newActive,
      };
    });
  },

  openTab: (id) => {
    set((s) => {
      if (s.openTabs.includes(id)) {
        return { activeTabId: id };
      }
      return {
        openTabs: [...s.openTabs, id],
        activeTabId: id,
      };
    });
  },

  closeTab: (id) => {
    set((s) => {
      const newTabs = s.openTabs.filter((tid) => tid !== id);
      const newActive =
        s.activeTabId === id
          ? newTabs.length > 0
            ? newTabs[newTabs.length - 1]
            : null
          : s.activeTabId;
      return { openTabs: newTabs, activeTabId: newActive };
    });
  },

  setActiveTab: (id) => {
    set({ activeTabId: id });
  },

  getResultsForTable: (tableId) => {
    const s = get();
    const ids = s.resultByTable[tableId] || [];
    return ids.map((id) => s.results[id]).filter(Boolean);
  },
}));
