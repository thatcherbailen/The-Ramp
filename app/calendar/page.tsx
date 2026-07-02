'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import { getEvents, saveEvent, deleteEvent, uid, getJobs, getCalls, getContacts, getCustomTasks, getTaskDeletes, getTaskEdits, getEventCats, saveEventCat } from '@/lib/store';
import { CalendarEvent, Task } from '@/lib/types';
import { SEED_TASKS } from '@/lib/seedData';

type ViewMode = 'agenda' | 'month';

const BASE_CAT: Record<string, { color: string; label: string; href: string }> = {
  Call:       { color: '#F5552E', label: 'Call',       href: '/calls' },
  Interview:  { color: 'var(--ink)', label: 'Interview',  href: '/jobs' },
  Task:       { color: '#B7B0A6', label: 'Task',       href: '/tasks' },
  Networking: { color: '#D8431F', label: 'Networking', href: '/networking' },
  Other:      { color: 'var(--muted)', label: 'Event',      href: '/calendar' },
};
const BASE_ORDER = ['Call', 'Interview', 'Task', 'Networking', 'Other'];

export const catColor = (c: string) => BASE_CAT[c]?.color || getEventCats().find(x => x.name === c)?.color || 'var(--muted)';
export const catLabel = (c: string) => BASE_CAT[c]?.label || c;
const catHref = (c: string) => BASE_CAT[c]?.href || '/calendar';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEK_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']; // Monday-first

type AggEvent = { id: string; date: string; title: string; cat: string; time: string; sort: string; stored: boolean };

