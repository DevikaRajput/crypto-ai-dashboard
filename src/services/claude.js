// ─────────────────────────────────────────────────────────────────────────────
//  Claude API Service
//  Handles all AI-powered features via the Anthropic API.
//
//  API key priority:
//    1. REACT_APP_ANTHROPIC_API_KEY environment variable
//    2. Key stored in localStorage (set via in-app settings)
//
//  Usage (in your .env):
//    REACT_APP_ANTHROPIC_API_KEY=sk-ant-...
// ─────────────────────────────────────────────────────────────────────────────

const CLAUDE_API = 'https://api.anthropic.com/v1/messages';
const MODEL      = 'claude-sonnet-4-20250514';

// ── Key Resolution ────────────────────────────────────────────────────────────

export function getApiKey() {
  return process.env.REACT_APP_ANTHROPIC_API_KEY || localStorage.getItem('claude_api_key') || '';
}

export function saveApiKey(key) {
  localStorage.setItem('claude_api_key', key.trim());
}

export function clearApiKey() {
  localStorage.removeItem('claude_api_key');
}

// ── Core Fetch ────────────────────────────────────────────────────────────────

async function claudeFetch(messages, systemPrompt, maxTokens = 1000) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('NO_API_KEY');

  const res = await fetch(CLAUDE_API, {
    method: 'POST',
    headers: {
      'Content-Type':            'application/json',
      'x-api-key':               apiKey,
      'anthropic-version':       '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model:      MODEL,
      max_tokens: maxTokens,
      system:     systemPrompt,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

// ── System Prompts ────────────────────────────────────────────────────────────

const SIGNAL_SYSTEM = `You are CryptoOracle, an expert cryptocurrency technical analyst. 
Analyze the provided market data and respond ONLY with a valid JSON object — no markdown fences, no explanation, just raw JSON.

Required format:
{
  "signal": "BUY" | "SELL" | "HOLD",
  "confidence": <integer 0–100>,
  "timeframe": "<string, e.g. '12–24 hours'>",
  "reasoning": "<2–3 concise sentences explaining the signal>",
  "entry_zone": { "low": <number>, "high": <number> },
  "target": <number>,
  "stop_loss": <number>,
  "risk_level": "LOW" | "MEDIUM" | "HIGH",
  "key_factors": [
    { "name": "<indicator name>", "value": "<reading>", "sentiment": "bullish" | "bearish" | "neutral" }
  ]
}`;

const CHAT_SYSTEM = `You are CryptoOracle, a sharp and experienced cryptocurrency market analyst. 
You have deep expertise in technical analysis, on-chain metrics, market microstructure, and crypto fundamentals.
Keep responses focused and concise — 2 to 4 paragraphs. Be direct. Avoid excessive disclaimers.
When given live market context in brackets, use it to ground your answers.`;

const PORTFOLIO_SYSTEM = `You are a crypto portfolio risk analyst. Given a portfolio summary, provide:
1. Overall risk assessment (1 paragraph)
2. Concentration risks or over-allocations (1 paragraph)
3. 2–3 specific, actionable suggestions
Keep the tone professional and concise. No excessive disclaimers.`;

const NEWS_SYSTEM = `You are a crypto market sentiment analyst. Given a list of news headlines, respond ONLY with a JSON array (no markdown, no fences):
[
  { "headline": "<exact headline>", "sentiment": "bullish" | "bearish" | "neutral", "impact": "high" | "medium" | "low", "reason": "<one sentence>" }
]`;

// ── Exported AI Functions ─────────────────────────────────────────────────────

/**
 * Generate a structured BUY/SELL/HOLD signal from live market indicators.
 * @param {object} marketData - { symbol, price, change24h, volume24h, rsi, macdHistogram, macdBullish, fgValue, fgLabel, closes }
 * @returns {object} Parsed signal JSON
 */
export async function generateSignal(marketData) {
  const {
    symbol, price, change24h, volume24h,
    rsi, macdHistogram, macdBullish,
    fgValue, fgLabel, closes = [],
  } = marketData;

  const prompt = `Analyze ${symbol} with these live indicators:

PRICE DATA:
- Current Price: $${price?.toLocaleString()}
- 24h Change: ${change24h}%
- 24h Volume: $${volume24h}B

TECHNICAL INDICATORS:
- RSI (14): ${rsi} — ${+rsi > 70 ? 'Overbought' : +rsi < 30 ? 'Oversold' : 'Neutral zone'}
- MACD Histogram: ${macdHistogram?.toFixed(5)} (${macdBullish ? 'Bullish — above signal line' : 'Bearish — below signal line'})
- Recent Closes (last 5): ${closes.slice(-5).map(p => '$' + p.toLocaleString()).join(', ')}

MARKET SENTIMENT:
- Fear & Greed Index: ${fgValue}/100 (${fgLabel})

Provide a complete trading signal analysis for the next 24–48 hours.`;

  const raw  = await claudeFetch([{ role: 'user', content: prompt }], SIGNAL_SYSTEM, 800);
  return JSON.parse(raw.trim());
}

/**
 * Conversational crypto market chat with live context injection.
 * @param {Array}  history - Array of { role, content } messages
 * @param {object} context - { symbol, price, rsi, fgValue, fgLabel }
 * @returns {string} AI response text
 */
export async function chatWithOracle(history, context) {
  const { symbol, price, rsi, fgValue, fgLabel } = context;
  const ctx = `[Live Market Context: ${symbol} = $${price?.toLocaleString() ?? '—'} | RSI: ${rsi?.toFixed(1) ?? '—'} | Fear & Greed: ${fgValue ?? '—'} (${fgLabel ?? '—'})]`;

  const messages = history.map((m, i) =>
    i === 0 && m.role === 'user'
      ? { ...m, content: ctx + '\n\n' + m.content }
      : m
  );

  return claudeFetch(messages, CHAT_SYSTEM, 1000);
}

/**
 * Analyze a portfolio and return actionable advice.
 * @param {Array}  holdings  - Array of enriched holding objects
 * @param {number} totalValue
 * @param {number} pnl24h
 * @returns {string} AI advice text
 */
export async function analyzePortfolio(holdings, totalValue, pnl24h) {
  const summary = holdings
    .map(h => `${h.symbol}: ${h.qty} units @ $${h.priceNow?.toLocaleString() ?? '—'} = $${h.value?.toFixed(2) ?? '—'} | Alloc: ${h.value ? ((h.value / totalValue) * 100).toFixed(1) : '—'}% | 24h: ${h.change24 ? (h.change24 >= 0 ? '+' : '') + h.change24.toFixed(2) + '%' : '—'}`)
    .join('\n');

  const prompt = `Crypto portfolio for analysis:\n\n${summary}\n\nTotal Value: $${totalValue.toFixed(2)}\n24h P&L: $${pnl24h >= 0 ? '+' : ''}${pnl24h.toFixed(2)}`;
  return claudeFetch([{ role: 'user', content: prompt }], PORTFOLIO_SYSTEM, 600);
}

/**
 * Score a list of news headlines for sentiment.
 * @param {Array} headlines - Array of strings
 * @returns {Array} Array of { headline, sentiment, impact, reason }
 */
export async function scoreNewsSentiment(headlines) {
  if (!headlines.length) return [];
  const prompt = `Score these crypto news headlines:\n\n${headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}`;
  const raw = await claudeFetch([{ role: 'user', content: prompt }], NEWS_SYSTEM, 800);
  return JSON.parse(raw.trim());
}
