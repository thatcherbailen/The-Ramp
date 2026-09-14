'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Tab = 'basics' | 'objections' | 'mistakes' | 'frameworks';
const TABS: { key: Tab; label: string }[] = [
  { key: 'basics', label: 'Call basics' },
  { key: 'objections', label: 'Objections' },
  { key: 'mistakes', label: 'Common mistakes' },
  { key: 'frameworks', label: 'Frameworks & tips' },
];

// ── Call structure ──────────────────────────────────────────────────
const CALL_STEPS = [
  { n: '1', title: 'Opener', body: 'Say who you are in one breath and earn the next 30 seconds — not the whole meeting. Warmth beats polish. A quick “Hey, it’s ___ from ___ — have I caught you at an OK moment?” lands better than a rehearsed paragraph.' },
  { n: '2', title: 'Reason for the call', body: 'Give one clear, specific reason you’re calling them. Vague (“just reaching out”) gets brushed off; specific (“you requested a quote on our site”) buys attention. If it’s a warm/website lead, name that — it changes the whole tone.' },
  { n: '3', title: 'Discovery', body: 'Ask before you pitch. Good open questions get people talking about their situation and the problem behind the enquiry. You’re looking for the pain, the timeline, and who else is involved.' },
  { n: '4', title: 'Value, tied to what they said', body: 'Now — and only now — connect what you offer to the specific thing they just told you. “You mentioned X, so the part that matters for you is Y.” Skip the feature dump.' },
  { n: '5', title: 'The next step', body: 'Never end without one. Book the meeting, agree a follow-up date, or set the expectation for what happens next. A call with no next step is a call you’ll have to make again from scratch.' },
];

// ── Discovery questions ─────────────────────────────────────────────
const DISCOVERY = [
  { tag: 'Situation', qs: ['“Walk me through what you’ve got at the moment.”', '“What made you look into this now rather than six months ago?”'] },
  { tag: 'Problem', qs: ['“What’s the main thing you’d want to fix or improve?”', '“If nothing changed, what happens?”'] },
  { tag: 'Impact', qs: ['“How is that affecting you day to day?”', '“Roughly what’s it costing you — time, money, stress?”'] },
  { tag: 'Timing & people', qs: ['“Is this something you want sorted this month, this quarter, or just exploring?”', '“Who else would be part of a decision like this?”'] },
];

// ── Objection handling ──────────────────────────────────────────────
const OBJECTIONS = [
  { objection: '“Just send me some information.”', response: 'Happy to — so I send the right thing and not a brochure you’ll ignore, what’s the one problem you’d most want it to solve?' },
  { objection: '“We already use someone for that.”', response: 'Makes sense, most teams your size do. Out of curiosity, if there were one thing you’d improve about how it works today, what would it be?' },
  { objection: '“Now’s not a good time.”', response: 'Totally fair. Is it a bad week, or just not a priority right now? Depending on which, I’ll either follow up later or get out of your hair.' },
  { objection: '“It’s too expensive.”', response: 'I hear you. Is it more than you expected full stop, or is it about what you’d get for it? If I can show it pays for itself, is price still the blocker?' },
  { objection: '“I’m not interested.”', response: 'No worries — I might’ve caught you at the wrong angle. Can I ask, is it the timing, or just not something on your radar at all right now?' },
  { objection: '“I need to talk to my partner / team.”', response: 'Of course — that’s the right call. What do you think they’ll want to know? I’ll give you exactly that so you’re not stuck relaying it second-hand.' },
  { objection: '“Call me back next month.”', response: 'Can do. So I actually add value when I do — what would need to have changed by then for this to be worth a proper look?' },
  { objection: '“How did you get my number?”', response: 'Fair question — you popped a request in through our website for a quote. Did you still want a hand with that, or has it sorted itself since?' },
];

