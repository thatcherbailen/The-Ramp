'use client';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import SettingsModal from './SettingsModal';
import MobileNav from './MobileNav';
import { getSettings } from '@/lib/store';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const s = getSettings();
    setDark(s.darkMode);
  }, []);

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      filter: dark ? 'invert(1) hue-rotate(180deg)' : 'none',
      transition: 'filter .2s',
    }}>
      {/* Desktop sidebar */}
      <div className="hidden md:block" style={{ flexShrink: 0 }}>
        <Sidebar onSettings={() => setSettingsOpen(true)} />
      </div>

      {/* Main content */}
      <main style={{
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
        <MobileNav onSettings={() => setSettingsOpen(true)} />
      </div>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
