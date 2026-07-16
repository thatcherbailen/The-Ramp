'use client';
import { useState, useEffect } from 'react';
import { getCalls, deleteCall, saveCall } from '@/lib/store';
import { Call } from '@/lib/types';
import LogCallModal from '@/components/LogCallModal';
import DotMenu from '@/components/DotMenu';

type Tab = 'log' | 'meetings' | 'dashboard' | 'stories';

const OUTCOME_COLORS: Record<string, {bg:string,color:string}> = {
  'Appointment booked': { bg: '#E8F5EE', color: '#3F8F5B' },
  'Voicemail': { bg: 'var(--card-2)', color: 'var(--muted)' },
  'Not interested': { bg: 'var(--accent-soft)', color: 'var(--accent-ink)' },
  'Follow up': { bg: '#EEF3FB', color: '#3D6FBF' },
  'No answer': { bg: 'var(--card-2)', color: 'var(--muted-2)' },
  'Wrong number': { bg: 'var(--card-2)', color: 'var(--muted-2)' },
  'Call back later': { bg: 'var(--card-2)', color: 'var(--muted)' },
};

function pillStyle(outcome: string) {
  const c = OUTCOME_COLORS[outcome] || { bg: 'var(--card-3)', color: 'var(--ink-2b)' };
  return { display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:700, background:c.bg, color:c.color };
}

