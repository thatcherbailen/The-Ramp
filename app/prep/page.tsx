'use client';
import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import DotMenu from '@/components/DotMenu';
import { getPrepCards, savePrepCard, deletePrepCard, uid } from '@/lib/store';
import { PrepCard } from '@/lib/types';
import { SEED_PREP } from '@/lib/seedData';

const TAGS = ['Opener','Motivation','Company','Objection','Resilience','Skill','Growth','Self-aware','Situational','Technical','Other'];

function PrepModal({ initial, onClose }: { initial?: PrepCard; onClose: () => void }) {
  const [f, setF] = useState<Partial<PrepCard>>({ tag:'Opener', q:'', a:'', ...initial });
  const save = () => {
    if (!f.q?.trim()) return;
    savePrepCard({ id: initial?.id || uid(), tag:f.tag||'Opener', q:f.q!, a:f.a||'' });
    onClose();
  };
  return (
    <Modal title={initial ? 'Edit flashcard' : 'Add question'} onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div>
          <label className="form-label">Category / tag</label>
          <select className="form-select" value={f.tag||'Opener'} onChange={e => setF(v => ({ ...v, tag:e.target.value }))}>
            {TAGS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Question</label>
          <textarea className="form-input" placeholder="Tell me about yourself." value={f.q||''} onChange={e => setF(v => ({ ...v, q:e.target.value }))} style={{ minHeight:64, resize:'vertical' }} />
        </div>
        <div>
          <label className="form-label">Your answer</label>
          <textarea className="form-input" placeholder="Architecture taught me..." value={f.a||''} onChange={e => setF(v => ({ ...v, a:e.target.value }))} style={{ minHeight:96, resize:'vertical' }} />
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
          <button onClick={onClose} style={{ padding:'11px 22px', borderRadius:12, border:'1px solid #E4DFD8', background:'#fff', cursor:'pointer', fontFamily:'inherit', fontSize:14, fontWeight:600 }}>Cancel</button>
          <button onClick={save} className="coral-btn" style={{ height:44, padding:'0 24px', fontSize:14, borderRadius:12 }}>{initial ? 'Save' : 'Add question'}</button>
        </div>
      </div>
    </Modal>
  );
}

export default function PrepPage() {
  const [userCards, setUserCards] = useState<PrepCard[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editCard, setEditCard] = useState<PrepCard|null>(null);
  const [flipped, setFlipped] = useState<Set<string>>(new Set());

  const load = () => setUserCards(getPrepCards());
  useEffect(() => { load(); }, []);

  const allCards = [...SEED_PREP, ...userCards];

  const toggleFlip = (id: string) => {
    setFlipped(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:18 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:500, color:'#9C958B' }}>Prep · Question flashcards</div>
          <div className="page-title">Interview Prep</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
            <span className="scc-num" style={{ fontWeight:300, fontSize:52, color:'#F5552E' }}>{allCards.length}</span>
            <span style={{ fontSize:12, fontWeight:600, letterSpacing:'.04em', textTransform:'uppercase', color:'#9C958B' }}>cards</span>
          </div>
          <button onClick={() => setAddOpen(true)} className="coral-btn" style={{ height:50, padding:'0 24px', fontSize:15, boxShadow:'0 8px 22px rgba(245,85,46,.28)' }}>+ Add question</button>
        </div>
      </div>
      <div style={{ fontSize:12, color:'#9C958B', marginBottom:18, lineHeight:1.5, maxWidth:680 }}>
        Flashcards — click a card to flip between the question and your answer. Add your own as new questions come up in screens and mock interviews.
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {allCards.map(c => {
          const isFlipped = flipped.has(c.id);
          const isUser = userCards.some(x => x.id === c.id);
          return (
            <div
              key={c.id}
              className={`flashcard${isFlipped ? ' flipped' : ''}`}
              onClick={() => toggleFlip(c.id)}
            >
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                <span style={{ fontSize:10, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', color: isFlipped ? '#FBC4B2' : '#C24A24', background: isFlipped ? 'rgba(245,85,46,.2)' : '#FBE7E0', padding:'4px 11px', borderRadius:999 }}>
                  {c.tag}
                </span>
                <span style={{ fontSize:12, fontWeight:500, color: isFlipped ? 'rgba(255,255,255,.5)' : '#B5AEA4', marginLeft:'auto' }}>
                  {isFlipped ? 'Click to see question →' : 'Click to reveal answer →'}
                </span>
                {isUser && (
                  <div onClick={e => e.stopPropagation()}>
                    <DotMenu actions={[
                      { label:'Edit', onClick:() => setEditCard(c) },
                      { label:'Delete', onClick:() => { deletePrepCard(c.id); load(); }, danger:true },
                    ]} />
                  </div>
                )}
              </div>
              {!isFlipped ? (
                <div style={{ fontWeight:800, fontSize:21, lineHeight:1.25, letterSpacing:'-.02em' }}>{c.q}</div>
              ) : (
                <div>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(255,255,255,.5)', marginBottom:5 }}>Your answer</div>
                  <div style={{ fontSize:14, fontWeight:500, color:'rgba(255,255,255,.9)', lineHeight:1.55 }}>{c.a}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(addOpen || editCard) && (
        <PrepModal initial={editCard || undefined} onClose={() => { setAddOpen(false); setEditCard(null); load(); }} />
      )}
    </div>
  );
}
