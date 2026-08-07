/* eslint-disable no-loss-of-precision */
import { descriptiveStats } from './descriptive';

export interface NormalityResult {
  ad: { statistic: number; pValue: number };
  sw: { statistic: number; pValue: number };
  ks: { statistic: number; pValue: number };
  mean: number;
  stddev: number;
  n: number;
}

/**
 * Anderson-Darling normality test.
 */
function adTest(data: number[]): { statistic: number; pValue: number } {
  const n = data.length;
  if (n < 5) return { statistic: NaN, pValue: NaN };

  const sorted = [...data].sort((a, b) => a - b);
  const { mean, stddev } = descriptiveStats(data);

  if (stddev === 0) return { statistic: NaN, pValue: NaN };

  // Standardize and compute AD statistic
  const z = sorted.map((x) => (x - mean) / stddev);
  const phi = z.map((zi) => normalCDF(zi));

  let s = 0;
  for (let i = 0; i < n; i++) {
    s += (2 * i + 1) * (Math.log(phi[i]) + Math.log(1 - phi[n - 1 - i]));
  }
  const ad = -n - s / n;

  // AD* correction
  const adStar = ad * (1 + 0.75 / n + 2.25 / (n * n));

  // p-value approximation
  let pValue: number;
  if (adStar < 0.2) {
    pValue = 1 - Math.exp(-13.436 + 101.14 * adStar - 223.73 * adStar * adStar);
  } else if (adStar < 0.34) {
    pValue = 1 - Math.exp(-8.318 + 42.796 * adStar - 59.938 * adStar * adStar);
  } else if (adStar < 0.6) {
    pValue = Math.exp(0.9177 - 4.279 * adStar - 1.38 * adStar * adStar);
  } else {
    pValue = Math.exp(1.2937 - 5.709 * adStar + 0.0186 * adStar * adStar);
  }

  return { statistic: ad, pValue: Math.max(0, Math.min(1, pValue)) };
}

// ---------------------------------------------------------------------------
// Shapiro-Wilk test — Royston AS R94, translated from R's swilk.c
// (Applied Statistics 44(4), 1995, pp. 547-551).
// ---------------------------------------------------------------------------

// AS R94 polynomial coefficients, ascending powers of x (as in R's swilk.c).
const SW_C1 = [0, 0.221157, -0.147981, -2.07119, 4.434685, -2.706056];
const SW_C2 = [0, 0.042981, -0.293762, -1.752461, 5.682633, -3.582633];
const SW_C3 = [0.544, -0.39978, 0.025054, -0.0006714];
const SW_C4 = [1.3822, -0.77857, 0.062767, -0.0020322];
const SW_C5 = [-1.5861, -0.31082, -0.083751, 0.0038915];
const SW_C6 = [-0.4803, -0.082676, 0.0030302];
const SW_G = [-2.273, 0.459];

const SW_SQRTH = 0.7071067811865475; // sqrt(1/2)
const SW_TH = 0.375;
const SW_PI6 = 1.909859317102744; // 6 / pi, as in R's swilk.f
const SW_STQR = 1.047197551196598; // pi/3
const SW_SMALL = 1e-19;

/**
 * ALGORITHM AS 241 (Beasley-Springer-Moro) — inverse of the standard normal
 * CDF, as used by R's swilk.c for the expected order statistics.
 */
