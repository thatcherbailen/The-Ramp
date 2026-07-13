import { ImageResponse } from 'next/og';

export const alt = 'The Ramp — Sales Prep Platform';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const CORAL = '#F5552E';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1A1613',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <svg width="104" height="104" viewBox="0 0 1000 1000">
            <rect width="1000" height="1000" rx="200" fill={CORAL} />
            <g transform="translate(230,230) scale(0.54)">
              <rect x="-1" y="-1" width="1002" height="1002" fill="#FFFFFF" />
              <polygon points="772,138 -30,349 -30,663" fill={CORAL} />
              <polygon points="872,207 354,1030 674,1030" fill={CORAL} />
            </g>
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 76, fontWeight: 800, color: '#fff', letterSpacing: -2 }}>THE RAMP</div>
            <div style={{ fontSize: 26, fontWeight: 500, color: 'rgba(255,255,255,.55)', marginTop: 4 }}>Sales Prep Platform</div>
          </div>
        </div>
        <div style={{ fontSize: 24, fontWeight: 500, color: 'rgba(255,255,255,.7)', marginTop: 44 }}>
          Practice calls · Drills · Interview prep · Pipeline — all in one place
        </div>
      </div>
    ),
    { ...size }
  );
}
