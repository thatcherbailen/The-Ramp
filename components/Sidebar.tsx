'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getSettings } from '@/lib/store';

const NAV = [
  { group: 'MAIN', items: [
    { href: '/', label: 'Today', icon: '◉' },
    { href: '/calendar', label: 'Calendar', icon: '⧖' },
    { href: '/tasks', label: 'Task Tracker', icon: '☑' },
  ]},
  { group: 'PIPELINE', items: [
    { href: '/calls', label: 'Call Log', icon: '☏' },
    { href: '/jobs', label: 'Job Tracker', icon: '◈' },
    { href: '/networking', label: 'Network', icon: '⬡' },
  ]},
  { group: 'PREP', items: [
    { href: '/stories', label: 'Story Bank', icon: '★' },
    { href: '/prep', label: 'Interview Prep', icon: '◻' },
    { href: '/objections', label: 'Objection Drill', icon: '⊕' },
  ]},
  { group: 'LEARN', items: [
    { href: '/news', label: 'Tech News', icon: '◈' },
    { href: '/reading', label: 'Reading List', icon: '▣' },
  ]},
];

export default function Sidebar({ onSettings }: { onSettings: () => void }) {
  const pathname = usePathname();
  const [name, setName] = useState('Bailen');

  useEffect(() => {
    setName(getSettings().userName);
  }, []);

  return (
    <div style={{
      width: 236,
      flexShrink: 0,
      padding: '26px 16px',
      background: '#FFFFFF',
      borderRight: '1px solid #ECE8E2',
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
      height: '100vh',
      position: 'sticky',
      top: 0,
      overflowY: 'auto',
    }}>
      <div style={{ padding: '0 12px 20px' }}>
        <div style={{ fontWeight: 800, fontSize: 21, letterSpacing: '-.02em' }}>{name}&apos;s</div>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: '#9C958B', marginTop: 3 }}>Command Centre</div>
      </div>

      {NAV.map(section => (
        <div key={section.group}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: '#C5BFB6', padding: '10px 12px 5px' }}>{section.group}</div>
          {section.items.map(item => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '9px 12px',
                  borderRadius: 11,
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: active ? 700 : 500,
                  color: active ? '#fff' : '#3F3A34',
                  background: active ? '#1A1613' : 'transparent',
                  transition: 'background .12s, color .12s',
                  marginBottom: 1,
                }}
              >
                <span style={{ fontSize: 13, opacity: active ? 1 : 0.5 }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}

      <div style={{ marginTop: 'auto', paddingTop: 14 }}>
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
            color: '#9C958B',
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
        <div style={{ padding: '8px 12px', fontSize: 10, fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', color: '#C5BFB6' }}>
          Sydney · {new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>
    </div>
  );
}
