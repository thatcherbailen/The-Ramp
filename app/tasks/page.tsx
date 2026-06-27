'use client';
import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/Modal';
import DotMenu from '@/components/DotMenu';
import { getTaskDone, setTaskDone, getTaskDeletes, deleteTask, getCustomTasks, saveCustomTask, deleteCustomTask, getTaskEdits, saveTaskEdit, uid } from '@/lib/store';
import { SEED_TASKS } from '@/lib/seedData';
import { Task, Priority, TaskPhase } from '@/lib/types';

type PhaseFilter = 'All' | 'Phase 1' | 'Phase 2' | 'Phase 3';

const PHASE_COLORS: Record<string, {bg:string,color:string}> = {
  'Phase 1': { bg:'#FBE7E0', color:'#C24A24' },
  'Phase 2': { bg:'#E8F5EE', color:'#3F8F5B' },
  'Phase 3': { bg:'#EEF3FB', color:'#3D6FBF' },
};
const PRI_COLORS: Record<Priority, string> = {
  'High': '#C24A24', 'Medium': '#9C958B', 'Low': '#B5AEA4',
};

const BLANK_TASK: Partial<Task> = { task:'', notes:'', phase:'Phase 1', priority:'High', week:'', due:'' };

function TaskModal({ initial, onClose }: { initial?: Task; onClose: () => void }) {
  const [f, setF] = useState<Partial<Task>>({ ...BLANK_TASK, ...initial });
  const upd = (p: Partial<Task>) => setF(v => ({ ...v, ...p }));

  const save = () => {
    if (!f.task?.trim()) return;
    const t: Task = {
      id: initial?.id || uid(),
      phase: f.phase || 'Phase 1',
      week: f.week || 'Added tasks',
      priority: f.priority || 'High',
      task: f.task!,
      notes: f.notes || '',
      isNew: !initial,
      due: f.due,
      custom: true,
    };
    if (initial?.custom) {
      saveCustomTask(t);
    } else if (initial) {
      saveTaskEdit(initial.id, { task: t.task, notes: t.notes, phase: t.phase, priority: t.priority, week: t.week, due: t.due });
    } else {
      saveCustomTask(t);
    }
    onClose();
  };

  return (
    <Modal title={initial ? 'Edit task' : 'Add task'} onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div>
          <label className="form-label">Task</label>
          <input className="form-input" placeholder="What needs doing?" value={f.task||''} onChange={e => upd({ task:e.target.value })} />
        </div>
        <div>
          <label className="form-label">Notes</label>
          <textarea className="form-input" placeholder="Context, links, reminders…" value={f.notes||''} onChange={e => upd({ notes:e.target.value })} style={{ minHeight:72, resize:'vertical' }} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div>
            <label className="form-label">Phase</label>
            <select className="form-select" value={f.phase||'Phase 1'} onChange={e => upd({ phase:e.target.value as TaskPhase })}>
              <option value="Phase 1">Phase 1 — Foundations</option>
              <option value="Phase 2">Phase 2 — Networking</option>
              <option value="Phase 3">Phase 3 — Volume &amp; Move</option>
            </select>
          </div>
          <div>
            <label className="form-label">Priority</label>
            <select className="form-select" value={f.priority||'High'} onChange={e => upd({ priority:e.target.value as Priority })}>
              <option>High</option><option>Medium</option><option>Low</option>
            </select>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 150px', gap:14 }}>
          <div>
            <label className="form-label">Week / group</label>
            <input className="form-input" placeholder="e.g. Week 6 — First Outreach Wave" value={f.week||''} onChange={e => upd({ week:e.target.value })} />
          </div>
          <div>
            <label className="form-label" style={{ color:'#C24A24' }}>Due → calendar</label>
            <input className="form-input" type="date" value={f.due||''} onChange={e => upd({ due:e.target.value })} />
          </div>
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
          <button onClick={onClose} style={{ padding:'11px 22px', borderRadius:12, border:'1px solid #E4DFD8', background:'#fff', cursor:'pointer', fontFamily:'inherit', fontSize:14, fontWeight:600 }}>Cancel</button>
          <button onClick={save} className="coral-btn" style={{ height:44, padding:'0 24px', fontSize:14, borderRadius:12 }}>
            {initial ? 'Save changes' : 'Add task'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function TasksPage() {
  const [phase, setPhase] = useState<PhaseFilter>('All');
  const [search, setSearch] = useState('');
  const [priFilter, setPriFilter] = useState<Set<Priority>>(new Set(['High','Medium','Low']));
  const [showDone, setShowDone] = useState(false);
  const [done, setDone] = useState<Record<string,boolean>>({});
  const [, setTick] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task|null>(null);

  const loadDone = useCallback(() => { setDone(getTaskDone()); }, []);
  useEffect(() => { loadDone(); }, [loadDone]);

  const allTasks = useCallback((): Task[] => {
    const deletes = getTaskDeletes();
    const edits = getTaskEdits();
    const seed = SEED_TASKS.filter(t => !deletes.has(t.id)).map(t => ({ ...t, ...(edits[t.id] || {}), done: done[t.id] }));
    const custom = getCustomTasks().map(t => ({ ...t, done: done[t.id] }));
    return [...seed, ...custom];
  }, [done]);

  const filtered = useCallback(() => {
    return allTasks().filter(t => {
      if (phase !== 'All' && t.phase !== phase) return false;
      if (!priFilter.has(t.priority)) return false;
      if (!showDone && done[t.id]) return false;
      if (search && !t.task.toLowerCase().includes(search.toLowerCase()) && !t.notes?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [allTasks, phase, priFilter, showDone, done, search]);

  const tasks = filtered();
  const all = allTasks();
  const total = all.length;
  const doneCount = all.filter(t => done[t.id]).length;

  // Group by phase then week
  const phases = ['Phase 1','Phase 2','Phase 3'];
  const sections = phases.map(ph => {
    const pTasks = tasks.filter(t => t.phase === ph);
    if (!pTasks.length) return null;
    const weeks = [...new Set(pTasks.map(t => t.week))];
    const total = all.filter(t => t.phase === ph).length;
    const phDone = all.filter(t => t.phase === ph && done[t.id]).length;
    return { phase: ph, weeks: weeks.map(w => ({ label:w, tasks: pTasks.filter(t => t.week === w) })), total, done: phDone };
  }).filter(Boolean) as { phase:string; weeks:{label:string; tasks:Task[]}[]; total:number; done:number }[];

  const toggle = (id: string) => {
    const next = !done[id];
    setTaskDone(id, next);
    setDone(v => ({ ...v, [id]: next }));
  };

  const phaseProgress = ['Phase 1','Phase 2','Phase 3'].map(ph => {
    const tot = all.filter(t => t.phase === ph).length;
    const d = all.filter(t => t.phase === ph && done[t.id]).length;
    const pct = tot ? Math.round(d/tot*100) : 0;
    const pc = PHASE_COLORS[ph];
    return { ph, tot, d, pct, pc };
  });

  return (
    <div>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:18 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:500, color:'#9C958B' }}>Main · SDR roadmap</div>
          <div className="page-title">Task Tracker</div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          {[
            { label:'Total', value:total, ink:'#1A1613', bg:'#fff' },
            { label:'Done', value:doneCount, ink:'#3F8F5B', bg:'#E8F5EE' },
            { label:'Left', value:total-doneCount, ink:'#C24A24', bg:'#FBE7E0' },
            { label:'%', value:`${total ? Math.round(doneCount/total*100) : 0}%`, ink:'#fff', bg:'#F5552E' },
          ].map(s => (
            <div key={s.label} style={{ background:s.bg, border:'1px solid #ECE8E2', borderRadius:14, padding:'12px 18px', minWidth:80 }}>
              <div style={{ fontSize:9, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:s.bg==='#F5552E'?'rgba(255,255,255,.7)':'#9C958B' }}>{s.label}</div>
              <div className="scc-num" style={{ fontWeight:800, fontSize:26, marginTop:3, color:s.ink }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Phase progress bars */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:22 }}>
        {phaseProgress.map(p => (
          <div key={p.ph} className="card" style={{ padding:'14px 16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:9 }}>
              <span style={{ fontWeight:700, fontSize:13, letterSpacing:'-.01em' }}>{p.ph}</span>
              <span style={{ fontSize:11, fontWeight:600, color:'#9C958B' }}>{p.d}/{p.tot} · {p.pct}%</span>
            </div>
            <div style={{ height:6, background:'#F1EDE7', borderRadius:4, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${p.pct}%`, background: p.ph==='Phase 1'?'#F5552E':p.ph==='Phase 2'?'#3F8F5B':'#3D6FBF', borderRadius:4, transition:'width .4s' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:18 }}>
        <div style={{ display:'flex', gap:3, background:'#F4F1EC', borderRadius:12, padding:3 }}>
          {(['All','Phase 1','Phase 2','Phase 3'] as PhaseFilter[]).map(p => (
            <button key={p} onClick={() => setPhase(p)} style={{
              padding:'7px 14px', borderRadius:9, border:'none', cursor:'pointer',
              fontFamily:'inherit', fontSize:12, fontWeight:600,
              background: phase===p ? '#1A1613' : 'none', color: phase===p ? '#fff' : '#9C958B',
              transition:'background .15s, color .15s',
            }}>{p}</button>
          ))}
        </div>
        <div style={{ position:'relative', flex:1, minWidth:200, maxWidth:300 }}>
          <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#B5AEA4' }}>
            <svg width="14" height="14" viewBox="0 0 15 15" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/><path d="M10 10L13.5 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </span>
          <input className="form-input" placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft:36 }} />
        </div>
        <div style={{ display:'flex', gap:5 }}>
          {(['High','Medium','Low'] as Priority[]).map(p => (
            <button key={p} onClick={() => setPriFilter(prev => { const s = new Set(prev); s.has(p) ? s.delete(p) : s.add(p); return s; })}
              style={{ padding:'7px 12px', borderRadius:10, border:'1px solid', cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:700, transition:'all .15s',
                borderColor: priFilter.has(p) ? PRI_COLORS[p] : '#E4DFD8',
                background: priFilter.has(p) ? PRI_COLORS[p]+'22' : '#fff',
                color: priFilter.has(p) ? PRI_COLORS[p] : '#9C958B',
              }}>{p}</button>
          ))}
        </div>
        <button onClick={() => setShowDone(v => !v)} style={{ padding:'7px 14px', borderRadius:10, border:'1px solid #E4DFD8', background: showDone?'#1A1613':'#fff', color: showDone?'#fff':'#9C958B', cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:600 }}>
          {showDone ? 'Hide done' : 'Show done'}
        </button>
        <button onClick={() => setAddOpen(true)} className="coral-btn" style={{ height:36, padding:'0 16px', fontSize:13, borderRadius:11 }}>+ Add task</button>
      </div>

      {/* Task list */}
      {tasks.length === 0 ? (
        <div className="card" style={{ padding:'48px 40px', textAlign:'center', color:'#9C958B' }}>
          <div style={{ fontWeight:700, fontSize:17, color:'#1A1613', marginBottom:6 }}>No tasks match</div>
          <div style={{ fontSize:14 }}>Clear a filter or search term to see more.</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:26 }}>
          {sections.map(sec => (
            <div key={sec.phase}>
              <div style={{ display:'flex', alignItems:'center', gap:12, paddingBottom:11, borderBottom:'1px solid #ECE8E2', marginBottom:14 }}>
                <span style={{ ...PHASE_COLORS[sec.phase] as React.CSSProperties, padding:'4px 12px', borderRadius:999, fontSize:11, fontWeight:700 }}>{sec.phase}</span>
                <div>
                  <div style={{ fontWeight:800, fontSize:16, letterSpacing:'-.01em' }}>{sec.phase === 'Phase 1' ? 'Foundations' : sec.phase === 'Phase 2' ? 'Networking & Applications' : 'Volume & Move'}</div>
                </div>
                <div style={{ marginLeft:'auto', fontSize:12, fontWeight:600, color:'#B5AEA4' }}>{sec.done}/{sec.total}</div>
              </div>
              {sec.weeks.map(wk => (
                <div key={wk.label} style={{ marginBottom:16 }}>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'#B5AEA4', marginBottom:9 }}>{wk.label}</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                    {wk.tasks.map(t => (
                      <div key={t.id} onClick={() => { toggle(t.id); setTick(x=>x+1); }} style={{
                        display:'flex', alignItems:'flex-start', gap:14, background:'#fff', border:'1px solid', borderColor: t.isNew ? '#F5552E' : '#ECE8E2',
                        borderRadius:14, padding:'14px 16px', cursor:'pointer', opacity: done[t.id] ? 0.5 : 1,
                        transition:'opacity .2s', borderLeft: t.isNew ? '3px solid #F5552E' : undefined,
                      }}>
                        <span style={{ width:20, height:20, borderRadius:6, border:'2px solid', borderColor: done[t.id] ? '#F5552E' : '#D6D0C8', background: done[t.id] ? '#F5552E' : '#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1, transition:'all .2s' }}>
                          {done[t.id] && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'flex-start', gap:8, flexWrap:'wrap' }}>
                            <span style={{ fontWeight:600, fontSize:14, letterSpacing:'-.01em', textDecoration: done[t.id] ? 'line-through' : 'none', color: done[t.id] ? '#9C958B' : '#1A1613' }}>{t.task}</span>
                            <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:999, background: t.priority==='High'?'#FBE7E0':t.priority==='Medium'?'#FBF9F6':'#F4F1EC', color: PRI_COLORS[t.priority] }}>{t.priority}</span>
                            {t.isNew && <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:999, background:'#FBE7E0', color:'#F5552E' }}>★ New</span>}
                          </div>
                          {t.notes && <div style={{ fontSize:12, color:'#9C958B', marginTop:4, lineHeight:1.5 }}>{t.notes}</div>}
                        </div>
                        <div onClick={e => e.stopPropagation()}>
                          <DotMenu actions={[
                            { label:'Edit', onClick:() => setEditTask(t) },
                            { label:'Delete', onClick:() => {
                              if (t.custom) deleteCustomTask(t.id);
                              else deleteTask(t.id);
                              setTick(x=>x+1);
                            }, danger:true },
                          ]} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {(addOpen || editTask) && (
        <TaskModal initial={editTask || undefined} onClose={() => { setAddOpen(false); setEditTask(null); loadDone(); setTick(x=>x+1); }} />
      )}
    </div>
  );
}
