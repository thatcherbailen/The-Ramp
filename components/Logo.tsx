const CORAL = '#F5552E';
const CREAM = '#FFFFFF';

// Cream tile with a folded (cut) top-right corner, rounded on the other 3.
const INNER_PATH = 'M27 20 L62 20 L80 38 L80 73 Q80 80 73 80 L27 80 Q20 80 20 73 L20 27 Q20 20 27 20 Z';

// Four converging rays fanning up from a shared base — an abstract "ramp".
const RAYS = [
  'M40 72 L26 36 L35 30 Z',
  'M44 74 L37 28 L46 26 Z',
  'M48 74 L48 26 L57 29 Z',
  'M52 72 L59 31 L70 38 Z',
];

export function RampMark({ size = 32, shape = 'square' }: { size?: number; shape?: 'square' | 'circle' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" style={{ flexShrink: 0, display: 'block' }}>
      {shape === 'circle'
        ? <circle cx="50" cy="50" r="50" fill={CORAL} />
        : <rect width="100" height="100" rx="22" fill={CORAL} />}
      <path d={INNER_PATH} fill={CREAM} />
      {RAYS.map((d, i) => <path key={i} d={d} fill={CORAL} />)}
    </svg>
  );
}
