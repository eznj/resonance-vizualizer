import React, { useRef, useEffect } from 'react';
import { PHI, calculateRatio, isGoldenRatio } from '../utils/phi';

interface CymaticDetailedProps {
  freq1: number;
  freq2: number;
  freq3: number;
  mode1: number;
  mode2: number;
  mode3: number;
  gain: number;
}

export const CymaticDetailed: React.FC<CymaticDetailedProps> = ({ freq1, freq2, freq3, mode1, mode2, mode3, gain }) => {
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

    // Fragment shader with Bessel function approximation for authentic cymatic patterns
    const fragmentShaderSource = `
      precision highp float;
      
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform float u_freq1;
      uniform float u_freq2;
      uniform float u_freq3;
      uniform float u_mode1;
      uniform float u_mode2;
      uniform float u_mode3;
      uniform float u_gain;
      uniform float u_phi;
      uniform bool u_isGolden;
      
      #define PI 3.14159265359
      
      // Approximate Bessel J0 function using power series
      float besselJ0(float x) {
        float ax = abs(x);
        if (ax < 8.0) {
          float y = x * x;
          float ans1 = 57568490574.0 + y * (-13362590354.0 + y * (651619640.7 + 
            y * (-11214424.18 + y * (77392.33017 + y * (-184.9052456)))));
          float ans2 = 57568490411.0 + y * (1029532985.0 + y * (9494680.718 + 
            y * (59272.64853 + y * (267.8532712 + y * 1.0))));
          return ans1 / ans2;
        } else {
          float z = 8.0 / ax;
          float y = z * z;
          float xx = ax - 0.785398164;
          float p0 = 1.0;
          float p1 = -0.1098628627 * y;
          float p2 = 0.2734510407 * y * y;
          float q0 = -0.1562499995 * y;
          float q1 = 0.1430488765 * y * y;
          return sqrt(0.636619772 / ax) * (cos(xx) * (p0 + p1 + p2) - z * sin(xx) * (q0 + q1));
        }
      }
      
      // Approximate Bessel J1 function
      float besselJ1(float x) {
        float ax = abs(x);
        if (ax < 8.0) {
          float y = x * x;
          float ans1 = x * (72362614232.0 + y * (-7895059235.0 + y * (242396853.1 + 
            y * (-2972611.439 + y * (15704.48260 + y * (-30.16036606))))));
          float ans2 = 144725228442.0 + y * (2300535178.0 + y * (18583304.74 + 
            y * (99447.43394 + y * (376.9991397 + y * 1.0))));
          return ans1 / ans2;
        } else {
          float z = 8.0 / ax;
          float y = z * z;
          float xx = ax - 2.356194491;
          float p0 = 1.0;
          float p1 = 0.183105e-2 * y;
          float p2 = -0.3516396496 * y * y;
          float q0 = 0.04687499995 * y;
          float q1 = -0.2002690873 * y * y;
          float ans = sqrt(0.636619772 / ax) * (cos(xx) * (p0 + p1 + p2) - z * sin(xx) * (q0 + q1));
          return x < 0.0 ? -ans : ans;
        }
      }
      
      void main() {
        // Normalize coordinates to [-1, 1] with circular aspect
        vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
        float r = length(uv);
        float theta = atan(uv.y, uv.x);
        
        // Fade out at edges for circular boundary
        if (r > 0.5) {
          gl_FragColor = vec4(0.02, 0.02, 0.05, 1.0);
          return;
        }
        
        // Use the explicitly set modes for angular patterns
        float mode1 = u_mode1;
        float mode2 = u_mode2;
        float mode3 = u_mode3;
        
        // Scale radius for wave number
        float k1 = u_freq1 * 0.15;
        float k2 = u_freq2 * 0.15;
        float k3 = u_freq3 * 0.15;
        
        // Create three modal patterns using Bessel functions
        float radial1 = besselJ0(k1 * r);
        float radial2 = besselJ1(k2 * r);
        float radial3 = besselJ0(k3 * r * 0.8);
        
        float angular1 = cos(mode1 * theta);
        float angular2 = cos(mode2 * theta + PI * 0.5);
        float angular3 = sin(mode3 * theta);
        
        // Time-dependent oscillation
        float phase1 = sin(u_time * u_freq1 * 0.01);
        float phase2 = sin(u_time * u_freq2 * 0.01 * u_phi);
        float phase3 = sin(u_time * u_freq3 * 0.01 * u_phi * u_phi);
        
        // Combine modal patterns
        float z1 = radial1 * angular1 * phase1;
        float z2 = radial2 * angular2 * phase2 * 0.7;
        float z3 = radial3 * angular3 * phase3 * 0.5;
        
        float displacement = z1 + z2 + z3;
        
        // Edge dampening for realistic behavior
        float dampening = exp(-r * 3.0);
        displacement *= dampening;
        
        // Create sharp nodal contrast
        float intensity = abs(displacement);
        float nodeSharpness = 12.0;
        float nodePattern = pow(intensity, 1.0 / nodeSharpness);
        
        // Add subtle interference rings
        float rings = sin(r * 40.0 - u_time * 2.0) * 0.05;
        nodePattern += rings;
        
        // Color mapping based on golden ratio state
        vec3 color;
        if (u_isGolden) {
          // Golden/warm palette for phi resonance - more saturated
          float warm = pow(nodePattern, 0.6);
          color = vec3(
            0.9 * warm + 0.15,
            0.7 * warm + 0.25,
            0.3 * warm + 0.05
          );
          // Add bright golden highlights at antinodes
          color += vec3(0.6, 0.4, 0.1) * pow(nodePattern, 4.0);
        } else {
          // Cool blue/cyan palette - more realistic to actual CymaScope
          float cool = pow(nodePattern, 0.7);
          color = vec3(
            0.05 * cool,
            0.4 * cool + 0.1,
            0.8 * cool + 0.2
          );
          // Add bright cyan highlights at antinodes
          color += vec3(0.1, 0.5, 0.8) * pow(nodePattern, 3.0);
        }
        
        // Add center glow effect
        float centerGlow = exp(-r * 6.0) * 0.15;
        color += centerGlow;
        
        // Create authentic dark nodes
        float nodeMask = smoothstep(0.0, 0.3, nodePattern);
        color *= nodeMask;
        
        // Apply gain control
        color *= u_gain;
        
        // Gamma correction for contrast
        color = pow(color, vec3(0.7));
        
        // Add subtle specular reflection
        float specular = pow(nodePattern, 8.0) * 0.3;
        color += vec3(specular);
        
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
    const mode1Location = gl.getUniformLocation(program, 'u_mode1');
    const mode2Location = gl.getUniformLocation(program, 'u_mode2');
    const mode3Location = gl.getUniformLocation(program, 'u_mode3');
    const gainLocation = gl.getUniformLocation(program, 'u_gain');
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
      gl.clearColor(0.02, 0.02, 0.05, 1.0);
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
      gl.uniform1f(mode1Location, mode1);
      gl.uniform1f(mode2Location, mode2);
      gl.uniform1f(mode3Location, mode3);
      gl.uniform1f(gainLocation, gain);
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
  }, [freq1, freq2, freq3, mode1, mode2, mode3, gain]);

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={240}
      className="visualization-canvas cymatic-detailed"
    />
  );
};