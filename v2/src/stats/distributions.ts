/**
 * Standard normal CDF using approximation.
 */
export function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1.0 + sign * y);
}

/**
 * Inverse normal CDF (quantile function).
 */
export function normalQuantile(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;

  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.383577518672690e2, -3.066479806614716e1, 2.506628277459239e0,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838e0,
    -2.549732539343734e0, 4.374664141464968e0, 2.938163982698783e0,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996e0,
    3.754408661907416e0,
  ];

  const q = p - 0.5;
  let x: number;
  if (Math.abs(q) <= 0.425) {
    const r = 0.180625 - q * q;
    x =
      (q * (((((a[5] * r + a[4]) * r + a[3]) * r + a[2]) * r + a[1]) * r + a[0])) /
      (((((b[4] * r + b[3]) * r + b[2]) * r + b[1]) * r + b[0]) * r + 1);
  } else {
    let r = p;
    if (q > 0) r = 1 - p;
    r = Math.sqrt(-Math.log(r));
    x =
      (((((c[5] * r + c[4]) * r + c[3]) * r + c[2]) * r + c[1]) * r + c[0]) /
      ((((d[3] * r + d[2]) * r + d[1]) * r + d[0]) * r + 1);
    if (q < 0) x = -x;
  }
  return x;
}

/**
 * Student's t distribution CDF approximation.
 */
export function tCDF(t: number, df: number): number {
  if (df <= 0) return NaN;
  if (!Number.isFinite(t)) return t > 0 ? 1 : t < 0 ? 0 : 0.5;
  const constant =
    Math.exp(lngamma((df + 1) / 2) - lngamma(df / 2)) /
    Math.sqrt(df * Math.PI);
  const absT = Math.abs(t);
  const steps = Math.min(5000, Math.max(500, Math.ceil(absT * 1000)));
  let integral = 0;
  for (let i = 0; i < steps; i++) {
    const x = ((i + 0.5) * absT) / steps;
    integral += Math.pow(1 + (x * x) / df, -(df + 1) / 2);
  }
  integral *= (constant * absT) / steps;
  return 0.5 + (t >= 0 ? 1 : -1) * integral;
}

/**
 * Inverse Student's t distribution via bisection on tCDF.
 */
export function tQuantile(p: number, df: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (df <= 0) return NaN;
  let lo = -40;
  let hi = 40;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (tCDF(mid, df) < p) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return (lo + hi) / 2;
}

/**
 * F distribution CDF approximation using beta function.
 */
export function fCDF(f: number, df1: number, df2: number): number {
  if (f <= 0) return 0;
  const x = (df1 * f) / (df1 * f + df2);
  return betaCDF(x, df1 / 2, df2 / 2);
}

/**
 * Chi-square CDF using the regularized lower incomplete gamma function.
 */
export function chiSquareCDF(x: number, df: number): number {
  if (x <= 0) return 0;
  if (df <= 0) return NaN;
  return regularizedGammaP(df / 2, x / 2);
}

/**
 * Regularized incomplete beta function approximation.
 */
function betaCDF(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  // Use continued fraction representation
  const maxIter = 200;
  const eps = 1e-10;

  const front = (Math.exp(lngamma(a + b) - lngamma(a) - lngamma(b) + a * Math.log(x) + b * Math.log(1 - x))) / a;

  let c = 1;
  let d = 1 - ((a + b) * x) / (a + 1);
  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= maxIter; m++) {
    const m2 = 2 * m;

    // even step
    let aa = (m * (b - m) * x) / ((a + m2 - 1) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    h *= d * c;

    // odd step
    aa = -((a + m) * (a + b + m) * x) / ((a + m2) * (a + m2 + 1));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    h *= del;

    if (Math.abs(del - 1) < eps) break;
  }

  return front * (h - 1);
}

function regularizedGammaP(a: number, x: number): number {
  if (x < a + 1) {
    let sum = 1 / a;
    let term = sum;
    let ap = a;
    for (let i = 1; i <= 200; i++) {
      ap += 1;
      term *= x / ap;
      sum += term;
      if (Math.abs(term) < Math.abs(sum) * 1e-12) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - lngamma(a));
  }

  let b = x + 1 - a;
  let c = 1 / Number.MIN_VALUE;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i <= 200; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = b + an / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-12) break;
  }
  return 1 - Math.exp(-x + a * Math.log(x) - lngamma(a)) * h;
}

function lngamma(z: number): number {
  if (z < 0) return NaN;
  if (z === 0) return Infinity;

  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];

  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - lngamma(1 - z);
  }

  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) {
    x += c[i] / (z + i);
  }
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}
