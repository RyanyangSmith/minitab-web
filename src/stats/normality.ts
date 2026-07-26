import { descriptiveStats } from './descriptive';
import { normalCDF } from './distributions';

export interface NormalityResult {
  ad: { statistic: number; pValue: number };
  sw: { statistic: number; pValue: number };
  ks: { statistic: number; pValue: number };
  mean: number;
  stddev: number;
  n: number;
}

/**
 * Anderson-Darling normality test.
 */
function adTest(data: number[]): { statistic: number; pValue: number } {
  const n = data.length;
  if (n < 5) return { statistic: NaN, pValue: NaN };

  const sorted = [...data].sort((a, b) => a - b);
  const { mean, stddev } = descriptiveStats(data);

  if (stddev === 0) return { statistic: NaN, pValue: NaN };

  // Standardize and compute AD statistic
  const z = sorted.map((x) => (x - mean) / stddev);
  const phi = z.map((zi) => normalCDF(zi));

  let s = 0;
  for (let i = 0; i < n; i++) {
    s += (2 * i + 1) * (Math.log(phi[i]) + Math.log(1 - phi[n - 1 - i]));
  }
  const ad = -n - s / n;

  // AD* correction
  const adStar = ad * (1 + 0.75 / n + 2.25 / (n * n));

  // p-value approximation
  let pValue: number;
  if (adStar < 0.2) {
    pValue = 1 - Math.exp(-13.436 + 101.14 * adStar - 223.73 * adStar * adStar);
  } else if (adStar < 0.34) {
    pValue = 1 - Math.exp(-8.318 + 42.796 * adStar - 59.938 * adStar * adStar);
  } else if (adStar < 0.6) {
    pValue = Math.exp(0.9177 - 4.279 * adStar - 1.38 * adStar * adStar);
  } else {
    pValue = Math.exp(1.2937 - 5.709 * adStar + 0.0186 * adStar * adStar);
  }

  return { statistic: ad, pValue: Math.max(0, Math.min(1, pValue)) };
}

/**
 * Shapiro-Wilk normality test approximation.
 */
function swTest(data: number[]): { statistic: number; pValue: number } {
  const n = data.length;
  if (n < 3 || n > 5000) return { statistic: NaN, pValue: NaN };

  const sorted = [...data].sort((a, b) => a - b);
  const { mean } = descriptiveStats(data);

  // Compute sum of squared deviations
  const ss = data.reduce((s, x) => s + (x - mean) ** 2, 0);
  if (ss === 0) return { statistic: NaN, pValue: NaN };

  // Use Royston's approximation
  const m = Math.floor(n / 2);
  const a = new Array<number>(n);

  // Get expected normal order statistics weights (approximation)
  for (let i = 0; i < n; i++) {
    a[i] = normalQuantileBlom(i + 1, n);
  }

  // Normalize weights
  let sumSq = 0;
  for (let i = 0; i < n; i++) sumSq += a[i] * a[i];
  const scale = Math.sqrt(sumSq);
  for (let i = 0; i < n; i++) a[i] /= scale;

  // Compute W
  let b = 0;
  for (let i = 0; i < n; i++) {
    b += a[i] * sorted[i];
  }
  const w = (b * b) / ss;

  // p-value approximation for n >= 3
  let y = Math.log(1 - w);
  const mu = poly(n, [-1.5861, -0.31082, -0.083751, 0.0038915]);
  const sigma = Math.exp(poly(n, [-2.4803, -0.080614, 0.010033, -0.00004214]));
  const z = (y - mu) / sigma;
  const pValue = 1 - normalCDF(z);

  return { statistic: w, pValue };
}

function normalQuantileBlom(i: number, n: number): number {
  const p = (i - 0.375) / (n + 0.25);
  // Simple approximation for normal quantile
  if (p <= 0 || p >= 1) return 0;
  const t = Math.sqrt(-2 * Math.log(Math.min(p, 1 - p)));
  const sign = p < 0.5 ? -1 : 1;
  const q =
    t -
    (2.515517 + 0.802853 * t + 0.010328 * t * t) /
      (1 + 1.432788 * t + 0.189269 * t * t + 0.001308 * t * t * t);
  return sign * q;
}

function poly(x: number, coeffs: number[]): number {
  let result = 0;
  let term = 1;
  for (let i = 0; i < coeffs.length; i++) {
    result += coeffs[i] * term;
    term *= x;
  }
  return result;
}

/**
 * Kolmogorov-Smirnov normality test.
 */
function ksTest(data: number[]): { statistic: number; pValue: number } {
  const n = data.length;
  if (n < 5) return { statistic: NaN, pValue: NaN };

  const sorted = [...data].sort((a, b) => a - b);
  const { mean, stddev } = descriptiveStats(data);

  if (stddev === 0) return { statistic: NaN, pValue: NaN };

  let dMax = 0;
  for (let i = 0; i < n; i++) {
    const z = (sorted[i] - mean) / stddev;
    const f0 = normalCDF(z);
    const f1 = (i + 1) / n;
    const f2 = i / n;
    dMax = Math.max(dMax, Math.abs(f0 - f1), Math.abs(f0 - f2));
  }

  // KS p-value approximation
  const lambda = (Math.sqrt(n) + 0.12 + 0.11 / Math.sqrt(n)) * dMax;
  let pValue = 2 * ksSum(lambda);
  pValue = Math.max(0, Math.min(1, pValue));

  return { statistic: dMax, pValue };
}

function ksSum(lambda: number): number {
  if (lambda < 0.01) return 1;
  let sum = 0;
  for (let k = 1; k <= 100; k++) {
    const term = Math.pow(-1, k - 1) * Math.exp(-2 * k * k * lambda * lambda);
    sum += term;
    if (Math.abs(term) < 1e-10) break;
  }
  return sum;
}

/**
 * Run all three normality tests on a dataset.
 */
export function normalityTest(data: number[]): NormalityResult {
  const stats = descriptiveStats(data);
  return {
    ad: adTest(data),
    sw: swTest(data),
    ks: ksTest(data),
    mean: stats.mean,
    stddev: stats.stddev,
    n: stats.n,
  };
}
