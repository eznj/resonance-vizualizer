/* ============================================================
   Resonance Visualizer — an instrument for hearing the golden
   ratio. Six gain-gated voices, four LCD-screen visualizations
   that rotate around their slots, and a Teenage-Engineering-
   flavored skeuomorphic chassis.
   ============================================================ */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ResonanceEngine } from './audio/ResonanceEngine';
import { resolvePalette } from './visuals/palette';
import { PHI, FMIN, FMAX, clampF, phiSet } from './utils/phi';
import type { OscType, Palette, PartialSpec } from './types';
import { SpectrumCanvas } from './components/SpectrumCanvas';
import type { SpectrumMode } from './components/SpectrumCanvas';
import { WaveformCanvas } from './components/WaveformCanvas';
import { LissajousCanvas } from './components/LissajousCanvas';
import { CymaticsCanvas } from './components/CymaticsCanvas';
import { Knob } from './components/Knob';
import { WaveSelect } from './components/WaveSelect';
import { Icon } from './components/Icon';
import { ThemeSwitch } from './components/ThemeSwitch';
import './styles.css';

// Production configuration (the prototype's Tweaks panel is dropped — these
// are its shipped defaults).
const SKIN = 'skeuo' as const;
const ACCENT = '#E8531F';
const SPECTRUM_MODE: SpectrumMode = 'area';
const PARTIAL_COUNT = 4;
const BASE_FREQ = 110;

type Theme = 'light' | 'dark';
type SlotId = 'TL' | 'R' | 'BL' | 'BM';
type VisualId = 'spectrum' | 'cymatic' | 'waveform' | 'lissajous';

// Screen positions around the ring, listed counter-clockwise.
const SLOT_RING: SlotId[] = ['R', 'TL', 'BL', 'BM'];
const BASE_VISUAL: Record<SlotId, VisualId> = {
  TL: 'spectrum',
  R: 'cymatic',
  BL: 'waveform',
  BM: 'lissajous',
};

