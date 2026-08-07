import { tQuantile } from './distributions';

export interface DescriptiveStats {
  mean: number;
  stddev: number;
  variance: number;
  min: number;
  max: number;
  q1: number;
  median: number;
  q3: number;
  n: number;
  sum: number;
}

export interface DescriptiveSummary {
  label: string;
  n: number;
  mean: number;
  median: number;
  stddev: number;
  variance: number;
  min: number;
  max: number;
  range: number;
  q1: number;
  q3: number;
  ciLower: number;
  ciUpper: number;
}

/**
 * Compute descriptive statistics for a numeric array.
 */
export function descriptiveStats(data: number[]): DescriptiveStats {
  const n = data.length;
  if (n === 0) {
    return { mean: 0, stddev: 0, variance: 0, min: 0, max: 0, q1: 0, median: 0, q3: 0, n: 0, sum: 0 };
  }

  const sorted = [...data].sort((a, b) => a - b);
  const sum = data.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const variance = n === 1 ? 0 : data.reduce((s, x) => s + (x - mean) ** 2, 0) / (n - 1);
  const stddev = Math.sqrt(variance);

  return {
    mean,
    stddev,
    variance,
    min: sorted[0],
    max: sorted[n - 1],
    q1: percentile(sorted, 0.25),
    median: percentile(sorted, 0.5),
    q3: percentile(sorted, 0.75),
    n,
    sum,
  };
}

function percentile(sorted: number[], p: number): number {
  const idx = p * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (idx - lo) * (sorted[hi] - sorted[lo]);
}

export function descriptiveSummary(
  data: number[],
  label: string
): DescriptiveSummary {
  const s = descriptiveStats(data);
  const t = s.n > 1 ? tQuantile(0.975, s.n - 1) : 0;
  const margin = s.n > 1 ? (t * s.stddev) / Math.sqrt(s.n) : 0;
  return {
    label,
    n: s.n,
    mean: s.mean,
    median: s.median,
    stddev: s.stddev,
    variance: s.variance,
    min: s.min,
    max: s.max,
    range: s.max - s.min,
    q1: s.q1,
    q3: s.q3,
    ciLower: s.mean - margin,
    ciUpper: s.mean + margin,
  };
}
