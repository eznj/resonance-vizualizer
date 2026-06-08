/* ============================================================
   LissajousCanvas — parametric trace x=sin(u+φ), y=sin(r·u).
   r = f2/f1 of the first two active partials. Irrational r (φ)
   never closes, so the figure precesses — that's the point.
   ============================================================ */
import { useEffect, useRef } from 'react';
import type { Palette, PartialSpec } from '../types';
import { fitCanvas, rgba } from '../visuals/palette';

interface Props {
  partials: PartialSpec[];
  palette: Palette;
  skin: 'flat' | 'skeuo';
  motion: boolean;
}

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
    let raf = 0;
    const t0 = performance.now();

    function frame(now: number) {
      const { w: W, h: H, dpr } = fitCanvas(canvas);
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
      ctx.stroke();
      ctx.beginPath();
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
      const CYCLES = 28;
      const STEPS = 2600;
      const TAU = Math.PI * 2;

      ctx.lineWidth = (crt ? 1.7 : 1.4) * dpr;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.shadowColor = rgba(pal.screenTrace, 0.55);
      ctx.shadowBlur = (crt ? 7 : 4) * dpr;

      let prevX = 0;
      let prevY = 0;
      for (let i = 0; i <= STEPS; i++) {
        const u = (i / STEPS) * CYCLES * TAU;
        const x = cx + R * Math.sin(u + phase);
        const y = cy + R * Math.sin(ratio * u);
        if (i > 0) {
          const a = 0.1 + 0.62 * (i / STEPS); // tail → head
          ctx.strokeStyle = rgba(traceCol, a);
          ctx.beginPath();
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
        prevX = x;
        prevY = y;
      }
      ctx.shadowBlur = 0;

      // leading dot
      ctx.fillStyle = traceCol;
      ctx.beginPath();
      ctx.arc(prevX, prevY, 2.4 * dpr, 0, TAU);
      ctx.fill();

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} />;
}
