// ─────────────────────────────────────────────
//  API Services
//  Sources:
//    1. CoinGecko  – market overview, prices, chart data
//    2. Binance    – OHLCV klines, 24h tickers (REST)
//    3. Alternative.me – Fear & Greed Index
//    4. Binance WS – real-time trade stream
// ─────────────────────────────────────────────

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const BINANCE_BASE   = 'https://api.binance.com/api/v3';
const FNG_BASE       = 'https://api.alternative.me';

// ── Helpers ──────────────────────────────────

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, { ...opts });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

// ── CoinGecko ────────────────────────────────

/**
 * Top N coins by market cap with price, volume, change data
 */
export async function getCoinMarkets(vsCurrency = 'usd', perPage = 20) {
  const url = `${COINGECKO_BASE}/coins/markets?vs_currency=${vsCurrency}&order=market_cap_desc&per_page=${perPage}&page=1&sparkline=true&price_change_percentage=1h,24h,7d`;
  return fetchJson(url);
}

/**
 * Global crypto market data (total market cap, BTC dominance, etc.)
 */
export async function getGlobalData() {
  const data = await fetchJson(`${COINGECKO_BASE}/global`);
  return data.data;
}

/**
 * OHLCV data for a coin (CoinGecko, used as fallback)
 * @param {string} coinId  e.g. "bitcoin"
 * @param {string} days    "1", "7", "30", "365", "max"
 */
export async function getCoinOHLC(coinId = 'bitcoin', days = '1') {
  return fetchJson(`${COINGECKO_BASE}/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`);
}

/**
 * Single coin detail (for description, links, etc.)
 */
