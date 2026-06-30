'use client';
import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import DotMenu from '@/components/DotMenu';
import { getJobs, saveJob, deleteJob, uid, getCalls, getGoals, getOutreach, saveOutreach, deleteOutreach, getRoofing, saveRoofingWeek, getSettings } from '@/lib/store';
import { Job, OutreachEntry, RoofingWeek } from '@/lib/types';
import { SEED_TARGETS } from '@/lib/seedData';

type Opening = { company: string; role: string; location: string; url: string; source: string; posted: string; summary: string };

type Tab = 'pipeline' | 'find' | 'dashboard' | 'targets' | 'outreach' | 'applications' | 'roofing';
const TABS: { key: Tab; label: string }[] = [
  { key: 'pipeline', label: 'Pipeline' }, { key: 'find', label: 'Find Jobs' }, { key: 'dashboard', label: 'Dashboard' }, { key: 'targets', label: 'Targets' },
  { key: 'outreach', label: 'Outreach' }, { key: 'applications', label: 'Applications' }, { key: 'roofing', label: 'Roofing' },
];

const STATUS_PILL: Record<string, { bg: string; color: string }> = {
  'Interview': { bg: 'var(--accent-soft)', color: 'var(--accent-ink)' },
  'Final Round': { bg: 'var(--accent-soft)', color: 'var(--accent-ink)' },
  'Offer': { bg: '#E8F5EE', color: '#3F8F5B' },
  'Screening': { bg: '#FFF3CD', color: '#B68B00' },
  'Phone Screen': { bg: '#FFF3CD', color: '#B68B00' },
  'Applied': { bg: 'var(--card-3)', color: 'var(--ink-2b)' },
  'Researching': { bg: 'var(--card-3)', color: 'var(--ink-2b)' },
  'Rejected': { bg: 'var(--card-3)', color: 'var(--muted-2)' },
  'Closed': { bg: 'var(--card-3)', color: 'var(--muted-2)' },
};
const OUTREACH_PILL: Record<string, { bg: string; color: string }> = {
  'Replied': { bg: 'var(--accent-soft)', color: 'var(--accent-ink)' },
  'Booked': { bg: '#E8F5EE', color: '#3F8F5B' },
  'Awaiting': { bg: '#FFF3CD', color: '#B68B00' },
  'No response': { bg: 'var(--card-3)', color: 'var(--muted-2)' },
};
const pillStyle = (s: string, map = STATUS_PILL) => {
  const c = map[s] || { bg: 'var(--card-3)', color: 'var(--ink-2b)' };
  return { display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color };
};

const STATUSES = ['Researching', 'Applied', 'Screening', 'Phone Screen', 'Interview', 'Final Round', 'Offer', 'Rejected', 'Closed'];
const dollars = (v?: string) => { const n = parseFloat((v || '').replace(/[^0-9.]/g, '')); return isNaN(n) ? 0 : n; };
const num = (v?: string) => { const n = parseFloat(v || ''); return isNaN(n) ? 0 : n; };
function fmtD(d?: string) {
  if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}
function genWeeks(startISO?: string, endISO?: string): string[] {
  if (!startISO || !endISO) return [];
  const out: string[] = []; let d = new Date(startISO + 'T00:00:00'); const end = new Date(endISO + 'T00:00:00');
  let g = 0;
  while (d <= end && g < 60) { out.push(d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short' })); d = new Date(d.getTime() + 7 * 86400000); g++; }
  return out;
}

// ── Job modal ──
function JobModal({ initial, onClose }: { initial?: Job; onClose: () => void }) {
  const [f, setF] = useState<Partial<Job>>({ company: '', role: '', location: '', source: 'LinkedIn', status: 'Applied', ote: '', nextStep: '', contact: '', notes: '', interviewDate: '', ...initial });
  const upd = (p: Partial<Job>) => setF(v => ({ ...v, ...p }));
  const save = () => { if (!f.company?.trim()) return; saveJob({ id: initial?.id || uid(), company: f.company!, role: f.role || '', location: f.location || '', source: f.source || 'LinkedIn', status: f.status || 'Applied', ote: f.ote || '', nextStep: f.nextStep || '', contact: f.contact || '', notes: f.notes || '', interviewDate: f.interviewDate }); onClose(); };
  const I = ({ k, ph }: { k: keyof Job; ph?: string }) => <input className="form-input" placeholder={ph} value={f[k] as string || ''} onChange={e => upd({ [k]: e.target.value } as Partial<Job>)} />;
  return (
    <Modal title={initial ? 'Edit job' : 'Add job'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}><div><label className="form-label">Company</label><I k="company" ph="Cloudflare" /></div><div><label className="form-label">Role</label><I k="role" ph="SDR / BDR" /></div></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}><div><label className="form-label">Location</label><I k="location" ph="Sydney, AU" /></div><div><label className="form-label">Source</label><I k="source" ph="LinkedIn, Referral…" /></div></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div><label className="form-label">Status</label><select className="form-select" value={f.status || 'Applied'} onChange={e => upd({ status: e.target.value })}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
          <div><label className="form-label">OTE</label><I k="ote" ph="$80–100k" /></div>
        </div>
        <div><label className="form-label">Next step</label><I k="nextStep" ph="Follow up by…" /></div>
        <div><label className="form-label">Contact</label><I k="contact" ph="Name · email / LinkedIn" /></div>
        <div><label className="form-label">Interview date → calendar</label><input className="form-input" type="date" value={f.interviewDate || ''} onChange={e => upd({ interviewDate: e.target.value })} /></div>
        <div><label className="form-label">Notes</label><textarea className="form-input" placeholder="Any context, referral info…" value={f.notes || ''} onChange={e => upd({ notes: e.target.value })} style={{ minHeight: 72, resize: 'vertical' }} /></div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}><button onClick={onClose} style={cancelBtn}>Cancel</button><button onClick={save} className="coral-btn" style={addBtn}>{initial ? 'Save changes' : 'Add job'}</button></div>
      </div>
    </Modal>
  );
}

