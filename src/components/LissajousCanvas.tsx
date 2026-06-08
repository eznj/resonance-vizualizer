/* ============================================================
   LissajousCanvas — parametric trace x=sin(u+φ), y=sin(r·u).
   r = f2/f1 of the first two active partials. Irrational r (φ)
   never closes, so the figure precesses — that's the point.

   Perf: the trace is drawn as one path split into a handful of
   alpha bands (tail→head fade) plus a wide faint halo for the
   glow — NOT 2600 shadow-blurred per-segment strokes.
   ============================================================ */
import { useEffect, useRef } from 'react';
import type { Palette, PartialSpec } from '../types';
import { createSizer, rgba } from '../visuals/palette';

interface Props {
  partials: PartialSpec[];
  palette: Palette;
  skin: 'flat' | 'skeuo';
  motion: boolean;
}

const STEPS = 2000;
const BANDS = 12;
const TAU = Math.PI * 2;
const CYCLES = 28;

export function LissajousCanvas({ partials, palette, skin, motion }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const palRef = useRef(palette);
  palRef.current = palette;
  const skinRef = useRef(skin);
  skinRef.current = skin;
  const motionRef = useRef(motion);
  motionRef.current = motion;
  const partRef = useRef(partials);
  partRef.current = partials;

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const { size, dispose } = createSizer(canvas);
    const xs = new Float32Array(STEPS + 1);
    const ys = new Float32Array(STEPS + 1);
    let raf = 0;
    const t0 = performance.now();

    function frame(now: number) {
      const { w: W, h: H, dpr } = size;
      const pal = palRef.current;
      const crt = skinRef.current === 'skeuo';

      ctx.fillStyle = pal.screenBg;
      ctx.fillRect(0, 0, W, H);

      const traceCol = pal.screenTrace;
      const gridCol = rgba(pal.screenGrid, 0.5);

      // crosshair
      ctx.strokeStyle = gridCol;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W / 2, 0);
      ctx.lineTo(W / 2, H);
      ctx.moveTo(0, H / 2);
      ctx.lineTo(W, H / 2);
      ctx.stroke();

      const ps = partRef.current.filter((p) => !p.muted);
      const f1 = ps[0] ? ps[0].freq : 200;
      const f2 = ps[1] ? ps[1].freq : f1 * 1.618;
      const ratio = f2 / f1;

      const phase = motionRef.current ? (now - t0) / 2600 : 0.6;
      const cx = W / 2;
      const cy = H / 2;
      const R = Math.min(W, H) * 0.4;

      for (let i = 0; i <= STEPS; i++) {
        const u = (i / STEPS) * CYCLES * TAU;
        xs[i] = cx + R * Math.sin(u + phase);
        ys[i] = cy + R * Math.sin(ratio * u);
      }

      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      // soft halo — one wide faint pass (cheap stand-in for shadowBlur)
      ctx.strokeStyle = rgba(traceCol, 0.1);
      ctx.lineWidth = (crt ? 3.6 : 2.6) * dpr;
      ctx.beginPath();
      ctx.moveTo(xs[0], ys[0]);
      for (let i = 1; i <= STEPS; i++) ctx.lineTo(xs[i], ys[i]);
      ctx.stroke();

      // bright trace in alpha bands so the leading edge reads brightest
      ctx.lineWidth = (crt ? 1.7 : 1.4) * dpr;
      for (let b = 0; b < BANDS; b++) {
        const i0 = Math.floor((b / BANDS) * STEPS);
        const i1 = Math.floor(((b + 1) / BANDS) * STEPS);
        const a = 0.12 + 0.62 * (b / (BANDS - 1));
        ctx.strokeStyle = rgba(traceCol, a);
        ctx.beginPath();
        ctx.moveTo(xs[i0], ys[i0]);
        for (let i = i0 + 1; i <= i1; i++) ctx.lineTo(xs[i], ys[i]);
        ctx.stroke();
      }

      // leading dot
      ctx.fillStyle = traceCol;
      ctx.beginPath();
      ctx.arc(xs[STEPS], ys[STEPS], 2.4 * dpr, 0, TAU);
      ctx.fill();

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
