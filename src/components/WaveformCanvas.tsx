/* ============================================================
   WaveformCanvas — zero-crossing-stabilized oscilloscope.
   Glow is faked with a wide-faint + thin-bright double stroke of
   one path (no per-frame shadowBlur).
   ============================================================ */
import { useEffect, useRef } from 'react';
import type { ResonanceEngine } from '../audio/ResonanceEngine';
import type { Palette } from '../types';
import { createSizer, rgba } from '../visuals/palette';

interface Props {
  engine: ResonanceEngine;
  palette: Palette;
  skin: 'flat' | 'skeuo';
}

export function WaveformCanvas({ engine, palette, skin }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const palRef = useRef(palette);
  palRef.current = palette;
  const skinRef = useRef(skin);
  skinRef.current = skin;

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const { size, dispose } = createSizer(canvas);
    let raf = 0;

    function frame() {
      const { w: W, h: H, dpr } = size;
      const pal = palRef.current;
      const crt = skinRef.current === 'skeuo';
      const wave = engine.getWaveform();

      ctx.fillStyle = pal.screenBg;
      ctx.fillRect(0, 0, W, H);
      const lineCol = pal.screenTrace;
      const gridCol = rgba(pal.screenGrid, 0.5);

      // grid 8×4 — batched into a single path
      ctx.strokeStyle = gridCol;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const cols = 8;
      const rows = 4;
      for (let c = 1; c < cols; c++) {
        const gx = (W * c) / cols;
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, H);
      }
      for (let r = 1; r < rows; r++) {
        const gy = (H * r) / rows;
        ctx.moveTo(0, gy);
        ctx.lineTo(W, gy);
      }
      ctx.stroke();

      if (wave) {
        const n = wave.length;
        let start = 0;
        for (let s = 1; s < n / 2; s++) {
          if (wave[s - 1] < 128 && wave[s] >= 128) {
            start = s;
            break;
          }
        }
        const span = Math.floor(n / 2);
        const path = new Path2D();
        for (let x = 0; x < W; x++) {
          let idx = start + Math.floor((x / W) * span);
          if (idx >= n) idx = n - 1;
          const vy = (wave[idx] - 128) / 128;
          const y = H / 2 - vy * (H / 2 - 6 * dpr);
          if (x === 0) path.moveTo(x, y);
          else path.lineTo(x, y);
        }
        ctx.lineJoin = 'round';
        // faint halo
        ctx.strokeStyle = rgba(lineCol, 0.18);
        ctx.lineWidth = (crt ? 5 : 3.5) * dpr;
        ctx.stroke(path);
        // bright trace
        ctx.strokeStyle = lineCol;
        ctx.lineWidth = (crt ? 2.2 : 1.7) * dpr;
        ctx.stroke(path);
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
