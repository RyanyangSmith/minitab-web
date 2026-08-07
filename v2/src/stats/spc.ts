export type SpcChartType =
  | 'i-mr'
  | 'xbar-r'
  | 'xbar-s'
  | 'p'
  | 'np'
  | 'c'
  | 'u';

export interface SpcChartResult {
  title: string;
  points: { index: number; value: number }[];
  centerline: number;
  ucl: (number | null)[];
  lcl: (number | null)[];
  outOfControl: number[];
}

export interface SpcResult {
  charts: SpcChartResult[];
  warnings: string[];
}

export interface SpcAnalysisConfig {
  chartType: SpcChartType;
  values?: number[];
  subgroupIds?: (string | number)[];
  subgroupSize?: number;
  counts?: number[];
  sizes?: number[];
  units?: number[];
}

const A2: Record<number, number> = {
  2: 1.88, 3: 1.023, 4: 0.729, 5: 0.577, 6: 0.483,
  7: 0.419, 8: 0.373, 9: 0.337, 10: 0.308,
};
const A3: Record<number, number> = {
  2: 2.659, 3: 1.954, 4: 1.628, 5: 1.427, 6: 1.287,
  7: 1.182, 8: 1.099, 9: 1.032, 10: 0.975,
};
const D3: Record<number, number> = {
  2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0.076,
  8: 0.136, 9: 0.184, 10: 0.223,
};
const D4: Record<number, number> = {
  2: 3.267, 3: 2.574, 4: 2.282, 5: 2.114, 6: 2.004,
  7: 1.924, 8: 1.864, 9: 1.816, 10: 1.777,
};
const B3: Record<number, number> = {
  2: 0, 3: 0, 4: 0, 5: 0, 6: 0.03, 7: 0.118,
  8: 0.185, 9: 0.239, 10: 0.284,
};
const B4: Record<number, number> = {
  2: 3.267, 3: 2.568, 4: 2.266, 5: 2.089, 6: 1.97,
  7: 1.882, 8: 1.815, 9: 1.761, 10: 1.716,
};

export function spcAnalysis(config: SpcAnalysisConfig): SpcResult {
  const warnings: string[] = [];
  const { chartType } = config;
  if (chartType === 'i-mr') return iMrAnalysis(config.values ?? []);
  if (chartType === 'xbar-r' || chartType === 'xbar-s') {
    return xbarAnalysis(
      chartType,
      config.values ?? [],
      config.subgroupIds,
      config.subgroupSize,
      warnings
    );
  }
  if (chartType === 'p') return pChartAnalysis(config.counts ?? [], config.sizes ?? []);
  if (chartType === 'np') return npChartAnalysis(config.counts ?? [], config.sizes ?? []);
  if (chartType === 'c') return cChartAnalysis(config.counts ?? []);
  return uChartAnalysis(config.counts ?? [], config.units ?? []);
}

function iMrAnalysis(values: number[]): SpcResult {
  if (values.length < 2) return { charts: [], warnings: ['数据点不足'] };
  const mean = average(values);
  const mrs = movingRanges(values);
  const mrMean = average(mrs);
  const sigma = mrMean / 1.128;
  const xUcl = mean + 3 * sigma;
  const xLcl = mean - 3 * sigma;
  const mrUcl = D4[2] * mrMean;
  const xChart = makeChart('I 单值图', values, mean, xUcl, xLcl);
  const mrChart = makeChart('MR 移动极差图', mrs, mrMean, mrUcl, 0);
  return { charts: [xChart, mrChart], warnings: [] };
}

