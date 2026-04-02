import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { useChartData, useBinanceStream } from '../hooks/useMarketData';

const INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d'];
const OVERLAYS  = ['SMA20', 'EMA20', 'EMA50', 'BB'];

const S = {
  wrapper: {
    background: '#0a0f0a',
    border: '1px solid #1a2e1a',
    borderRadius: 8,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    borderBottom: '1px solid #1a2e1a',
    background: '#060c06',
    flexWrap: 'wrap',
    gap: 8,
  },
  priceBlock: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 10,
  },
  price: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  change: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 13,
    padding: '2px 8px',
    borderRadius: 4,
  },
  controls: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  pill: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    padding: '4px 10px',
    borderRadius: 4,
    cursor: 'pointer',
    border: '1px solid',
    transition: 'all 0.15s',
    letterSpacing: '0.05em',
  },
  chartArea: {
    flex: 1,
    position: 'relative',
  },
  volumeLabel: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    color: '#2a4a3a',
    position: 'absolute',
    top: 8,
    left: 12,
    letterSpacing: '0.08em',
    zIndex: 5,
  },
  statRow: {
    display: 'flex',
    gap: 20,
    padding: '8px 16px',
    borderTop: '1px solid #0f1e0f',
    background: '#060c06',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  statLabel: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    color: '#2a5a3a',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  },
  statValue: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 12,
    color: '#88cc99',
  },
};

