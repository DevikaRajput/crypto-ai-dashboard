import React, { useMemo } from 'react';
import { useMarketOverview } from '../hooks/useMarketData';
import { LayoutGrid } from 'lucide-react';

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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: 3,
    padding: 10,
    flex: 1,
    overflowY: 'auto',
    alignContent: 'start',
  },
  tile: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    padding: '10px 6px',
    borderRadius: 5,
    cursor: 'pointer',
    transition: 'filter 0.15s, transform 0.1s',
    position: 'relative',
    overflow: 'hidden',
  },
  sym: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 13,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.95)',
  },
  pct: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    fontWeight: 700,
  },
  price: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
  },
  mcap: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    color: 'rgba(255,255,255,0.3)',
  },
  legend: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 12px',
    borderTop: '1px solid #0f1e0f',
    background: '#060c06',
    justifyContent: 'center',
  },
  legendGrad: {
    height: 8,
    width: 160,
    borderRadius: 4,
    background: 'linear-gradient(90deg, #ff4d6d, #ff884455, #1a3a1a, #00aa5555, #00ff88)',
  },
  legendLabel: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    color: '#2a5a3a',
    letterSpacing: '0.08em',
  },
};

function getHeatColor(pct) {
  const clamp = Math.max(-15, Math.min(15, pct));
  if (clamp >= 0) {
    const t = clamp / 15;
    const r = Math.round(10 + (0) * t);
    const g = Math.round(42 + (255 - 42) * t * 0.6);
    const b = Math.round(10 + 0 * t);
    return `rgb(${r},${g},${b})`;
  } else {
    const t = Math.abs(clamp) / 15;
    const r = Math.round(10 + (255 - 10) * t * 0.7);
    const g = Math.round(42 + (77 - 42) * (1 - t));
    const b = Math.round(10 + (109 - 10) * t * 0.5);
    return `rgb(${r},${g},${b})`;
  }
}

function getTextColor(pct) {
  return Math.abs(pct) > 3 ? 'rgba(255,255,255,0.95)' : 'rgba(200,255,220,0.85)';
}

function sizeWeight(marketCap) {
  if (marketCap >= 500e9) return 1.8;
  if (marketCap >= 100e9) return 1.4;
  if (marketCap >= 50e9)  return 1.2;
  if (marketCap >= 10e9)  return 1.0;
  return 0.85;
}

function fmtPrice(n) {
  if (!n) return '—';
  if (n >= 1000) return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (n >= 1)    return '$' + n.toFixed(2);
  return '$' + n.toFixed(4);
}

function fmtMcap(n) {
  if (!n) return '';
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(1) + 'T';
  if (n >= 1e9)  return '$' + (n / 1e9).toFixed(0) + 'B';
  return '$' + (n / 1e6).toFixed(0) + 'M';
}

export default function MarketHeatmap({ onSelectCoin }) {
  const { coins, loading } = useMarketOverview();

  const sorted = useMemo(() =>
    [...coins].sort((a, b) => (b.market_cap ?? 0) - (a.market_cap ?? 0)),
    [coins]
  );

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <LayoutGrid size={13} color="#00ff88" />
        <span style={S.title}>Market Heatmap — 24h Performance</span>
        {loading && <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: '#2a5a3a' }}>LOADING...</span>}
      </div>

      <div style={S.grid}>
        {sorted.map((coin) => {
          const pct  = coin.price_change_percentage_24h ?? 0;
          const bg   = getHeatColor(pct);
          const sw   = sizeWeight(coin.market_cap);
          const pctColor = Math.abs(pct) > 3
            ? (pct >= 0 ? '#ccffe0' : '#ffd0d8')
            : (pct >= 0 ? '#88ee99' : '#ff8899');

          return (
            <div
              key={coin.id}
              style={{
                ...S.tile,
                background: bg,
                minHeight: Math.round(70 * sw),
                border: `1px solid ${pct >= 0 ? '#00ff8822' : '#ff4d6d22'}`,
              }}
              onClick={() => onSelectCoin?.(coin)}
              onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.25)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; e.currentTarget.style.transform = 'scale(1)'; }}
              title={`${coin.name} — ${fmtPrice(coin.current_price)} — MCap: ${fmtMcap(coin.market_cap)}`}
            >
              <img
                src={coin.image}
                alt={coin.symbol}
                style={{ width: Math.round(16 * sw), height: Math.round(16 * sw), borderRadius: '50%', marginBottom: 2 }}
                onError={(e) => e.target.style.display = 'none'}
              />
              <span style={{ ...S.sym, fontSize: Math.round(11 * sw) }}>{coin.symbol.toUpperCase()}</span>
              <span style={{ ...S.pct, color: pctColor }}>
                {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
              </span>
              {sw >= 1.2 && (
                <span style={S.price}>{fmtPrice(coin.current_price)}</span>
              )}
              {sw >= 1.4 && (
                <span style={S.mcap}>{fmtMcap(coin.market_cap)}</span>
              )}
            </div>
          );
        })}
      </div>

      <div style={S.legend}>
        <span style={{ ...S.legendLabel, color: '#ff4d6d' }}>-15%</span>
        <div style={S.legendGrad} />
        <span style={{ ...S.legendLabel, color: '#00ff88' }}>+15%</span>
        <span style={{ ...S.legendLabel, marginLeft: 12 }}>Tile size ∝ market cap</span>
      </div>
    </div>
  );
}