export async function getCoinDetail(coinId = 'bitcoin') {
  return fetchJson(
    `${COINGECKO_BASE}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
  );
}

// ── Binance ──────────────────────────────────

/**
 * Kline (OHLCV) data from Binance
 * @param {string} symbol   e.g. "BTCUSDT"
 * @param {string} interval "1m","5m","15m","1h","4h","1d"
 * @param {number} limit    max 1000
 */
export async function getBinanceKlines(symbol = 'BTCUSDT', interval = '1h', limit = 200) {
  const url = `${BINANCE_BASE}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const raw = await fetchJson(url);
  // [openTime, open, high, low, close, volume, closeTime, ...]
  return raw.map((k) => ({
    time:   Math.floor(k[0] / 1000),  // seconds (for lightweight-charts)
    open:   parseFloat(k[1]),
    high:   parseFloat(k[2]),
    low:    parseFloat(k[3]),
    close:  parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }));
}

/**
 * 24h ticker stats for one or all symbols
 * @param {string|null} symbol  pass null to get all
 */
export async function getBinanceTicker24h(symbol = null) {
  const url = symbol
    ? `${BINANCE_BASE}/ticker/24hr?symbol=${symbol}`
    : `${BINANCE_BASE}/ticker/24hr`;
  return fetchJson(url);
}

/**
 * Current best bid/ask price
 */
export async function getBinanceBookTicker(symbol = 'BTCUSDT') {
  return fetchJson(`${BINANCE_BASE}/ticker/bookTicker?symbol=${symbol}`);
}

/**
 * Recent trades
 */
export async function getBinanceRecentTrades(symbol = 'BTCUSDT', limit = 30) {
  const raw = await fetchJson(`${BINANCE_BASE}/trades?symbol=${symbol}&limit=${limit}`);
  return raw.map((t) => ({
    id:       t.id,
    price:    parseFloat(t.price),
    qty:      parseFloat(t.qty),
    time:     t.time,
    isBuyer:  t.isBuyerMaker,
  }));
}

// ── Fear & Greed Index ───────────────────────

/**
 * Current Fear & Greed value (0-100)
 */
export async function getFearGreedIndex() {
  const data = await fetchJson(`${FNG_BASE}/fng/?limit=7`);
  return data.data; // array of { value, value_classification, timestamp }
}

// ── Order Book ───────────────────────────────

/**
 * Binance order book snapshot (bids & asks)
 * @param {string} symbol  e.g. "BTCUSDT"
 * @param {number} limit   5, 10, 20, 50, 100
 */
export async function getBinanceOrderBook(symbol = 'BTCUSDT', limit = 20) {
  const data = await fetchJson(`${BINANCE_BASE}/depth?symbol=${symbol}&limit=${limit}`);
  return {
    bids: data.bids.map(([price, qty]) => ({ price: parseFloat(price), qty: parseFloat(qty) })),
    asks: data.asks.map(([price, qty]) => ({ price: parseFloat(price), qty: parseFloat(qty) })),
    lastUpdateId: data.lastUpdateId,
  };
}

// ── Crypto News (CryptoPanic public API) ─────

/**
 * Latest crypto news — no API key required for public feed
 * @param {string} currencies  comma-separated e.g. "BTC,ETH"
 */
export async function getCryptoNews(currencies = 'BTC,ETH,BNB') {
  const url = `https://cryptopanic.com/api/v1/posts/?auth_token=public&currencies=${currencies}&kind=news&public=true`;
  const data = await fetchJson(url);
  return (data.results ?? []).map((item) => ({
    id:        item.id,
    title:     item.title,
    url:       item.url,
    source:    item.source?.title ?? 'Unknown',
    published: item.published_at,
    votes:     item.votes,
    currencies: item.currencies?.map((c) => c.code) ?? [],
  }));
}

// ── CoinGecko trending ────────────────────────

export async function getTrendingCoins() {
  const data = await fetchJson(`${COINGECKO_BASE}/search/trending`);
  return data.coins?.map((c) => ({
    id:     c.item.id,
    name:   c.item.name,
    symbol: c.item.symbol,
    rank:   c.item.market_cap_rank,
    thumb:  c.item.thumb,
    score:  c.item.score,
    price_btc: c.item.price_btc,
  })) ?? [];
}

// ── Multi-coin price (portfolio) ──────────────

/**
 * Fetch current prices for a list of coinIds
 */
export async function getCoinPrices(coinIds = ['bitcoin', 'ethereum']) {
  const ids = coinIds.join(',');
  const data = await fetchJson(
    `${COINGECKO_BASE}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`
  );
  return data;
}

// ── Exchange Info (all tradable USDT pairs) ──

export async function getBinanceExchangeInfo() {
  const data = await fetchJson(`${BINANCE_BASE}/exchangeInfo`);
  return data.symbols
    .filter((s) => s.quoteAsset === 'USDT' && s.status === 'TRADING')
    .map((s) => s.symbol);
}

// ── Technical Indicators ─────────────────────

/** Simple Moving Average */
export function calcSMA(closes, period) {
  return closes.map((_, i) => {
    if (i < period - 1) return null;
    const slice = closes.slice(i - period + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
  });
}

/** Exponential Moving Average */
export function calcEMA(closes, period) {
  const k = 2 / (period + 1);
  const ema = Array(closes.length).fill(null);
  let start = period - 1;
  ema[start] = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = start + 1; i < closes.length; i++) {
    ema[i] = closes[i] * k + ema[i - 1] * (1 - k);
  }
  return ema;
}

/** RSI */
export function calcRSI(closes, period = 14) {
  const rsi = Array(closes.length).fill(null);
  if (closes.length < period + 1) return rsi;

  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  rsi[period] = 100 - 100 / (1 + avgGain / (avgLoss || 0.0001));

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
    rsi[i] = 100 - 100 / (1 + avgGain / (avgLoss || 0.0001));
  }
  return rsi;
}

/** MACD */
export function calcMACD(closes, fast = 12, slow = 26, signal = 9) {
  const emaFast   = calcEMA(closes, fast);
  const emaSlow   = calcEMA(closes, slow);
  const macdLine  = closes.map((_, i) =>
    emaFast[i] !== null && emaSlow[i] !== null ? emaFast[i] - emaSlow[i] : null
  );
  const validMACD = macdLine.filter((v) => v !== null);
  const sigRaw    = calcEMA(validMACD, signal);
  let sigIdx = 0;
  const sigLine = macdLine.map((v) => (v !== null ? sigRaw[sigIdx++] ?? null : null));
  const histogram = macdLine.map((v, i) =>
    v !== null && sigLine[i] !== null ? v - sigLine[i] : null
  );
  return { macdLine, sigLine, histogram };
}

/** Bollinger Bands */
export function calcBollingerBands(closes, period = 20, stdDev = 2) {
  const sma = calcSMA(closes, period);
  return closes.map((_, i) => {
    if (sma[i] === null) return { upper: null, middle: null, lower: null };
    const slice = closes.slice(i - period + 1, i + 1);
    const variance = slice.reduce((sum, v) => sum + (v - sma[i]) ** 2, 0) / period;
    const sd = Math.sqrt(variance);
    return { upper: sma[i] + stdDev * sd, middle: sma[i], lower: sma[i] - stdDev * sd };
  });
}
