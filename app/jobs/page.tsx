'use client';
import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import DotMenu from '@/components/DotMenu';
import { getJobs, saveJob, deleteJob, uid } from '@/lib/store';
import { Job } from '@/lib/types';

type Tab = 'pipeline' | 'applications' | 'targets';

const STATUS_COLORS: Record<string, {bg:string,color:string}> = {
  'Applied': { bg:'#EEF3FB', color:'#3D6FBF' },
  'Phone Screen': { bg:'#FBF9F6', color:'#9C958B' },
  'Interview': { bg:'#E8F5EE', color:'#3F8F5B' },
  'Final Round': { bg:'#FBE7E0', color:'#C24A24' },
  'Offer': { bg:'#E8F5EE', color:'#3F8F5B' },
  'Rejected': { bg:'#FBF9F6', color:'#B5AEA4' },
  'Closed': { bg:'#FBF9F6', color:'#B5AEA4' },
  'Researching': { bg:'#FBF9F6', color:'#9C958B' },
};

function pillStyle(status: string) {
  const c = STATUS_COLORS[status] || { bg:'#F4F1EC', color:'#6B655E' };
  return { display:'inline-flex', alignItems:'center', padding:'3px 12px', borderRadius:999, fontSize:11, fontWeight:700, background:c.bg, color:c.color };
}

const BLANK: Partial<Job> = {
  company:'', role:'', location:'', source:'LinkedIn', status:'Applied',
  ote:'', nextStep:'', contact:'', notes:'', interviewDate:'',
};

const STATUSES = ['Researching','Applied','Phone Screen','Interview','Final Round','Offer','Rejected','Closed'];

function JobModal({ initial, onClose }: { initial?: Job; onClose: () => void }) {
  const [f, setF] = useState<Partial<Job>>({ ...BLANK, ...initial });
  const upd = (p: Partial<Job>) => setF(v => ({ ...v, ...p }));

  const save = () => {
    if (!f.company?.trim()) return;
    saveJob({ id: initial?.id || uid(), company:f.company!, role:f.role||'', location:f.location||'', source:f.source||'LinkedIn', status:f.status||'Applied', ote:f.ote||'', nextStep:f.nextStep||'', contact:f.contact||'', notes:f.notes||'', interviewDate:f.interviewDate });
    onClose();
  };

  const L = ({ ch }: { ch: string }) => <label className="form-label">{ch}</label>;
  const I = ({ k, ph }: { k: keyof Job; ph?: string }) => (
    <input className="form-input" placeholder={ph} value={f[k] as string||''} onChange={e => upd({ [k]:e.target.value } as Partial<Job>)} />
  );

  return (
    <Modal title={initial ? 'Edit job' : 'Add job'} onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div><L ch="Company" /><I k="company" ph="Cloudflare" /></div>
          <div><L ch="Role" /><I k="role" ph="SDR / BDR" /></div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div><L ch="Location" /><I k="location" ph="Sydney, AU" /></div>
          <div><L ch="Source" /><I k="source" ph="LinkedIn, Referral..." /></div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div>
            <L ch="Status" />
            <select className="form-select" value={f.status||'Applied'} onChange={e => upd({ status:e.target.value })}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div><L ch="OTE" /><I k="ote" ph="$80–100k" /></div>
        </div>
        <div><L ch="Next step" /><I k="nextStep" ph="Follow up by..." /></div>
        <div><L ch="Contact" /><I k="contact" ph="Name · email / LinkedIn" /></div>
        <div><L ch="Interview date → calendar" /><input className="form-input" type="date" value={f.interviewDate||''} onChange={e => upd({ interviewDate:e.target.value })} /></div>
        <div>
          <L ch="Notes" />
          <textarea className="form-input" placeholder="Any context, referral info..." value={f.notes||''} onChange={e => upd({ notes:e.target.value })} style={{ minHeight:72, resize:'vertical' }} />
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
          <button onClick={onClose} style={{ padding:'11px 22px', borderRadius:12, border:'1px solid #E4DFD8', background:'#fff', cursor:'pointer', fontFamily:'inherit', fontSize:14, fontWeight:600 }}>Cancel</button>
          <button onClick={save} className="coral-btn" style={{ height:44, padding:'0 24px', fontSize:14, borderRadius:12 }}>{initial ? 'Save changes' : 'Add job'}</button>
        </div>
      </div>
    </Modal>
  );
}

