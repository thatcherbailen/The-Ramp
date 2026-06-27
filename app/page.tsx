'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSettings, getCalls, getJobs, getCustomTasks, getTaskDone, getTaskDeletes, getTaskEdits, getNews } from '@/lib/store';
import { SEED_TASKS } from '@/lib/seedData';
import LogCallModal from '@/components/LogCallModal';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function TodayPage() {
  const [logOpen, setLogOpen] = useState(false);
  const [data, setData] = useState({ userName: 'Bailen', cards: [] as unknown[] });

  useEffect(() => {
    const settings = getSettings();
    const calls = getCalls();
    const jobs = getJobs();
    const today = new Date().toISOString().slice(0, 10);
    const todayCalls = calls.filter(c => c.date === today);
    const appts = calls.filter(c => c.appointmentBooked).length;

    const done = getTaskDone();
    const deletes = getTaskDeletes();
    const edits = getTaskEdits();
    const seed = SEED_TASKS.filter(t => !deletes.has(t.id)).map(t => ({ ...t, ...(edits[t.id] || {}) }));
    const allTasks = [...seed, ...getCustomTasks()];
    const tasksDone = allTasks.filter(t => done[t.id]).length;
    const news = getNews();
    const topNews = news[0];

    setData({
      userName: settings.userName,
      cards: [
        { label: "Today's calls", href: '/calls', big: todayCalls.length, sub: `of ${settings.dailyCallGoal} goal`, type: 'stat', accent: true },
        { label: 'Appointments booked', href: '/calls', big: appts, sub: 'total booked', type: 'stat' },
        { label: 'Tasks completed', href: '/tasks', big: tasksDone, sub: `of ${allTasks.length} total`, type: 'stat' },
        { label: 'Active roles', href: '/jobs', big: jobs.filter(j => !['Rejected','Closed'].includes(j.status)).length, sub: 'in pipeline', type: 'stat' },
        { label: 'Network', href: '/networking', name: 'Network', type: 'module' },
        { label: 'Interview Prep', href: '/prep', name: 'Interview Prep', type: 'module' },
        { label: 'Story Bank', href: '/stories', name: 'Story Bank', type: 'module' },
        { label: 'Objection Drill', href: '/objections', name: 'Objection Drill', type: 'module' },
        { label: 'Reading List', href: '/reading', name: 'Reading List', type: 'module' },
        topNews
          ? { label: 'Tech News', href: '/news', name: topNews.title, type: 'news' }
          : { label: 'Tech News', href: '/news', name: 'Tech News', type: 'module' },
      ],
    });
  }, [logOpen]);

  const { userName, cards } = data;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#9C958B' }}>{greeting()}, {userName}</div>
          <div className="page-title" style={{ marginTop: 4 }}>Today</div>
        </div>
        <div style={{ marginTop: 10 }}>
          <button
            onClick={() => setLogOpen(true)}
            className="coral-btn"
            style={{ height: 46, padding: '0 22px', fontSize: 14, boxShadow: '0 8px 22px rgba(245,85,46,.28)' }}
          >
            <PhoneIcon />+ Log call
          </button>
        </div>
      </div>

      <div style={{ columns: 'auto 260px', columnGap: 14, marginTop: 22 }}>
        {(cards as Array<{label:string;href:string;big?:number;sub?:string;name?:string;type:string;accent?:boolean}>).map((card, i) => (
          <Link
            key={i}
            href={card.href}
            style={{
              display: 'block',
              breakInside: 'avoid',
              background: card.accent ? '#1A1613' : '#fff',
              border: `1px solid ${card.accent ? '#1A1613' : '#ECE8E2'}`,
              borderRadius: 18,
              padding: '20px 22px',
              marginBottom: 14,
              textDecoration: 'none',
              color: card.accent ? '#fff' : '#1A1613',
              transition: 'box-shadow .15s, transform .15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: card.accent ? 'rgba(255,255,255,.6)' : '#B5AEA4' }}>
                {card.label}
              </span>
              <span style={{ color: card.accent ? 'rgba(255,255,255,.5)' : '#C5BFB6' }}>
                <ArrowIcon />
              </span>
            </div>

            {card.type === 'stat' && (
              <div style={{ marginTop: 26 }}>
                <div className="scc-num" style={{ fontWeight: 300, fontSize: 58, lineHeight: .85, color: card.accent ? '#F5552E' : '#1A1613' }}>
                  {card.big}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: card.accent ? 'rgba(255,255,255,.5)' : '#B5AEA4', marginTop: 8 }}>
                  {card.sub}
                </div>
              </div>
            )}

            {card.type === 'module' && (
              <div style={{ fontWeight: 800, fontSize: 29, lineHeight: 1.02, letterSpacing: '-.03em', marginTop: 36 }}>
                {card.name}
              </div>
            )}

            {card.type === 'news' && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#F5552E', marginBottom: 6 }}>Latest story</div>
                <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.4 }}>{card.name}</div>
              </div>
            )}
          </Link>
        ))}
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
