import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// One endpoint, two actions:
//  - reply: given the scenario + transcript so far, return the prospect's next line
//  - score: given the finished transcript, return a rubric-scored report

interface Turn { role: 'prospect' | 'rep'; text: string }

const SCENARIOS: Record<string, { label: string; system: string }> = {
  cold: {
    label: 'Cold Call',
    system: `You are roleplaying a busy prospect receiving an unexpected cold call. You are a mid-level decision maker (pick a plausible role and company type and stay consistent). You did not expect this call, you are mildly annoyed but not hostile, and your time is limited. Be realistic: give short, guarded answers at first, warm up ONLY if the rep earns it with relevance and good questions. Raise at most one objection at a time. Never coach the rep, never break character, never mention being an AI. Keep replies under 50 words — people don't monologue on cold calls. If the rep does very well, agree to a next step. If they pitch poorly or won't listen after several turns, politely end the call by saying you have to go.`,
  },
  discovery: {
    label: 'Discovery Call',
    system: `You are roleplaying a prospect on a scheduled discovery call — you agreed to this meeting, so you're cooperative but businesslike. Pick a plausible role, company type and business problem and stay consistent. Share information when asked good open questions; stay vague when asked lazy or closed ones. You have a real problem worth solving but also constraints (budget cycle, other priorities, a competing vendor). Never coach the rep, never break character, never mention being an AI. Keep replies under 70 words.`,
  },
  gauntlet: {
    label: 'Objection Gauntlet',
    system: `You are roleplaying a skeptical prospect whose main trait is raising objections — one per message. Rotate through realistic objections (price, timing, competitor, "send me info", no budget, need to ask my boss, tried before and failed). Pick a plausible role and company type and stay consistent. If the rep handles an objection well (acknowledges, reframes, moves forward), concede that point briefly, then raise a different one. If they handle it badly, push back harder on the same one. Never coach the rep, never break character, never mention being an AI. Keep replies under 50 words.`,
  },
};

export async function POST(req: NextRequest) {
  try {
    const { action, scenario, history } = await req.json() as {
      action: 'reply' | 'score';
      scenario: string;
      history: Turn[];
    };

    const sc = SCENARIOS[scenario];
    if (!sc) return NextResponse.json({ error: 'Unknown scenario' }, { status: 400 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI roleplay isn\'t available right now — the API key isn\'t configured.' }, { status: 503 });
    }
    const client = new Anthropic({ apiKey });

    if (action === 'reply') {
      const messages = history.map(t => ({
        role: t.role === 'rep' ? 'user' as const : 'assistant' as const,
        content: t.text,
      }));
      // Opening line: prospect answers the phone first
      if (messages.length === 0) {
        messages.push({ role: 'user', content: '[The phone rings. Answer it as the prospect would — just your opening line.]' });
      }

      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: sc.system,
        messages,
      });
      const textContent = message.content.find(c => c.type === 'text');
      if (!textContent || textContent.type !== 'text') throw new Error('No text');
      const reply = textContent.text.trim();
      const hangup = /\bhave to go\b|\bhanging up\b|\bgoodbye\b|\[hangs up\]/i.test(reply);
      return NextResponse.json({ reply, hangup });
    }

    // action === 'score'
    const transcript = history.map(t => `${t.role === 'rep' ? 'REP' : 'PROSPECT'}: ${t.text}`).join('\n');
    const prompt = `You are a direct, experienced sales coach. Score this ${sc.label.toLowerCase()} roleplay transcript. The REP is the person being coached.

TRANSCRIPT:
${transcript}

Score against this rubric:
- Opening (did they earn attention quickly and state a relevant reason for the conversation?)
- Discovery (did they ask questions and listen, or just pitch?)
- Objection handling (acknowledge → reframe → move forward?)
- Close (did they drive toward a concrete next step?)

Be honest — a mediocre performance should score 40-60, only genuinely strong calls score 80+. Reference specific things the rep actually said.

Return ONLY valid JSON in this exact format, no other text:
{"score": <0-100 integer>, "summary": "<2-3 sentence overall verdict, direct, referencing what they actually said>", "strengths": ["<specific strength>", "<specific strength>"], "improvements": ["<specific, actionable improvement>", "<specific, actionable improvement>"]}`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    });
    const textContent = message.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') throw new Error('No text');
    const parsed = JSON.parse(textContent.text.replace(/```json\n?|\n?```/g, '').trim());
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Mock call error:', err);
    return NextResponse.json({ error: 'Something went wrong — try again.' }, { status: 500 });
  }
}
