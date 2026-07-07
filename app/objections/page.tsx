'use client';
import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import DotMenu from '@/components/DotMenu';
import { getObjections, saveObjection, deleteObjection, uid, mergeSeed, hideSeedItem } from '@/lib/store';
import { Objection } from '@/lib/types';
import { SEED_OBJECTIONS } from '@/lib/seedData';
import ObjectionDrillSession from '@/components/ObjectionDrillSession';
import StreakBadge from '@/components/StreakBadge';

const TAGS = ['Price','Competitor','Brush off','No budget','Timing','Status quo','Stakeholder','No need','Sceptical','Other'];

function ObjectionModal({ initial, onClose }: { initial?: Objection; onClose: () => void }) {
  const [f, setF] = useState<Partial<Objection>>({ tag:'Price', objection:'', response:'', ...initial });
  const save = () => {
    if (!f.objection?.trim()) return;
    saveObjection({ id: initial?.id || uid(), tag:f.tag||'Price', objection:f.objection!, response:f.response||'' });
    onClose();
  };
  return (
    <Modal title={initial ? 'Edit objection' : 'Add objection'} onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div>
          <label className="form-label">Category / tag</label>
          <select className="form-select" value={f.tag||'Price'} onChange={e => setF(v => ({ ...v, tag:e.target.value }))}>
            {TAGS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">What the prospect says</label>
          <textarea className="form-input" placeholder="We don't have budget right now." value={f.objection||''} onChange={e => setF(v => ({ ...v, objection:e.target.value }))} style={{ minHeight:72, resize:'vertical' }} />
        </div>
        <div>
          <label className="form-label">Your pivot</label>
          <textarea className="form-input" placeholder="I completely understand — most of our best clients said the same thing before they saw the ROI..." value={f.response||''} onChange={e => setF(v => ({ ...v, response:e.target.value }))} style={{ minHeight:120, resize:'vertical' }} />
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
          <button onClick={onClose} style={{ padding:'11px 22px', borderRadius:12, border:'1px solid var(--line-2)', background:'var(--card)', cursor:'pointer', fontFamily:'inherit', fontSize:14, fontWeight:600 }}>Cancel</button>
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
  const [drillOpen, setDrillOpen] = useState(false);

  const load = () => setUserObjections(getObjections());
  useEffect(() => { load(); }, []);

  const allObjections = mergeSeed('objections', SEED_OBJECTIONS, userObjections);

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
          <div style={{ fontSize:13, fontWeight:500, color:'var(--muted)' }}>Prep · Sales practice</div>
          <div className="page-title">Objection Drill</div>
        </div>
        <div className="page-head-actions page-head-meta" style={{ display:'flex', alignItems:'center', gap:18 }}>
          <StreakBadge compact />
          <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
            <span className="scc-num" style={{ fontWeight:300, fontSize:52, color:'#F5552E' }}>{allObjections.length}</span>
            <span style={{ fontSize:12, fontWeight:600, letterSpacing:'.04em', textTransform:'uppercase', color:'var(--muted)' }}>drills</span>
          </div>
        </div>
      </div>

      {/* Dark intro banner + AI drill CTA */}
      <div style={{ background:'var(--fill-dark)', borderRadius:18, padding:'22px 24px', color:'#fff', marginBottom:18, display:'flex', alignItems:'center', justifyContent:'space-between', gap:20, flexWrap:'wrap' }}>
        <div style={{ maxWidth:560 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(255,255,255,.4)', marginBottom:8 }}>AI Objection Drill</div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,.78)', lineHeight:1.6 }}>
            Objections aren&apos;t rejection — they&apos;re a request for more information. Get a real objection, type your response, and get scored against acknowledge → reframe → close.
          </div>
        </div>
        <button onClick={() => setDrillOpen(true)} className="coral-btn" style={{ height:48, padding:'0 26px', fontSize:14.5, borderRadius:12, flexShrink:0, boxShadow:'0 8px 22px rgba(245,85,46,.35)' }}>▶ Start AI drill</button>
      </div>

      {/* Drill method cards — numbered coral circles */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:26 }}>
        {[
          { n:'1', title:'Post-It Drill', body:'Write each objection on a Post-It. Stick them around your desk. Every time you walk past one, say your pivot out loud. Do this for 3 days until it’s automatic.' },
          { n:'2', title:'Flashcard Drill', body:'Tap any card below to flip from objection to pivot. Run through all cards daily for a week — speed and confidence follow. Add your own as new ones come up on real calls.' },
          { n:'3', title:'AI Drill', body:'The real test — respond in your own words with no answer to peek at, and get instant, specific feedback on what worked and what to fix next time.' },
        ].map(m => (
          <div key={m.n} style={{ background:'var(--card-2)', border:'1px solid var(--line)', borderRadius:18, padding:'20px 22px', display:'flex', gap:14 }}>
            <div style={{ flexShrink:0, width:32, height:32, borderRadius:999, background:'var(--accent-soft)', color:'var(--accent-ink)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:15 }}>{m.n}</div>
            <div>
              <div style={{ fontWeight:800, fontSize:17, marginBottom:6 }}>{m.title}</div>
              <div style={{ fontSize:13, color:'var(--muted)', lineHeight:1.6 }}>{m.body}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Deck label row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--muted)' }}>Objection deck · tap to flip</div>
        <button onClick={() => setAddOpen(true)} className="coral-btn" style={{ height:40, padding:'0 18px', fontSize:13, borderRadius:11 }}>+ Add objection</button>
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
              style={{ minHeight:178, display:'flex', flexDirection:'column' }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                {obj.tag && (
                  <span style={{ fontSize:10, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', color: isFlipped ? '#FBC4B2' : 'var(--accent-ink)', background: isFlipped ? 'rgba(245,85,46,.2)' : 'var(--accent-soft)', padding:'3px 10px', borderRadius:999 }}>
                    {obj.tag}
                  </span>
                )}
                <div onClick={e => e.stopPropagation()} style={{ marginLeft:'auto' }}>
                  <DotMenu actions={[
                    { label:'Edit', onClick:() => setEditObj(obj) },
                    { label:'Delete', onClick:() => { isUser ? deleteObjection(obj.id) : hideSeedItem('objections', obj.id); load(); }, danger:true },
                  ]} />
                </div>
              </div>
              {!isFlipped ? (
                <>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--muted-2)', marginBottom:6 }}>Prospect says</div>
                  <div style={{ fontWeight:700, fontSize:16, lineHeight:1.35, letterSpacing:'-.01em' }}>&ldquo;{obj.objection}&rdquo;</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(255,255,255,.5)', marginBottom:6 }}>Your pivot</div>
                  <div style={{ fontSize:13.5, fontWeight:500, color:'rgba(255,255,255,.92)', lineHeight:1.6 }}>{obj.response}</div>
                </>
              )}
              <div style={{ marginTop:'auto', paddingTop:14, fontSize:12, fontWeight:700, color: isFlipped ? 'rgba(255,255,255,.55)' : 'var(--accent-ink)' }}>
                {isFlipped ? 'Tap to flip back ↺' : 'Tap for your pivot →'}
              </div>
            </div>
          );
        })}
      </div>

      {(addOpen || editObj) && (
        <ObjectionModal initial={editObj || undefined} onClose={() => { setAddOpen(false); setEditObj(null); load(); }} />
      )}

      {drillOpen && (
        <ObjectionDrillSession pool={allObjections} onClose={() => setDrillOpen(false)} />
      )}
    </div>
  );
}