// ── Outreach modal ──
function OutreachModal({ initial, onClose }: { initial?: OutreachEntry; onClose: () => void }) {
  const [f, setF] = useState<Partial<OutreachEntry>>({ date: '', name: '', company: '', role: '', type: 'Connection Request', status: 'Awaiting', followup: '', referral: 'Maybe', notes: '', ...initial });
  const upd = (p: Partial<OutreachEntry>) => setF(v => ({ ...v, ...p }));
  const save = () => { if (!f.name?.trim()) return; saveOutreach({ id: initial?.id || uid(), date: f.date || '', name: f.name!, company: f.company || '', role: f.role || '', type: f.type || '', status: f.status || 'Awaiting', followup: f.followup || '', referral: f.referral || '', notes: f.notes || '' }); onClose(); };
  const I = ({ k, ph }: { k: keyof OutreachEntry; ph?: string }) => <input className="form-input" placeholder={ph} value={f[k] as string || ''} onChange={e => upd({ [k]: e.target.value } as Partial<OutreachEntry>)} />;
  return (
    <Modal title={initial ? 'Edit outreach' : 'Add outreach'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}><div><label className="form-label">Name</label><I k="name" ph="Jordan Lee" /></div><div><label className="form-label">Date</label><I k="date" ph="22 Jun" /></div></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}><div><label className="form-label">Company</label><I k="company" ph="Cloudflare" /></div><div><label className="form-label">Role</label><I k="role" ph="BDR, ANZ" /></div></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div><label className="form-label">Outreach type</label><select className="form-select" value={f.type} onChange={e => upd({ type: e.target.value })}>{['Connection Request', 'Message / InMail', 'Email', 'Comment', 'Referral ask', 'Other'].map(o => <option key={o}>{o}</option>)}</select></div>
          <div><label className="form-label">Status</label><select className="form-select" value={f.status} onChange={e => upd({ status: e.target.value })}>{['Awaiting', 'Replied', 'Booked', 'No response'].map(o => <option key={o}>{o}</option>)}</select></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div><label className="form-label">Follow-up</label><I k="followup" ph="29 Jun" /></div>
          <div><label className="form-label">Referral?</label><select className="form-select" value={f.referral} onChange={e => upd({ referral: e.target.value })}>{['Yes', 'Maybe', 'No'].map(o => <option key={o}>{o}</option>)}</select></div>
        </div>
        <div><label className="form-label">Notes</label><textarea className="form-input" placeholder="What happened, next step…" value={f.notes || ''} onChange={e => upd({ notes: e.target.value })} style={{ minHeight: 64, resize: 'vertical' }} /></div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
          {initial && <button onClick={() => { deleteOutreach(initial.id); onClose(); }} style={{ ...cancelBtn, color: '#D8431F', borderColor: '#F0CFC6', marginRight: 'auto' }}>Delete</button>}
          <button onClick={onClose} style={cancelBtn}>Cancel</button><button onClick={save} className="coral-btn" style={addBtn}>{initial ? 'Save' : 'Add outreach'}</button>
        </div>
      </div>
    </Modal>
  );
}

