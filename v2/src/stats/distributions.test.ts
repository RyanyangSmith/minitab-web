import { describe, it, expect } from 'vitest';
import { tQuantile, chiSquareCDF, normalCDF } from './distributions';

describe('distribution helpers', () => {
  it('matches common t quantiles', () => {
    expect(tQuantile(0.975, 10)).toBeCloseTo(2.2281, 3);
    expect(tQuantile(0.975, 30)).toBeCloseTo(2.0423, 3);
  });

  it('matches common chi-square probabilities', () => {
    expect(chiSquareCDF(3.841, 1)).toBeCloseTo(0.95, 2);
    expect(chiSquareCDF(9.488, 4)).toBeCloseTo(0.95, 2);
  });

  it('keeps normal CDF consistent', () => {
    expect(normalCDF(1.96)).toBeCloseTo(0.975, 3);
  });
});
