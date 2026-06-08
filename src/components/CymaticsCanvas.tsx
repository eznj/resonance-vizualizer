/* ============================================================
   CymaticsCanvas — Chladni nodal-line field.
   Each active partial contributes a mode pair (n,m) derived from
   its ratio to the lowest active frequency. The field is only
   recomputed when partials change.

   Perf: the squared normalized field is precomputed once per
   change; the per-pixel exp() is served from a lookup table; and
   the redraw is throttled to ~30fps (the breathing is slow) and
   skipped entirely when nothing is moving.
   ============================================================ */
import { useEffect, useRef } from 'react';
import type { Palette, PartialSpec } from '../types';
import { createSizer, parseRGB, rgba } from '../visuals/palette';

interface Props {
  partials: PartialSpec[];
  palette: Palette;
  motion: boolean;
}

const GR = 180;
const DRAW_INTERVAL = 1000 / 30;

// exp(-x) lookup — x beyond EXP_XMAX is ~0.
const EXP_XMAX = 16;
const EXP_N = 2048;
const EXP_LUT = new Float32Array(EXP_N + 1);
for (let i = 0; i <= EXP_N; i++) EXP_LUT[i] = Math.exp(-(i / EXP_N) * EXP_XMAX);
function expNeg(x: number): number {
  if (x >= EXP_XMAX) return 0;
  return EXP_LUT[((x / EXP_XMAX) * EXP_N) | 0];
}

export function CymaticsCanvas({ partials, palette, motion }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  // `norm[i]` = (|field| / maxAbs)² — the static part of the node falloff.
  const normRef = useRef<Float32Array | null>(null);
  const dirtyRef = useRef(true);
  const palRef = useRef(palette);
  palRef.current = palette;
  const motionRef = useRef(motion);
  motionRef.current = motion;

  // a theme/palette change must repaint even a static (non-breathing) field
  useEffect(() => {
    dirtyRef.current = true;
  }, [palette]);

  // signature → recompute the field only when params change
  const sig = partials
    .map((p) => (p.muted ? 'x' : '') + Math.round(p.freq) + ':' + p.amp.toFixed(2))
    .join('|');

  useEffect(() => {
    const active = partials.filter((p) => !p.muted);
    if (active.length === 0) {
      normRef.current = null;
      dirtyRef.current = true;
      return;
    }
    const f0 = Math.min(...active.map((p) => p.freq));
    const modes = active.map((p) => {
      const q = p.freq / f0; // 1, φ, φ² …
      const n = Math.max(1, Math.min(11, Math.round(1.7 * q)));
      const m = Math.max(1, Math.min(11, Math.round(1.7 * q) + 1));
      return { n, m, a: p.amp };
    });
    const norm = new Float32Array(GR * GR);
    let maxAbs = 1e-6;
    for (let yy = 0; yy < GR; yy++) {
      const y = yy / (GR - 1);
      for (let xx = 0; xx < GR; xx++) {
        const x = xx / (GR - 1);
        let sum = 0;
        for (const md of modes) {
          const nPx = Math.cos(md.n * Math.PI * x);
          const nPy = Math.cos(md.n * Math.PI * y);
          const mPx = Math.cos(md.m * Math.PI * x);
          const mPy = Math.cos(md.m * Math.PI * y);
          sum += md.a * (nPx * mPy + mPx * nPy);
        }
        const av = Math.abs(sum);
        norm[yy * GR + xx] = av;
        if (av > maxAbs) maxAbs = av;
      }
    }
    // normalize to (|field|/maxAbs)² in place
    const invMax = 1 / maxAbs;
    for (let i = 0; i < norm.length; i++) {
      const r = norm[i] * invMax;
      norm[i] = r * r;
    }
    normRef.current = norm;
    dirtyRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const { size, dispose } = createSizer(canvas);
    const off = document.createElement('canvas');
    off.width = GR;
    off.height = GR;
    const octx = off.getContext('2d')!;
    const img = octx.createImageData(GR, GR);
    let raf = 0;
    let lastDraw = -1e9;
    const t0 = performance.now();

    function frame(now: number) {
      const moving = motionRef.current;
      // throttle to ~30fps; when static, draw once then idle
      if (now - lastDraw < DRAW_INTERVAL || (!moving && !dirtyRef.current)) {
        raf = requestAnimationFrame(frame);
        return;
      }
      lastDraw = now;
      dirtyRef.current = false;

      const { w: W, h: H } = size;
      const norm = normRef.current;
      const pal = palRef.current;
      const bg = parseRGB(pal.screenBg);
      const sand = parseRGB(pal.screenTrace);

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = pal.screenBg;
      ctx.fillRect(0, 0, W, H);
      const side = Math.min(W, H);
      const ox = (W - side) / 2;
      const oy = (H - side) / 2;
      if (!norm) {
        raf = requestAnimationFrame(frame);
        return;
      }
      // breathing node thickness → scales the falloff
      const breathe = moving ? 0.5 + 0.5 * Math.sin((now - t0) / 1400) : 0.5;
      const k = 0.055 + 0.03 * breathe;
      const inv = 1 / (k * k);
      const data = img.data;
      for (let i = 0; i < norm.length; i++) {
        const node = expNeg(norm[i] * inv); // 1 on nodal line → 0 away
        const o = i * 4;
        data[o] = bg[0] + (sand[0] - bg[0]) * node;
        data[o + 1] = bg[1] + (sand[1] - bg[1]) * node;
        data[o + 2] = bg[2] + (sand[2] - bg[2]) * node;
        data[o + 3] = 255;
      }
      octx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(off, ox, oy, side, side);

      // frame
      ctx.strokeStyle = rgba(pal.screenGrid, 0.6);
      ctx.lineWidth = 1;
      ctx.strokeRect(ox + 0.5, oy + 0.5, side - 1, side - 1);

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      dispose();
    };
  }, []);

  return <canvas ref={ref} />;
}
