/* ============================================================
   ThemeSwitch — sliding pill toggle carrying a sun/moon icon.
   ============================================================ */
import { Icon } from './Icon';

interface Props {
  dark: boolean;
  onToggle: () => void;
}

export function ThemeSwitch({ dark, onToggle }: Props) {
  return (
    <button
      className="switch"
      onClick={onToggle}
      title={dark ? 'Switch to light' : 'Switch to dark'}
      aria-label="Toggle theme"
    >
      <div className="knob-dot">
        <Icon name={dark ? 'moon' : 'sun'} size={13} />
      </div>
    </button>
  );
}
