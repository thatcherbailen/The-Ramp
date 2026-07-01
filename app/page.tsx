'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSettings, getCalls, getJobs, getCustomTasks, getTaskDone, getTaskDeletes, getTaskEdits, getStories, getContacts, getEvents } from '@/lib/store';
import { SEED_TASKS, SEED_STORIES } from '@/lib/seedData';
import LogCallModal from '@/components/LogCallModal';
import { aggregateEvents, catColor, catLabel } from './calendar/page';

type DayEvent = { id: string; title: string; cat: string; time: string };

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const TONE: Record<string, { bg: string; ink: string; micro: string; border: string }> = {
  white: { bg: 'var(--card)', ink: 'var(--ink)', micro: 'var(--muted)', border: '1px solid var(--line)' },
  grey:  { bg: 'var(--card-3)', ink: 'var(--ink)', micro: 'var(--muted)', border: '1px solid var(--card-3)' },
  tint:  { bg: 'var(--accent-soft)', ink: 'var(--ink)', micro: '#C26A4E', border: '1px solid var(--accent-soft)' },
  coral: { bg: '#F5552E', ink: '#fff', micro: 'rgba(255,255,255,.82)', border: '1px solid #F5552E' },
};

type Card = {
  type: 'stat' | 'module';
  tone: keyof typeof TONE;
  big?: string | number;
  label?: string;
  name: string;
  href: string;
  minH: number;
};

