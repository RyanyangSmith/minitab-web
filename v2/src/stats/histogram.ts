import { descriptiveStats } from './descriptive';

export interface HistogramBins {
  bins: number;
  binWidth: number;
  min: number;
  max: number;
}

export interface HistogramOptions {
  minBins?: number;
  maxBins?: number;
  paddingRatio?: number;
}

/**
 * Automatic histogram binning based on Freedman-Diaconis and Scott rules,
 * rounded to 1-2-5 x 10^k bin widths. The result always keeps data visible
 * and defaults to at least 8 bins so close values are not merged together.
 */
export function computeHistogramBins(
  values: number[],
  options: HistogramOptions = {}
): HistogramBins {
  const minBins = Math.max(1, options.minBins ?? 8);
  const maxBins = Math.max(minBins, options.maxBins ?? 30);
  const paddingRatio = options.paddingRatio ?? 0.08;

  if (values.length === 0) {
    return { bins: minBins, binWidth: 1, min: 0, max: 1 };
  }

  const stats = descriptiveStats(values);
  const dataMin = stats.min;
  const dataMax = stats.max;
  const range = dataMax - dataMin;

  if (range <= Number.EPSILON) {
    const base = Math.abs(dataMax) || 1;
    const binWidth = Math.max(base * 0.01, Number.EPSILON);
    const span = binWidth * minBins;
    return {
      bins: minBins,
      binWidth,
      min: dataMax - span / 2,
      max: dataMax + span / 2,
    };
  }

  const iqr = stats.q3 - stats.q1;
  const cubeRootN = Math.cbrt(values.length);
  const fdWidth = iqr > 0 ? (2 * iqr) / cubeRootN : Infinity;
  const scottWidth = (3.49 * stats.stddev) / cubeRootN;
  const resolution = typicalResolution(values);
  const rawWidth = Math.max(Math.min(fdWidth, scottWidth), resolution);
  const targetBins = Math.min(
    maxBins,
    Math.max(minBins, Math.ceil(range / Math.max(rawWidth, Number.EPSILON)))
  );

  let binWidth = niceNumber(range / targetBins);
  for (
    let i = 0;
    i < 12 && Math.ceil(range / binWidth) > maxBins;
    i++
  ) {
    binWidth = nextNiceNumber(binWidth);
  }
  for (
    let i = 0;
    i < 12 && Math.ceil(range / binWidth) < minBins;
    i++
  ) {
    binWidth = previousNiceNumber(binWidth);
  }
  const resolutionFloor = Math.max(resolution, range / maxBins);
  if (binWidth < resolutionFloor) {
    binWidth = nextNiceNumber(resolutionFloor);
  }

  const padding = Math.max(range * paddingRatio, binWidth * 0.75);
  const min = Math.floor((dataMin - padding) / binWidth) * binWidth;
  const max = Math.ceil((dataMax + padding) / binWidth) * binWidth;
  const rawBins = Math.round((max - min) / binWidth);
  const bins = Math.max(minBins, Math.min(maxBins, rawBins));
  const finalBinWidth = (max - min) / bins;

  return { bins, binWidth: finalBinWidth, min, max };
}

function typicalResolution(values: number[]): number {
  const sorted = [...new Set(values)].sort((a, b) => a - b);
  if (sorted.length < 2) return 0;
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i] - sorted[i - 1];
    if (gap > 0) gaps.push(gap);
  }
  if (gaps.length === 0) return 0;
  gaps.sort((a, b) => a - b);
  return gaps[Math.floor(gaps.length / 2)];
}

function niceNumber(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;
  const exponent = Math.floor(Math.log10(value));
  const base = 10 ** exponent;
  const factor = value / base;
  if (factor <= 1) return base;
  if (factor <= 2) return 2 * base;
  if (factor <= 5) return 5 * base;
  return 10 * base;
}

function nextNiceNumber(value: number): number {
  const nice = niceNumber(value);
  if (nice > value * 1.0000000001) return nice;
  const base = 10 ** Math.floor(Math.log10(nice));
  const factor = nice / base;
  if (factor < 2) return 2 * base;
  if (factor < 5) return 5 * base;
  return 10 * base;
}

function previousNiceNumber(value: number): number {
  const nice = niceNumber(value);
  if (nice < value * 0.9999999999) return nice;
  const base = 10 ** Math.floor(Math.log10(nice));
  const factor = nice / base;
  if (factor > 5) return 5 * base;
  if (factor > 2) return 2 * base;
  if (factor > 1) return base;
  return 5 * (base / 10);
}
