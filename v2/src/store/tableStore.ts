import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CellValue, TableData } from '../types';
import { useAnalysisStore } from './analysisStore';

let tableCounter = 1;

function makeCellKey(row: number, col: number): string {
  return `${row}:${col}`;
}

function createEmptyTable(name?: string): TableData {
  const id = crypto.randomUUID();
  const tName = name || `工作表${tableCounter++}`;
  return {
    id,
    name: tName,
    columns: 10,
    rows: 12,
    subHeaders: {},
    cells: {},
  };
}

interface TableSnapshot {
  cells: Record<string, CellValue>;
  subHeaders: Record<number, string>;
  rows: number;
  columns: number;
}

interface HistoryEntry {
  tableId: string;
  before: TableSnapshot;
  after: TableSnapshot;
}

function snapshotOf(table: TableData): TableSnapshot {
  return {
    cells: table.cells,
    subHeaders: table.subHeaders,
    rows: table.rows,
    columns: table.columns,
  };
}

interface TableStore {
  tables: Record<string, TableData>;
  activeTableId: string | null;
  tableOrder: string[];
  history: HistoryEntry[];
  future: HistoryEntry[];
  hydrated: boolean;

  createTable: () => string;
  renameTable: (id: string, name: string) => void;
  deleteTable: (id: string) => void;
  setActiveTable: (id: string) => void;
  setHydrated: (value: boolean) => void;

  getCellValue: (tableId: string, row: number, col: number) => CellValue;
  setCellValue: (
    tableId: string,
    row: number,
    col: number,
    value: CellValue
  ) => void;
  setCellValues: (
    tableId: string,
    updates: { row: number; col: number; value: CellValue }[]
  ) => void;

  getSubHeader: (tableId: string, col: number) => string;
  setSubHeader: (tableId: string, col: number, label: string) => void;

  addRows: (tableId: string, count: number) => void;
  addColumns: (tableId: string, count: number) => void;
  ensureSize: (tableId: string, minRows: number, minCols: number) => void;

  getColumnData: (tableId: string, colIdx: number) => number[];
  getColumnValues: (
    tableId: string,
    colIdx: number,
    skipRows?: number
  ) => (string | number)[];
  getColumnDataWithSkip: (
    tableId: string,
    colIdx: number,
    skipRows?: number
  ) => number[];
  getColumnPairs: (
    tableId: string,
    colA: number,
    colB: number,
    skipRows?: number
  ) => { row: number; a: number; b: number }[];
  getColumnPairsAny: (
    tableId: string,
    colA: number,
    colB: number,
    skipRows?: number
  ) => { row: number; a: string | number; b: string | number }[];
  getColumnTriples: (
    tableId: string,
    colA: number,
    colB: number,
    colC: number,
    skipRows?: number
  ) => { row: number; a: number; b: number; c: number }[];
  getColumnTriplesAny: (
    tableId: string,
    colA: number,
    colB: number,
    colC: number,
    skipRows?: number
  ) => { row: number; a: string | number; b: string | number; c: string | number }[];

  undo: () => void;
  redo: () => void;
}

