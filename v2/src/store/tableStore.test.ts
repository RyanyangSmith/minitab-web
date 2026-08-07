import { describe, it, expect } from 'vitest';
import { useTableStore } from './tableStore';
import { useAnalysisStore } from './analysisStore';

describe('tableStore', () => {
  it('pairs columns by row and skips rows with missing or non-numeric values', () => {
    const tableId = useTableStore.getState().createTable();
    useTableStore.getState().setCellValues(tableId, [
      { row: 2, col: 0, value: 1 },
      { row: 2, col: 1, value: 10 },
      { row: 3, col: 0, value: 2 },
      { row: 4, col: 0, value: 3 },
      { row: 4, col: 1, value: 30 },
      { row: 5, col: 0, value: 'x' },
      { row: 5, col: 1, value: 40 },
    ]);

    expect(useTableStore.getState().getColumnPairs(tableId, 0, 1)).toEqual([
      { row: 2, a: 1, b: 10 },
      { row: 4, a: 3, b: 30 },
    ]);
  });

  it('returns row-aligned triples for Gage R&R data', () => {
    const tableId = useTableStore.getState().createTable();
    useTableStore.getState().setCellValues(tableId, [
      { row: 2, col: 0, value: 1 },
      { row: 2, col: 1, value: 1 },
      { row: 2, col: 2, value: 1.1 },
      { row: 3, col: 0, value: 1 },
      { row: 3, col: 1, value: 1 },
      { row: 3, col: 2, value: 1.2 },
      { row: 4, col: 0, value: 2 },
      { row: 4, col: 1, value: 2 },
      { row: 4, col: 2, value: 2.1 },
    ]);
    expect(
      useTableStore.getState().getColumnTriples(tableId, 0, 1, 2)
    ).toEqual([
      { row: 2, a: 1, b: 1, c: 1.1 },
      { row: 3, a: 1, b: 1, c: 1.2 },
      { row: 4, a: 2, b: 2, c: 2.1 },
    ]);
  });

  it('returns raw non-empty values for categorical analyses', () => {
    const tableId = useTableStore.getState().createTable();
    useTableStore.getState().setCellValues(tableId, [
      { row: 2, col: 0, value: 'A' },
      { row: 3, col: 0, value: 'B' },
      { row: 4, col: 0, value: 3 },
      { row: 5, col: 0, value: '' },
    ]);
    expect(useTableStore.getState().getColumnValues(tableId, 0)).toEqual([
      'A',
      'B',
      3,
    ]);
  });

  it('returns raw triples with text part and operator ids', () => {
    const tableId = useTableStore.getState().createTable();
    useTableStore.getState().setCellValues(tableId, [
      { row: 2, col: 0, value: 'P1' },
      { row: 2, col: 1, value: 'A' },
      { row: 2, col: 2, value: 1.1 },
    ]);
    expect(
      useTableStore.getState().getColumnTriplesAny(tableId, 0, 1, 2)
    ).toEqual([{ row: 2, a: 'P1', b: 'A', c: 1.1 }]);
  });

  it('cascade-deletes a table, its result tabs, and the active tab', () => {
    const tableId = useTableStore.getState().createTable();
    useAnalysisStore.getState().openTab(tableId);
    const resultId = useAnalysisStore.getState().addResult(
      tableId,
      'normality-test',
      {},
      {}
    );
    useAnalysisStore.getState().setActiveTab(resultId);

    useTableStore.getState().deleteTable(tableId);

    expect(useTableStore.getState().tables[tableId]).toBeUndefined();
    expect(useAnalysisStore.getState().results[resultId]).toBeUndefined();
    expect(useAnalysisStore.getState().openTabs).not.toContain(tableId);
    expect(useAnalysisStore.getState().openTabs).not.toContain(resultId);
    expect(useAnalysisStore.getState().activeTabId).toBeNull();
  });

  it('undoes and redoes cell edits and table expansion', () => {
    const tableId = useTableStore.getState().createTable();
    const store = useTableStore.getState();
    store.setCellValue(tableId, 2, 0, 42);
    store.ensureSize(tableId, 30, 20);

    expect(useTableStore.getState().getCellValue(tableId, 2, 0)).toBe(42);
    expect(useTableStore.getState().tables[tableId].rows).toBe(30);

    useTableStore.getState().undo();
    expect(useTableStore.getState().getCellValue(tableId, 2, 0)).toBe(42);
    expect(useTableStore.getState().tables[tableId].rows).toBe(12);

    useTableStore.getState().undo();
    expect(useTableStore.getState().getCellValue(tableId, 2, 0)).toBeNull();

    useTableStore.getState().redo();
    expect(useTableStore.getState().getCellValue(tableId, 2, 0)).toBe(42);
    useTableStore.getState().redo();
    expect(useTableStore.getState().tables[tableId].rows).toBe(30);
  });
});
