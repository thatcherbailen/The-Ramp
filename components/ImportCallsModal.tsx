'use client';
import { useState, useMemo } from 'react';
import Modal from './Modal';
import { getCalls, saveAllCalls, uid } from '@/lib/store';
import { Call } from '@/lib/types';

// Bulk-import call log entries from a pasted block. One lead per line, fields
// separated by "|" in this order:
//   Name | Phone | Date (YYYY-MM-DD) | Value | Address | Source | Stage
// Duplicates (same name + phone as an existing call, or repeated within the
// paste) are skipped automatically.
type Mode = 'Contacted' | 'Attempted';

interface Row { name: string; phone: string; date: string; value: string; address: string; source: string; stage: string; }

const key = (name: string, phone: string) => `${name.trim().toLowerCase()}|${(phone || '').replace(/\D/g, '')}`;
const TODAY = () => new Date().toISOString().slice(0, 10);

function parseLines(text: string): Row[] {
  return text.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
    const p = line.split('|').map(s => s.trim());
    return { name: p[0] || '', phone: p[1] || '', date: p[2] || '', value: p[3] || '', address: p[4] || '', source: p[5] || '', stage: p[6] || '' };
  }).filter(r => r.name);
}

export default function ImportCallsModal({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<Mode>('Contacted');
  const [done, setDone] = useState<{ added: number; skipped: number } | null>(null);

  const { rows, toAdd, dupes } = useMemo(() => {
    const rows = parseLines(text);
    const existing = new Set(getCalls().map(c => key(c.lead, c.phone || '')));
    const seen = new Set<string>();
    let toAdd = 0, dupes = 0;
    for (const r of rows) {
      const k = key(r.name, r.phone);
      if (existing.has(k) || seen.has(k)) dupes++; else { toAdd++; seen.add(k); }
    }
    return { rows, toAdd, dupes };
  }, [text]);

  const runImport = () => {
    const rows = parseLines(text);
    const existing = getCalls();
    const existingKeys = new Set(existing.map(c => key(c.lead, c.phone || '')));
    const seen = new Set<string>();
    const fresh: Row[] = [];
    for (const r of rows) {
      const k = key(r.name, r.phone);
      if (existingKeys.has(k) || seen.has(k)) continue;
      seen.add(k); fresh.push(r);
    }
    fresh.sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
    const maxNum = existing.reduce((m, c) => Math.max(m, c.callNumber || 0), 0);
    const attempted = mode === 'Attempted';
    const newCalls: Call[] = fresh.map((r, i) => ({
      id: uid(),
      date: /^\d{4}-\d{2}-\d{2}$/.test(r.date) ? r.date : TODAY(),
      lead: r.name,
      phone: r.phone,
      source: r.source || 'Website lead',
      callNumber: maxNum + i + 1,
      duration: '',
      outcome: attempted ? 'No answer' : 'Contacted',
      confidence: 5,
      appointmentBooked: false,
      objection: 'None',
      tone: 'Neutral',
      response: '',
      worked: '',
      improve: '',
      notes: [r.address, r.value && `Est ${r.value}`, r.stage].filter(Boolean).join(' · '),
      followUp: attempted,
      followUpStatus: attempted ? 'active' : undefined,
      followUpCount: 0,
      followUpNextDate: attempted ? (/^\d{4}-\d{2}-\d{2}$/.test(r.date) ? r.date : TODAY()) : undefined,
      isInterviewStory: false,
    }));
    saveAllCalls([...existing, ...newCalls]);
    setDone({ added: newCalls.length, skipped: rows.length - newCalls.length });
  };

  if (done) {
    return (
      <Modal title="Import complete" onClose={onClose}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'center', padding: '8px 0' }}>
          <div style={{ fontSize: 40, fontWeight: 300, color: '#F5552E' }} className="scc-num">{done.added}</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{done.added} call{done.added === 1 ? '' : 's'} added{done.skipped > 0 ? ` · ${done.skipped} duplicate${done.skipped === 1 ? '' : 's'} skipped` : ''}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
            {mode === 'Attempted' ? 'These went into your Follow-ups tab as leads to call back.' : 'These are in your Call Log, marked as contacted.'}
          </div>
          <button onClick={onClose} className="coral-btn" style={{ height: 44, padding: '0 24px', fontSize: 14, borderRadius: 12, alignSelf: 'center', marginTop: 4 }}>Done</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Import calls" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
          Paste one lead per line. Duplicates (same name + phone) are skipped automatically.
        </div>

        <div>
          <label className="form-label">These calls were…</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['Contacted', 'Attempted'] as Mode[]).map(m => (
              <button key={m} onClick={() => setMode(m)}
                style={{ flex: 1, padding: '10px 12px', borderRadius: 11, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                  border: `1px solid ${mode === m ? 'var(--fill-dark)' : 'var(--line-2)'}`,
                  background: mode === m ? 'var(--fill-dark)' : 'var(--card)',
                  color: mode === m ? '#fff' : 'var(--muted)' }}>
                {m === 'Contacted' ? 'Contacted' : 'Attempted → Follow-ups'}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 6 }}>
            {mode === 'Contacted' ? 'Logged as reached, outcome “Contacted”.' : 'Logged as “No answer” and added to your Follow-ups tab.'}
          </div>
        </div>

        <div>
          <label className="form-label">Paste leads · Name | Phone | Date | Value | Address | Source | Stage</label>
          <textarea className="form-input" value={text} onChange={e => setText(e.target.value)}
            placeholder={'Kevin Thomas | 0274999584 | 2026-08-09 | $31k–$38k | 128 Marine Parade, Mount Maunganui | Website lead | Long-term planning'}
            style={{ minHeight: 200, resize: 'vertical', fontFamily: 'inherit', fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre' }} />
        </div>

        {rows.length > 0 && (
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>
            <span style={{ color: '#F5552E' }}>{toAdd}</span> to import{dupes > 0 && <span style={{ color: 'var(--muted)' }}> · {dupes} duplicate{dupes === 1 ? '' : 's'} skipped</span>}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
          <button onClick={onClose} style={{ padding: '11px 22px', borderRadius: 12, border: '1px solid var(--line-2)', background: 'var(--card)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}>Cancel</button>
          <button onClick={runImport} disabled={toAdd === 0} className="coral-btn" style={{ height: 44, padding: '0 24px', fontSize: 14, borderRadius: 12, opacity: toAdd === 0 ? 0.5 : 1 }}>Import {toAdd || ''} call{toAdd === 1 ? '' : 's'}</button>
        </div>
      </div>
    </Modal>
  );
}
