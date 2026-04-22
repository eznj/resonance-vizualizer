import React, { useEffect, useRef } from 'react';
import { AudioAnalysis } from '../hooks/useAudioEngine';

interface WaveformCanvasProps {
  audioAnalysis: AudioAnalysis;
}

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({ audioAnalysis }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    const analyser = audioAnalysis.analyser;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      analyser.getFloatTimeDomainData(audioAnalysis.timeData);

      ctx.fillStyle = 'rgb(20, 20, 30)';
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgb(100, 255, 200)';
      ctx.beginPath();

      const sliceWidth = width / audioAnalysis.timeData.length;
      let x = 0;

      for (let i = 0; i < audioAnalysis.timeData.length; i++) {
        const v = audioAnalysis.timeData[i];
        const y = (v + 1) / 2 * height;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioAnalysis]);

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={240}
      className="visualization-canvas"
    />
  );
};