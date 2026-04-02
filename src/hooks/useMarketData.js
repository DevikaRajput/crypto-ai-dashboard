// ─────────────────────────────────────────────
//  Custom Hooks
// ─────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getBinanceKlines,
  getBinanceTicker24h,
  getBinanceRecentTrades,
  getCoinMarkets,
  getGlobalData,
  getFearGreedIndex,
  getBinanceOrderBook,
  getCryptoNews,
  getTrendingCoins,
  getCoinPrices,
  calcSMA, calcEMA, calcRSI, calcMACD, calcBollingerBands,
} from '../services/api';

// ── Binance WebSocket Trade Stream ────────────
export function useBinanceStream(symbol) {
  const [lastTrade, setLastTrade] = useState(null);
  const [price, setPrice]         = useState(null);
  const [isConnected, setConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    const sym = symbol.toLowerCase();
    const ws  = new WebSocket(`wss://stream.binance.com:9443/ws/${sym}@aggTrade`);

    ws.onopen  = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data);
      const trade = {
        price:   parseFloat(d.p),
        qty:     parseFloat(d.q),
        isBuyer: d.m,
        time:    d.T,
      };
      setLastTrade(trade);
      setPrice(trade.price);
    };

    wsRef.current = ws;
    return () => ws.close();
  }, [symbol]);

  return { lastTrade, price, isConnected };
}

// ── Binance Kline/Indicator Data ──────────────
export function useChartData(symbol, interval) {
  const [candles,    setCandles]    = useState([]);
  const [indicators, setIndicators] = useState({});
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const klines = await getBinanceKlines(symbol, interval, 300);
      setCandles(klines);
      const closes = klines.map((c) => c.close);
      setIndicators({
        sma20:  calcSMA(closes, 20),
        ema20:  calcEMA(closes, 20),
        ema50:  calcEMA(closes, 50),
        rsi14:  calcRSI(closes, 14),
        macd:   calcMACD(closes, 12, 26, 9),
        bb:     calcBollingerBands(closes, 20, 2),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [symbol, interval]);

  useEffect(() => { load(); }, [load]);

  // re-fetch every 30s
  useEffect(() => {
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  return { candles, indicators, loading, error, refresh: load };
}

// ── Market Overview (CoinGecko) ───────────────
export function useMarketOverview() {
  const [coins,   setCoins]   = useState([]);
  const [global,  setGlobal]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [coinsData, globalData] = await Promise.all([
          getCoinMarkets('usd', 20),
          getGlobalData(),
        ]);
        setCoins(coinsData);
        setGlobal(globalData);
      } catch (_) {}
      finally { setLoading(false); }
    }
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  return { coins, global, loading };
}

// ── 24h Ticker (Binance) ──────────────────────
export function useTicker(symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT']) {
  const [tickers, setTickers] = useState({});

  useEffect(() => {
    async function load() {
      try {
        const all = await getBinanceTicker24h();
        const filtered = {};
        symbols.forEach((s) => {
          const t = all.find((x) => x.symbol === s);
          if (t) filtered[s] = {
            price:    parseFloat(t.lastPrice),
            change:   parseFloat(t.priceChangePercent),
            volume:   parseFloat(t.quoteVolume),
            high:     parseFloat(t.highPrice),
            low:      parseFloat(t.lowPrice),
          };
        });
        setTickers(filtered);
      } catch (_) {}
    }
    load();
    const id = setInterval(load, 5_000);
    return () => clearInterval(id);
  }, [symbols.join(',')]);

  return tickers;
}

// ── Fear & Greed ──────────────────────────────
export function useFearGreed() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const raw = await getFearGreedIndex();
        setData(raw);
      } catch (_) {}
      finally { setLoading(false); }
    }
    load();
    const id = setInterval(load, 3_600_000); // 1h
    return () => clearInterval(id);
  }, []);

  return { data, loading };
}

// ── Recent Trades ──────────────────────────────
export function useRecentTrades(symbol) {
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const t = await getBinanceRecentTrades(symbol, 40);
        setTrades(t.reverse());
      } catch (_) {}
    }
    load();
    const id = setInterval(load, 3_000);
    return () => clearInterval(id);
  }, [symbol]);

  return trades;
}

// ── Order Book ────────────────────────────────
export function useOrderBook(symbol) {
  const [book, setBook]     = useState({ bids: [], asks: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getBinanceOrderBook(symbol, 20);
        setBook(data);
      } catch (_) {}
      finally { setLoading(false); }
    }
    load();
    const id = setInterval(load, 2000);
    return () => clearInterval(id);
  }, [symbol]);

  return { book, loading };
}

// ── Crypto News ───────────────────────────────
export function useCryptoNews(currencies = 'BTC,ETH,BNB') {
  const [news,    setNews]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getCryptoNews(currencies);
        setNews(data);
      } catch (_) {
        // CryptoPanic may not support CORS — silently fail
        setNews([]);
      }
      finally { setLoading(false); }
    }
    load();
    const id = setInterval(load, 120_000);
    return () => clearInterval(id);
  }, [currencies]);

  return { news, loading };
}

// ── Trending Coins ────────────────────────────
export function useTrendingCoins() {
  const [trending, setTrending] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getTrendingCoins();
        setTrending(data);
      } catch (_) {}
      finally { setLoading(false); }
    }
    load();
    const id = setInterval(load, 300_000);
    return () => clearInterval(id);
  }, []);

  return { trending, loading };
}

// ── Portfolio Prices ──────────────────────────
export function usePortfolioPrices(coinIds) {
  const [prices,  setPrices]  = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coinIds.length) { setLoading(false); return; }
    async function load() {
      try {
        const data = await getCoinPrices(coinIds);
        setPrices(data);
      } catch (_) {}
      finally { setLoading(false); }
    }
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [coinIds.join(',')]);

  return { prices, loading };
}
