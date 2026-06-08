/* ============================================================
   Icon — inline SVG icon set (orange-on-charcoal treatment
   comes from CSS via currentColor).
   ============================================================ */

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [cx + r * Math.sin(rad), cy - r * Math.cos(rad)];
}

const ICONS: Record<string, string> = {
  play: 'M5 3.5 L5 16.5 L16 10 Z',
  pause: 'M6 4 L6 16 M14 4 L14 16',
  reset: 'M10 4 a6 6 0 1 0 6 6 M10 4 L10 1 M10 4 L13 4',
  mute: 'M4 8 L4 12 L7 12 L11 15 L11 5 L7 8 Z M14 8 L17 11 M17 8 L14 11',
  sound: 'M4 8 L4 12 L7 12 L11 15 L11 5 L7 8 Z M14 7 a4 4 0 0 1 0 6',
};

export type IconName =
  | 'play'
  | 'pause'
  | 'reset'
  | 'mute'
  | 'sound'
  | 'sun'
  | 'moon'
  | 'dice'
  | 'cycle'
  | 'link';

interface Props {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 18 }: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 20 20',
    fill: 'none',
    className: 'ico',
  } as const;

  if (name === 'sun') {
    return (
      <svg {...common}>
        <circle cx={10} cy={10} r={3.6} stroke="currentColor" strokeWidth={1.6} />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => {
          const p0 = polar(10, 10, 6.2, a);
          const p1 = polar(10, 10, 8.4, a);
          return (
            <line
              key={i}
              x1={p0[0]}
              y1={p0[1]}
              x2={p1[0]}
              y2={p1[1]}
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
    );
  }
  if (name === 'moon') {
    return (
      <svg {...common}>
        <path
          d="M15.5 12.5 A6 6 0 1 1 8.5 4.2 A4.6 4.6 0 0 0 15.5 12.5 Z"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    );
  }
  if (name === 'dice') {
    return (
      <svg {...common}>
        <rect x={4} y={4} width={12} height={12} rx={2.5} stroke="currentColor" strokeWidth={1.5} />
        <circle cx={7.5} cy={7.5} r={1.05} fill="currentColor" />
        <circle cx={12.5} cy={7.5} r={1.05} fill="currentColor" />
        <circle cx={10} cy={10} r={1.05} fill="currentColor" />
        <circle cx={7.5} cy={12.5} r={1.05} fill="currentColor" />
        <circle cx={12.5} cy={12.5} r={1.05} fill="currentColor" />
      </svg>
    );
  }
  if (name === 'cycle') {
    return (
      <svg {...common}>
        <path
          d="M15.4 7 A6 6 0 1 0 16.2 10.6"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M15.9 4 L15.5 7.4 L12.1 6.7"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    );
  }
  if (name === 'link') {
    return (
      <svg {...common}>
        <path
          d="M8 12 L12 8 M7.5 9.5 L6 11 a2.5 2.5 0 0 0 3.5 3.5 L11 13 M12.5 10.5 L14 9 a2.5 2.5 0 0 0 -3.5 -3.5 L9 7"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path
        d={ICONS[name] || ''}
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={name === 'play' ? 'currentColor' : 'none'}
      />
    </svg>
  );
}
