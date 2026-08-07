import { descriptiveStats } from './descriptive';
import { tCDF, tQuantile, fCDF, chiSquareCDF } from './distributions';

export interface TTestResult {
  test: 'one-sample' | 'two-sample' | 'paired';
  statistic: number;
  df: number;
  pValue: number;
  ciLower: number;
  ciUpper: number;
  mean1: number;
  mean2?: number;
  sd1: number;
  sd2?: number;
  n1: number;
  n2?: number;
}

export function oneSampleT(data: number[], mu0: number): TTestResult | null {
  const s = descriptiveStats(data);
  if (s.n < 2) return null;
  const se = s.stddev / Math.sqrt(s.n);
  const df = s.n - 1;
  if (se === 0) {
    const statistic = s.mean === mu0 ? 0 : s.mean > mu0 ? Infinity : -Infinity;
    return {
      test: 'one-sample',
      statistic,
      df,
      pValue: statistic === 0 ? 1 : 0,
      ciLower: s.mean,
      ciUpper: s.mean,
      mean1: s.mean,
      sd1: 0,
      n1: s.n,
    };
  }
  const statistic = (s.mean - mu0) / se;
  const pValue = 2 * (1 - tCDF(Math.abs(statistic), df));
  const t = tQuantile(0.975, df);
  return {
    test: 'one-sample',
    statistic,
    df,
    pValue,
    ciLower: s.mean - t * se,
    ciUpper: s.mean + t * se,
    mean1: s.mean,
    sd1: s.stddev,
    n1: s.n,
  };
}

export function twoSampleT(a: number[], b: number[]): TTestResult | null {
  const sa = descriptiveStats(a);
  const sb = descriptiveStats(b);
  if (sa.n < 2 || sb.n < 2) return null;
  const se = Math.sqrt(sa.variance / sa.n + sb.variance / sb.n);
  const df =
    (sa.variance / sa.n + sb.variance / sb.n) ** 2 /
    ((sa.variance / sa.n) ** 2 / (sa.n - 1) +
      (sb.variance / sb.n) ** 2 / (sb.n - 1));
  if (se === 0) {
    const statistic = sa.mean === sb.mean ? 0 : sa.mean > sb.mean ? Infinity : -Infinity;
    return {
      test: 'two-sample',
      statistic,
      df,
      pValue: statistic === 0 ? 1 : 0,
      ciLower: sa.mean - sb.mean,
      ciUpper: sa.mean - sb.mean,
      mean1: sa.mean,
      mean2: sb.mean,
      sd1: 0,
      sd2: 0,
      n1: sa.n,
      n2: sb.n,
    };
  }
  const statistic = (sa.mean - sb.mean) / se;
  const pValue = 2 * (1 - tCDF(Math.abs(statistic), df));
  const t = tQuantile(0.975, df);
  const diff = sa.mean - sb.mean;
  return {
    test: 'two-sample',
    statistic,
    df,
    pValue,
    ciLower: diff - t * se,
    ciUpper: diff + t * se,
    mean1: sa.mean,
    mean2: sb.mean,
    sd1: sa.stddev,
    sd2: sb.stddev,
    n1: sa.n,
    n2: sb.n,
  };
}

export function pairedT(a: number[], b: number[]): TTestResult | null {
  const n = Math.min(a.length, b.length);
  if (n < 2) return null;
  const diffs: number[] = [];
  for (let i = 0; i < n; i++) diffs.push(a[i] - b[i]);
  const s = descriptiveStats(diffs);
  const se = s.stddev / Math.sqrt(n);
  const df = n - 1;
  if (se === 0) {
    const statistic = s.mean === 0 ? 0 : s.mean > 0 ? Infinity : -Infinity;
    return {
      test: 'paired',
      statistic,
      df,
      pValue: statistic === 0 ? 1 : 0,
      ciLower: s.mean,
      ciUpper: s.mean,
      mean1: s.mean,
      sd1: 0,
      n1: n,
    };
  }
  const statistic = s.mean / se;
  const pValue = 2 * (1 - tCDF(Math.abs(statistic), df));
  const t = tQuantile(0.975, df);
  return {
    test: 'paired',
    statistic,
    df,
    pValue,
    ciLower: s.mean - t * se,
    ciUpper: s.mean + t * se,
    mean1: s.mean,
    sd1: s.stddev,
    n1: n,
  };
}

