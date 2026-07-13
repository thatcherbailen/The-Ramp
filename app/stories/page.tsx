'use client';
import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import DotMenu from '@/components/DotMenu';
import { getStories, saveStory, deleteStory, uid, mergeSeed, hideSeedItem } from '@/lib/store';
import { Story } from '@/lib/types';
import { SEED_STORIES } from '@/lib/seedData';
import StoryDrillSession from '@/components/StoryDrillSession';
import StreakBadge from '@/components/StreakBadge';

const BLANK: Partial<Story> = { date:'', title:'', situation:'', task:'', action:'', result:'', question:'' };

function StoryModal({ initial, onClose }: { initial?: Story; onClose: () => void }) {
  const [f, setF] = useState<Partial<Story>>({ ...BLANK, ...initial });
  const upd = (p: Partial<Story>) => setF(v => ({ ...v, ...p }));
  const [notes, setNotes] = useState('');
  const [structuring, setStructuring] = useState(false);
  const [structureError, setStructureError] = useState('');

  const save = () => {
    if (!f.title?.trim()) return;
    saveStory({ id: initial?.id || uid(), date: f.date || new Date().toLocaleDateString('en-AU',{day:'numeric',month:'short'}), title:f.title!, situation:f.situation||'', task:f.task||'', action:f.action||'', result:f.result||'', question:f.question||'' });
    onClose();
  };

  const structureWithAI = async () => {
    if (!notes.trim() || structuring) return;
    setStructuring(true);
    setStructureError('');
    try {
      const res = await fetch('/api/story-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      upd({ title: data.title, situation: data.situation, task: data.task, action: data.action, result: data.result, question: data.question });
    } catch (err) {
      setStructureError(err instanceof Error ? err.message : 'Something went wrong structuring that — fill in the fields yourself below.');
    } finally {
      setStructuring(false);
    }
  };

  // Plain function called as {field(...)}, not a <Field/> component — a
  // component defined in render remounts each keystroke and drops focus.
  const field = (label: string, key: keyof Story, ph?: string) => (
    <div>
      <label className="form-label">{label}</label>
      <textarea className="form-input" placeholder={ph} value={f[key] as string||''} onChange={e => upd({ [key]:e.target.value } as Partial<Story>)} style={{ minHeight:72, resize:'vertical' }} />
    </div>
  );

  return (
    <Modal title={initial ? 'Edit story' : 'Add story'} onClose={onClose} width={600}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ background:'var(--card-2)', border:'1px solid var(--line)', borderRadius:14, padding:16 }}>
          <div style={{ fontWeight:700, fontSize:13, marginBottom:8 }}>✨ Paste rough notes, let AI structure it</div>
          <textarea
            className="form-input"
            placeholder="Just write what happened, in any order — AI will turn it into a clean STAR story below."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            style={{ minHeight:64, resize:'vertical', marginBottom:10 }}
          />
          {structureError && <div style={{ fontSize:12.5, color:'#D8431F', marginBottom:10 }}>{structureError}</div>}
          <button type="button" onClick={structureWithAI} disabled={!notes.trim() || structuring} className="coral-btn" style={{ height:40, padding:'0 18px', fontSize:13, borderRadius:11, opacity: !notes.trim() || structuring ? 0.6 : 1 }}>
            {structuring ? 'Structuring…' : 'Structure with AI'}
          </button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 120px', gap:14 }}>
          <div>
            <label className="form-label">Story title</label>
            <input className="form-input" placeholder="Handling a hostile prospect..." value={f.title||''} onChange={e => upd({ title:e.target.value })} />
          </div>
          <div>
            <label className="form-label">Date</label>
            <input className="form-input" placeholder="17 Jun" value={f.date||''} onChange={e => upd({ date:e.target.value })} />
          </div>
        </div>
        {field('Situation', 'situation', 'What was happening?')}
        {field('Task / your goal', 'task', 'What were you trying to achieve?')}
        {field('Action', 'action', 'What did you specifically do?')}
        {field('Result', 'result', 'What happened, what did you learn?')}
        <div>
          <label className="form-label">Interview questions it answers</label>
          <input className="form-input" placeholder="Tell me about a difficult prospect · How do you handle rejection?" value={f.question||''} onChange={e => upd({ question:e.target.value })} />
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
          <button onClick={onClose} style={{ padding:'11px 22px', borderRadius:12, border:'1px solid var(--line-2)', background:'var(--card)', cursor:'pointer', fontFamily:'inherit', fontSize:14, fontWeight:600 }}>Cancel</button>
          <button onClick={save} className="coral-btn" style={{ height:44, padding:'0 24px', fontSize:14, borderRadius:12 }}>{initial ? 'Save changes' : 'Add story'}</button>
        </div>
      </div>
    </Modal>
  );
}