export default function App() {
  const engineRef = useRef<ResonanceEngine | null>(null);
  if (!engineRef.current) engineRef.current = new ResonanceEngine();
  const engine = engineRef.current;

  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('rv-theme') as Theme) || 'light',
  );
  const [partials, setPartials] = useState<PartialSpec[]>(() => phiSet(PARTIAL_COUNT, BASE_FREQ));
  const [playing, setPlaying] = useState(false);
  const [masterGain, setMasterGain] = useState(0.6);
  const [rotation, setRotation] = useState(0);
  const [palette, setPalette] = useState<Palette | null>(null);

  const motion = useMemo(
    () => !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  // apply root attributes + accent, then resolve the canvas palette
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-skin', SKIN);
    root.style.setProperty('--accent', ACCENT);
    setPalette(resolvePalette());
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('rv-theme', theme);
  }, [theme]);

  // audio transport + per-frame-independent voice sync
  useEffect(() => {
    if (playing) engine.start();
    else engine.stop();
  }, [engine, playing]);
  useEffect(() => {
    engine.sync(partials, masterGain);
  }, [engine, partials, masterGain, playing]);

  // ---- partial mutations ----
  function setPartial(i: number, patch: Partial<PartialSpec>) {
    setPartials((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }
  function snapPhi() {
    setPartials((prev) => {
      const base = prev[0].freq;
      return prev.map((p, i) => ({ ...p, freq: clampF(base * Math.pow(PHI, i)) }));
    });
  }
  function snapHarmonic() {
    setPartials((prev) => {
      const base = prev[0].freq;
      return prev.map((p, i) => ({ ...p, freq: clampF(base * (i + 1)) }));
    });
  }
  function randomize() {
    const types: OscType[] = ['sine', 'triangle', 'sawtooth', 'square'];
    setPartials((prev) =>
      prev.map(() => {
        const f = FMIN * Math.pow(FMAX / FMIN, Math.random());
        return {
          freq: clampF(f),
          amp: 0.45 + Math.random() * 0.5,
          type: types[(Math.random() * 4) | 0],
          muted: false,
        };
      }),
    );
  }
  function reset() {
    setPartials(phiSet(PARTIAL_COUNT, BASE_FREQ));
  }

  // ---- ratio analysis ----
  const active = partials.filter((p) => !p.muted);
  const ratios = partials.slice(0, -1).map((p, i) => {
    const r = partials[i + 1].freq / p.freq;
    return { a: i + 1, b: i + 2, r, near: Math.abs(r - PHI) / PHI < 0.018 };
  });
  const locked = ratios.length > 0 && ratios.every((x) => x.near);

  if (!palette) return null;

  // ---- chart rotation ----
  function slotVisual(slot: SlotId): VisualId {
    const idx = SLOT_RING.indexOf(slot);
    const orig = (((idx - rotation) % 4) + 4) % 4;
    return BASE_VISUAL[SLOT_RING[orig]];
  }
  function visMeta(id: VisualId): { title: string; meta: string } {
    if (id === 'spectrum')
      return { title: 'Spectrum Analyzer', meta: active.length + ' partials · ' + SPECTRUM_MODE };
    if (id === 'lissajous') return { title: 'Lissajous Figure', meta: 'f2 / f1' };
    if (id === 'cymatic') return { title: 'Cymatic Field', meta: 'Chladni' };
    return { title: 'Waveform', meta: playing ? 'live' : 'idle' };
  }
  function visCanvas(id: VisualId) {
    if (id === 'spectrum')
      return (
        <SpectrumCanvas engine={engine} partials={partials} palette={palette!} mode={SPECTRUM_MODE} />
      );
    if (id === 'lissajous')
      return <LissajousCanvas partials={partials} palette={palette!} skin={SKIN} motion={motion} />;
    if (id === 'cymatic')
      return <CymaticsCanvas partials={partials} palette={palette!} motion={motion} />;
    return <WaveformCanvas engine={engine} palette={palette!} skin={SKIN} />;
  }
  function Slot({ slot, cls }: { slot: SlotId; cls: string }) {
    const id = slotVisual(slot);
    const m = visMeta(id);
    return (
      <section className={'panel slot ' + cls}>
        <div className="panel-head">
          <h2>{m.title}</h2>
          <div className="meta">{m.meta}</div>
        </div>
        <div className="canvas-wrap slot-canvas" key={id + '-' + rotation}>
          {visCanvas(id)}
        </div>
      </section>
    );
  }

  return (
    <div className="app">
      {/* ===== TOP BAR ===== */}
      <header className="masthead">
        <div className="brand">
          <span className="wordmark">Resonance Visualizer</span>
          <span className="tagline">Golden ratio in sound</span>
        </div>
        <div className="masthead-tools">
          <ThemeSwitch
            dark={theme === 'dark'}
            onToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          />
        </div>
      </header>

      {/* ===== TRANSPORT ===== */}
      <section className="transport subbar">
        <button className="btn btn-primary" onClick={() => setPlaying(!playing)}>
          <Icon name={playing ? 'pause' : 'play'} size={16} />
          {playing ? 'Pause' : 'Play'}
        </button>
        <div className="fader">
          <label>Level</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={masterGain}
            onChange={(e) => setMasterGain(parseFloat(e.target.value))}
          />
        </div>
        <div className="divider-v" />
        <div className="group">
          <button className="btn" onClick={snapPhi} title="Lock to golden ratio">
            <Icon name="link" size={15} />
            Golden
          </button>
          <button className="btn" onClick={snapHarmonic} title="Integer harmonic series">
            <Icon name="link" size={15} />
            Harmonic
          </button>
          <button className="btn" onClick={randomize} title="Randomize partials">
            <Icon name="dice" size={15} />
            Detune
          </button>
        </div>
        <div className="spacer" />
        <button
          className="btn"
          onClick={() => setRotation(rotation + 1)}
          title="Rotate charts counter-clockwise"
        >
          <Icon name="cycle" size={15} />
          Cycle Visuals
        </button>
        <button className="btn btn-ghost" onClick={reset} title="Reset">
          <Icon name="reset" size={15} />
          Reset
        </button>
      </section>

      {/* ===== STAGE ===== */}
      <div className="stage">
        <div className="col">
          <Slot slot="TL" cls="slot-tl" />
          <div className="scope-row">
            <Slot slot="BL" cls="slot-sm" />
            <Slot slot="BM" cls="slot-sm" />
          </div>

          {/* oscillator bank */}
          <section className="panel bank-panel">
            <div className="panel-head">
              <h2>Oscillator Bank</h2>
              <div className="meta">base {Math.round(partials[0].freq)} Hz · golden stack</div>
            </div>
            <div className="bank-grid">
              {partials.map((p, i) => {
                const ratioToBase = p.freq / partials[0].freq;
                return (
                  <div
                    className={'osc' + (p.muted ? ' muted' : '') + (locked ? ' locked' : '')}
                    key={i}
                  >
                    <div className="osc-index">
                      <span className="dot" />
                      Osc {i + 1}
                      <button
                        className="btn chip"
                        style={{ marginLeft: 6 }}
                        onClick={() => setPartial(i, { muted: !p.muted })}
                        title={p.muted ? 'Unmute' : 'Mute'}
                      >
                        <Icon name={p.muted ? 'mute' : 'sound'} size={13} />
                      </button>
                    </div>
                    <Knob
                      value={p.freq}
                      min={FMIN}
                      max={FMAX}
                      log
                      muted={p.muted}
                      onChange={(v) => setPartial(i, { freq: v })}
                    />
                    <div className="osc-freq">
                      {Math.round(p.freq)}
                      <span className="unit">Hz</span>
                    </div>
                    <div className="osc-ratio">
                      {i === 0 ? 'base tone' : '×' + ratioToBase.toFixed(3)}
                    </div>
                    <WaveSelect value={p.type} onChange={(tp) => setPartial(i, { type: tp })} />
                    <input
                      className="level"
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={p.amp}
                      onChange={(e) => setPartial(i, { amp: parseFloat(e.target.value) })}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="col">
          <Slot slot="R" cls="slot-r" />

          {/* resonance state */}
          <section className="panel">
            <div className="panel-head">
              <h2>Resonance State</h2>
              <div className="meta">1 : 1.618</div>
            </div>
            <div className="readout">
              <div className={'lock-state' + (locked ? ' locked' : '')}>
                <div className="lock-led" />
                <div className="lock-label">{locked ? 'Locked' : 'Detuned'}</div>
              </div>
              <div className="ratio-rows">
                {ratios.map((x, i) => {
                  const off = Math.max(-1, Math.min(1, (x.r - PHI) / (PHI * 0.5)));
                  return (
                    <div className={'ratio-row' + (x.near ? ' near' : '')} key={i}>
                      <div className="pair">
                        f{x.b} / f{x.a}
                      </div>
                      <div className="val">{x.r.toFixed(4)}</div>
                      <div className="ratio-bar">
                        <i style={{ transform: `translateX(${off * 60}px)` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="phi-figure">
                Each tone sits a golden ratio — <b>×1.618</b> — above the one below it. Lock the
                stack and the partials interlace without ever sharing a harmonic.
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ===== FOOTNOTE ===== */}
      <footer className="footnote">
        <div className="serif">An instrument for hearing the golden ratio.</div>
        <div>
          {theme.toUpperCase()} · {SKIN.toUpperCase()} · {Math.round(masterGain * 100)}% LEVEL
        </div>
      </footer>
    </div>
  );
}
