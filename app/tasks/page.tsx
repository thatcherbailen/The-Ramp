'use client';
import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/Modal';
import DotMenu from '@/components/DotMenu';
import {
  getTaskDone, setTaskDone, getTaskDeletes, deleteTask, getCustomTasks, saveCustomTask, deleteCustomTask,
  getTaskEdits, saveTaskEdit, uid, getGoals, saveGoal, deleteGoal,
} from '@/lib/store';
import { SEED_TASKS, DEFAULT_GOAL_ID, SEED_PHASE_IDS } from '@/lib/seedData';
import { Task, Priority, Goal, Phase } from '@/lib/types';

const PRI_COLORS: Record<Priority, string> = { 'High': '#C24A24', 'Medium': '#9C958B', 'Low': '#B5AEA4' };
const PHASE_PALETTE = [
  { pill: { bg: 'var(--accent-soft)', color: 'var(--accent-ink)' }, fill: '#F5552E' },
  { pill: { bg: '#E8F5EE', color: '#3F8F5B' }, fill: '#3F8F5B' },
  { pill: { bg: '#EEF3FB', color: '#3D6FBF' }, fill: '#3D6FBF' },
  { pill: { bg: '#F3EEFF', color: '#6B4EE6' }, fill: '#7A5CFF' },
  { pill: { bg: '#FFF3CD', color: '#B68B00' }, fill: '#E0A500' },
];

