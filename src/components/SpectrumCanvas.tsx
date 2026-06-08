/* ============================================================
   SpectrumCanvas — log-frequency FFT analyzer on the LCD palette
   ============================================================ */
import { useEffect, useRef } from 'react';
import type { ResonanceEngine } from '../audio/ResonanceEngine';
import type { Palette, PartialSpec } from '../types';
import { createSizer, rgba } from '../visuals/palette';

export type SpectrumMode = 'area' | 'bars' | 'line';

interface Props {
  engine: ResonanceEngine;
  partials: PartialSpec[];
  palette: Palette;
  mode: SpectrumMode;
}

const FMIN = 28;

export function SpectrumCanvas({ engine, partials, palette, mode }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const partRef = useRef(partials);
  partRef.current = partials;
  const palRef = useRef(palette);
  palRef.current = palette;
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const { size, dispose } = createSizer(canvas);
    let raf = 0;

    function frame() {
      const { w: W, h: H, dpr } = size;
      const pal = palRef.current;
      const spec = engine.getSpectrum();
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = pal.screenBg;
      ctx.fillRect(0, 0, W, H);

      const sr = engine.sampleRate();
      const FMAX = sr / 2;
      const bins = spec ? spec.length : 1024;
      const logSpan = Math.log(FMAX / FMIN);
      const xOf = (f: number) => (Math.log(f / FMIN) / logSpan) * W;

      // frequency grid
      ctx.lineWidth = 1;
      ctx.font = 10 * dpr + "px 'IBM Plex Mono', monospace";
      ctx.textBaseline = 'bottom';
      const marks = [100, 1000, 10000];
      const labels = ['100', '1k', '10k'];
      for (let g = 0; g < marks.length; g++) {
        const gx = xOf(marks[g]);
        ctx.strokeStyle = rgba(pal.screenGrid, 0.55);
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, H);
        ctx.stroke();
        ctx.fillStyle = rgba(pal.screenInk, 0.85);
        ctx.fillText(labels[g], gx + 4 * dpr, H - 4 * dpr);
      }

      // build curve points, sampling every ~2 device px
      const step = Math.max(1, Math.round(2 * dpr));
      const pts: [number, number][] = [];
      for (let px = 0; px <= W; px += step) {
        const f = FMIN * Math.pow(FMAX / FMIN, px / W);
        let bin = Math.round((f * bins * 2) / sr);
        if (bin < 0) bin = 0;
        if (bin >= bins) bin = bins - 1;
        let v = spec ? spec[bin] / 255 : 0;
        v = Math.pow(v, 1.35);
        const y = H - 6 * dpr - v * (H - 18 * dpr);
        pts.push([px, y]);
      }

      const m = modeRef.current;
      if (m === 'bars') {
        ctx.fillStyle = rgba(pal.screenTrace, 0.85);
        for (let i = 0; i < pts.length; i++) {
          const [bx, by] = pts[i];
          ctx.fillRect(bx, by, step - 1 * dpr, H - by);
        }
      } else {
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        if (m === 'area') {
          ctx.lineTo(W, H);
          ctx.lineTo(0, H);
          ctx.closePath();
          const grad = ctx.createLinearGradient(0, 0, 0, H);
          grad.addColorStop(0, rgba(pal.screenTrace, 0.42));
          grad.addColorStop(1, rgba(pal.screenTrace, 0.03));
          ctx.fillStyle = grad;
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(pts[0][0], pts[0][1]);
          for (let j = 1; j < pts.length; j++) ctx.lineTo(pts[j][0], pts[j][1]);
        }
        ctx.lineWidth = 1.5 * dpr;
        ctx.strokeStyle = m === 'area' ? rgba(pal.screenTrace, 0.98) : rgba(pal.screenInk, 0.95);
        ctx.lineJoin = 'round';
        ctx.stroke();
      }

      // partial markers
      const ps = partRef.current;
      ctx.textBaseline = 'top';
      for (let p = 0; p < ps.length; p++) {
        const part = ps[p];
        if (part.muted) continue;
        const mx = xOf(part.freq);
        ctx.strokeStyle = rgba(pal.screenTrace, 0.5);
        ctx.lineWidth = 1 * dpr;
        ctx.setLineDash([2 * dpr, 3 * dpr]);
        ctx.beginPath();
        ctx.moveTo(mx, 0);
        ctx.lineTo(mx, H);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = pal.screenTrace;
        ctx.beginPath();
        ctx.arc(mx, 9 * dpr, 3 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = rgba(pal.screenInk, 0.95);
        ctx.font = 9.5 * dpr + "px 'IBM Plex Mono', monospace";
        ctx.fillText(String(p + 1), mx + 5 * dpr, 4 * dpr);
      }

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      dispose();
    };
  }, [engine]);

  return <canvas ref={ref} />;
}
