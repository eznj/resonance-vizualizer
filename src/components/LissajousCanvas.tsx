import React, { useEffect, useRef } from 'react';
import { isGoldenRatio, calculateRatio } from '../utils/phi';

interface LissajousCanvasProps {
  freq1: number;
  freq2: number;
  freq3: number;
}

export const LissajousCanvas: React.FC<LissajousCanvasProps> = ({ freq1, freq2, freq3 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = Math.min(width, height) * 0.4;

    const ratio12 = calculateRatio(freq1, freq2);
    const ratio23 = calculateRatio(freq2, freq3);
    const ratio13 = calculateRatio(freq1, freq3);
    const isGolden = isGoldenRatio(ratio12, 0.01) || isGoldenRatio(ratio23, 0.01) || isGoldenRatio(ratio13, 0.01);

    const draw = () => {
      ctx.fillStyle = 'rgb(20, 20, 30)';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, height);
      ctx.stroke();

      const points = [];
      const numPoints = 3000;
      const phaseShift = phaseRef.current;

      for (let i = 0; i < numPoints; i++) {
        const t = (i / numPoints) * Math.PI * 2 * 8;
        const x = (Math.sin(freq1 * t / 100 + phaseShift) + Math.sin(freq3 * t / 100 + phaseShift * 1.5)) / 2;
        const y = Math.sin(freq2 * t / 100);
        points.push({ x, y });
      }

      ctx.strokeStyle = isGolden 
        ? 'rgba(255, 215, 0, 0.8)'
        : 'rgba(100, 255, 200, 0.8)';
      ctx.lineWidth = isGolden ? 2 : 1.5;
      
      ctx.beginPath();
      points.forEach((point, i) => {
        const x = centerX + point.x * scale;
        const y = centerY + point.y * scale;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      if (isGolden) {
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, scale * 1.1, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '12px monospace';
      ctx.fillText(`f₁: ${freq1.toFixed(1)} Hz`, 10, 20);
      ctx.fillText(`f₂: ${freq2.toFixed(1)} Hz`, 10, 35);
      ctx.fillText(`f₃: ${freq3.toFixed(1)} Hz`, 10, 50);
      if (isGolden) {
        ctx.fillStyle = 'rgba(255, 215, 0, 1)';
        ctx.fillText('φ resonance', 10, 65);
      }

      phaseRef.current += 0.01;

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [freq1, freq2, freq3]);

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={240}
      className="visualization-canvas lissajous"
    />
  );
};