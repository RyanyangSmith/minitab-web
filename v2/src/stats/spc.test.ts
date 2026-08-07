import { describe, it, expect } from 'vitest';
import { spcAnalysis } from './spc';

describe('spcAnalysis', () => {
  it('computes I-MR centerline and control limits', () => {
    const result = spcAnalysis({
      chartType: 'i-mr',
      values: [10, 12, 11, 13, 12, 14, 11],
    });
    expect(result.charts).toHaveLength(2);
    const i = result.charts[0];
    const mr = result.charts[1];
    expect(i.centerline).toBeCloseTo(11.857, 3);
    expect(mr.centerline).toBeCloseTo(1.833, 3);
    expect(i.ucl[0]).toBeGreaterThan(i.centerline);
    expect(mr.lcl[0]).toBe(0);
  });

  it('computes Xbar-R charts with subgroup constants', () => {
    const result = spcAnalysis({
      chartType: 'xbar-r',
      values: [1, 2, 3, 2, 3, 4, 3, 4, 5],
      subgroupSize: 3,
    });
    expect(result.charts).toHaveLength(2);
    const xbar = result.charts[0];
    expect(xbar.centerline).toBeCloseTo(3, 3);
    expect(xbar.ucl[0]).toBeCloseTo(3 + 1.023 * 2, 3);
  });

  it('computes P chart variable control limits', () => {
    const result = spcAnalysis({
      chartType: 'p',
      counts: [1, 2, 1],
      sizes: [10, 10, 10],
    });
    expect(result.charts).toHaveLength(1);
    const chart = result.charts[0];
    expect(chart.centerline).toBeCloseTo(0.1333, 3);
    expect(chart.ucl[0]).toBeGreaterThan(chart.centerline);
    expect(chart.lcl[0]).toBe(0);
  });

  it('computes C chart limits from the Poisson formula', () => {
    const result = spcAnalysis({
      chartType: 'c',
      counts: [1, 2, 3, 2],
    });
    const chart = result.charts[0];
    expect(chart.centerline).toBe(2);
    expect(chart.ucl[0]).toBeCloseTo(2 + 3 * Math.sqrt(2), 6);
  });

  it('marks points outside control limits', () => {
    const result = spcAnalysis({
      chartType: 'c',
      counts: [2, 2, 20, 2],
    });
    expect(result.charts[0].outOfControl).toContain(2);
  });
});
