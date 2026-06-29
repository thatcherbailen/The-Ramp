'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: 'Today', icon: '◉' },
  { href: '/calls', label: 'Calls', icon: '☏' },
  { href: '/jobs', label: 'Jobs', icon: '◈' },
  { href: '/tasks', label: 'Tasks', icon: '☑' },
  { href: '/calendar', label: 'Cal', icon: '⧖' },
];

const ALL_SECTIONS = [
  { group: 'Main', items: [
    { href: '/', label: 'Today' },
    { href: '/calendar', label: 'Calendar' },
    { href: '/tasks', label: 'Task Tracker' },
  ]},
  { group: 'Pipeline', items: [
    { href: '/calls', label: 'Call Log' },
    { href: '/jobs', label: 'Job Tracker' },
    { href: '/networking', label: 'Networking' },
  ]},
  { group: 'Prep', items: [
    { href: '/stories', label: 'Story Bank' },
    { href: '/prep', label: 'Interview Prep' },
    { href: '/objections', label: 'Objection Drill' },
  ]},
  { group: 'Learn', items: [
    { href: '/news', label: 'Tech News' },
    { href: '/reading', label: 'Reading List' },
  ]},
];

export default function MobileNav({ onSettings, onProfile }: { onSettings: () => void; onProfile: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--card)',
        borderTop: '1px solid var(--line)',
        display: 'flex',
        zIndex: 30,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {NAV.map(item => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                padding: '10px 6px 8px',
                textDecoration: 'none',
                color: active ? '#F5552E' : 'var(--muted)',
                fontSize: 11,
                fontWeight: active ? 700 : 500,
              }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={() => setMenuOpen(true)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            padding: '10px 6px 8px',
            border: 'none',
            background: 'none',
            color: 'var(--muted)',
            fontSize: 11,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <span style={{ fontSize: 18 }}>≡</span>
          More
        </button>
      </nav>

      {menuOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,22,19,.42)', zIndex: 50 }} onClick={() => setMenuOpen(false)}>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'var(--card)',
              borderRadius: '20px 20px 0 0',
              padding: '20px 0 40px',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: 40, height: 4, background: 'var(--line)', borderRadius: 2, margin: '0 auto 20px' }} />
            {ALL_SECTIONS.map(section => (
              <div key={section.group}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--muted-3)', padding: '8px 24px 4px' }}>{section.group}</div>
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
            <div style={{ padding: '8px 24px 0' }}>
              <button
                onClick={() => { setMenuOpen(false); onProfile(); }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 0', border: 'none', background: 'none', fontSize: 16, fontWeight: 500, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M4.5 20a7.5 7.5 0 0 1 15 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
                Profile
              </button>
              <button
                onClick={() => { setMenuOpen(false); onSettings(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '13px 0',
                  border: 'none',
                  background: 'none',
                  fontSize: 16,
                  fontWeight: 500,
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  width: '100%',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