// ── Common mistakes ─────────────────────────────────────────────────
const MISTAKES = [
  { wrong: 'Pitching before you’ve asked anything', fix: 'Ask two or three questions first. People buy when they feel understood, not when they’re talked at.' },
  { wrong: 'Talking too much', fix: 'Aim to listen more than you speak. Silence after a question is your friend — let them fill it.' },
  { wrong: 'No clear reason for the call', fix: 'Lead with one specific reason. “Just reaching out” gets hung up on; “you asked for a quote” doesn’t.' },
  { wrong: 'Ending with no next step', fix: 'Always leave with a date, a meeting, or a clear “here’s what happens next.” Otherwise you start from zero next time.' },
  { wrong: 'Taking the first “no” literally', fix: 'The first objection is usually a reflex, not a decision. Acknowledge it, ask one question, and you’ll often find the real answer.' },
  { wrong: 'Reading a script word-for-word', fix: 'Know your beats, not your lines. A script you read sounds like a script; a script you’ve internalised sounds like a conversation.' },
  { wrong: 'Arguing with the objection', fix: 'Validate first, always. The moment it feels like a debate, you’ve lost. Acknowledge → reframe → redirect.' },
  { wrong: 'Not writing anything down', fix: 'Log the call while it’s fresh — the outcome, what worked, the next step. That’s the data that makes you better (and your Call Log fills the dashboard for you).' },
];

// ── Frameworks ──────────────────────────────────────────────────────
const FRAMEWORKS = [
  { name: 'The objection formula', steps: ['Acknowledge — validate what they said so it doesn’t feel like a fight.', 'Reframe — offer a different angle or a bit of context.', 'Redirect — a question or a next step that keeps it moving.'], note: 'Miss the acknowledge and every objection turns into an argument.' },
  { name: 'Call anatomy', steps: ['Opener → earn 30 seconds.', 'Reason → one specific why.', 'Discovery → questions before pitch.', 'Value → tied to what they said.', 'Next step → always.'], note: 'Same shape whether it’s a cold call or a warm website lead.' },
  { name: 'STAR (for interview stories)', steps: ['Situation — set the scene in a sentence.', 'Task — what you had to achieve.', 'Action — what you specifically did.', 'Result — the outcome, with a number if you have one.'], note: 'Bank 5–8 of these in Story Bank before you need them.' },
];

const TIPS = [
  { icon: '🎙', title: 'Say it out loud', body: 'Even if you’re typing a drill, mutter the answer first. Fluency under pressure is a spoken skill.' },
  { icon: '🔁', title: 'Redo the same scenario', body: 'Run the same call 3× back to back. The jump from attempt one to three is where the learning is.' },
  { icon: '✂️', title: 'Keep openers short', body: 'Earn the next 30 seconds, not the whole meeting. A crisp reason beats a polished paragraph.' },
  { icon: '❓', title: 'Ask before you pitch', body: 'Prospects open up when you’re curious and go quiet when you pitch early — same in a drill as in real life.' },
  { icon: '📚', title: 'Bank stories early', body: 'Write your STAR stories before the interview’s booked. Paste rough notes into Story Bank and let AI structure them.' },
  { icon: '📈', title: 'Watch the trend, not the day', body: 'A rough call or a low score is normal. What matters is the line going up across a week.' },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', margin: '4px 0 14px' }}>{children}</div>;
}