export default function StoriesPage() {
  const [userStories, setUserStories] = useState<Story[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editStory, setEditStory] = useState<Story|null>(null);
  const [drillOpen, setDrillOpen] = useState(false);

  const load = () => setUserStories(getStories());
  useEffect(() => { load(); }, []);

  const allStories = mergeSeed('stories', SEED_STORIES, userStories);

  return (
    <div>
      <div className="page-head" style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:18 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:500, color:'var(--muted)' }}>Prep · Interview stories</div>
          <div className="page-title">Story Bank</div>
        </div>
        <div className="page-head-actions" style={{ display:'flex', alignItems:'center', gap:16 }}>
          <StreakBadge compact />
          <div className="page-head-meta" style={{ display:'flex', alignItems:'baseline', gap:8 }}>
            <span className="scc-num" style={{ fontWeight:300, fontSize:52, color:'#F5552E' }}>{allStories.length}</span>
            <span style={{ fontSize:12, fontWeight:600, letterSpacing:'.04em', textTransform:'uppercase', color:'var(--muted)' }}>stories</span>
          </div>
          <button onClick={() => setAddOpen(true)} className="coral-btn" style={{ height:50, padding:'0 24px', fontSize:15, boxShadow:'0 8px 22px rgba(245,85,46,.28)' }}>+ Add story</button>
        </div>
      </div>
      <div style={{ fontSize:12, color:'var(--muted)', marginBottom:16, lineHeight:1.5, maxWidth:680 }}>
        Build your STAR bank up front. Eight to ten polished stories, each tagged to the questions it answers, puts you ahead of most candidates. Tap a card to edit.
      </div>

      {allStories.length > 0 && (
        <div style={{ background:'var(--fill-dark)', borderRadius:18, padding:'20px 24px', color:'#fff', marginBottom:18, display:'flex', alignItems:'center', justifyContent:'space-between', gap:20, flexWrap:'wrap' }}>
          <div style={{ maxWidth:560 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(255,255,255,.4)', marginBottom:8 }}>Recall Drill</div>
            <div style={{ fontSize:14, color:'rgba(255,255,255,.78)', lineHeight:1.6 }}>
              Writing a story down isn&apos;t the same as being able to tell it fluently under pressure. Get a random question, recall your answer, then check yourself.
            </div>
          </div>
          <button onClick={() => setDrillOpen(true)} className="coral-btn" style={{ height:48, padding:'0 26px', fontSize:14.5, borderRadius:12, flexShrink:0, boxShadow:'0 8px 22px rgba(245,85,46,.35)' }}>▶ Start drill</button>
        </div>
      )}

      {allStories.length === 0 ? (
        <div className="card" style={{ padding:'56px 40px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
          <div style={{ fontWeight:800, fontSize:20 }}>No stories yet</div>
          <div style={{ fontSize:14, fontWeight:500, color:'var(--muted)', maxWidth:340, lineHeight:1.5 }}>Add your first STAR story — situation, task, action, result — and tag the questions it answers.</div>
          <button onClick={() => setAddOpen(true)} className="coral-btn" style={{ height:46, padding:'0 22px', fontSize:14, marginTop:4 }}>+ Add story</button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {allStories.map((st, idx) => {
            const isUser = userStories.some(s => s.id === st.id);
            return (
              <div key={st.id} className="card" onClick={() => setEditStory(st)} style={{ padding:'22px 24px', cursor:'pointer' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                  <span style={{ fontSize:10, fontWeight:700, letterSpacing:'.06em', color:'var(--accent-ink)', background:'var(--accent-soft)', padding:'4px 11px', borderRadius:999 }}>{st.date}</span>
                  <span style={{ fontWeight:800, fontSize:18, letterSpacing:'-.01em', flex:1, minWidth:0 }}>{st.title}</span>
                  <div onClick={e => e.stopPropagation()}>
                    <DotMenu actions={[
                      { label:'Edit', onClick:() => setEditStory(st) },
                      { label:'Delete', onClick:() => { isUser ? deleteStory(st.id) : hideSeedItem('stories', st.id); load(); }, danger:true },
                    ]} />
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px 28px' }}>
                  {[
                    { label:'Situation', text: st.situation },
                    { label:'Task / goal', text: st.task },
                    { label:'Action I took', text: st.action },
                    { label:'Result', text: st.result },
                  ].map(b => (
                    <div key={b.label}>
                      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--muted-2)', marginBottom:4 }}>{b.label}</div>
                      <div style={{ fontSize:13, fontWeight:500, color:'var(--ink-2)', lineHeight:1.5 }}>{b.text}</div>
                    </div>
                  ))}
                </div>
                {st.question && (
                  <div style={{ marginTop:16, paddingTop:14, borderTop:'1px solid var(--line-3)' }}>
                    <span style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--muted-2)' }}>Answers</span>
                    <span style={{ fontSize:13, fontWeight:600, color:'var(--ink)', marginLeft:8 }}>{st.question}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {(addOpen || editStory) && (
        <StoryModal initial={editStory || undefined} onClose={() => { setAddOpen(false); setEditStory(null); load(); }} />
      )}

      {drillOpen && (
        <StoryDrillSession pool={allStories} onClose={() => setDrillOpen(false)} />
      )}
    </div>
  );
}
