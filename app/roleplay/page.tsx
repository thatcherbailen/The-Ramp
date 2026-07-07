'use client';
import { useState, useRef, useEffect } from 'react';
import { logPracticeToday, logDrillResult } from '@/lib/store';
import StreakBadge from '@/components/StreakBadge';

interface Turn { role: 'prospect' | 'rep'; text: string }
interface Report { score: number; summary: string; strengths: string[]; improvements: string[] }

const SCENARIOS = [
  { key: 'cold', label: 'Cold Call', desc: 'They didn\'t expect your call. Earn attention fast, get to a next step.', emoji: '📞' },
  { key: 'discovery', label: 'Discovery Call', desc: 'A booked meeting. Ask good questions, uncover the real problem.', emoji: '🔍' },
  { key: 'gauntlet', label: 'Objection Gauntlet', desc: 'One objection after another. Stay calm, keep the call alive.', emoji: '🛡️' },
];

export default function RoleplayPage() {
  const [scenario, setScenario] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [hungUp, setHungUp] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns, busy]);

  const callApi = async (action: 'reply' | 'score', history: Turn[]) => {
    const res = await fetch('/api/mock-call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, scenario, history }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong — try again.');
    return data;
  };

  const start = async (key: string) => {
    setScenario(key);
    setTurns([]);
    setReport(null);
    setHungUp(false);
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/mock-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reply', scenario: key, history: [] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong — try again.');
      setTurns([{ role: 'prospect', text: data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong — try again.');
      setScenario(null);
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    if (!input.trim() || busy || hungUp) return;
    const next: Turn[] = [...turns, { role: 'rep', text: input.trim() }];
    setTurns(next);
    setInput('');
    setBusy(true);
    setError('');
    try {
      const data = await callApi('reply', next);
      setTurns([...next, { role: 'prospect', text: data.reply }]);
      if (data.hangup) setHungUp(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong — try again.');
    } finally {
      setBusy(false);
    }
  };

  const endAndScore = async () => {
    if (busy || turns.filter(t => t.role === 'rep').length === 0) return;
    setBusy(true);
    setError('');
    try {
      const data = await callApi('score', turns);
      setReport(data);
      logDrillResult('mockcall', data.score);
      logPracticeToday();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong — try again.');
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setScenario(null);
    setTurns([]);
    setReport(null);
    setHungUp(false);
    setError('');
  };

  const repTurns = turns.filter(t => t.role === 'rep').length;

  return (
    <div>
      <div className="page-head" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}>Prep · Live practice</div>
          <div className="page-title">Mock Call</div>
        </div>
        <div className="page-head-actions page-head-meta" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <StreakBadge compact />
        </div>
      </div>

      {!scenario ? (
        <>
          <div style={{ background: 'var(--fill-dark)', borderRadius: 18, padding: '22px 24px', color: '#fff', marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', marginBottom: 8 }}>How it works</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,.78)', lineHeight: 1.6, maxWidth: 780 }}>
              The AI plays a realistic prospect — it won&apos;t go easy on you. Talk to it like a real call: earn attention, ask questions, handle the pushback. End the call whenever you like and get scored with specific feedback.
            </div>
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14 }}>Pick a scenario</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {SCENARIOS.map(s => (
              <button key={s.key} onClick={() => start(s.key)} disabled={busy} className="card" style={{ padding: '26px 22px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', opacity: busy ? 0.6 : 1 }}>
                <div style={{ fontSize: 30, marginBottom: 12 }}>{s.emoji}</div>
                <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-.01em', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.55 }}>{s.desc}</div>
                <div style={{ marginTop: 14, fontSize: 12.5, fontWeight: 700, color: 'var(--accent-ink)' }}>{busy ? 'Connecting…' : 'Start call →'}</div>
              </button>
            ))}
          </div>
          {error && <div style={{ marginTop: 16, fontSize: 13, color: '#D8431F', background: 'var(--accent-soft)', padding: '12px 16px', borderRadius: 12 }}>{error}</div>}
        </>
      ) : report ? (
        <div className="card" style={{ padding: '28px 28px', maxWidth: 720 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 22 }}>
            <div style={{
              width: 84, height: 84, borderRadius: '50%', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: report.score >= 70 ? 'var(--accent-soft)' : 'var(--card-3)',
              color: report.score >= 70 ? 'var(--accent-ink)' : 'var(--ink-2)',
            }}>
              <span style={{ fontWeight: 800, fontSize: 28, lineHeight: 1 }}>{report.score}</span>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginTop: 3 }}>score</span>
            </div>
            <div style={{ fontSize: 14.5, color: 'var(--ink-2b)', lineHeight: 1.55 }}>{report.summary}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#2E7D46', marginBottom: 8 }}>What worked</div>
              {report.strengths.map((s, i) => (
                <div key={i} style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, marginBottom: 8, paddingLeft: 14, position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0 }}>·</span>{s}
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#C24A24', marginBottom: 8 }}>Work on next</div>
              {report.improvements.map((s, i) => (
                <div key={i} style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, marginBottom: 8, paddingLeft: 14, position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0 }}>·</span>{s}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={reset} style={{ padding: '0 20px', height: 48, borderRadius: 12, border: '1px solid var(--line-2)', background: 'var(--card)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}>Back to scenarios</button>
            <button onClick={() => start(scenario)} className="coral-btn" style={{ flex: 1, height: 48, fontSize: 15, borderRadius: 12, justifyContent: 'center' }}>Run it again →</button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', height: 'min(640px, 70vh)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: hungUp ? 'var(--muted-2)' : '#2E7D46', animation: hungUp ? 'none' : 'pulse 1.6s infinite' }} />
              <span style={{ fontWeight: 700, fontSize: 14 }}>{SCENARIOS.find(s => s.key === scenario)?.label}</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{hungUp ? 'Call ended' : 'Live'}</span>
            </div>
            <button onClick={endAndScore} disabled={busy || repTurns === 0} className="coral-btn" style={{ height: 38, padding: '0 16px', fontSize: 13, borderRadius: 10, opacity: busy || repTurns === 0 ? 0.5 : 1 }}>
              {busy ? '…' : 'End call & get scored'}
            </button>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {turns.map((t, i) => (
              <div key={i} style={{
                maxWidth: '78%',
                alignSelf: t.role === 'rep' ? 'flex-end' : 'flex-start',
                background: t.role === 'rep' ? 'var(--fill-dark)' : 'var(--card-3)',
                color: t.role === 'rep' ? '#fff' : 'var(--ink)',
                borderRadius: t.role === 'rep' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                padding: '12px 16px', fontSize: 14, lineHeight: 1.5,
              }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', opacity: .55, marginBottom: 4 }}>{t.role === 'rep' ? 'You' : 'Prospect'}</div>
                {t.text}
              </div>
            ))}
            {busy && !report && (
              <div style={{ alignSelf: 'flex-start', background: 'var(--card-3)', borderRadius: '16px 16px 16px 4px', padding: '12px 18px', fontSize: 14, color: 'var(--muted)' }}>…</div>
            )}
            {hungUp && <div style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--muted)', padding: '6px 0' }}>The prospect ended the call — score it to see how you did.</div>}
          </div>

          {error && <div style={{ margin: '0 20px 12px', fontSize: 13, color: '#D8431F', background: 'var(--accent-soft)', padding: '10px 14px', borderRadius: 10 }}>{error}</div>}

          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--line)', display: 'flex', gap: 10 }}>
            <input
              className="form-input"
              placeholder={hungUp ? 'Call ended' : 'Say your line…'}
              value={input}
              disabled={hungUp}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') send(); }}
              style={{ flex: 1 }}
              autoFocus
            />
            <button onClick={send} disabled={!input.trim() || busy || hungUp} className="coral-btn" style={{ height: 48, padding: '0 22px', fontSize: 14, borderRadius: 12, opacity: !input.trim() || busy || hungUp ? 0.5 : 1 }}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}
