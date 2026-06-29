'use client';
import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import DotMenu from '@/components/DotMenu';
import { getReading, saveReading, deleteReading, uid, getSettings } from '@/lib/store';
import { Reading } from '@/lib/types';

const STATUS_ORDER: Reading['status'][] = ['To read', 'Reading', 'Done'];
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  'To read': { bg: 'var(--card-3)', color: 'var(--ink-2b)' },
  'Reading': { bg: 'var(--accent-soft)', color: 'var(--accent-ink)' },
  'Done': { bg: '#E8F5EE', color: '#3F8F5B' },
};
const TYPES = ['Book', 'Article', 'Podcast', 'Video', 'Course', 'Other'];
const CATS = ['Sales & Prospecting', 'Cloud & Infrastructure', 'Data & AI', 'Career & Switching', 'Tech & Product', 'Other'];
const CAT_ORDER = [...CATS];

function ReadingModal({ initial, onClose }: { initial?: Reading; onClose: () => void }) {
  const [f, setF] = useState<Partial<Reading>>({ title: '', author: '', category: 'Sales & Prospecting', type: 'Book', status: 'To read', url: '', notes: '', ...initial });
  const save = () => {
    if (!f.title?.trim()) return;
    saveReading({ id: initial?.id || uid(), title: f.title!, author: f.author || '', category: f.category || 'Other', type: f.type || 'Book', status: f.status || 'To read', url: f.url || '', notes: f.notes || '' });
    onClose();
  };
  return (
    <Modal title={initial ? 'Edit resource' : 'Add to reading list'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div><label className="form-label">Title</label><input className="form-input" placeholder="Fanatical Prospecting" value={f.title || ''} onChange={e => setF(v => ({ ...v, title: e.target.value }))} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div><label className="form-label">Author / source</label><input className="form-input" placeholder="Jeb Blount" value={f.author || ''} onChange={e => setF(v => ({ ...v, author: e.target.value }))} /></div>
          <div><label className="form-label">Type</label><select className="form-select" value={f.type || 'Book'} onChange={e => setF(v => ({ ...v, type: e.target.value }))}>{TYPES.map(c => <option key={c}>{c}</option>)}</select></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div><label className="form-label">Shelf / category</label><select className="form-select" value={f.category || 'Sales & Prospecting'} onChange={e => setF(v => ({ ...v, category: e.target.value }))}>{CATS.map(c => <option key={c}>{c}</option>)}</select></div>
          <div><label className="form-label">Status</label><select className="form-select" value={f.status || 'To read'} onChange={e => setF(v => ({ ...v, status: e.target.value as Reading['status'] }))}>{STATUS_ORDER.map(s => <option key={s}>{s}</option>)}</select></div>
        </div>
        <div><label className="form-label">URL</label><input className="form-input" placeholder="https://…" value={f.url || ''} onChange={e => setF(v => ({ ...v, url: e.target.value }))} /></div>
        <div><label className="form-label">Why it matters</label><textarea className="form-input" placeholder="Key takeaways, how it helps your search…" value={f.notes || ''} onChange={e => setF(v => ({ ...v, notes: e.target.value }))} style={{ minHeight: 64, resize: 'vertical' }} /></div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
          <button onClick={onClose} style={{ padding: '11px 22px', borderRadius: 12, border: '1px solid var(--line-2)', background: 'var(--card)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}>Cancel</button>
          <button onClick={save} className="coral-btn" style={{ height: 44, padding: '0 24px', fontSize: 14, borderRadius: 12 }}>{initial ? 'Save' : 'Add'}</button>
        </div>
      </div>
    </Modal>
  );
}

export default function ReadingPage() {
  const [items, setItems] = useState<Reading[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Reading | null>(null);
  const [aiPick, setAiPick] = useState<{ title: string; reason: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

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
      const settings = getSettings();
      const res = await fetch('/api/reading-pick', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ existing: items.map(i => i.title), role: settings.targetRole, categories: settings.newsCategories }) });
      if (!res.ok) throw new Error();
      setAiPick(await res.json());
    } catch {
      setAiPick({ title: 'Gap Selling — Keenan', reason: 'A problem-centric selling framework that sharpens discovery — great for interviews and your first SDR calls.' });
    } finally { setAiLoading(false); }
  };

  // group by category, in preferred order
  const cats = [...new Set(items.map(i => i.category))].sort((a, b) => {
    const ia = CAT_ORDER.indexOf(a), ib = CAT_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });

  return (
    <div>
      <div className="page-head" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}>Learn · Compiled resources</div>
          <div className="page-title">Reading List</div>
        </div>
        <div className="page-head-actions" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div className="page-head-meta" style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="scc-num" style={{ fontWeight: 300, fontSize: 52, color: '#F5552E' }}>{items.length}</span>
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--muted)' }}>saved</span>
          </div>
          <button onClick={() => setAddOpen(true)} className="coral-btn" style={{ height: 50, padding: '0 24px', fontSize: 15, boxShadow: '0 8px 22px rgba(245,85,46,.28)' }}>+ Add reading</button>
        </div>
      </div>

      {/* AI pick banner */}
      <div style={{ background: 'var(--fill-dark)', borderRadius: 18, padding: '18px 24px', marginBottom: 26, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', marginBottom: 6 }}>Recommended today</div>
          {aiPick ? (
            <>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>{aiPick.title}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', lineHeight: 1.5, marginTop: 4 }}>{aiPick.reason}</div>
            </>
          ) : (
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,.7)' }}>A fresh pick to sharpen your search — auto-sorted into the right shelf.</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          {aiPick && <button onClick={() => { saveReading({ id: uid(), title: aiPick.title, author: '', category: 'Sales & Prospecting', type: 'Book', status: 'To read', url: '', notes: 'AI recommended' }); setAiPick(null); load(); }} style={{ padding: '12px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,.2)', background: 'transparent', color: 'rgba(255,255,255,.85)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Add to list</button>}
          <button onClick={getAiPick} disabled={aiLoading} style={{ padding: '12px 20px', borderRadius: 12, border: 'none', background: '#F5552E', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: aiLoading ? .6 : 1 }}>{aiLoading ? 'Thinking…' : aiPick ? 'New pick' : "Get today's pick"}</button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="card" style={{ padding: '56px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 20 }}>Nothing on the shelf yet</div>
          <div style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 360, lineHeight: 1.5 }}>Add books, articles, podcasts and courses — grouped into shelves by topic.</div>
          <button onClick={() => setAddOpen(true)} className="coral-btn" style={{ height: 46, padding: '0 22px', fontSize: 14, marginTop: 4 }}>+ Add first resource</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
          {cats.map(cat => {
            const shelf = items.filter(i => i.category === cat);
            return (
              <div key={cat}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--line)', marginBottom: 14 }}>
                  <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-.01em' }}>{cat}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>{shelf.length} resource{shelf.length === 1 ? '' : 's'}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {shelf.map(item => (
                    <div key={item.id} className="card" style={{ padding: '18px 22px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-.01em' }}>{item.title}</span>
                        <button onClick={() => cycleStatus(item)} style={{ ...STATUS_COLORS[item.status], padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>{item.status}</button>
                        <div style={{ marginLeft: 'auto' }}>
                          <DotMenu actions={[{ label: 'Edit', onClick: () => setEditItem(item) }, { label: 'Delete', onClick: () => { deleteReading(item.id); load(); }, danger: true }]} />
                        </div>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--muted)' }}>{[item.type, item.author].filter(Boolean).join(' · ')}</div>
                      {item.notes && <div style={{ fontSize: 13, color: 'var(--ink-2b)', marginTop: 8, lineHeight: 1.5 }}>{item.notes}</div>}
                      {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 10, fontSize: 13, fontWeight: 700, color: '#F5552E', textDecoration: 'none' }}>Open online ↗</a>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(addOpen || editItem) && <ReadingModal initial={editItem || undefined} onClose={() => { setAddOpen(false); setEditItem(null); load(); }} />}
    </div>
  );
}
