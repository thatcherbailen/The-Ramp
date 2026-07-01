'use client';
import { useState, useEffect } from 'react';
import Modal from './Modal';
import { getSettings, saveSettings } from '@/lib/store';
import { Settings, DEFAULT_SETTINGS } from '@/lib/types';
import { OPTIONAL_FEATURES, PRESETS, isFeatureEnabled, presetToEnabledMap } from '@/lib/features';

const TABS = ['Profile', 'Goals', 'AI Feed', 'Nudges', 'Display', 'Personalise', 'Data'];

const NEWS_CATS = ['AI & ML', 'SaaS', 'Sales Tech', 'Cloud', 'CyberSecurity', 'Startups', 'Developer Tools'];

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState('Profile');
  const [s, setS] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => { setS(getSettings()); }, []);

  const update = (patch: Partial<Settings>) => {
    const next = { ...s, ...patch };
    setS(next);
    saveSettings(next);
    window.dispatchEvent(new Event('scc:profile-updated'));
  };

  const toggleCat = (cat: string) => {
    const cats = s.newsCategories.includes(cat)
      ? s.newsCategories.filter(c => c !== cat)
      : [...s.newsCategories, cat];
    update({ newsCategories: cats });
  };

  const exportData = () => {
    const data: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (k.startsWith('scc_')) {
        try { data[k] = JSON.parse(localStorage.getItem(k)!); } catch { data[k] = localStorage.getItem(k); }
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `command-centre-backup-${new Date().toISOString().slice(0,10)}.json`; a.click();
  };

  const resetAll = () => {
    if (!confirm('Reset ALL data? This cannot be undone.')) return;
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)!;
      if (k.startsWith('scc_')) localStorage.removeItem(k);
    }
    window.location.reload();
  };

  const FmLabel = ({ children }: { children: React.ReactNode }) => (
    <label className="form-label">{children}</label>
  );

  const inp = (field: keyof Settings, placeholder?: string, type = 'text') => (
    <input
      className="form-input"
      type={type}
      value={s[field] as string}
      placeholder={placeholder}
      onChange={e => update({ [field]: type === 'number' ? Number(e.target.value) : e.target.value } as Partial<Settings>)}
    />
  );

  return (
    <Modal title="Settings" onClose={onClose} width={600}>
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--line)', marginBottom: 24, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t} className={`tab-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'Profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div><FmLabel>Your name</FmLabel>{inp('userName', 'Bailen')}</div>
          <div><FmLabel>Target role</FmLabel>{inp('targetRole', 'SDR / BDR')}</div>
          <div><FmLabel>City</FmLabel>{inp('city', 'Sydney')}</div>
        </div>
      )}

      {tab === 'Goals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <FmLabel>Daily call goal — {s.dailyCallGoal} dials</FmLabel>
            <input type="range" min={10} max={150} step={5} value={s.dailyCallGoal}
              onChange={e => update({ dailyCallGoal: Number(e.target.value) })}
              style={{ width: '100%', accentColor: '#F5552E' }}
            />
          </div>
          <div><FmLabel>Job search start date</FmLabel>{inp('startDate', '2026-06-01', 'date')}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input type="checkbox" id="monStart" checked={s.weekStartsMonday}
              onChange={e => update({ weekStartsMonday: e.target.checked })}
              style={{ accentColor: '#F5552E', width: 16, height: 16 }}
            />
            <label htmlFor="monStart" style={{ fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Week starts on Monday</label>
          </div>
        </div>
      )}

      {tab === 'AI Feed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <FmLabel>Target companies (comma-separated)</FmLabel>
            <textarea
              className="form-input"
              value={s.targetCompanies}
              onChange={e => update({ targetCompanies: e.target.value })}
              style={{ minHeight: 80, resize: 'vertical' }}
            />
          </div>
          <div>
            <FmLabel>News categories</FmLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {NEWS_CATS.map(cat => (
                <button
                  key={cat}
                  onClick={() => toggleCat(cat)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 999,
                    border: '1px solid',
                    borderColor: s.newsCategories.includes(cat) ? '#F5552E' : 'var(--line-2)',
                    background: s.newsCategories.includes(cat) ? 'var(--accent-soft)' : 'var(--card)',
                    color: s.newsCategories.includes(cat) ? '#F5552E' : 'var(--muted)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >{cat}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input type="checkbox" id="dailyPick" checked={s.enableDailyReadingPick}
              onChange={e => update({ enableDailyReadingPick: e.target.checked })}
              style={{ accentColor: '#F5552E', width: 16, height: 16 }}
            />
            <label htmlFor="dailyPick" style={{ fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Enable daily reading recommendations</label>
          </div>
        </div>
      )}

      {tab === 'Nudges' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { key: 'enableMorningBriefing', label: 'Morning briefing reminder', desc: 'Start each session on your Today screen' },
            { key: 'enableCallBlock', label: 'Call block nudge', desc: 'Reminder when your call block starts' },
            { key: 'enableFollowupNudge', label: 'Follow-up nudge', desc: 'Alert when a networking follow-up is due' },
          ].map(({ key, label, desc }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', border: '1px solid var(--line)', borderRadius: 14 }}>
              <input type="checkbox" checked={s[key as keyof Settings] as boolean}
                onChange={e => update({ [key]: e.target.checked } as Partial<Settings>)}
                style={{ accentColor: '#F5552E', width: 16, height: 16, flexShrink: 0 }}
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{label}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Display' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', border: '1px solid var(--line)', borderRadius: 14 }}>
            <input type="checkbox" id="darkMode" checked={s.darkMode} disabled={s.nightModeEnabled}
              onChange={e => update({ darkMode: e.target.checked })}
              style={{ accentColor: '#F5552E', width: 16, height: 16 }}
            />
            <div>
              <label htmlFor="darkMode" style={{ fontSize: 14, fontWeight: 700, cursor: s.nightModeEnabled ? 'default' : 'pointer', opacity: s.nightModeEnabled ? .5 : 1 }}>Dark mode</label>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, opacity: s.nightModeEnabled ? .5 : 1 }}>{s.nightModeEnabled ? 'Controlled by the night-mode schedule below' : 'Switches the whole app to a dark theme instantly'}</div>
            </div>
          </div>

          <div style={{ padding: '14px 16px', border: '1px solid var(--line)', borderRadius: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <input type="checkbox" id="nightMode" checked={!!s.nightModeEnabled}
                onChange={e => update({ nightModeEnabled: e.target.checked })}
                style={{ accentColor: '#F5552E', width: 16, height: 16, flexShrink: 0 }}
              />
              <div>
                <label htmlFor="nightMode" style={{ fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Schedule night mode</label>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Automatically switch to dark mode at a set time, and back at another</div>
              </div>
            </div>
            {s.nightModeEnabled && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line-3)' }}>
                <div>
                  <label className="form-label">Turns on at</label>
                  <input className="form-input" type="time" value={s.nightModeStart || '20:00'} onChange={e => update({ nightModeStart: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Turns off at</label>
                  <input className="form-input" type="time" value={s.nightModeEnd || '07:00'} onChange={e => update({ nightModeEnd: e.target.value })} />
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', border: '1px solid var(--line)', borderRadius: 14 }}>
            <input type="checkbox" id="compact" checked={s.compactDensity}
              onChange={e => update({ compactDensity: e.target.checked })}
              style={{ accentColor: '#F5552E', width: 16, height: 16 }}
            />
            <div>
              <label htmlFor="compact" style={{ fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Compact density</label>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Tighter spacing on cards and lists</div>
            </div>
          </div>
          <div>
            <FmLabel>Default landing screen</FmLabel>
            <select
              className="form-select"
              value={s.defaultScreen}
              onChange={e => update({ defaultScreen: e.target.value })}
            >
              <option value="today">Today</option>
              <option value="/calendar">Calendar</option>
              <option value="/tasks">Task Tracker</option>
              <option value="/calls">Call Log</option>
              <option value="/jobs">Job Tracker</option>
            </select>
          </div>
        </div>
      )}

      {tab === 'Personalise' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 13, color: 'var(--ink-2b)', lineHeight: 1.5 }}>
            Show only what you actually need. Whether you&apos;re breaking into sales, prepping for interviews, or already selling and just want to log your day — pick a starting point or toggle features individually. Today, Calendar and Task Tracker always stay on.
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {Object.entries(PRESETS).map(([key, p]) => (
              <button
                key={key}
                onClick={() => update({ enabledFeatures: presetToEnabledMap(p.enabled) })}
                style={{ flex: '1 1 150px', textAlign: 'left', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--line-2)', background: 'var(--card-2)', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <div style={{ fontSize: 13, fontWeight: 700 }}>{p.label}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 3, lineHeight: 1.4 }}>{p.desc}</div>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {OPTIONAL_FEATURES.map(f => {
              const on = isFeatureEnabled(s.enabledFeatures, f.key);
              return (
                <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', border: '1px solid var(--line)', borderRadius: 14 }}>
                  <input type="checkbox" checked={on}
                    onChange={e => update({ enabledFeatures: { ...(s.enabledFeatures || {}), [f.key]: e.target.checked } })}
                    style={{ accentColor: '#F5552E', width: 16, height: 16, flexShrink: 0 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{f.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{f.desc}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted-2)' }}>{f.group}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'Data' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'var(--card-2)', border: '1px solid var(--line)', borderRadius: 14, padding: '16px 20px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Export backup</div>
            <div style={{ fontSize: 13, color: 'var(--ink-2b)', marginBottom: 14, lineHeight: 1.5 }}>Download a JSON backup of all your data — tasks, calls, jobs, stories, contacts, and settings.</div>
            <button onClick={exportData} className="coral-btn" style={{ height: 40, padding: '0 20px', fontSize: 14 }}>Download JSON backup</button>
          </div>
          <div style={{ background: 'var(--accent-soft)', border: '1px solid #F0D7CF', borderRadius: 14, padding: '16px 20px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-ink)', marginBottom: 6 }}>Reset all data</div>
            <div style={{ fontSize: 13, color: 'var(--accent-ink)', marginBottom: 14, lineHeight: 1.5, opacity: 0.8 }}>Permanently deletes everything. The seed tasks and prep cards will reload — your own entries will be gone.</div>
            <button onClick={resetAll} style={{ height: 40, padding: '0 20px', fontSize: 14, fontWeight: 700, background: 'var(--accent-ink)', color: '#fff', border: 'none', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit' }}>Reset everything</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
