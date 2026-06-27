'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import { getEvents, saveEvent, deleteEvent, uid, getJobs, getCalls, getContacts, getCustomTasks, getTaskDeletes, getTaskEdits } from '@/lib/store';
import { CalendarEvent, Task } from '@/lib/types';
import { SEED_TASKS } from '@/lib/seedData';

type ViewMode = 'agenda' | 'month';
type Cat = 'Call' | 'Interview' | 'Task' | 'Networking' | 'Other';

const CAT: Record<Cat, { color: string; label: string; href: string }> = {
  Call:       { color: '#F5552E', label: 'Call',       href: '/calls' },
  Interview:  { color: '#1A1613', label: 'Interview',  href: '/jobs' },
  Task:       { color: '#B7B0A6', label: 'Task',       href: '/tasks' },
  Networking: { color: '#D8431F', label: 'Networking', href: '/networking' },
  Other:      { color: '#9C958B', label: 'Event',      href: '/calendar' },
};
const CATS: Cat[] = ['Call', 'Interview', 'Task', 'Networking', 'Other'];

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEK_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']; // Monday-first

type AggEvent = { id: string; date: string; title: string; cat: Cat; time: string; stored: boolean };

function iso(d: Date) { return d.toISOString().slice(0, 10); }
function typeToCat(t: string): Cat {
  if (t === 'Interview') return 'Interview';
  if (t === 'Call block' || t === 'Call') return 'Call';
  if (t === 'Follow-up' || t === 'Networking') return 'Networking';
  if (t === 'Task') return 'Task';
  return 'Other';
}

