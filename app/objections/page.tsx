'use client';
import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import DotMenu from '@/components/DotMenu';
import { getObjections, saveObjection, deleteObjection, uid, mergeSeed, hideSeedItem, getDrillLog, deleteDrillLog, DrillResult } from '@/lib/store';
import { Objection } from '@/lib/types';
import { SEED_OBJECTIONS } from '@/lib/seedData';
import ObjectionDrillSession from '@/components/ObjectionDrillSession';
import StreakBadge from '@/components/StreakBadge';

function drillTimeAgo(ts?: number): string {
  if (!ts) return '';
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}
function drillScoreColor(score: number): { bg: string; fg: string } {
  if (score >= 70) return { bg: 'var(--accent-soft)', fg: 'var(--accent-ink)' };
  if (score >= 40) return { bg: 'var(--card-3)', fg: 'var(--ink-2)' };
  return { bg: '#F5E3DE', fg: '#C24A24' };
}

// Read-only view of a logged objection drill.
function DrillDetailModal({ result, onClose }: { result: DrillResult; onClose: () => void }) {
  const d = result.detail || {};
  const sc = drillScoreColor(result.score);
  return (
    <Modal title="Objection Drill" onClose={onClose} width={620}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: sc.bg, color: sc.fg }}>
            <span style={{ fontWeight: 800, fontSize: 21, lineHeight: 1 }}>{result.score}</span>
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginTop: 2 }}>score</span>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 3 }}>{drillTimeAgo(result.ts)}</div>
            <div style={{ fontSize: 14, color: 'var(--ink-2b)', lineHeight: 1.5 }}>{d.summary}</div>
          </div>
        </div>

        <div style={{ background: 'var(--fill-dark)', borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 6 }}>Prospect said</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>&ldquo;{d.objection}&rdquo;</div>
        </div>

        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 6 }}>Your response</div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.55, background: 'var(--card-2)', border: '1px solid var(--line)', borderRadius: 12, padding: '12px 14px' }}>{d.response}</div>
        </div>

        {d.criteria?.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {d.criteria.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--line)', background: c.met ? 'var(--card-2)' : 'var(--card)' }}>
                <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, background: c.met ? '#DCEFE0' : '#F5E3DE', color: c.met ? '#2E7D46' : '#C24A24' }}>{c.met ? '✓' : '✕'}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{c.label}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2, lineHeight: 1.45 }}>{c.note}</div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

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
  const [history, setHistory] = useState<DrillResult[]>([]);
  const [detail, setDetail] = useState<DrillResult|null>(null);

  const load = () => setUserObjections(getObjections());
  useEffect(() => {
    load();
    const refreshHistory = () => setHistory(getDrillLog('objection'));
    refreshHistory();
    window.addEventListener('scc:practice-logged', refreshHistory);
    return () => window.removeEventListener('scc:practice-logged', refreshHistory);
  }, []);

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

      {/* Drill history */}
      {history.length > 0 && (
        <div style={{ marginTop:30 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--muted)', marginBottom:14 }}>Recent drills</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {history.map(h => {
              const sc = drillScoreColor(h.score);
              return (
                <div key={h.id} onClick={() => setDetail(h)} className="card" style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 18px', cursor:'pointer' }}>
                  <div style={{ width:46, height:46, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:sc.bg, color:sc.fg, fontWeight:800, fontSize:16 }}>{h.score}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>&ldquo;{h.detail?.objection || h.detail?.title || 'Objection'}&rdquo;</div>
                    <div style={{ fontSize:12.5, color:'var(--muted)', lineHeight:1.5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.detail?.summary || 'Tap to see the full feedback'}</div>
                  </div>
                  <span style={{ fontSize:11.5, color:'var(--muted-2)', flexShrink:0 }}>{drillTimeAgo(h.ts)}</span>
                  <div onClick={e => e.stopPropagation()}>
                    <DotMenu actions={[
                      { label:'View', onClick:() => setDetail(h) },
                      { label:'Delete', onClick:() => deleteDrillLog(h.id), danger:true },
                    ]} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(addOpen || editObj) && (
        <ObjectionModal initial={editObj || undefined} onClose={() => { setAddOpen(false); setEditObj(null); load(); }} />
      )}

      {drillOpen && (
        <ObjectionDrillSession pool={allObjections} onClose={() => setDrillOpen(false)} />
      )}

      {detail && <DrillDetailModal result={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
