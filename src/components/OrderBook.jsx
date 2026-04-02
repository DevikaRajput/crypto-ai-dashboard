import React, { useMemo } from 'react';
import { useOrderBook } from '../hooks/useMarketData';
import { BookOpen } from 'lucide-react';

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
  colLabels: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    padding: '5px 10px',
    borderBottom: '1px solid #0f1e0f',
    background: '#060c06',
  },
  colLabel: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    color: '#2a5a3a',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    padding: '3px 10px',
    position: 'relative',
    cursor: 'default',
    transition: 'filter 0.1s',
  },
  depthBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    opacity: 0.12,
    transition: 'width 0.3s',
  },
  cell: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    position: 'relative',
    zIndex: 1,
  },
  spread: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '5px 10px',
    borderTop: '1px solid #0f1e0f',
    borderBottom: '1px solid #0f1e0f',
    background: '#060c06',
  },
  spreadLabel: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    color: '#2a5a3a',
    letterSpacing: '0.1em',
  },
  spreadVal: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 12,
    color: '#ffbb00',
    fontWeight: 700,
  },
  totals: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    padding: '8px 10px',
    borderTop: '1px solid #0f1e0f',
    background: '#060c06',
    gap: 8,
  },
  totalBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  totalLabel: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  totalVal: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 12,
    fontWeight: 700,
  },
};

function fmt(n, decimals = 2) {
  if (n === undefined || n === null) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtQty(n) {
  if (n >= 1000) return fmt(n / 1000, 2) + 'K';
  return fmt(n, 4);
}

export default function OrderBook({ symbol }) {
  const { book, loading } = useOrderBook(symbol);

  const { asks, bids, spread, spreadPct, maxDepth, bidTotal, askTotal } = useMemo(() => {
    const asks = [...(book.asks ?? [])].slice(0, 14).reverse(); // lowest ask first → reverse to show ascending
    const bids = [...(book.bids ?? [])].slice(0, 14);
    const topAsk = book.asks?.[0]?.price ?? 0;
    const topBid = book.bids?.[0]?.price ?? 0;
    const spread = topAsk - topBid;
    const spreadPct = topBid ? (spread / topBid) * 100 : 0;

    // cumulative for depth bars
    let bidRunning = 0, askRunning = 0;
    const bidsWithCum = bids.map((b) => { bidRunning += b.qty; return { ...b, cum: bidRunning }; });
    const asksWithCum = [...book.asks ?? []].slice(0, 14).map((a) => { askRunning += a.qty; return { ...a, cum: askRunning }; }).reverse();

    const maxDepth = Math.max(bidRunning, askRunning, 1);
    const bidTotal = bids.reduce((s, b) => s + b.qty * b.price, 0);
    const askTotal = [...(book.asks ?? [])].slice(0, 14).reduce((s, a) => s + a.qty * a.price, 0);

    return { asks: asksWithCum, bids: bidsWithCum, spread, spreadPct, maxDepth, bidTotal, askTotal };
  }, [book]);

  const midPrice = ((book.asks?.[0]?.price ?? 0) + (book.bids?.[0]?.price ?? 0)) / 2;

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <BookOpen size={13} color="#00ff88" />
        <span style={S.title}>Order Book</span>
        {loading && <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: '#2a5a3a' }}>LOADING...</span>}
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#4a7a5a' }}>{symbol}</span>
      </div>

      <div style={S.colLabels}>
        <span style={S.colLabel}>PRICE</span>
        <span style={{ ...S.colLabel, textAlign: 'center' }}>QTY</span>
        <span style={{ ...S.colLabel, textAlign: 'right' }}>TOTAL</span>
      </div>

      {/* ASK rows (sell wall) */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {asks.map((ask, i) => (
          <div key={i} style={S.row}>
            <div style={{ ...S.depthBar, background: '#ff4d6d', width: `${(ask.cum / maxDepth) * 100}%` }} />
            <span style={{ ...S.cell, color: '#ff4d6d' }}>{fmt(ask.price)}</span>
            <span style={{ ...S.cell, color: '#88cc99', textAlign: 'center' }}>{fmtQty(ask.qty)}</span>
            <span style={{ ...S.cell, color: '#4a7a5a', textAlign: 'right' }}>{fmtQty(ask.cum)}</span>
          </div>
        ))}
      </div>

      {/* Spread */}
      <div style={S.spread}>
        <span style={S.spreadLabel}>MID ${fmt(midPrice)}</span>
        <span style={S.spreadVal}>SPREAD {fmt(spread, 2)}</span>
        <span style={S.spreadLabel}>{spreadPct.toFixed(4)}%</span>
      </div>

      {/* BID rows (buy wall) */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {bids.map((bid, i) => (
          <div key={i} style={S.row}>
            <div style={{ ...S.depthBar, background: '#00ff88', width: `${(bid.cum / maxDepth) * 100}%` }} />
            <span style={{ ...S.cell, color: '#00ff88' }}>{fmt(bid.price)}</span>
            <span style={{ ...S.cell, color: '#88cc99', textAlign: 'center' }}>{fmtQty(bid.qty)}</span>
            <span style={{ ...S.cell, color: '#4a7a5a', textAlign: 'right' }}>{fmtQty(bid.cum)}</span>
          </div>
        ))}
      </div>

      {/* Totals + imbalance */}
      <div style={S.totals}>
        <div style={S.totalBlock}>
          <span style={{ ...S.totalLabel, color: '#00ff8888' }}>BID WALL</span>
          <span style={{ ...S.totalVal, color: '#00ff88' }}>${(bidTotal / 1000).toFixed(0)}K</span>
        </div>
        <div style={{ ...S.totalBlock, alignItems: 'flex-end' }}>
          <span style={{ ...S.totalLabel, color: '#ff4d6d88' }}>ASK WALL</span>
          <span style={{ ...S.totalVal, color: '#ff4d6d' }}>${(askTotal / 1000).toFixed(0)}K</span>
        </div>
      </div>

      {/* Imbalance bar */}
      {(bidTotal + askTotal) > 0 && (() => {
        const bidPct = (bidTotal / (bidTotal + askTotal)) * 100;
        return (
          <div style={{ padding: '0 10px 8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: '#00ff88' }}>
                {bidPct.toFixed(1)}% BUY
              </span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: '#ff4d6d' }}>
                SELL {(100 - bidPct).toFixed(1)}%
              </span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: '#ff4d6d44', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${bidPct}%`, background: 'linear-gradient(90deg, #00ff88, #00cc66)', borderRadius: 2, transition: 'width 0.5s' }} />
            </div>
          </div>
        );
      })()}
    </div>
  );
}
