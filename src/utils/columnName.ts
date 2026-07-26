/**
 * Convert 1-based column index to column name.
 * 1 -> C1, 26 -> C26, 27 -> AA, 52 -> AZ, 53 -> BA, 702 -> ZZ
 */
export function columnName(index: number): string {
  let name = '';
  let n = index;
  while (n > 0) {
    n--;
    name = String.fromCharCode(65 + (n % 26)) + name;
    n = Math.floor(n / 26);
  }
  return 'C' + name;
}

/**
 * Extract column index from column name (reverse of columnName).
 * C1 -> 1, AA -> 27
 */
export function columnIndex(name: string): number {
  const letters = name.replace(/^C/i, '');
  let index = 0;
  for (let i = 0; i < letters.length; i++) {
    index = index * 26 + (letters.charCodeAt(i) - 64);
  }
  return index;
}