export default function TodayPage() {
  const router = useRouter();
  const [logOpen, setLogOpen] = useState(false);
  const [userName, setUserName] = useState('Bailen');
  const [cards, setCards] = useState<Card[]>([]);
  const [todayEvents, setTodayEvents] = useState<DayEvent[]>([]);

  useEffect(() => {
    const settings = getSettings();
    setUserName(settings.userName);

    const calls = getCalls();
    const jobs = getJobs();
    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);

    const callsThisWeek = calls.filter(c => c.date >= weekAgo && c.date <= today).length;
    const apptsBooked = calls.filter(c => c.appointmentBooked).length;
    const apptRate = calls.length ? Math.round((apptsBooked / calls.length) * 100) : 0;
    const activeJobs = jobs.filter(j => !['Rejected', 'Closed'].includes(j.status)).length;
    const upcomingInterviews = jobs.filter(j => ['Phone Screen', 'Interview', 'Final Round'].includes(j.status)).length;

    const done = getTaskDone();
    const deletes = getTaskDeletes();
    const edits = getTaskEdits();
    const seedTasks = SEED_TASKS.filter(t => !deletes.has(t.id)).map(t => ({ ...t, ...(edits[t.id] || {}) }));
    const allTasks = [...seedTasks, ...getCustomTasks()];
    const openTasks = allTasks.filter(t => !done[t.id]).length;

    const storiesCount = SEED_STORIES.length + getStories().length;

    const events = getEvents().filter(e => e.date === today).length;
    const jobEventsToday = jobs.filter(j => j.interviewDate === today).length;
    const contactEventsToday = getContacts().filter(c => c.followupDate === today).length;
    const eventsToday = events + jobEventsToday + contactEventsToday;

    setCards([
      { type: 'stat',   tone: 'coral', big: callsThisWeek,        name: 'Calls this week',   href: '/calls',      minH: 188 },
      { type: 'module', tone: 'grey',  label: 'Cold outreach',    name: 'Call Log',          href: '/calls',      minH: 118 },
      { type: 'module', tone: 'white', label: `${activeJobs} active`, name: 'Job Tracker',   href: '/jobs',       minH: 150 },
      { type: 'stat',   tone: 'tint',  big: `${apptRate}%`,       name: 'Appointment rate',  href: '/calls',      minH: 128 },
      { type: 'module', tone: 'white', label: `Today · ${eventsToday} event${eventsToday === 1 ? '' : 's'}`, name: 'Calendar', href: '/calendar', minH: 168 },
      { type: 'module', tone: 'tint',  label: `${openTasks} open`, name: 'Task Tracker',     href: '/tasks',      minH: 118 },
      { type: 'stat',   tone: 'grey',  big: apptsBooked,          name: 'Appts booked',      href: '/calls',      minH: 140 },
      { type: 'module', tone: 'white', label: `${upcomingInterviews} upcoming`, name: 'Interview Prep', href: '/prep', minH: 150 },
      { type: 'module', tone: 'coral', label: 'Practice',         name: 'Objection Drill',   href: '/objections', minH: 118 },
      { type: 'module', tone: 'grey',  label: `${storiesCount} stories`, name: 'Story Bank', href: '/stories',    minH: 128 },
      { type: 'module', tone: 'tint',  label: 'Reading List',     name: 'Reading List',      href: '/reading',    minH: 150 },
    ]);

    const evs = aggregateEvents().filter(e => e.date === today).sort((a, b) => a.sort.localeCompare(b.sort));
    setTodayEvents(evs.map(e => ({ id: e.id, title: e.title, cat: e.cat, time: e.time })));
  }, [logOpen]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}>{greeting()}, {userName}</div>
          <div className="today-title">Today</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => window.dispatchEvent(new Event('scc:open-settings'))}
            title="Settings"
            style={{ width: 46, height: 46, borderRadius: 999, border: '1px solid var(--line-2)', background: 'var(--card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)', flexShrink: 0 }}
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6"/><path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9L5.3 5.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </button>
          <button
            onClick={() => setLogOpen(true)}
            className="coral-btn"
            style={{ height: 46, padding: '0 22px', fontSize: 14, boxShadow: '0 8px 22px rgba(245,85,46,.28)' }}
          >
            <PhoneIcon />+ Log call
          </button>
        </div>
      </div>

      <div className="scc-mason">
        {cards.map((card, i) => {
          const t = TONE[card.tone];
          return (
            <div
              key={i}
              onClick={() => router.push(card.href)}
              className="scc-mason-card"
              style={{ background: t.bg, color: t.ink, border: t.border, padding: 18, minHeight: card.minH }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <span style={{ color: t.micro, fontSize: 11, fontWeight: 500, letterSpacing: '.01em', maxWidth: '70%' }}>{card.label}</span>
                <span style={{ color: t.ink, display: 'flex', opacity: 0.85 }}>
                  <ArrowIcon />
                </span>
              </div>
              {card.type === 'stat' ? (
                <div style={{ marginTop: 26 }}>
                  <div className="scc-num scc-mason-big">{card.big}</div>
                  <div style={{ color: t.micro, fontSize: 12, fontWeight: 500, marginTop: 6 }}>{card.name}</div>
                </div>
              ) : (
                <div className="scc-mason-name">{card.name}</div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>Today&apos;s schedule</div>
          <span onClick={() => router.push('/calendar')} style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-ink)', cursor: 'pointer' }}>Open calendar →</span>
        </div>
        {todayEvents.length === 0 ? (
          <div className="card" style={{ padding: '18px 20px', fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
            Nothing scheduled today. Add to your schedule from the Calendar — or log a call appointment, interview or follow-up and it lands here automatically.
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            {todayEvents.map((ev, i) => (
              <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', borderTop: i > 0 ? '1px solid var(--line-3)' : undefined }}>
                <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--muted)', width: 84, flex: 'none', whiteSpace: 'nowrap' }}>{ev.time}</span>
                <span style={{ width: 4, height: 30, borderRadius: 4, background: catColor(ev.cat), flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-.01em' }}>{ev.title}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: catColor(ev.cat), marginTop: 1 }}>{catLabel(ev.cat)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {logOpen && <LogCallModal onClose={() => setLogOpen(false)} />}
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
      <path d="M5 3.5h2.2l1.1 3-1.5 1.1a7.5 7.5 0 0 0 3.6 3.6l1.1-1.5 3 1.1v2.2a1.2 1.2 0 0 1-1.3 1.2A11 11 0 0 1 3.8 4.8 1.2 1.2 0 0 1 5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M4 11L11 4M11 4H5M11 4V10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
