'use client';
import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import DotMenu from '@/components/DotMenu';
import { getReading, saveReading, deleteReading, uid, getSettings } from '@/lib/store';
import { Reading } from '@/lib/types';

const STATUS_ORDER: Reading['status'][] = ['Want to read','Reading','Done'];
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  'Want to read': { bg:'#F4F1EC', color:'#6B655E' },
  'Reading':       { bg:'#FBE7E0', color:'#C24A24' },
  'Done':          { bg:'#E8F5EE', color:'#3F8F5B' },
};

const CATS = ['Book','Article','Podcast','Video','Course','Other'];

function ReadingModal({ initial, onClose }: { initial?: Reading; onClose: () => void }) {
  const [f, setF] = useState<Partial<Reading>>({ title:'', author:'', category:'Book', status:'Want to read', url:'', notes:'', ...initial });
  const save = () => {
    if (!f.title?.trim()) return;
    saveReading({ id: initial?.id || uid(), title:f.title!, author:f.author||'', category:f.category||'Book', status:f.status||'Want to read', url:f.url||'', notes:f.notes||'' });
    onClose();
  };
  return (
    <Modal title={initial ? 'Edit item' : 'Add to reading list'} onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div>
          <label className="form-label">Title</label>
          <input className="form-input" placeholder="The Sales Acceleration Formula" value={f.title||''} onChange={e => setF(v => ({ ...v, title:e.target.value }))} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div>
            <label className="form-label">Author / source</label>
            <input className="form-input" placeholder="Mark Roberge" value={f.author||''} onChange={e => setF(v => ({ ...v, author:e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Type</label>
            <select className="form-select" value={f.category||'Book'} onChange={e => setF(v => ({ ...v, category:e.target.value }))}>
              {CATS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="form-label">Status</label>
          <select className="form-select" value={f.status||'Want to read'} onChange={e => setF(v => ({ ...v, status:e.target.value as Reading['status'] }))}>
            {STATUS_ORDER.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">URL (optional)</label>
          <input className="form-input" placeholder="https://..." value={f.url||''} onChange={e => setF(v => ({ ...v, url:e.target.value }))} />
        </div>
        <div>
          <label className="form-label">Notes</label>
          <textarea className="form-input" placeholder="Key takeaways, why it matters..." value={f.notes||''} onChange={e => setF(v => ({ ...v, notes:e.target.value }))} style={{ minHeight:72, resize:'vertical' }} />
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
          <button onClick={onClose} style={{ padding:'11px 22px', borderRadius:12, border:'1px solid #E4DFD8', background:'#fff', cursor:'pointer', fontFamily:'inherit', fontSize:14, fontWeight:600 }}>Cancel</button>
          <button onClick={save} className="coral-btn" style={{ height:44, padding:'0 24px', fontSize:14, borderRadius:12 }}>{initial ? 'Save' : 'Add'}</button>
        </div>
      </div>
    </Modal>
  );
}

export default function ReadingPage() {
  const [items, setItems] = useState<Reading[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Reading|null>(null);
  const [aiPick, setAiPick] = useState<{ title:string; reason:string }|null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const settings = getSettings();

  const load = () => setItems(getReading());
  useEffect(() => { load(); }, []);

  const cycleStatus = (item: Reading) => {
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(item.status) + 1) % STATUS_ORDER.length];
    saveReading({ ...item, status: next });
    load();
  };

  const getAiPick = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/reading-pick', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ existing: items.map(i => i.title), role: settings.targetRole, categories: settings.newsCategories }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAiPick(data);
    } catch {
      setAiPick({ title:'The Sales Development Playbook', reason:'A foundational read for any SDR covering pipeline, metrics, and mindset — essential early in your career.' });
    } finally {
      setAiLoading(false);
    }
  };

  const shelves = STATUS_ORDER.map(s => ({ status: s, items: items.filter(i => i.status === s) }));
  const doneCount = items.filter(i => i.status === 'Done').length;

  return (
    <div>
      <div className="page-head" style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:18 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:500, color:'#9C958B' }}>Learn · Books & articles</div>
          <div className="page-title">Reading List</div>
        </div>
        <div className="page-head-actions" style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div className="page-head-meta" style={{ display:'flex', alignItems:'baseline', gap:8 }}>
            <span className="scc-num" style={{ fontWeight:300, fontSize:52, color:'#F5552E' }}>{doneCount}</span>
            <span style={{ fontSize:12, fontWeight:600, letterSpacing:'.04em', textTransform:'uppercase', color:'#9C958B' }}>done</span>
          </div>
          <button onClick={() => setAddOpen(true)} className="coral-btn" style={{ height:46, padding:'0 22px', fontSize:14, boxShadow:'0 6px 18px rgba(245,85,46,.22)' }}>+ Add</button>
        </div>
      </div>

      {/* AI Pick card */}
      <div style={{ background:'#1A1613', borderRadius:18, padding:'20px 24px', marginBottom:24, display:'flex', alignItems:'center', gap:20 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(255,255,255,.4)', marginBottom:6 }}>AI Pick · Today&apos;s recommendation</div>
          {aiPick ? (
            <>
              <div style={{ fontWeight:800, fontSize:17, color:'#fff', marginBottom:6 }}>{aiPick.title}</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,.6)', lineHeight:1.5 }}>{aiPick.reason}</div>
              <button
                onClick={() => {
                  saveReading({ id: uid(), title:aiPick.title, author:'', category:'Book', status:'Want to read', url:'', notes:'AI recommended' });
                  load();
                  setAiPick(null);
                }}
                style={{ marginTop:12, padding:'8px 16px', borderRadius:10, border:'1px solid rgba(255,255,255,.2)', background:'transparent', color:'rgba(255,255,255,.8)', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}
              >
                Add to list
              </button>
            </>
          ) : (
            <div style={{ fontSize:14, color:'rgba(255,255,255,.5)' }}>Get a personalised reading recommendation based on your role and goals.</div>
          )}
        </div>
        <button
          onClick={getAiPick}
          disabled={aiLoading}
          style={{ flexShrink:0, padding:'12px 20px', borderRadius:12, border:'none', background:'#F5552E', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', opacity: aiLoading ? .6 : 1 }}
        >
          {aiLoading ? 'Thinking…' : aiPick ? 'New pick' : 'Get a pick'}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="card" style={{ padding:'56px 40px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
          <div style={{ fontWeight:800, fontSize:20 }}>Nothing on the shelf yet</div>
          <div style={{ fontSize:14, color:'#9C958B', maxWidth:360, lineHeight:1.5 }}>Add books, articles, podcasts and courses. Click the status pill on any item to cycle it through — Want to read → Reading → Done.</div>
          <button onClick={() => setAddOpen(true)} className="coral-btn" style={{ height:46, padding:'0 22px', fontSize:14, marginTop:4 }}>+ Add first item</button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:28 }}>
          {shelves.map(shelf => shelf.items.length > 0 && (
            <div key={shelf.status}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                <div style={{ fontSize:12, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', color:'#9C958B' }}>{shelf.status}</div>
                <div style={{ fontSize:12, fontWeight:700, color:'#C24A24', background:'#FBE7E0', padding:'2px 9px', borderRadius:999 }}>{shelf.items.length}</div>
                <div style={{ flex:1, height:1, background:'#F1EDE7' }} />
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {shelf.items.map(item => {
                  const sc = STATUS_COLORS[item.status];
                  return (
                    <div key={item.id} className="card" style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:14 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                          <span style={{ fontSize:10, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:'#9C958B', background:'#F4F1EC', padding:'2px 8px', borderRadius:999 }}>{item.category}</span>
                        </div>
                        <div style={{ fontWeight:700, fontSize:15, letterSpacing:'-.01em' }}>
                          {item.url ? (
                            <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color:'inherit', textDecoration:'none' }}>{item.title}</a>
                          ) : item.title}
                        </div>
                        {item.author && <div style={{ fontSize:12, color:'#9C958B', marginTop:2 }}>{item.author}</div>}
                        {item.notes && <div style={{ fontSize:12, color:'#9C958B', marginTop:6, lineHeight:1.5 }}>{item.notes}</div>}
                      </div>
                      <button
                        onClick={() => cycleStatus(item)}
                        style={{ flexShrink:0, ...sc, padding:'4px 12px', borderRadius:999, fontSize:11, fontWeight:700, border:'none', cursor:'pointer', fontFamily:'inherit' }}
                      >{item.status}</button>
                      <DotMenu actions={[
                        { label:'Edit', onClick:() => setEditItem(item) },
                        { label:'Delete', onClick:() => { deleteReading(item.id); load(); }, danger:true },
                      ]} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {(addOpen || editItem) && (
        <ReadingModal initial={editItem || undefined} onClose={() => { setAddOpen(false); setEditItem(null); load(); }} />
      )}
    </div>
  );
}