export const useTableStore = create<TableStore>()(
  persist(
    (set, get) => {
      const initialTable = createEmptyTable();
      const initialState = {
        tables: { [initialTable.id]: initialTable },
        activeTableId: initialTable.id,
        tableOrder: [initialTable.id],
      };

      const commit = (
        tableId: string,
        mutate: (table: TableData) => TableData
      ) => {
        const table = get().tables[tableId];
        if (!table) return;
        const before = snapshotOf(table);
        const next = mutate(table);
        if (next === table) return;
        const after = snapshotOf(next);
        set((s) => ({
          tables: { ...s.tables, [tableId]: next },
          history: [
            ...s.history.slice(-99),
            { tableId, before, after },
          ],
          future: [],
        }));
      };

      return {
        ...initialState,
        history: [],
        future: [],
        hydrated: false,

        createTable: () => {
          const table = createEmptyTable();
          set((s) => ({
            tables: { ...s.tables, [table.id]: table },
            tableOrder: [...s.tableOrder, table.id],
            activeTableId: table.id,
          }));
          return table.id;
        },

        renameTable: (id, name) => {
          set((s) => {
            const table = s.tables[id];
            if (!table) return s;
            return {
              tables: { ...s.tables, [id]: { ...table, name } },
            };
          });
        },

        deleteTable: (id) => {
          useAnalysisStore.getState().clearResultsForTable(id);
          set((s) => {
            const { [id]: _, ...rest } = s.tables;
            const newOrder = s.tableOrder.filter((tid) => tid !== id);
            const newActive =
              s.activeTableId === id
                ? newOrder.length > 0
                  ? newOrder[0]
                  : null
                : s.activeTableId;
            return {
              tables: rest,
              tableOrder: newOrder,
              activeTableId: newActive,
              history: s.history.filter((entry) => entry.tableId !== id),
              future: s.future.filter((entry) => entry.tableId !== id),
            };
          });
        },

        setActiveTable: (id) => {
          set({ activeTableId: id });
        },

        setHydrated: (value) => {
          set({ hydrated: value });
        },

        getCellValue: (tableId, row, col) => {
          const table = get().tables[tableId];
          if (!table) return null;
          return table.cells[makeCellKey(row, col)] ?? null;
        },

        setCellValue: (tableId, row, col, value) => {
          commit(tableId, (table) => {
            const key = makeCellKey(row, col);
            const newCells = { ...table.cells };
            if (value === null || value === '') {
              delete newCells[key];
            } else {
              newCells[key] = value;
            }
            return { ...table, cells: newCells };
          });
        },

        setCellValues: (tableId, updates) => {
          commit(tableId, (table) => {
            const newCells = { ...table.cells };
            for (const { row, col, value } of updates) {
              const key = makeCellKey(row, col);
              if (value === null || value === '') {
                delete newCells[key];
              } else {
                newCells[key] = value;
              }
            }
            return { ...table, cells: newCells };
          });
        },

        getSubHeader: (tableId, col) => {
          const table = get().tables[tableId];
          if (!table) return '';
          return table.subHeaders[col] ?? '';
        },

        setSubHeader: (tableId, col, label) => {
          commit(tableId, (table) => {
            const newSubHeaders = { ...table.subHeaders };
            if (label === '') {
              delete newSubHeaders[col];
            } else {
              newSubHeaders[col] = label;
            }
            return { ...table, subHeaders: newSubHeaders };
          });
        },

        addRows: (tableId, count) => {
          commit(tableId, (table) => ({
            ...table,
            rows: table.rows + count,
          }));
        },

        addColumns: (tableId, count) => {
          commit(tableId, (table) => ({
            ...table,
            columns: table.columns + count,
          }));
        },

        ensureSize: (tableId, minRows, minCols) => {
          commit(tableId, (table) => {
            const newRows = Math.max(table.rows, minRows);
            const newCols = Math.max(table.columns, minCols);
            if (newRows === table.rows && newCols === table.columns) {
              return table;
            }
            return { ...table, rows: newRows, columns: newCols };
          });
        },

        getColumnData: (tableId, colIdx) => {
          return get().getColumnDataWithSkip(tableId, colIdx, 2);
        },

        getColumnValues: (tableId, colIdx, skipRows = 2) => {
          const table = get().tables[tableId];
          if (!table) return [];
          const result: (string | number)[] = [];
          const start = Math.max(2, skipRows);
          for (let r = start; r < table.rows; r++) {
            const value = table.cells[makeCellKey(r, colIdx)];
            if (value != null && value !== '') result.push(value);
          }
          return result;
        },

        getColumnDataWithSkip: (tableId, colIdx, skipRows = 2) => {
          const table = get().tables[tableId];
          if (!table) return [];
          const result: number[] = [];
          for (let r = skipRows; r < table.rows; r++) {
            const val = table.cells[makeCellKey(r, colIdx)];
            if (val != null && val !== '') {
              const num = Number(val);
              if (!isNaN(num)) {
                result.push(num);
              }
            }
          }
          return result;
        },

        getColumnPairs: (tableId, colA, colB, skipRows = 2) => {
          const table = get().tables[tableId];
          if (!table) return [];
          const start = Math.max(2, skipRows);
          const pairs: { row: number; a: number; b: number }[] = [];
          for (let r = start; r < table.rows; r++) {
            const va = table.cells[makeCellKey(r, colA)];
            const vb = table.cells[makeCellKey(r, colB)];
            if (va == null || vb == null || va === '' || vb === '') continue;
            const na = Number(va);
            const nb = Number(vb);
            if (!isNaN(na) && !isNaN(nb)) {
              pairs.push({ row: r, a: na, b: nb });
            }
          }
          return pairs;
        },

        getColumnPairsAny: (tableId, colA, colB, skipRows = 2) => {
          const table = get().tables[tableId];
          if (!table) return [];
          const start = Math.max(2, skipRows);
          const pairs: { row: number; a: string | number; b: string | number }[] = [];
          for (let r = start; r < table.rows; r++) {
            const va = table.cells[makeCellKey(r, colA)];
            const vb = table.cells[makeCellKey(r, colB)];
            if (va == null || vb == null || va === '' || vb === '') continue;
            pairs.push({ row: r, a: va, b: vb });
          }
          return pairs;
        },

        getColumnTriples: (tableId, colA, colB, colC, skipRows = 2) => {
          const table = get().tables[tableId];
          if (!table) return [];
          const start = Math.max(2, skipRows);
          const triples: { row: number; a: number; b: number; c: number }[] = [];
          for (let r = start; r < table.rows; r++) {
            const va = table.cells[makeCellKey(r, colA)];
            const vb = table.cells[makeCellKey(r, colB)];
            const vc = table.cells[makeCellKey(r, colC)];
            if (va == null || vb == null || vc == null) continue;
            if (va === '' || vb === '' || vc === '') continue;
            const na = Number(va);
            const nb = Number(vb);
            const nc = Number(vc);
            if (!isNaN(na) && !isNaN(nb) && !isNaN(nc)) {
              triples.push({ row: r, a: na, b: nb, c: nc });
            }
          }
          return triples;
        },

        getColumnTriplesAny: (tableId, colA, colB, colC, skipRows = 2) => {
          const table = get().tables[tableId];
          if (!table) return [];
          const start = Math.max(2, skipRows);
          const triples: {
            row: number;
            a: string | number;
            b: string | number;
            c: string | number;
          }[] = [];
          for (let r = start; r < table.rows; r++) {
            const va = table.cells[makeCellKey(r, colA)];
            const vb = table.cells[makeCellKey(r, colB)];
            const vc = table.cells[makeCellKey(r, colC)];
            if (va == null || vb == null || vc == null) continue;
            if (va === '' || vb === '' || vc === '') continue;
            triples.push({ row: r, a: va, b: vb, c: vc });
          }
          return triples;
        },

        undo: () => {
          const { history } = get();
          const entry = history[history.length - 1];
          const table = entry ? get().tables[entry.tableId] : undefined;
          if (!entry || !table) return;
          set((s) => ({
            tables: {
              ...s.tables,
              [entry.tableId]: { ...table, ...entry.before },
            },
            history: s.history.slice(0, -1),
            future: [...s.future, entry],
          }));
        },

        redo: () => {
          const { future } = get();
          const entry = future[future.length - 1];
          const table = entry ? get().tables[entry.tableId] : undefined;
          if (!entry || !table) return;
          set((s) => ({
            tables: {
              ...s.tables,
              [entry.tableId]: { ...table, ...entry.after },
            },
            history: [...s.history, entry],
            future: s.future.slice(0, -1),
          }));
        },
      };
    },
    {
      name: 'minitab-tables-v2',
      version: 1,
      partialize: (state) => ({
        tables: state.tables,
        tableOrder: state.tableOrder,
        activeTableId: state.activeTableId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
