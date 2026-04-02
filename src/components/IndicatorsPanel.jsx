import React, { useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ReferenceLine, Cell,
} from 'recharts';
import { useChartData } from '../hooks/useMarketData';
import { format } from 'date-fns';

const TABS = ['RSI', 'MACD', 'Bollinger'];

const S = {
  wrap: {
    background: '#0a0f0a',
    border: '1px solid #1a2e1a',
    borderRadius: 8,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  tabRow: {
    display: 'flex',
    borderBottom: '1px solid #1a2e1a',
    background: '#060c06',
  },
  tab: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    padding: '8px 16px',
    cursor: 'pointer',
    letterSpacing: '0.08em',
    transition: 'all 0.15s',
    border: 'none',
    background: 'transparent',
  },
  chartWrap: { padding: '8px 0', flex: 1 },
  tooltip: {
    background: '#0d1a0d',
    border: '1px solid #1a2e1a',
    borderRadius: 4,
    padding: '6px 10px',
    fontFamily: "'Space Mono', monospace",
    fontSize: 10,
    color: '#88cc99',
  },
  badge: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    padding: '3px 10px',
    borderRadius: 4,
    margin: '4px 12px',
    display: 'inline-block',
    width: 'fit-content',
  },
  signalRow: {
    display: 'flex',
    gap: 12,
    padding: '8px 12px',
    borderTop: '1px solid #0f1e0f',
    background: '#060c06',
    flexWrap: 'wrap',
  },
  sig: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 10,
    padding: '3px 8px',
    borderRadius: 3,
  },
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={S.tooltip}>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(3) : p.value}
        </div>
      ))}
    </div>
  );
}

function rsiSignal(val) {
  if (val === null || isNaN(val)) return { text: 'NEUTRAL', color: '#4a7a5a' };
  if (val >= 80) return { text: 'EXTREME OVERBOUGHT', color: '#ff4d6d' };
  if (val >= 70) return { text: 'OVERBOUGHT', color: '#ff8844' };
  if (val <= 20) return { text: 'EXTREME OVERSOLD', color: '#00ff88' };
  if (val <= 30) return { text: 'OVERSOLD', color: '#00cc66' };
  return { text: 'NEUTRAL', color: '#ffbb00' };
}

export default function IndicatorsPanel({ symbol, interval = '1h', height = 220 }) {
  const [tab, setTab] = useState('RSI');
  const { candles, indicators, loading } = useChartData(symbol, interval);

  const last = candles.length - 1;

  // Prepare chart data
  const chartData = candles.slice(-120).map((c, i) => {
    const idx     = candles.length - 120 + i;
    const rsi     = indicators?.rsi14?.[idx];
    const macdL   = indicators?.macd?.macdLine?.[idx];
    const sigL    = indicators?.macd?.sigLine?.[idx];
    const hist    = indicators?.macd?.histogram?.[idx];
    const bb      = indicators?.bb?.[idx];
    return {
      time:   format(new Date(c.time * 1000), 'HH:mm'),
      rsi:    rsi ?? null,
      macd:   macdL ?? null,
      signal: sigL  ?? null,
      hist:   hist  ?? null,
      price:  c.close,
      upper:  bb?.upper ?? null,
      middle: bb?.middle ?? null,
      lower:  bb?.lower ?? null,
    };
  });

  const lastRSI  = indicators?.rsi14?.[last] ?? null;
  const lastMACD = indicators?.macd?.macdLine?.[last] ?? null;
  const lastHist = indicators?.macd?.histogram?.[last] ?? null;
  const sig      = rsiSignal(lastRSI);

  return (
    <div style={S.wrap}>
      {/* Tabs */}
      <div style={S.tabRow}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              ...S.tab,
              color:       tab === t ? '#00ff88' : '#4a7a5a',
              borderBottom: tab === t ? '2px solid #00ff88' : '2px solid transparent',
            }}
          >{t}</button>
        ))}
        <span style={{ marginLeft: 'auto', padding: '0 12px', display: 'flex', alignItems: 'center' }}>
          {tab === 'RSI' && lastRSI !== null && (
            <span style={{ ...S.sig, background: sig.color + '18', color: sig.color, border: `1px solid ${sig.color}44` }}>
              RSI {lastRSI.toFixed(1)} — {sig.text}
            </span>
          )}
          {tab === 'MACD' && lastHist !== null && (
            <span style={{ ...S.sig, background: lastHist >= 0 ? '#00ff8818' : '#ff4d6d18', color: lastHist >= 0 ? '#00ff88' : '#ff4d6d', border: `1px solid ${lastHist >= 0 ? '#00ff8844' : '#ff4d6d44'}` }}>
              HIST {lastHist >= 0 ? '+' : ''}{lastHist.toFixed(4)}
            </span>
          )}
        </span>
      </div>

      {/* Chart */}
      <div style={S.chartWrap}>
        {loading ? (
          <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: "'Space Mono', monospace", color: '#4a7a5a', fontSize: 11 }}>CALCULATING...</span>
          </div>
        ) : tab === 'RSI' ? (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#2a5a3a', fontFamily: "'Space Mono', monospace" }} interval={20} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#2a5a3a', fontFamily: "'Space Mono', monospace" }} width={32} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={70} stroke="#ff4d6d44" strokeDasharray="3 3" />
              <ReferenceLine y={30} stroke="#00ff8844" strokeDasharray="3 3" />
              <ReferenceLine y={50} stroke="#ffffff11" strokeDasharray="2 4" />
              <Line type="monotone" dataKey="rsi" stroke="#00ff88" dot={false} strokeWidth={1.5} name="RSI" connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : tab === 'MACD' ? (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#2a5a3a', fontFamily: "'Space Mono', monospace" }} interval={20} />
              <YAxis tick={{ fontSize: 9, fill: '#2a5a3a', fontFamily: "'Space Mono', monospace" }} width={40} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#ffffff22" />
              <Bar dataKey="hist" name="Histogram" maxBarSize={4}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.hist >= 0 ? '#00ff8888' : '#ff4d6d88'} />
                ))}
              </Bar>
              <Line type="monotone" dataKey="macd" stroke="#00aaff" dot={false} strokeWidth={1.5} name="MACD" connectNulls={false} />
              <Line type="monotone" dataKey="signal" stroke="#ff8800" dot={false} strokeWidth={1.5} name="Signal" connectNulls={false} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          // Bollinger Bands vs Price
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#2a5a3a', fontFamily: "'Space Mono', monospace" }} interval={20} />
              <YAxis tick={{ fontSize: 9, fill: '#2a5a3a', fontFamily: "'Space Mono', monospace" }} width={52} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="upper"  stroke="#8888ff" dot={false} strokeWidth={1} name="Upper Band" />
              <Line type="monotone" dataKey="middle" stroke="#8888ff66" dot={false} strokeWidth={1} strokeDasharray="4 2" name="Middle" />
              <Line type="monotone" dataKey="lower"  stroke="#8888ff" dot={false} strokeWidth={1} name="Lower Band" />
              <Line type="monotone" dataKey="price"  stroke="#00ff88" dot={false} strokeWidth={1.5} name="Price" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
