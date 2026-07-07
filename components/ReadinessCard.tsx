'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getReadiness, getStories, Readiness } from '@/lib/store';
import { SEED_STORIES } from '@/lib/seedData';

const RING = 52;

export default function ReadinessCard() {
  const router = useRouter();
  const [r, setR] = useState<Readiness | null>(null);

  useEffect(() => {
    const refresh = () => setR(getReadiness(SEED_STORIES.length + getStories().length));
    refresh();
    window.addEventListener('scc:practice-logged', refresh);
    return () => window.removeEventListener('scc:practice-logged', refresh);
  }, []);

  if (!r) return null;

  const circumference = 2 * Math.PI * RING;
  const offset = circumference * (1 - r.score / 100);

  const parts = [
    { label: 'Mock calls', value: r.mockCalls, href: '/roleplay' },
    { label: 'Objections', value: r.objections, href: '/objections' },
    { label: 'Consistency', value: r.consistency, href: '/roleplay' },
    { label: 'Story bank', value: r.stories, href: '/stories' },
  ];

  return (
    <div className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={RING} fill="none" stroke="var(--line-2)" strokeWidth="9" />
          <circle
            cx="60" cy="60" r={RING} fill="none"
            stroke="#F5552E" strokeWidth="9" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            transform="rotate(-90 60 60)"
            style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.2,.9,.3,1)' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span className="scc-num" style={{ fontWeight: 800, fontSize: 32, lineHeight: 1 }}>{r.score}</span>
          <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: 3 }}>Readiness</span>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-.01em', marginBottom: 4 }}>Readiness Score</div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 12 }}>
          Built from your mock call scores, objection drills, practice consistency and story bank. Practice moves it.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(80px, 1fr))', gap: 10 }}>
          {parts.map(p => (
            <div key={p.label} onClick={() => router.push(p.href)} style={{ cursor: 'pointer' }}>
              <div className="scc-num" style={{ fontWeight: 700, fontSize: 19, color: p.value > 0 ? 'var(--ink)' : 'var(--muted-3)' }}>{p.value}</div>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--muted)', marginTop: 1 }}>{p.label}</div>
              <div style={{ height: 4, borderRadius: 4, background: 'var(--line-3)', marginTop: 5, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${p.value}%`, background: '#F5552E', borderRadius: 4, transition: 'width .4s' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
