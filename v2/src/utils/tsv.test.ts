import { describe, it, expect } from 'vitest';
import { cellsToTsv, splitTsvBlocks, tsvToCells } from './tsv';

describe('tsv utils', () => {
  it('serializes and parses a simple grid', () => {
    const cells = [
      ['a', 'b'],
      ['1', '2'],
    ];
    const tsv = cellsToTsv(cells);
    expect(tsv).toBe('a\tb\n1\t2');
    expect(tsvToCells(tsv)).toEqual(cells);
  });

  it('treats null as empty string and back', () => {
    const tsv = cellsToTsv([[null, 42]]);
    expect(tsv).toBe('\t42');
    expect(tsvToCells(tsv)).toEqual([['', '42']]);
  });

  it('drops a single trailing empty line', () => {
    expect(tsvToCells('a\tb\n')).toEqual([['a', 'b']]);
    expect(tsvToCells('a\tb\n\n')).toEqual([['a', 'b'], ['']]);
  });

  it('handles CRLF line endings', () => {
    expect(tsvToCells('1\t2\r\n3\t4')).toEqual([['1', '2'], ['3', '4']]);
  });

  it('splits copied blocks on blank lines', () => {
    expect(splitTsvBlocks('a\tb\n1\t2\n\nx\ty\n')).toEqual([
      ['a\tb', '1\t2'],
      ['x\ty'],
    ]);
  });
});