function xbarAnalysis(
  chartType: 'xbar-r' | 'xbar-s',
  values: number[],
  subgroupIds: (string | number)[] | undefined,
  subgroupSize: number | undefined,
  warnings: string[]
): SpcResult {
  const groups = buildSubgroups(values, subgroupIds, subgroupSize);
  if (groups.length < 2) {
    warnings.push('有效子组不足');
    return { charts: [], warnings };
  }
  const n = groups[0].values.length;
  const xbars = groups.map((g) => average(g.values));
  const spreads = groups.map((g) =>
    chartType === 'xbar-r' ? Math.max(...g.values) - Math.min(...g.values) : sampleStddev(g.values)
  );
  const grandMean = average(xbars);
  const meanSpread = average(spreads);

  if (chartType === 'xbar-r') {
    const a2 = A2[n];
    const d3 = D3[n];
    const d4 = D4[n];
    const xChart = makeChart(
      'Xbar 均值图',
      xbars,
      grandMean,
      grandMean + a2 * meanSpread,
      grandMean - a2 * meanSpread
    );
    const rChart = makeChart(
      'R 极差图',
      spreads,
      meanSpread,
      d4 * meanSpread,
      d3 * meanSpread
    );
    return { charts: [xChart, rChart], warnings };
  }

  const a3 = A3[n];
  const b3 = B3[n];
  const b4 = B4[n];
  const xChart = makeChart(
    'Xbar 均值图',
    xbars,
    grandMean,
    grandMean + a3 * meanSpread,
    grandMean - a3 * meanSpread
  );
  const sChart = makeChart(
    'S 标准差图',
    spreads,
    meanSpread,
    b4 * meanSpread,
    b3 * meanSpread
  );
  return { charts: [xChart, sChart], warnings };
}

function pChartAnalysis(counts: number[], sizes: number[]): SpcResult {
  if (counts.length === 0 || counts.some((_, i) => sizes[i] <= 0)) {
    return { charts: [], warnings: ['P 图需要有效的不良数与样本量'] };
  }
  const pbar = sum(counts) / sum(sizes);
  const points = counts.map((c, i) => ({ index: i, value: c / sizes[i] }));
  const ucl = sizes.map((n) => pbar + 3 * Math.sqrt((pbar * (1 - pbar)) / n));
  const lcl = sizes.map((n) => Math.max(0, pbar - 3 * Math.sqrt((pbar * (1 - pbar)) / n)));
  const chart = makeChart('P 不合格率图', points, pbar, ucl, lcl);
  return { charts: [chart], warnings: [] };
}

function npChartAnalysis(counts: number[], sizes: number[]): SpcResult {
  if (counts.length === 0 || sizes.length === 0 || sizes.some((s) => s <= 0)) {
    return { charts: [], warnings: ['NP 图需要固定样本量'] };
  }
  const size = sizes[0];
  if (sizes.some((s) => s !== size)) {
    return { charts: [], warnings: ['NP 图要求各子组样本量相同'] };
  }
  const npBar = average(counts);
  const pbar = npBar / size;
  const ucl = npBar + 3 * Math.sqrt(npBar * (1 - pbar));
  const lcl = Math.max(0, npBar - 3 * Math.sqrt(npBar * (1 - pbar)));
  const chart = makeChart('NP 不合格数图', counts, npBar, ucl, lcl);
  return { charts: [chart], warnings: [] };
}

function cChartAnalysis(counts: number[]): SpcResult {
  if (counts.length === 0) return { charts: [], warnings: ['C 图数据不足'] };
  const cBar = average(counts);
  const ucl = cBar + 3 * Math.sqrt(cBar);
  const lcl = Math.max(0, cBar - 3 * Math.sqrt(cBar));
  const chart = makeChart('C 缺陷数图', counts, cBar, ucl, lcl);
  return { charts: [chart], warnings: [] };
}

function uChartAnalysis(counts: number[], units: number[]): SpcResult {
  if (counts.length === 0 || units.some((u) => u <= 0)) {
    return { charts: [], warnings: ['U 图需要有效缺陷数与检验单位'] };
  }
  const uBar = sum(counts) / sum(units);
  const points = counts.map((c, i) => ({ index: i, value: c / units[i] }));
  const ucl = units.map((u) => uBar + 3 * Math.sqrt(uBar / u));
  const lcl = units.map((u) => Math.max(0, uBar - 3 * Math.sqrt(uBar / u)));
  const chart = makeChart('U 单位缺陷数图', points, uBar, ucl, lcl);
  return { charts: [chart], warnings: [] };
}