export default function JobsPage() {
  const [tab, setTab] = useState<Tab>('pipeline');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editJob, setEditJob] = useState<Job|null>(null);

  const load = () => setJobs(getJobs());
  useEffect(() => { load(); }, []);

  const pipeline = jobs.filter(j => !['Rejected','Closed'].includes(j.status));
  const statsRow = [
    { label:'Total', value: jobs.length },
    { label:'Active', value: pipeline.length },
    { label:'Interviews', value: jobs.filter(j => ['Interview','Final Round'].includes(j.status)).length },
    { label:'Offers', value: jobs.filter(j => j.status === 'Offer').length },
  ];

  return (
    <div>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:500, color:'#9C958B' }}>Pipeline · Applications</div>
          <div className="page-title">Job Tracker</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
            <span className="scc-num" style={{ fontWeight:300, fontSize:52, color:'#F5552E' }}>{jobs.length}</span>
            <span style={{ fontSize:12, fontWeight:600, letterSpacing:'.04em', textTransform:'uppercase', color:'#9C958B' }}>total</span>
          </div>
          <button onClick={() => setAddOpen(true)} className="coral-btn" style={{ height:50, padding:'0 24px', fontSize:15, boxShadow:'0 8px 22px rgba(245,85,46,.28)' }}>+ Add job</button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:22 }}>
        {statsRow.map(s => (
          <div key={s.label} className="card" style={{ padding:'14px 18px' }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'#9C958B', marginBottom:4 }}>{s.label}</div>
            <div className="scc-num" style={{ fontWeight:300, fontSize:38, color:'#1A1613' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', borderBottom:'1px solid #ECE8E2', marginBottom:22 }}>
        {(['pipeline','applications','targets'] as Tab[]).map(t => (
          <button key={t} className={`tab-btn${tab===t?' active':''}`} onClick={() => setTab(t)}>
            {t === 'pipeline' ? 'Pipeline' : t === 'applications' ? 'Applications' : 'Target Companies'}
          </button>
        ))}
      </div>

      {tab === 'pipeline' && (
        jobs.length === 0
          ? <EmptyState onAdd={() => setAddOpen(true)} />
          : <div className="card" style={{ overflow:'hidden' }}>
            {pipeline.map((j,i) => (
              <div key={j.id} style={{ display:'grid', gridTemplateColumns:'44px 1fr auto', gap:18, alignItems:'center', padding:'18px 24px', borderTop: i>0 ? '1px solid #F1EDE7':undefined }}>
                <div className="scc-num" style={{ fontWeight:600, fontSize:15, color:'#C5BFB6' }}>{i+1}</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:16, letterSpacing:'-.01em' }}>{j.company}</div>
                  <div style={{ fontSize:13, fontWeight:500, color:'#9C958B', marginTop:2 }}>{j.role}{j.location ? ` · ${j.location}` : ''}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={pillStyle(j.status) as React.CSSProperties}>{j.status}</div>
                  <DotMenu actions={[
                    { label:'Edit', onClick:() => setEditJob(j) },
                    { label:'Delete', onClick:() => { deleteJob(j.id); load(); }, danger:true },
                  ]} />
                </div>
              </div>
            ))}
          </div>
      )}

      {tab === 'applications' && (
        jobs.length === 0
          ? <EmptyState onAdd={() => setAddOpen(true)} />
          : <div className="card" style={{ overflow:'hidden' }}>
            <div style={{ display:'grid', gridTemplateColumns:'34px 1.7fr 1fr 1fr auto 50px', gap:16, padding:'13px 22px', background:'#FBF9F6', fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'#9C958B' }}>
              <div>#</div><div>Role</div><div>Location · source</div><div>OTE</div><div>Status</div><div></div>
            </div>
            {jobs.map((j,i) => (
              <div key={j.id} style={{ padding:'16px 22px', borderTop:'1px solid #F1EDE7' }}>
                <div style={{ display:'grid', gridTemplateColumns:'34px 1.7fr 1fr 1fr auto 50px', gap:16, alignItems:'center' }}>
                  <div className="scc-num" style={{ fontWeight:600, color:'#C5BFB6', fontSize:14 }}>{i+1}</div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:15, letterSpacing:'-.01em' }}>{j.company}</div>
                    <div style={{ fontSize:12, color:'#9C958B' }}>{j.role}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:13, color:'#6B655E' }}>{j.location}</div>
                    <div style={{ fontSize:11, color:'#B5AEA4' }}>{j.source}</div>
                  </div>
                  <div className="scc-num" style={{ fontSize:13, color:'#6B655E' }}>{j.ote || '—'}</div>
                  <div style={pillStyle(j.status) as React.CSSProperties}>{j.status}</div>
                  <div style={{ display:'flex', justifyContent:'flex-end' }}>
                    <DotMenu actions={[
                      { label:'Edit', onClick:() => setEditJob(j) },
                      { label:'Delete', onClick:() => { deleteJob(j.id); load(); }, danger:true },
                    ]} />
                  </div>
                </div>
                {(j.nextStep || j.contact || j.notes) && (
                  <div style={{ display:'flex', gap:'7px 22px', marginTop:10, paddingLeft:50, flexWrap:'wrap' }}>
                    {j.nextStep && <div style={{ fontSize:12, color:'#9C958B' }}><span style={{ fontWeight:700, color:'#6B655E' }}>Next:</span> {j.nextStep}</div>}
                    {j.contact && <div style={{ fontSize:12, color:'#9C958B' }}><span style={{ fontWeight:700, color:'#6B655E' }}>Contact:</span> {j.contact}</div>}
                    {j.notes && <div style={{ fontSize:12, color:'#9C958B', flex:1, minWidth:220 }}><span style={{ fontWeight:700, color:'#6B655E' }}>Notes:</span> {j.notes}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
      )}

      {tab === 'targets' && (
        <div style={{ background:'#fff', border:'1px solid #ECE8E2', borderRadius:18, padding:'24px', textAlign:'center', color:'#9C958B' }}>
          <div style={{ fontWeight:700, fontSize:17, color:'#1A1613', marginBottom:8 }}>Target companies</div>
          <div style={{ fontSize:14, lineHeight:1.6 }}>Configure your target companies in Settings → AI Feed. Use the Job Tracker to log research on each as you add jobs.</div>
        </div>
      )}

      {(addOpen || editJob) && (
        <JobModal initial={editJob || undefined} onClose={() => { setAddOpen(false); setEditJob(null); load(); }} />
      )}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="card" style={{ padding:'56px 40px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
      <div style={{ fontWeight:800, fontSize:20, letterSpacing:'-.02em' }}>No jobs tracked yet</div>
      <div style={{ fontSize:14, fontWeight:500, color:'#9C958B', maxWidth:340, lineHeight:1.5 }}>Add the roles you&apos;re applying to — pipeline, status, OTE, next steps, and interview dates all land on the calendar.</div>
      <button onClick={onAdd} className="coral-btn" style={{ height:46, padding:'0 22px', fontSize:14, marginTop:4 }}>+ Add your first job</button>
    </div>
  );
}