export default function HandbookPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('basics');

  return (
    <div>
      <div className="page-head" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}>Learn · Sales Handbook</div>
        <div className="page-title">Sales Handbook</div>
      </div>

      <div style={{ background: 'var(--fill-dark)', borderRadius: 18, padding: '22px 26px', color: '#fff', marginBottom: 22 }}>
        <div style={{ fontSize: 15, color: 'rgba(255,255,255,.82)', lineHeight: 1.6, maxWidth: 760 }}>
          The fundamentals of selling, in one place — how a call is structured, the questions that open people up, and the objections you’ll hear on repeat. Read a section before a drill, or dip in when a call didn’t go the way you wanted. New to the app itself? <button onClick={() => router.push('/guide')} style={{ background: 'none', border: 'none', padding: 0, color: '#fff', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15 }}>Start with How to Use The Ramp →</button>
        </div>
      </div>

      <div className="scroll-x" style={{ display: 'flex', borderBottom: '1px solid var(--line)', marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t.key} className={`tab-btn${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {/* ── CALL BASICS ── */}
      {tab === 'basics' && (
        <div>
          <SectionLabel>Anatomy of a call</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 34 }}>
            {CALL_STEPS.map(s => (
              <div key={s.n} className="card" style={{ padding: '20px 22px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 999, background: 'var(--accent-soft)', color: 'var(--accent-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15 }}>{s.n}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 16.5, letterSpacing: '-.01em', marginBottom: 5 }}>{s.title}</div>
                  <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.6 }}>{s.body}</div>
                </div>
              </div>
            ))}
          </div>

          <SectionLabel>Discovery questions that work</SectionLabel>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.5, maxWidth: 700 }}>Move top to bottom — situation, then the problem underneath it, then what it’s costing them, then timing and who decides. Steal these and make them your own.</div>
          <div className="grid-2up" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {DISCOVERY.map(d => (
              <div key={d.tag} className="card" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--accent-ink)', marginBottom: 10 }}>{d.tag}</div>
                {d.qs.map((q, i) => (
                  <div key={i} style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.55, marginBottom: i < d.qs.length - 1 ? 8 : 0 }}>{q}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── OBJECTIONS ── */}
      {tab === 'objections' && (
        <div>
          <SectionLabel>The formula</SectionLabel>
          <div className="card" style={{ padding: '20px 24px', marginBottom: 28, background: 'var(--card-2)' }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', fontSize: 15, fontWeight: 700 }}>
              <span style={{ color: 'var(--accent-ink)' }}>Acknowledge</span><span style={{ color: 'var(--muted-3)' }}>→</span>
              <span style={{ color: 'var(--accent-ink)' }}>Reframe</span><span style={{ color: 'var(--muted-3)' }}>→</span>
              <span style={{ color: 'var(--accent-ink)' }}>Redirect</span>
            </div>
            <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.6, marginTop: 10 }}>Validate what they said, offer a new angle, then a question or next step that keeps it moving. Skip the acknowledge and it feels like arguing.</div>
          </div>

          <SectionLabel>The objection bank</SectionLabel>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.5, maxWidth: 700 }}>Responses worth stealing for the objections you’ll hear again and again. Notice the pattern in every one — acknowledge, then a question that keeps the conversation alive.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {OBJECTIONS.map((q, i) => (
              <div key={i} className="card" style={{ padding: '18px 22px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 6 }}>They say</div>
                <div style={{ fontWeight: 700, fontSize: 15.5, marginBottom: 12 }}>{q.objection}</div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--accent-ink)', marginBottom: 6 }}>You say</div>
                <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6 }}>{q.response}</div>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginTop: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-2)' }}>Drill these live against an AI that pushes back.</div>
            <button onClick={() => router.push('/objections')} className="coral-btn" style={{ height: 42, padding: '0 20px', fontSize: 13.5, borderRadius: 11 }}>Open Objection Drill →</button>
          </div>
        </div>
      )}

      {/* ── COMMON MISTAKES ── */}
      {tab === 'mistakes' && (
        <div>
          <SectionLabel>The traps to avoid</SectionLabel>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.5, maxWidth: 700 }}>The mistakes that quietly cost reps the most calls — and the one-line fix for each.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {MISTAKES.map((m, i) => (
              <div key={i} className="card" style={{ padding: '18px 22px' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                  <span style={{ color: 'var(--accent-ink)', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>✗</span>
                  <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-.01em' }}>{m.wrong}</div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', marginTop: 8, paddingLeft: 26 }}>
                  <span style={{ color: '#3F8F5B', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>Fix</span>
                  <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.6 }}>{m.fix}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FRAMEWORKS & TIPS ── */}
      {tab === 'frameworks' && (
        <div>
          <SectionLabel>Frameworks to keep in your back pocket</SectionLabel>
          <div className="grid-2up" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 34 }}>
            {FRAMEWORKS.map(f => (
              <div key={f.name} className="card" style={{ padding: '20px 22px' }}>
                <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-.01em', marginBottom: 12 }}>{f.name}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {f.steps.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'baseline' }}>
                      <span className="scc-num" style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-ink)', flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>{s}</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line-3)' }}>{f.note}</div>
              </div>
            ))}
          </div>

          <SectionLabel>Tips &amp; tricks</SectionLabel>
          <div className="grid-2up" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {TIPS.map(t => (
              <div key={t.title} className="card" style={{ padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 22, flexShrink: 0, lineHeight: 1.2 }}>{t.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 3 }}>{t.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.55 }}>{t.body}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', background: 'var(--card-2)', marginTop: 22 }}>
            <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5 }}>
              <span style={{ fontWeight: 700, color: 'var(--ink-2)' }}>Coming soon:</span> real stories from people working in tech sales — how they broke in and what they wish they’d known.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