function makeChart(
  title: string,
  valuesOrPoints: number[] | { index: number; value: number }[],
  centerline: number,
  ucl: number | (number | null)[],
  lcl: number | (number | null)[]
): SpcChartResult {
  let points: { index: number; value: number }[];
  if (Array.isArray(valuesOrPoints)) {
    points = (valuesOrPoints as number[]).map((value, index) => ({
      index,
      value,
    }));
  } else {
    points = valuesOrPoints;
  }
  const uclArray = Array.isArray(ucl)
    ? ucl
    : points.map(() => ucl);
  const lclArray = Array.isArray(lcl)
    ? lcl
    : points.map(() => lcl);
  return {
    title,
    points,
    centerline,
    ucl: uclArray,
    lcl: lclArray,
    outOfControl: detectOutOfControl(points, centerline, uclArray, lclArray),
  };
}

function detectOutOfControl(
  points: { index: number; value: number }[],
  centerline: number,
  ucl: (number | null)[],
  lcl: (number | null)[]
): number[] {
  const violations = new Set<number>();
  let sameSideRun = 0;
  let lastSide = 0;
  let incRun = 0;
  let decRun = 0;
  let altRun = 0;
  let lastDiffSign = 0;

  for (let i = 0; i < points.length; i++) {
    const value = points[i].value;
    const u = ucl[i];
    const l = lcl[i];
    if ((u != null && value > u) || (l != null && value < l)) {
      violations.add(i);
    }

    const side = value > centerline ? 1 : value < centerline ? -1 : 0;
    sameSideRun = side === lastSide ? sameSideRun + 1 : 1;
    lastSide = side;
    if (sameSideRun >= 9) {
      for (let k = i - sameSideRun + 1; k <= i; k++) violations.add(k);
    }

    if (i > 0) {
      const diff = points[i].value - points[i - 1].value;
      if (diff > 0) {
        incRun += 1;
        decRun = 0;
      } else if (diff < 0) {
        decRun += 1;
        incRun = 0;
      } else {
        incRun = 0;
        decRun = 0;
      }
      if (incRun >= 6) {
        for (let k = i - incRun + 1; k <= i; k++) violations.add(k);
      }
      if (decRun >= 6) {
        for (let k = i - decRun + 1; k <= i; k++) violations.add(k);
      }

      const diffSign = diff > 0 ? 1 : diff < 0 ? -1 : 0;
      altRun = diffSign !== 0 && diffSign !== lastDiffSign ? altRun + 1 : 1;
      lastDiffSign = diffSign;
      if (altRun >= 14) {
        for (let k = i - altRun + 1; k <= i; k++) violations.add(k);
      }
    }
  }
  return [...violations].sort((a, b) => a - b);
}

function buildSubgroups(
  values: number[],
  subgroupIds: (string | number)[] | undefined,
  subgroupSize: number | undefined
): { values: number[] }[] {
  if (subgroupIds && subgroupIds.length === values.length) {
    const map = new Map<string | number, number[]>();
    for (let i = 0; i < values.length; i++) {
      const key = subgroupIds[i];
      const group = map.get(key) ?? [];
      group.push(values[i]);
      map.set(key, group);
    }
    return [...map.values()]
      .filter((g) => g.length >= 2)
      .map((g) => ({ values: g }));
  }
  const size = Math.max(2, subgroupSize ?? 5);
  const groups: { values: number[] }[] = [];
  for (let i = 0; i < values.length; i += size) {
    const group = values.slice(i, i + size);
    if (group.length >= 2) groups.push({ values: group });
  }
  return groups;
}

function movingRanges(values: number[]): number[] {
  const result: number[] = [];
  for (let i = 1; i < values.length; i++) {
    result.push(Math.abs(values[i] - values[i - 1]));
  }
  return result;
}

function sampleStddev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = average(values);
  return Math.sqrt(
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1)
  );
}

function average(values: number[]): number {
  return values.length === 0 ? 0 : sum(values) / values.length;
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}
