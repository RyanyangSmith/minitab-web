/**
 * Convert 0-based column index to column name.
 * 0 -> C1, 1 -> C2, 25 -> C26, 26 -> AA, 51 -> AZ, 52 -> BA, 701 -> ZZ
 */
export function columnName(index: number): string {
  let name = '';
  let n = index + 1;
  while (n > 0) {
    n--;
    name = String.fromCharCode(65 + (n % 26)) + name;
    n = Math.floor(n / 26);
  }
  return 'C' + name;
}

/**
 * Extract 0-based column index from column name (reverse of columnName).
 * C1 -> 0, AA -> 26
 */
export function columnIndex(name: string): number {
  const letters = name.replace(/^C/i, '');
  let index = 0;
  for (let i = 0; i < letters.length; i++) {
    index = index * 26 + (letters.charCodeAt(i) - 64);
  }
  return index - 1;
}