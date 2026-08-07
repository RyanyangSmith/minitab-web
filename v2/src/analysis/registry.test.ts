import { describe, it, expect } from 'vitest';
import { useTableStore } from '../store/tableStore';
import { useAnalysisStore } from '../store/analysisStore';
import { createAnalysis } from './createAnalysis';
import { analysisRegistry } from './registry';
import { analysisComponents } from './analysisComponents';

function tableWithData(): string {
  const tableId = useTableStore.getState().createTable();
  useTableStore.getState().setCellValues(tableId, [
    { row: 2, col: 0, value: 1 },
    { row: 3, col: 0, value: 2 },
    { row: 4, col: 0, value: 3 },
    { row: 2, col: 1, value: 10 },
    { row: 3, col: 1, value: 20 },
    { row: 4, col: 1, value: 30 },
  ]);
  return tableId;
}

describe('analysis registry', () => {
  it('creates a normality result with a default column and auto-run data', () => {
    const tableId = tableWithData();
    const resultId = createAnalysis(tableId, 'normality-test');
    expect(resultId).not.toBeNull();
    const result = useAnalysisStore.getState().results[resultId!];
    expect(result.config.col).toBe(0);
    expect((result.data.norm as { n: number } | null)?.n).toBe(3);
  });

  it('creates a regression result from the first two data columns', () => {
    const tableId = tableWithData();
    const resultId = createAnalysis(tableId, 'linear-regression');
    const result = useAnalysisStore.getState().results[resultId!];
    expect(result.config).toMatchObject({ xCol: 0, yCol: 1 });
    expect((result.data.result as { slope: number } | null)?.slope).toBe(10);
  });

  it('creates a capability result with spec limits derived from data', () => {
    const tableId = tableWithData();
    const resultId = createAnalysis(tableId, 'capability-analysis');
    const result = useAnalysisStore.getState().results[resultId!];
    expect(result.config.col).toBe(0);
    expect((result.data.result as { n: number } | null)?.n).toBe(3);
    expect(result.config.title).toBe('C1 过程能力分析');
  });

  it('uses the column subheader in the default capability title', () => {
    const tableId = tableWithData();
    useTableStore.getState().setSubHeader(tableId, 0, 'RC');
    const resultId = createAnalysis(tableId, 'capability-analysis');
    const result = useAnalysisStore.getState().results[resultId!];
    expect(result.config.title).toBe('RC 过程能力分析');
  });

  it('registers every analysis type with a component and default config', () => {
    for (const definition of Object.values(analysisRegistry)) {
      expect(analysisComponents[definition.type]).toBeTruthy();
      expect(typeof definition.defaultConfig).toBe('function');
      expect(typeof definition.run).toBe('function');
    }
  });
});
