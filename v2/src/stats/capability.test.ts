import { describe, it, expect } from 'vitest';
import { capabilityAnalysis } from './capability';

describe('capabilityAnalysis', () => {
  const data = [1, 2, 3, 4, 5];
  const result = capabilityAnalysis(data, { lsl: 0, usl: 10, target: 3 });

  it('computes overall indices with sample standard deviation', () => {
    expect(result.n).toBe(5);
    expect(result.mean).toBe(3);
    expect(result.overallStddev).toBeCloseTo(Math.sqrt(2.5), 12);
    expect(result.pp).toBeCloseTo(10 / (6 * Math.sqrt(2.5)), 12);
    expect(result.ppk).toBeCloseTo(result.ppl, 12);
  });

  it('uses overall stddev for Cpm (Taguchi)', () => {
    // target == mean, so Cpm = (USL-LSL) / (6 * overall stddev)
    expect(result.cpm).toBeCloseTo(10 / (6 * Math.sqrt(2.5)), 12);
    // Moving-range based within stddev is smaller, so Cp > Pp.
    expect(result.cp).toBeGreaterThan(result.pp);
    expect(result.withinStddev).toBeCloseTo(1 / 1.128, 6);
  });

  it('reports observed PPM correctly', () => {
    expect(result.ppmTotalObs).toBe(0);
    const tight = capabilityAnalysis([1, 2, 3, 4, 5], { lsl: 2, usl: 4, target: 3 });
    expect(tight.ppmBelowLslObs).toBe(200_000);
    expect(tight.ppmAboveUslObs).toBe(200_000);
    expect(tight.ppmTotalObs).toBe(400_000);
  });

  it('computes capability accuracy CA from target deviation', () => {
    expect(result.ca).toBeCloseTo(0, 12);
    const shifted = capabilityAnalysis([4, 5, 6], { lsl: 0, usl: 10, target: 3 });
    expect(shifted.ca).toBeCloseTo(0.4, 12);
  });
});
