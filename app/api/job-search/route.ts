import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Web search + reasoning can take a while — give the function room (Vercel caps
// this at 60s on the Hobby plan).
export const maxDuration = 60;

interface Opening {
  company: string;
  role: string;
  location: string;
  url: string;
  source: string;
  posted: string;
  summary: string;
}

export async function POST(req: NextRequest) {
  try {
    const { companies = '', keywords = '', location = '' } = (await req.json()) as {
      companies?: string;
      keywords?: string;
      location?: string;
    };

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI job search is not configured (missing API key).' }, { status: 503 });
    }
    if (!companies.trim() && !keywords.trim()) {
      return NextResponse.json({ error: 'Add at least one company or a role keyword to search.' }, { status: 400 });
    }

    const loc = (location || 'Sydney, Australia').trim();
    const city = (loc.split(',')[0] || 'Sydney').trim();
    const client = new Anthropic({ apiKey });

    const prompt = `You are a job-search assistant. Use web search to find CURRENT, real job openings that match the criteria below.

Target companies: ${companies.trim() || '(any strong B2B tech / SaaS / cloud company)'}
Role types / keywords: ${keywords.trim() || 'SDR, BDR, Sales Development Representative, Business Development Representative'}
Location: ${loc}

Search company careers pages and job boards (LinkedIn Jobs, Seek, Indeed, etc.). Return up to 12 of the most relevant openings that genuinely match the role types and location. Prefer official application links over aggregators. Only include roles you can actually verify exist right now — never invent a company, role, or link.

Return ONLY a JSON object, no prose, in exactly this shape:
{
  "openings": [
    {
      "company": "Cloudflare",
      "role": "Business Development Representative",
      "location": "Sydney, AU",
      "url": "https://example.com/apply",
      "source": "LinkedIn",
      "posted": "2 days ago",
      "summary": "One concise sentence on the role and why it fits."
    }
  ]
}
If you cannot verify any real current openings, return {"openings": []}.`;

    const tools: Anthropic.Messages.ToolUnion[] = [
      {
        type: 'web_search_20260209',
        name: 'web_search',
        max_uses: 6,
        user_location: { type: 'approximate', city, country: 'AU', timezone: 'Australia/Sydney' },
      },
    ];

    const messages: Anthropic.MessageParam[] = [{ role: 'user', content: prompt }];

    let response = await client.messages.create({ model: 'claude-opus-4-8', max_tokens: 6000, tools, messages });

    // Server-tool loop: the model pauses between batches of searches.
    let guard = 0;
    while (response.stop_reason === 'pause_turn' && guard++ < 6) {
      messages.push({ role: 'assistant', content: response.content });
      response = await client.messages.create({ model: 'claude-opus-4-8', max_tokens: 6000, tools, messages });
    }

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n');

    let openings: Opening[] = [];
    try {
      const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(match ? match[0] : cleaned);
      if (Array.isArray(parsed.openings)) {
        openings = parsed.openings
          .filter((o: Partial<Opening>) => o && o.company && o.role)
          .map((o: Partial<Opening>) => ({
            company: String(o.company || ''),
            role: String(o.role || ''),
            location: String(o.location || loc),
            url: String(o.url || ''),
            source: String(o.source || 'Web'),
            posted: String(o.posted || ''),
            summary: String(o.summary || ''),
          })) as Opening[];
      }
    } catch {
      openings = [];
    }

    return NextResponse.json({ openings });
  } catch (err) {
    console.error('Job search API error:', err);
    return NextResponse.json({ error: 'Job search failed. Please try again in a moment.' }, { status: 500 });
  }
}
