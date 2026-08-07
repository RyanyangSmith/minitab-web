import { describe, it, expect } from 'vitest';
import { columnName, columnIndex } from './columnName';

describe('columnName', () => {
  it('maps 0-based indexes to spreadsheet-style names', () => {
    expect(columnName(0)).toBe('C1');
    expect(columnName(1)).toBe('C2');
    expect(columnName(25)).toBe('C26');
    expect(columnName(26)).toBe('AA');
    expect(columnName(51)).toBe('AZ');
    expect(columnName(52)).toBe('BA');
    expect(columnName(701)).toBe('ZZ');
  });

  it('round-trips through columnIndex', () => {
    for (const idx of [0, 1, 25, 26, 51, 52, 701, 702]) {
      expect(columnIndex(columnName(idx))).toBe(idx);
    }
  });

  it('parses spreadsheet-style boundaries directly', () => {
    expect(columnIndex('C1')).toBe(0);
    expect(columnIndex('C26')).toBe(25);
    expect(columnIndex('AA')).toBe(26);
    expect(columnIndex('AZ')).toBe(51);
    expect(columnIndex('BA')).toBe(52);
    expect(columnIndex('ZZ')).toBe(701);
  });
});
