import React, { useEffect, useState } from 'react';
import { Activity, Wifi, WifiOff } from 'lucide-react';
import { useTicker } from '../hooks/useMarketData';

const S = {
  header: {
    background: 'linear-gradient(180deg, #0a0f0a 0%, #060c06 100%)',
    borderBottom: '1px solid #1a2e1a',
    padding: '0 24px',
    height: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 18,
    color: '#00ff88',
    letterSpacing: '0.08em',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 28,
    height: 28,
    background: 'linear-gradient(135deg, #00ff88, #00cc66)',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickerBar: {
    display: 'flex',
    gap: 24,
    alignItems: 'center',
  },
  tickerItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 4,
    transition: 'background 0.2s',
  },
  symLabel: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 10,
    color: '#4a7a5a',
    letterSpacing: '0.1em',
  },
  priceLabel: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 13,
    fontWeight: 700,
  },
  changeLabel: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 10,
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    animation: 'pulse 2s infinite',
  },
  statusText: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 10,
    color: '#4a7a5a',
  },
  time: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    color: '#2a5a3a',
  },
};

const TICKER_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT'];

function fmt(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n.toFixed(4);
}

export default function Header({ isConnected, activeSymbol, onSymbolChange }) {
  const tickers = useTicker(TICKER_SYMBOLS);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header style={S.header}>
      {/* Logo */}
      <div style={S.logo}>
        <div style={S.logoIcon}>
          <Activity size={14} color="#030712" />
        </div>
        CRYPTOTERMINAL
      </div>

      {/* Ticker Strip */}
      <div style={S.tickerBar}>
        {TICKER_SYMBOLS.map((sym) => {
          const t      = tickers[sym];
          const pct    = t?.change ?? 0;
          const col    = pct >= 0 ? '#00ff88' : '#ff4d6d';
          const isActive = sym === activeSymbol;
          return (
            <div
              key={sym}
              style={{
                ...S.tickerItem,
                background: isActive ? 'rgba(0,255,136,0.08)' : 'transparent',
                border: isActive ? '1px solid rgba(0,255,136,0.2)' : '1px solid transparent',
              }}
              onClick={() => onSymbolChange(sym)}
            >
              <span style={S.symLabel}>{sym.replace('USDT', '/USDT')}</span>
              <span style={{ ...S.priceLabel, color: col }}>${fmt(t?.price)}</span>
              <span style={{ ...S.changeLabel, color: col }}>
                {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Status */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <div style={S.statusRow}>
          {isConnected
            ? <Wifi size={12} color="#00ff88" />
            : <WifiOff size={12} color="#ff4d6d" />
          }
          <span style={{ ...S.statusText, color: isConnected ? '#00ff88' : '#ff4d6d' }}>
            {isConnected ? 'LIVE' : 'DISCONNECTED'}
          </span>
          <div style={{ ...S.statusDot, background: isConnected ? '#00ff88' : '#ff4d6d' }} />
        </div>
        <span style={S.time}>
          {now.toUTCString().slice(17, 25)} UTC
        </span>
      </div>
    </header>
  );
}
