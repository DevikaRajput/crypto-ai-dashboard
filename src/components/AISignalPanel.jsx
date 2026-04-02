// ─────────────────────────────────────────────────────────────────────────────
//  AISignalPanel — Live AI Trading Signal Widget
//  Shown in the Chart tab sidebar.
//  Fetches current RSI, MACD, Fear & Greed data and asks Claude to
//  generate a structured BUY / SELL / HOLD signal with reasoning.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, RefreshCw } from 'lucide-react';
import { generateSignal, getApiKey } from '../services/claude';

const mono  = "'Space Mono', monospace";
const syne  = "'Syne', sans-serif";

const S = {
  wrap: {
    background: '#0a0f0a',
    border: '1px solid #1a3a2a',
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
    fontFamily: syne,
    fontSize: 12,
    fontWeight: 700,
    color: '#88cc99',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    flex: 1,
  },
  body: { padding: 14, display: 'flex', flexDirection: 'column', gap: 12 },
  mono: { fontFamily: mono },
};

function sigConfig(signal) {
  if (signal === 'BUY')  return { color: '#00ff88', bg: '#00ff8815', border: '#00ff8844', Icon: TrendingUp };
  if (signal === 'SELL') return { color: '#ff4d6d', bg: '#ff4d6d15', border: '#ff4d6d44', Icon: TrendingDown };
  return                        { color: '#ffd60a', bg: '#ffd60a15', border: '#ffd60a44', Icon: Minus };
}

function riskColor(r) {
  if (r === 'HIGH') return '#ff4d6d';
  if (r === 'LOW')  return '#00ff88';
  return '#ffd60a';
}

function sentimentColor(s) {
  if (s === 'bullish') return '#00ff88';
  if (s === 'bearish') return '#ff4d6d';
  return '#ffd60a';
}