function ppnd(p: number): number {
  const a0 = 3.387132872796366608;
  const a1 = 1.331416678912843674e2;
  const a2 = 1.971590950306551442e3;
  const a3 = 1.373169376550946112e4;
  const a4 = 4.592195393154987145e4;
  const a5 = 6.726577092700870085e4;
  const a6 = 3.343057558358812810e4;
  const a7 = 2.509080928730122673e3;
  const b1 = 4.231333070160091125e1;
  const b2 = 6.871870074920579083e2;
  const b3 = 5.394196021424751108e3;
  const b4 = 2.121379430158659586e4;
  const b5 = 3.930789580009271061e4;
  const b6 = 2.872908573572194267e4;
  const b7 = 5.226495278852854561e3;
  const c0 = 1.42343711074968357734;
  const c1 = 4.6303378461565452959;
  const c2 = 5.7694972214606914055;
  const c3 = 3.64784832476320460504;
  const c4 = 1.27045825245236838258;
  const c5 = 2.4178072517745061177e-1;
  const c6 = 2.27238449892691845833e-2;
  const c7 = 7.7454501427834140764e-4;
  const d1 = 2.05319162663775882187;
  const d2 = 1.6763848301838038494;
  const d3 = 6.8976733498510000455e-1;
  const d4 = 1.4810397642748007459e-1;
  const d5 = 1.51986665636164571966e-2;
  const d6 = 5.475938084995344946e-4;
  const d7 = 1.05075007164441684324e-9;
  const e0 = 6.6579046435011037772;
  const e1 = 5.4637849111641143699;
  const e2 = 1.7848265399172913358;
  const e3 = 2.9656057182850489123e-1;
  const e4 = 2.6532189526576123093e-2;
  const e5 = 1.2426609473880784386e-3;
  const e6 = 2.7115555687434875782e-5;
  const e7 = 2.0103343992922881327e-7;
  const f1 = 5.998322065558879377e-1;
  const f2 = 1.3692988092273580531e-1;
  const f3 = 1.4875361290850614853e-2;
  const f4 = 7.868691311456132591e-4;
  const f5 = 1.8463183175100546818e-5;
  const f6 = 1.4215117583164458887e-7;
  const f7 = 2.0442631033899397856e-15;

  const q = p - 0.5;
  if (Math.abs(q) <= 0.425) {
    const r = 0.180625 - q * q;
    return (
      (q * (((((((a7 * r + a6) * r + a5) * r + a4) * r + a3) * r + a2) * r + a1) * r + a0)) /
      (((((((b7 * r + b6) * r + b5) * r + b4) * r + b3) * r + b2) * r + b1) * r + 1)
    );
  }

  let r = p;
  if (q > 0) r = 1 - p;
  if (r <= 0) return 0;
  r = Math.sqrt(-Math.log(r));
  let ret: number;
  if (r <= 5) {
    r -= 1.6;
    ret =
      ((((((c7 * r + c6) * r + c5) * r + c4) * r + c3) * r + c2) * r + c1) * r + c0;
    const denominator =
      ((((((d7 * r + d6) * r + d5) * r + d4) * r + d3) * r + d2) * r + d1) * r + 1;
    ret /= denominator;
  } else {
    r -= 5;
    ret =
      ((((((e7 * r + e6) * r + e5) * r + e4) * r + e3) * r + e2) * r + e1) * r + e0;
    const denominator =
      ((((((f7 * r + f6) * r + f5) * r + f4) * r + f3) * r + f2) * r + f1) * r + 1;
    ret /= denominator;
  }
  return q < 0 ? -ret : ret;
}

/**
 * Evaluate a polynomial whose coefficients are 0-based and ordered from the
 * constant term to the highest degree (mirrors R's swilk.f poly()).
 */
function poly(c: number[], nord: number, x: number): number {
  if (nord <= 0) return 0;
  if (nord === 1) return c[0];
  let p = x * c[nord - 1];
  for (let i = nord - 2; i >= 1; i--) {
    p = (p + c[i]) * x;
  }
  return p + c[0];
}

/**
 * Standard normal CDF via the error function (accurate across the full range
 * of z values produced by the Shapiro-Wilk transform).
 */
