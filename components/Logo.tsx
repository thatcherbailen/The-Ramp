// Exact geometry from the Logo.dc.html design handoff — do not approximate.
const CORAL = '#F5552E';
const WHITE = '#FFFFFF';

export function RampMark({ size = 32, shape = 'square' }: { size?: number; shape?: 'square' | 'circle' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 1000 1000" aria-hidden="true" style={{ flexShrink: 0, display: 'block' }}>
      {shape === 'circle'
        ? <circle cx="500" cy="500" r="500" fill={CORAL} />
        : <rect width="1000" height="1000" fill={CORAL} />}
      <g transform="translate(230,230) scale(0.54)">
        <path
          d="M0,0 L1000,0 L1000,1000 L0,1000 Z M1000,0 L0,349 L0,663 Z M1000,0 L354,1000 L674,1000 Z"
          fill={WHITE}
          fillRule="evenodd"
        />
      </g>
    </svg>
  );
}