export default function CallsPage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [calls, setCalls] = useState<Call[]>([]);
  const [logOpen, setLogOpen] = useState(false);
  const [editCall, setEditCall] = useState<Call|null>(null);

  // Latest call at the top. Sort by call number (the running counter) so the
  // "#" column reads cleanly descending and always matches the actual call;
  // fall back to date for any legacy call without a number. Spread into a NEW
  // array first — getCalls() returns the cached reference and .sort() mutates
  // in place, so without the copy setCalls gets the same reference and React
  // skips the re-render (why an inline toggle only showed after navigating).
  const load = () => setCalls([...getCalls()].sort((a,b) => (b.callNumber || 0) - (a.callNumber || 0) || b.date.localeCompare(a.date)));
  useEffect(() => { load(); }, [logOpen, editCall]);
  // Never strand on the Meetings tab if the last booked meeting is removed.
  useEffect(() => { if (tab === 'meetings' && !calls.some(c => c.appointmentBooked)) setTab('log'); }, [tab, calls]);

  // Toggle whether a booked meeting turned into a closed (won) deal.
  const toggleClosed = (c: Call) => { saveCall({ ...c, dealClosed: !c.dealClosed }); load(); };

  const dollars = (v?: string) => { const n = parseFloat((v || '').replace(/[^0-9.]/g, '')); return isNaN(n) ? 0 : n; };

  // Meetings booked, ordered by the date they're booked FOR (soonest first).
  const meetings = calls
    .filter(c => c.appointmentBooked)
    .sort((a,b) => (a.appointmentDate || '9999').localeCompare(b.appointmentDate || '9999'));
  const apptCount = meetings.length;
  const closedMeetings = meetings.filter(c => c.dealClosed);
  const openMeetings = meetings.filter(c => !c.dealClosed);
  // Actual revenue = value of meetings that closed. Potential revenue = value
  // still in play (booked but not yet closed).
  const actualRevenue = closedMeetings.reduce((s,c) => s + dollars(c.jobValue), 0);
  const potentialRevenue = openMeetings.reduce((s,c) => s + dollars(c.jobValue), 0);

  const avgConf = calls.length ? (calls.reduce((s,c) => s+c.confidence,0)/calls.length).toFixed(1) : '—';
  const stories = calls.filter(c => c.isInterviewStory);
  const objectionsHandled = calls.filter(c => c.objection !== 'None').length;

  const objBreak = calls.reduce((m,c) => { m[c.objection] = (m[c.objection]||0)+1; return m; }, {} as Record<string,number>);
  const outBreak = calls.reduce((m,c) => { m[c.outcome] = (m[c.outcome]||0)+1; return m; }, {} as Record<string,number>);

  const money = (n: number) => `$${n.toLocaleString('en-AU')}`;
  const statsArr = [
    { label:'Total calls', value: calls.length, coral:false },
    { label:'Appts booked', value: apptCount, coral:false },
    { label:'Appt rate', value: calls.length ? `${Math.round(apptCount/calls.length*100)}%` : '0%', coral:true },
    { label:'Deals closed', value: closedMeetings.length, coral:false },
    { label:'Potential revenue', value: money(potentialRevenue), coral:false },
    { label:'Actual revenue', value: money(actualRevenue), coral:true },
    { label:'Avg confidence', value: avgConf, coral:false },
    { label:'Interview stories', value: stories.length, coral:false },
    { label:'Objections handled', value: objectionsHandled, coral:false },
  ];

  const TABS: Tab[] = ['dashboard', 'log', ...(apptCount ? ['meetings' as Tab] : []), 'stories'];
  const tabLabel = (t: Tab) => t === 'log' ? 'Call Log' : t === 'meetings' ? `Meetings (${apptCount})` : t === 'dashboard' ? 'Dashboard' : 'Stories';

  return (
    <div>
      <div className="page-head" style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:500, color:'var(--muted)' }}>Pipeline · Outbound dials</div>
          <div className="page-title">Call Log</div>
        </div>
        <div className="page-head-actions" style={{ display:'flex', alignItems:'center', gap:20 }}>
          <div className="page-head-meta" style={{ display:'flex', alignItems:'baseline', gap:8 }}>
            <span className="scc-num" style={{ fontWeight:300, fontSize:52, color:'#F5552E' }}>{calls.length}</span>
            <span style={{ fontSize:12, fontWeight:600, letterSpacing:'.04em', textTransform:'uppercase', color:'var(--muted)' }}>total calls</span>
          </div>
          <button onClick={() => setLogOpen(true)} className="coral-btn" style={{ height:50, padding:'0 24px', fontSize:15, boxShadow:'0 8px 22px rgba(245,85,46,.28)' }}>
            <PhoneIcon />Log a call
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="scroll-x" style={{ display:'flex', borderBottom:'1px solid var(--line)', marginBottom:22 }}>
        {TABS.map(t => (
          <button key={t} className={`tab-btn${tab===t?' active':''}`} onClick={() => setTab(t)}>
            {tabLabel(t)}
          </button>
        ))}
      </div>

      {/* CALL LOG TAB */}
      {tab === 'log' && (
        calls.length === 0 ? (
          <EmptyState title="No calls logged yet" desc='Hit "Log a call" after every dial — the dashboard fills in automatically.' onAdd={() => setLogOpen(true)} btnLabel="+ Log a call" />
        ) : (
          <>
          <div className="card hidden md:block">
            <div style={{ display:'grid', gridTemplateColumns:'34px 1.6fr 150px 58px 116px 60px', gap:14, padding:'13px 22px', background:'var(--card-2)', borderTopLeftRadius:18, borderTopRightRadius:18, fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--muted)' }}>
              <div>#</div><div>Lead · source</div><div>Outcome</div><div>Conf</div><div>Appointment</div><div></div>
            </div>
            {calls.map((c,i) => (
              <div key={c.id} style={{ padding:'15px 22px', borderTop:'1px solid var(--line-3)' }}>
                <div style={{ display:'grid', gridTemplateColumns:'34px 1.6fr 150px 58px 116px 60px', gap:14, alignItems:'center' }}>
                  <div className="scc-num" style={{ fontWeight:600, color:'var(--muted-3)', fontSize:14 }}>{c.callNumber || i+1}</div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:15, letterSpacing:'-.01em' }}>{c.lead}</div>
                    <div style={{ fontSize:12, color:'var(--muted)', marginTop:1 }}>{c.source} · {c.date}</div>
                  </div>
                  <div style={pillStyle(c.outcome) as React.CSSProperties}>{c.outcome}</div>
                  <div style={{ fontSize:14, fontWeight:700, color: c.confidence >= 7 ? '#3F8F5B' : c.confidence >= 4 ? 'var(--muted)' : 'var(--accent-ink)' }}>{c.confidence}/10</div>
                  <div style={{ fontSize:13, color: c.appointmentBooked ? '#3F8F5B' : 'var(--muted-2)', fontWeight: c.appointmentBooked ? 700 : 500 }}>
                    {c.appointmentBooked ? `✓ ${c.appointmentDate || 'Booked'}${c.jobValue ? ` · ${c.jobValue}` : ''}` : '—'}
                  </div>
                  <div style={{ display:'flex', justifyContent:'flex-end' }}>
                    <DotMenu actions={[
                      { label:'Edit', onClick:() => setEditCall(c) },
                      { label:'Delete', onClick:() => { deleteCall(c.id); load(); }, danger:true },
                    ]} />
                  </div>
                </div>
                {(c.response || c.worked || c.improve) && (
                  <div style={{ paddingLeft:48, marginTop:9 }}>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:7 }}>
                      {c.objection !== 'None' && (
                        <span style={{ fontSize:11, fontWeight:700, color:'var(--accent-ink)', background:'var(--accent-soft)', padding:'3px 10px', borderRadius:999 }}>
                          {c.objection}
                        </span>
                      )}
                      <span style={{ fontSize:11, fontWeight:500, color:'var(--muted)', background:'var(--card-2)', border:'1px solid var(--line)', padding:'3px 10px', borderRadius:999 }}>
                        Tone · {c.tone}
                      </span>
                      {c.isInterviewStory && (
                        <span style={{ fontSize:11, fontWeight:700, color:'var(--accent-ink)', background:'var(--accent-soft)', padding:'3px 10px', borderRadius:999 }}>★ Interview story</span>
                      )}
                    </div>
                    {c.response && <div style={{ fontSize:13, color:'var(--ink-2b)', lineHeight:1.5, marginBottom:6 }}>{c.response}</div>}
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'7px 26px' }}>
                      {c.worked && <div style={{ fontSize:12, color:'var(--muted)' }}><span style={{ fontWeight:700, color:'#3F8F5B' }}>Worked</span> · {c.worked}</div>}
                      {c.improve && <div style={{ fontSize:12, color:'var(--muted)' }}><span style={{ fontWeight:700, color:'var(--accent-ink)' }}>Improve</span> · {c.improve}</div>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile clean rows */}
          <div className="md:hidden">
            {calls.map(c => (
              <div key={c.id} onClick={() => setEditCall(c)} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, padding:'15px 0', borderTop:'1px solid var(--line-3)', cursor:'pointer' }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:16, letterSpacing:'-.01em' }}>{c.lead}</div>
                  <div style={{ fontSize:12, fontWeight:500, color:'var(--muted)', marginTop:2 }}>{c.source} · {c.date}</div>
                </div>
                <div style={{ ...pillStyle(c.outcome) as React.CSSProperties, flex:'none', textAlign:'center' }}>{c.outcome}</div>
              </div>
            ))}
          </div>
          </>
        )
      )}

      {/* MEETINGS TAB */}
      {tab === 'meetings' && (
        <div>
          {/* Revenue summary */}
          <div className="grid-2up" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
            <div className="card" style={{ padding:'18px 22px' }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--muted)', marginBottom:6 }}>Meetings booked</div>
              <div className="scc-num" style={{ fontWeight:300, fontSize:42, color:'var(--ink)' }}>{apptCount}</div>
            </div>
            <div className="card" style={{ padding:'18px 22px' }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--muted)', marginBottom:6 }}>Potential revenue</div>
              <div className="scc-num" style={{ fontWeight:300, fontSize:42, color:'var(--ink)' }}>{money(potentialRevenue)}</div>
            </div>
            <div className="card" style={{ padding:'18px 22px' }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--muted)', marginBottom:6 }}>Actual revenue</div>
              <div className="scc-num" style={{ fontWeight:300, fontSize:42, color:'#F5552E' }}>{money(actualRevenue)}</div>
            </div>
          </div>

          <div className="card">
            <div className="table-head" style={{ display:'grid', gridTemplateColumns:'1.6fr 130px 130px 120px 60px', gap:14, padding:'13px 22px', background:'var(--card-2)', borderTopLeftRadius:18, borderTopRightRadius:18, fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--muted)' }}>
              <div>Lead · source</div><div>Meeting date</div><div>Value</div><div>Status</div><div></div>
            </div>
            {meetings.map(c => (
              <div key={c.id} style={{ display:'grid', gridTemplateColumns:'1.6fr 130px 130px 120px 60px', gap:14, alignItems:'center', padding:'15px 22px', borderTop:'1px solid var(--line-3)' }}>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:15, letterSpacing:'-.01em' }}>{c.lead}</div>
                  <div style={{ fontSize:12, color:'var(--muted)', marginTop:1 }}>{c.source} · call #{c.callNumber}</div>
                </div>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--ink-2)' }}>{c.appointmentDate || '—'}</div>
                <div className="scc-num" style={{ fontSize:14, fontWeight:700, color: c.jobValue ? 'var(--ink)' : 'var(--muted-3)' }}>{c.jobValue || '—'}</div>
                <div>
                  <button
                    onClick={() => toggleClosed(c)}
                    style={{
                      display:'inline-flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:999,
                      border:`1px solid ${c.dealClosed ? '#3F8F5B' : 'var(--line-2)'}`,
                      background: c.dealClosed ? '#E8F5EE' : 'var(--card)',
                      color: c.dealClosed ? '#3F8F5B' : 'var(--muted)',
                      fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap',
                    }}
                  >
                    {c.dealClosed ? '✓ Closed' : 'Mark closed'}
                  </button>
                </div>
                <div style={{ display:'flex', justifyContent:'flex-end' }}>
                  <DotMenu actions={[
                    { label:'Edit', onClick:() => setEditCall(c) },
                    { label: c.dealClosed ? 'Reopen' : 'Mark closed', onClick:() => toggleClosed(c) },
                  ]} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:12, color:'var(--muted)', marginTop:12, lineHeight:1.5 }}>
            Meetings are ordered by the date they&apos;re booked for. Mark one closed when the deal lands — its value moves from potential into actual revenue.
          </div>
        </div>
      )}

      {/* DASHBOARD TAB */}
      {tab === 'dashboard' && (
        <div>
          <div className="grid-2up" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:18 }}>
            {statsArr.map(s => (
              <div key={s.label} className="card" style={{ padding:'18px 22px' }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--muted)', marginBottom:6 }}>{s.label}</div>
                <div className="scc-num" style={{ fontWeight:300, fontSize:42, color: s.coral ? '#F5552E' : 'var(--ink)' }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <BreakdownCard title="Objection breakdown" data={objBreak} total={calls.length} />
            <BreakdownCard title="Outcome breakdown" data={outBreak} total={calls.length} />
          </div>
        </div>
      )}

      {/* STORIES TAB */}
      {tab === 'stories' && (
        <div>
          <div style={{ fontSize:12, color:'var(--muted)', marginBottom:16, lineHeight:1.5, maxWidth:680 }}>
            STAR-format stories pulled from your calls flagged as interview stories. Eight to ten polished stories puts you ahead of most candidates.
          </div>
          {stories.length === 0 ? (
            <div className="card" style={{ padding:'48px 40px', textAlign:'center', color:'var(--muted)' }}>
              <div style={{ fontWeight:700, fontSize:17, color:'var(--ink)', marginBottom:8 }}>No interview stories yet</div>
              <div style={{ fontSize:14 }}>Flag a call as an interview story when logging it — it appears here automatically.</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {stories.map(c => (
                <div key={c.id} className="card" style={{ padding:'22px 24px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                    <span style={{ fontSize:10, fontWeight:700, letterSpacing:'.06em', color:'var(--accent-ink)', background:'var(--accent-soft)', padding:'4px 11px', borderRadius:999 }}>{c.date}</span>
                    <span style={{ fontWeight:800, fontSize:18, letterSpacing:'-.01em' }}>{c.lead}</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px 28px' }}>
                    <div>
                      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--muted-2)', marginBottom:4 }}>What happened</div>
                      <div style={{ fontSize:13, fontWeight:500, color:'var(--ink-2)', lineHeight:1.5 }}>{c.response}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--muted-2)', marginBottom:4 }}>Outcome</div>
                      <div style={{ fontSize:13, fontWeight:500, color:'var(--ink-2)', lineHeight:1.5 }}>{c.outcome} — {c.worked}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {logOpen && <LogCallModal onClose={() => { setLogOpen(false); load(); }} />}
      {editCall && <LogCallModal initial={editCall} onClose={() => { setEditCall(null); load(); }} />}
    </div>
  );
}

function BreakdownCard({ title, data, total }: { title:string; data:Record<string,number>; total:number }) {
  const entries = Object.entries(data).sort((a,b) => b[1]-a[1]);
  return (
    <div className="card" style={{ padding:'20px 22px' }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--muted)', marginBottom:14 }}>{title}</div>
      {entries.map(([label,count]) => (
        <div key={label} style={{ marginBottom:11 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:5 }}>
            <span style={{ fontSize:13, fontWeight:500, color:'var(--ink-2)' }}>{label}</span>
            <span className="scc-num" style={{ fontSize:12, fontWeight:600, color:'var(--muted)' }}>{count} · {total ? Math.round(count/total*100) : 0}%</span>
          </div>
          <div style={{ height:6, background:'var(--line-3)', borderRadius:4, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${total ? count/total*100 : 0}%`, background:'#F5552E', borderRadius:4, transition:'width .3s' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ title,desc,onAdd,btnLabel }: { title:string; desc:string; onAdd:()=>void; btnLabel:string }) {
  return (
    <div className="card" style={{ padding:'56px 40px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
      <div style={{ fontWeight:800, fontSize:20, letterSpacing:'-.02em' }}>{title}</div>
      <div style={{ fontSize:14, fontWeight:500, color:'var(--muted)', maxWidth:340, lineHeight:1.5 }}>{desc}</div>
      <button onClick={onAdd} className="coral-btn" style={{ height:46, padding:'0 22px', fontSize:14, marginTop:4 }}>{btnLabel}</button>
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M5 3.5h2.2l1.1 3-1.5 1.1a7.5 7.5 0 0 0 3.6 3.6l1.1-1.5 3 1.1v2.2a1.2 1.2 0 0 1-1.3 1.2A11 11 0 0 1 3.8 4.8 1.2 1.2 0 0 1 5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}
