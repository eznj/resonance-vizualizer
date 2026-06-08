/* ============================================================
   palette.ts — color resolution + canvas sizing helpers
   Canvas can't read CSS variables (or oklch) directly, so we
   resolve every token to a concrete "rgb(r,g,b)" string by
   painting it onto a 1px canvas and reading back the sRGB bytes.
   ============================================================ */
import type { Palette } from '../types';

let _cc: HTMLCanvasElement | null = null;
let _ccx: CanvasRenderingContext2D | null = null;

/** Resolve ANY css color (incl. oklch) to "rgb(r,g,b)". */
export function toRGB(str: string): string {
  if (!_cc) {
    _cc = document.createElement('canvas');
    _cc.width = _cc.height = 1;
    _ccx = _cc.getContext('2d');
  }
  const ctx = _ccx!;
  const input = (str || '').trim() || '#888';
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = '#888888';
  ctx.fillStyle = input; // invalid input leaves the fallback
  ctx.fillRect(0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  return 'rgb(' + d[0] + ',' + d[1] + ',' + d[2] + ')';
}

export function resolvePalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const v = (name: string) => toRGB(cs.getPropertyValue(name) || '#888');
  return {
    ink: v('--ink'),
    inkSoft: v('--ink-soft'),
    muted: v('--muted'),
    faint: v('--faint'),
    line: v('--line'),
    lineSoft: v('--line-soft'),
    accent: v('--accent'),
    scopeBg: v('--scope-bg'),
    scopeGrid: v('--scope-grid'),
    panel: v('--panel'),
    screenBg: v('--screen-bg'),
    screenTrace: v('--screen-trace'),
    screenGrid: v('--screen-grid'),
    screenInk: v('--screen-ink'),
  };
}

/** "rgb(r,g,b)" → "rgba(r,g,b,a)". */
export function rgba(rgb: string, a: number): string {
  const m = rgb.match(/\d+(\.\d+)?/g);
  if (!m) return rgb;
  return 'rgba(' + m[0] + ',' + m[1] + ',' + m[2] + ',' + a + ')';
}

export function parseRGB(str: string): [number, number, number] {
  const m = str.match(/\d+(\.\d+)?/g);
  return m ? [+m[0], +m[1], +m[2]] : [128, 128, 128];
}

export interface CanvasSize {
  w: number;
  h: number;
  dpr: number;
}

/**
 * Track a canvas's device-pixel size via ResizeObserver instead of measuring
 * (getBoundingClientRect) every animation frame, which forces layout. The
 * returned `size` object is mutated in place; read it inside the draw loop.
 */
export function createSizer(canvas: HTMLCanvasElement): { size: CanvasSize; dispose: () => void } {
  const size: CanvasSize = { w: 1, h: 1, dpr: 1 };
  const measure = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width * dpr));
    const h = Math.max(1, Math.round(r.height * dpr));
    size.w = w;
    size.h = h;
    size.dpr = dpr;
    // setting width/height clears the canvas, so only do it on a real change
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  };
  measure();
  const ro = new ResizeObserver(measure);
  ro.observe(canvas);
  return { size, dispose: () => ro.disconnect() };
}
