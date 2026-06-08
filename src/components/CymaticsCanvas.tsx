/* ============================================================
   CymaticsCanvas — Chladni nodal-line field.
   Each active partial contributes a mode pair (n,m) derived from
   its ratio to the lowest active frequency. The field is only
   recomputed when partials change; the draw loop breathes the
   node threshold to animate.
   ============================================================ */
import { useEffect, useRef } from 'react';
import type { Palette, PartialSpec } from '../types';
import { fitCanvas, parseRGB, rgba } from '../visuals/palette';

interface Props {
  partials: PartialSpec[];
  palette: Palette;
  motion: boolean;
}

const GR = 180;

export function CymaticsCanvas({ partials, palette, motion }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const fieldRef = useRef<{ field: Float32Array; maxAbs: number } | null>(null);
  const palRef = useRef(palette);
  palRef.current = palette;
  const motionRef = useRef(motion);
  motionRef.current = motion;

  // signature → recompute the field only when params change
  const sig = partials
    .map((p) => (p.muted ? 'x' : '') + Math.round(p.freq) + ':' + p.amp.toFixed(2))
    .join('|');

  useEffect(() => {
    const active = partials.filter((p) => !p.muted);
    if (active.length === 0) {
      fieldRef.current = null;
      return;
    }
    const f0 = Math.min(...active.map((p) => p.freq));
    const modes = active.map((p) => {
      const q = p.freq / f0; // 1, φ, φ² …
      const n = Math.max(1, Math.min(11, Math.round(1.7 * q)));
      const m = Math.max(1, Math.min(11, Math.round(1.7 * q) + 1));
      return { n, m, a: p.amp };
    });
    const field = new Float32Array(GR * GR);
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
        field[yy * GR + xx] = sum;
        const av = Math.abs(sum);
        if (av > maxAbs) maxAbs = av;
      }
    }
    fieldRef.current = { field, maxAbs };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const off = document.createElement('canvas');
    off.width = GR;
    off.height = GR;
    const octx = off.getContext('2d')!;
    const img = octx.createImageData(GR, GR);
    let raf = 0;
    const t0 = performance.now();

    function frame(now: number) {
      const { w: W, h: H } = fitCanvas(canvas);
      const fr = fieldRef.current;
      const pal = palRef.current;
      const bg = parseRGB(pal.screenBg);
      const sand = parseRGB(pal.screenTrace);

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = pal.screenBg;
      ctx.fillRect(0, 0, W, H);
      const side = Math.min(W, H);
      const ox = (W - side) / 2;
      const oy = (H - side) / 2;
      if (!fr) {
        raf = requestAnimationFrame(frame);
        return;
      }
      // gentle breathing of node thickness
      const breathe = motionRef.current ? 0.5 + 0.5 * Math.sin((now - t0) / 1400) : 0.5;
      const thr = fr.maxAbs * (0.055 + 0.03 * breathe);
      const data = img.data;
      const field = fr.field;
      for (let i = 0; i < field.length; i++) {
        const d = Math.abs(field[i]) / thr;
        const node = Math.exp(-d * d); // 1 on nodal line → 0 away
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
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} />;
}
