import React, { useRef, useEffect } from 'react';
import { PHI, calculateRatio, isGoldenRatio } from '../utils/phi';

interface CymaticWebGLProps {
  freq1: number;
  freq2: number;
  freq3: number;
}

export const CymaticWebGL: React.FC<CymaticWebGLProps> = ({ freq1, freq2, freq3 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    // Vertex shader - creates a full-screen quad
    const vertexShaderSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment shader - creates the cymatic interference pattern
    const fragmentShaderSource = `
      precision highp float;
      
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform float u_freq1;
      uniform float u_freq2;
      uniform float u_freq3;
      uniform float u_phi;
      uniform bool u_isGolden;
      
      void main() {
        // Normalize coordinates to [-1, 1] with circular aspect
        vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
        float r = length(uv);
        float angle = atan(uv.y, uv.x);
        
        // Fade out at edges for circular boundary
        if (r > 0.5) {
          gl_FragColor = vec4(0.08, 0.08, 0.12, 1.0);
          return;
        }
        
        // Frequency scaling for better visual range
        float f1 = u_freq1 * 0.05;
        float f2 = u_freq2 * 0.05;
        float f3 = u_freq3 * 0.05;
        
        // Create multiple interference patterns
        float wave1 = sin(2.0 * 3.14159 * f1 * r + u_time);
        float wave2 = sin(2.0 * 3.14159 * f2 * r * u_phi + u_time * 1.2);
        float wave3 = sin(2.0 * 3.14159 * f3 * r * u_phi * u_phi + u_time * 0.8);
        
        // Angular modulation for spiral patterns (more pronounced in golden ratio)
        float angularMod = sin(angle * 5.0 + u_time * 0.5) * 0.3;
        float spiralMod = sin(angle * 3.0 + r * 10.0 + u_time) * 0.2;
        
        // Combine waves with different weightings
        float interference = (wave1 + wave2 * 0.8 + wave3 * 0.6) / 2.4;
        
        // Add angular modulation
        interference += angularMod + spiralMod;
        
        // Radial dampening for realistic wave behavior
        float dampening = exp(-r * 1.5);
        interference *= dampening;
        
        // Create sharper nodal lines
        float sharpness = 8.0;
        float nodePattern = sin(interference * sharpness) * 0.5 + 0.5;
        
        // Additional ring patterns for complexity
        float rings = sin(r * 30.0 - u_time * 2.0) * 0.1;
        nodePattern += rings;
        
        // Color mapping based on golden ratio state
        vec3 color;
        if (u_isGolden) {
          // Golden/warm palette for phi resonance
          float warm = pow(nodePattern, 0.8);
          color = vec3(
            0.9 * warm + 0.1,
            0.6 * warm + 0.2,
            0.2 * warm + 0.05
          );
          // Add golden highlights
          color += vec3(0.3, 0.2, 0.0) * pow(nodePattern, 3.0);
        } else {
          // Cool cyan/blue palette for normal state
          float cool = pow(nodePattern, 0.9);
          color = vec3(
            0.1 * cool,
            0.5 * cool + 0.2,
            0.8 * cool + 0.1
          );
          // Add cyan highlights
          color += vec3(0.0, 0.2, 0.3) * pow(nodePattern, 2.5);
        }
        
        // Add subtle glow at center
        float centerGlow = exp(-r * 4.0) * 0.2;
        color += centerGlow;
        
        // Gamma correction for better contrast
        color = pow(color, vec3(0.8));
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    // Helper function to create and compile shader
    function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
      const shader = gl.createShader(type);
      if (!shader) return null;
      
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      
      return shader;
    }

    // Helper function to create shader program
    function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram | null {
      const program = gl.createProgram();
      if (!program) return null;
      
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program linking error:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
      }
      
      return program;
    }

    // Create shaders and program
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) return;
    
    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) return;

    // Create a buffer for the full-screen quad
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]), gl.STATIC_DRAW);

    // Get attribute and uniform locations
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const freq1Location = gl.getUniformLocation(program, 'u_freq1');
    const freq2Location = gl.getUniformLocation(program, 'u_freq2');
    const freq3Location = gl.getUniformLocation(program, 'u_freq3');
    const phiLocation = gl.getUniformLocation(program, 'u_phi');
    const isGoldenLocation = gl.getUniformLocation(program, 'u_isGolden');

    let startTime = Date.now();

    const render = () => {
      if (!gl || !program) return;

      const currentTime = (Date.now() - startTime) * 0.001;
      
      // Check for golden ratio
      const ratio12 = calculateRatio(freq1, freq2);
      const ratio23 = calculateRatio(freq2, freq3);
      const ratio13 = calculateRatio(freq1, freq3);
      const isGolden = isGoldenRatio(ratio12, 0.01) || isGoldenRatio(ratio23, 0.01) || isGoldenRatio(ratio13, 0.01);

      // Set up viewport and clear
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0.08, 0.08, 0.12, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Use the shader program
      gl.useProgram(program);

      // Set up position attribute
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      // Set uniforms
      gl.uniform1f(timeLocation, currentTime);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(freq1Location, freq1);
      gl.uniform1f(freq2Location, freq2);
      gl.uniform1f(freq3Location, freq3);
      gl.uniform1f(phiLocation, PHI);
      gl.uniform1i(isGoldenLocation, isGolden ? 1 : 0);

      // Draw the quad
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

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
      width={512}
      height={512}
      className="visualization-canvas cymatic-webgl"
    />
  );
};