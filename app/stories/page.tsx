'use client';
import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import DotMenu from '@/components/DotMenu';
import { getStories, saveStory, deleteStory, uid } from '@/lib/store';
import { Story } from '@/lib/types';
import { SEED_STORIES } from '@/lib/seedData';

const BLANK: Partial<Story> = { date:'', title:'', situation:'', task:'', action:'', result:'', question:'' };

function StoryModal({ initial, onClose }: { initial?: Story; onClose: () => void }) {
  const [f, setF] = useState<Partial<Story>>({ ...BLANK, ...initial });
  const upd = (p: Partial<Story>) => setF(v => ({ ...v, ...p }));

  const save = () => {
    if (!f.title?.trim()) return;
    saveStory({ id: initial?.id || uid(), date: f.date || new Date().toLocaleDateString('en-AU',{day:'numeric',month:'short'}), title:f.title!, situation:f.situation||'', task:f.task||'', action:f.action||'', result:f.result||'', question:f.question||'' });
    onClose();
  };

  const Field = ({ label, field, ph }: { label:string; field:keyof Story; ph?:string }) => (
    <div>
      <label className="form-label">{label}</label>
      <textarea className="form-input" placeholder={ph} value={f[field] as string||''} onChange={e => upd({ [field]:e.target.value } as Partial<Story>)} style={{ minHeight:72, resize:'vertical' }} />
    </div>
  );

  return (
    <Modal title={initial ? 'Edit story' : 'Add story'} onClose={onClose} width={600}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
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
        <Field label="Situation" field="situation" ph="What was happening?" />
        <Field label="Task / your goal" field="task" ph="What were you trying to achieve?" />
        <Field label="Action" field="action" ph="What did you specifically do?" />
        <Field label="Result" field="result" ph="What happened, what did you learn?" />
        <div>
          <label className="form-label">Interview questions it answers</label>
          <input className="form-input" placeholder="Tell me about a difficult prospect · How do you handle rejection?" value={f.question||''} onChange={e => upd({ question:e.target.value })} />
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
          <button onClick={onClose} style={{ padding:'11px 22px', borderRadius:12, border:'1px solid #E4DFD8', background:'#fff', cursor:'pointer', fontFamily:'inherit', fontSize:14, fontWeight:600 }}>Cancel</button>
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

  const load = () => setUserStories(getStories());
  useEffect(() => { load(); }, []);

  const allStories = [...SEED_STORIES, ...userStories];

  return (
    <div>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:18 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:500, color:'#9C958B' }}>Prep · Interview stories</div>
          <div className="page-title">Story Bank</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
            <span className="scc-num" style={{ fontWeight:300, fontSize:52, color:'#F5552E' }}>{allStories.length}</span>
            <span style={{ fontSize:12, fontWeight:600, letterSpacing:'.04em', textTransform:'uppercase', color:'#9C958B' }}>stories</span>
          </div>
          <button onClick={() => setAddOpen(true)} className="coral-btn" style={{ height:50, padding:'0 24px', fontSize:15, boxShadow:'0 8px 22px rgba(245,85,46,.28)' }}>+ Add story</button>
        </div>
      </div>
      <div style={{ fontSize:12, color:'#9C958B', marginBottom:16, lineHeight:1.5, maxWidth:680 }}>
        Build your STAR bank up front. Eight to ten polished stories, each tagged to the questions it answers, puts you ahead of most SDR candidates.
      </div>

      {allStories.length === 0 ? (
        <div className="card" style={{ padding:'56px 40px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
          <div style={{ fontWeight:800, fontSize:20 }}>No stories yet</div>
          <div style={{ fontSize:14, fontWeight:500, color:'#9C958B', maxWidth:340, lineHeight:1.5 }}>Add your first STAR story — situation, task, action, result — and tag the questions it answers.</div>
          <button onClick={() => setAddOpen(true)} className="coral-btn" style={{ height:46, padding:'0 22px', fontSize:14, marginTop:4 }}>+ Add story</button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {allStories.map((st, idx) => {
            const isUser = userStories.some(s => s.id === st.id);
            return (
              <div key={st.id} className="card" style={{ padding:'22px 24px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                  <span style={{ fontSize:10, fontWeight:700, letterSpacing:'.06em', color:'#C24A24', background:'#FBE7E0', padding:'4px 11px', borderRadius:999 }}>{st.date}</span>
                  <span style={{ fontWeight:800, fontSize:18, letterSpacing:'-.01em', flex:1, minWidth:0 }}>{st.title}</span>
                  {isUser && (
                    <DotMenu actions={[
                      { label:'Edit', onClick:() => setEditStory(st) },
                      { label:'Delete', onClick:() => { deleteStory(st.id); load(); }, danger:true },
                    ]} />
                  )}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px 28px' }}>
                  {[
                    { label:'Situation', text: st.situation },
                    { label:'Task', text: st.task },
                    { label:'Action', text: st.action },
                    { label:'Result', text: st.result },
                  ].map(b => (
                    <div key={b.label}>
                      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'#B5AEA4', marginBottom:4 }}>{b.label}</div>
                      <div style={{ fontSize:13, fontWeight:500, color:'#3F3A34', lineHeight:1.5 }}>{b.text}</div>
                    </div>
                  ))}
                </div>
                {st.question && (
                  <div style={{ marginTop:16, paddingTop:14, borderTop:'1px solid #F1EDE7' }}>
                    <span style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'#B5AEA4' }}>Answers</span>
                    <span style={{ fontSize:13, fontWeight:600, color:'#1A1613', marginLeft:8 }}>{st.question}</span>
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
    </div>
  );
}
