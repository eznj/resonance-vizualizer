export type OscType = 'sine' | 'triangle' | 'sawtooth' | 'square';

/** One overtone in the stack — the app's source of truth. */
export interface PartialSpec {
  freq: number;
  amp: number; // 0..1
  type: OscType;
  muted: boolean;
}

/** Concrete sRGB strings resolved from CSS variables for canvas use. */
export interface Palette {
  ink: string;
  inkSoft: string;
  muted: string;
  faint: string;
  line: string;
  lineSoft: string;
  accent: string;
  scopeBg: string;
  scopeGrid: string;
  panel: string;
  screenBg: string;
  screenTrace: string;
  screenGrid: string;
  screenInk: string;
}
