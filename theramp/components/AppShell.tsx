'use client';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import SettingsModal from './SettingsModal';
import ProfileModal from './ProfileModal';
import MobileNav from './MobileNav';
import { getSettings } from '@/lib/store';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const s = getSettings();
    setDark(s.darkMode);
    const openSettings = () => setSettingsOpen(true);
    const openProfile = () => setProfileOpen(true);
    const refreshDark = () => setDark(getSettings().darkMode);
    window.addEventListener('scc:open-settings', openSettings);
    window.addEventListener('scc:open-profile', openProfile);
    window.addEventListener('scc:profile-updated', refreshDark);
    return () => {
      window.removeEventListener('scc:open-settings', openSettings);
      window.removeEventListener('scc:open-profile', openProfile);
      window.removeEventListener('scc:profile-updated', refreshDark);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return (
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
  );
}
