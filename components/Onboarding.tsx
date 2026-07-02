'use client';
import { useState } from 'react';
import { RampMark } from './Logo';
import { PRESETS, presetToEnabledMap } from '@/lib/features';
import { completeOnboarding } from '@/lib/auth';
import { getSettings, saveSettings } from '@/lib/store';

const STEPS = ['Welcome', 'Focus', 'Ready'] as const;

export default function Onboarding({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [preset, setPreset] = useState<string>('jobseeker');
  const [busy, setBusy] = useState(false);

  const finish = async () => {
    setBusy(true);
    try {
      const enabled = presetToEnabledMap(PRESETS[preset].enabled);
      await completeOnboarding(userId, { user_name: name.trim() || 'there', preset, enabled_features: enabled });
      saveSettings({ ...getSettings(), userName: name.trim() || 'there', enabledFeatures: enabled });
      onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '40px 24px 0' }}>
        {STEPS.map((label, i) => (
          <div key={label} style={{ width: 34, height: 4, borderRadius: 4, background: i <= step ? '#F5552E' : 'var(--line-2)', transition: 'background .2s' }} />
        ))}
      </div>

      <div style={{ flex: 1, width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 24px 60px' }}>
        {step === 0 && (
          <div style={{ animation: 'splash-pop .4s cubic-bezier(.2,.9,.3,1.3)' }}>
            <RampMark size={44} />
            <div style={{ fontWeight: 800, fontSize: 30, letterSpacing: '-.03em', marginTop: 22 }}>Welcome to The Ramp.</div>
            <div style={{ fontSize: 15, color: 'var(--muted)', marginTop: 8, lineHeight: 1.5 }}>
              Let&apos;s set the app up for you — it only takes a moment.
            </div>
            <div style={{ marginTop: 28 }}>
              <label className="form-label">What should we call you?</label>
              <input
                className="form-input"
                placeholder="Your first name"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
                style={{ height: 50, fontSize: 16 }}
                onKeyDown={e => { if (e.key === 'Enter' && name.trim()) setStep(1); }}
              />
            </div>
            <button
              onClick={() => setStep(1)}
              disabled={!name.trim()}
              className="coral-btn"
              style={{ height: 50, fontSize: 15, borderRadius: 12, justifyContent: 'center', width: '100%', marginTop: 20, opacity: name.trim() ? 1 : 0.45, cursor: name.trim() ? 'pointer' : 'default' }}
            >
              Continue
            </button>
          </div>
        )}

        {step === 1 && (
          <div style={{ animation: 'splash-pop .4s cubic-bezier(.2,.9,.3,1.3)' }}>
            <div style={{ fontWeight: 800, fontSize: 27, letterSpacing: '-.02em' }}>What are you focused on right now, {name.trim() || 'there'}?</div>
            <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 6, marginBottom: 24, lineHeight: 1.5 }}>
              We&apos;ll show only what&apos;s relevant — you can change this anytime in Settings.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(PRESETS).map(([key, p]) => (
                <button
                  key={key}
                  onClick={() => setPreset(key)}
                  style={{
                    textAlign: 'left', padding: '16px 18px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
                    border: preset === key ? '2px solid #F5552E' : '1px solid var(--line-2)',
                    background: preset === key ? 'var(--accent-soft)' : 'var(--card-2)',
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{p.label}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3, lineHeight: 1.4 }}>{p.desc}</div>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button onClick={() => setStep(0)} style={{ padding: '0 20px', height: 50, borderRadius: 12, border: '1px solid var(--line-2)', background: 'var(--card)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}>Back</button>
              <button onClick={() => setStep(2)} className="coral-btn" style={{ flex: 1, height: 50, fontSize: 15, borderRadius: 12, justifyContent: 'center' }}>Continue</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ animation: 'splash-pop .4s cubic-bezier(.2,.9,.3,1.3)', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}><RampMark size={44} /></div>
            <div style={{ fontWeight: 800, fontSize: 27, letterSpacing: '-.02em', marginTop: 20 }}>You&apos;re all set, {name.trim() || 'there'}.</div>
            <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 8, lineHeight: 1.5 }}>
              The Ramp is set up for &ldquo;{PRESETS[preset].label}&rdquo;. Jump in — your calls, pipeline and prep are ready.
            </div>
            <button onClick={finish} disabled={busy} className="coral-btn" style={{ height: 52, fontSize: 15.5, borderRadius: 12, justifyContent: 'center', width: '100%', marginTop: 28, opacity: busy ? 0.7 : 1 }}>
              {busy ? 'Setting up…' : 'Enter The Ramp'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
