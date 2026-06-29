'use client';
import { useState, useRef, useEffect } from 'react';

interface Action { label: string; onClick: () => void; danger?: boolean; }

export default function DotMenu({ actions }: { actions: Action[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="dot-menu-btn"
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        title="Options"
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="3" r="1.4"/>
          <circle cx="8" cy="8" r="1.4"/>
          <circle cx="8" cy="13" r="1.4"/>
        </svg>
      </button>
      {open && (
        <div className="dot-menu-popup" onClick={e => e.stopPropagation()}>
          {actions.map(a => (
            <button
              key={a.label}
              className={`menu-item${a.danger ? ' danger' : ''}`}
              onClick={() => { a.onClick(); setOpen(false); }}
            >
              {a.danger ? (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3.5 4.5h9M6.5 4V3h3v1M5 4.5l.5 8h5l.5-8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M11.5 2.5l2 2L6 12l-2.6.6L4 10z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>
              )}
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
