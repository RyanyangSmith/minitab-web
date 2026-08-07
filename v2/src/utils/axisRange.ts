export interface AxisRange {
  min: number;
  max: number;
}

/**
 * Compute a padded axis range that keeps all values visible while zooming
 * close enough to show variation in large or small datasets.
 */
export function computeAxisRange(
  values: number[],
  paddingRatio = 0.08
): AxisRange {
  let min = Infinity;
  let max = -Infinity;
  for (const value of values) {
    if (!Number.isFinite(value)) continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: 0, max: 1 };
  }
  if (min === max) {
    const delta = Math.abs(min) || 1;
    return { min: min - delta * 0.05, max: max + delta * 0.05 };
  }
  const padding = Math.max((max - min) * paddingRatio, Number.EPSILON);
  return { min: min - padding, max: max + padding };
}
