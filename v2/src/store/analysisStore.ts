import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AnalysisResult, AnalysisType } from '../types';
import { zh } from '../i18n/zh';

const resultCounters: Record<string, number> = {};

const DEFAULT_NAMES: Record<AnalysisType, string> = {
  'capability-analysis': zh.analysis.capability,
  'normality-test': zh.analysis.normality,
  'linear-regression': zh.analysis.linearRegression,
  'scatter-plot': zh.analysis.scatterPlot,
  'box-plot': zh.analysis.boxPlot,
  'pareto-chart': zh.analysis.pareto,
  'descriptive-statistics': zh.analysis.descriptiveStatistics,
  'spc-control-chart': zh.analysis.spc,
  'hypothesis-test': zh.analysis.hypothesisTest,
  'gage-rr': zh.analysis.gageRR,
};

function getDefaultName(type: AnalysisType): string {
  const base = DEFAULT_NAMES[type] || type;
  if (!resultCounters[type]) resultCounters[type] = 0;
  resultCounters[type]++;
  return `${base}${resultCounters[type]}`;
}

interface AnalysisStore {
  results: Record<string, AnalysisResult>;
  resultByTable: Record<string, string[]>;
  openTabs: string[];
  activeTabId: string | null;
  hydrated: boolean;

  addResult: (
    tableId: string,
    type: AnalysisType,
    config: Record<string, unknown>,
    data: Record<string, unknown>
  ) => string;
  updateResultData: (
    id: string,
    config: Record<string, unknown>,
    data: Record<string, unknown>
  ) => void;
  renameResult: (id: string, name: string) => void;
  removeResult: (id: string) => void;
  setHydrated: (value: boolean) => void;

  openTab: (id: string) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;

  clearResultsForTable: (tableId: string) => void;
}

export const useAnalysisStore = create<AnalysisStore>()(
  persist(
    (set) => ({
      results: {},
      resultByTable: {},
      openTabs: [],
      activeTabId: null,
      hydrated: false,

      addResult: (tableId, type, config, data) => {
        const id = crypto.randomUUID();
        const name = getDefaultName(type);
        const result: AnalysisResult = {
          id,
          tableId,
          type,
          name,
          config,
          data,
        };
        set((s) => {
          const byTable = s.resultByTable[tableId] || [];
          return {
            results: { ...s.results, [id]: result },
            resultByTable: {
              ...s.resultByTable,
              [tableId]: [...byTable, id],
            },
            openTabs: [...s.openTabs.filter((t) => t !== tableId), id],
            activeTabId: id,
          };
        });
        return id;
      },

      updateResultData: (id, config, data) => {
        set((s) => {
          const r = s.results[id];
          if (!r) return s;
          return {
            results: {
              ...s.results,
              [id]: { ...r, config, data },
            },
          };
        });
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
          const byTable = (s.resultByTable[r.tableId] || []).filter(
            (rid) => rid !== id
          );
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

      setHydrated: (value) => {
        set({ hydrated: value });
      },

      openTab: (id) => {
        set((s) => {
          if (s.openTabs.includes(id)) return { activeTabId: id };
          return { openTabs: [...s.openTabs, id], activeTabId: id };
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

      clearResultsForTable: (tableId) => {
        set((s) => {
          const ids = s.resultByTable[tableId] || [];
          const results = { ...s.results };
          for (const id of ids) {
            delete results[id];
          }
          const resultByTable = { ...s.resultByTable };
          delete resultByTable[tableId];
          const openTabs = s.openTabs.filter(
            (id) => id !== tableId && !ids.includes(id)
          );
          const activeTabId =
            s.activeTabId != null && ids.includes(s.activeTabId)
              ? openTabs.length > 0
                ? openTabs[openTabs.length - 1]
                : null
              : s.activeTabId;
          return { results, resultByTable, openTabs, activeTabId };
        });
      },
    }),
    {
      name: 'minitab-analysis-v2',
      version: 1,
      partialize: (state) => ({
        results: state.results,
        resultByTable: state.resultByTable,
        openTabs: state.openTabs,
        activeTabId: state.activeTabId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
