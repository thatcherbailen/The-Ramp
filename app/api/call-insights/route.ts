import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

interface Reflection {
  lead: string;
  outcome: string;
  confidence: number;
  worked: string;
  improve: string;
  notes: string;
}

interface InsightsResult {
  summary: string;
  strengths: { title: string; note: string }[];
  growth: { title: string; note: string }[];
}

export async function POST(req: NextRequest) {
  try {
    const { reflections } = await req.json() as { reflections: Reflection[] };
    if (!reflections?.length) return NextResponse.json({ error: 'No reflections yet' }, { status: 400 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Growth summary isn\'t available right now — check back once AI is configured.' }, { status: 503 });
    }

    const client = new Anthropic({ apiKey });

    // Compact the reflections into a readable block for the model.
    const block = reflections.map((r, i) => {
      const parts = [`Call ${i + 1} (${r.lead || 'lead'}, outcome: ${r.outcome}, confidence: ${r.confidence}/10)`];
      if (r.worked?.trim()) parts.push(`  Worked: ${r.worked.trim()}`);
      if (r.improve?.trim()) parts.push(`  To improve: ${r.improve.trim()}`);
      if (r.notes?.trim()) parts.push(`  Note: ${r.notes.trim()}`);
      return parts.join('\n');
    }).join('\n\n');

    const prompt = `You are a sales coach reviewing a rep's own reflections across several logged sales calls. Do NOT just repeat their notes back. Synthesise the RECURRING PATTERNS into a short, high-level summary of their core areas of growth and development.

Their call reflections:
${block}

Return ONLY valid JSON in this exact shape, no other text:
{"summary": "<2-3 sentence overview of where this rep is right now and the single most important thing to work on>", "strengths": [{"title": "<3-5 word theme>", "note": "<one sentence on the pattern you saw across calls>"}], "growth": [{"title": "<3-5 word theme>", "note": "<one sentence, framed as a coachable next step>"}]}

Rules:
- Identify THEMES, not individual events. Group similar points together.
- Give at most 3 strengths and at most 3 growth areas — only the ones that genuinely recur or matter most. Fewer is better than padding.
- Be specific and actionable, in second person ("you tend to…", "work on…").
- Base everything strictly on what's in the reflections — don't invent facts.`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 700,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = message.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') throw new Error('No text');

    const parsed = JSON.parse(textContent.text.replace(/```json\n?|\n?```/g, '').trim()) as InsightsResult;
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Call insights error:', err);
    return NextResponse.json({ error: 'Couldn\'t generate your growth summary just now — try again in a moment.' }, { status: 500 });
  }
}
