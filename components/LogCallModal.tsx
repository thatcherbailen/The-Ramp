'use client';
import { useState } from 'react';
import Modal from './Modal';
import { saveCall, uid } from '@/lib/store';
import { Call } from '@/lib/types';

const SOURCES = ['Cold call', 'LinkedIn', 'Referral', 'Inbound', 'Email', 'Event', 'Other'];
const OUTCOMES = ['Appointment booked', 'Voicemail', 'Not interested', 'Follow up', 'Wrong number', 'No answer', 'Call back later'];
const OBJECTIONS = ['None', 'Price', 'Timing', 'Competitor', 'No need', 'No decision maker', 'Brush off', 'Budget'];
const TONES = ['Warm', 'Neutral', 'Cold', 'Hostile', 'Interested'];

const BLANK: Partial<Call> = {
  lead: '', source: 'Cold call', callNumber: 1, duration: '', outcome: 'Voicemail',
  confidence: 5, appointmentBooked: false, appointmentDate: '', objection: 'None',
  tone: 'Neutral', response: '', worked: '', improve: '', isInterviewStory: false, storyTitle: '',
};

export default function LogCallModal({ onClose, initial }: { onClose: () => void; initial?: Partial<Call> }) {
  const [f, setF] = useState<Partial<Call>>({ ...BLANK, ...initial });
  const update = (p: Partial<Call>) => setF(v => ({ ...v, ...p }));

  const save = () => {
    if (!f.lead?.trim()) return;
    const c: Call = {
      id: (initial as Call)?.id || uid(),
      date: (initial as Call)?.date || new Date().toISOString().slice(0,10),
      lead: f.lead!,
      source: f.source || 'Cold call',
      callNumber: f.callNumber || 1,
      duration: f.duration || '',
      outcome: f.outcome || 'Voicemail',
      confidence: f.confidence || 5,
      appointmentBooked: !!f.appointmentBooked,
      appointmentDate: f.appointmentDate,
      jobValue: f.jobValue,
      objection: f.objection || 'None',
      tone: f.tone || 'Neutral',
      response: f.response || '',
      worked: f.worked || '',
      improve: f.improve || '',
      isInterviewStory: !!f.isInterviewStory,
      storyTitle: f.storyTitle,
    };
    saveCall(c);
    onClose();
  };

  const L = ({ children }: { children: React.ReactNode }) => <label className="form-label">{children}</label>;
  const Inp = ({ field, placeholder, type = 'text' }: { field: keyof Call; placeholder?: string; type?: string }) => (
    <input className="form-input" type={type} placeholder={placeholder}
      value={f[field] as string || ''} onChange={e => update({ [field]: e.target.value } as Partial<Call>)} />
  );
  const Sel = ({ field, opts }: { field: keyof Call; opts: string[] }) => (
    <select className="form-select" value={f[field] as string || ''} onChange={e => update({ [field]: e.target.value } as Partial<Call>)}>
      {opts.map(o => <option key={o}>{o}</option>)}
    </select>
  );

  return (
    <Modal title={initial ? 'Edit call' : 'Log a call'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div><L>Lead name / company</L><Inp field="lead" placeholder="Acme Corp — John Smith" /></div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div><L>Source</L><Sel field="source" opts={SOURCES} /></div>
          <div><L>Call #</L><Inp field="callNumber" placeholder="1" type="number" /></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div><L>Outcome</L><Sel field="outcome" opts={OUTCOMES} /></div>
          <div><L>Duration</L><Inp field="duration" placeholder="2m 30s" /></div>
        </div>

        <div>
          <L>Confidence (1–10) — {f.confidence}</L>
          <input type="range" min={1} max={10} value={f.confidence || 5}
            onChange={e => update({ confidence: Number(e.target.value) })}
            style={{ width: '100%', accentColor: '#F5552E' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div><L>Objection</L><Sel field="objection" opts={OBJECTIONS} /></div>
          <div><L>Tone</L><Sel field="tone" opts={TONES} /></div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={!!f.appointmentBooked}
              onChange={e => update({ appointmentBooked: e.target.checked })}
              style={{ accentColor: '#F5552E', width: 16, height: 16 }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Appointment booked</span>
          </label>
          {f.appointmentBooked && (
            <input className="form-input" type="date" value={f.appointmentDate || ''}
              onChange={e => update({ appointmentDate: e.target.value })}
              style={{ flex: 1 }} />
          )}
        </div>

        {f.appointmentBooked && (
          <div><L>Job value (if it closes)</L><Inp field="jobValue" placeholder="$14,000" /></div>
        )}

        <div>
          <L>Response / what you said</L>
          <textarea className="form-input" placeholder="How did you handle it?"
            value={f.response || ''} onChange={e => update({ response: e.target.value })}
            style={{ minHeight: 72, resize: 'vertical' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div><L>What worked</L><Inp field="worked" placeholder="Warm opener, stayed calm..." /></div>
          <div><L>What to improve</L><Inp field="improve" placeholder="Pause before pitching..." /></div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={!!f.isInterviewStory}
            onChange={e => update({ isInterviewStory: e.target.checked })}
            style={{ accentColor: '#F5552E', width: 16, height: 16 }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>★ Flag as interview story</span>
        </label>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button onClick={onClose} style={{ padding: '11px 22px', borderRadius: 12, border: '1px solid var(--line-2)', background: 'var(--card)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}>Cancel</button>
          <button onClick={save} className="coral-btn" style={{ height: 44, padding: '0 24px', fontSize: 14, borderRadius: 12 }}>
            {initial ? 'Save changes' : 'Log call'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
