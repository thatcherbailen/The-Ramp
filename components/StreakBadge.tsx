'use client';
import { useEffect, useState } from 'react';
import { getStreak, Streak } from '@/lib/store';

export default function StreakBadge({ compact = false }: { compact?: boolean }) {
  const [streak, setStreak] = useState<Streak | null>(null);

  useEffect(() => {
    const refresh = () => setStreak(getStreak());
    refresh();
    window.addEventListener('scc:practice-logged', refresh);
    return () => window.removeEventListener('scc:practice-logged', refresh);
  }, []);

  if (!streak) return null;
  const active = streak.current > 0;

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: active ? '#F5552E' : 'var(--muted)' }}>
        <span>🔥</span><span>{streak.current} day{streak.current === 1 ? '' : 's'}</span>
      </div>
    );
  }

  return (
    <div style={{
      background: active ? 'var(--fill-dark)' : 'var(--card-2)',
      color: active ? '#fff' : 'var(--ink)',
      borderRadius: 18, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 18,
      border: active ? 'none' : '1px solid var(--line)',
    }}>
      <div style={{ fontSize: 34, lineHeight: 1, filter: active ? 'none' : 'grayscale(1)', opacity: active ? 1 : 0.5 }}>🔥</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-.02em' }}>
          {active ? `${streak.current} day${streak.current === 1 ? '' : 's'} streak` : 'No streak yet'}
        </div>
        <div style={{ fontSize: 12.5, color: active ? 'rgba(255,255,255,.6)' : 'var(--muted)', marginTop: 2 }}>
          {streak.today ? 'Nice — you’ve practiced today.' : 'Complete a drill today to keep it going.'}
          {streak.longest > streak.current ? ` · Best: ${streak.longest} days` : ''}
        </div>
      </div>
    </div>
  );
}