function ConfidenceBar({ pct, color }) {
  return (
    <div style={{ height: 4, background: '#1a2e1a', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width .5s ease' }} />
    </div>
  );
}

export default function AISignalPanel({ symbol, price, indicators, fearGreed, ticker }) {
  const [signal,   setSignal]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const hasKey = !!getApiKey();

  const analyze = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    setSignal(null);

    try {
      const closes       = indicators.closes ?? [];
      const rsi          = indicators.rsi?.toFixed(1) ?? 'N/A';
      const hist         = indicators.macd?.histogram ?? [];
      const lastHist     = hist.filter(Boolean).slice(-1)[0] ?? 0;
      const macdBullish  = lastHist > 0;
      const change24h    = ticker ? parseFloat(ticker.priceChangePercent).toFixed(2) : 'N/A';
      const volume24h    = ticker ? (parseFloat(ticker.quoteVolume) / 1e9).toFixed(2) : 'N/A';

      const result = await generateSignal({
        symbol,
        price: price || closes[closes.length - 1],
        change24h,
        volume24h,
        rsi,
        macdHistogram: lastHist,
        macdBullish,
        fgValue: fearGreed?.value ?? 'N/A',
        fgLabel: fearGreed?.value_classification ?? 'N/A',
        closes,
      });
      setSignal(result);
    } catch (e) {
      if (e.message === 'NO_API_KEY') {
        setError('No API key — add REACT_APP_ANTHROPIC_API_KEY to .env or enter it in AI Oracle settings.');
      } else {
        setError('Analysis failed: ' + e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const cfg = signal ? sigConfig(signal.signal) : null;

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <Brain size={13} color="#00ff88" />
        <span style={S.title}>AI Signal</span>
        <button
          onClick={analyze}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: loading ? 'transparent' : '#00ff8818',
            border: '1px solid #00ff8844',
            borderRadius: 4, padding: '3px 10px',
            color: '#00ff88', fontFamily: mono, fontSize: 9,
            letterSpacing: '0.08em', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          <RefreshCw size={10} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {loading ? 'ANALYZING' : 'ANALYZE'}
        </button>
      </div>

      <div style={S.body}>
        {/* Idle state */}
        {!signal && !loading && !error && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            {hasKey ? (
              <p style={{ ...S.mono, fontSize: 9, color: '#2a5a3a', lineHeight: 1.8 }}>
                Click ANALYZE to get an AI-powered<br />
                BUY / SELL / HOLD signal for {symbol}<br />
                using live RSI · MACD · Fear & Greed
              </p>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, background: '#1a0a0a', border: '1px solid #ff4d6d33', borderRadius: 4, padding: 10, textAlign: 'left' }}>
                <AlertTriangle size={12} color="#ff4d6d" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ ...S.mono, fontSize: 9, color: '#cc7788', lineHeight: 1.8 }}>
                  Add your Anthropic API key to <strong>.env</strong>:<br />
                  <code style={{ color: '#00ff88' }}>REACT_APP_ANTHROPIC_API_KEY=sk-ant-...</code><br />
                  or enter it in the AI Oracle tab.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <p style={{ ...S.mono, fontSize: 9, color: '#00ff88', lineHeight: 2, animation: 'pulse 1.5s ease-in-out infinite' }}>
              Reading indicators...<br />Consulting AI Oracle...
            </p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ background: '#1a0a0a', border: '1px solid #ff4d6d33', borderRadius: 4, padding: 10 }}>
            <p style={{ ...S.mono, fontSize: 9, color: '#cc7788', lineHeight: 1.7 }}>{error}</p>
          </div>
        )}

        {/* Signal result */}
        {signal && !loading && cfg && (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>

            {/* Main signal badge */}
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 28px', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 6 }}>
                <cfg.Icon size={18} color={cfg.color} />
                <span style={{ fontFamily: syne, fontSize: 22, fontWeight: 800, color: cfg.color, letterSpacing: '0.18em' }}>
                  {signal.signal}
                </span>
              </div>
              <div style={{ marginTop: 6 }}>
                <span style={{ ...S.mono, fontSize: 9, color: '#4a7a5a' }}>
                  Confidence: <span style={{ color: cfg.color }}>{signal.confidence}%</span>
                  &nbsp;·&nbsp;
                  Risk: <span style={{ color: riskColor(signal.risk_level) }}>{signal.risk_level}</span>
                </span>
                <ConfidenceBar pct={signal.confidence} color={cfg.color} />
              </div>
            </div>

            {/* Reasoning */}
            <div style={{ background: '#060c06', borderLeft: `3px solid ${cfg.color}44`, borderRadius: '0 4px 4px 0', padding: '8px 10px', marginBottom: 10 }}>
              <p style={{ ...S.mono, fontSize: 9, color: '#8ab8a0', lineHeight: 1.8 }}>
                {signal.reasoning}
              </p>
            </div>

            {/* Levels */}
            {signal.entry_zone && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginBottom: 10 }}>
                {[
                  ['ENTRY', `$${signal.entry_zone.low?.toLocaleString()}`, '#60a5fa'],
                  ['TARGET', `$${signal.target?.toLocaleString()}`, '#00ff88'],
                  ['STOP',   `$${signal.stop_loss?.toLocaleString()}`, '#ff4d6d'],
                ].map(([label, val, col]) => (
                  <div key={label} style={{ background: '#070e07', border: '1px solid #1a2e1a', borderRadius: 4, padding: '6px 4px', textAlign: 'center' }}>
                    <div style={{ ...S.mono, fontSize: 8, color: '#2a5a3a', marginBottom: 2 }}>{label}</div>
                    <div style={{ ...S.mono, fontSize: 9, color: col, wordBreak: 'break-all' }}>{val}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Key factors */}
            {signal.key_factors?.map((f, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #0a1a0a' }}>
                <span style={{ ...S.mono, fontSize: 9, color: '#4a7a5a' }}>{f.name}</span>
                <span style={{ ...S.mono, fontSize: 9, color: sentimentColor(f.sentiment) }}>{f.value}</span>
              </div>
            ))}

            {/* Timeframe footer */}
            <div style={{ marginTop: 8, textAlign: 'right' }}>
              <span style={{ ...S.mono, fontSize: 8, color: '#2a5a3a' }}>
                TF: {signal.timeframe}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