function typeToCat(t: string): string {
  if (t === 'Call block') return 'Call';
  if (t === 'Follow-up') return 'Networking';
  return t || 'Other';
}
// "14:30" -> "2:30pm"
function fmtTime(t?: string): string {
  if (!t || !/^\d{2}:\d{2}$/.test(t)) return '—';
  const [h, m] = t.split(':').map(Number);
  const ap = h < 12 ? 'am' : 'pm';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${m ? ':' + String(m).padStart(2, '0') : ''}${ap}`;
}
// "09:00","10:30" -> "9–10:30am"  |  "09:00" -> "9am"
function fmtRange(start?: string, end?: string): string {
  const s = fmtTime(start);
  if (s === '—') return '—';
  const e = fmtTime(end);
  if (e === '—') return s;
  return s.slice(-2) === e.slice(-2) ? `${s.slice(0, -2)}–${e}` : `${s}–${e}`;
}
const pad2 = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

function EventModal({ initial, defaultDate, onClose }: { initial?: CalendarEvent; defaultDate?: string; onClose: () => void }) {
  const [f, setF] = useState<Partial<CalendarEvent>>({ title: '', date: defaultDate || '', time: '', endTime: '', type: 'Other', notes: '', ...initial });
  const [newCat, setNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#7A5CFF');
  const [cats, setCats] = useState(getEventCats());

  const save = () => {
    if (!f.title?.trim() || !f.date) return;
    let type = f.type || 'Other';
    if (newCat && newCatName.trim()) {
      type = newCatName.trim();
      saveEventCat({ name: type, color: newCatColor });
    }
    saveEvent({ id: initial?.id || uid(), title: f.title!, date: f.date!, time: f.time || '', endTime: f.endTime || '', type, notes: f.notes || '' });
    onClose();
  };

  return (
    <Modal title={initial ? 'Edit event' : 'Add to schedule'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className="form-label">Event title</label>
          <input className="form-input" placeholder="Phone screen with Cloudflare…" value={f.title || ''} onChange={e => setF(v => ({ ...v, title: e.target.value }))} />
        </div>
        <div>
          <label className="form-label">Date</label>
          <input className="form-input" type="date" value={f.date || ''} onChange={e => setF(v => ({ ...v, date: e.target.value }))} />
        </div>
        <div>
          <label className="form-label">Time block</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input className="form-input" type="time" value={f.time || ''} onChange={e => setF(v => ({ ...v, time: e.target.value }))} style={{ flex: 1 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', flex: 'none' }}>to</span>
            <input className="form-input" type="time" value={f.endTime || ''} onChange={e => setF(v => ({ ...v, endTime: e.target.value }))} style={{ flex: 1 }} />
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 6 }}>Set both for a block of time, or leave the end blank for a single moment.</div>
        </div>
        <div>
          <label className="form-label">Type / legend</label>
          <select className="form-select" value={newCat ? '__new__' : (f.type || 'Other')} onChange={e => {
            if (e.target.value === '__new__') { setNewCat(true); }
            else { setNewCat(false); setF(v => ({ ...v, type: e.target.value })); }
          }}>
            {BASE_ORDER.map(c => <option key={c} value={c}>{c === 'Other' ? 'Other' : BASE_CAT[c].label}</option>)}
            {cats.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            <option value="__new__">＋ New category…</option>
          </select>
        </div>
        {!newCat && cats.find(c => c.name === f.type) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2b)' }}>“{f.type}” colour</span>
            <input type="color" value={cats.find(c => c.name === f.type)!.color} onChange={e => { saveEventCat({ name: f.type!, color: e.target.value }); setCats(getEventCats()); }} style={{ width: 44, height: 34, border: '1px solid var(--line-2)', borderRadius: 10, background: 'var(--card)', cursor: 'pointer', padding: 3 }} />
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Updates everywhere it’s used</span>
          </div>
        )}
        {newCat && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 56px', gap: 14, alignItems: 'end' }}>
            <div>
              <label className="form-label">New category name</label>
              <input className="form-input" placeholder="e.g. Deep work" value={newCatName} onChange={e => setNewCatName(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Colour</label>
              <input type="color" value={newCatColor} onChange={e => setNewCatColor(e.target.value)} style={{ width: '100%', height: 44, border: '1px solid var(--line-2)', borderRadius: 12, background: 'var(--card)', cursor: 'pointer', padding: 4 }} />
            </div>
          </div>
        )}
        <div>
          <label className="form-label">Notes</label>
          <textarea className="form-input" placeholder="Context, prep needed…" value={f.notes || ''} onChange={e => setF(v => ({ ...v, notes: e.target.value }))} style={{ minHeight: 64, resize: 'vertical' }} />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
          {initial && (
            <button onClick={() => { deleteEvent(initial.id); onClose(); }} style={{ padding: '11px 18px', borderRadius: 12, border: '1px solid #F0CFC6', background: 'var(--card)', color: '#D8431F', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, marginRight: 'auto' }}>Delete</button>
          )}
          <button onClick={onClose} style={{ padding: '11px 22px', borderRadius: 12, border: '1px solid var(--line-2)', background: 'var(--card)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}>Cancel</button>
          <button onClick={save} className="coral-btn" style={{ height: 44, padding: '0 24px', fontSize: 14, borderRadius: 12 }}>{initial ? 'Save' : 'Add'}</button>
        </div>
      </div>
    </Modal>
  );
}

export function aggregateEvents(): AggEvent[] {
  const agg: AggEvent[] = [];
  const tkey = (t?: string) => (t && /^\d{2}:\d{2}$/.test(t)) ? t : '99:99';
  getEvents().forEach(e => agg.push({ id: e.id, date: e.date, title: e.title, cat: typeToCat(e.type), time: fmtRange(e.time, e.endTime), sort: tkey(e.time), stored: true }));
  getCalls().forEach(c => {
    if (c.appointmentBooked && c.appointmentDate && /^\d{4}-\d{2}-\d{2}$/.test(c.appointmentDate))
      agg.push({ id: `call-${c.id}`, date: c.appointmentDate, title: `Appointment — ${c.lead}`, cat: 'Call', time: '—', sort: '99:99', stored: false });
  });
  getJobs().forEach(j => {
    if (j.interviewDate) agg.push({ id: `job-${j.id}`, date: j.interviewDate, title: `Interview — ${j.company}`, cat: 'Interview', time: '—', sort: '99:99', stored: false });
  });
  getContacts().forEach(c => {
    if (c.followupDate && /^\d{4}-\d{2}-\d{2}$/.test(c.followupDate)) agg.push({ id: `net-${c.id}`, date: c.followupDate, title: `Follow up — ${c.name}`, cat: 'Networking', time: '—', sort: '99:99', stored: false });
  });
  const deletes = getTaskDeletes();
  const edits = getTaskEdits();
  const allTasks: Task[] = [...SEED_TASKS.filter(t => !deletes.has(t.id)).map(t => ({ ...t, ...(edits[t.id] || {}) })), ...getCustomTasks()];
  allTasks.forEach(t => {
    if (t.due && /^\d{4}-\d{2}-\d{2}$/.test(t.due)) agg.push({ id: `task-${t.id}`, date: t.due, title: t.task, cat: 'Task', time: '—', sort: '99:99', stored: false });
  });
  return agg;
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

  const load = () => setEvents(aggregateEvents());
  useEffect(() => { load(); }, []);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthEvents = events.filter(e => e.date.startsWith(monthPrefix));
  const catRank = (c: string) => { const i = BASE_ORDER.indexOf(c); return i < 0 ? 99 : i; };
  const eventsOn = (dateStr: string) => events.filter(e => e.date === dateStr).sort((a, b) => (a.sort === b.sort ? catRank(a.cat) - catRank(b.cat) : a.sort.localeCompare(b.sort)));

  // Legend: base categories + any custom categories that have events this month
  const customCats = getEventCats();
  const legendCats = [...BASE_ORDER.filter(c => c !== 'Other'), ...customCats.map(c => c.name)];
  const legend = legendCats.map(c => ({ cat: c, count: monthEvents.filter(e => e.cat === c).length }))
    .filter(l => BASE_ORDER.includes(l.cat) || l.count > 0);

  // 6-week-safe grid that includes trailing days from the previous month and
  // leading days of the next month, so a week is never padded with blanks.
  const todayStr = ymd(today);
  const firstDayMon = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  type Cell = { key: string; day: number; dateStr: string; inMonth: boolean };
  const cells: Cell[] = [];
  for (let i = firstDayMon; i > 0; i--) { const d = new Date(year, month, 1 - i); cells.push({ key: 'p' + i, day: d.getDate(), dateStr: ymd(d), inMonth: false }); }
  for (let day = 1; day <= daysInMonth; day++) cells.push({ key: 'c' + day, day, dateStr: `${monthPrefix}-${pad2(day)}`, inMonth: true });
  for (let n = 1; cells.length % 7 !== 0; n++) { const d = new Date(year, month + 1, n); cells.push({ key: 'n' + n, day: d.getDate(), dateStr: ymd(d), inMonth: false }); }

  const agendaDays = [...new Set(monthEvents.map(e => e.date))].sort().map(date => {
    const d = new Date(date + 'T00:00:00');
    return { date, dom: d.getDate(), dow: d.toLocaleDateString('en-AU', { weekday: 'short' }), isToday: date === todayStr, events: eventsOn(date) };
  });

  const openAdd = (date = '') => { setAddDate(date); setAddOpen(true); };
  const onEventClick = (ev: AggEvent) => {
    if (ev.stored) { const stored = getEvents().find(e => e.id === ev.id); if (stored) setEditEvent(stored); }
    else router.push(catHref(ev.cat));
  };

  const monthLabel = `${MONTHS[month]} ${year}`;
  const legendName = (c: string) => c === 'Call' ? 'Calls' : c === 'Interview' ? 'Interviews' : c === 'Task' ? 'Tasks' : c;

  return (
    <div>
      {/* ===================== DESKTOP ===================== */}
      <div className="hidden md:flex" style={{ gap: 26, alignItems: 'flex-start' }}>
        <div style={{ width: 262, flex: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Mini month */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 18, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
              <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-.01em' }}>{MONTHS[month]}</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{year}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, fontSize: 10, fontWeight: 600, color: 'var(--muted-3)', marginBottom: 6 }}>
              {WEEK_INITIALS.map((w, i) => <div key={i} style={{ textAlign: 'center' }}>{w}</div>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
              {cells.map((c) => {
                const isToday = c.inMonth && c.dateStr === todayStr;
                const has = events.some(e => e.date === c.dateStr);
                return (
                  <div key={c.key} onClick={() => openAdd(c.dateStr)} title="Add to schedule"
                    style={{ aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, fontSize: 12, fontWeight: isToday ? 700 : 500, color: isToday ? '#fff' : (c.inMonth ? 'var(--ink-2)' : 'var(--muted-3)'), background: isToday ? '#F5552E' : 'transparent', borderRadius: 9, cursor: 'pointer' }}>
                    <span>{c.day}</span>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: has && !isToday ? (c.inMonth ? '#F5552E' : 'var(--muted-3)') : 'transparent' }} />
                  </div>
                );
              })}
            </div>
          </div>
          {/* Legend */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 18, padding: '16px 18px' }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>Legend</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {legend.map(lg => (
                <div key={lg.cat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 11, height: 11, borderRadius: 3, background: catColor(lg.cat) }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{legendName(lg.cat)}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>{lg.count}</span>
                </div>
              ))}
            </div>
            <button onClick={() => openAdd()} style={{ marginTop: 12, padding: 0, border: 'none', background: 'none', color: 'var(--muted-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-ink)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted-2)')}>＋ Add category</button>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}>Schedule · everything you log lands here</div>
              <div style={{ fontWeight: 800, fontSize: 46, letterSpacing: '-.03em' }}>{monthLabel}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', gap: 2, background: 'var(--line-3)', borderRadius: 11, padding: 3 }}>
                {(['agenda', 'month'] as ViewMode[]).map(v => (
                  <button key={v} onClick={() => setView(v)} style={{ padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, background: view === v ? 'var(--fill-dark)' : 'transparent', color: view === v ? '#fff' : 'var(--muted)' }}>
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
            <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 18, padding: 18, marginTop: 6 }}>
              <div className="keep-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '.04em', color: 'var(--muted)', marginBottom: 8 }}>
                {WEEK_INITIALS.map((w, i) => <div key={i} style={{ paddingLeft: 2 }}>{w}</div>)}
              </div>
              <div className="keep-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
                {cells.map((c) => {
                  const isToday = c.inMonth && c.dateStr === todayStr;
                  const dayEvents = eventsOn(c.dateStr);
                  return (
                    <div key={c.key} onClick={() => openAdd(c.dateStr)} style={{ minHeight: 92, border: '1px solid var(--line-3)', borderRadius: 10, padding: 7, cursor: 'pointer', background: isToday ? 'var(--accent-soft)' : (c.inMonth ? 'var(--card)' : 'var(--card-2)') }}>
                      <span style={{ fontSize: 12, fontWeight: isToday ? 800 : 600, color: isToday ? '#F5552E' : (c.inMonth ? 'var(--ink-2b)' : 'var(--muted-3)') }}>{c.day}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 5 }}>
                        {dayEvents.slice(0, 3).map(ev => (
                          <div key={ev.id} onClick={e => { e.stopPropagation(); onEventClick(ev); }} title={ev.title} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, color: 'var(--ink-2)', overflow: 'hidden' }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: catColor(ev.cat), flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</span>
                          </div>
                        ))}
                        {dayEvents.length > 3 && <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted-2)', paddingLeft: 2 }}>+{dayEvents.length - 3} more</div>}
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
                <div key={d.date} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 18, padding: '22px 0', borderTop: '1px solid var(--line)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <span className="scc-num" style={{ fontWeight: 300, fontSize: 62, lineHeight: .85 }}>{d.dom}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginTop: 8 }}>{d.dow}</span>
                    </div>
                    {d.isToday && <span style={{ display: 'inline-block', marginTop: 9, fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#F5552E', background: 'var(--accent-soft)', padding: '4px 10px', borderRadius: 999 }}>Today</span>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {d.events.map(ev => (
                      <div key={ev.id} onClick={() => onEventClick(ev)} className="card keep-grid" style={{ display: 'grid', gridTemplateColumns: '4px 92px 1fr', columnGap: 20, alignItems: 'center', padding: '14px 18px', cursor: 'pointer' }}>
                        <span style={{ width: 4, height: 34, borderRadius: 4, background: catColor(ev.cat) }} />
                        <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--muted)', whiteSpace: 'nowrap', textAlign: 'right' }}>{ev.time}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-.01em' }}>{ev.title}</div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: catColor(ev.cat), marginTop: 2 }}>{catLabel(ev.cat)}{ev.stored ? '' : ' · auto'}</div>
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
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)' }}>Schedule</div>
            <div style={{ fontWeight: 800, fontSize: 40, lineHeight: .95, letterSpacing: '-.04em' }}>{monthLabel}</div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={prevMonth} style={{ ...navBtn, width: 34, height: 34 }}>‹</button>
            <button onClick={nextMonth} style={{ ...navBtn, width: 34, height: 34 }}>›</button>
            <button onClick={() => openAdd()} className="coral-btn" style={{ height: 40, padding: '0 16px', fontSize: 13 }}>+ Add</button>
          </div>
        </div>
        {agendaDays.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--muted)' }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>Nothing scheduled</div>
            <div style={{ fontSize: 13, fontWeight: 500, marginTop: 5, lineHeight: 1.5 }}>Tap + to add, or log calls, interviews and follow-ups elsewhere — they land here automatically.</div>
          </div>
        ) : agendaDays.map(d => (
          <div key={d.date} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, borderTop: '1px solid var(--line-3)', paddingTop: 12 }}>
              <span className="scc-num" style={{ fontWeight: 300, fontSize: 30 }}>{d.dom}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>{d.dow}</span>
              {d.isToday && <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#F5552E', background: 'var(--accent-soft)', padding: '3px 9px', borderRadius: 999 }}>Today</span>}
            </div>
            {d.events.map(ev => (
              <div key={ev.id} onClick={() => onEventClick(ev)} className="keep-grid" style={{ display: 'grid', gridTemplateColumns: '86px 4px 1fr', columnGap: 16, alignItems: 'center', padding: '11px 0', cursor: 'pointer' }}>
                <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--muted)', whiteSpace: 'nowrap', textAlign: 'right' }}>{ev.time}</span>
                <span style={{ width: 4, height: 32, borderRadius: 4, background: catColor(ev.cat) }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-.01em' }}>{ev.title}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: catColor(ev.cat), marginTop: 1 }}>{catLabel(ev.cat)}{ev.stored ? '' : ' · auto'}</div>
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

const navBtn: React.CSSProperties = { width: 40, height: 40, borderRadius: 11, border: '1px solid var(--line-2)', background: 'var(--card)', color: 'var(--ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontFamily: 'inherit' };

function EmptyAgenda({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 18, padding: '48px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 14 }}>
      <div style={{ fontWeight: 800, fontSize: 19, letterSpacing: '-.02em' }}>Nothing scheduled this month</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--muted)', maxWidth: 360, lineHeight: 1.5 }}>Add an event, or log a call appointment, job interview date, networking follow-up or task due date — they all appear here automatically.</div>
      <button onClick={onAdd} className="coral-btn" style={{ marginTop: 4, height: 44, padding: '0 20px', fontSize: 14 }}>+ Add to schedule</button>
    </div>
  );
}