function normalCDF(x: number): number {
  if (x === 0) return 0.5;
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

function erf(x: number): number {
  // Abramowitz & Stegun 7.1.26
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y =
    1 -
    (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-ax * ax);
  return sign * y;
}

/**
 * Shapiro-Wilk normality test — Royston AS R94 (uncensored case).
 */
function swTest(data: number[]): { statistic: number; pValue: number } {
  const n = data.length;
  if (n < 3 || n > 5000) return { statistic: NaN, pValue: NaN };

  const sorted = [...data].sort((a, b) => a - b);
  const range = sorted[n - 1] - sorted[0];
  if (range < 1e-19) return { statistic: NaN, pValue: NaN };

  const an = n;
  const nn2 = Math.floor(n / 2);

  // Coefficients for the test.
  const a: number[] = new Array(n + 1);
  if (n === 3) {
    a[1] = SW_SQRTH;
  } else {
    const an25 = an + 0.25;
    let summ2 = 0;
    for (let i = 1; i <= nn2; i++) {
      a[i] = ppnd((i - SW_TH) / an25);
      summ2 += a[i] * a[i];
    }
    summ2 *= 2;
    const ssumm2 = Math.sqrt(summ2);
    const rsn = 1 / Math.sqrt(an);
    const a1 = poly(SW_C1, 6, rsn) - a[1] / ssumm2;

    let i1: number;
    let fac: number;
    if (n > 5) {
      i1 = 3;
      const a2 = -a[2] / ssumm2 + poly(SW_C2, 6, rsn);
      fac = Math.sqrt(
        (summ2 - 2 * a[1] * a[1] - 2 * a[2] * a[2]) /
          (1 - 2 * a1 * a1 - 2 * a2 * a2)
      );
      a[1] = a1;
      a[2] = a2;
    } else {
      i1 = 2;
      fac = Math.sqrt((summ2 - 2 * a[1] * a[1]) / (1 - 2 * a1 * a1));
      a[1] = a1;
    }
    for (let i = i1; i <= nn2; i++) {
      a[i] = -a[i] / fac;
    }
  }

  // W statistic as squared correlation between data and coefficients.
  let sa = -a[1];
  let sx = sorted[0] / range;
  let j = n - 1;
  for (let i = 2; i <= n; i++) {
    const xi = sorted[i - 1] / range;
    sx += xi;
    if (i !== j) {
      sa += (i - j > 0 ? 1 : -1) * a[Math.min(i, j)];
    }
    --j;
  }

  sa /= n;
  sx /= n;
  let ssa = 0;
  let ssx = 0;
  let sax = 0;
  j = n;
  for (let i = 1; i <= n; i++) {
    let asa: number;
    if (i !== j) {
      asa = (i - j > 0 ? 1 : -1) * a[Math.min(i, j)] - sa;
    } else {
      asa = -sa;
    }
    const xsx = sorted[i - 1] / range - sx;
    ssa += asa * asa;
    ssx += xsx * xsx;
    sax += asa * xsx;
    --j;
  }

  const ssassx = Math.sqrt(ssa * ssx);
  const w1 = ((ssassx - sax) * (ssassx + sax)) / (ssa * ssx); // 1 - W
  const w = 1 - w1;
  if (!isFinite(w)) return { statistic: NaN, pValue: NaN };

  // Significance level.
  let pValue: number;
  if (n === 3) {
    pValue = SW_PI6 * (Math.asin(Math.sqrt(w)) - SW_STQR);
  } else {
    let y = Math.log(w1);
    const xx = Math.log(an);
    let m: number;
    let s: number;
    if (n <= 11) {
      const gamma = poly(SW_G, 2, an);
      if (y >= gamma) {
        pValue = SW_SMALL;
      } else {
        y = -Math.log(gamma - y);
        m = poly(SW_C3, 4, an);
        s = Math.exp(poly(SW_C4, 4, an));
        pValue = 1 - normalCDF((y - m) / s);
      }
    } else {
      m = poly(SW_C5, 4, xx);
      s = Math.exp(poly(SW_C6, 3, xx));
      pValue = 1 - normalCDF((y - m) / s);
    }
  }

  if (isNaN(pValue)) return { statistic: w, pValue: NaN };
  return { statistic: w, pValue: Math.max(0, Math.min(1, pValue)) };
}

/**
 * Kolmogorov-Smirnov normality test with the Lilliefors-corrected p value.
 */
function ksTest(data: number[]): { statistic: number; pValue: number } {
  const n = data.length;
  if (n < 5) return { statistic: NaN, pValue: NaN };

  const sorted = [...data].sort((a, b) => a - b);
  const { mean, stddev } = descriptiveStats(data);

  if (stddev === 0) return { statistic: NaN, pValue: NaN };

  let dMax = 0;
  for (let i = 0; i < n; i++) {
    const z = (sorted[i] - mean) / stddev;
    const f0 = normalCDF(z);
    const f1 = (i + 1) / n;
    const f2 = i / n;
    dMax = Math.max(dMax, Math.abs(f0 - f1), Math.abs(f0 - f2));
  }

  // Lilliefors-corrected p value (Dallal & Wilkinson 1986 approximation).
  let pValue = lillieforsP(dMax, n);
  if (pValue > 0.1) {
    // The approximation is only reliable below 0.1; fall back to the
    // standard two-sided KS tail sum for large p values.
    const lambda = (Math.sqrt(n) + 0.12 + 0.11 / Math.sqrt(n)) * dMax;
    pValue = 2 * ksSum(lambda);
  }
  pValue = Math.max(0, Math.min(1, pValue));

  return { statistic: dMax, pValue };
}

function lillieforsP(dMax: number, n: number): number {
  let d = dMax;
  let size = n;
  if (n > 100) {
    d *= Math.pow(n / 100, 0.49);
    size = 100;
  }
  return Math.exp(
    -7.01256 * d * d * (size + 2.78019)
    + 2.99587 * d * Math.sqrt(size + 2.78019)
    - 0.122119
    + 0.974598 / Math.sqrt(size)
    + 1.67997 / size
  );
}

function ksSum(lambda: number): number {
  if (lambda < 0.01) return 1;
  let sum = 0;
  for (let k = 1; k <= 100; k++) {
    const term = Math.pow(-1, k - 1) * Math.exp(-2 * k * k * lambda * lambda);
    sum += term;
    if (Math.abs(term) < 1e-10) break;
  }
  return sum;
}

/**
 * Run all three normality tests on a dataset.
 */
export function normalityTest(data: number[]): NormalityResult {
  const stats = descriptiveStats(data);
  return {
    ad: adTest(data),
    sw: swTest(data),
    ks: ksTest(data),
    mean: stats.mean,
    stddev: stats.stddev,
    n: stats.n,
  };
}
