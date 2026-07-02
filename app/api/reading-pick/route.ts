import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const FALLBACKS = [
  { title: 'The Sales Development Playbook', reason: 'A foundational read for SDRs — covers pipeline building, metrics, and the mindset shifts that separate top performers from the pack.' },
  { title: 'New Sales. Simplified.', reason: 'Mike Weinberg\'s no-nonsense guide to prospecting is considered required reading for anyone building a B2B pipeline from scratch.' },
  { title: 'Fanatical Prospecting', reason: 'Jeb Blount makes the case that consistent outreach beats talent every time — essential for staying motivated during a job search.' },
  { title: 'Gap Selling', reason: 'Keenan\'s problem-centric selling framework will help you interview better AND sell better once you land your SDR role.' },
  { title: 'The Challenger Sale', reason: 'Understanding how top reps reframe customer thinking will make you stand out in interviews and in early-stage calls.' },
];

export async function POST(req: NextRequest) {
  try {
    const { existing = [], role = 'SDR', categories = [] } = await req.json() as {
      existing: string[];
      role: string;
      categories: string[];
    };

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      const pick = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
      return NextResponse.json(pick);
    }

    const client = new Anthropic({ apiKey });

    const prompt = `You are a reading coach for someone preparing for a career as a Sales Development Representative (SDR/BDR) in tech.

Their target role: ${role || 'SDR'}
Their interest areas: ${categories.join(', ') || 'B2B sales, SaaS, tech'}
Books/resources they already have: ${existing.length ? existing.join(', ') : 'none yet'}

Recommend ONE book, article, podcast episode, or online resource they should engage with today. It should be:
- Directly relevant to breaking into B2B tech sales or excelling as an SDR
- Something they likely haven't read/heard (avoid what's already on their list)
- Actionable — they can start it today

Return ONLY valid JSON in this exact format, no other text:
{"title": "<title>", "reason": "<1-2 sentences on why this is the right pick for them right now>"}`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = message.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') throw new Error('No text');

    const parsed = JSON.parse(textContent.text.replace(/```json\n?|\n?```/g, '').trim());
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Reading pick error:', err);
    const pick = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
    return NextResponse.json(pick);
  }
}
