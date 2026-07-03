// Exact geometry from the Logo_Standalone design suite — do not approximate.
// The inner background rect and the two ray polygons deliberately overshoot
// their visible edges (by 1–30 units) and rely on the <svg>'s own viewport
// clipping to hide it — this is the anti-alias-seam fix from the source,
// not a mistake. Don't "clean up" these numbers back to flush coordinates.
const CORAL = '#F5552E';
const WHITE = '#FFFFFF';
const ROUNDED_RX = 200; // ~20% corner radius, matches the design's icon ladder

export function RampMark({ size = 32, shape = 'rounded' }: { size?: number; shape?: 'square' | 'circle' | 'rounded' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 1000 1000" aria-hidden="true" style={{ flexShrink: 0, display: 'block' }}>
      {shape === 'circle'
        ? <circle cx="500" cy="500" r="500" fill={CORAL} />
        : <rect width="1000" height="1000" rx={shape === 'rounded' ? ROUNDED_RX : 0} fill={CORAL} />}
      <g transform="translate(230,230) scale(0.54)">
        <rect x="-1" y="-1" width="1002" height="1002" fill={WHITE} />
        <polygon points="772,138 -30,349 -30,663" fill={CORAL} />
        <polygon points="872,207 354,1030 674,1030" fill={CORAL} />
      </g>
    </svg>
  );
}

// Standalone mark — just the ramp glyph, no background square, so it can sit
// on any surface (dark UI, photos, print) in a single flat colour. Matches
// the design suite's "dark mode / light mode" pair: white on dark, coral on
// light — pass color accordingly.
export function RampGlyph({ size = 32, color = CORAL }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 1000 1000" aria-hidden="true" style={{ flexShrink: 0, display: 'block' }}>
      <path
        d="M0,0 H1000 V1000 H0 Z M772,138 L0,349 L0,663 Z M872,207 L354,1000 L674,1000 Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
}

// Horizontal lockup — mark + "THE RAMP" wordmark, for headers, decks, email
// signatures, anywhere the sidebar/splash's hand-rolled pairing doesn't fit.
export function RampWordmark({ size = 28, color = '#1A1613', shape = 'rounded' }: { size?: number; color?: string; shape?: 'square' | 'circle' | 'rounded' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.36 }}>
      <RampMark size={size} shape={shape} />
      <span style={{ fontWeight: 800, fontSize: size * 0.5, letterSpacing: '.02em', color, whiteSpace: 'nowrap' }}>THE RAMP</span>
    </div>
  );
}
