'use client';
import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import DotMenu from '@/components/DotMenu';
import { getNotes, saveNote, deleteNote, uid } from '@/lib/store';
import { Note } from '@/lib/types';

const TAGS = ['General', 'Call prep', 'Interview prep', 'Meeting', 'Research'];
const TAG_COLOR: Record<string, string> = {
  'General': 'var(--muted)',
  'Call prep': '#F5552E',
  'Interview prep': 'var(--ink)',
  'Meeting': '#3D6FBF',
  'Research': '#6B4EE6',
};

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

function NoteModal({ initial, onClose }: { initial?: Note; onClose: () => void }) {
  const [f, setF] = useState<Partial<Note>>({ title: '', body: '', tag: 'General', ...initial });
  const upd = (p: Partial<Note>) => setF(v => ({ ...v, ...p }));

  const save = () => {
    if (!f.title?.trim() && !f.body?.trim()) return;
    const now = Date.now();
    saveNote({
      id: initial?.id || uid(),
      title: f.title?.trim() || 'Untitled note',
      body: f.body || '',
      tag: f.tag || 'General',
      createdAt: initial?.createdAt || now,
      updatedAt: now,
    });
    onClose();
  };

  return (
    <Modal title={initial ? 'Edit note' : 'New note'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className="form-label">Title</label>
          <input className="form-input" placeholder="Call with Cloudflare — discovery" value={f.title || ''} onChange={e => upd({ title: e.target.value })} />
        </div>
        <div>
          <label className="form-label">Tag</label>
          <select className="form-select" value={f.tag || 'General'} onChange={e => upd({ tag: e.target.value })}>
            {TAGS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Notes</label>
          <textarea className="form-input" placeholder="What came up, what to prep, next steps…" value={f.body || ''} onChange={e => upd({ body: e.target.value })} style={{ minHeight: 180, resize: 'vertical' }} />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
          {initial && (
            <button onClick={() => { deleteNote(initial.id); onClose(); }} style={{ padding: '11px 18px', borderRadius: 12, border: '1px solid #F0CFC6', background: 'var(--card)', color: '#D8431F', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, marginRight: 'auto' }}>Delete</button>
          )}
          <button onClick={onClose} style={{ padding: '11px 22px', borderRadius: 12, border: '1px solid var(--line-2)', background: 'var(--card)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}>Cancel</button>
          <button onClick={save} className="coral-btn" style={{ height: 44, padding: '0 24px', fontSize: 14, borderRadius: 12 }}>{initial ? 'Save' : 'Add note'}</button>
        </div>
      </div>
    </Modal>
  );
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);

  const load = () => setNotes(getNotes());
  useEffect(() => { load(); }, []);

  const filtered = notes
    .filter(n => !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.body.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div>
      <div className="page-head" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}>Prep · Free-form notes</div>
          <div className="page-title">Notes</div>
        </div>
        <div className="page-head-actions" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div className="page-head-meta" style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="scc-num" style={{ fontWeight: 300, fontSize: 52, color: '#F5552E' }}>{notes.length}</span>
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--muted)' }}>saved</span>
          </div>
          <button onClick={() => setAddOpen(true)} className="coral-btn" style={{ height: 50, padding: '0 24px', fontSize: 15, boxShadow: '0 8px 22px rgba(245,85,46,.28)' }}>+ Add note</button>
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 18, lineHeight: 1.5, maxWidth: 680 }}>
        Jot down call notes, prep, meeting recaps or anything else worth keeping — tag it so it&apos;s easy to find later.
      </div>

      {notes.length > 0 && (
        <input
          className="form-input"
          placeholder="Search notes…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: 18, maxWidth: 360 }}
        />
      )}

      {notes.length === 0 ? (
        <div className="card" style={{ padding: '56px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-.02em' }}>No notes yet</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--muted)', maxWidth: 360, lineHeight: 1.5 }}>Capture call prep, meeting recaps or anything else worth remembering — tag it so it&apos;s easy to find later.</div>
          <button onClick={() => setAddOpen(true)} className="coral-btn" style={{ height: 46, padding: '0 22px', fontSize: 14, marginTop: 4 }}>+ Add your first note</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: '48px 40px', textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>No matches</div>
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>Try a different search term.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(n => (
            <div key={n.id} onClick={() => setEditNote(n)} className="card" style={{ padding: '18px 22px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: TAG_COLOR[n.tag] || 'var(--muted)', background: 'var(--card-3)', padding: '3px 10px', borderRadius: 999 }}>{n.tag}</span>
                    <span style={{ fontSize: 11.5, color: 'var(--muted-2)', fontWeight: 500 }}>{timeAgo(n.updatedAt)}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-.01em', marginBottom: 4 }}>{n.title}</div>
                  {n.body && <div style={{ fontSize: 13.5, color: 'var(--ink-2b)', lineHeight: 1.55, whiteSpace: 'pre-wrap', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{n.body}</div>}
                </div>
                <div onClick={e => e.stopPropagation()}>
                  <DotMenu actions={[
                    { label: 'Edit', onClick: () => setEditNote(n) },
                    { label: 'Delete', onClick: () => { deleteNote(n.id); load(); }, danger: true },
                  ]} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(addOpen || editNote) && (
        <NoteModal initial={editNote || undefined} onClose={() => { setAddOpen(false); setEditNote(null); load(); }} />
      )}
    </div>
  );
}
