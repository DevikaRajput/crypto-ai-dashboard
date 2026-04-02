// ─── Fear & Greed Panel ──────────────────────────────────────────────────────
import React, { useState } from 'react';
import { useFearGreed, useRecentTrades } from '../hooks/useMarketData';
import { Bell, BellOff, Trash2, Plus } from 'lucide-react';

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
  },
  mono: { fontFamily: "'Space Mono', monospace" },
};

function getColor(val) {
  if (val <= 20) return '#ff4d6d';
  if (val <= 40) return '#ff8844';
  if (val <= 60) return '#ffbb00';
  if (val <= 80) return '#88ff44';
  return '#00ff88';
}

// ── Fear & Greed Component ────────────────────
export function FearGreedPanel() {
  const { data, loading } = useFearGreed();
  const current = data?.[0];
  const val = parseInt(current?.value ?? 50);
  const col = getColor(val);
  const arcAngle = (val / 100) * 180;

  // Arc path
  const cx = 90, cy = 80, r = 65;
  const toRad = (a) => ((a - 180) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(0));
  const y1 = cy + r * Math.sin(toRad(0));
  const x2 = cx + r * Math.cos(toRad(arcAngle));
  const y2 = cy + r * Math.sin(toRad(arcAngle));
  const largeArc = arcAngle > 90 ? 1 : 0;

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <span style={S.title}>Fear & Greed</span>
      </div>
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        {loading ? (
          <span style={{ ...S.mono, fontSize: 11, color: '#4a7a5a' }}>LOADING...</span>
        ) : (
          <>
            <svg width={180} height={100} viewBox="0 0 180 100">
              {/* Background arc */}
              <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                fill="none" stroke="#1a2e1a" strokeWidth={12} strokeLinecap="round" />
              {/* Value arc */}
              <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 0 ${x2} ${y2}`}
                fill="none" stroke={col} strokeWidth={12} strokeLinecap="round" />
              {/* Label */}
              <text x={cx} y={cy - 10} textAnchor="middle" fill={col}
                style={{ fontFamily: "'Space Mono', monospace", fontSize: 26, fontWeight: 700 }}>
                {val}
              </text>
              <text x={cx} y={cy + 10} textAnchor="middle" fill={col}
                style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: '0.08em' }}>
                {current?.value_classification?.toUpperCase()}
              </text>
            </svg>
            {/* History */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
              {data?.slice(0, 7).map((d, i) => {
                const v = parseInt(d.value);
                const c = getColor(v);
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 4, background: c + '33', border: `1px solid ${c}55`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ ...S.mono, fontSize: 9, color: c }}>{v}</span>
                    </div>
                    <span style={{ ...S.mono, fontSize: 8, color: '#2a4a3a' }}>
                      {i === 0 ? 'NOW' : `${i}D`}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Recent Trades Component ───────────────────
export function RecentTrades({ symbol }) {
  const trades = useRecentTrades(symbol);

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <span style={S.title}>Recent Trades</span>
        <span style={{ ...S.mono, fontSize: 9, color: '#2a5a3a', marginLeft: 'auto' }}>{symbol}</span>
      </div>
      <div style={{ overflowY: 'auto', maxHeight: 220 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['PRICE', 'QTY', 'TIME', 'SIDE'].map((h, i) => (
                <th key={h} style={{
                  ...S.mono, fontSize: 9, color: '#2a5a3a', padding: '5px 8px',
                  textAlign: i < 2 ? 'left' : 'right', letterSpacing: '0.1em',
                  borderBottom: '1px solid #0f1e0f', background: '#060c06',
                  position: 'sticky', top: 0,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trades.map((t, i) => {
              const col = t.isBuyer ? '#ff4d6d' : '#00ff88';
              const ts  = new Date(t.time).toLocaleTimeString('en-US', { hour12: false });
              return (
                <tr key={t.id ?? i} style={{ animation: i === 0 ? 'fadeIn 0.3s' : 'none' }}>
                  <td style={{ ...S.mono, fontSize: 11, padding: '4px 8px', color: col }}>
                    {t.price.toFixed(2)}
                  </td>
                  <td style={{ ...S.mono, fontSize: 11, padding: '4px 8px', color: '#88cc99' }}>
                    {t.qty.toFixed(4)}
                  </td>
                  <td style={{ ...S.mono, fontSize: 10, padding: '4px 8px', color: '#2a5a3a', textAlign: 'right' }}>
                    {ts}
                  </td>
                  <td style={{ ...S.mono, fontSize: 9, padding: '4px 8px', textAlign: 'right' }}>
                    <span style={{ color: col, background: col + '18', padding: '1px 5px', borderRadius: 2 }}>
                      {t.isBuyer ? 'SELL' : 'BUY'}
                    </span>
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

// ── Price Alerts Component ────────────────────
export function PriceAlerts({ currentPrice, symbol }) {
  const [alerts, setAlerts]   = useState([
    { id: 1, price: '', type: 'above', active: true, triggered: false },
  ]);
  const [newPrice, setNewPrice] = useState('');
  const [newType, setNewType]   = useState('above');
  const [triggered, setTriggered] = useState([]);

  React.useEffect(() => {
    if (!currentPrice) return;
    setAlerts((prev) =>
      prev.map((a) => {
        if (!a.active || a.triggered || !a.price) return a;
        const hit =
          (a.type === 'above' && currentPrice >= parseFloat(a.price)) ||
          (a.type === 'below' && currentPrice <= parseFloat(a.price));
        if (hit) {
          setTriggered((t) => [`${a.type.toUpperCase()} $${a.price} @ ${currentPrice.toFixed(2)}`, ...t.slice(0, 4)]);
          return { ...a, triggered: true };
        }
        return a;
      })
    );
  }, [currentPrice]);

  const addAlert = () => {
    if (!newPrice) return;
    setAlerts((prev) => [...prev, { id: Date.now(), price: newPrice, type: newType, active: true, triggered: false }]);
    setNewPrice('');
  };

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <Bell size={13} color="#00ff88" />
        <span style={S.title}>Price Alerts</span>
        <span style={{ ...S.mono, fontSize: 9, color: '#2a5a3a', marginLeft: 'auto' }}>
          {currentPrice ? '$' + currentPrice.toFixed(2) : '—'}
        </span>
      </div>

      {/* Add alert */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #0f1e0f', display: 'flex', gap: 6 }}>
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value)}
          style={{
            ...S.mono, fontSize: 10, background: '#060c06', border: '1px solid #1a2e1a',
            color: '#88cc99', borderRadius: 4, padding: '4px 6px', cursor: 'pointer',
          }}
        >
          <option value="above">ABOVE</option>
          <option value="below">BELOW</option>
        </select>
        <input
          type="number"
          value={newPrice}
          onChange={(e) => setNewPrice(e.target.value)}
          placeholder="Price..."
          style={{
            flex: 1, ...S.mono, fontSize: 11, background: '#060c06', border: '1px solid #1a2e1a',
            color: '#00ff88', borderRadius: 4, padding: '4px 8px', outline: 'none',
          }}
        />
        <button onClick={addAlert} style={{
          background: '#00ff8818', border: '1px solid #00ff8844', color: '#00ff88',
          borderRadius: 4, padding: '4px 8px', cursor: 'pointer',
        }}>
          <Plus size={12} />
        </button>
      </div>

      {/* Alert list */}
      <div style={{ overflowY: 'auto', flex: 1, maxHeight: 160 }}>
        {alerts.map((a) => (
          <div key={a.id} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 12px', borderBottom: '1px solid #0a150a',
            opacity: a.triggered ? 0.4 : 1,
          }}>
            {a.triggered ? <BellOff size={12} color="#2a5a3a" /> : <Bell size={12} color="#00ff88" />}
            <span style={{ ...S.mono, fontSize: 11, color: a.triggered ? '#2a5a3a' : '#88cc99', flex: 1 }}>
              {a.type.toUpperCase()} ${a.price}
            </span>
            <span style={{ ...S.mono, fontSize: 9, color: a.triggered ? '#ff8844' : '#4a7a5a' }}>
              {a.triggered ? 'TRIGGERED' : 'ACTIVE'}
            </span>
            <button onClick={() => setAlerts((p) => p.filter((x) => x.id !== a.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2a4a3a' }}>
              <Trash2 size={10} />
            </button>
          </div>
        ))}
      </div>

      {/* Triggered log */}
      {triggered.length > 0 && (
        <div style={{ padding: '8px 12px', borderTop: '1px solid #0f1e0f', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {triggered.slice(0, 3).map((t, i) => (
            <span key={i} style={{ ...S.mono, fontSize: 10, color: '#ff8844' }}>
              🔔 {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
