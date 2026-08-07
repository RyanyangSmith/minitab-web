import { normalCDF } from './distributions';
import { descriptiveStats } from './descriptive';

export interface CapabilityConfig {
  lsl: number;    // lower spec limit
  usl: number;    // upper spec limit
  target: number; // target mean
}

export interface CapabilityResult {
  // Summary stats
  n: number;
  mean: number;
  overallStddev: number;
  withinStddev: number;
  betweenStddev: number;
  lsl: number;
  usl: number;
  target: number;

  // Overall capability
  pp: number;
  ppl: number;
  ppu: number;
  ppk: number;
  cpm: number;
  ca: number;

  // Within capability (potential)
  cp: number;
  cpl: number;
  cpu: number;
  cpk: number;

  // PPM - Observed
  ppmBelowLslObs: number;
  ppmAboveUslObs: number;
  ppmTotalObs: number;

  // PPM - Expected (normal model)
  ppmBelowLslExp: number;
  ppmAboveUslExp: number;
  ppmTotalExp: number;
}

/**
 * Compute process capability analysis.
 */
export function capabilityAnalysis(
  data: number[],
  config: CapabilityConfig
): CapabilityResult {
  const stats = descriptiveStats(data);
  const n = stats.n;
  const mean = stats.mean;
  const overallStddev = stats.stddev;

  // Within-subgroup stddev estimate (using moving range average)
  // For individual observations, use average moving range / d2
  const mr: number[] = [];
  for (let i = 1; i < n; i++) {
    mr.push(Math.abs(data[i] - data[i - 1]));
  }
  const mrMean = mr.length > 0 ? mr.reduce((a, b) => a + b, 0) / mr.length : 0;
  const d2 = 1.128; // d2 for n=2 (moving range)
  const withinStddev = mrMean / d2;

  // Between stddev
  const betweenVariance = Math.max(0, overallStddev * overallStddev - withinStddev * withinStddev);
  const betweenStddev = Math.sqrt(betweenVariance);

  const { lsl, usl, target } = config;
  const tolerance = usl - lsl;
  const ca = tolerance === 0 ? 0 : (mean - target) / (tolerance / 2);

  // Overall capability
  const pp = tolerance / (6 * overallStddev);
  const ppl = (mean - lsl) / (3 * overallStddev);
  const ppu = (usl - mean) / (3 * overallStddev);
  const ppk = Math.min(ppl, ppu);

  // CPM: uses the OVERALL standard deviation (per Minitab/Taguchi definition)
  const cpmDenom = Math.sqrt(overallStddev * overallStddev + Math.pow(mean - target, 2));
  const cpm = tolerance / (6 * cpmDenom);

  // Within capability
  const cp = tolerance / (6 * withinStddev);
  const cpl = (mean - lsl) / (3 * withinStddev);
  const cpu = (usl - mean) / (3 * withinStddev);
  const cpk = Math.min(cpl, cpu);

  // Observed PPM
  let belowLslCount = 0;
  let aboveUslCount = 0;
  for (const val of data) {
    if (val < lsl) belowLslCount++;
    if (val > usl) aboveUslCount++;
  }
  const ppmBelowLslObs = (belowLslCount / n) * 1_000_000;
  const ppmAboveUslObs = (aboveUslCount / n) * 1_000_000;
  const ppmTotalObs = ppmBelowLslObs + ppmAboveUslObs;

  // Expected PPM (using normal distribution)
  const zLsl = (lsl - mean) / overallStddev;
  const zUsl = (usl - mean) / overallStddev;
  const pBelow = normalCDF(zLsl);
  const pAbove = 1 - normalCDF(zUsl);
  const ppmBelowLslExp = pBelow * 1_000_000;
  const ppmAboveUslExp = pAbove * 1_000_000;
  const ppmTotalExp = ppmBelowLslExp + ppmAboveUslExp;

  return {
    n, mean, overallStddev, withinStddev, betweenStddev, lsl, usl, target,
    ca,
    pp, ppl, ppu, ppk, cpm,
    cp, cpl, cpu, cpk,
    ppmBelowLslObs, ppmAboveUslObs, ppmTotalObs,
    ppmBelowLslExp, ppmAboveUslExp, ppmTotalExp,
  };
}
