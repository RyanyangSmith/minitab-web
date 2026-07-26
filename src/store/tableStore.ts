import { create } from 'zustand';
import type { CellValue, TableData } from '../types';

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
    rows: 12, // 2 header rows + 10 data rows
    subHeaders: {},
    cells: {},
  };
}

interface TableStore {
  tables: Record<string, TableData>;
  activeTableId: string | null;
  tableOrder: string[];

  createTable: () => string;
  renameTable: (id: string, name: string) => void;
  deleteTable: (id: string) => void;
  setActiveTable: (id: string) => void;

  getCellValue: (tableId: string, row: number, col: number) => CellValue;
  setCellValue: (tableId: string, row: number, col: number, value: CellValue) => void;
  setCellValues: (tableId: string, updates: { row: number; col: number; value: CellValue }[]) => void;

  getSubHeader: (tableId: string, col: number) => string;
  setSubHeader: (tableId: string, col: number, label: string) => void;

  addRows: (tableId: string, count: number) => void;
  addColumns: (tableId: string, count: number) => void;
  ensureSize: (tableId: string, minRows: number, minCols: number) => void;

  getColumnData: (tableId: string, colIdx: number) => number[];
  getColumnDataWithSkip: (tableId: string, colIdx: number, skipRows?: number) => number[];
}

export const useTableStore = create<TableStore>((set, get) => {
  // Initialize with one default table
  const initialTable = createEmptyTable();
  const initialState = {
    tables: { [initialTable.id]: initialTable },
    activeTableId: initialTable.id,
    tableOrder: [initialTable.id],
  };

  return {
    ...initialState,

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
        };
      });
    },

    setActiveTable: (id) => {
      set({ activeTableId: id });
    },

    getCellValue: (tableId, row, col) => {
      const table = get().tables[tableId];
      if (!table) return null;
      return table.cells[makeCellKey(row, col)] ?? null;
    },

    setCellValue: (tableId, row, col, value) => {
      set((s) => {
        const table = s.tables[tableId];
        if (!table) return s;
        const key = makeCellKey(row, col);
        const newCells = { ...table.cells };
        if (value === null || value === '') {
          delete newCells[key];
        } else {
          newCells[key] = value;
        }
        return {
          tables: { ...s.tables, [tableId]: { ...table, cells: newCells } },
        };
      });
    },

    setCellValues: (tableId, updates) => {
      set((s) => {
        const table = s.tables[tableId];
        if (!table) return s;
        const newCells = { ...table.cells };
        for (const { row, col, value } of updates) {
          const key = makeCellKey(row, col);
          if (value === null || value === '') {
            delete newCells[key];
          } else {
            newCells[key] = value;
          }
        }
        return {
          tables: { ...s.tables, [tableId]: { ...table, cells: newCells } },
        };
      });
    },

    getSubHeader: (tableId, col) => {
      const table = get().tables[tableId];
      if (!table) return '';
      return table.subHeaders[col] ?? '';
    },

    setSubHeader: (tableId, col, label) => {
      set((s) => {
        const table = s.tables[tableId];
        if (!table) return s;
        const newSubHeaders = { ...table.subHeaders };
        if (label === '') {
          delete newSubHeaders[col];
        } else {
          newSubHeaders[col] = label;
        }
        return {
          tables: { ...s.tables, [tableId]: { ...table, subHeaders: newSubHeaders } },
        };
      });
    },

    addRows: (tableId, count) => {
      set((s) => {
        const table = s.tables[tableId];
        if (!table) return s;
        return {
          tables: {
            ...s.tables,
            [tableId]: { ...table, rows: table.rows + count },
          },
        };
      });
    },

    addColumns: (tableId, count) => {
      set((s) => {
        const table = s.tables[tableId];
        if (!table) return s;
        return {
          tables: {
            ...s.tables,
            [tableId]: { ...table, columns: table.columns + count },
          },
        };
      });
    },

    ensureSize: (tableId, minRows, minCols) => {
      set((s) => {
        const table = s.tables[tableId];
        if (!table) return s;
        const newRows = Math.max(table.rows, minRows);
        const newCols = Math.max(table.columns, minCols);
        if (newRows === table.rows && newCols === table.columns) return s;
        return {
          tables: {
            ...s.tables,
            [tableId]: { ...table, rows: newRows, columns: newCols },
          },
        };
      });
    },

    getColumnData: (tableId, colIdx) => {
      return get().getColumnDataWithSkip(tableId, colIdx, 2);
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
  };
});
