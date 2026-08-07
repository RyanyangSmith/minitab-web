import type { CellValue } from '../types';

/**
 * Serialize a 2D cell grid to TSV string.
 * null values become empty string.
 */
export function cellsToTsv(cells: CellValue[][]): string {
  return cells
    .map((row) =>
      row.map((cell) => (cell == null ? '' : String(cell))).join('\t')
    )
    .join('\n');
}

/**
 * Parse TSV string into a 2D string array.
 */
export function tsvToCells(tsv: string): string[][] {
  const lines = tsv.split(/\r?\n/);
  // Remove trailing empty line if present
  if (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }
  return lines.map((line) => line.split('\t'));
}

/**
 * Split TSV text into blocks separated by blank lines. Trailing blank lines
 * are ignored so copied blocks can be pasted back without extra empty rows.
 */
export function splitTsvBlocks(tsv: string): string[][] {
  const blocks: string[][] = [];
  let current: string[] = [];
  for (const line of tsv.split(/\r?\n/)) {
    if (line === '') {
      if (current.length > 0) {
        blocks.push(current);
        current = [];
      }
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) blocks.push(current);
  return blocks;
}
