import React, { useEffect, useRef } from 'react';
import { AudioAnalysis } from '../hooks/useAudioEngine';

interface SpectrumCanvasProps {
  audioAnalysis: AudioAnalysis;
}

export const SpectrumCanvas: React.FC<SpectrumCanvasProps> = ({ audioAnalysis }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioAnalysis.analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      audioAnalysis.analyser.getByteFrequencyData(audioAnalysis.frequencyData);

      ctx.fillStyle = 'rgb(20, 20, 30)';
      ctx.fillRect(0, 0, width, height);

      // Calculate bins for -100 to 600Hz range display
      const sampleRate = audioAnalysis.analyser.context.sampleRate;
      const nyquist = sampleRate / 2;
      const binCount = audioAnalysis.frequencyData.length;
      const hzPerBin = nyquist / binCount;
      
      // Display range: -100 to 600Hz (total 700Hz range)
      const displayMin = -100;
      const displayMax = 600;
      const displayRange = displayMax - displayMin;
      
      // Map the actual frequency data (0 to nyquist) to our display range
      const maxFreqIndex = Math.floor(600 / hzPerBin);
      const numBars = Math.min(maxFreqIndex, binCount);
      
      const barWidth = width / displayRange * 600; // Only use 600Hz of the 700Hz range for actual data
      const offsetX = width * (100 / displayRange); // Offset for the -100Hz padding
      
      // Fill the -100 to 0Hz range with baseline
      ctx.fillStyle = 'rgba(30, 30, 40, 0.5)';
      ctx.fillRect(0, 0, offsetX, height);
      
      // Draw frequency data from 0 to 600Hz
      let x = offsetX;
      const dataBarWidth = (width - offsetX) / numBars;

      for (let i = 0; i < numBars; i++) {
        const freq = i * hzPerBin;
        if (freq > 600) break;
        
        // Scale bar height to use more of the available space (leave room for labels)
        const maxBarHeight = height - 30; // Leave 30px for labels at bottom
        const barHeight = (audioAnalysis.frequencyData[i] / 255) * maxBarHeight;

        const r = (barHeight / maxBarHeight) * 255 + 25;
        const g = 250 - (barHeight / maxBarHeight) * 255;
        const b = 50;

        const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
        gradient.addColorStop(0, `rgb(${r}, ${g}, ${b})`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.3)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight - 25, dataBarWidth - 1, barHeight);

        x += dataBarWidth;
      }

      // Labels and markers
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '10px monospace';
      
      // Main range labels
      ctx.fillText('-100', 5, height - 5);
      ctx.fillText('600', width - 25, height - 5);
      
      // Add frequency markers at 100Hz intervals
      for (let freq = -100; freq <= 600; freq += 100) {
        const xPos = ((freq - displayMin) / displayRange) * width;
        if (freq >= 0 && freq !== 600) {
          ctx.fillText(`${freq}`, xPos - 10, height - 5);
        }
        
        // Add vertical grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(xPos, 0);
        ctx.lineTo(xPos, height - 25);
        ctx.stroke();
      }
      
      // Add Hz label
      ctx.fillText('Hz', width / 2 - 10, height - 5);

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
      className="visualization-canvas spectrum"
    />
  );
};