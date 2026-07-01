'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getSettings } from '@/lib/store';
import { isFeatureEnabled } from '@/lib/features';

// The pure essentials live in the floating bar; everything else is in the drawer.
const PRIMARY = [
  { href: '/', label: 'Today', icon: HomeIcon },
  { href: '/calendar', label: 'Calendar', icon: CalendarIcon },
  { href: '/calls', label: 'Calls', icon: PhoneIcon },
  { href: '/tasks', label: 'Tasks', icon: CheckIcon },
];

const ALL_SECTIONS = [
  { group: 'Main', items: [
    { href: '/', label: 'Today' },
    { href: '/calendar', label: 'Calendar' },
    { href: '/tasks', label: 'Task Tracker' },
    { href: '/notes', label: 'Notes', key: 'notes' },
  ]},
  { group: 'Pipeline', items: [
    { href: '/calls', label: 'Call Log', key: 'calls' },
    { href: '/jobs', label: 'Job Tracker', key: 'jobs' },
    { href: '/networking', label: 'Networking', key: 'networking' },
  ]},
  { group: 'Prep', items: [
    { href: '/stories', label: 'Story Bank', key: 'stories' },
    { href: '/prep', label: 'Interview Prep', key: 'prep' },
    { href: '/objections', label: 'Objection Drill', key: 'objections' },
  ]},
  { group: 'Learn', items: [
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

  const sections = ALL_SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(item => !item.key || isFeatureEnabled(enabled, item.key)),
  })).filter(section => section.items.length > 0);

  return (
    <>
      {/* Floating pill nav */}
      <nav style={{
        position: 'fixed',
        bottom: 'calc(14px + env(safe-area-inset-bottom))',
        left: 14,
        right: 14,
        height: 64,
        background: 'var(--fill-dark)',
        borderRadius: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 10px',
        zIndex: 40,
        boxShadow: '0 12px 32px rgba(26,22,19,.30), 0 2px 8px rgba(26,22,19,.18)',
      }}>
        {PRIMARY.map(item => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              style={{
                width: 46,
                height: 46,
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                background: active ? '#F5552E' : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,.5)',
                transition: 'background .15s, color .15s',
              }}
            >
              <Icon />
            </Link>
          );
        })}
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="More"
          style={{
            width: 46,
            height: 46,
            borderRadius: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'transparent',
            color: menuOpen ? '#fff' : 'rgba(255,255,255,.5)',
            cursor: 'pointer',
          }}
        >
          <MoreIcon />
        </button>
      </nav>

      {/* Full menu drawer */}
      {menuOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,22,19,.45)', zIndex: 60 }} onClick={() => setMenuOpen(false)}>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'var(--card)',
              borderRadius: '24px 24px 0 0',
              padding: '14px 0 calc(28px + env(safe-area-inset-bottom))',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: 40, height: 4, background: 'var(--line)', borderRadius: 2, margin: '0 auto 16px' }} />
            {sections.map(section => (
              <div key={section.group}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--muted-3)', padding: '10px 24px 4px' }}>{section.group}</div>
                {section.items.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: 'block',
                      padding: '13px 24px',
                      textDecoration: 'none',
                      fontSize: 16,
                      fontWeight: pathname === item.href ? 700 : 500,
                      color: pathname === item.href ? '#F5552E' : 'var(--ink)',
                      borderBottom: '1px solid var(--card-3)',
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
            <div style={{ padding: '14px 24px 0', display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setMenuOpen(false); onProfile(); }}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: '13px 0', borderRadius: 12, border: '1px solid var(--line-2)', background: 'var(--card)', fontSize: 15, fontWeight: 600, color: 'var(--ink-2b)', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M4.5 20a7.5 7.5 0 0 1 15 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
                Profile
              </button>
              <button
                onClick={() => { setMenuOpen(false); onSettings(); }}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: '13px 0', borderRadius: 12, border: '1px solid var(--line-2)', background: 'var(--card)', fontSize: 15, fontWeight: 600, color: 'var(--ink-2b)', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9L5.3 5.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
                Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Icons (clean line set) ─────────────────────────────── */
function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4 10.5 12 4l8 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 9.5V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="5.5" width="16" height="15" rx="3" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M4 9.5h16M8.5 3.5v4M15.5 3.5v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M6.5 4.5h3l1.5 4-2 1.5a10 10 0 0 0 5 5l1.5-2 4 1.5v3a1.6 1.6 0 0 1-1.7 1.6A15 15 0 0 1 4.9 6.2 1.6 1.6 0 0 1 6.5 4.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.8"/>
      <path d="m8.5 12 2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function MoreIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="6" cy="12" r="1.6" fill="currentColor"/>
      <circle cx="12" cy="12" r="1.6" fill="currentColor"/>
      <circle cx="18" cy="12" r="1.6" fill="currentColor"/>
    </svg>
  );
}
