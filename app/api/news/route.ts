import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const RSS_FEEDS = [
  { url: 'https://techcrunch.com/feed/', name: 'TechCrunch' },
  { url: 'https://feeds.feedburner.com/venturebeat/SZYF', name: 'VentureBeat' },
  { url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge' },
  { url: 'https://hnrss.org/frontpage', name: 'Hacker News' },
];

async function fetchRSS(feed: { url: string; name: string }) {
  try {
    const res = await fetch(feed.url, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const text = await res.text();
    const items: { title: string; link: string; source: string }[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(text)) !== null && items.length < 8) {
      const block = match[1];
      const title = (block.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s)?.[1] || '').trim();
      const link = (block.match(/<link[^>]*>(.*?)<\/link>/s)?.[1] || block.match(/<link[^>]* href="([^"]+)"/)?.[1] || '').trim();
      if (title && link) items.push({ title, link, source: feed.name });
    }
    return items;
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const { categories = [] } = await req.json() as { categories: string[] };

    // Fetch from multiple RSS feeds concurrently
    const allFeeds = await Promise.all(RSS_FEEDS.map(fetchRSS));
    const rawItems = allFeeds.flat().slice(0, 30);

    if (!rawItems.length) {
      return NextResponse.json([]);
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Return raw items without AI enrichment
      return NextResponse.json(rawItems.slice(0,12).map((item, i) => ({
        id: `news-${i}`,
        title: item.title,
        url: item.link,
        source: item.source,
        category: categories[i % Math.max(categories.length, 1)] || 'Tech',
        summary: '',
        angle: '',
        publishedAt: Date.now(),
      })));
    }

    const client = new Anthropic({ apiKey });

    const prompt = `You are an assistant for a sales development rep (SDR) preparing for a job search.

Here are ${rawItems.length} recent tech headlines:
${rawItems.map((item, i) => `${i+1}. [${item.source}] ${item.title} — ${item.link}`).join('\n')}

Target interest categories: ${categories.join(', ')}

Select the 10 most relevant articles for someone in B2B tech sales. For each selected article return JSON in this exact format:
{
  "articles": [
    {
      "index": <original number>,
      "category": "<one of: ${categories.join(' | ')} | General Tech>",
      "summary": "<1-2 sentence plain-English summary>",
      "angle": "<how an SDR can use this in a cold email or call opener, 1 sentence>"
    }
  ]
}

Return ONLY valid JSON, no other text.`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = message.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') throw new Error('No text response');

    const parsed = JSON.parse(textContent.text.replace(/```json\n?|\n?```/g, '').trim());
    const enriched = (parsed.articles || []).map((a: { index: number; category: string; summary: string; angle: string }, i: number) => {
      const original = rawItems[a.index - 1];
      if (!original) return null;
      return {
        id: `news-${Date.now()}-${i}`,
        title: original.title,
        url: original.link,
        source: original.source,
        category: a.category,
        summary: a.summary,
        angle: a.angle,
        publishedAt: Date.now(),
      };
    }).filter(Boolean);

    return NextResponse.json(enriched);
  } catch (err) {
    console.error('News API error:', err);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
