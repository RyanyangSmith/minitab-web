export interface GageRRInput {
  parts: (string | number)[];
  operators: (string | number)[];
  measurements: number[];
}

export interface GageRRResult {
  trials: number;
  operatorCount: number;
  partCount: number;
  ev: number;
  av: number;
  grr: number;
  pv: number;
  tv: number;
  evPct: number;
  avPct: number;
  grrPct: number;
  pvPct: number;
  ndc: number;
  operatorStats: { operator: string; averageRange: number; average: number }[];
  partStats: { part: string; average: number }[];
  comboStats: { part: string; operator: string; mean: number; range: number }[];
  warnings: string[];
}

const K1: Record<number, number> = {
  2: 4.56, 3: 3.05, 4: 2.5, 5: 2.21, 6: 2.02,
  7: 1.88, 8: 1.78, 9: 1.7, 10: 1.64,
};
const K2: Record<number, number> = {
  2: 3.65, 3: 2.7, 4: 2.3, 5: 2.08, 6: 1.93,
  7: 1.82, 8: 1.74, 9: 1.67, 10: 1.62,
};
const K3: Record<number, number> = {
  2: 3.65, 3: 2.7, 4: 2.3, 5: 2.08, 6: 1.93,
  7: 1.82, 8: 1.74, 9: 1.67, 10: 1.62,
};

export function gageRRAnalysis(input: GageRRInput): GageRRResult | null {
  const n = Math.min(
    input.parts.length,
    input.operators.length,
    input.measurements.length
  );
  if (n === 0) return null;

  const combos = new Map<string, { part: string; operator: string; values: number[] }>();
  for (let i = 0; i < n; i++) {
    const part = String(input.parts[i]);
    const operator = String(input.operators[i]);
    const key = `${part}\u0000${operator}`;
    const combo = combos.get(key) ?? {
      part,
      operator,
      values: [],
    };
    combo.values.push(input.measurements[i]);
    combos.set(key, combo);
  }

  const comboList = [...combos.values()];
  const trials = comboList[0]?.values.length ?? 0;
  const warnings: string[] = [];
  if (comboList.some((c) => c.values.length !== trials)) {
    warnings.push('零件/操作员组合的重复测量次数不一致，结果仅供参考');
  }

  const rangeMean = average(comboList.map((c) => max(c.values) - min(c.values)));
  const operatorNames = [...new Set(comboList.map((c) => c.operator))];
  const partNames = [...new Set(comboList.map((c) => c.part))];
  const operatorAverages = operatorNames.map((op) => ({
    operator: op,
    average: average(
      comboList.filter((c) => c.operator === op).map((c) => average(c.values))
    ),
    averageRange: average(
      comboList.filter((c) => c.operator === op).map((c) => max(c.values) - min(c.values))
    ),
  }));
  const comboStats = comboList.map((c) => ({
    part: c.part,
    operator: c.operator,
    mean: average(c.values),
    range: max(c.values) - min(c.values),
  }));
  const partAverages = partNames.map((part) => ({
    part,
    average: average(
      comboList.filter((c) => c.part === part).map((c) => average(c.values))
    ),
  }));

  const k1 = K1[Math.max(2, Math.min(10, trials))] ?? K1[2];
  const k2 = K2[Math.max(2, Math.min(10, operatorNames.length))] ?? K2[2];
  const k3 = K3[Math.max(2, Math.min(10, partNames.length))] ?? K3[2];
  const ev = rangeMean * k1;
  const xDiff =
    operatorAverages.length > 0
      ? max(operatorAverages.map((o) => o.average)) -
        min(operatorAverages.map((o) => o.average))
      : 0;
  const avRaw = Math.sqrt(
    Math.max(0, (xDiff * k2) ** 2 - ev ** 2 / (partNames.length * trials))
  );
  const grr = Math.sqrt(ev * ev + avRaw * avRaw);
  const partRange =
    partAverages.length > 0
      ? max(partAverages.map((p) => p.average)) -
        min(partAverages.map((p) => p.average))
      : 0;
  const pv = partRange * k3;
  const tv = Math.sqrt(grr * grr + pv * pv);
  const ndc = grr === 0 ? 999 : Math.floor((1.41 * pv) / grr);

  return {
    trials,
    operatorCount: operatorNames.length,
    partCount: partNames.length,
    ev,
    av: avRaw,
    grr,
    pv,
    tv,
    evPct: tv === 0 ? 0 : (ev / tv) * 100,
    avPct: tv === 0 ? 0 : (avRaw / tv) * 100,
    grrPct: tv === 0 ? 0 : (grr / tv) * 100,
    pvPct: tv === 0 ? 0 : (pv / tv) * 100,
    ndc,
    operatorStats: operatorAverages,
    partStats: partAverages,
    comboStats,
    warnings,
  };
}

function average(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
}

function min(values: number[]): number {
  return Math.min(...values);
}

function max(values: number[]): number {
  return Math.max(...values);
}
