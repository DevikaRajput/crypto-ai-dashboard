import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { usePortfolioPrices } from '../hooks/useMarketData';
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

// Coin ID map (symbol → CoinGecko ID)
const SYMBOL_TO_ID = {
  BTC: 'bitcoin', ETH: 'ethereum', BNB: 'binancecoin',
  SOL: 'solana', XRP: 'ripple', ADA: 'cardano',
  DOGE: 'dogecoin', AVAX: 'avalanche-2', DOT: 'polkadot',
  LINK: 'chainlink', MATIC: 'matic-network', UNI: 'uniswap',
  LTC: 'litecoin', ATOM: 'cosmos', NEAR: 'near',
};

const COLORS = [
  '#00ff88', '#00aaff', '#ff8800', '#ff4d6d', '#aa44ff',
  '#ffbb00', '#00ffcc', '#ff44aa', '#44ff88', '#8888ff',
];

const S = {
  wrap: {
    background: '#0a0f0a',
    border: '1px solid #1a2e1a',
    borderRadius: 8,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
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
  mono: { fontFamily: "'Space Mono', monospace" },
  addRow: {
    display: 'flex',
    gap: 6,
    padding: '10px 12px',
    borderBottom: '1px solid #0f1e0f',
    flexWrap: 'wrap',
  },
  input: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    background: '#060c06',
    border: '1px solid #1a2e1a',
    color: '#00ff88',
    borderRadius: 4,
    padding: '5px 8px',
    outline: 'none',
  },
  btn: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    background: '#00ff8818',
    border: '1px solid #00ff8844',
    color: '#00ff88',
    borderRadius: 4,
    padding: '5px 12px',
    cursor: 'pointer',
  },
  summaryRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 1,
    borderBottom: '1px solid #1a2e1a',
    background: '#060c06',
  },
  sumCell: {
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    borderRight: '1px solid #0f1e0f',
  },
  sumLabel: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    color: '#2a5a3a',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  },
  sumValue: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 14,
    fontWeight: 700,
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    color: '#2a5a3a',
    padding: '6px 10px',
    textAlign: 'right',
    borderBottom: '1px solid #0f1e0f',
    background: '#060c06',
    letterSpacing: '0.1em',
    position: 'sticky',
    top: 0,
  },
  td: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    padding: '7px 10px',
    textAlign: 'right',
    borderBottom: '1px solid #0a150a',
    verticalAlign: 'middle',
  },
};

const DEFAULT_HOLDINGS = [
  { id: 1, symbol: 'BTC', qty: 0.5,  avgCost: 60000 },
  { id: 2, symbol: 'ETH', qty: 5,    avgCost: 2800  },
  { id: 3, symbol: 'SOL', qty: 50,   avgCost: 150   },
  { id: 4, symbol: 'BNB', qty: 10,   avgCost: 400   },
];

function fmtUSD(n) {
  if (!n && n !== 0) return '—';
  if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
  return '$' + n.toFixed(2);
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{ background: '#0d1a0d', border: '1px solid #1a2e1a', borderRadius: 4, padding: '6px 10px' }}>
      <div style={{ ...S.mono, fontSize: 11, color: d.payload.color }}>{d.name}</div>
      <div style={{ ...S.mono, fontSize: 11, color: '#88cc99' }}>{d.payload.pct?.toFixed(1)}%</div>
      <div style={{ ...S.mono, fontSize: 11, color: '#4a7a5a' }}>{fmtUSD(d.value)}</div>
    </div>
  );
}

