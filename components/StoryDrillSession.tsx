'use client';
import { useState } from 'react';
import Modal from './Modal';
import { logPracticeToday } from '@/lib/store';
import { Story } from '@/lib/types';

function pickStory(pool: Story[], excludeId?: string): Story {
  const options = pool.length > 1 ? pool.filter(s => s.id !== excludeId) : pool;
  return options[Math.floor(Math.random() * options.length)];
}

const RATINGS = [
  { key: 'rusty', label: 'Rusty', emoji: '🌱' },
  { key: 'ok', label: 'Pretty good', emoji: '👍' },
  { key: 'nailed', label: 'Nailed it', emoji: '🔥' },
];

export default function StoryDrillSession({ pool, onClose }: { pool: Story[]; onClose: () => void }) {
  const [current, setCurrent] = useState<Story>(() => pickStory(pool));
  const [revealed, setRevealed] = useState(false);
  const [rated, setRated] = useState(false);
  const [reps, setReps] = useState(0);

  const reveal = () => setRevealed(true);

  const rate = () => {
    setRated(true);
    setReps(r => r + 1);
    logPracticeToday();
  };

  const next = () => {
    setCurrent(pickStory(pool, current.id));
    setRevealed(false);
    setRated(false);
  };

  return (
    <Modal title="Story Recall Drill" onClose={onClose} width={620}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>Rep {reps + 1}</span>

        <div style={{ background: 'var(--fill-dark)', borderRadius: 16, padding: '24px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 10 }}>
            {current.question ? 'They ask' : 'Recall this story'}
          </div>
          <div style={{ fontSize: 19, fontWeight: 800, color: '#fff', lineHeight: 1.35 }}>
            {current.question ? `“${current.question.split(' · ')[0]}”` : current.title}
          </div>
          {!revealed && (
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', marginTop: 12, lineHeight: 1.5 }}>
              Say your answer out loud — situation, task, action, result — then reveal to check yourself.
            </div>
          )}
        </div>

        {!revealed ? (
          <button onClick={reveal} className="coral-btn" style={{ height: 48, fontSize: 15, borderRadius: 12, justifyContent: 'center' }}>Reveal story →</button>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px' }}>
              {[
                { label: 'Situation', text: current.situation },
                { label: 'Task / goal', text: current.task },
                { label: 'Action I took', text: current.action },
                { label: 'Result', text: current.result },
              ].map(b => (
                <div key={b.label}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 4 }}>{b.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', lineHeight: 1.5 }}>{b.text}</div>
                </div>
              ))}
            </div>

            {!rated ? (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 10 }}>How close was your recall?</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {RATINGS.map(r => (
                    <button key={r.key} onClick={rate} style={{ flex: 1, padding: '14px 10px', borderRadius: 12, border: '1px solid var(--line-2)', background: 'var(--card-2)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}>
                      <div style={{ fontSize: 22, marginBottom: 4 }}>{r.emoji}</div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{r.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={onClose} style={{ padding: '0 20px', height: 48, borderRadius: 12, border: '1px solid var(--line-2)', background: 'var(--card)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}>End session</button>
                <button onClick={next} className="coral-btn" style={{ flex: 1, height: 48, fontSize: 15, borderRadius: 12, justifyContent: 'center' }}>Next story →</button>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
