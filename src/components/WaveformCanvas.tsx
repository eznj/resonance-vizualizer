/* ============================================================
   WaveformCanvas — zero-crossing-stabilized oscilloscope
   ============================================================ */
import { useEffect, useRef } from 'react';
import type { ResonanceEngine } from '../audio/ResonanceEngine';
import type { Palette } from '../types';
import { fitCanvas, rgba } from '../visuals/palette';

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
    let raf = 0;

    function frame() {
      const { w: W, h: H, dpr } = fitCanvas(canvas);
      const pal = palRef.current;
      const crt = skinRef.current === 'skeuo';
      const wave = engine.getWaveform();

      ctx.fillStyle = pal.screenBg;
      ctx.fillRect(0, 0, W, H);
      const lineCol = pal.screenTrace;
      const glowCol = rgba(pal.screenTrace, 0.6);
      const gridCol = rgba(pal.screenGrid, 0.5);

      // grid 8×4
      ctx.strokeStyle = gridCol;
      ctx.lineWidth = 1;
      const cols = 8;
      const rows = 4;
      for (let c = 1; c < cols; c++) {
        const gx = (W * c) / cols;
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, H);
        ctx.stroke();
      }
      for (let r = 1; r < rows; r++) {
        const gy = (H * r) / rows;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(W, gy);
        ctx.stroke();
      }

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
        ctx.lineWidth = (crt ? 2.2 : 1.7) * dpr;
        ctx.strokeStyle = lineCol;
        ctx.lineJoin = 'round';
        ctx.shadowColor = glowCol;
        ctx.shadowBlur = (crt ? 9 : 5) * dpr;
        ctx.beginPath();
        for (let x = 0; x < W; x++) {
          let idx = start + Math.floor((x / W) * span);
          if (idx >= n) idx = n - 1;
          const vy = (wave[idx] - 128) / 128;
          const y = H / 2 - vy * (H / 2 - 6 * dpr);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      raf = requestAnimationFrame(frame);
    }
    frame();
    return () => cancelAnimationFrame(raf);
  }, [engine]);

  return <canvas ref={ref} />;
}
