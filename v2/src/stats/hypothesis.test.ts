import { describe, it, expect } from 'vitest';
import {
  oneSampleT,
  twoSampleT,
  pairedT,
  oneWayAnova,
  chiSquareTest,
} from './hypothesis';

describe('hypothesis tests', () => {
  it('returns a zero t statistic when the mean equals the hypothesized value', () => {
    const result = oneSampleT([2, 4, 4, 4, 5, 5, 7, 9], 5)!;
    expect(result.statistic).toBeCloseTo(0, 10);
    expect(result.pValue).toBe(1);
    expect(result.ciLower).toBeLessThan(result.ciUpper);
  });

  it('compares two independent samples with Welch df', () => {
    const result = twoSampleT([1, 2, 3], [4, 5, 6])!;
    expect(result.statistic).toBeLessThan(0);
    expect(result.pValue).toBeGreaterThan(0);
    expect(result.pValue).toBeLessThan(0.1);
  });

  it('tests paired differences', () => {
    const result = pairedT([2, 3, 4, 5], [1, 2, 3, 4])!;
    expect(result.statistic).toBeGreaterThan(10);
    expect(result.pValue).toBeLessThan(0.01);
  });

  it('runs one-way ANOVA and reports F and p', () => {
    const result = oneWayAnova([
      { name: 'A', values: [1, 2, 3] },
      { name: 'B', values: [10, 11, 12] },
    ])!;
    expect(result.fValue).toBeGreaterThan(10);
    expect(result.pValue).toBeLessThan(0.01);
  });

  it('builds a chi-square contingency table', () => {
    const result = chiSquareTest(
      ['A', 'A', 'B', 'B', 'A', 'B'],
      ['X', 'Y', 'X', 'Y', 'X', 'Y']
    )!;
    expect(result.rows).toEqual(['A', 'B']);
    expect(result.cols).toEqual(['X', 'Y']);
    expect(result.df).toBe(1);
    expect(result.pValue).toBeGreaterThan(0);
  });
});
