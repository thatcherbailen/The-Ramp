'use client';
import { useRouter } from 'next/navigation';

const STEPS = [
  { n: '1', title: 'Run your first mock call', body: 'Open Mock Call, pick “Cold Call”, and just start talking — by voice or typing. The AI plays a real prospect that pushes back. Don’t overthink it; the first one is meant to be rough.', href: '/roleplay', cta: 'Open Mock Call' },
  { n: '2', title: 'Get scored & read the feedback', body: 'End the call any time to get a 0–100 score plus what worked and what to fix. The feedback is specific to what you actually said — that’s the part to act on.', href: '/roleplay', cta: null },
  { n: '3', title: 'Drill your weak spots', body: 'If objections tripped you up, head to Objection Drill for quick reps on just that. Build a Story Bank for interview questions while you’re at it.', href: '/objections', cta: 'Open Objection Drill' },
  { n: '4', title: 'Come back tomorrow', body: 'One rep a day builds your streak and your Readiness Score. Consistency beats cramming — five short sessions across a week beats one long one.', href: '/', cta: null },
];

const TIPS = [
  { icon: '🎙', title: 'Say it out loud', body: 'Even if you’re typing, mutter your answer first. The goal is fluency under pressure — reading a script silently doesn’t build that.' },
  { icon: '🔁', title: 'Redo the same scenario', body: 'Run the same cold call 3× in a row. You’ll feel the improvement between attempt one and three more than across three different scenarios.' },
  { icon: '📉', title: 'A low score early is normal', body: 'Most people land 40–60 on their first few calls. The number matters less than whether it’s trending up over a week.' },
  { icon: '🧭', title: 'Read your Readiness Score', body: 'It blends mock calls, objection drills, consistency and story depth. A low sub-score tells you exactly where to spend your next session.' },
  { icon: '🛡', title: 'Acknowledge → reframe → close', body: 'The objection formula: first validate what they said, then offer a new angle, then move to a next step. Miss the acknowledge and it feels like arguing.' },
  { icon: '❓', title: 'Ask before you pitch', body: 'On discovery calls, the AI opens up when you ask good questions and stays vague when you pitch too early. Same as real prospects.' },
  { icon: '✂️', title: 'Keep openers short', body: 'Earn the next 30 seconds, not the whole meeting. A crisp reason for the call beats a polished paragraph nobody asked for.' },
  { icon: '📚', title: 'Bank stories early', body: 'Write 5–8 STAR stories before you need them. Paste rough notes into Story Bank and let AI structure them, then drill recall.' },
];

const QUICK_WINS = [
  { objection: '“Just send me some information.”', response: 'Happy to — so I send the right thing and not a brochure you’ll ignore, what’s the one problem you’d most want it to solve?' },
  { objection: '“We already use someone for that.”', response: 'Makes sense, most teams your size do. Out of curiosity, if there were one thing you’d improve about how it works today, what would it be?' },
  { objection: '“Now’s not a good time.”', response: 'Totally fair. Is it a bad week, or just not a priority right now? Depending on which, I’ll either follow up later or get out of your hair.' },
];

export default function GuidePage() {
  const router = useRouter();
  return (
    <div>
      <div className="page-head" style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}>Getting started</div>
        <div className="page-title">How to use The Ramp</div>
      </div>

      {/* Intro banner */}
      <div style={{ background: 'var(--fill-dark)', borderRadius: 18, padding: '24px 26px', color: '#fff', marginBottom: 26 }}>
        <div style={{ fontSize: 15, color: 'rgba(255,255,255,.82)', lineHeight: 1.6, maxWidth: 760 }}>
          The Ramp is a place to <strong style={{ color: '#fff' }}>practice selling before it counts</strong> — mock calls with an AI prospect, quick objection drills, and interview prep, all scored so you can see yourself improve. Here’s how to get value in your first ten minutes.
        </div>
      </div>

      {/* Quick start */}
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14 }}>Quick start</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 34 }}>
        {STEPS.map(s => (
          <div key={s.n} className="card" style={{ padding: '20px 22px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 999, background: 'var(--accent-soft)', color: 'var(--accent-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15 }}>{s.n}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-.01em', marginBottom: 5 }}>{s.title}</div>
              <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.6 }}>{s.body}</div>
              {s.cta && (
                <button onClick={() => router.push(s.href)} className="coral-btn" style={{ height: 38, padding: '0 18px', fontSize: 13, borderRadius: 10, marginTop: 12 }}>{s.cta} →</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14 }}>Tips &amp; tricks</div>
      <div className="grid-2up" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 34 }}>
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

      {/* Objection quick-wins */}
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Objection quick-wins</div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.5, maxWidth: 680 }}>Three responses worth stealing. Notice the pattern — acknowledge, then a question that keeps the conversation going.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 30 }}>
        {QUICK_WINS.map((q, i) => (
          <div key={i} className="card" style={{ padding: '18px 22px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 6 }}>They say</div>
            <div style={{ fontWeight: 700, fontSize: 15.5, marginBottom: 12 }}>{q.objection}</div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--accent-ink)', marginBottom: 6 }}>You say</div>
            <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6 }}>{q.response}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '22px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', background: 'var(--card-2)' }}>
        <div style={{ fontSize: 14.5, fontWeight: 700 }}>That’s everything you need to start. The rest you’ll learn by doing.</div>
        <button onClick={() => router.push('/roleplay')} className="coral-btn" style={{ height: 46, padding: '0 24px', fontSize: 14.5, borderRadius: 12 }}>Run your first mock call →</button>
      </div>
    </div>
  );
}
