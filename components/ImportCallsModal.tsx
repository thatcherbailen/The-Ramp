'use client';
import { useState, useMemo } from 'react';
import Modal from './Modal';
import { getCalls, saveAllCalls, saveActivity, uid } from '@/lib/store';
import { Call, Activity } from '@/lib/types';

// Bulk-import call log entries from a pasted block. One lead per line, fields
// separated by "|" in this order:
//   Name | Phone | Email | Date (YYYY-MM-DD) | Value | Address | Source | Stage
// Duplicates are skipped: a row matching an existing call (or an earlier row in
// the paste) by email, or by name + phone, is dropped.
type Mode = 'Contacted' | 'Attempted';

interface Row { name: string; phone: string; email: string; date: string; value: string; address: string; source: string; stage: string; }

const TODAY = () => new Date().toISOString().slice(0, 10);
// Normalise an NZ number for comparison: digits only, leading 64 → 0.
const normPhone = (p: string) => { let d = (p || '').replace(/\D/g, ''); if (d.startsWith('64')) d = '0' + d.slice(2); return d; };
const emailKey = (e: string) => (e || '').trim().toLowerCase();
const npKey = (name: string, phone: string) => `${name.trim().toLowerCase()}|${normPhone(phone)}`;

// Keys that identify a lead. A row is a duplicate if ANY of its keys already
// exist, so an older import stored without an email still matches on name+phone.
function keysFor(name: string, phone: string, email: string): string[] {
  const ks: string[] = [];
  if (emailKey(email)) ks.push('e:' + emailKey(email));
  if (name.trim() && normPhone(phone)) ks.push('np:' + npKey(name, phone));
  return ks;
}

function parseLines(text: string): Row[] {
  return text.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
    const p = line.split('|').map(s => s.trim());
    return { name: p[0] || '', phone: p[1] || '', email: p[2] || '', date: p[3] || '', value: p[4] || '', address: p[5] || '', source: p[6] || '', stage: p[7] || '' };
  }).filter(r => r.name);
}

// Dedup a parsed list against the existing calls and within itself.
function freshRows(rows: Row[]): Row[] {
  const seen = new Set<string>();
  getCalls().forEach(c => keysFor(c.lead, c.phone || '', c.email || '').forEach(k => seen.add(k)));
  const out: Row[] = [];
  for (const r of rows) {
    const ks = keysFor(r.name, r.phone, r.email);
    if (ks.length === 0) { out.push(r); continue; } // no way to match — keep
    if (ks.some(k => seen.has(k))) continue;
    ks.forEach(k => seen.add(k));
    out.push(r);
  }
  return out;
}

export default function ImportCallsModal({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<Mode>('Contacted');
  const [done, setDone] = useState<{ added: number; skipped: number; activities: number } | null>(null);

  const { total, toAdd } = useMemo(() => {
    const rows = parseLines(text);
    return { total: rows.length, toAdd: freshRows(rows).length };
  }, [text]);

  const runImport = () => {
    const rows = parseLines(text);
    const fresh = freshRows(rows);
    fresh.sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
    const existing = getCalls();
    const maxNum = existing.reduce((m, c) => Math.max(m, c.callNumber || 0), 0);
    const attempted = mode === 'Attempted';
    const newCalls: Call[] = fresh.map((r, i) => ({
      id: uid(),
      date: /^\d{4}-\d{2}-\d{2}$/.test(r.date) ? r.date : TODAY(),
      lead: r.name,
      phone: r.phone,
      email: r.email,
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

    // Attempted calls also log the follow-up text as a Message activity, so each
    // one counts twice: the dial (a Call activity, derived from the call record)
    // plus the text message.
    let activities = 0;
    if (attempted) {
      newCalls.forEach(c => {
        saveActivity({ id: uid(), date: c.date, type: 'Message', note: `Text after missed call — ${c.lead}`, ts: Date.now() } as Activity);
        activities++;
      });
    }

    setDone({ added: newCalls.length, skipped: rows.length - newCalls.length, activities });
  };

  if (done) {
    return (
      <Modal title="Import complete" onClose={onClose}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'center', padding: '8px 0' }}>
          <div className="scc-num" style={{ fontSize: 40, fontWeight: 300, color: '#F5552E' }}>{done.added}</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{done.added} call{done.added === 1 ? '' : 's'} added{done.skipped > 0 ? ` · ${done.skipped} duplicate${done.skipped === 1 ? '' : 's'} skipped` : ''}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
            {mode === 'Attempted'
              ? `These went into your Follow-ups tab as leads to call back, and logged ${done.activities} follow-up text${done.activities === 1 ? '' : 's'} as activities (on top of each dial).`
              : 'These are in your Call Log, marked as contacted.'}
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
          Paste one lead per line. Duplicates (same email, or same name + phone) are skipped automatically.
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
                {m === 'Contacted' ? 'Contacted' : 'No answer → Follow-ups'}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 6 }}>
            {mode === 'Contacted' ? 'Logged as reached, outcome “Contacted”.' : 'Logged as “No answer”, added to Follow-ups, and each logs a follow-up text as an activity too.'}
          </div>
        </div>

        <div>
          <label className="form-label">Paste leads · Name | Phone | Email | Date | Value | Address | Source | Stage</label>
          <textarea className="form-input" value={text} onChange={e => setText(e.target.value)}
            placeholder={'Kevin Thomas | 0274999584 | kevin@email.com | 2026-08-09 | $31k–$38k | 128 Marine Parade, Mount Maunganui | Website lead | Estimator · Working'}
            style={{ minHeight: 200, resize: 'vertical', fontFamily: 'inherit', fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre' }} />
        </div>

        {total > 0 && (
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>
            <span style={{ color: '#F5552E' }}>{toAdd}</span> to import{total - toAdd > 0 && <span style={{ color: 'var(--muted)' }}> · {total - toAdd} duplicate{total - toAdd === 1 ? '' : 's'} skipped</span>}
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
