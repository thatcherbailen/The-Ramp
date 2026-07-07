import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

interface StoryDraft {
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  question: string;
}

export async function POST(req: NextRequest) {
  try {
    const { notes } = await req.json() as { notes: string };
    if (!notes?.trim()) return NextResponse.json({ error: 'Missing notes' }, { status: 400 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI structuring isn\'t available right now — fill in the fields yourself below.' }, { status: 503 });
    }

    const client = new Anthropic({ apiKey });

    const prompt = `You are an interview coach. Someone has given you rough, unstructured notes about something that happened to them at work. Turn it into a clean STAR-format interview story.

Their notes: "${notes}"

Return ONLY valid JSON in this exact format, no other text:
{"title": "<short punchy title, under 8 words>", "situation": "<1-2 sentences setting the scene>", "task": "<1 sentence — what they needed to achieve>", "action": "<2-3 sentences — what they specifically did, first person>", "result": "<1-2 sentences — the outcome, with a number or concrete detail if the notes support one>", "question": "<1-2 common interview questions this story would answer, separated by ' · '>"}

Keep their voice and specific details — don't invent facts that aren't in the notes. Write in first person past tense.`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = message.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') throw new Error('No text');

    const parsed = JSON.parse(textContent.text.replace(/```json\n?|\n?```/g, '').trim()) as StoryDraft;
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Story coach error:', err);
    return NextResponse.json({ error: 'Something went wrong structuring that — fill in the fields yourself below.' }, { status: 500 });
  }
}
