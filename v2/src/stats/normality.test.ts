import { describe, it, expect } from 'vitest';
import { normalityTest } from './normality';

// Values below are scipy.stats.shapiro/anderson anchors on fixed inputs.
describe('normalityTest', () => {
  const normalish = [-1.82, -1.28, -0.84, -0.52, -0.25, 0, 0.25, 0.52, 0.84, 1.28];
  const skewed = [1, 1, 1, 2, 2, 3, 4, 5, 8, 12, 20, 35];

  it('accepts approximately normal data', () => {
    const r = normalityTest(normalish);
    expect(r.n).toBe(10);
    expect(r.sw.statistic).toBeCloseTo(0.9896251142462569, 10);
    expect(r.sw.pValue).toBeCloseTo(0.9963396, 6);
    expect(r.ad.statistic).toBeCloseTo(0.095094, 5);
    expect(r.ad.pValue).toBeGreaterThan(0.05);
    expect(r.ks.statistic).toBeCloseTo(0.0750012, 6);
    expect(r.ks.pValue).toBeGreaterThan(0.1);
  });

  it('rejects clearly skewed data', () => {
    const r = normalityTest(skewed);
    expect(r.sw.statistic).toBeCloseTo(0.7151054236040236, 8);
    expect(r.sw.pValue).toBeLessThan(0.05);
    expect(r.ad.statistic).toBeCloseTo(1.3702643, 5);
    expect(r.ad.pValue).toBeLessThan(0.05);
    expect(r.ks.statistic).toBeCloseTo(0.2754642, 6);
  });

  it('keeps p-values inside [0, 1]', () => {
    const r = normalityTest(normalish);
    for (const t of [r.ad, r.sw, r.ks]) {
      expect(t.pValue).toBeGreaterThanOrEqual(0);
      expect(t.pValue).toBeLessThanOrEqual(1);
    }
  });

  it('returns NaN statistics for tiny or constant samples', () => {
    expect(normalityTest([1, 2]).sw.statistic).toBeNaN();
    expect(normalityTest([5, 5, 5, 5]).sw.statistic).toBeNaN();
  });
});
