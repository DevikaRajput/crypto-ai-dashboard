import React, { useState } from 'react';
import { useCryptoNews, useTrendingCoins } from '../hooks/useMarketData';
import { Newspaper, Flame, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const TABS = ['NEWS', 'TRENDING'];

const S = {
  wrap: {
    background: '#0a0f0a',
    border: '1px solid #1a2e1a',
    borderRadius: 8,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid #1a2e1a',
    background: '#060c06',
  },
  tab: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    padding: '10px 16px',
    cursor: 'pointer',
    letterSpacing: '0.08em',
    background: 'transparent',
    border: 'none',
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  mono: { fontFamily: "'Space Mono', monospace" },
  newsItem: {
    padding: '10px 12px',
    borderBottom: '1px solid #0a150a',
    cursor: 'pointer',
    transition: 'background 0.15s',
    textDecoration: 'none',
    display: 'block',
  },
  newsTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 12,
    fontWeight: 600,
    color: '#c0ddc8',
    lineHeight: 1.4,
    marginBottom: 5,
  },
  newsMeta: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaItem: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    color: '#2a5a3a',
    letterSpacing: '0.08em',
  },
  tag: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    padding: '1px 5px',
    borderRadius: 3,
    background: '#00ff8815',
    color: '#00ff8899',
    border: '1px solid #00ff8822',
  },
  trendRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    borderBottom: '1px solid #0a150a',
    gap: 10,
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  rank: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 10,
    color: '#2a4a3a',
    width: 18,
    flexShrink: 0,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    flexShrink: 0,
  },
  coinName: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 12,
    fontWeight: 600,
    color: '#c0ddc8',
    flex: 1,
  },
  coinSym: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 10,
    color: '#4a7a5a',
  },
  mcapRank: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 10,
    color: '#2a5a3a',
  },
  fire: {
    fontSize: 12,
  },
};

function timeAgo(dateStr) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return '';
  }
}

export default function NewsAndTrending({ onSelectCoin }) {
  const [tab, setTab] = useState('TRENDING');
  const { news, loading: newsLoading }         = useCryptoNews('BTC,ETH,BNB,SOL');
  const { trending, loading: trendLoading }    = useTrendingCoins();

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              ...S.tab,
              color:       tab === t ? '#00ff88' : '#4a7a5a',
              borderBottom: tab === t ? '2px solid #00ff88' : '2px solid transparent',
            }}
          >
            {t === 'NEWS'
              ? <Newspaper size={11} />
              : <Flame size={11} />
            }
            {t}
          </button>
        ))}
        <span style={{ ...S.mono, fontSize: 9, color: '#1a3a2a', marginLeft: 'auto', padding: '0 12px' }}>
          {tab === 'NEWS' ? (newsLoading ? 'LOADING...' : `${news.length} ARTICLES`) : (trendLoading ? 'LOADING...' : `${trending.length} COINS`)}
        </span>
      </div>

      <div style={{ overflowY: 'auto', flex: 1 }}>
        {tab === 'NEWS' ? (
          news.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center' }}>
              <span style={{ ...S.mono, fontSize: 11, color: '#2a5a3a' }}>
                {newsLoading ? 'FETCHING NEWS...' : 'News unavailable — CORS restricted in browser. Use a backend proxy.'}
              </span>
            </div>
          ) : (
            news.slice(0, 25).map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                style={S.newsItem}
                onMouseEnter={(e) => e.currentTarget.style.background = '#0f2010'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={S.newsTitle}>{item.title}</div>
                <div style={S.newsMeta}>
                  <span style={S.metaItem}>{item.source}</span>
                  <span style={S.metaItem}>·</span>
                  <span style={S.metaItem}>{timeAgo(item.published)}</span>
                  {item.currencies.slice(0, 3).map((c) => (
                    <span key={c} style={S.tag}>{c}</span>
                  ))}
                  {item.votes?.liked > 0 && (
                    <span style={S.metaItem}>👍 {item.votes.liked}</span>
                  )}
                  <ExternalLink size={9} color="#1a3a2a" style={{ marginLeft: 'auto' }} />
                </div>
              </a>
            ))
          )
        ) : (
          trending.map((coin, i) => (
            <div
              key={coin.id}
              style={S.trendRow}
              onMouseEnter={(e) => e.currentTarget.style.background = '#0f2010'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              onClick={() => onSelectCoin?.(coin)}
            >
              <span style={S.rank}>#{i + 1}</span>
              <img src={coin.thumb} alt={coin.symbol} style={S.thumb} onError={(e) => e.target.style.display = 'none'} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.coinName}>{coin.name}</div>
                <span style={S.coinSym}>{coin.symbol}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={S.mcapRank}>#{coin.rank ?? '—'}</div>
                <div style={{ ...S.mono, fontSize: 9, color: '#1a4a2a' }}>MCap Rank</div>
              </div>
              <span style={S.fire}>
                {i < 3 ? '🔥' : i < 6 ? '📈' : '·'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
