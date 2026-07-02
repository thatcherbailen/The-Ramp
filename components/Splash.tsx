'use client';
import { useEffect, useState } from 'react';
import { RampMark } from './Logo';

export default function Splash() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 850);
    const hideTimer = setTimeout(() => setVisible(false), 1200);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        background: '#1A1613',
        opacity: fading ? 0 : 1,
        transition: 'opacity .35s ease',
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      <div style={{ animation: 'splash-pop .5s cubic-bezier(.2,.9,.3,1.3)' }}>
        <RampMark size={76} />
      </div>
      <div style={{ fontWeight: 800, fontSize: 19, letterSpacing: '.03em', color: '#fff' }}>THE RAMP</div>
    </div>
  );
}
