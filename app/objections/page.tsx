'use client';
import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import DotMenu from '@/components/DotMenu';
import { getObjections, saveObjection, deleteObjection, uid } from '@/lib/store';
import { Objection } from '@/lib/types';
import { SEED_OBJECTIONS } from '@/lib/seedData';

function ObjectionModal({ initial, onClose }: { initial?: Objection; onClose: () => void }) {
  const [f, setF] = useState<Partial<Objection>>({ objection:'', response:'', ...initial });
  const save = () => {
    if (!f.objection?.trim()) return;
    saveObjection({ id: initial?.id || uid(), objection:f.objection!, response:f.response||'' });
    onClose();
  };
  return (
    <Modal title={initial ? 'Edit objection' : 'Add objection'} onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div>
          <label className="form-label">Objection</label>
          <textarea className="form-input" placeholder="We don't have budget right now." value={f.objection||''} onChange={e => setF(v => ({ ...v, objection:e.target.value }))} style={{ minHeight:72, resize:'vertical' }} />
        </div>
        <div>
          <label className="form-label">Your response</label>
          <textarea className="form-input" placeholder="I completely understand — most of our best clients said the same thing before they saw the ROI..." value={f.response||''} onChange={e => setF(v => ({ ...v, response:e.target.value }))} style={{ minHeight:120, resize:'vertical' }} />
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
          <button onClick={onClose} style={{ padding:'11px 22px', borderRadius:12, border:'1px solid #E4DFD8', background:'#fff', cursor:'pointer', fontFamily:'inherit', fontSize:14, fontWeight:600 }}>Cancel</button>
          <button onClick={save} className="coral-btn" style={{ height:44, padding:'0 24px', fontSize:14, borderRadius:12 }}>{initial ? 'Save' : 'Add objection'}</button>
        </div>
      </div>
    </Modal>
  );
}

export default function ObjectionsPage() {
  const [userObjections, setUserObjections] = useState<Objection[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editObj, setEditObj] = useState<Objection|null>(null);
  const [flipped, setFlipped] = useState<Set<string>>(new Set());

  const load = () => setUserObjections(getObjections());
  useEffect(() => { load(); }, []);

  const allObjections = [...SEED_OBJECTIONS, ...userObjections];

  const toggleFlip = (id: string) => {
    setFlipped(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div>
      <div className="page-head" style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:18 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:500, color:'#9C958B' }}>Prep · Sales practice</div>
          <div className="page-title">Objection Drill</div>
        </div>
        <div className="page-head-actions" style={{ display:'flex', alignItems:'center', gap:20 }}>
          <div className="page-head-meta" style={{ display:'flex', alignItems:'baseline', gap:8 }}>
            <span className="scc-num" style={{ fontWeight:300, fontSize:52, color:'#F5552E' }}>{allObjections.length}</span>
            <span style={{ fontSize:12, fontWeight:600, letterSpacing:'.04em', textTransform:'uppercase', color:'#9C958B' }}>drills</span>
          </div>
          <button onClick={() => setAddOpen(true)} className="coral-btn" style={{ height:50, padding:'0 24px', fontSize:15, boxShadow:'0 8px 22px rgba(245,85,46,.28)' }}>+ Add objection</button>
        </div>
      </div>

      {/* Drill method cards */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:24 }}>
        <div style={{ background:'#1A1613', borderRadius:18, padding:'20px 22px', color:'#fff' }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(255,255,255,.4)', marginBottom:8 }}>Method 1</div>
          <div style={{ fontWeight:800, fontSize:17, marginBottom:8 }}>Post-It Drill</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,.65)', lineHeight:1.6 }}>Write each objection on a Post-It. Stick them around your desk. Every time you walk past one, say your response out loud. Do this for 3 days until it's automatic.</div>
        </div>
        <div style={{ background:'#FBF9F6', border:'1px solid #ECE8E2', borderRadius:18, padding:'20px 22px' }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'#B5AEA4', marginBottom:8 }}>Method 2</div>
          <div style={{ fontWeight:800, fontSize:17, marginBottom:8 }}>Flashcard Drill</div>
          <div style={{ fontSize:13, color:'#9C958B', lineHeight:1.6 }}>Click any card below to flip from objection to response. Run through all cards daily for a week — speed and confidence will follow. Add your own as new ones come up in real calls.</div>
        </div>
      </div>

      <div style={{ fontSize:12, color:'#9C958B', marginBottom:18, lineHeight:1.5 }}>
        Click a card to reveal the response. Practise saying it out loud — your goal is fluent delivery under pressure.
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
        {allObjections.map(obj => {
          const isFlipped = flipped.has(obj.id);
          const isUser = userObjections.some(x => x.id === obj.id);
          return (
            <div
              key={obj.id}
              className={`flashcard${isFlipped ? ' flipped' : ''}`}
              onClick={() => toggleFlip(obj.id)}
              style={{ minHeight:160 }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <span style={{ fontSize:10, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', color: isFlipped ? '#FBC4B2' : '#C24A24', background: isFlipped ? 'rgba(245,85,46,.2)' : '#FBE7E0', padding:'3px 10px', borderRadius:999 }}>
                  {isFlipped ? 'Response' : 'Objection'}
                </span>
                <span style={{ fontSize:11, fontWeight:500, color: isFlipped ? 'rgba(255,255,255,.4)' : '#B5AEA4', marginLeft:'auto' }}>
                  {isFlipped ? 'click to flip ↺' : 'click to reveal →'}
                </span>
                {isUser && !isFlipped && (
                  <div onClick={e => e.stopPropagation()}>
                    <DotMenu actions={[
                      { label:'Edit', onClick:() => setEditObj(obj) },
                      { label:'Delete', onClick:() => { deleteObjection(obj.id); load(); }, danger:true },
                    ]} />
                  </div>
                )}
              </div>
              {!isFlipped ? (
                <div style={{ fontWeight:700, fontSize:16, lineHeight:1.35, letterSpacing:'-.01em' }}>{obj.objection}</div>
              ) : (
                <div style={{ fontSize:13, fontWeight:500, color:'rgba(255,255,255,.9)', lineHeight:1.6 }}>{obj.response}</div>
              )}
            </div>
          );
        })}
      </div>

      {(addOpen || editObj) && (
        <ObjectionModal initial={editObj || undefined} onClose={() => { setAddOpen(false); setEditObj(null); load(); }} />
      )}
    </div>
  );
}
