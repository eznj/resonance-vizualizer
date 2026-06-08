/* ============================================================
   Knob — rotary control. Drag vertically (Shift = fine) or use
   the wheel. Frequency mapping is logarithmic; sweep is 270°.
   ============================================================ */
import { useRef } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from 'react';

interface Props {
  value: number;
  min: number;
  max: number;
  log?: boolean;
  muted?: boolean;
  size?: number;
  onChange: (v: number) => void;
}

const SWEEP = 270;
const A0 = -135;

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [cx + r * Math.sin(rad), cy - r * Math.cos(rad)];
}
function describeArc(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const p0 = polar(cx, cy, r, a0);
  const p1 = polar(cx, cy, r, a1);
  const large = a1 - a0 <= 180 ? 0 : 1;
  return `M ${p0[0]} ${p0[1]} A ${r} ${r} 0 ${large} 1 ${p1[0]} ${p1[1]}`;
}

export function Knob({ value, min, max, log, muted, size = 78, onChange }: Props) {
  const drag = useRef<{ y: number; pos: number } | null>(null);
  const moveRef = useRef<(e: PointerEvent) => void>(() => {});
  const upRef = useRef<() => void>(() => {});

  const toPos = (v: number) =>
    log ? Math.log(v / min) / Math.log(max / min) : (v - min) / (max - min);
  const fromPos = (p: number) => {
    p = Math.max(0, Math.min(1, p));
    return log ? min * Math.pow(max / min, p) : min + (max - min) * p;
  };

  const pos = Math.max(0, Math.min(1, toPos(value)));
  const angle = A0 + pos * SWEEP;

  const onUp = () => {
    drag.current = null;
    window.removeEventListener('pointermove', moveRef.current);
    window.removeEventListener('pointerup', upRef.current);
  };
  const onMove = (e: PointerEvent) => {
    if (!drag.current) return;
    const dy = drag.current.y - e.clientY;
    const fine = e.shiftKey ? 0.25 : 1;
    const np = drag.current.pos + (dy / 160) * fine;
    onChange(fromPos(np));
  };
  moveRef.current = onMove;
  upRef.current = onUp;

  const onDown = (e: ReactPointerEvent) => {
    e.preventDefault();
    drag.current = { y: e.clientY, pos };
    window.addEventListener('pointermove', moveRef.current);
    window.addEventListener('pointerup', upRef.current);
  };
  const onWheel = (e: ReactWheelEvent) => {
    const np = pos - Math.sign(e.deltaY) * 0.03;
    onChange(fromPos(np));
  };

  return (
    <div
      className={'knob' + (muted ? ' muted' : '')}
      style={{ '--size': size + 'px' } as CSSProperties}
      onPointerDown={onDown}
      onWheel={onWheel}
      role="slider"
      aria-valuenow={Math.round(value)}
      aria-valuemin={min}
      aria-valuemax={max}
    >
      <svg viewBox="0 0 100 100">
        <path
          className="track"
          d={describeArc(50, 50, 42, A0, A0 + SWEEP)}
          fill="none"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <path
          className="value-arc"
          d={describeArc(50, 50, 42, A0, angle)}
          fill="none"
          strokeWidth={3}
          strokeLinecap="round"
        />
      </svg>
      <div className="cap" />
      <div
        className="pointer"
        style={{ transform: `translateX(-50%) rotate(${angle}deg)` }}
      />
    </div>
  );
}
