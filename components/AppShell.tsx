'use client';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import SettingsModal from './SettingsModal';
import ProfileModal from './ProfileModal';
import MobileNav from './MobileNav';
import Splash from './Splash';
import AuthGate from './AuthGate';
import { getSettings } from '@/lib/store';

// Is "now" inside the [start,end) night window? Handles windows that wrap
// past midnight (e.g. 20:00 -> 07:00).
function isNightNow(start: string, end: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) return false;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const s = sh * 60 + sm, e = eh * 60 + em;
  if (s === e) return false;
  return s < e ? (cur >= s && cur < e) : (cur >= s || cur < e);
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const applyDark = () => {
      const s = getSettings();
      setDark(s.nightModeEnabled ? isNightNow(s.nightModeStart || '20:00', s.nightModeEnd || '07:00') : s.darkMode);
    };
    applyDark();
    const openSettings = () => setSettingsOpen(true);
    const openProfile = () => setProfileOpen(true);
    window.addEventListener('scc:open-settings', openSettings);
    window.addEventListener('scc:open-profile', openProfile);
    window.addEventListener('scc:profile-updated', applyDark);
    const interval = setInterval(applyDark, 60000);
    return () => {
      window.removeEventListener('scc:open-settings', openSettings);
      window.removeEventListener('scc:open-profile', openProfile);
      window.removeEventListener('scc:profile-updated', applyDark);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return (
    <>
      <Splash />
      <AuthGate>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          {/* Desktop sidebar */}
          <div className="hidden md:block" style={{ flexShrink: 0 }}>
            <Sidebar onSettings={() => setSettingsOpen(true)} onProfile={() => setProfileOpen(true)} />
          </div>

          {/* Main content */}
          <main className="main-content" style={{
            flex: 1,
            minWidth: 0,
            padding: '30px 36px 40px',
            paddingBottom: '80px',
            overflowX: 'hidden',
          }}>
            {children}
          </main>

          {/* Mobile bottom nav */}
          <div className="block md:hidden">
            <MobileNav onSettings={() => setSettingsOpen(true)} onProfile={() => setProfileOpen(true)} />
          </div>

          {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
          {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
        </div>
      </AuthGate>
    </>
  );
}