export interface AnovaGroup {
  name: string;
  values: number[];
}

export interface AnovaResult {
  groups: { name: string; n: number; mean: number; stddev: number }[];
  ssBetween: number;
  ssWithin: number;
  ssTotal: number;
  dfBetween: number;
  dfWithin: number;
  msBetween: number;
  msWithin: number;
  fValue: number;
  pValue: number;
}

export function oneWayAnova(groups: AnovaGroup[]): AnovaResult | null {
  if (groups.length < 2) return null;
  const stats = groups.map((g) => ({
    name: g.name,
    stats: descriptiveStats(g.values),
    values: g.values,
  }));
  const totalN = stats.reduce((sum, g) => sum + g.stats.n, 0);
  const grandMean =
    stats.reduce((sum, g) => sum + g.stats.mean * g.stats.n, 0) / totalN;
  let ssBetween = 0;
  let ssWithin = 0;
  for (const g of stats) {
    ssBetween += g.stats.n * (g.stats.mean - grandMean) ** 2;
    for (const value of g.values) {
      ssWithin += (value - g.stats.mean) ** 2;
    }
  }
  const dfBetween = groups.length - 1;
  const dfWithin = totalN - groups.length;
  if (dfWithin <= 0) return null;
  const msBetween = ssBetween / dfBetween;
  const msWithin = ssWithin / dfWithin;
  const fValue =
    msWithin === 0 ? (msBetween === 0 ? 0 : Infinity) : msBetween / msWithin;
  const pValue =
    fValue === Infinity ? 0 : 1 - fCDF(fValue, dfBetween, dfWithin);
  return {
    groups: stats.map((g) => ({
      name: g.name,
      n: g.stats.n,
      mean: g.stats.mean,
      stddev: g.stats.stddev,
    })),
    ssBetween,
    ssWithin,
    ssTotal: ssBetween + ssWithin,
    dfBetween,
    dfWithin,
    msBetween,
    msWithin,
    fValue,
    pValue,
  };
}

export interface ChiSquareResult {
  rows: string[];
  cols: string[];
  observed: number[][];
  expected: number[][];
  chiSquare: number;
  df: number;
  pValue: number;
}

export function chiSquareTest(
  a: (string | number)[],
  b: (string | number)[]
): ChiSquareResult | null {
  const n = Math.min(a.length, b.length);
  if (n === 0) return null;
  const rows: string[] = [];
  const cols: string[] = [];
  const rowIndex = new Map<string, number>();
  const colIndex = new Map<string, number>();
  const observed: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row = String(a[i]);
    const col = String(b[i]);
    if (!rowIndex.has(row)) {
      rowIndex.set(row, rows.length);
      rows.push(row);
      observed.push([]);
    }
    if (!colIndex.has(col)) {
      colIndex.set(col, cols.length);
      cols.push(col);
    }
  }
  for (let r = 0; r < rows.length; r++) {
    observed[r] = new Array(cols.length).fill(0);
  }
  for (let i = 0; i < n; i++) {
    observed[rowIndex.get(String(a[i]))!][colIndex.get(String(b[i]))!] += 1;
  }
  if (rows.length < 2 || cols.length < 2) return null;
  const rowTotals = observed.map((row) => row.reduce((x, y) => x + y, 0));
  const colTotals = cols.map((_, c) =>
    observed.reduce((sum, row) => sum + row[c], 0)
  );
  const total = rowTotals.reduce((x, y) => x + y, 0);
  const expected = rows.map((_, r) =>
    cols.map((_, c) => (rowTotals[r] * colTotals[c]) / total)
  );
  let chiSquare = 0;
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < cols.length; c++) {
      if (expected[r][c] > 0) {
        chiSquare +=
          (observed[r][c] - expected[r][c]) ** 2 / expected[r][c];
      }
    }
  }
  const df = (rows.length - 1) * (cols.length - 1);
  return {
    rows,
    cols,
    observed,
    expected,
    chiSquare,
    df,
    pValue: 1 - chiSquareCDF(chiSquare, df),
  };
}
