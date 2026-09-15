'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getProfile, createProfile } from '@/lib/auth';
import { getSettings, saveSettings, initStore, clearStore, __demoSeed } from '@/lib/store';
import AuthScreen from './AuthScreen';
import Onboarding from './Onboarding';

type Stage = 'loading' | 'unconfirmed' | 'auth' | 'onboarding' | 'app';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [stage, setStage] = useState<Stage>('loading');
  const [userId, setUserId] = useState<string | null>(null);

  const resolve = useCallback(async () => {
    // Public demo link (?demo=1): no auth, in-memory sample data only. Remember
    // it for the tab so navigating and reloads stay in the demo, and never
    // touch Supabase or a real account.
    if (typeof window !== 'undefined') {
      let demo = false;
      try {
        if (new URLSearchParams(window.location.search).get('demo') === '1') { sessionStorage.setItem('theramp_demo', '1'); demo = true; }
        else if (sessionStorage.getItem('theramp_demo') === '1') demo = true;
      } catch { /* sessionStorage may be blocked */ }
      if (demo) {
        __demoSeed();
        window.dispatchEvent(new Event('scc:profile-updated'));
        setStage('app');
        return;
      }
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      clearStore();
      setStage('auth');
      setUserId(null);
      return;
    }
    setUserId(session.user.id);
    await initStore(session.user.id);
    let profile = await getProfile(session.user.id);
    if (!profile) profile = await createProfile(session.user.id);
    if (!profile.onboarding_completed) {
      setStage('onboarding');
      return;
    }
    saveSettings({ ...getSettings(), userName: profile.user_name || getSettings().userName, enabledFeatures: profile.enabled_features });
    window.dispatchEvent(new Event('scc:profile-updated'));
    setStage('app');
  }, []);

  useEffect(() => {
    resolve();
    const { data: sub } = supabase.auth.onAuthStateChange(() => resolve());
    return () => sub.subscription.unsubscribe();
  }, [resolve]);

  if (stage === 'loading') return null;

  if (stage === 'unconfirmed') {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 380, textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: 24, letterSpacing: '-.02em' }}>Check your email</div>
          <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 10, lineHeight: 1.55 }}>
            We&apos;ve sent you a confirmation link — open it to activate your account, then come back and sign in.
          </div>
          <button onClick={() => setStage('auth')} className="coral-btn" style={{ height: 46, padding: '0 24px', fontSize: 14, borderRadius: 12, marginTop: 22 }}>Back to sign in</button>
        </div>
      </div>
    );
  }

  if (stage === 'auth') {
    return <AuthScreen onAuthed={resolve} onSignedUpUnconfirmed={() => setStage('unconfirmed')} />;
  }

  if (stage === 'onboarding' && userId) {
    return <Onboarding userId={userId} onDone={resolve} />;
  }

  return <>{children}</>;
}