export default function PortfolioTracker() {
  const [holdings, setHoldings] = useState(DEFAULT_HOLDINGS);
  const [newSym,  setNewSym]    = useState('');
  const [newQty,  setNewQty]    = useState('');
  const [newCost, setNewCost]   = useState('');

  const coinIds = useMemo(() =>
    [...new Set(holdings.map((h) => SYMBOL_TO_ID[h.symbol.toUpperCase()]).filter(Boolean))],
    [holdings]
  );

  const { prices, loading } = usePortfolioPrices(coinIds);

  const enriched = useMemo(() => holdings.map((h) => {
    const id       = SYMBOL_TO_ID[h.symbol.toUpperCase()];
    const priceNow = id && prices[id]?.usd;
    const change24 = id && prices[id]?.usd_24h_change;
    const value    = priceNow ? priceNow * h.qty : null;
    const cost     = h.avgCost * h.qty;
    const pnl      = value !== null ? value - cost : null;
    const pnlPct   = pnl !== null && cost ? (pnl / cost) * 100 : null;
    return { ...h, priceNow, change24, value, cost, pnl, pnlPct };
  }), [holdings, prices]);

  const totalValue = enriched.reduce((s, h) => s + (h.value ?? h.cost), 0);
  const totalCost  = enriched.reduce((s, h) => s + h.cost, 0);
  const totalPnL   = totalValue - totalCost;
  const totalPct   = totalCost ? (totalPnL / totalCost) * 100 : 0;

  const pieData = enriched
    .filter((h) => h.value)
    .map((h, i) => ({
      name:  h.symbol,
      value: h.value,
      pct:   (h.value / totalValue) * 100,
      color: COLORS[i % COLORS.length],
    }));

  const addHolding = () => {
    const sym = newSym.toUpperCase().trim();
    if (!sym || !newQty || !SYMBOL_TO_ID[sym]) return;
    setHoldings((prev) => [...prev, {
      id: Date.now(),
      symbol: sym,
      qty: parseFloat(newQty),
      avgCost: parseFloat(newCost) || 0,
    }]);
    setNewSym(''); setNewQty(''); setNewCost('');
  };

  const remove = (id) => setHoldings((prev) => prev.filter((h) => h.id !== id));

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <Wallet size={13} color="#00ff88" />
        <span style={S.title}>Portfolio</span>
        {loading && <span style={{ ...S.mono, fontSize: 9, color: '#2a5a3a' }}>UPDATING...</span>}
      </div>

      {/* Summary */}
      <div style={S.summaryRow}>
        {[
          ['TOTAL VALUE', fmtUSD(totalValue), '#88cc99'],
          ['INVESTED',    fmtUSD(totalCost),  '#4a7a5a'],
          ['P&L',         fmtUSD(totalPnL),   totalPnL >= 0 ? '#00ff88' : '#ff4d6d'],
          ['RETURN',      (totalPct >= 0 ? '+' : '') + totalPct.toFixed(2) + '%', totalPct >= 0 ? '#00ff88' : '#ff4d6d'],
        ].map(([label, val, col]) => (
          <div key={label} style={S.sumCell}>
            <span style={S.sumLabel}>{label}</span>
            <span style={{ ...S.sumValue, color: col }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Pie + Table */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Allocation pie */}
        <div style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #0f1e0f' }}>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={44}
                outerRadius={72}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div style={{ padding: '0 10px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {pieData.map((d) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                <span style={{ ...S.mono, fontSize: 10, color: '#88cc99', flex: 1 }}>{d.name}</span>
                <span style={{ ...S.mono, fontSize: 10, color: '#4a7a5a' }}>{d.pct?.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Holdings table */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
          <table style={S.table}>
            <thead>
              <tr>
                {['ASSET', 'QTY', 'AVG COST', 'PRICE', '24H', 'VALUE', 'P&L', 'RET%', ''].map((h, i) => (
                  <th key={h} style={{ ...S.th, textAlign: i === 0 ? 'left' : 'right' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enriched.map((h) => {
                const pnlCol = (h.pnl ?? 0) >= 0 ? '#00ff88' : '#ff4d6d';
                const c24col = (h.change24 ?? 0) >= 0 ? '#00ff88' : '#ff4d6d';
                return (
                  <tr key={h.id}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#0f2010'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ ...S.td, textAlign: 'left', color: '#e0f0e8', fontWeight: 700 }}>{h.symbol}</td>
                    <td style={{ ...S.td, color: '#88cc99' }}>{h.qty}</td>
                    <td style={{ ...S.td, color: '#4a7a5a' }}>{fmtUSD(h.avgCost)}</td>
                    <td style={{ ...S.td, color: '#c0ddc8' }}>{h.priceNow ? fmtUSD(h.priceNow) : '—'}</td>
                    <td style={{ ...S.td, color: c24col }}>
                      {h.change24 !== undefined && h.change24 !== null
                        ? (h.change24 >= 0 ? '+' : '') + h.change24.toFixed(2) + '%'
                        : '—'}
                    </td>
                    <td style={{ ...S.td, color: '#88cc99' }}>{h.value ? fmtUSD(h.value) : '—'}</td>
                    <td style={{ ...S.td, color: pnlCol }}>
                      {h.pnl !== null ? (h.pnl >= 0 ? '+' : '') + fmtUSD(h.pnl) : '—'}
                    </td>
                    <td style={{ ...S.td, color: pnlCol }}>
                      {h.pnlPct !== null ? (h.pnlPct >= 0 ? '+' : '') + h.pnlPct.toFixed(1) + '%' : '—'}
                    </td>
                    <td style={{ ...S.td }}>
                      <button onClick={() => remove(h.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2a4a3a', padding: 0 }}>
                        <Trash2 size={10} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add row */}
      <div style={S.addRow}>
        <input
          value={newSym}
          onChange={(e) => setNewSym(e.target.value)}
          placeholder="BTC"
          style={{ ...S.input, width: 60, textTransform: 'uppercase' }}
        />
        <input
          value={newQty}
          onChange={(e) => setNewQty(e.target.value)}
          placeholder="Qty"
          type="number"
          style={{ ...S.input, width: 80 }}
        />
        <input
          value={newCost}
          onChange={(e) => setNewCost(e.target.value)}
          placeholder="Avg Cost $"
          type="number"
          style={{ ...S.input, flex: 1, minWidth: 100 }}
        />
        <button onClick={addHolding} style={S.btn}>
          <Plus size={12} style={{ display: 'inline', marginRight: 4 }} />
          ADD
        </button>
        <span style={{ ...S.mono, fontSize: 9, color: '#1a3a2a', alignSelf: 'center' }}>
          Supported: {Object.keys(SYMBOL_TO_ID).join(', ')}
        </span>
      </div>
    </div>
  );
}

// ─── AI Portfolio Advisor (appended to PortfolioTracker) ────────────────────
import { analyzePortfolio, getApiKey } from '../services/claude';
import { Brain, Sparkles } from 'lucide-react';

export function AIPortfolioAdvisor({ enriched, totalValue, pnl24h }) {
  const [advice,   setAdvice]   = React.useState('');
  const [loading,  setLoading]  = React.useState(false);
  const [error,    setError]    = React.useState('');

  const getAdvice = async () => {
    if (loading) return;
    setLoading(true); setError(''); setAdvice('');
    try {
      const text = await analyzePortfolio(enriched, totalValue, pnl24h);
      setAdvice(text);
    } catch (e) {
      setError(e.message === 'NO_API_KEY'
        ? 'No API key configured. Add REACT_APP_ANTHROPIC_API_KEY to your .env file or enter it in the AI Oracle tab.'
        : 'Analysis failed: ' + e.message);
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      background:'#0a0f0a', border:'1px solid #1a3a2a',
      borderRadius:8, overflow:'hidden', marginTop:8,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderBottom:'1px solid #1a2e1a', background:'#060c06' }}>
        <Brain size={13} color="#00ff88" />
        <span style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, color:'#88cc99', letterSpacing:'0.12em' }}>AI PORTFOLIO ADVISOR</span>
        <button onClick={getAdvice} disabled={loading} style={{
          marginLeft:'auto', display:'flex', alignItems:'center', gap:4,
          background: loading ? 'transparent' : '#00ff8818',
          border:'1px solid #00ff8844', borderRadius:4,
          padding:'4px 12px', color:'#00ff88',
          fontFamily:"'Space Mono',monospace", fontSize:9,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
        }}>
          <Sparkles size={10} />
          {loading ? 'ANALYZING...' : 'ANALYZE PORTFOLIO'}
        </button>
      </div>
      <div style={{ padding:14 }}>
        {!advice && !loading && !error && (
          <p style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:'#2a5a3a', lineHeight:1.8, textAlign:'center' }}>
            Get an AI-powered risk assessment and suggestions<br />based on your current portfolio allocation.
          </p>
        )}
        {loading && (
          <p style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:'#00ff88', lineHeight:2, textAlign:'center', animation:'pulse 1.5s ease-in-out infinite' }}>
            Analyzing portfolio allocation...<br />Consulting Claude...
          </p>
        )}
        {error && (
          <p style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:'#cc7788', lineHeight:1.7 }}>{error}</p>
        )}
        {advice && (
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:'#8ab8a0', lineHeight:1.85, whiteSpace:'pre-wrap', animation:'fadeIn .3s ease' }}>
            {advice}
          </div>
        )}
      </div>
    </div>
  );
}
