import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

interface DrillFeedback {
  score: number;
  summary: string;
  acknowledge: { met: boolean; note: string };
  reframe: { met: boolean; note: string };
  close: { met: boolean; note: string };
}

const FALLBACK: DrillFeedback = {
  score: 0,
  summary: "AI scoring isn't available right now — self-assess instead: did you acknowledge, reframe, and close?",
  acknowledge: { met: false, note: 'Did you validate what they said before responding?' },
  reframe: { met: false, note: 'Did you offer a new angle rather than just defending?' },
  close: { met: false, note: 'Did you ask for a next step at the end?' },
};

export async function POST(req: NextRequest) {
  try {
    const { objection, response } = await req.json() as { objection: string; response: string };
    if (!objection?.trim() || !response?.trim()) {
      return NextResponse.json({ error: 'Missing objection or response' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json(FALLBACK);

    const client = new Anthropic({ apiKey });

    const prompt = `You are a sales coach scoring an SDR's response to a cold-call objection, against the "acknowledge → reframe → close" rubric.

Objection the prospect raised: "${objection}"

The SDR's response: "${response}"

Score it against three criteria:
1. Acknowledge — did they validate the objection instead of arguing or ignoring it?
2. Reframe — did they shift the prospect's perspective or add new value/context, rather than just defending?
3. Close — did they move things forward (ask a question, propose a next step) rather than leaving it hanging?

Return ONLY valid JSON in this exact format, no other text:
{"score": <0-100 integer>, "summary": "<1-2 sentence overall verdict, direct and specific to what they actually wrote>", "acknowledge": {"met": <boolean>, "note": "<1 short sentence, specific>"}, "reframe": {"met": <boolean>, "note": "<1 short sentence, specific>"}, "close": {"met": <boolean>, "note": "<1 short sentence, specific>"}}`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = message.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') throw new Error('No text');

    const parsed = JSON.parse(textContent.text.replace(/```json\n?|\n?```/g, '').trim());
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Objection drill scoring error:', err);
    return NextResponse.json(FALLBACK);
  }
}
