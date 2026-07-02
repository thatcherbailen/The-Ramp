'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getSettings } from '@/lib/store';
import { isFeatureEnabled } from '@/lib/features';

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
    { href: '/stories', label: 'Story Bank', key: 'stories' },
    { href: '/prep', label: 'Interview Prep', key: 'prep' },
    { href: '/objections', label: 'Objection Drill', key: 'objections' },
    { href: '/notes', label: 'Notes', key: 'notes' },
  ]},
  { group: 'LEARN', items: [
    { href: '/news', label: 'Tech News', key: 'news' },
    { href: '/reading', label: 'Reading List', key: 'reading' },
  ]},
];

export default function Sidebar({ onSettings, onProfile }: { onSettings: () => void; onProfile: () => void }) {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState<Record<string, boolean> | undefined>(undefined);

  useEffect(() => {
    const refresh = () => setEnabled(getSettings().enabledFeatures);
    refresh();
    window.addEventListener('scc:profile-updated', refresh);
    return () => window.removeEventListener('scc:profile-updated', refresh);
  }, []);

  const sections = NAV.map(section => ({
    ...section,
    items: section.items.filter(item => !item.key || isFeatureEnabled(enabled, item.key)),
  })).filter(section => section.items.length > 0);

  return (
    <div style={{
      width: 236,
      flexShrink: 0,
      padding: '26px 16px',
      background: 'var(--card)',
      borderRight: '1px solid var(--line)',
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
      height: '100vh',
      position: 'sticky',
      top: 0,
      overflowY: 'auto',
    }}>
      <div style={{ padding: '0 12px 20px' }}>
        <div style={{ fontWeight: 800, fontSize: 21, letterSpacing: '-.02em' }}>The Ramp</div>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: 3 }}>SDR Prep Platform</div>
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
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '11px 13px',
                  borderRadius: 12,
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: active ? 700 : 500,
                  color: active ? '#fff' : 'var(--ink-2b)',
                  background: active ? 'var(--fill-dark)' : 'transparent',
                  transition: 'background .12s, color .12s',
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
          onClick={onProfile}
          style={{
            display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderRadius: 11,
            border: 'none', background: 'none', fontSize: 14, fontWeight: 500, color: 'var(--muted)', cursor: 'pointer', width: '100%', fontFamily: 'inherit',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.6"/>
            <path d="M4.5 20a7.5 7.5 0 0 1 15 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          Profile
        </button>
        <button
          onClick={onSettings}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            padding: '9px 12px',
            borderRadius: 11,
            border: 'none',
            background: 'none',
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--muted)',
            cursor: 'pointer',
            width: '100%',
            fontFamily: 'inherit',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6"/>
            <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9L5.3 5.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          Settings
        </button>
        <div style={{ padding: '8px 12px', fontSize: 10, fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted-3)' }}>
          Sydney · {new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>
    </div>
  );
}
