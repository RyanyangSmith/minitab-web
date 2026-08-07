import { describe, it, expect } from 'vitest';
import { gageRRAnalysis } from './gageRR';

describe('gageRRAnalysis', () => {
  it('returns zero measurement variation for identical repeats', () => {
    const result = gageRRAnalysis({
      parts: ['P1', 'P1', 'P1', 'P1', 'P2', 'P2', 'P2', 'P2'],
      operators: ['A', 'A', 'B', 'B', 'A', 'A', 'B', 'B'],
      measurements: [1, 1, 1, 1, 2, 2, 2, 2],
    })!;
    expect(result.ev).toBe(0);
    expect(result.av).toBe(0);
    expect(result.grr).toBe(0);
    expect(result.ndc).toBe(999);
    expect(result.grrPct).toBe(0);
  });

  it('reports non-zero GRR when repeat measurements vary', () => {
    const result = gageRRAnalysis({
      parts: ['P1', 'P1', 'P1', 'P1', 'P2', 'P2', 'P2', 'P2'],
      operators: ['A', 'A', 'B', 'B', 'A', 'A', 'B', 'B'],
      measurements: [1, 1.2, 1.1, 1.3, 2, 2.1, 2.2, 1.9],
    })!;
    expect(result.grr).toBeGreaterThan(0);
    expect(result.grrPct).toBeGreaterThan(0);
    expect(result.tv).toBeGreaterThan(result.grr);
  });

  it('requires at least one row', () => {
    expect(
      gageRRAnalysis({ parts: [], operators: [], measurements: [] })
    ).toBeNull();
  });
});
