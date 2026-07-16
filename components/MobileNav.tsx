'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getSettings } from '@/lib/store';
import { isFeatureEnabled } from '@/lib/features';

// Mobile navigation mirrors the desktop sidebar: a burger button at the top
// opens a left slide-in drawer with the same grouped item list and styling as
// the desktop <Sidebar/>. (Same source of truth as Sidebar's NAV.)
const NAV: { group: string; items: { href: string; label: string; key?: string }[] }[] = [
  { group: 'MAIN', items: [
    { href: '/', label: 'Today' },
    { href: '/calendar', label: 'Calendar' },
    { href: '/tasks', label: 'Task Tracker' },
  ]},
  { group: 'PIPELINE', items: [
    { href: '/calls', label: 'Call Log', key: 'calls' },
    { href: '/jobs', label: 'Job Tracker', key: 'jobs' },
    { href: '/networking', label: 'Networking', key: 'networking' },
  ]},
  { group: 'PREP', items: [
    { href: '/roleplay', label: 'Mock Call', key: 'roleplay' },
    { href: '/stories', label: 'Story Bank', key: 'stories' },
    { href: '/prep', label: 'Interview Prep', key: 'prep' },
    { href: '/objections', label: 'Objection Drill', key: 'objections' },
    { href: '/notes', label: 'Notes', key: 'notes' },
  ]},
  { group: 'LEARN', items: [
    { href: '/guide', label: 'How to Use' },
    { href: '/news', label: 'Tech News', key: 'news' },
    { href: '/reading', label: 'Reading List', key: 'reading' },
  ]},
];

export default function MobileNav({ onSettings, onProfile }: { onSettings: () => void; onProfile: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const [enabled, setEnabled] = useState<Record<string, boolean> | undefined>(undefined);

  useEffect(() => {
    const refresh = () => setEnabled(getSettings().enabledFeatures);
    refresh();
    window.addEventListener('scc:profile-updated', refresh);
    return () => window.removeEventListener('scc:profile-updated', refresh);
  }, []);

  // Close the drawer whenever the route changes.
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (menuOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [menuOpen]);

  const sections = NAV.map(section => ({
    ...section,
    items: section.items.filter(item => !item.key || isFeatureEnabled(enabled, item.key)),
  })).filter(section => section.items.length > 0);

  return (
    <>
      {/* Top bar with burger */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'calc(56px + env(safe-area-inset-top))',
        paddingTop: 'env(safe-area-inset-top)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 'env(safe-area-inset-top) 16px 0',
        background: 'var(--card)',
        borderBottom: '1px solid var(--line)',
        zIndex: 45,
      }}>
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          style={{
            width: 40, height: 40, marginLeft: -8, borderRadius: 11,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', background: 'none', color: 'var(--ink)', cursor: 'pointer',
          }}
        >
          <BurgerIcon />
        </button>
        <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-.02em' }}>The Ramp</div>
      </header>

      {/* Left slide-in drawer + backdrop */}
      <div
        onClick={() => setMenuOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 60,
          background: 'rgba(26,22,19,.45)',
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? 'auto' : 'none',
          transition: 'opacity .2s',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute', top: 0, left: 0, bottom: 0,
            width: 268, maxWidth: '82vw',
            background: 'var(--card)',
            borderRight: '1px solid var(--line)',
            display: 'flex', flexDirection: 'column',
            padding: 'calc(20px + env(safe-area-inset-top)) 16px calc(20px + env(safe-area-inset-bottom))',
            overflowY: 'auto',
            transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform .24s cubic-bezier(.4,0,.2,1)',
            boxShadow: menuOpen ? '0 0 40px rgba(26,22,19,.25)' : 'none',
          }}
        >
          <div style={{ padding: '0 12px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 21, letterSpacing: '-.02em' }}>The Ramp</div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: 3 }}>Sales Prep Platform</div>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              style={{ width: 32, height: 32, marginRight: -6, borderRadius: 9, border: 'none', background: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <CloseIcon />
            </button>
          </div>

          {sections.map(section => (
            <div key={section.group}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--muted-3)', padding: '10px 12px 5px' }}>{section.group}</div>
              {section.items.map(item => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', padding: '12px 13px', borderRadius: 12,
                      textDecoration: 'none', fontSize: 15,
                      fontWeight: active ? 700 : 500,
                      color: active ? '#fff' : 'var(--ink-2b)',
                      background: active ? 'var(--fill-dark)' : 'transparent',
                      marginBottom: 1,
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}

          <div style={{ marginTop: 'auto', paddingTop: 14 }}>
            <button
              onClick={() => { setMenuOpen(false); onProfile(); }}
              style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 12px', borderRadius: 11, border: 'none', background: 'none', fontSize: 15, fontWeight: 500, color: 'var(--muted)', cursor: 'pointer', width: '100%', fontFamily: 'inherit' }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M4.5 20a7.5 7.5 0 0 1 15 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              Profile
            </button>
            <button
              onClick={() => { setMenuOpen(false); onSettings(); }}
              style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 12px', borderRadius: 11, border: 'none', background: 'none', fontSize: 15, fontWeight: 500, color: 'var(--muted)', cursor: 'pointer', width: '100%', fontFamily: 'inherit' }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9L5.3 5.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              Settings
            </button>
            <div style={{ padding: '8px 12px', fontSize: 10, fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted-3)' }}>
              {new Date().toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function BurgerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/>
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/>
    </svg>
  );
}