function fmtPrice(n, sym) {
  if (!n) return '—';
  const d = sym?.startsWith('BTC') ? 2 : sym?.startsWith('ETH') ? 2 : 4;
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function fmtVol(n) {
  if (!n) return '—';
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
  return n.toFixed(2);
}

export default function CandlestickChart({ symbol, height = 460 }) {
  const chartRef   = useRef(null);
  const chartObj   = useRef(null);
  const candleSeries = useRef(null);
  const volSeries  = useRef(null);
  const smaSeries  = useRef(null);
  const emaSeries  = useRef(null);
  const ema50Ref   = useRef(null);
  const bbUpperRef = useRef(null);
  const bbLowerRef = useRef(null);
  const bbMidRef   = useRef(null);

  const [interval, setInterval2] = useState('1h');
  const [overlays, setOverlays]  = useState(['SMA20', 'EMA20']);
  const [hoveredBar, setHovered] = useState(null);

  const { candles, indicators, loading, error, refresh } = useChartData(symbol, interval);
  const { price, isConnected }                           = useBinanceStream(symbol);

  // ── Build / update chart ─────────────────────
  useEffect(() => {
    if (!chartRef.current) return;

    const chart = createChart(chartRef.current, {
      layout: {
        background: { color: '#0a0f0a' },
        textColor:  '#4a7a5a',
        fontFamily: "'Space Mono', monospace",
        fontSize:   10,
      },
      grid: {
        vertLines: { color: '#0f1e0f' },
        horzLines: { color: '#0f1e0f' },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: '#00ff8855', labelBackgroundColor: '#0a3a1a' },
        horzLine: { color: '#00ff8855', labelBackgroundColor: '#0a3a1a' },
      },
      rightPriceScale: {
        borderColor: '#1a2e1a',
        scaleMargins: { top: 0.1, bottom: 0.3 },
      },
      timeScale: {
        borderColor: '#1a2e1a',
        timeVisible: true,
        secondsVisible: false,
      },
      watermark: { visible: false },
    });

    chart.resize(chartRef.current.clientWidth, height);

    // Candlestick
    const cs = chart.addCandlestickSeries({
      upColor:        '#00ff88',
      downColor:      '#ff4d6d',
      borderUpColor:  '#00ff88',
      borderDownColor:'#ff4d6d',
      wickUpColor:    '#00ff8899',
      wickDownColor:  '#ff4d6d99',
    });

    // Volume (as histogram on separate pane scale)
    const vs = chart.addHistogramSeries({
      priceFormat:    { type: 'volume' },
      priceScaleId:   'vol',
      scaleMargins:   { top: 0.75, bottom: 0 },
    });

    // Overlay series
    const sma = chart.addLineSeries({ color: '#ffbb00', lineWidth: 1, priceScaleId: 'right' });
    const ema = chart.addLineSeries({ color: '#00aaff', lineWidth: 1, priceScaleId: 'right' });
    const e50 = chart.addLineSeries({ color: '#ff8800', lineWidth: 1, priceScaleId: 'right', lineStyle: 2 });
    const bbu = chart.addLineSeries({ color: '#8888ff55', lineWidth: 1, priceScaleId: 'right' });
    const bbl = chart.addLineSeries({ color: '#8888ff55', lineWidth: 1, priceScaleId: 'right' });
    const bbm = chart.addLineSeries({ color: '#8888ff33', lineWidth: 1, priceScaleId: 'right', lineStyle: 1 });

    chart.subscribeCrosshairMove((param) => {
      if (param?.seriesData?.size) {
        setHovered(param.seriesData.get(cs) ?? null);
      } else {
        setHovered(null);
      }
    });

    const ro = new ResizeObserver(() => {
      if (chartRef.current) {
        chart.resize(chartRef.current.clientWidth, height);
      }
    });
    ro.observe(chartRef.current);

    chartObj.current    = chart;
    candleSeries.current = cs;
    volSeries.current   = vs;
    smaSeries.current   = sma;
    emaSeries.current   = ema;
    ema50Ref.current    = e50;
    bbUpperRef.current  = bbu;
    bbLowerRef.current  = bbl;
    bbMidRef.current    = bbm;

    return () => { chart.remove(); ro.disconnect(); };
  }, [height]);

  // ── Feed data ────────────────────────────────
  useEffect(() => {
    if (!candles.length || !candleSeries.current) return;

    candleSeries.current.setData(candles);
    volSeries.current.setData(
      candles.map((c) => ({
        time:  c.time,
        value: c.volume,
        color: c.close >= c.open ? '#00ff8830' : '#ff4d6d30',
      }))
    );

    // Indicators
    const idx = indicators;
    if (!idx) return;
    const mkLine = (arr, series) => {
      const pts = candles
        .map((c, i) => ({ time: c.time, value: arr[i] }))
        .filter((p) => p.value !== null && !isNaN(p.value));
      series.setData(pts);
    };

    smaSeries.current.setData(
      overlays.includes('SMA20') && idx.sma20
        ? candles.map((c, i) => ({ time: c.time, value: idx.sma20[i] })).filter((p) => p.value !== null)
        : []
    );
    emaSeries.current.setData(
      overlays.includes('EMA20') && idx.ema20
        ? candles.map((c, i) => ({ time: c.time, value: idx.ema20[i] })).filter((p) => p.value !== null)
        : []
    );
    ema50Ref.current.setData(
      overlays.includes('EMA50') && idx.ema50
        ? candles.map((c, i) => ({ time: c.time, value: idx.ema50[i] })).filter((p) => p.value !== null)
        : []
    );
    if (overlays.includes('BB') && idx.bb) {
      bbUpperRef.current.setData(candles.map((c, i) => ({ time: c.time, value: idx.bb[i].upper })).filter((p) => p.value !== null));
      bbLowerRef.current.setData(candles.map((c, i) => ({ time: c.time, value: idx.bb[i].lower })).filter((p) => p.value !== null));
      bbMidRef.current.setData(candles.map((c, i) => ({ time: c.time, value: idx.bb[i].middle })).filter((p) => p.value !== null));
    } else {
      bbUpperRef.current.setData([]);
      bbLowerRef.current.setData([]);
      bbMidRef.current.setData([]);
    }
  }, [candles, indicators, overlays]);

  // Live price update
  useEffect(() => {
    if (price && candles.length && candleSeries.current) {
      const last = candles[candles.length - 1];
      candleSeries.current.update({ ...last, close: price, high: Math.max(last.high, price), low: Math.min(last.low, price) });
    }
  }, [price]);

  const lastCandle = candles[candles.length - 1];
  const displayPrice = price ?? lastCandle?.close;
  const priceChange  = lastCandle ? ((displayPrice - lastCandle.open) / lastCandle.open) * 100 : 0;
  const isUp = priceChange >= 0;
  const col  = isUp ? '#00ff88' : '#ff4d6d';

  const hov = hoveredBar;

  const toggleOverlay = (o) => setOverlays((prev) =>
    prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]
  );

  return (
    <div style={S.wrapper}>
      {/* Toolbar */}
      <div style={S.toolbar}>
        <div style={S.priceBlock}>
          <span style={{ ...S.price, color: col }}>
            ${fmtPrice(displayPrice, symbol)}
          </span>
          {isUp
            ? <TrendingUp size={14} color={col} />
            : <TrendingDown size={14} color={col} />
          }
          <span style={{ ...S.change, color: col, background: col + '18', border: `1px solid ${col}44` }}>
            {isUp ? '+' : ''}{priceChange.toFixed(2)}%
          </span>
          {hov && (
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#4a7a5a', marginLeft: 8 }}>
              O: {fmtPrice(hov.open, symbol)}  H: {fmtPrice(hov.high, symbol)}  L: {fmtPrice(hov.low, symbol)}  C: {fmtPrice(hov.close, symbol)}
            </span>
          )}
        </div>

        <div style={S.controls}>
          {/* Interval */}
          <div style={{ display: 'flex', gap: 4 }}>
            {INTERVALS.map((iv) => (
              <button
                key={iv}
                onClick={() => setInterval2(iv)}
                style={{
                  ...S.pill,
                  background:   interval === iv ? '#00ff8818' : 'transparent',
                  borderColor:  interval === iv ? '#00ff8866' : '#1a2e1a',
                  color:        interval === iv ? '#00ff88' : '#4a7a5a',
                }}
              >{iv}</button>
            ))}
          </div>

          {/* Overlays */}
          <div style={{ display: 'flex', gap: 4 }}>
            {OVERLAYS.map((o) => {
              const colors = { SMA20: '#ffbb00', EMA20: '#00aaff', EMA50: '#ff8800', BB: '#8888ff' };
              const active = overlays.includes(o);
              return (
                <button key={o} onClick={() => toggleOverlay(o)} style={{
                  ...S.pill,
                  background:  active ? colors[o] + '18' : 'transparent',
                  borderColor: active ? colors[o] + '66' : '#1a2e1a',
                  color:       active ? colors[o] : '#2a4a3a',
                }}>{o}</button>
              );
            })}
          </div>

          <button
            onClick={refresh}
            style={{ ...S.pill, background: 'transparent', borderColor: '#1a2e1a', color: '#4a7a5a' }}
          >
            <RefreshCw size={11} />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div style={{ ...S.chartArea, height }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0f0a', zIndex: 10 }}>
            <span style={{ fontFamily: "'Space Mono', monospace", color: '#00ff88', fontSize: 12 }}>
              LOADING KLINES...
            </span>
          </div>
        )}
        {error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0f0a', zIndex: 10 }}>
            <span style={{ fontFamily: "'Space Mono', monospace", color: '#ff4d6d', fontSize: 12 }}>
              ⚠ {error}
            </span>
          </div>
        )}
        <span style={S.volumeLabel}>VOLUME</span>
        <div ref={chartRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* Stats row */}
      <div style={S.statRow}>
        {[
          ['OPEN',   fmtPrice(lastCandle?.open,   symbol)],
          ['HIGH',   fmtPrice(lastCandle?.high,   symbol)],
          ['LOW',    fmtPrice(lastCandle?.low,    symbol)],
          ['VOLUME', fmtVol(lastCandle?.volume)],
          ['RSI 14', indicators?.rsi14?.[indicators.rsi14.length - 1]?.toFixed(1) ?? '—'],
        ].map(([label, val]) => (
          <div key={label} style={S.stat}>
            <span style={S.statLabel}>{label}</span>
            <span style={S.statValue}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
