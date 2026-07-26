import { descriptiveStats } from './descriptive';
import { tCDF, fCDF } from './distributions';

export interface RegressionResult {
  slope: number;
  intercept: number;
  r: number;
  rSquared: number;
  adjustedRSquared: number;
  standardError: number;
  fitted: number[];
  residuals: number[];
  // Coefficient table
  coefTable: {
    term: string;
    coefficient: number;
    se: number;
    tValue: number;
    pValue: number;
  }[];
  // ANOVA table
  anovaTable: {
    source: string;
    df: number;
    ss: number;
    ms: number;
    fValue: number;
    pValue: number;
  }[];
}

/**
 * Simple linear regression: y = slope * x + intercept.
 */
export function linearRegression(x: number[], y: number[]): RegressionResult {
  const n = x.length;
  if (n < 3) {
    return {
      slope: 0, intercept: 0, r: 0, rSquared: 0, adjustedRSquared: 0,
      standardError: 0, fitted: [], residuals: [],
      coefTable: [], anovaTable: [],
    };
  }

  const xStats = descriptiveStats(x);
  const yStats = descriptiveStats(y);

  // Calculate slope and intercept
  let ssxy = 0;
  let ssxx = 0;
  for (let i = 0; i < n; i++) {
    ssxy += (x[i] - xStats.mean) * (y[i] - yStats.mean);
    ssxx += (x[i] - xStats.mean) ** 2;
  }

  const slope = ssxx === 0 ? 0 : ssxy / ssxx;
  const intercept = yStats.mean - slope * xStats.mean;

  // Fitted values and residuals
  const fitted = x.map((xi) => slope * xi + intercept);
  const residuals = y.map((yi, i) => yi - fitted[i]);

  // SSE and MSE
  let sse = 0;
  let ssr = 0;
  let sst = 0;
  for (let i = 0; i < n; i++) {
    sse += residuals[i] ** 2;
    ssr += (fitted[i] - yStats.mean) ** 2;
    sst += (y[i] - yStats.mean) ** 2;
  }

  const dfError = n - 2;
  const mse = dfError > 0 ? sse / dfError : 0;
  const standardError = Math.sqrt(mse);
  const msr = ssr; // df = 1

  // R-squared
  const rSquared = sst === 0 ? 0 : 1 - sse / sst;
  const r = slope > 0 ? Math.sqrt(rSquared) : -Math.sqrt(rSquared);
  const adjustedRSquared = dfError > 0 ? 1 - (1 - rSquared) * (n - 1) / dfError : 0;

  // Coefficient standard errors
  const seSlope = ssxx === 0 ? 0 : standardError / Math.sqrt(ssxx);
  const seIntercept = standardError * Math.sqrt(1 / n + (xStats.mean * xStats.mean) / ssxx);

  // t-values and p-values
  const tSlope = seSlope === 0 ? 0 : slope / seSlope;
  const tIntercept = seIntercept === 0 ? 0 : intercept / seIntercept;

  const pSlope = 2 * (1 - tCDF(Math.abs(tSlope), dfError));
  const pIntercept = 2 * (1 - tCDF(Math.abs(tIntercept), dfError));

  const coefTable = [
    { term: '截距', coefficient: intercept, se: seIntercept, tValue: tIntercept, pValue: pIntercept },
    { term: 'X', coefficient: slope, se: seSlope, tValue: tSlope, pValue: pSlope },
  ];

  // ANOVA
  const fValue = mse === 0 ? 0 : msr / mse;
  const pF = 1 - fCDF(fValue, 1, dfError);

  const anovaTable = [
    { source: '回归', df: 1, ss: ssr, ms: msr, fValue, pValue: pF },
    { source: '残差', df: dfError, ss: sse, ms: mse, fValue: 0, pValue: 0 },
    { source: '总计', df: n - 1, ss: sst, ms: 0, fValue: 0, pValue: 0 },
  ];

  return {
    slope, intercept, r, rSquared, adjustedRSquared,
    standardError, fitted, residuals,
    coefTable, anovaTable,
  };
}
