'use client';
import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import DotMenu from '@/components/DotMenu';
import { getEvents, saveEvent, deleteEvent, uid, getJobs, getCalls, getContacts } from '@/lib/store';
import { CalendarEvent } from '@/lib/types';

type ViewMode = 'month' | 'agenda';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const EVENT_COLORS: Record<string, { bg: string; color: string; dot: string }> = {
  'Interview':   { bg:'#FBE7E0', color:'#C24A24', dot:'#F5552E' },
  'Call block':  { bg:'#E8F5EE', color:'#3F8F5B', dot:'#3F8F5B' },
  'Follow-up':   { bg:'#FFF3CD', color:'#B68B00', dot:'#B68B00' },
  'Networking':  { bg:'#EEF3FB', color:'#3D6FBF', dot:'#3D6FBF' },
  'Task':        { bg:'#F4F1EC', color:'#6B655E', dot:'#9C958B' },
  'Other':       { bg:'#FBF9F6', color:'#9C958B', dot:'#B5AEA4' },
};

const EVENT_TYPES = Object.keys(EVENT_COLORS);

function EventModal({ initial, defaultDate, onClose }: { initial?: CalendarEvent; defaultDate?: string; onClose: () => void }) {
  const [f, setF] = useState<Partial<CalendarEvent>>({
    title:'', date: defaultDate || '', type:'Other', notes:'',
    ...initial
  });
  const save = () => {
    if (!f.title?.trim() || !f.date) return;
    saveEvent({ id: initial?.id || uid(), title:f.title!, date:f.date!, type:f.type||'Other', notes:f.notes||'' });
    onClose();
  };
  return (
    <Modal title={initial ? 'Edit event' : 'Add event'} onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div>
          <label className="form-label">Event title</label>
          <input className="form-input" placeholder="Phone screen with Cloudflare..." value={f.title||''} onChange={e => setF(v => ({ ...v, title:e.target.value }))} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div>
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={f.date||''} onChange={e => setF(v => ({ ...v, date:e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Type</label>
            <select className="form-select" value={f.type||'Other'} onChange={e => setF(v => ({ ...v, type:e.target.value }))}>
              {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="form-label">Notes</label>
          <textarea className="form-input" placeholder="Context, prep needed..." value={f.notes||''} onChange={e => setF(v => ({ ...v, notes:e.target.value }))} style={{ minHeight:72, resize:'vertical' }} />
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
          <button onClick={onClose} style={{ padding:'11px 22px', borderRadius:12, border:'1px solid #E4DFD8', background:'#fff', cursor:'pointer', fontFamily:'inherit', fontSize:14, fontWeight:600 }}>Cancel</button>
          <button onClick={save} className="coral-btn" style={{ height:44, padding:'0 24px', fontSize:14, borderRadius:12 }}>{initial ? 'Save changes' : 'Add event'}</button>
        </div>
      </div>
    </Modal>
  );
}

function isoDate(d: Date) {
  return d.toISOString().slice(0,10);
}

export default function CalendarPage() {
  const today = new Date();
  const [view, setView] = useState<ViewMode>('month');
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [addDate, setAddDate] = useState('');
  const [editEvent, setEditEvent] = useState<CalendarEvent|null>(null);

  const load = () => {
    const stored = getEvents();
    // Pull interview dates from jobs
    const jobs = getJobs();
    const jobEvents: CalendarEvent[] = jobs
      .filter(j => j.interviewDate)
      .map(j => ({ id:`job-${j.id}`, title:`Interview · ${j.company}`, date:j.interviewDate!, type:'Interview', notes:j.role }));
    // Pull follow-up dates from contacts
    const contacts = getContacts();
    const contactEvents: CalendarEvent[] = contacts
      .filter(c => c.followupDate)
      .map(c => ({ id:`net-${c.id}`, title:`Follow up · ${c.name}`, date:c.followupDate!, type:'Follow-up', notes:c.company || '' }));
    setEvents([...stored, ...jobEvents, ...contactEvents]);
  };

  useEffect(() => { load(); }, []);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); };

  // Build month grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const cells: (number|null)[] = [...Array(firstDay).fill(null), ...Array.from({length:daysInMonth},(_,i)=>i+1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const eventsOnDate = (dateStr: string) => events.filter(e => e.date === dateStr);

  // Agenda: next 30 days from today
  const agendaEvents = events
    .filter(e => e.date >= isoDate(today))
    .sort((a,b) => a.date.localeCompare(b.date))
    .slice(0,40);

  const agendaDates = [...new Set(agendaEvents.map(e => e.date))];

  const storedIds = new Set(getEvents().map(e => e.id));

  return (
    <div>
      <div className="page-head" style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:18 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:500, color:'#9C958B' }}>Pipeline · Schedule</div>
          <div className="page-title">Calendar</div>
        </div>
        <div className="page-head-actions" style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ display:'flex', borderBottom:'none', gap:4 }}>
            {(['month','agenda'] as ViewMode[]).map(v => (
              <button key={v} onClick={() => setView(v)} style={{ padding:'9px 18px', borderRadius:10, border:'1px solid #ECE8E2', background: view===v ? '#1A1613' : '#fff', color: view===v ? '#fff' : '#6B655E', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                {v === 'month' ? 'Month' : 'Agenda'}
              </button>
            ))}
          </div>
          <button onClick={() => { setAddDate(''); setAddOpen(true); }} className="coral-btn" style={{ height:46, padding:'0 22px', fontSize:14, boxShadow:'0 6px 18px rgba(245,85,46,.25)' }}>+ Add event</button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginBottom:18 }}>
        {EVENT_TYPES.map(t => {
          const c = EVENT_COLORS[t];
          return (
            <div key={t} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:c.dot }} />
              <span style={{ fontSize:12, fontWeight:600, color:'#6B655E' }}>{t}</span>
            </div>
          );
        })}
      </div>

      {view === 'month' && (
        <div className="card" style={{ overflow:'hidden', padding:0 }}>
          {/* Month nav */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 24px', borderBottom:'1px solid #F1EDE7' }}>
            <button onClick={prevMonth} style={{ width:34, height:34, borderRadius:8, border:'1px solid #ECE8E2', background:'#fff', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
            <div style={{ fontWeight:800, fontSize:18, letterSpacing:'-.02em' }}>{MONTHS[month]} {year}</div>
            <button onClick={nextMonth} style={{ width:34, height:34, borderRadius:8, border:'1px solid #ECE8E2', background:'#fff', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
          </div>
          {/* Day headers */}
          <div className="keep-grid" style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom:'1px solid #F1EDE7' }}>
            {DAYS.map(d => (
              <div key={d} style={{ padding:'10px 0', textAlign:'center', fontSize:10, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'#9C958B' }}>{d}</div>
            ))}
          </div>
          {/* Cells */}
          <div className="keep-grid" style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} style={{ minHeight:90, borderTop: i>=7 ? '1px solid #F1EDE7':undefined, borderRight:'1px solid #F1EDE7', background:'#FDFCFA' }} />;
              const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const isToday = dateStr === isoDate(today);
              const dayEvents = eventsOnDate(dateStr);
              return (
                <div
                  key={i}
                  onClick={() => { setAddDate(dateStr); setAddOpen(true); }}
                  style={{ minHeight:90, padding:'8px 8px', borderTop: i>=7 ? '1px solid #F1EDE7':undefined, borderRight: (i+1)%7!==0 ? '1px solid #F1EDE7':undefined, cursor:'pointer', transition:'background .12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background='#FBF9F6')}
                  onMouseLeave={e => (e.currentTarget.style.background='')}
                >
                  <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:4 }}>
                    <span style={{ width:24, height:24, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight: isToday ? 800 : 500, background: isToday ? '#F5552E' : 'transparent', color: isToday ? '#fff' : '#3F3A34' }}>{day}</span>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                    {dayEvents.slice(0,3).map(ev => {
                      const c = EVENT_COLORS[ev.type] || EVENT_COLORS['Other'];
                      return (
                        <div key={ev.id} style={{ fontSize:10, fontWeight:600, color:c.color, background:c.bg, borderRadius:4, padding:'2px 5px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}
                          onClick={e => { e.stopPropagation(); if (storedIds.has(ev.id)) setEditEvent(ev); }}
                        >{ev.title}</div>
                      );
                    })}
                    {dayEvents.length > 3 && <div style={{ fontSize:10, color:'#9C958B', fontWeight:600, padding:'1px 5px' }}>+{dayEvents.length-3} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'agenda' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {agendaDates.length === 0 ? (
            <div className="card" style={{ padding:'48px 32px', textAlign:'center' }}>
              <div style={{ fontWeight:800, fontSize:18, marginBottom:8 }}>No upcoming events</div>
              <div style={{ fontSize:14, color:'#9C958B' }}>Add events or set interview/follow-up dates in Job Tracker and Network to populate your calendar.</div>
            </div>
          ) : agendaDates.map(date => {
            const dayEvs = agendaEvents.filter(e => e.date === date);
            const d = new Date(date + 'T00:00:00');
            const isToday = date === isoDate(today);
            const label = isToday ? 'Today' : d.toLocaleDateString('en-AU', { weekday:'short', day:'numeric', month:'short' });
            return (
              <div key={date}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
                  <div style={{ fontSize:12, fontWeight:700, color: isToday ? '#F5552E' : '#9C958B', letterSpacing:'.06em', textTransform:'uppercase' }}>{label}</div>
                  <div style={{ flex:1, height:1, background:'#F1EDE7' }} />
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {dayEvs.map(ev => {
                    const c = EVENT_COLORS[ev.type] || EVENT_COLORS['Other'];
                    const isEditable = storedIds.has(ev.id);
                    return (
                      <div key={ev.id} className="card" style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:14 }}>
                        <div style={{ width:10, height:10, borderRadius:'50%', background:c.dot, flexShrink:0 }} />
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:700, fontSize:15 }}>{ev.title}</div>
                          {ev.notes && <div style={{ fontSize:12, color:'#9C958B', marginTop:2 }}>{ev.notes}</div>}
                        </div>
                        <span style={{ fontSize:11, fontWeight:700, color:c.color, background:c.bg, padding:'3px 10px', borderRadius:999 }}>{ev.type}</span>
                        {isEditable && (
                          <DotMenu actions={[
                            { label:'Edit', onClick:() => setEditEvent(ev) },
                            { label:'Delete', onClick:() => { deleteEvent(ev.id); load(); }, danger:true },
                          ]} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(addOpen || editEvent) && (
        <EventModal
          initial={editEvent || undefined}
          defaultDate={addDate}
          onClose={() => { setAddOpen(false); setAddDate(''); setEditEvent(null); load(); }}
        />
      )}
    </div>
  );
}
