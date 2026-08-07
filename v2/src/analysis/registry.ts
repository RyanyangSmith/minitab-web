import {
  Activity,
  BarChart3,
  BarChartHorizontal,
  FlaskConical,
  Gauge,
  LayoutList,
  Ruler,
  ScatterChart,
  Table2,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { useTableStore } from '../store/tableStore';
import { capabilityAnalysis } from '../stats/capability';
import { descriptiveStats } from '../stats/descriptive';
import { linearRegression } from '../stats/regression';
import { normalityTest } from '../stats/normality';
import { descriptiveSummary } from '../stats/descriptive';
import { spcAnalysis, type SpcChartType } from '../stats/spc';
import {
  oneSampleT,
  twoSampleT,
  pairedT,
  oneWayAnova,
  chiSquareTest,
} from '../stats/hypothesis';
import { gageRRAnalysis } from '../stats/gageRR';
import type { AnalysisType } from '../types';
import { zh } from '../i18n/zh';
import { columnName } from '../utils/columnName';

export interface AnalysisDefinition {
  type: AnalysisType;
  label: string;
  icon: LucideIcon;
  defaultConfig: (tableId: string) => Record<string, unknown>;
  run: (
    tableId: string,
    config: Record<string, unknown>
  ) => { config: Record<string, unknown>; data: Record<string, unknown> };
}

function columnsWithData(tableId: string, count: number): number[] {
  const table = useTableStore.getState().tables[tableId];
  if (!table) return [];
  const cols: number[] = [];
  for (let c = 0; c < table.columns && cols.length < count; c++) {
    const data = useTableStore.getState().getColumnData(tableId, c);
    if (data.length >= 2) cols.push(c);
  }
  return cols;
}

function columnsWithAnyData(tableId: string, count: number): number[] {
  const table = useTableStore.getState().tables[tableId];
  if (!table) return [];
  const cols: number[] = [];
  for (let c = 0; c < table.columns && cols.length < count; c++) {
    if (useTableStore.getState().getColumnValues(tableId, c).length >= 2) {
      cols.push(c);
    }
  }
  return cols;
}

function columnLabel(tableId: string, col: number): string {
  const sub = useTableStore.getState().getSubHeader(tableId, col);
  return sub || columnName(col);
}

function defaultCapabilityTitle(
  tableId: string,
  col: number | undefined
): string {
  if (col == null) return zh.analysis.capability;
  const subHeader = useTableStore.getState().getSubHeader(tableId, col);
  return `${subHeader || columnName(col)} ${zh.analysis.capability}`;
}

export const analysisRegistry: Record<AnalysisType, AnalysisDefinition> = {
  'capability-analysis': {
    type: 'capability-analysis',
    label: zh.analysis.capability,
    icon: Gauge,
    defaultConfig: (tableId) => ({ col: columnsWithData(tableId, 1)[0] }),
    run: (tableId, config) => {
      const col = config.col as number | undefined;
      const data = col == null ? [] : useTableStore.getState().getColumnData(tableId, col);
      let result = null;
      let lsl: number | undefined;
      let usl: number | undefined;
      let target: number | undefined;
      const title =
        typeof config.title === 'string' && config.title.trim() !== ''
          ? config.title
          : defaultCapabilityTitle(tableId, col);
      if (data.length >= 2) {
        const stats = descriptiveStats(data);
        const autoLsl = stats.mean - 3 * stats.stddev;
        const autoUsl = stats.mean + 3 * stats.stddev;
        lsl = typeof config.lsl === 'number' ? config.lsl : autoLsl;
        usl = typeof config.usl === 'number' ? config.usl : autoUsl;
        target = typeof config.target === 'number' ? config.target : (lsl + usl) / 2;
        result = capabilityAnalysis(data, { lsl, usl, target });
      }
      return {
        config: { col, lsl, usl, target, title },
        data: { result },
      };
    },
  },
  'normality-test': {
    type: 'normality-test',
    label: zh.analysis.normality,
    icon: BarChart3,
    defaultConfig: (tableId) => ({ col: columnsWithData(tableId, 1)[0] }),
    run: (tableId, config) => {
      const col = config.col as number | undefined;
      const data = col == null ? [] : useTableStore.getState().getColumnData(tableId, col);
      const norm = data.length >= 3 ? normalityTest(data) : null;
      return { config: { col }, data: { norm } };
    },
  },
  'linear-regression': {
    type: 'linear-regression',
    label: zh.analysis.linearRegression,
    icon: TrendingUp,
    defaultConfig: (tableId) => {
      const [xCol, yCol] = columnsWithData(tableId, 2);
      return { xCol, yCol };
    },
    run: (tableId, config) => {
      const xCol = config.xCol as number | undefined;
      const yCol = config.yCol as number | undefined;
      const pairs =
        xCol == null || yCol == null
          ? []
          : useTableStore.getState().getColumnPairs(tableId, xCol, yCol);
      const result =
        pairs.length >= 3
          ? linearRegression(pairs.map((p) => p.a), pairs.map((p) => p.b))
          : null;
      return { config: { xCol, yCol }, data: { result } };
    },
  },
  'scatter-plot': {
    type: 'scatter-plot',
    label: zh.analysis.scatterPlot,
    icon: ScatterChart,
    defaultConfig: (tableId) => {
      const [xCol, yCol] = columnsWithData(tableId, 2);
      return { xCol, yCol, groupCol: undefined };
    },
    run: (_tableId, config) => ({ config, data: {} }),
  },
  'box-plot': {
    type: 'box-plot',
    label: zh.analysis.boxPlot,
    icon: LayoutList,
    defaultConfig: (tableId) => ({ cols: columnsWithData(tableId, 2) }),
    run: (_tableId, config) => ({ config, data: {} }),
  },
  'pareto-chart': {
    type: 'pareto-chart',
    label: zh.analysis.pareto,
    icon: BarChartHorizontal,
    defaultConfig: (tableId) => {
      const [defectCol, freqCol] = columnsWithData(tableId, 2);
      return { defectCol, freqCol };
    },
    run: (_tableId, config) => ({ config, data: {} }),
  },
  'descriptive-statistics': {
    type: 'descriptive-statistics',
    label: zh.analysis.descriptiveStatistics,
    icon: Table2,
    defaultConfig: (tableId) => ({ cols: columnsWithData(tableId, 3) }),
    run: (tableId, config) => {
      const cols = (config.cols as number[] | undefined) ?? [];
      const summaries = cols.map((col) =>
        descriptiveSummary(
          useTableStore.getState().getColumnData(tableId, col),
          columnLabel(tableId, col)
        )
      );
      return { config: { cols }, data: { summaries } };
    },
  },
  'spc-control-chart': {
    type: 'spc-control-chart',
    label: zh.analysis.spc,
    icon: Activity,
    defaultConfig: (tableId) => {
      const [first, second] = columnsWithData(tableId, 2);
      return {
        chartType: 'i-mr',
        dataCol: first,
        subgroupCol: undefined,
        subgroupSize: 5,
        countCol: first,
        sizeCol: second,
        unitCol: second,
      };
    },
    run: (tableId, config) => {
      const chartType = config.chartType as SpcChartType;
      const dataCol = config.dataCol as number | undefined;
      const subgroupCol = config.subgroupCol as number | undefined;
      const subgroupSize = config.subgroupSize as number | undefined;
      const countCol = config.countCol as number | undefined;
      const sizeCol = config.sizeCol as number | undefined;
      const unitCol = config.unitCol as number | undefined;
      const store = useTableStore.getState();

      if (chartType === 'i-mr' || chartType === 'xbar-r' || chartType === 'xbar-s') {
        let values = dataCol == null ? [] : store.getColumnData(tableId, dataCol);
        let subgroupIds: (string | number)[] | undefined;
        if (subgroupCol != null && dataCol != null) {
          const pairs = store
            .getColumnPairsAny(tableId, dataCol, subgroupCol)
            .filter((p) => !isNaN(Number(p.a)));
          values = pairs.map((p) => Number(p.a));
          subgroupIds = pairs.map((p) => p.b);
        }
        const result = spcAnalysis({ chartType, values, subgroupIds, subgroupSize });
        return { config, data: { result } };
      }

      const counts = countCol == null ? [] : store.getColumnData(tableId, countCol);
      const sizes = sizeCol == null ? [] : store.getColumnData(tableId, sizeCol);
      const units = unitCol == null ? [] : store.getColumnData(tableId, unitCol);
      const result = spcAnalysis({ chartType, counts, sizes, units });
      return { config, data: { result } };
    },
  },
  'hypothesis-test': {
    type: 'hypothesis-test',
    label: zh.analysis.hypothesisTest,
    icon: FlaskConical,
    defaultConfig: (tableId) => {
      const [first, second, third] = columnsWithAnyData(tableId, 3);
      return {
        testType: 'one-sample',
        col1: first,
        col2: second,
        groupCol: third,
        mu0: 0,
      };
    },
    run: (tableId, config) => {
      const testType = config.testType as
        | 'one-sample'
        | 'two-sample'
        | 'paired'
        | 'anova'
        | 'chi-square';
      const col1 = config.col1 as number | undefined;
      const col2 = config.col2 as number | undefined;
      const groupCol = config.groupCol as number | undefined;
      const mu0 = typeof config.mu0 === 'number' ? config.mu0 : 0;
      const store = useTableStore.getState();

      if (testType === 'one-sample') {
        const data = col1 == null ? [] : store.getColumnData(tableId, col1);
        return { config, data: { result: oneSampleT(data, mu0) } };
      }
      if (testType === 'two-sample') {
        const a = col1 == null ? [] : store.getColumnData(tableId, col1);
        const b = col2 == null ? [] : store.getColumnData(tableId, col2);
        return { config, data: { result: twoSampleT(a, b) } };
      }
      if (testType === 'paired') {
        const pairs =
          col1 == null || col2 == null
            ? []
            : store.getColumnPairs(tableId, col1, col2);
        return {
          config,
          data: {
            result: pairedT(
              pairs.map((p) => p.a),
              pairs.map((p) => p.b)
            ),
          },
        };
      }
      if (testType === 'anova') {
        const pairs =
          col1 == null || groupCol == null
            ? []
            : store.getColumnPairsAny(tableId, groupCol, col1);
        const groups = new Map<string, number[]>();
        for (const p of pairs) {
          if (isNaN(Number(p.b))) continue;
          const key = String(p.a);
          const values = groups.get(key) ?? [];
          values.push(Number(p.b));
          groups.set(key, values);
        }
        const result = oneWayAnova(
          [...groups.entries()].map(([name, values]) => ({ name, values }))
        );
        return { config, data: { result } };
      }
      const a = col1 == null ? [] : store.getColumnValues(tableId, col1);
      const b = col2 == null ? [] : store.getColumnValues(tableId, col2);
      return { config, data: { result: chiSquareTest(a, b) } };
    },
  },
  'gage-rr': {
    type: 'gage-rr',
    label: zh.analysis.gageRR,
    icon: Ruler,
    defaultConfig: (tableId) => {
      const [partCol, operatorCol, measurementCol] = columnsWithData(tableId, 3);
      return { partCol, operatorCol, measurementCol };
    },
    run: (tableId, config) => {
      const partCol = config.partCol as number | undefined;
      const operatorCol = config.operatorCol as number | undefined;
      const measurementCol = config.measurementCol as number | undefined;
      const triples =
        partCol == null || operatorCol == null || measurementCol == null
          ? []
          : useTableStore
              .getState()
              .getColumnTriplesAny(tableId, partCol, operatorCol, measurementCol)
              .filter((t) => !isNaN(Number(t.c)));
      const result = gageRRAnalysis({
        parts: triples.map((t) => t.a),
        operators: triples.map((t) => t.b),
        measurements: triples.map((t) => Number(t.c)),
      });
      return { config, data: { result } };
    },
  },
};
