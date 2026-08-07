import { describe, it, expect } from 'vitest';
import { isInRange, normalizeRange } from './range';

describe('range utils', () => {
  it('normalizes inverted ranges', () => {
    expect(normalizeRange({ startRow: 5, startCol: 3, endRow: 2, endCol: 7 })).toEqual({
      startRow: 2,
      startCol: 3,
      endRow: 5,
      endCol: 7,
    });
  });

  it('checks membership in a range', () => {
    const range = { startRow: 2, startCol: 0, endRow: 4, endCol: 2 };
    expect(isInRange(3, 1, range)).toBe(true);
    expect(isInRange(2, 2, range)).toBe(true);
    expect(isInRange(1, 1, range)).toBe(false);
    expect(isInRange(3, 3, range)).toBe(false);
  });
});
