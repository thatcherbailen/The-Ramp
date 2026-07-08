'use client';
import { useState } from 'react';
import Modal from './Modal';
import { logPracticeToday, logDrillResult } from '@/lib/store';
import { Objection } from '@/lib/types';

interface Criterion { met: boolean; note: string }
interface Feedback { score: number; summary: string; acknowledge: Criterion; reframe: Criterion; close: Criterion }

function pickObjection(pool: Objection[], excludeId?: string): Objection {
  const options = pool.length > 1 ? pool.filter(o => o.id !== excludeId) : pool;
  return options[Math.floor(Math.random() * options.length)];
}

const CRITERIA: { key: keyof Pick<Feedback, 'acknowledge' | 'reframe' | 'close'>; label: string }[] = [
  { key: 'acknowledge', label: 'Acknowledge' },
  { key: 'reframe', label: 'Reframe' },
  { key: 'close', label: 'Close' },
];

export default function ObjectionDrillSession({ pool, onClose }: { pool: Objection[]; onClose: () => void }) {
  const [current, setCurrent] = useState<Objection>(() => pickObjection(pool));
  const [response, setResponse] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [reps, setReps] = useState(0);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!response.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/objection-drill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objection: current.objection, response }),
      });
      const data = await res.json();
      setFeedback(data);
      setReps(r => r + 1);
      logPracticeToday();
      if (data.score > 0) logDrillResult('objection', data.score, {
        title: current.tag || 'Objection',
        objection: current.objection,
        response,
        summary: data.summary,
        criteria: CRITERIA.map(c => ({ label: c.label, met: data[c.key]?.met, note: data[c.key]?.note })),
      });
    } catch {
      setError('Couldn\'t reach the scoring service — try again.');
    } finally {
      setBusy(false);
    }
  };

  const next = () => {
    setCurrent(pickObjection(pool, current.id));
    setResponse('');
    setFeedback(null);
    setError('');
  };

  return (
    <Modal title="Objection Drill" onClose={onClose} width={620}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>Rep {reps + 1}</span>
          {current.tag && (
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--accent-ink)', background: 'var(--accent-soft)', padding: '3px 10px', borderRadius: 999 }}>{current.tag}</span>
          )}
        </div>

        <div style={{ background: 'var(--fill-dark)', borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 8 }}>Prospect says</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>&ldquo;{current.objection}&rdquo;</div>
        </div>

        {!feedback ? (
          <>
            <div>
              <label className="form-label">Your response</label>
              <textarea
                className="form-input"
                placeholder="Acknowledge it, reframe the value, then ask for a next step…"
                value={response}
                onChange={e => setResponse(e.target.value)}
                style={{ minHeight: 120, resize: 'vertical' }}
                autoFocus
              />
            </div>
            {error && <div style={{ fontSize: 13, color: '#D8431F', background: 'var(--accent-soft)', padding: '10px 14px', borderRadius: 10 }}>{error}</div>}
            <button onClick={submit} disabled={!response.trim() || busy} className="coral-btn" style={{ height: 48, fontSize: 15, borderRadius: 12, justifyContent: 'center', opacity: !response.trim() || busy ? 0.6 : 1 }}>
              {busy ? 'Scoring…' : 'Get feedback'}
            </button>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: feedback.score >= 70 ? 'var(--accent-soft)' : 'var(--card-3)',
                color: feedback.score >= 70 ? 'var(--accent-ink)' : 'var(--ink-2)',
                fontWeight: 800, fontSize: 20,
              }}>{feedback.score}</div>
              <div style={{ fontSize: 14, color: 'var(--ink-2b)', lineHeight: 1.5 }}>{feedback.summary}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CRITERIA.map(c => {
                const crit = feedback[c.key];
                return (
                  <div key={c.key} style={{ display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--line)', background: crit.met ? 'var(--card-2)' : 'var(--card)' }}>
                    <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, background: crit.met ? '#DCEFE0' : '#F5E3DE', color: crit.met ? '#2E7D46' : '#C24A24' }}>
                      {crit.met ? '✓' : '✕'}
                    </span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{c.label}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2, lineHeight: 1.45 }}>{crit.note}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} style={{ padding: '0 20px', height: 48, borderRadius: 12, border: '1px solid var(--line-2)', background: 'var(--card)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}>End session</button>
              <button onClick={next} className="coral-btn" style={{ flex: 1, height: 48, fontSize: 15, borderRadius: 12, justifyContent: 'center' }}>Next objection →</button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
