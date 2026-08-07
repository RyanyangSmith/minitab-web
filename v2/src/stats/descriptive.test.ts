import { describe, it, expect } from 'vitest';
import { descriptiveStats, descriptiveSummary } from './descriptive';

describe('descriptiveStats', () => {
  it('computes basic statistics for 1..5', () => {
    const s = descriptiveStats([1, 2, 3, 4, 5]);
    expect(s.n).toBe(5);
    expect(s.sum).toBe(15);
    expect(s.mean).toBe(3);
    expect(s.variance).toBe(2.5);
    expect(s.stddev).toBeCloseTo(Math.sqrt(2.5), 12);
    expect(s.min).toBe(1);
    expect(s.max).toBe(5);
    expect(s.q1).toBe(2);
    expect(s.median).toBe(3);
    expect(s.q3).toBe(4);
  });

  it('returns zeros for an empty array', () => {
    const s = descriptiveStats([]);
    expect(s).toEqual({ mean: 0, stddev: 0, variance: 0, min: 0, max: 0, q1: 0, median: 0, q3: 0, n: 0, sum: 0 });
  });

  it('handles a single value', () => {
    const s = descriptiveStats([7]);
    expect(s.mean).toBe(7);
    expect(s.variance).toBe(0);
    expect(s.stddev).toBe(0);
    expect(s.q1).toBe(7);
  });

  it('computes a 95% confidence interval in the summary', () => {
    const summary = descriptiveSummary([2, 4, 4, 4, 5, 5, 7, 9], 'C1');
    expect(summary.n).toBe(8);
    expect(summary.mean).toBeCloseTo(5, 10);
    expect(summary.ciLower).toBeLessThan(summary.mean);
    expect(summary.ciUpper).toBeGreaterThan(summary.mean);
    expect(summary.range).toBe(7);
  });
});
