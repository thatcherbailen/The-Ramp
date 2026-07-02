'use client';
import { useState, useEffect } from 'react';
import { getNews, setNews, getNewsStamp, setNewsStamp, getSettings } from '@/lib/store';
import { NewsItem } from '@/lib/types';

const AGE_HOURS = 4;

export default function NewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTag, setActiveTag] = useState('All');
  const [settings] = useState(getSettings());

  const fetchNews = async (force = false) => {
    const stamp = getNewsStamp();
    const stale = !stamp || (Date.now() - stamp) > AGE_HOURS * 3600 * 1000;
    if (!force && !stale) {
      const cached = getNews();
      if (cached.length) { setItems(cached); return; }
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/news', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ categories: settings.newsCategories }),
      });
      if (!res.ok) throw new Error('Failed to fetch news');
      const data: NewsItem[] = await res.json();
      setNews(data);
      setNewsStamp(Date.now());
      setItems(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not load news.';
      setError(msg);
      const cached = getNews();
      if (cached.length) setItems(cached);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNews(); }, []);

  const allTags = ['All', ...Array.from(new Set(items.map(i => i.category)))];
  const filtered = activeTag === 'All' ? items : items.filter(i => i.category === activeTag);

  const timeAgo = (stamp: number) => {
    const h = Math.floor((Date.now() - stamp) / 3600000);
    if (h < 1) return 'just now';
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h/24)}d ago`;
  };

  const lastFetch = getNewsStamp();

  return (
    <div>
      <div className="page-head" style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:18 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:500, color:'var(--muted)' }}>Learn · Daily feed</div>
          <div className="page-title">Tech News</div>
        </div>
        <div className="page-head-actions" style={{ display:'flex', alignItems:'center', gap:14 }}>
          {lastFetch && !loading && (
            <span style={{ fontSize:12, color:'var(--muted)' }}>Updated {timeAgo(lastFetch)}</span>
          )}
          <button
            onClick={() => fetchNews(true)}
            disabled={loading}
            className="coral-btn"
            style={{ height:46, padding:'0 22px', fontSize:14, boxShadow:'0 6px 18px rgba(245,85,46,.22)', opacity: loading ? .6 : 1 }}
          >
            {loading ? 'Refreshing…' : '↻ Refresh'}
          </button>
        </div>
      </div>

      <div style={{ fontSize:12, color:'var(--muted)', marginBottom:18, lineHeight:1.5, maxWidth:680 }}>
        AI-curated headlines from your target categories — each tagged with a sales angle so you can weave it into prospecting conversations and cold emails.
      </div>

      {/* Category filter pills */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:22 }}>
        {allTags.map(tag => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag)}
            style={{ padding:'6px 14px', borderRadius:999, border:`1px solid ${activeTag===tag ? '#F5552E' : 'var(--line)'}`, background: activeTag===tag ? 'var(--accent-soft)' : 'var(--card)', color: activeTag===tag ? 'var(--accent-ink)' : 'var(--ink-2b)', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', letterSpacing:'.03em' }}
          >{tag}</button>
        ))}
      </div>

      {error && (
        <div style={{ background:'#FFF3CD', border:'1px solid #F5DFA0', borderRadius:12, padding:'14px 18px', fontSize:13, color:'#8A6D00', marginBottom:18 }}>
          {error} {getNews().length ? '— showing cached results.' : ''}
        </div>
      )}

      {loading && items.length === 0 ? (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[...Array(6)].map((_,i) => (
            <div key={i} className="card" style={{ padding:'20px 22px', height:120, background:'linear-gradient(90deg,var(--card-3) 0%,var(--card-2) 50%,var(--card-3) 100%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding:'56px 40px', textAlign:'center' }}>
          <div style={{ fontWeight:800, fontSize:18, marginBottom:8 }}>No articles yet</div>
          <div style={{ fontSize:14, color:'var(--muted)' }}>Hit Refresh to pull today&apos;s tech headlines.</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {filtered.map(item => (
            <div key={item.id} className="card" style={{ padding:'20px 22px' }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, flexWrap:'wrap' }}>
                    <span style={{ fontSize:10, fontWeight:700, letterSpacing:'.07em', textTransform:'uppercase', color:'var(--accent-ink)', background:'var(--accent-soft)', padding:'3px 10px', borderRadius:999 }}>{item.category}</span>
                    <span style={{ fontSize:11, color:'var(--muted-2)', fontWeight:500 }}>{item.source}</span>
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration:'none', color:'inherit' }}
                  >
                    <div style={{ fontWeight:700, fontSize:16, lineHeight:1.35, letterSpacing:'-.01em', marginBottom:8, color:'var(--ink)' }}>{item.title}</div>
                  </a>
                  {item.summary && (
                    <div style={{ fontSize:13, color:'var(--ink-2b)', lineHeight:1.6, marginBottom:10 }}>{item.summary}</div>
                  )}
                  {item.angle && (
                    <div style={{ background:'var(--card-3)', borderRadius:10, padding:'10px 14px', display:'flex', gap:8, alignItems:'flex-start' }}>
                      <span style={{ fontSize:10, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--muted)', flexShrink:0, paddingTop:2 }}>Sales angle</span>
                      <span style={{ fontSize:13, fontWeight:600, color:'var(--ink-2)', lineHeight:1.5 }}>{item.angle}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
