export const PHI = (1 + Math.sqrt(5)) / 2;
export const PHI_RECIPROCAL = 1 / PHI;

export function calculateRatio(f1: number, f2: number): number {
  if (f2 === 0) return 0;
  return f1 / f2;
}

export function deviationFromPhi(ratio: number): number {
  return Math.abs(ratio - PHI);
}

export function isGoldenRatio(ratio: number, tolerance: number = 0.01): boolean {
  return deviationFromPhi(ratio) < tolerance;
}

export function getNearestPhiRatio(baseFreq: number, targetRatio: 'phi' | 'phi_reciprocal'): number {
  return targetRatio === 'phi' ? baseFreq * PHI : baseFreq * PHI_RECIPROCAL;
}