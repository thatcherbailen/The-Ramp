'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { logPracticeToday, logDrillResult, getDrillLog, deleteDrillLog, DrillResult } from '@/lib/store';
import StreakBadge from '@/components/StreakBadge';
import Modal from '@/components/Modal';
import DotMenu from '@/components/DotMenu';

interface Turn { role: 'prospect' | 'rep'; text: string }
interface Report { score: number; summary: string; strengths: string[]; improvements: string[] }

const SCENARIO_LABEL: Record<string, string> = { cold: 'Cold Call', discovery: 'Discovery Call', gauntlet: 'Objection Gauntlet' };

function timeAgo(ts?: number): string {
  if (!ts) return '';
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

function scoreColor(score: number): { bg: string; fg: string } {
  if (score >= 70) return { bg: 'var(--accent-soft)', fg: 'var(--accent-ink)' };
  if (score >= 40) return { bg: 'var(--card-3)', fg: 'var(--ink-2)' };
  return { bg: '#F5E3DE', fg: '#C24A24' };
}

// Read-only replay of a logged mock call — transcript + full report.
function CallDetailModal({ result, onClose }: { result: DrillResult; onClose: () => void }) {
  const d = result.detail || {};
  const sc = scoreColor(result.score);
  return (
    <Modal title={d.scenario || 'Mock Call'} onClose={onClose} width={640}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: sc.bg, color: sc.fg }}>
            <span style={{ fontWeight: 800, fontSize: 22, lineHeight: 1 }}>{result.score}</span>
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginTop: 2 }}>score</span>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 3 }}>{timeAgo(result.ts)}</div>
            <div style={{ fontSize: 14, color: 'var(--ink-2b)', lineHeight: 1.5 }}>{d.summary}</div>
          </div>
        </div>

        {(d.strengths?.length || d.improvements?.length) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#2E7D46', marginBottom: 8 }}>What worked</div>
              {(d.strengths || []).map((s, i) => <div key={i} style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, marginBottom: 7, paddingLeft: 14, position: 'relative' }}><span style={{ position: 'absolute', left: 0 }}>·</span>{s}</div>)}
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#C24A24', marginBottom: 8 }}>Work on next</div>
              {(d.improvements || []).map((s, i) => <div key={i} style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, marginBottom: 7, paddingLeft: 14, position: 'relative' }}><span style={{ position: 'absolute', left: 0 }}>·</span>{s}</div>)}
            </div>
          </div>
        )}

        {d.transcript?.length ? (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>Full conversation</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 340, overflowY: 'auto', padding: '2px 2px' }}>
              {d.transcript.map((t, i) => (
                <div key={i} style={{
                  maxWidth: '82%', alignSelf: t.role === 'rep' ? 'flex-end' : 'flex-start',
                  background: t.role === 'rep' ? 'var(--fill-dark)' : 'var(--card-3)',
                  color: t.role === 'rep' ? '#fff' : 'var(--ink)',
                  borderRadius: t.role === 'rep' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  padding: '10px 14px', fontSize: 13.5, lineHeight: 1.5,
                }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', opacity: .55, marginBottom: 3 }}>{t.role === 'rep' ? 'You' : 'Prospect'}</div>
                  {t.text}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

// Minimal typings for the Web Speech API — not in TS's dom lib.
interface SRAlternative { transcript: string }
interface SRResult { isFinal: boolean; 0: SRAlternative }
interface SREvent { results: { length: number; [i: number]: SRResult } }
interface SR {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: SREvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SRWindow = { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };

const SCENARIOS = [
  { key: 'cold', label: 'Cold Call', desc: 'They didn\'t expect your call. Earn attention fast, get to a next step.', emoji: '📞' },
  { key: 'discovery', label: 'Discovery Call', desc: 'A booked meeting. Ask good questions, uncover the real problem.', emoji: '🔍' },
  { key: 'gauntlet', label: 'Objection Gauntlet', desc: 'One objection after another. Stay calm, keep the call alive.', emoji: '🛡️' },
];

export default function RoleplayPage() {
  const [scenario, setScenario] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [hungUp, setHungUp] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<DrillResult[]>([]);
  const [detail, setDetail] = useState<DrillResult | null>(null);

  useEffect(() => {
    const refresh = () => setHistory(getDrillLog('mockcall'));
    refresh();
    window.addEventListener('scc:practice-logged', refresh);
    return () => window.removeEventListener('scc:practice-logged', refresh);
  }, []);

  // ── Voice mode ──────────────────────────────────────────────────
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const recogRef = useRef<SR | null>(null);
  const voiceModeRef = useRef(false);
  voiceModeRef.current = voiceMode;

  useEffect(() => {
    const w = window as unknown as SRWindow;
    const supported = !!(w.SpeechRecognition || w.webkitSpeechRecognition) && 'speechSynthesis' in window;
    setVoiceSupported(supported);
    setVoiceMode(supported); // default on where the browser can do it
    // Chrome loads voices asynchronously — poke the list so it's warm.
    if ('speechSynthesis' in window) window.speechSynthesis.getVoices();
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      recogRef.current?.abort();
    };
  }, []);

  const pickVoice = (): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    const lang = navigator.language || 'en-US';
    // Prefer higher-quality natural voices when the OS has them.
    return (
      voices.find(v => v.lang.startsWith(lang.slice(0, 2)) && /natural|premium|enhanced|google/i.test(v.name)) ||
      voices.find(v => v.lang === lang) ||
      voices.find(v => v.lang.startsWith('en')) ||
      voices[0]
    );
  };

  const speak = useCallback((text: string, onDone?: () => void) => {
    if (!('speechSynthesis' in window)) { onDone?.(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice();
    if (v) u.voice = v;
    u.rate = 1.04;
    u.onend = () => { setSpeaking(false); onDone?.(); };
    u.onerror = () => { setSpeaking(false); onDone?.(); };
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  }, []);

  const stopVoice = useCallback(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    recogRef.current?.abort();
    setSpeaking(false);
    setListening(false);
  }, []);

  // ── Chat flow ───────────────────────────────────────────────────
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns, busy]);

  const callApi = async (action: 'reply' | 'score', sc: string, history: Turn[]) => {
    const res = await fetch('/api/mock-call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, scenario: sc, history }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong — try again.');
    return data;
  };

  const startListening = useCallback(() => {
    const w = window as unknown as SRWindow;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;
    recogRef.current?.abort();
    const rec = new Ctor();
    recogRef.current = rec;
    rec.lang = navigator.language || 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    let final = '';
    rec.onresult = (e: SREvent) => {
      let interim = '';
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      setInput(final || interim);
    };
    rec.onend = () => {
      setListening(false);
      setInput('');
      if (final.trim()) sendLineRef.current(final.trim());
    };
    rec.onerror = (e) => {
      setListening(false);
      if (e.error === 'not-allowed') {
        setError('Microphone access was blocked — allow it in your browser, or type instead.');
        setVoiceMode(false);
      }
    };
    setInput('');
    setListening(true);
    rec.start();
  }, []);

  const afterProspectReply = useCallback((reply: string, hangup: boolean) => {
    if (voiceModeRef.current) {
      speak(reply, () => { if (!hangup) startListening(); });
    }
  }, [speak, startListening]);

  const sendLine = useCallback(async (text: string) => {
    if (!text.trim() || hungUp || !scenario) return;
    setTurns(prev => {
      const next: Turn[] = [...prev, { role: 'rep', text: text.trim() }];
      (async () => {
        setBusy(true);
        setError('');
        try {
          const data = await callApi('reply', scenario, next);
          setTurns([...next, { role: 'prospect', text: data.reply }]);
          if (data.hangup) setHungUp(true);
          afterProspectReply(data.reply, !!data.hangup);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Something went wrong — try again.');
        } finally {
          setBusy(false);
        }
      })();
      return next;
    });
    setInput('');
  }, [scenario, hungUp, afterProspectReply]);

  // recognition callbacks are created once per listen; route through a ref
  // so they always hit the latest sendLine.
  const sendLineRef = useRef(sendLine);
  sendLineRef.current = sendLine;

  const start = async (key: string) => {
    setScenario(key);
    setTurns([]);
    setReport(null);
    setHungUp(false);
    setError('');
    setBusy(true);
    try {
      const data = await callApi('reply', key, []);
      setTurns([{ role: 'prospect', text: data.reply }]);
      afterProspectReply(data.reply, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong — try again.');
      setScenario(null);
    } finally {
      setBusy(false);
    }
  };

  const endAndScore = async () => {
    if (busy || turns.filter(t => t.role === 'rep').length === 0 || !scenario) return;
    stopVoice();
    setBusy(true);
    setError('');
    try {
      const data = await callApi('score', scenario, turns);
      setReport(data);
      logDrillResult('mockcall', data.score, {
        scenario: SCENARIO_LABEL[scenario] || 'Mock Call',
        summary: data.summary,
        strengths: data.strengths,
        improvements: data.improvements,
        transcript: turns,
      });
      logPracticeToday();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong — try again.');
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    stopVoice();
    setScenario(null);
    setTurns([]);
    setReport(null);
    setHungUp(false);
    setError('');
  };

  const toggleVoice = () => {
    if (voiceMode) stopVoice();
    setVoiceMode(v => !v);
  };

  const repTurns = turns.filter(t => t.role === 'rep').length;
  const callStatus = speaking ? 'Prospect speaking…' : listening ? 'Listening — just talk' : hungUp ? 'Call ended' : 'Live';

  return (
    <div>
      <div className="page-head" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}>Prep · Live practice</div>
          <div className="page-title">Mock Call</div>
        </div>
        <div className="page-head-actions page-head-meta" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <StreakBadge compact />
        </div>
      </div>

      {!scenario ? (
        <>
          <div style={{ background: 'var(--fill-dark)', borderRadius: 18, padding: '22px 24px', color: '#fff', marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', marginBottom: 8 }}>How it works</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,.78)', lineHeight: 1.6, maxWidth: 780 }}>
              The AI plays a realistic prospect — it won&apos;t go easy on you. {voiceSupported ? 'With voice mode on, the prospect talks and you answer out loud, like a real call.' : 'Talk to it like a real call: earn attention, ask questions, handle the pushback.'} End the call whenever you like and get scored with specific feedback.
            </div>
          </div>

          {voiceSupported && (
            <div className="card" style={{ padding: '16px 20px', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>🎙 Voice mode</div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>The prospect speaks out loud, and your mic picks up your reply — speaking under pressure is the whole point.</div>
              </div>
              <button onClick={toggleVoice} style={{
                flexShrink: 0, width: 52, height: 30, borderRadius: 999, border: 'none', cursor: 'pointer', position: 'relative',
                background: voiceMode ? '#F5552E' : 'var(--line-2)', transition: 'background .15s',
              }}>
                <span style={{ position: 'absolute', top: 3, left: voiceMode ? 25 : 3, width: 24, height: 24, borderRadius: '50%', background: '#fff', transition: 'left .15s', boxShadow: '0 1px 4px rgba(0,0,0,.2)' }} />
              </button>
            </div>
          )}

          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14 }}>Pick a scenario</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {SCENARIOS.map(s => (
              <button key={s.key} onClick={() => start(s.key)} disabled={busy} className="card" style={{ padding: '26px 22px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', opacity: busy ? 0.6 : 1 }}>
                <div style={{ fontSize: 30, marginBottom: 12 }}>{s.emoji}</div>
                <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-.01em', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.55 }}>{s.desc}</div>
                <div style={{ marginTop: 14, fontSize: 12.5, fontWeight: 700, color: 'var(--accent-ink)' }}>{busy ? 'Connecting…' : 'Start call →'}</div>
              </button>
            ))}
          </div>
          {error && <div style={{ marginTop: 16, fontSize: 13, color: '#D8431F', background: 'var(--accent-soft)', padding: '12px 16px', borderRadius: 12 }}>{error}</div>}

          {history.length > 0 && (
            <div style={{ marginTop: 30 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14 }}>Recent calls</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {history.map(h => {
                  const sc = scoreColor(h.score);
                  return (
                    <div key={h.id} onClick={() => setDetail(h)} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', cursor: 'pointer' }}>
                      <div style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: sc.bg, color: sc.fg, fontWeight: 800, fontSize: 16 }}>{h.score}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14.5 }}>{h.detail?.scenario || 'Mock Call'}</div>
                        <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.detail?.summary || 'Tap to see the full call'}</div>
                      </div>
                      <span style={{ fontSize: 11.5, color: 'var(--muted-2)', flexShrink: 0 }}>{timeAgo(h.ts)}</span>
                      <div onClick={e => e.stopPropagation()}>
                        <DotMenu actions={[
                          { label: 'View', onClick: () => setDetail(h) },
                          { label: 'Delete', onClick: () => deleteDrillLog(h.id), danger: true },
                        ]} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : report ? (
        <div className="card" style={{ padding: '28px 28px', maxWidth: 720 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 22 }}>
            <div style={{
              width: 84, height: 84, borderRadius: '50%', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: report.score >= 70 ? 'var(--accent-soft)' : 'var(--card-3)',
              color: report.score >= 70 ? 'var(--accent-ink)' : 'var(--ink-2)',
            }}>
              <span style={{ fontWeight: 800, fontSize: 28, lineHeight: 1 }}>{report.score}</span>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginTop: 3 }}>score</span>
            </div>
            <div style={{ fontSize: 14.5, color: 'var(--ink-2b)', lineHeight: 1.55 }}>{report.summary}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#2E7D46', marginBottom: 8 }}>What worked</div>
              {report.strengths.map((s, i) => (
                <div key={i} style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, marginBottom: 8, paddingLeft: 14, position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0 }}>·</span>{s}
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#C24A24', marginBottom: 8 }}>Work on next</div>
              {report.improvements.map((s, i) => (
                <div key={i} style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, marginBottom: 8, paddingLeft: 14, position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0 }}>·</span>{s}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={reset} style={{ padding: '0 20px', height: 48, borderRadius: 12, border: '1px solid var(--line-2)', background: 'var(--card)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}>Back to scenarios</button>
            <button onClick={() => start(scenario)} className="coral-btn" style={{ flex: 1, height: 48, fontSize: 15, borderRadius: 12, justifyContent: 'center' }}>Run it again →</button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', height: 'min(640px, 70vh)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <span style={{ flexShrink: 0, width: 9, height: 9, borderRadius: '50%', background: hungUp ? 'var(--muted-2)' : listening ? '#F5552E' : '#2E7D46', animation: hungUp ? 'none' : 'pulse 1.6s infinite' }} />
              <span style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>{SCENARIOS.find(s => s.key === scenario)?.label}</span>
              <span style={{ fontSize: 12, color: listening ? 'var(--accent-ink)' : 'var(--muted)', fontWeight: listening ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{callStatus}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {voiceSupported && (
                <button onClick={toggleVoice} title={voiceMode ? 'Switch to typing' : 'Switch to voice'} style={{ height: 38, padding: '0 12px', borderRadius: 10, border: '1px solid var(--line-2)', background: voiceMode ? 'var(--accent-soft)' : 'var(--card)', color: voiceMode ? 'var(--accent-ink)' : 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700 }}>
                  🎙 {voiceMode ? 'On' : 'Off'}
                </button>
              )}
              <button onClick={endAndScore} disabled={busy || repTurns === 0} className="coral-btn" style={{ height: 38, padding: '0 16px', fontSize: 13, borderRadius: 10, opacity: busy || repTurns === 0 ? 0.5 : 1 }}>
                {busy ? '…' : 'End call & get scored'}
              </button>
            </div>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {turns.map((t, i) => (
              <div key={i} style={{
                maxWidth: '78%',
                alignSelf: t.role === 'rep' ? 'flex-end' : 'flex-start',
                background: t.role === 'rep' ? 'var(--fill-dark)' : 'var(--card-3)',
                color: t.role === 'rep' ? '#fff' : 'var(--ink)',
                borderRadius: t.role === 'rep' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                padding: '12px 16px', fontSize: 14, lineHeight: 1.5,
              }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', opacity: .55, marginBottom: 4 }}>{t.role === 'rep' ? 'You' : 'Prospect'}</div>
                {t.text}
              </div>
            ))}
            {listening && input && (
              <div style={{ maxWidth: '78%', alignSelf: 'flex-end', background: 'var(--card-3)', color: 'var(--muted)', borderRadius: '16px 16px 4px 16px', padding: '12px 16px', fontSize: 14, lineHeight: 1.5, fontStyle: 'italic' }}>
                {input}…
              </div>
            )}
            {busy && !report && (
              <div style={{ alignSelf: 'flex-start', background: 'var(--card-3)', borderRadius: '16px 16px 16px 4px', padding: '12px 18px', fontSize: 14, color: 'var(--muted)' }}>…</div>
            )}
            {hungUp && <div style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--muted)', padding: '6px 0' }}>The prospect ended the call — score it to see how you did.</div>}
          </div>

          {error && <div style={{ margin: '0 20px 12px', fontSize: 13, color: '#D8431F', background: 'var(--accent-soft)', padding: '10px 14px', borderRadius: 10 }}>{error}</div>}

          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--line)', display: 'flex', gap: 10 }}>
            {voiceSupported && voiceMode && (
              <button
                onClick={() => { if (listening) recogRef.current?.stop(); else if (!speaking && !busy && !hungUp) startListening(); }}
                disabled={speaking || busy || hungUp}
                title={listening ? 'Done talking — send' : 'Tap to talk'}
                style={{
                  flexShrink: 0, width: 48, height: 48, borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: 19,
                  background: listening ? '#F5552E' : 'var(--fill-dark)', color: '#fff',
                  animation: listening ? 'pulse 1.4s infinite' : 'none',
                  opacity: speaking || busy || hungUp ? 0.4 : 1,
                }}
              >🎙</button>
            )}
            <input
              className="form-input"
              placeholder={hungUp ? 'Call ended' : listening ? 'Listening — speak your line…' : voiceMode ? 'Tap the mic and talk, or type…' : 'Say your line…'}
              value={input}
              disabled={hungUp || listening}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendLine(input); }}
              style={{ flex: 1 }}
              autoFocus={!voiceMode}
            />
            <button onClick={() => sendLine(input)} disabled={!input.trim() || busy || hungUp || listening} className="coral-btn" style={{ height: 48, padding: '0 22px', fontSize: 14, borderRadius: 12, opacity: !input.trim() || busy || hungUp || listening ? 0.5 : 1 }}>Send</button>
          </div>
        </div>
      )}

      {detail && <CallDetailModal result={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
