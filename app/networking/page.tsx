'use client';
import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import DotMenu from '@/components/DotMenu';
import { getContacts, saveContact, deleteContact, uid } from '@/lib/store';
import { Contact } from '@/lib/types';

const STATUS_COLORS: Record<string, {bg:string,color:string}> = {
  'Warm': { bg:'#E8F5EE', color:'#3F8F5B' },
  'Active': { bg:'#FBE7E0', color:'#F5552E' },
  'Cold': { bg:'#FBF9F6', color:'#9C958B' },
  'Follow up due': { bg:'#FFF3CD', color:'#B68B00' },
  'Met': { bg:'#EEF3FB', color:'#3D6FBF' },
  'Intro needed': { bg:'#FBF9F6', color:'#B5AEA4' },
};

const BLANK: Partial<Contact> = { name:'', role:'', company:'', linkedBy:'', metWhere:'', status:'Warm', followupDate:'', extendedNetwork:'', notes:'' };

function ContactModal({ initial, onClose }: { initial?: Contact; onClose: () => void }) {
  const [f, setF] = useState<Partial<Contact>>({ ...BLANK, ...initial });
  const upd = (p: Partial<Contact>) => setF(v => ({ ...v, ...p }));

  const save = () => {
    if (!f.name?.trim()) return;
    saveContact({ id: initial?.id || uid(), name:f.name!, role:f.role||'', company:f.company||'', linkedBy:f.linkedBy||'', metWhere:f.metWhere||'', status:f.status||'Warm', followupDate:f.followupDate, extendedNetwork:f.extendedNetwork, notes:f.notes });
    onClose();
  };

  const L = ({ ch }: { ch: string }) => <label className="form-label">{ch}</label>;
  const I = ({ k, ph }: { k: keyof Contact; ph?: string }) => (
    <input className="form-input" placeholder={ph} value={f[k] as string||''} onChange={e => upd({ [k]:e.target.value } as Partial<Contact>)} />
  );

  return (
    <Modal title={initial ? 'Edit contact' : 'Add to network'} onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div><L ch="Name" /><I k="name" ph="Alex Chen" /></div>
          <div><L ch="Role" /><I k="role" ph="SDR Manager" /></div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div><L ch="Company" /><I k="company" ph="Cloudflare" /></div>
          <div>
            <L ch="Status" />
            <select className="form-select" value={f.status||'Warm'} onChange={e => upd({ status:e.target.value })}>
              {Object.keys(STATUS_COLORS).map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div><L ch="Who linked you up" /><I k="linkedBy" ph="Referred by / LinkedIn / Event..." /></div>
        <div><L ch="Where you met" /><I k="metWhere" ph="LinkedIn, coffee chat, SDR panel..." /></div>
        <div>
          <L ch="Follow-up date → calendar" />
          <input className="form-input" type="date" value={f.followupDate||''} onChange={e => upd({ followupDate:e.target.value })} />
        </div>
        <div>
          <L ch="Extended network (who can they intro you to?)" />
          <textarea className="form-input" placeholder="Their manager, 3 other SDRs at Datadog..." value={f.extendedNetwork||''} onChange={e => upd({ extendedNetwork:e.target.value })} style={{ minHeight:64, resize:'vertical' }} />
        </div>
        <div>
          <L ch="Notes" />
          <textarea className="form-input" placeholder="Context, talking points, next step..." value={f.notes||''} onChange={e => upd({ notes:e.target.value })} style={{ minHeight:64, resize:'vertical' }} />
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
          <button onClick={onClose} style={{ padding:'11px 22px', borderRadius:12, border:'1px solid #E4DFD8', background:'#fff', cursor:'pointer', fontFamily:'inherit', fontSize:14, fontWeight:600 }}>Cancel</button>
          <button onClick={save} className="coral-btn" style={{ height:44, padding:'0 24px', fontSize:14, borderRadius:12 }}>{initial ? 'Save changes' : 'Add to network'}</button>
        </div>
      </div>
    </Modal>
  );
}

export default function NetworkingPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact|null>(null);

  const load = () => setContacts(getContacts());
  useEffect(() => { load(); }, []);

  const warm = contacts.filter(c => c.status === 'Warm' || c.status === 'Active').length;

  return (
    <div>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:500, color:'#9C958B' }}>Pipeline · Relationships</div>
          <div className="page-title">Network</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
            <span className="scc-num" style={{ fontWeight:300, fontSize:52, color:'#F5552E' }}>{contacts.length}</span>
            <span style={{ fontSize:12, fontWeight:600, letterSpacing:'.04em', textTransform:'uppercase', color:'#9C958B' }}>contacts</span>
          </div>
          <button onClick={() => setAddOpen(true)} className="coral-btn" style={{ height:50, padding:'0 24px', fontSize:15, boxShadow:'0 8px 22px rgba(245,85,46,.28)' }}>+ Add to network</button>
        </div>
      </div>

      <div style={{ fontSize:12, color:'#9C958B', marginBottom:16, lineHeight:1.5, maxWidth:680 }}>
        Everyone who can move your search forward. {warm} warm right now — set a follow-up date and it lands on your calendar automatically.
      </div>

      {contacts.length === 0 ? (
        <div className="card" style={{ padding:'56px 40px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
          <div style={{ fontWeight:800, fontSize:20, letterSpacing:'-.02em' }}>No contacts yet</div>
          <div style={{ fontSize:14, fontWeight:500, color:'#9C958B', maxWidth:360, lineHeight:1.5 }}>Add the people in your corner — who they are, who linked you up, where you met, and who they can introduce you to next.</div>
          <button onClick={() => setAddOpen(true)} className="coral-btn" style={{ height:46, padding:'0 22px', fontSize:14, marginTop:4 }}>+ Add to network</button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {contacts.map(c => {
            const pc = STATUS_COLORS[c.status] || { bg:'#F4F1EC', color:'#6B655E' };
            return (
              <div key={c.id} className="card" style={{ padding:'18px 22px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:11, flexWrap:'wrap', marginBottom:13 }}>
                  <span style={{ fontWeight:800, fontSize:18, letterSpacing:'-.01em' }}>{c.name}</span>
                  {(c.role || c.company) && <span style={{ fontSize:13, fontWeight:500, color:'#9C958B' }}>{[c.role, c.company].filter(Boolean).join(' · ')}</span>}
                  <span style={{ ...pc as React.CSSProperties, padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:700 }}>{c.status}</span>
                  <div style={{ marginLeft:'auto' }}>
                    <DotMenu actions={[
                      { label:'Edit', onClick:() => setEditContact(c) },
                      { label:'Delete', onClick:() => { deleteContact(c.id); load(); }, danger:true },
                    ]} />
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:26, marginBottom:4 }}>
                  {c.metWhere && (
                    <div>
                      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'#B5AEA4', marginBottom:5 }}>How you connected</div>
                      <div style={{ fontSize:13, fontWeight:500, color:'#3F3A34', lineHeight:1.5 }}>{c.metWhere}{c.linkedBy ? ` · via ${c.linkedBy}` : ''}</div>
                    </div>
                  )}
                  {c.followupDate && (
                    <div>
                      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'#C24A24', marginBottom:5 }}>Follow-up · on calendar</div>
                      <div style={{ display:'inline-block', fontSize:13, fontWeight:700, color:'#C24A24', background:'#FBE7E0', padding:'4px 12px', borderRadius:999 }}>{c.followupDate}</div>
                    </div>
                  )}
                </div>
                {c.extendedNetwork && (
                  <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid #F1EDE7' }}>
                    <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'#B5AEA4', marginBottom:5 }}>Extended network</div>
                    <div style={{ fontSize:13, fontWeight:500, color:'#3F3A34', lineHeight:1.5 }}>{c.extendedNetwork}</div>
                  </div>
                )}
                {c.notes && <div style={{ fontSize:13, color:'#9C958B', lineHeight:1.5, marginTop:10 }}>{c.notes}</div>}
              </div>
            );
          })}
        </div>
      )}

      {(addOpen || editContact) && (
        <ContactModal initial={editContact || undefined} onClose={() => { setAddOpen(false); setEditContact(null); load(); }} />
      )}
    </div>
  );
}