// ── Roofing week modal ──
function RoofingModal({ week, data, onClose }: { week: string; data: RoofingWeek; onClose: () => void }) {
  const [f, setF] = useState<RoofingWeek>({ ...data });
  const upd = (p: Partial<RoofingWeek>) => setF(v => ({ ...v, ...p }));
  const save = () => { saveRoofingWeek(week, f); onClose(); };
  const N = ({ k, label }: { k: keyof RoofingWeek; label: string }) => <div><label className="form-label">{label}</label><input className="form-input" type="number" value={f[k] || ''} onChange={e => upd({ [k]: e.target.value } as Partial<RoofingWeek>)} /></div>;
  return (
    <Modal title={`Week of ${week}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}><N k="calls" label="Calls made" /><N k="booked" label="Appointments booked" /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}><N k="held" label="Appointments held" /><N k="sent" label="Proposals sent" /></div>
        <N k="won" label="Proposals won" />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}><button onClick={onClose} style={cancelBtn}>Cancel</button><button onClick={save} className="coral-btn" style={addBtn}>Save week</button></div>
      </div>
    </Modal>
  );
}

function MetricCard({ title, rows }: { title: string; rows: { label: string; value: string | number; accent?: boolean }[] }) {
  return (
    <div className="card" style={{ padding: '20px 22px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14 }}>{title}</div>
      {rows.map((r, i) => (
        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '10px 0', borderTop: i > 0 ? '1px solid var(--line-3)' : undefined }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2b)' }}>{r.label}</span>
          <span className="scc-num" style={{ fontSize: r.accent ? 18 : 16, fontWeight: r.accent ? 800 : 700, color: r.accent ? '#F5552E' : 'var(--ink)' }}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function JobsPage() {
  const [tab, setTab] = useState<Tab>('pipeline');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [outreach, setOutreach] = useState<OutreachEntry[]>([]);
  const [roofing, setRoofing] = useState<Record<string, RoofingWeek>>({});
  const [callStats, setCallStats] = useState({ calls: 0, appts: 0, revenue: 0 });
  const [planStart, setPlanStart] = useState(''); const [planEnd, setPlanEnd] = useState('');
  const [jobOpen, setJobOpen] = useState(false); const [editJob, setEditJob] = useState<Job | null>(null);
  const [outOpen, setOutOpen] = useState(false); const [editOut, setEditOut] = useState<OutreachEntry | null>(null);
  const [editWeek, setEditWeek] = useState<string | null>(null);
  // AI job finder
  const [fCompanies, setFCompanies] = useState(''); const [fKeywords, setFKeywords] = useState(''); const [fLocation, setFLocation] = useState('');
  const [searching, setSearching] = useState(false); const [searchErr, setSearchErr] = useState('');
  const [results, setResults] = useState<Opening[]>([]); const [searched, setSearched] = useState(false);
  const [addedKeys, setAddedKeys] = useState<Set<string>>(new Set());

  const load = () => {
    setJobs(getJobs());
    setOutreach(getOutreach());
    setRoofing(getRoofing());
    const calls = getCalls();
    setCallStats({ calls: calls.length, appts: calls.filter(c => c.appointmentBooked).length, revenue: calls.reduce((s, c) => s + dollars(c.jobValue), 0) });
    const g = getGoals()[0];
    if (g?.phases?.length) {
      const starts = g.phases.map(p => p.startDate).filter(Boolean).sort();
      const ends = g.phases.map(p => p.endDate).filter(Boolean).sort();
      setPlanStart(starts[0] || ''); setPlanEnd(ends[ends.length - 1] || '');
    }
  };
  useEffect(() => {
    load();
    const s = getSettings();
    setFCompanies(s.targetCompanies || '');
    setFKeywords(s.targetRole || 'SDR, BDR, Account Executive');
    setFLocation(s.city || 'Sydney, Australia');
  }, []);

  const runSearch = async () => {
    setSearching(true); setSearchErr(''); setSearched(true);
    try {
      const res = await fetch('/api/job-search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companies: fCompanies, keywords: fKeywords, location: fLocation }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed.');
      setResults(Array.isArray(data.openings) ? data.openings : []);
    } catch (e: unknown) {
      setSearchErr(e instanceof Error ? e.message : 'Search failed. Please try again.');
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const addOpening = (o: Opening) => {
    const key = `${o.company}|${o.role}`.toLowerCase();
    saveJob({
      id: uid(), company: o.company, role: o.role, location: o.location, source: o.source || 'AI search',
      status: 'Researching', ote: '', nextStep: o.url ? 'Apply' : '', contact: '',
      notes: [o.summary, o.url ? `Apply: ${o.url}` : ''].filter(Boolean).join('\n'),
    });
    setAddedKeys(prev => new Set(prev).add(key));
    load();
  };

  const pipeline = jobs.filter(j => !['Rejected', 'Closed'].includes(j.status));
  const interviewPlus = jobs.filter(j => ['Interview', 'Final Round', 'Offer'].includes(j.status)).length;
  const offers = jobs.filter(j => j.status === 'Offer').length;
  const rate = (a: number, b: number) => b ? `${Math.round(a / b * 100)}%` : '0%';
  const replied = outreach.filter(o => o.status === 'Replied' || o.status === 'Booked').length;
  const referrals = outreach.filter(o => o.referral === 'Yes').length;
  const weeks = genWeeks(planStart, planEnd);
  const planWindow = planStart && planEnd ? `${fmtD(planStart)} – ${fmtD(planEnd)}` : '';

  // roofing totals
  const rt = weeks.reduce((acc, w) => { const d = roofing[w]; if (d) { acc.calls += num(d.calls); acc.booked += num(d.booked); acc.held += num(d.held); acc.sent += num(d.sent); acc.won += num(d.won); } return acc; }, { calls: 0, booked: 0, held: 0, sent: 0, won: 0 });

  const counts: Record<Tab, { n: number | string; label: string }> = {
    pipeline: { n: jobs.length, label: 'roles' }, find: { n: results.length, label: 'found' }, dashboard: { n: jobs.length, label: 'tracked' }, targets: { n: SEED_TARGETS.length, label: 'companies' },
    outreach: { n: outreach.length, label: 'contacts' }, applications: { n: jobs.length, label: 'apps' }, roofing: { n: weeks.length, label: 'weeks' },
  };
  const kicker: Record<Tab, string> = {
    pipeline: 'Job Search · Pipeline', find: 'Job Search · AI Finder', dashboard: 'Job Search · Dashboard', targets: 'Job Search · Target Companies',
    outreach: 'Job Search · Outreach Tracker', applications: 'Job Search · Application Tracker', roofing: 'Job Search · Roofing Metrics',
  };
  const headerAdd = () => tab === 'outreach' ? setOutOpen(true) : setJobOpen(true);
  const headerAddLabel = tab === 'outreach' ? '+ Add outreach' : '+ Add job';

  return (
    <div>
      <div className="page-head" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}>{kicker[tab]}</div>
          <div className="page-title">Job Tracker</div>
        </div>
        <div className="page-head-actions" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div className="page-head-meta" style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="scc-num" style={{ fontWeight: 300, fontSize: 52, color: '#F5552E' }}>{counts[tab].n}</span>
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--muted)' }}>{counts[tab].label}</span>
          </div>
          <button onClick={headerAdd} className="coral-btn" style={{ height: 50, padding: '0 24px', fontSize: 15, boxShadow: '0 8px 22px rgba(245,85,46,.28)' }}>{headerAddLabel}</button>
        </div>
      </div>

      <div className="scroll-x" style={{ display: 'flex', borderBottom: '1px solid var(--line)', marginBottom: 22 }}>
        {TABS.map(t => <button key={t.key} className={`tab-btn${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>

      {/* PIPELINE */}
      {tab === 'pipeline' && (jobs.length === 0 ? <EmptyState onAdd={() => setJobOpen(true)} /> : (
        <div className="card">
          {pipeline.map((j, i) => (
            <div key={j.id} style={{ display: 'grid', gridTemplateColumns: '44px 1fr auto', gap: 18, alignItems: 'center', padding: '18px 24px', borderTop: i > 0 ? '1px solid var(--line-3)' : undefined }}>
              <div className="scc-num" style={{ fontWeight: 600, fontSize: 15, color: 'var(--muted-3)' }}>{String(i + 1).padStart(2, '0')}</div>
              <div><div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-.01em' }}>{j.company}</div><div style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)', marginTop: 2 }}>{[j.role, j.location].filter(Boolean).join(' · ')}</div></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={pillStyle(j.status) as React.CSSProperties}>{j.status}</div><DotMenu actions={[{ label: 'Edit', onClick: () => setEditJob(j) }, { label: 'Delete', onClick: () => { deleteJob(j.id); load(); }, danger: true }]} /></div>
            </div>
          ))}
        </div>
      ))}

      {/* FIND JOBS (AI) */}
      {tab === 'find' && (
        <div>
          {/* Dark intro banner */}
          <div style={{ background: 'var(--fill-dark)', borderRadius: 18, padding: '22px 24px', color: '#fff', marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', marginBottom: 8 }}>AI job finder</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,.8)', lineHeight: 1.6, maxWidth: 760 }}>
              Tell it the companies you want and the kind of role, and it searches the web for current openings. Add the good ones straight to your pipeline.
            </div>
          </div>

          {/* Search form */}
          <div className="card" style={{ padding: '20px 22px', marginBottom: 18 }}>
            <div className="grid-2up" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div><label className="form-label">Companies</label><input className="form-input" placeholder="Cloudflare, Datadog, Snowflake…" value={fCompanies} onChange={e => setFCompanies(e.target.value)} /></div>
              <div><label className="form-label">Role types / keywords</label><input className="form-input" placeholder="SDR, BDR, Account Executive" value={fKeywords} onChange={e => setFKeywords(e.target.value)} /></div>
            </div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}><label className="form-label">Location</label><input className="form-input" placeholder="Sydney, Australia" value={fLocation} onChange={e => setFLocation(e.target.value)} /></div>
              <button onClick={runSearch} disabled={searching} className="coral-btn" style={{ height: 46, padding: '0 26px', fontSize: 15, opacity: searching ? .65 : 1 }}>
                {searching ? 'Searching the web…' : 'Search jobs'}
              </button>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 12, lineHeight: 1.5 }}>
              Live web search — a run can take 20–60 seconds. Listings are AI-gathered, so confirm details on the company&apos;s own page before applying.
            </div>
          </div>

          {searchErr && (
            <div style={{ background: '#FFF3CD', border: '1px solid #F5DFA0', borderRadius: 12, padding: '14px 18px', fontSize: 13, color: '#8A6D00', marginBottom: 18 }}>{searchErr}</div>
          )}

          {searching ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card" style={{ padding: '20px 22px', height: 104, background: 'linear-gradient(90deg,var(--card-3) 0%,var(--card-2) 50%,var(--card-3) 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
              ))}
            </div>
          ) : results.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {results.map((o, i) => {
                const key = `${o.company}|${o.role}`.toLowerCase();
                const added = addedKeys.has(key);
                return (
                  <div key={i} className="card" style={{ padding: '18px 22px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 220 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                          <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-.01em' }}>{o.company}</span>
                          {o.source && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-2)' }}>· {o.source}</span>}
                          {o.posted && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-2)' }}>· {o.posted}</span>}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-2)' }}>{o.role}</div>
                        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 1 }}>{o.location}</div>
                        {o.summary && <div style={{ fontSize: 13, color: 'var(--ink-2b)', lineHeight: 1.55, marginTop: 8 }}>{o.summary}</div>}
                        {o.url && <a href={o.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 8, fontSize: 12.5, fontWeight: 700, color: 'var(--accent-ink)', textDecoration: 'none' }}>Open listing ↗</a>}
                      </div>
                      <button
                        onClick={() => addOpening(o)}
                        disabled={added}
                        className={added ? '' : 'coral-btn'}
                        style={added
                          ? { height: 40, padding: '0 16px', fontSize: 13, borderRadius: 11, border: '1px solid var(--line-2)', background: 'var(--card)', color: 'var(--muted)', fontWeight: 700, fontFamily: 'inherit', cursor: 'default', whiteSpace: 'nowrap' }
                          : { height: 40, padding: '0 18px', fontSize: 13, borderRadius: 11, whiteSpace: 'nowrap' }}
                      >
                        {added ? '✓ Added' : '+ Add to pipeline'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : searched ? (
            <div className="card" style={{ padding: '48px 40px', textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>No openings found</div>
              <div style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 420, margin: '0 auto', lineHeight: 1.55 }}>Nothing matched this run. Try fewer companies, broader keywords, or a wider location — then search again.</div>
            </div>
          ) : (
            <div className="card" style={{ padding: '48px 40px', textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Search for openings</div>
              <div style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 420, margin: '0 auto', lineHeight: 1.55 }}>Your target companies and role are pre-filled from Settings — tweak them above and hit <strong style={{ color: 'var(--ink-2)' }}>Search jobs</strong>.</div>
            </div>
          )}
        </div>
      )}

      {/* DASHBOARD */}
      {tab === 'dashboard' && (
        <div>
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 20px', marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: '#F5552E' }} /><span style={{ fontWeight: 700, fontSize: 14 }}>Plan window</span><span style={{ fontSize: 13, color: 'var(--muted)' }}>{planWindow || '—'}</span></div>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Updates from the tabs — keep them current.</span>
          </div>
          <div className="grid-2up" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, alignItems: 'start' }}>
            <MetricCard title="Outreach & Networking" rows={[
              { label: 'Total contacts logged', value: outreach.length }, { label: 'Replies / conversations', value: replied },
              { label: 'Response rate', value: rate(replied, outreach.length), accent: true }, { label: 'Calls / coffee chats done', value: outreach.filter(o => o.status === 'Booked').length }, { label: 'Referrals secured', value: referrals },
            ]} />
            <MetricCard title="Applications" rows={[
              { label: 'Total roles tracked', value: jobs.length }, { label: 'Active in pipeline', value: pipeline.length },
              { label: 'Reached interview stage+', value: interviewPlus }, { label: 'Offers', value: offers }, { label: 'Interview rate', value: rate(interviewPlus, jobs.length), accent: true },
            ]} />
            <MetricCard title="Roofing Performance" rows={[
              { label: 'Total calls made', value: rt.calls || callStats.calls }, { label: 'Appointments booked', value: rt.booked || callStats.appts },
              { label: 'Booking rate', value: rate(rt.booked || callStats.appts, rt.calls || callStats.calls), accent: true }, { label: 'Appointments held', value: rt.held }, { label: 'Show rate', value: rate(rt.held, rt.booked) },
              { label: 'Proposals sent', value: rt.sent }, { label: 'Proposals won', value: rt.won }, { label: 'Revenue generated (AUD)', value: `$${callStats.revenue.toLocaleString('en-AU')}` },
            ]} />
          </div>
        </div>
      )}

      {/* TARGETS */}
      {tab === 'targets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {SEED_TARGETS.map(t => (
            <div key={t.company} className="card" style={{ padding: '22px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-.01em' }}>{t.company}</span>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--accent-ink)', background: 'var(--accent-soft)', padding: '3px 10px', borderRadius: 999 }}>{t.tierLabel}</span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 11px', borderRadius: 999, ...(t.hiringTone === 'active' ? { color: '#F5552E', border: '1px solid #F5552E', background: 'transparent' } : { color: 'var(--muted)', background: 'var(--card-3)' }) }}>{t.hiring}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 28px' }}>
                <div><div style={subLabel}>What they sell · who buys</div><div style={subText}>{t.sells}</div></div>
                <div><div style={subLabel}>Interview prep focus</div><div style={subText}>{t.prep}</div></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* OUTREACH */}
      {tab === 'outreach' && (outreach.length === 0 ? (
        <div className="card" style={{ padding: '52px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 19 }}>No outreach logged yet</div>
          <div style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 380, lineHeight: 1.5 }}>Track every connection request, InMail and referral ask — replies and referrals roll up into the Dashboard.</div>
          <button onClick={() => setOutOpen(true)} className="coral-btn" style={{ height: 46, padding: '0 22px', fontSize: 14, marginTop: 4 }}>+ Add outreach</button>
        </div>
      ) : (
        <>
          <div className="card hidden md:block">
            <div style={{ display: 'grid', gridTemplateColumns: '34px 60px 1.6fr 1.2fr 1.1fr 110px', gap: 14, padding: '13px 22px', background: 'var(--card-2)', borderTopLeftRadius: 18, borderTopRightRadius: 18, fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              <div>#</div><div>Date</div><div>Contact</div><div>Outreach</div><div>Follow-up · ref</div><div>Status</div>
            </div>
            {outreach.map((o, i) => (
              <div key={o.id} onClick={() => setEditOut(o)} style={{ padding: '15px 22px', borderTop: '1px solid var(--line-3)', cursor: 'pointer' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '34px 60px 1.6fr 1.2fr 1.1fr 110px', gap: 14, alignItems: 'center' }}>
                  <div className="scc-num" style={{ fontWeight: 600, color: 'var(--muted-3)', fontSize: 14 }}>{String(i + 1).padStart(2, '0')}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{o.date}</div>
                  <div><div style={{ fontWeight: 700, fontSize: 15 }}>{o.name}</div><div style={{ fontSize: 12, color: 'var(--muted)' }}>{[o.company, o.role].filter(Boolean).join(' · ')}</div></div>
                  <div style={{ fontSize: 13, color: 'var(--ink-2b)' }}>{o.type}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-2b)' }}>{[o.followup, o.referral].filter(Boolean).join(' · ')}</div>
                  <div style={pillStyle(o.status, OUTREACH_PILL) as React.CSSProperties}>{o.status}</div>
                </div>
                {o.notes && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8, paddingLeft: 48 }}>{o.notes}</div>}
              </div>
            ))}
          </div>
          <div className="only-mobile" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {outreach.map(o => (
              <div key={o.id} onClick={() => setEditOut(o)} className="card" style={{ padding: '16px 18px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}><span style={{ fontWeight: 700, fontSize: 16 }}>{o.name}</span><span style={pillStyle(o.status, OUTREACH_PILL) as React.CSSProperties}>{o.status}</span></div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>{[o.company, o.role].filter(Boolean).join(' · ')}</div>
                <div style={{ display: 'flex', gap: 26 }}><div><div style={subLabel}>Outreach</div><div style={{ fontSize: 13, fontWeight: 600 }}>{o.type}</div></div><div><div style={subLabel}>Follow-up</div><div style={{ fontSize: 13, fontWeight: 600 }}>{o.followup || '—'}</div></div></div>
                {o.notes && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 10, lineHeight: 1.5 }}>{o.notes}</div>}
              </div>
            ))}
          </div>
        </>
      ))}

      {/* APPLICATIONS */}
      {tab === 'applications' && (jobs.length === 0 ? <EmptyState onAdd={() => setJobOpen(true)} /> : (
        <>
          <div className="card hidden md:block">
            <div style={{ display: 'grid', gridTemplateColumns: '34px 1.7fr 1fr 1fr auto 50px', gap: 16, padding: '13px 22px', background: 'var(--card-2)', borderTopLeftRadius: 18, borderTopRightRadius: 18, fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              <div>#</div><div>Role</div><div>Location · source</div><div>OTE</div><div>Status</div><div></div>
            </div>
            {jobs.map((j, i) => (
              <div key={j.id} style={{ padding: '16px 22px', borderTop: '1px solid var(--line-3)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '34px 1.7fr 1fr 1fr auto 50px', gap: 16, alignItems: 'center' }}>
                  <div className="scc-num" style={{ fontWeight: 600, color: 'var(--muted-3)', fontSize: 14 }}>{String(i + 1).padStart(2, '0')}</div>
                  <div><div style={{ fontWeight: 700, fontSize: 15 }}>{j.company}</div><div style={{ fontSize: 12, color: 'var(--muted)' }}>{j.role}</div></div>
                  <div><div style={{ fontSize: 13, color: 'var(--ink-2b)' }}>{j.location}</div><div style={{ fontSize: 11, color: 'var(--muted-2)' }}>{j.source}</div></div>
                  <div className="scc-num" style={{ fontSize: 13, color: 'var(--ink-2b)' }}>{j.ote || '—'}</div>
                  <div style={pillStyle(j.status) as React.CSSProperties}>{j.status}</div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}><DotMenu actions={[{ label: 'Edit', onClick: () => setEditJob(j) }, { label: 'Delete', onClick: () => { deleteJob(j.id); load(); }, danger: true }]} /></div>
                </div>
                {(j.nextStep || j.contact || j.notes) && (
                  <div style={{ display: 'flex', gap: '7px 22px', marginTop: 10, paddingLeft: 50, flexWrap: 'wrap' }}>
                    {j.nextStep && <div style={{ fontSize: 12, color: 'var(--muted)' }}><span style={{ fontWeight: 700, color: 'var(--ink-2b)' }}>Next:</span> {j.nextStep}</div>}
                    {j.contact && <div style={{ fontSize: 12, color: 'var(--muted)' }}><span style={{ fontWeight: 700, color: 'var(--ink-2b)' }}>Contact:</span> {j.contact}</div>}
                    {j.notes && <div style={{ fontSize: 12, color: 'var(--muted)', flex: 1, minWidth: 220 }}><span style={{ fontWeight: 700, color: 'var(--ink-2b)' }}>Notes:</span> {j.notes}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="only-mobile" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {jobs.map(j => (
              <div key={j.id} onClick={() => setEditJob(j)} className="card" style={{ padding: '16px 18px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}><span style={{ fontWeight: 700, fontSize: 16, flex: 1 }}>{j.company}</span><span style={pillStyle(j.status) as React.CSSProperties}>{j.status}</span></div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>{[j.role, j.location].filter(Boolean).join(' · ')}</div>
                <div style={{ display: 'flex', gap: 26 }}>{j.nextStep && <div><div style={subLabel}>Next</div><div style={{ fontSize: 13, fontWeight: 600 }}>{j.nextStep}</div></div>}{j.ote && <div><div style={subLabel}>OTE</div><div style={{ fontSize: 13, fontWeight: 600 }}>{j.ote}</div></div>}</div>
              </div>
            ))}
          </div>
        </>
      ))}

      {/* ROOFING */}
      {tab === 'roofing' && (
        <div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.5, maxWidth: 720 }}>Cumulative roofing performance — your live proof points for interviews. Booking, show and close rates calculate from the weekly numbers. Tap a week to fill it in.</div>
          <div className="card hidden md:block">
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr', gap: 10, padding: '13px 22px', background: 'var(--card-2)', borderTopLeftRadius: 18, borderTopRightRadius: 18, fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              <div>Week starting</div><div>Calls</div><div>Booked</div><div>Book rate</div><div>Held</div><div>Show rate</div><div>Sent</div><div>Won</div>
            </div>
            {weeks.map(w => {
              const d = roofing[w] || { calls: '', booked: '', held: '', sent: '', won: '' };
              const has = d.calls || d.booked || d.held || d.sent || d.won;
              const br = num(d.calls) ? `${Math.round(num(d.booked) / num(d.calls) * 100)}%` : (has ? '0%' : '·');
              const sr = num(d.booked) ? `${Math.round(num(d.held) / num(d.booked) * 100)}%` : (has ? '—' : '·');
              const cell = (v: string) => has ? (v || '0') : '·';
              return (
                <div key={w} onClick={() => setEditWeek(w)} style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr', gap: 10, padding: '14px 22px', borderTop: '1px solid var(--line-3)', cursor: 'pointer', fontSize: 14, color: 'var(--ink-2)', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600 }}>{w}</div>
                  <div className="scc-num">{cell(d.calls)}</div><div className="scc-num">{cell(d.booked)}</div>
                  <div className="scc-num" style={{ color: has ? '#F5552E' : 'var(--muted-3)', fontWeight: has ? 700 : 400 }}>{br}</div>
                  <div className="scc-num">{cell(d.held)}</div><div className="scc-num">{sr}</div><div className="scc-num">{cell(d.sent)}</div><div className="scc-num">{cell(d.won)}</div>
                </div>
              );
            })}
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr', gap: 10, padding: '16px 22px', borderTop: '2px solid var(--line)', fontSize: 14, fontWeight: 700 }}>
              <div style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: '.06em', color: 'var(--muted)' }}>Total / overall</div>
              <div className="scc-num">{rt.calls}</div><div className="scc-num">{rt.booked}</div>
              <div className="scc-num" style={{ color: '#F5552E' }}>{rate(rt.booked, rt.calls)}</div>
              <div className="scc-num">{rt.held}</div><div className="scc-num">{rate(rt.held, rt.booked)}</div><div className="scc-num">{rt.sent}</div><div className="scc-num">{rt.won}</div>
            </div>
          </div>
          <div className="only-mobile" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {weeks.map(w => {
              const d = roofing[w] || { calls: '', booked: '', held: '', sent: '', won: '' };
              const has = d.calls || d.booked || d.held || d.sent || d.won;
              const br = num(d.calls) ? `${Math.round(num(d.booked) / num(d.calls) * 100)}%` : '·';
              return (
                <div key={w} onClick={() => setEditWeek(w)} className="card" style={{ padding: '14px 18px', cursor: 'pointer' }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{w}</div>
                  <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                    {[['Calls', d.calls], ['Booked', d.booked], ['Book rate', has ? br : ''], ['Held', d.held], ['Won', d.won]].map(([l, v]) => (
                      <div key={l}><div style={subLabel}>{l}</div><div className="scc-num" style={{ fontSize: 15, fontWeight: 700, color: l === 'Book rate' && has ? '#F5552E' : 'var(--ink)' }}>{has ? (v || '0') : '·'}</div></div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(jobOpen || editJob) && <JobModal initial={editJob || undefined} onClose={() => { setJobOpen(false); setEditJob(null); load(); }} />}
      {(outOpen || editOut) && <OutreachModal initial={editOut || undefined} onClose={() => { setOutOpen(false); setEditOut(null); load(); }} />}
      {editWeek && <RoofingModal week={editWeek} data={roofing[editWeek] || { calls: '', booked: '', held: '', sent: '', won: '' }} onClose={() => { setEditWeek(null); load(); }} />}
    </div>
  );
}

const subLabel: React.CSSProperties = { fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 4 };
const subText: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', lineHeight: 1.5 };
const cancelBtn: React.CSSProperties = { padding: '11px 22px', borderRadius: 12, border: '1px solid var(--line-2)', background: 'var(--card)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 };
const addBtn: React.CSSProperties = { height: 44, padding: '0 24px', fontSize: 14, borderRadius: 12 };

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="card" style={{ padding: '56px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-.02em' }}>No jobs tracked yet</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--muted)', maxWidth: 340, lineHeight: 1.5 }}>Add the roles you&apos;re applying to — pipeline, status, OTE, next steps, and interview dates all land on the calendar.</div>
      <button onClick={onAdd} className="coral-btn" style={{ height: 46, padding: '0 22px', fontSize: 14, marginTop: 4 }}>+ Add your first job</button>
    </div>
  );
}