function fmtD(d?: string) {
  if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

// ───────────────────────── Task modal ─────────────────────────
function TaskModal({ goal, initial, weeks, onClose }: { goal: Goal; initial?: Task; weeks: string[]; onClose: () => void }) {
  const [f, setF] = useState<Partial<Task>>({
    task: '', notes: '', priority: 'High', week: '', due: '',
    phaseId: initial?.phaseId || (initial && SEED_PHASE_IDS[initial.phase]) || goal.phases[0]?.id,
    ...initial,
  });
  const upd = (p: Partial<Task>) => setF(v => ({ ...v, ...p }));
  const weekOpts = [...new Set([...weeks, ...(f.week ? [f.week] : [])].filter(Boolean))];
  const [newWeek, setNewWeek] = useState(false);

  const save = () => {
    if (!f.task?.trim()) return;
    const phaseId = f.phaseId || goal.phases[0]?.id;
    if (initial && !initial.custom) {
      saveTaskEdit(initial.id, { task: f.task, notes: f.notes, priority: f.priority, week: f.week, due: f.due, phaseId });
    } else {
      saveCustomTask({
        id: initial?.id || uid(), phase: initial?.phase || 'Phase 1', week: f.week || 'Added tasks',
        priority: f.priority || 'High', task: f.task!, notes: f.notes || '', isNew: !initial, due: f.due,
        custom: true, goalId: goal.id, phaseId,
      });
    }
    onClose();
  };

  return (
    <Modal title={initial ? 'Edit task' : 'Add task'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div><label className="form-label">Task</label><input className="form-input" placeholder="What needs doing?" value={f.task || ''} onChange={e => upd({ task: e.target.value })} /></div>
        <div><label className="form-label">Notes</label><textarea className="form-input" placeholder="Context, links, reminders…" value={f.notes || ''} onChange={e => upd({ notes: e.target.value })} style={{ minHeight: 64, resize: 'vertical' }} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label className="form-label">Phase</label>
            <select className="form-select" value={f.phaseId || goal.phases[0]?.id} onChange={e => upd({ phaseId: e.target.value })}>
              {goal.phases.map((p, i) => <option key={p.id} value={p.id}>P{i + 1} — {p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Priority</label>
            <select className="form-select" value={f.priority || 'High'} onChange={e => upd({ priority: e.target.value as Priority })}>
              <option>High</option><option>Medium</option><option>Low</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px', gap: 14 }}>
          <div>
            <label className="form-label">Week / group</label>
            {newWeek ? (
              <input className="form-input" autoFocus placeholder="e.g. Week 6 — First Outreach" value={f.week || ''} onChange={e => upd({ week: e.target.value })} />
            ) : (
              <select className="form-select" value={f.week && weekOpts.includes(f.week) ? f.week : ''} onChange={e => {
                if (e.target.value === '__new__') { setNewWeek(true); upd({ week: '' }); }
                else upd({ week: e.target.value });
              }}>
                <option value="">Unassigned</option>
                {weekOpts.map(w => <option key={w} value={w}>{w}</option>)}
                <option value="__new__">＋ New week…</option>
              </select>
            )}
          </div>
          <div><label className="form-label" style={{ color: 'var(--accent-ink)' }}>Due → calendar</label><input className="form-input" type="date" value={f.due || ''} onChange={e => upd({ due: e.target.value })} /></div>
        </div>
        {newWeek && (
          <button type="button" onClick={() => setNewWeek(false)} style={{ alignSelf: 'flex-start', marginTop: -6, padding: 0, border: 'none', background: 'none', color: 'var(--muted-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>← Choose an existing week</button>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
          <button onClick={onClose} style={cancelBtn}>Cancel</button>
          <button onClick={save} className="coral-btn" style={{ height: 44, padding: '0 24px', fontSize: 14, borderRadius: 12 }}>{initial ? 'Save changes' : 'Add task'}</button>
        </div>
      </div>
    </Modal>
  );
}

// ───────────────────────── Goal modal ─────────────────────────
function GoalModal({ initial, onClose, onDelete }: { initial?: Goal; onClose: () => void; onDelete?: () => void }) {
  const [f, setF] = useState<Partial<Goal>>({ name: '', description: '', color: '#F5552E', targetDate: '', ...initial });
  const save = () => {
    if (!f.name?.trim()) return;
    const goal: Goal = {
      id: initial?.id || uid(), name: f.name!, description: f.description || '', color: f.color || '#F5552E', targetDate: f.targetDate || '',
      phases: initial?.phases || [{ id: uid(), name: 'Phase 1', description: '', startDate: '', endDate: '' }],
    };
    saveGoal(goal);
    onClose();
  };
  const isDefault = initial?.id === DEFAULT_GOAL_ID;
  return (
    <Modal title={initial ? 'Edit goal' : 'New goal'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div><label className="form-label">Goal name</label><input className="form-input" placeholder="e.g. Learn cold-calling" value={f.name || ''} onChange={e => setF(v => ({ ...v, name: e.target.value }))} /></div>
        <div><label className="form-label">What it means / why</label><textarea className="form-input" placeholder="What success looks like…" value={f.description || ''} onChange={e => setF(v => ({ ...v, description: e.target.value }))} style={{ minHeight: 60, resize: 'vertical' }} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 56px', gap: 14, alignItems: 'end' }}>
          <div><label className="form-label">Target date</label><input className="form-input" type="date" value={f.targetDate || ''} onChange={e => setF(v => ({ ...v, targetDate: e.target.value }))} /></div>
          <div><label className="form-label">Colour</label><input type="color" value={f.color || '#F5552E'} onChange={e => setF(v => ({ ...v, color: e.target.value }))} style={{ width: '100%', height: 44, border: '1px solid var(--line-2)', borderRadius: 12, background: 'var(--card)', cursor: 'pointer', padding: 4 }} /></div>
        </div>
        {!initial && <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>Your goal starts with one phase — add and edit phases from “Edit phases” once it’s created.</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
          {initial && !isDefault && onDelete && (
            <button onClick={onDelete} style={{ ...cancelBtn, color: '#D8431F', borderColor: '#F0CFC6', marginRight: 'auto' }}>Delete goal</button>
          )}
          <button onClick={onClose} style={cancelBtn}>Cancel</button>
          <button onClick={save} className="coral-btn" style={{ height: 44, padding: '0 24px', fontSize: 14, borderRadius: 12 }}>{initial ? 'Save' : 'Create goal'}</button>
        </div>
      </div>
    </Modal>
  );
}

// ───────────────────────── Phase editor ─────────────────────────
function PhaseEditor({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const [phases, setPhases] = useState<Phase[]>(goal.phases.map(p => ({ ...p })));
  const updP = (id: string, p: Partial<Phase>) => setPhases(arr => arr.map(x => x.id === id ? { ...x, ...p } : x));
  const addP = () => setPhases(arr => [...arr, { id: uid(), name: `Phase ${arr.length + 1}`, description: '', startDate: '', endDate: '' }]);
  const removeP = (id: string) => setPhases(arr => arr.length > 1 ? arr.filter(x => x.id !== id) : arr);
  const save = () => { saveGoal({ ...goal, phases }); onClose(); };
  return (
    <Modal title="Edit phases" onClose={onClose} width={600}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>Define each stage of “{goal.name}” — name it, say what it means, and set its dates. Tasks are grouped under these phases.</div>
        {phases.map((p, i) => (
          <div key={p.id} style={{ border: '1px solid var(--line)', borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ ...PHASE_PALETTE[i % PHASE_PALETTE.length].pill, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>P{i + 1}</span>
              <input className="form-input" placeholder="Phase name" value={p.name} onChange={e => updP(p.id, { name: e.target.value })} style={{ flex: 1 }} />
              <button onClick={() => removeP(p.id)} title="Remove phase" style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #F0CFC6', background: 'var(--card)', color: '#D8431F', cursor: 'pointer', flexShrink: 0 }}>✕</button>
            </div>
            <input className="form-input" placeholder="What this stage means" value={p.description || ''} onChange={e => updP(p.id, { description: e.target.value })} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label className="form-label">Start</label><input className="form-input" type="date" value={p.startDate || ''} onChange={e => updP(p.id, { startDate: e.target.value })} /></div>
              <div><label className="form-label">End</label><input className="form-input" type="date" value={p.endDate || ''} onChange={e => updP(p.id, { endDate: e.target.value })} /></div>
            </div>
          </div>
        ))}
        <button onClick={addP} style={{ padding: '10px 0', borderRadius: 12, border: '1px dashed var(--line-2)', background: 'var(--card)', color: 'var(--muted)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>＋ Add phase</button>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
          <button onClick={onClose} style={cancelBtn}>Cancel</button>
          <button onClick={save} className="coral-btn" style={{ height: 44, padding: '0 24px', fontSize: 14, borderRadius: 12 }}>Save phases</button>
        </div>
      </div>
    </Modal>
  );
}

// ───────────────────────── Page ─────────────────────────
export default function TasksPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalId, setGoalId] = useState<string>('');
  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [priFilter, setPriFilter] = useState<Set<Priority>>(new Set(['High', 'Medium', 'Low']));
  const [showDone, setShowDone] = useState(false);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [, setTick] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [goalModal, setGoalModal] = useState<{ mode: 'new' | 'edit' } | null>(null);
  const [phaseOpen, setPhaseOpen] = useState(false);

  const refresh = useCallback(() => {
    const gs = getGoals();
    setGoals(gs);
    setDone(getTaskDone());
    setGoalId(prev => (prev && gs.some(g => g.id === prev)) ? prev : gs[0].id);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const goal = goals.find(g => g.id === goalId) || goals[0];
  if (!goal) return null;

  const phaseOf = (t: Task): string => {
    const pid = t.phaseId || (t.phase && SEED_PHASE_IDS[t.phase]);
    return goal.phases.some(p => p.id === pid) ? pid! : goal.phases[0]?.id;
  };

  const goalTasks = (): Task[] => {
    const deletes = getTaskDeletes();
    const edits = getTaskEdits();
    let list: Task[];
    if (goal.id === DEFAULT_GOAL_ID) {
      const seed = SEED_TASKS.filter(t => !deletes.has(t.id)).map(t => ({ ...t, ...(edits[t.id] || {}) }));
      const custom = getCustomTasks().filter(t => (t.goalId || DEFAULT_GOAL_ID) === DEFAULT_GOAL_ID);
      list = [...seed, ...custom];
    } else {
      list = getCustomTasks().filter(t => t.goalId === goal.id);
    }
    return list.map(t => ({ ...t, done: done[t.id] }));
  };

  const all = goalTasks();
  const total = all.length;
  const doneCount = all.filter(t => done[t.id]).length;

  const passFilter = (t: Task) => {
    if (!priFilter.has(t.priority)) return false;
    if (!showDone && done[t.id]) return false;
    if (search && !t.task.toLowerCase().includes(search.toLowerCase()) && !t.notes?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  };

  // sections by phase (respecting phase filter)
  const sections = goal.phases
    .filter(p => phaseFilter === 'all' || phaseFilter === p.id)
    .map((phase, idx) => {
      const phaseTasks = all.filter(t => phaseOf(t) === phase.id);
      const visible = phaseTasks.filter(passFilter);
      const weeks = [...new Set(visible.map(t => t.week || 'Tasks'))];
      const palette = PHASE_PALETTE[goal.phases.indexOf(phase) % PHASE_PALETTE.length];
      return {
        phase, idx: goal.phases.indexOf(phase), palette,
        total: phaseTasks.length, done: phaseTasks.filter(t => done[t.id]).length,
        weeks: weeks.map(w => ({ label: w, tasks: visible.filter(t => (t.week || 'Tasks') === w) })),
        hasVisible: visible.length > 0,
      };
    });

  const toggle = (id: string) => { const next = !done[id]; setTaskDone(id, next); setDone(v => ({ ...v, [id]: next })); };

  const statBoxes = [
    { label: 'Total', value: total, ink: 'var(--ink)', bg: 'var(--card)' },
    { label: 'Done', value: doneCount, ink: '#3F8F5B', bg: '#E8F5EE' },
    { label: 'Left', value: total - doneCount, ink: 'var(--accent-ink)', bg: 'var(--accent-soft)' },
    { label: '%', value: `${total ? Math.round(doneCount / total * 100) : 0}%`, ink: 'var(--card)', bg: '#F5552E' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-head" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}>Main · SDR roadmap</div>
          <div className="page-title">Task Tracker</div>
        </div>
        <div className="page-head-actions" style={{ display: 'flex', gap: 10 }}>
          {statBoxes.map(s => (
            <div key={s.label} style={{ background: s.bg, border: '1px solid var(--line)', borderRadius: 14, padding: '12px 18px', minWidth: 80 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: s.bg === '#F5552E' ? 'rgba(255,255,255,.7)' : 'var(--muted)' }}>{s.label}</div>
              <div className="scc-num" style={{ fontWeight: 800, fontSize: 26, marginTop: 3, color: s.ink }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Goal switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <div className="scroll-x" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {goals.map(g => {
            const active = g.id === goal.id;
            return (
              <button key={g.id} onClick={() => { setGoalId(g.id); setPhaseFilter('all'); }} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 15px', borderRadius: 999, border: '1px solid',
                borderColor: active ? 'var(--fill-dark)' : 'var(--line)', background: active ? 'var(--fill-dark)' : 'var(--card)', color: active ? '#fff' : 'var(--ink-2b)',
                cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: g.color || '#F5552E', flexShrink: 0 }} />
                {g.name}
              </button>
            );
          })}
          <button onClick={() => setGoalModal({ mode: 'new' })} style={{ padding: '8px 14px', borderRadius: 999, border: '1px dashed var(--line-2)', background: 'var(--card)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>＋ New goal</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
          {goal.targetDate && <span>Target {fmtD(goal.targetDate)}</span>}
          <button onClick={() => setGoalModal({ mode: 'edit' })} title="Edit goal" style={{ display: 'flex', alignItems: 'center', gap: 5, border: '1px solid var(--line-2)', background: 'var(--card)', color: 'var(--ink-2b)', cursor: 'pointer', borderRadius: 10, padding: '7px 12px', fontFamily: 'inherit', fontSize: 12, fontWeight: 700 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M4 20h4l10-10-4-4L4 16v4z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>
            Edit goal
          </button>
        </div>
      </div>

      {/* Phase progress + edit */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(goal.phases.length, 3)},1fr)`, gap: 12, flex: 1, minWidth: 240 }}>
          {goal.phases.map((p, i) => {
            const tot = all.filter(t => phaseOf(t) === p.id).length;
            const d = all.filter(t => phaseOf(t) === p.id && done[t.id]).length;
            const pct = tot ? Math.round(d / tot * 100) : 0;
            const fill = PHASE_PALETTE[i % PHASE_PALETTE.length].fill;
            return (
              <div key={p.id} className="card" style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 9 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: '-.01em' }}>P{i + 1} · {p.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)' }}>{d}/{tot} · {pct}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--line-3)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: fill, borderRadius: 4, transition: 'width .4s' }} />
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={() => setPhaseOpen(true)} style={{ alignSelf: 'center', padding: '10px 16px', borderRadius: 12, border: '1px solid var(--line-2)', background: 'var(--card)', color: 'var(--ink-2b)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>Edit phases</button>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        <div className="scroll-x" style={{ display: 'flex', gap: 3, background: 'var(--card-3)', borderRadius: 12, padding: 3 }}>
          {['all', ...goal.phases.map(p => p.id)].map((pid, i) => {
            const active = phaseFilter === pid;
            const label = pid === 'all' ? 'All' : `P${i}`;
            return (
              <button key={pid} onClick={() => setPhaseFilter(pid)} title={pid === 'all' ? 'All phases' : goal.phases[i - 1]?.name} style={{
                padding: '7px 14px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
                background: active ? '#F5552E' : 'none', color: active ? '#fff' : 'var(--muted)', whiteSpace: 'nowrap',
              }}>{label}</button>
            );
          })}
        </div>
        <div style={{ position: 'relative', flex: 1, minWidth: 180, maxWidth: 300 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-2)' }}>
            <svg width="14" height="14" viewBox="0 0 15 15" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/><path d="M10 10L13.5 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </span>
          <input className="form-input" placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {(['High', 'Medium', 'Low'] as Priority[]).map(p => (
            <button key={p} onClick={() => setPriFilter(prev => { const s = new Set(prev); s.has(p) ? s.delete(p) : s.add(p); return s; })}
              style={{ padding: '7px 12px', borderRadius: 10, border: '1px solid', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
                borderColor: priFilter.has(p) ? PRI_COLORS[p] : 'var(--line-2)', background: priFilter.has(p) ? PRI_COLORS[p] + '22' : 'var(--card)', color: priFilter.has(p) ? PRI_COLORS[p] : 'var(--muted)' }}>{p === 'Medium' ? 'Med' : p}</button>
          ))}
        </div>
        <button onClick={() => setShowDone(v => !v)} style={{ padding: '7px 14px', borderRadius: 10, border: '1px solid', borderColor: showDone ? 'var(--fill-dark)' : 'var(--line-2)', background: showDone ? 'var(--fill-dark)' : 'var(--card)', color: showDone ? '#fff' : 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600 }}>✓ Completed</button>
        <button onClick={() => setAddOpen(true)} className="coral-btn" style={{ height: 36, padding: '0 16px', fontSize: 13, borderRadius: 11 }}>+ Add task</button>
      </div>

      {/* Sections */}
      {all.length === 0 ? (
        <div className="card" style={{ padding: '48px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 19 }}>No tasks for “{goal.name}” yet</div>
          <div style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 360, lineHeight: 1.5 }}>Add tasks and assign them to a phase. Set due dates and they land on your calendar.</div>
          <button onClick={() => setAddOpen(true)} className="coral-btn" style={{ height: 44, padding: '0 20px', fontSize: 14, marginTop: 4 }}>+ Add task</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
          {sections.filter(s => s.hasVisible).map(sec => (
            <div key={sec.phase.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 11, borderBottom: '1px solid var(--line)', marginBottom: 14 }}>
                <span style={{ ...sec.palette.pill, padding: '4px 11px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>P{sec.idx + 1}</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-.01em' }}>{sec.phase.name}</div>
                  {(sec.phase.description || sec.phase.startDate) && (
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)', marginTop: 1 }}>
                      {[sec.phase.startDate && `${fmtD(sec.phase.startDate)}${sec.phase.endDate ? ' – ' + fmtD(sec.phase.endDate) : ''}`, sec.phase.description].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: 'var(--muted-2)' }}>{sec.done}/{sec.total} done</div>
              </div>
              {sec.weeks.map(wk => (
                <div key={wk.label} style={{ marginBottom: 16 }}>
                  {wk.label && wk.label !== 'Tasks' && <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 9 }}>{wk.label}</div>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {wk.tasks.map(t => (
                      <div key={t.id} onClick={() => { toggle(t.id); setTick(x => x + 1); }} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 14, background: 'var(--card)', border: '1px solid', borderColor: t.isNew ? '#F5552E' : 'var(--line)',
                        borderRadius: 14, padding: '14px 16px', cursor: 'pointer', opacity: done[t.id] ? 0.5 : 1, transition: 'opacity .2s', borderLeft: t.isNew ? '3px solid #F5552E' : undefined,
                      }}>
                        <span style={{ width: 20, height: 20, borderRadius: 6, border: '2px solid', borderColor: done[t.id] ? '#F5552E' : 'var(--line-2)', background: done[t.id] ? '#F5552E' : 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                          {done[t.id] && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-.01em', textDecoration: done[t.id] ? 'line-through' : 'none', color: done[t.id] ? 'var(--muted)' : 'var(--ink)' }}>{t.task}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: t.priority === 'High' ? 'var(--accent-soft)' : t.priority === 'Medium' ? 'var(--card-2)' : 'var(--card-3)', color: PRI_COLORS[t.priority] }}>{t.priority}</span>
                            {t.isNew && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'var(--accent-soft)', color: '#F5552E' }}>★ New</span>}
                          </div>
                          {t.notes && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>{t.notes}</div>}
                        </div>
                        <div onClick={e => e.stopPropagation()}>
                          <DotMenu actions={[
                            { label: 'Edit', onClick: () => setEditTask(t) },
                            { label: 'Delete', onClick: () => { if (t.custom) deleteCustomTask(t.id); else deleteTask(t.id); setTick(x => x + 1); refresh(); }, danger: true },
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

      {(addOpen || editTask) && <TaskModal goal={goal} initial={editTask || undefined} weeks={[...new Set(all.map(t => t.week).filter(Boolean))]} onClose={() => { setAddOpen(false); setEditTask(null); refresh(); setTick(x => x + 1); }} />}
      {goalModal && <GoalModal initial={goalModal.mode === 'edit' ? goal : undefined} onClose={() => { setGoalModal(null); refresh(); }} onDelete={() => { deleteGoal(goal.id); setGoalId(''); setGoalModal(null); refresh(); }} />}
      {phaseOpen && <PhaseEditor goal={goal} onClose={() => { setPhaseOpen(false); refresh(); }} />}
    </div>
  );
}

const cancelBtn: React.CSSProperties = { padding: '11px 22px', borderRadius: 12, border: '1px solid var(--line-2)', background: 'var(--card)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 };
