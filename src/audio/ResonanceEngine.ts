/* ============================================================
   ResonanceEngine — Web Audio core
   Six oscillator voices, created once and gain-gated. Master
   chain: gain → gentle lowpass → compressor → analyser → out.
   Ported from the design prototype's audio.js.
   ============================================================ */
import type { PartialSpec } from '../types';

export const MAX_VOICES = 6;

interface Voice {
  osc: OscillatorNode;
  gain: GainNode;
  type: OscillatorType;
}

export class ResonanceEngine {
  private ctx: AudioContext | null = null;
  private voices: Voice[] = [];
  private master: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private spec: Uint8Array<ArrayBuffer> | null = null;
  private wave: Uint8Array<ArrayBuffer> | null = null;
  private suspendTimer: ReturnType<typeof setTimeout> | null = null;
  playing = false;

  /** Lazily build the context + node graph on first use (after a gesture). */
  private ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    this.ctx = ctx;

    // master chain
    const master = ctx.createGain();
    master.gain.value = 0;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 13000;
    filter.Q.value = 0.4;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 24;
    comp.ratio.value = 3;
    comp.attack.value = 0.006;
    comp.release.value = 0.25;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 4096;
    analyser.smoothingTimeConstant = 0.8;

    master.connect(filter);
    filter.connect(comp);
    comp.connect(analyser);
    analyser.connect(ctx.destination);

    this.master = master;
    this.analyser = analyser;
    this.spec = new Uint8Array(analyser.frequencyBinCount);
    this.wave = new Uint8Array(analyser.fftSize);

    // create + start the voices once; thereafter they are only gain-gated
    for (let i = 0; i < MAX_VOICES; i++) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 220;
      const g = ctx.createGain();
      g.gain.value = 0;
      osc.connect(g);
      g.connect(master);
      osc.start();
      this.voices.push({ osc, gain: g, type: 'sine' });
    }
  }

  start() {
    this.ensure();
    if (this.suspendTimer) {
      clearTimeout(this.suspendTimer);
      this.suspendTimer = null;
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    this.playing = true;
  }

  stop() {
    this.playing = false;
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(0, now, 0.03);
    for (const v of this.voices) {
      v.gain.gain.setTargetAtTime(0, now, 0.03);
    }
    if (this.suspendTimer) clearTimeout(this.suspendTimer);
    this.suspendTimer = setTimeout(() => {
      if (!this.playing && this.ctx && this.ctx.state === 'running') this.ctx.suspend();
    }, 260);
  }

  /** Ramp every voice toward the requested partials + master level. */
  sync(partials: PartialSpec[], masterGain: number) {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const target = this.playing ? masterGain : 0;
    this.master.gain.setTargetAtTime(target, now, 0.04);

    for (let i = 0; i < MAX_VOICES; i++) {
      const v = this.voices[i];
      const p = partials[i];
      if (p && this.playing && !p.muted) {
        if (v.type !== p.type) {
          v.osc.type = p.type;
          v.type = p.type;
        }
        v.osc.frequency.setTargetAtTime(p.freq, now, 0.02);
        // normalize so stacked partials don't clip
        const amp = p.amp * 0.32;
        v.gain.gain.setTargetAtTime(amp, now, 0.03);
      } else {
        v.gain.gain.setTargetAtTime(0, now, 0.03);
        if (p && v.type !== p.type) {
          v.osc.type = p.type;
          v.type = p.type;
        }
        if (p) v.osc.frequency.setTargetAtTime(p.freq, now, 0.04);
      }
    }
  }

  getSpectrum(): Uint8Array | null {
    if (!this.analyser || !this.spec) return null;
    this.analyser.getByteFrequencyData(this.spec);
    return this.spec;
  }

  getWaveform(): Uint8Array | null {
    if (!this.analyser || !this.wave) return null;
    this.analyser.getByteTimeDomainData(this.wave);
    return this.wave;
  }

  sampleRate(): number {
    return this.ctx ? this.ctx.sampleRate : 44100;
  }
}
