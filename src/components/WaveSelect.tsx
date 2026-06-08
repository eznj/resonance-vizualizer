/* ============================================================
   WaveSelect — segmented control of four waveform glyphs.
   ============================================================ */
import type { OscType } from '../types';

const WAVE_PATHS: Record<OscType, string> = {
  sine: 'M1,6.5 C3.5,1 7.5,1 11,6.5 C14.5,12 18.5,12 21,6.5',
  triangle: 'M1,11 L5.5,2 L11,11 L16.5,2 L21,11',
  sawtooth: 'M1,11 L6,2 L6,11 L11,2 L11,11 L16,2 L16,11 L21,2',
  square: 'M1,11 L1,2 L7.7,2 L7.7,11 L14.3,11 L14.3,2 L21,2',
};

const TYPES: OscType[] = ['sine', 'triangle', 'sawtooth', 'square'];

export function WaveGlyph({ type }: { type: OscType }) {
  return (
    <svg viewBox="0 0 22 13" fill="none">
      <path
        d={WAVE_PATHS[type]}
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface Props {
  value: OscType;
  onChange: (t: OscType) => void;
}

export function WaveSelect({ value, onChange }: Props) {
  return (
    <div className="seg">
      {TYPES.map((t) => (
        <button
          key={t}
          className={value === t ? 'on' : ''}
          onClick={() => onChange(t)}
          title={t}
        >
          <WaveGlyph type={t} />
        </button>
      ))}
    </div>
  );
}