function EventModal({ initial, defaultDate, onClose }: { initial?: CalendarEvent; defaultDate?: string; onClose: () => void }) {
  const [f, setF] = useState<Partial<CalendarEvent>>({ title: '', date: defaultDate || '', type: 'Other', notes: '', ...initial });
  const save = () => {
    if (!f.title?.trim() || !f.date) return;
    saveEvent({ id: initial?.id || uid(), title: f.title!, date: f.date!, type: f.type || 'Other', notes: f.notes || '' });
    onClose();
  };
  return (
    <Modal title={initial ? 'Edit event' : 'Add to schedule'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className="form-label">Event title</label>
          <input className="form-input" placeholder="Phone screen with Cloudflare…" value={f.title || ''} onChange={e => setF(v => ({ ...v, title: e.target.value }))} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={f.date || ''} onChange={e => setF(v => ({ ...v, date: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Type</label>
            <select className="form-select" value={f.type || 'Other'} onChange={e => setF(v => ({ ...v, type: e.target.value }))}>
              <option>Call</option><option>Interview</option><option>Task</option><option>Networking</option><option>Other</option>
            </select>
          </div>
        </div>
        <div>
          <label className="form-label">Notes</label>
          <textarea className="form-input" placeholder="Context, prep needed…" value={f.notes || ''} onChange={e => setF(v => ({ ...v, notes: e.target.value }))} style={{ minHeight: 72, resize: 'vertical' }} />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
          {initial && (
            <button onClick={() => { deleteEvent(initial.id); onClose(); }} style={{ padding: '11px 18px', borderRadius: 12, border: '1px solid #F0CFC6', background: '#fff', color: '#D8431F', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, marginRight: 'auto' }}>Delete</button>
          )}
          <button onClick={onClose} style={{ padding: '11px 22px', borderRadius: 12, border: '1px solid #E4DFD8', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}>Cancel</button>
          <button onClick={save} className="coral-btn" style={{ height: 44, padding: '0 24px', fontSize: 14, borderRadius: 12 }}>{initial ? 'Save' : 'Add'}</button>
        </div>
      </div>
    </Modal>
  );
}

export default function CalendarPage() {
  const router = useRouter();
  const today = new Date();
  const [view, setView] = useState<ViewMode>('agenda');
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<AggEvent[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [addDate, setAddDate] = useState('');
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);

  const load = () => {
    const agg: AggEvent[] = [];
    // Manually-added events
    getEvents().forEach(e => agg.push({ id: e.id, date: e.date, title: e.title, cat: typeToCat(e.type), time: e.time || '—', stored: true }));
    // Call appointments
    getCalls().forEach(c => {
      if (c.appointmentBooked && c.appointmentDate && /^\d{4}-\d{2}-\d{2}$/.test(c.appointmentDate))
        agg.push({ id: `call-${c.id}`, date: c.appointmentDate, title: `Appointment — ${c.lead}`, cat: 'Call', time: '—', stored: false });
    });
    // Job interviews
    getJobs().forEach(j => {
      if (j.interviewDate) agg.push({ id: `job-${j.id}`, date: j.interviewDate, title: `Interview — ${j.company}`, cat: 'Interview', time: '—', stored: false });
    });
    // Networking follow-ups
    getContacts().forEach(c => {
      if (c.followupDate && /^\d{4}-\d{2}-\d{2}$/.test(c.followupDate)) agg.push({ id: `net-${c.id}`, date: c.followupDate, title: `Follow up — ${c.name}`, cat: 'Networking', time: '—', stored: false });
    });
    // Task due dates
    const deletes = getTaskDeletes();
    const edits = getTaskEdits();
    const allTasks: Task[] = [...SEED_TASKS.filter(t => !deletes.has(t.id)).map(t => ({ ...t, ...(edits[t.id] || {}) })), ...getCustomTasks()];
    allTasks.forEach(t => {
      if (t.due && /^\d{4}-\d{2}-\d{2}$/.test(t.due)) agg.push({ id: `task-${t.id}`, date: t.due, title: t.task, cat: 'Task', time: '—', stored: false });
    });
    setEvents(agg);
  };
  useEffect(() => { load(); }, []);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthEvents = events.filter(e => e.date.startsWith(monthPrefix));
  const eventsOn = (dateStr: string) => events.filter(e => e.date === dateStr).sort((a, b) => CATS.indexOf(a.cat) - CATS.indexOf(b.cat));

  // Legend counts (this month)
  const legend = (['Call', 'Interview', 'Task', 'Networking'] as Cat[]).map(c => ({
    cat: c, count: monthEvents.filter(e => e.cat === c).length,
  }));

  // Mini-month + month grid cells (Monday-first)
  const firstDayMon = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDayMon).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  // Agenda: days in month that have events, ascending
  const agendaDays = [...new Set(monthEvents.map(e => e.date))].sort().map(date => {
    const d = new Date(date + 'T00:00:00');
    return {
      date, dom: d.getDate(),
      dow: d.toLocaleDateString('en-AU', { weekday: 'short' }),
      isToday: date === iso(today),
      events: eventsOn(date),
    };
  });

  const openAdd = (date = '') => { setAddDate(date); setAddOpen(true); };
  const onEventClick = (ev: AggEvent) => {
    if (ev.stored) { const stored = getEvents().find(e => e.id === ev.id); if (stored) setEditEvent(stored); }
    else router.push(CAT[ev.cat].href);
  };

  const monthLabel = `${MONTHS[month]} ${year}`;

  return (
    <div>
      {/* ===================== DESKTOP ===================== */}
      <div className="hidden md:flex" style={{ gap: 26, alignItems: 'flex-start' }}>
        {/* Left rail */}
        <div style={{ width: 262, flex: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Mini month */}
          <div style={{ background: '#fff', border: '1px solid #ECE8E2', borderRadius: 18, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
              <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-.01em' }}>{MONTHS[month]}</span>
              <span style={{ fontSize: 12, color: '#9C958B' }}>{year}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, fontSize: 10, fontWeight: 600, color: '#C5BFB6', marginBottom: 6 }}>
              {WEEK_INITIALS.map((w, i) => <div key={i} style={{ textAlign: 'center' }}>{w}</div>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
              {cells.map((day, i) => {
                if (!day) return <div key={i} />;
                const dateStr = `${monthPrefix}-${String(day).padStart(2, '0')}`;
                const isToday = dateStr === iso(today);
                const has = events.some(e => e.date === dateStr);
                return (
                  <div key={i} onClick={() => openAdd(dateStr)} title="Add to schedule"
                    style={{ aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, fontSize: 12, fontWeight: isToday ? 700 : 500, color: isToday ? '#fff' : '#3F3A34', background: isToday ? '#F5552E' : 'transparent', borderRadius: 9, cursor: 'pointer' }}>
                    <span>{day}</span>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: has && !isToday ? '#F5552E' : 'transparent' }} />
                  </div>
                );
              })}
            </div>
          </div>
          {/* Legend */}
          <div style={{ background: '#fff', border: '1px solid #ECE8E2', borderRadius: 18, padding: '16px 18px' }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: '#9C958B', marginBottom: 12 }}>Legend</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {legend.map(lg => (
                <div key={lg.cat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 11, height: 11, borderRadius: 3, background: CAT[lg.cat].color }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{lg.cat === 'Call' ? 'Calls' : lg.cat === 'Interview' ? 'Interviews' : lg.cat === 'Task' ? 'Tasks' : 'Networking'}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9C958B' }}>{lg.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#9C958B' }}>Schedule · everything you log lands here</div>
              <div style={{ fontWeight: 800, fontSize: 46, letterSpacing: '-.03em' }}>{monthLabel}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', gap: 2, background: '#F1EDE7', borderRadius: 11, padding: 3 }}>
                {(['agenda', 'month'] as ViewMode[]).map(v => (
                  <button key={v} onClick={() => setView(v)} style={{ padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, background: view === v ? '#1A1613' : 'transparent', color: view === v ? '#fff' : '#9C958B' }}>
                    {v === 'agenda' ? 'Agenda' : 'Month'}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={prevMonth} title="Previous month" style={navBtn}>‹</button>
                <button onClick={nextMonth} title="Next month" style={navBtn}>›</button>
              </div>
              <button onClick={() => openAdd()} className="coral-btn" style={{ height: 46, padding: '0 22px', fontSize: 14, boxShadow: '0 8px 22px rgba(245,85,46,.28)' }}>+ Add to schedule</button>
            </div>
          </div>

          {view === 'month' ? (
            <div style={{ background: '#fff', border: '1px solid #ECE8E2', borderRadius: 18, padding: 18, marginTop: 6 }}>
              <div className="keep-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '.04em', color: '#9C958B', marginBottom: 8 }}>
                {WEEK_INITIALS.map((w, i) => <div key={i} style={{ paddingLeft: 2 }}>{w}</div>)}
              </div>
              <div className="keep-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
                {cells.map((day, i) => {
                  if (!day) return <div key={i} style={{ minHeight: 92 }} />;
                  const dateStr = `${monthPrefix}-${String(day).padStart(2, '0')}`;
                  const isToday = dateStr === iso(today);
                  const dayEvents = eventsOn(dateStr);
                  return (
                    <div key={i} onClick={() => openAdd(dateStr)} style={{ minHeight: 92, border: '1px solid #F1EDE7', borderRadius: 10, padding: 7, cursor: 'pointer', background: isToday ? '#FFF6F2' : '#fff' }}>
                      <span style={{ fontSize: 12, fontWeight: isToday ? 800 : 600, color: isToday ? '#F5552E' : '#6B655E' }}>{day}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 5 }}>
                        {dayEvents.slice(0, 3).map(ev => (
                          <div key={ev.id} onClick={e => { e.stopPropagation(); onEventClick(ev); }} title={ev.title} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, color: '#3F3A34', overflow: 'hidden' }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: CAT[ev.cat].color, flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</span>
                          </div>
                        ))}
                        {dayEvents.length > 3 && <div style={{ fontSize: 10, fontWeight: 600, color: '#B5AEA4', paddingLeft: 2 }}>+{dayEvents.length - 3} more</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : agendaDays.length === 0 ? (
            <EmptyAgenda onAdd={() => openAdd()} />
          ) : (
            <div>
              {agendaDays.map(d => (
                <div key={d.date} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 18, padding: '22px 0', borderTop: '1px solid #ECE8E2' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <span className="scc-num" style={{ fontWeight: 300, fontSize: 62, lineHeight: .85 }}>{d.dom}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#9C958B', marginTop: 8 }}>{d.dow}</span>
                    </div>
                    {d.isToday && <span style={{ display: 'inline-block', marginTop: 9, fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#F5552E', background: '#FBE7E0', padding: '4px 10px', borderRadius: 999 }}>Today</span>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {d.events.map(ev => (
                      <div key={ev.id} onClick={() => onEventClick(ev)} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', cursor: 'pointer' }}>
                        <span style={{ width: 4, height: 34, borderRadius: 4, background: CAT[ev.cat].color, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#9C958B', width: 50, flex: 'none' }}>{ev.time}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-.01em' }}>{ev.title}</div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: CAT[ev.cat].color, marginTop: 2 }}>{CAT[ev.cat].label}{ev.stored ? '' : ' · auto'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===================== MOBILE ===================== */}
      <div className="md:hidden">
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '2px 0 14px' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#9C958B' }}>Schedule</div>
            <div style={{ fontWeight: 800, fontSize: 40, lineHeight: .95, letterSpacing: '-.04em' }}>{monthLabel}</div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={prevMonth} style={{ ...navBtn, width: 34, height: 34 }}>‹</button>
            <button onClick={nextMonth} style={{ ...navBtn, width: 34, height: 34 }}>›</button>
            <button onClick={() => openAdd()} className="coral-btn" style={{ height: 40, padding: '0 16px', fontSize: 13 }}>+ Add</button>
          </div>
        </div>
        {agendaDays.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: '#9C958B' }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1A1613' }}>Nothing scheduled</div>
            <div style={{ fontSize: 13, fontWeight: 500, marginTop: 5, lineHeight: 1.5 }}>Tap + to add, or log calls, interviews and follow-ups elsewhere — they land here automatically.</div>
          </div>
        ) : agendaDays.map(d => (
          <div key={d.date} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, borderTop: '1px solid #F1EDE7', paddingTop: 12 }}>
              <span className="scc-num" style={{ fontWeight: 300, fontSize: 30 }}>{d.dom}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#9C958B' }}>{d.dow}</span>
              {d.isToday && <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#F5552E', background: '#FBE7E0', padding: '3px 9px', borderRadius: 999 }}>Today</span>}
            </div>
            {d.events.map(ev => (
              <div key={ev.id} onClick={() => onEventClick(ev)} style={{ display: 'flex', gap: 12, padding: '11px 0', cursor: 'pointer' }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#9C958B', width: 46, flex: 'none' }}>{ev.time}</span>
                <span style={{ width: 4, borderRadius: 4, background: CAT[ev.cat].color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-.01em' }}>{ev.title}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: CAT[ev.cat].color, marginTop: 1 }}>{CAT[ev.cat].label}{ev.stored ? '' : ' · auto'}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {(addOpen || editEvent) && (
        <EventModal initial={editEvent || undefined} defaultDate={addDate} onClose={() => { setAddOpen(false); setAddDate(''); setEditEvent(null); load(); }} />
      )}
    </div>
  );
}

const navBtn: React.CSSProperties = { width: 40, height: 40, borderRadius: 11, border: '1px solid #E4DFD8', background: '#fff', color: '#1A1613', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontFamily: 'inherit' };

function EmptyAgenda({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #ECE8E2', borderRadius: 18, padding: '48px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 14 }}>
      <div style={{ fontWeight: 800, fontSize: 19, letterSpacing: '-.02em' }}>Nothing scheduled this month</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: '#9C958B', maxWidth: 360, lineHeight: 1.5 }}>Add an event, or log a call appointment, job interview date, networking follow-up or task due date — they all appear here automatically.</div>
      <button onClick={onAdd} className="coral-btn" style={{ marginTop: 4, height: 44, padding: '0 20px', fontSize: 14 }}>+ Add to schedule</button>
    </div>
  );
}
