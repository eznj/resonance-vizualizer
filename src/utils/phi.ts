import type { PartialSpec } from '../types';

export const PHI = (1 + Math.sqrt(5)) / 2; // 1.6180339887…

/** Usable oscillator frequency range. */
export const FMIN = 40;
export const FMAX = 1800;

export function clampF(f: number): number {
  return Math.max(FMIN, Math.min(FMAX, f));
}

/** A golden stack of n partials: base, base·φ, base·φ² … with a tapering amp. */
export function phiSet(n: number, base: number): PartialSpec[] {
  const arr: PartialSpec[] = [];
  for (let i = 0; i < n; i++) {
    arr.push({
      freq: clampF(base * Math.pow(PHI, i)),
      amp: 0.95 * Math.pow(0.82, i),
      type: 'sine',
      muted: false,
    });
  }
  return arr;
}

/** Grow or shrink a stack to n partials, extending along the φ stack. */
export function adjustCount(prev: PartialSpec[], n: number): PartialSpec[] {
  if (n === prev.length) return prev;
  if (n < prev.length) return prev.slice(0, n);
  const arr = prev.slice();
  const base = prev[0] ? prev[0].freq : 110;
  for (let i = prev.length; i < n; i++) {
    arr.push({
      freq: clampF(base * Math.pow(PHI, i)),
      amp: 0.95 * Math.pow(0.82, i),
      type: 'sine',
      muted: false,
    });
  }
  return arr;
}
