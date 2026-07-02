'use client';
import { useState } from 'react';
import Modal from './Modal';
import { getSettings, saveSettings } from '@/lib/store';
import { Settings } from '@/lib/types';
import { signOut } from '@/lib/auth';

export default function ProfileModal({ onClose }: { onClose: () => void }) {
  const [s, setS] = useState<Settings>(getSettings());
  const upd = (p: Partial<Settings>) => setS(v => ({ ...v, ...p }));

  const save = () => {
    saveSettings(s);
    window.dispatchEvent(new Event('scc:profile-updated'));
    onClose();
  };

  const logOut = async () => {
    await signOut();
    onClose();
  };

  const initials = (s.fullName || s.userName || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const Field = ({ label, value, onChange, placeholder, type = 'text' }: { label: string; value?: string; onChange: (v: string) => void; placeholder?: string; type?: string }) => (
    <div>
      <label className="form-label">{label}</label>
      <input className="form-input" type={type} placeholder={placeholder} value={value || ''} onChange={e => onChange(e.target.value)} />
    </div>
  );

  return (
    <Modal title="Profile" onClose={onClose} width={560}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Avatar + name preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--fill-dark)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22, flexShrink: 0 }}>{initials}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-.01em' }}>{s.fullName || `${s.userName}` }</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{[s.targetRole, s.city].filter(Boolean).join(' · ')}</div>
          </div>
        </div>

        {/* Personal information */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>Personal information</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label className="form-label">Display name (shown in sidebar)</label>
                <input className="form-input" placeholder="Bailen" value={s.userName} onChange={e => upd({ userName: e.target.value })} />
              </div>
              <Field label="Full name" value={s.fullName} onChange={v => upd({ fullName: v })} placeholder="Bailen Thatcher" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Email" value={s.email} onChange={v => upd({ email: v })} placeholder="you@email.com" type="email" />
              <Field label="Phone" value={s.phone} onChange={v => upd({ phone: v })} placeholder="+61…" type="tel" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Role / title" value={s.targetRole} onChange={v => upd({ targetRole: v })} placeholder="SDR / BDR" />
              <Field label="City" value={s.city} onChange={v => upd({ city: v })} placeholder="Sydney" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="LinkedIn" value={s.linkedin} onChange={v => upd({ linkedin: v })} placeholder="linkedin.com/in/…" />
              <Field label="Website" value={s.website} onChange={v => upd({ website: v })} placeholder="yoursite.com" />
            </div>
            <div>
              <label className="form-label">About</label>
              <textarea className="form-input" placeholder="A line or two about you and your goals…" value={s.about || ''} onChange={e => upd({ about: e.target.value })} style={{ minHeight: 72, resize: 'vertical' }} />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>Preferences</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="form-label">Daily call goal — {s.dailyCallGoal}</label>
              <input type="range" min={0} max={150} value={s.dailyCallGoal} onChange={e => upd({ dailyCallGoal: Number(e.target.value) })} style={{ width: '100%', accentColor: '#F5552E' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label className="form-label">Default screen</label>
                <select className="form-select" value={s.defaultScreen} onChange={e => upd({ defaultScreen: e.target.value })}>
                  <option value="today">Today</option><option value="calendar">Calendar</option><option value="tasks">Task Tracker</option><option value="calls">Call Log</option><option value="jobs">Job Tracker</option>
                </select>
              </div>
              <div>
                <label className="form-label">Appearance</label>
                <button onClick={() => upd({ darkMode: !s.darkMode })} style={{ width: '100%', height: 44, borderRadius: 12, border: '1px solid var(--line-2)', background: s.darkMode ? 'var(--fill-dark)' : 'var(--card)', color: s.darkMode ? '#fff' : 'var(--ink-2b)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}>{s.darkMode ? '🌙 Dark mode' : '☀ Light mode'}</button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
          <button onClick={logOut} style={{ padding: '11px 18px', borderRadius: 12, border: '1px solid #F0CFC6', background: 'var(--card)', color: '#D8431F', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, marginRight: 'auto' }}>Sign out</button>
          <button onClick={onClose} style={{ padding: '11px 22px', borderRadius: 12, border: '1px solid var(--line-2)', background: 'var(--card)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}>Cancel</button>
          <button onClick={save} className="coral-btn" style={{ height: 44, padding: '0 24px', fontSize: 14, borderRadius: 12 }}>Save profile</button>
        </div>
      </div>
    </Modal>
  );
}
