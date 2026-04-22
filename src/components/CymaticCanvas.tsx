import React, { useRef, useEffect } from 'react';
import { PHI, calculateRatio, isGoldenRatio } from '../utils/phi';

interface CymaticCanvasProps {
  freq1: number;
  freq2: number;
  freq3: number;
}

export const CymaticCanvas: React.FC<CymaticCanvasProps> = ({ freq1, freq2, freq3 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2;

    // Check for golden ratio relationships
    const ratio12 = calculateRatio(freq1, freq2);
    const ratio23 = calculateRatio(freq2, freq3);
    const isGolden = isGoldenRatio(ratio12, 0.01) || isGoldenRatio(ratio23, 0.01);

    const render = () => {
      const time = timeRef.current;
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          // Normalized coordinates from center
          const dx = x - centerX;
          const dy = y - centerY;
          const r = Math.sqrt(dx * dx + dy * dy);
          
          // Skip pixels outside circle
          if (r > maxRadius) {
            const idx = (y * width + x) * 4;
            data[idx] = 20;
            data[idx + 1] = 20;
            data[idx + 2] = 30;
            data[idx + 3] = 255;
            continue;
          }

          // Normalize radius
          const nr = r / maxRadius;
          const angle = Math.atan2(dy, dx);

          // Create multi-frequency interference pattern
          const wave1 = Math.sin(2 * Math.PI * freq1 * nr * 0.01 + time);
          const wave2 = Math.sin(2 * Math.PI * freq2 * nr * 0.01 * PHI + time * 1.2);
          const wave3 = Math.sin(2 * Math.PI * freq3 * nr * 0.01 * PHI * PHI + time * 0.8);
          
          // Angular modulation for spiral patterns
          const angularMod = Math.sin(angle * 3 + time * 0.5);
          
          // Combine waves with angular modulation
          const interference = (wave1 + wave2 * 0.8 + wave3 * 0.6) / 2.4;
          const radialMod = Math.exp(-nr * 0.5); // Dampening at edges
          const combined = interference * radialMod + angularMod * 0.1 * radialMod;
          
          // Create color based on interference
          const v = combined;
          
          // Color mapping with golden ratio enhancement
          let r_color, g_color, b_color;
          
          if (isGolden) {
            // Golden/warm colors for phi resonance
            const hue = 30 + v * 30; // Golden hues
            const sat = 0.8 + v * 0.2;
            const lum = 0.5 + v * 0.3;
            [r_color, g_color, b_color] = hslToRgb(hue / 360, sat, lum);
          } else {
            // Cool cyan/blue colors for normal state
            const hue = 180 + v * 60; // Cyan to blue
            const sat = 0.7 + v * 0.3;
            const lum = 0.4 + v * 0.4;
            [r_color, g_color, b_color] = hslToRgb(hue / 360, sat, lum);
          }

          // Apply gamma correction for better contrast
          const gamma = 0.8;
          r_color = Math.pow(r_color / 255, gamma) * 255;
          g_color = Math.pow(g_color / 255, gamma) * 255;
          b_color = Math.pow(b_color / 255, gamma) * 255;

          const idx = (y * width + x) * 4;
          data[idx] = r_color;
          data[idx + 1] = g_color;
          data[idx + 2] = b_color;
          data[idx + 3] = 255;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      
      // Add circular border
      ctx.strokeStyle = isGolden ? 'rgba(255, 215, 0, 0.5)' : 'rgba(100, 255, 200, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius - 1, 0, Math.PI * 2);
      ctx.stroke();

      // Add frequency labels
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '12px monospace';
      ctx.fillText(`Cymatic Pattern`, 10, 20);
      if (isGolden) {
        ctx.fillStyle = 'rgba(255, 215, 0, 1)';
        ctx.fillText('φ Resonance Active', 10, 35);
      }

      timeRef.current += 0.02;
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [freq1, freq2, freq3]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={400}
      className="visualization-canvas cymatic"
    />
  );
};

// Helper function to convert HSL to RGB
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}