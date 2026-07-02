'use client';
import { useState } from 'react';
import { RampMark } from './Logo';
import { signIn, signUp } from '@/lib/auth';

export default function AuthScreen({ onAuthed, onSignedUpUnconfirmed }: { onAuthed: () => void; onSignedUpUnconfirmed: () => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setBusy(true);
    setError('');
    try {
      if (mode === 'signup') {
        const { data, error } = await signUp(email.trim(), password);
        if (error) throw error;
        if (data.session) onAuthed();
        else onSignedUpUnconfirmed();
      } else {
        const { error } = await signIn(email.trim(), password);
        if (error) throw error;
        onAuthed();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong — try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', background: 'var(--bg)' }}>
      {/* Brand panel */}
      <div className="hidden md:flex" style={{
        width: '44%', flexShrink: 0, background: '#1A1613', color: '#fff',
        flexDirection: 'column', justifyContent: 'space-between', padding: '56px 52px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <RampMark size={34} />
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '.02em' }}>THE RAMP</span>
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 38, letterSpacing: '-.03em', lineHeight: 1.12, maxWidth: 420 }}>
            Everything you need to sell — and to land the role.
          </div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,.6)', marginTop: 18, maxWidth: 380, lineHeight: 1.55 }}>
            Calls, pipeline, interview prep and your whole schedule in one place — set up in a couple of minutes.
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', fontWeight: 500 }}>SDR Prep Platform</div>
      </div>

      {/* Form panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div className="md:hidden" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36, justifyContent: 'center' }}>
            <RampMark size={30} />
            <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '.02em' }}>THE RAMP</span>
          </div>

          <div style={{ fontWeight: 800, fontSize: 27, letterSpacing: '-.02em' }}>
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </div>
          <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 6, marginBottom: 28 }}>
            {mode === 'signup' ? 'Takes about a minute — then we’ll personalise the app for you.' : 'Sign in to pick up right where you left off.'}
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="form-label">Email</label>
              <input className="form-input" type="email" autoComplete="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Password</label>
              <input className="form-input" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required />
            </div>

            {error && (
              <div style={{ fontSize: 13, color: '#D8431F', background: 'var(--accent-soft)', padding: '10px 14px', borderRadius: 10, lineHeight: 1.4 }}>{error}</div>
            )}

            <button type="submit" className="coral-btn" disabled={busy} style={{ height: 48, fontSize: 15, borderRadius: 12, justifyContent: 'center', marginTop: 6, opacity: busy ? 0.7 : 1 }}>
              {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 22, fontSize: 13.5, color: 'var(--muted)' }}>
            {mode === 'signup' ? (
              <>Already have an account?{' '}
                <button onClick={() => { setMode('signin'); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--accent-ink)', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', padding: 0 }}>Sign in</button>
              </>
            ) : (
              <>New here?{' '}
                <button onClick={() => { setMode('signup'); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--accent-ink)', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', padding: 0 }}>Create an account</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
