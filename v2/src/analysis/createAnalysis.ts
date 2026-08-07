import { analysisRegistry } from './registry';
import { useTableStore } from '../store/tableStore';
import { useAnalysisStore } from '../store/analysisStore';
import type { AnalysisType } from '../types';

export function createAnalysis(
  tableId: string,
  type: AnalysisType
): string | null {
  const definition = analysisRegistry[type];
  const table = useTableStore.getState().tables[tableId];
  if (!definition || !table) return null;

  const config = definition.defaultConfig(tableId);
  const result = definition.run(tableId, config);
  return useAnalysisStore
    .getState()
    .addResult(tableId, type, result.config, result.data);
}
