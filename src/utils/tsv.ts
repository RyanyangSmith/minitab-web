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
 * Copy TSV data to clipboard.
 */
export async function copyToClipboard(cells: CellValue[][]): Promise<void> {
  const tsv = cellsToTsv(cells);
  await navigator.clipboard.writeText(tsv);
}

/**
 * Read TSV from clipboard.
 */
export async function readFromClipboard(): Promise<string> {
  return navigator.clipboard.readText();
}
