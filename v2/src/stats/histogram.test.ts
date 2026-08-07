import { describe, it, expect } from 'vitest';
import { computeHistogramBins } from './histogram';

describe('computeHistogramBins', () => {
  it('keeps small samples above the minimum bin count', () => {
    const bins = computeHistogramBins([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(bins.bins).toBeGreaterThanOrEqual(8);
    expect(bins.binWidth).toBeGreaterThan(0);
    expect(bins.min).toBeLessThanOrEqual(1);
    expect(bins.max).toBeGreaterThanOrEqual(10);
  });

  it('uses more bins for larger data sets instead of a fixed count', () => {
    const small = computeHistogramBins(
      Array.from({ length: 50 }, (_, i) => i % 10)
    );
    const large = computeHistogramBins(
      Array.from({ length: 2000 }, (_, i) => i % 200)
    );
    expect(large.bins).toBeGreaterThanOrEqual(small.bins);
    expect(large.bins).toBeGreaterThanOrEqual(8);
  });

  it('handles constant data without dividing by zero', () => {
    const bins = computeHistogramBins([5, 5, 5, 5]);
    expect(bins.bins).toBeGreaterThanOrEqual(1);
    expect(bins.binWidth).toBeGreaterThan(0);
    expect(bins.min).toBeLessThanOrEqual(5);
    expect(bins.max).toBeGreaterThanOrEqual(5);
  });

  it('keeps very large and very small numeric ranges visible', () => {
    const bins = computeHistogramBins([1000000, 1000050, 1000100, 1000200]);
    expect(bins.bins).toBeGreaterThanOrEqual(8);
    expect(bins.min).toBeLessThanOrEqual(1000000);
    expect(bins.max).toBeGreaterThanOrEqual(1000200);
  });

  it('respects explicit min and max bin options', () => {
    const bins = computeHistogramBins(
      Array.from({ length: 1000 }, (_, i) => i),
      { minBins: 12, maxBins: 24 }
    );
    expect(bins.bins).toBeGreaterThanOrEqual(12);
    expect(bins.bins).toBeLessThanOrEqual(24);
  });

  it('keeps bins at least as wide as the typical data step', () => {
    const values = Array.from({ length: 10 }, (_, i) => i * 0.5);
    const bins = computeHistogramBins(values);
    expect(bins.binWidth).toBeGreaterThanOrEqual(0.499);
  });

  it('caps default bins to avoid a crowded histogram', () => {
    const values = Array.from(
      { length: 1000 },
      (_, i) => 100 + i * 0.001
    );
    const bins = computeHistogramBins(values);
    expect(bins.bins).toBeLessThanOrEqual(30);
  });
});
