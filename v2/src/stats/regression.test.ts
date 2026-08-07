import { describe, it, expect } from 'vitest';
import { linearRegression } from './regression';

describe('linearRegression', () => {
  it('recovers a perfect linear relationship', () => {
    const x = [1, 2, 3, 4, 5];
    const y = x.map((v) => 2 * v + 1);
    const r = linearRegression(x, y);
    expect(r.slope).toBe(2);
    expect(r.intercept).toBe(1);
    expect(r.rSquared).toBe(1);
    expect(r.r).toBe(1);
    expect(r.standardError).toBe(0);
    expect(r.residuals.every((v) => Math.abs(v) < 1e-12)).toBe(true);
  });

  it('computes reasonable estimates on noisy data', () => {
    const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const y = [2.1, 4.2, 5.8, 8.3, 9.9, 12.4, 13.7, 16.2, 17.8, 20.1];
    const r = linearRegression(x, y);
    expect(r.slope).toBeCloseTo(2.02, 1);
    expect(r.intercept).toBeCloseTo(0.12, 0);
    expect(r.rSquared).toBeGreaterThan(0.99);
    expect(r.anovaTable[1].df).toBe(8);
  });

  it('returns an empty result for fewer than 3 points', () => {
    const r = linearRegression([1, 2], [3, 4]);
    expect(r.coefTable).toHaveLength(0);
    expect(r.slope).toBe(0);
  });
});
