import { describe, it, expect } from 'vitest';
import { computeAxisRange } from './axisRange';

describe('computeAxisRange', () => {
  it('adds padding around ordinary data', () => {
    expect(computeAxisRange([1000, 1001, 1002])).toEqual({
      min: 999.84,
      max: 1002.16,
    });
  });

  it('expands constant data instead of returning a zero-width range', () => {
    expect(computeAxisRange([5, 5, 5])).toEqual({ min: 4.75, max: 5.25 });
  });

  it('returns a sane range for empty input', () => {
    expect(computeAxisRange([])).toEqual({ min: 0, max: 1 });
  });
});
