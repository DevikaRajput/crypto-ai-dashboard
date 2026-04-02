import React, { useMemo } from 'react';
import { useMarketOverview } from '../hooks/useMarketData';
import { TrendingUp, TrendingDown, Globe } from 'lucide-react';

const S = {
  wrap: {
    background: '#0a0f0a',
    border: '1px solid #1a2e1a',
    borderRadius: 8,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    borderBottom: '1px solid #1a2e1a',
    background: '#060c06',
  },
  title: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 12,
    fontWeight: 700,
    color: '#88cc99',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    flex: 1,
  },
  globalRow: {
    display: 'flex',
    gap: 12,
    padding: '8px 14px',
    borderBottom: '1px solid #0f1e0f',
    flexWrap: 'wrap',
  },
  gStat: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  gLabel: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    color: '#2a5a3a',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  },
  gValue: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    color: '#88cc99',
  },
  table: { width: '100%', borderCollapse: 'collapse', flex: 1 },
  th: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    color: '#2a5a3a',
    letterSpacing: '0.12em',
    padding: '6px 8px',
    textAlign: 'right',
    borderBottom: '1px solid #0f1e0f',
    background: '#060c06',
    position: 'sticky',
    top: 0,
  },
  thLeft: { textAlign: 'left' },
  td: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    padding: '6px 8px',
    borderBottom: '1px solid #0a150a',
    textAlign: 'right',
    verticalAlign: 'middle',
  },
  tdLeft: { textAlign: 'left' },
  spark: { display: 'flex', alignItems: 'flex-end', gap: 1, height: 24 },
};

function fmtMcap(n) {
  if (!n) return '—';
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9)  return '$' + (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6)  return '$' + (n / 1e6).toFixed(1) + 'M';
  return '$' + n.toFixed(0);
}

function fmtPrice(n) {
  if (!n) return '—';
  if (n >= 1000) return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1) return '$' + n.toFixed(3);
  return '$' + n.toFixed(6);
}

function SparkLine({ data }) {
  if (!data || data.length < 2) return <div style={{ width: 60 }} />;
  const w = 60, h = 24;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');
  const isUp = data[data.length - 1] >= data[0];
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={isUp ? '#00ff88' : '#ff4d6d'} strokeWidth={1} />
    </svg>
  );
}

export default function MarketOverview({ onSelectCoin }) {
  const { coins, global, loading } = useMarketOverview();

  const btcDom = global?.market_cap_percentage?.btc?.toFixed(1);
  const ethDom = global?.market_cap_percentage?.eth?.toFixed(1);
  const totalMcap = global?.total_market_cap?.usd;

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <Globe size={13} color="#00ff88" />
        <span style={S.title}>Market Overview</span>
        {loading && <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: '#2a5a3a' }}>LOADING...</span>}
      </div>

      {/* Global stats */}
      {global && (
        <div style={S.globalRow}>
          {[
            ['TOTAL MCAP', fmtMcap(totalMcap)],
            ['BTC DOM', btcDom + '%'],
            ['ETH DOM', ethDom + '%'],
            ['ACTIVE COINS', global.active_cryptocurrencies?.toLocaleString()],
          ].map(([l, v]) => (
            <div key={l} style={S.gStat}>
              <span style={S.gLabel}>{l}</span>
              <span style={S.gValue}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {/* Coins Table */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        <table style={S.table}>
          <thead>
            <tr>
              {['#', 'COIN', 'PRICE', '24H', '7D', 'MCAP', '7D CHART'].map((h, i) => (
                <th key={h} style={{ ...S.th, ...(i < 2 ? S.thLeft : {}) }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {coins.map((coin, i) => {
              const c24  = coin.price_change_percentage_24h ?? 0;
              const c7d  = coin.price_change_percentage_7d_in_currency ?? 0;
              const col24 = c24 >= 0 ? '#00ff88' : '#ff4d6d';
              const col7d = c7d >= 0 ? '#00ff88' : '#ff4d6d';
              return (
                <tr
                  key={coin.id}
                  style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#0f2a1a'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  onClick={() => onSelectCoin?.(coin)}
                >
                  <td style={{ ...S.td, ...S.tdLeft, color: '#2a5a3a', width: 28 }}>{coin.market_cap_rank}</td>
                  <td style={{ ...S.td, ...S.tdLeft }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <img src={coin.image} alt={coin.symbol} style={{ width: 18, height: 18, borderRadius: '50%' }} />
                      <div>
                        <div style={{ color: '#e0f0e8', fontSize: 12, fontWeight: 700 }}>{coin.symbol.toUpperCase()}</div>
                        <div style={{ color: '#2a5a3a', fontSize: 9 }}>{coin.name}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ ...S.td, color: '#c0ddc8' }}>{fmtPrice(coin.current_price)}</td>
                  <td style={{ ...S.td }}>
                    <span style={{ color: col24 }}>{c24 >= 0 ? '+' : ''}{c24.toFixed(2)}%</span>
                  </td>
                  <td style={{ ...S.td }}>
                    <span style={{ color: col7d }}>{c7d >= 0 ? '+' : ''}{c7d.toFixed(2)}%</span>
                  </td>
                  <td style={{ ...S.td, color: '#4a7a5a' }}>{fmtMcap(coin.market_cap)}</td>
                  <td style={{ ...S.td }}>
                    <SparkLine data={coin.sparkline_in_7d?.price} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
