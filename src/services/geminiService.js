// ─────────────────────────────────────────────────────────────────────────────
//  Gemini API Service
//  Handles all AI-powered features via the Google Gemini API.
// ─────────────────────────────────────────────────────────────────────────────

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL = 'gemini-2.0-flash-exp';

// ── Key Resolution ────────────────────────────────────────────────────────────

export function getApiKey() {
  const envKey = process.env.REACT_APP_GEMINI_API_KEY;
  const localKey = localStorage.getItem('gemini_api_key');
  const key = envKey || localKey || '';
  
  console.log('🔑 API Key check:', {
    hasEnvKey: !!envKey,
    hasLocalKey: !!localKey,
    keyPrefix: key ? key.substring(0, 8) + '...' : 'NONE'
  });
  
  return key;
}

export function saveApiKey(key) {
  localStorage.setItem('gemini_api_key', key.trim());
}

export function clearApiKey() {
  localStorage.removeItem('gemini_api_key');
}

// ── Core Fetch ────────────────────────────────────────────────────────────────

async function geminiFetch(messages, systemPrompt, maxTokens = 1000, temperature = 0.7) {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error('NO_API_KEY: Please add REACT_APP_GEMINI_API_KEY to your .env file');
  }

  // Convert messages to Gemini format
  const contents = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  const requestBody = {
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      topP: 0.95,
      topK: 40,
    },
  };

  // Add system instruction if provided
  if (systemPrompt) {
    requestBody.systemInstruction = {
      parts: [{ text: systemPrompt }]
    };
  }

  const url = `${GEMINI_API_BASE}/${MODEL}:generateContent?key=${apiKey}`;

  console.log('📡 Calling Gemini API...', { model: MODEL, messageCount: messages.length });

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ Gemini API Error:', { status: res.status, body: errorText });
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { message: errorText } };
      }
      
      const errorMsg = errorData?.error?.message || `HTTP ${res.status}`;
      
      // Better error messages
      if (res.status === 400) {
        if (errorMsg.includes('API key')) {
          throw new Error('Invalid API key. Please check your REACT_APP_GEMINI_API_KEY in .env');
        }
        throw new Error('Bad request: ' + errorMsg);
      } else if (res.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment.');
      } else if (res.status === 403) {
        throw new Error('API key invalid or lacks permissions. Get a new key at aistudio.google.com');
      } else if (res.status === 404) {
        throw new Error('Model not found. Using: ' + MODEL);
      }
      
      throw new Error(errorMsg);
    }

    const data = await res.json();
    console.log('✅ Gemini API response received');
    
    // Extract text from Gemini response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    
    if (!text) {
      console.error('⚠️ Empty response from Gemini:', data);
      throw new Error('Received empty response from Gemini API');
    }
    
    return text;
  } catch (error) {
    if (error.message.includes('fetch')) {
      throw new Error('Network error: Unable to reach Gemini API. Check your internet connection.');
    }
    throw error;
  }
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

// ── Helper: Clean JSON response ───────────────────────────────────────────────

function cleanJsonResponse(raw) {
  let cleaned = raw.trim();
  // Remove markdown code fences if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/```\n?/g, '');
  }
  return cleaned.trim();
}

// ── Exported AI Functions ─────────────────────────────────────────────────────

/**
 * Generate a structured BUY/SELL/HOLD signal from live market indicators.
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

  const raw = await geminiFetch([{ role: 'user', content: prompt }], SIGNAL_SYSTEM, 800, 0.3);
  const cleaned = cleanJsonResponse(raw);
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse signal JSON:', cleaned);
    throw new Error('Invalid response format from AI');
  }
}

/**
 * Conversational crypto market chat with live context injection.
 */
export async function chatWithOracle(history, context) {
  const { symbol, price, rsi, fgValue, fgLabel } = context;
  const ctx = `[Live Market Context: ${symbol} = $${price?.toLocaleString() ?? '—'} | RSI: ${rsi?.toFixed(1) ?? '—'} | Fear & Greed: ${fgValue ?? '—'} (${fgLabel ?? '—'})]`;

  const messages = history.map((m, i) =>
    i === 0 && m.role === 'user'
      ? { ...m, content: ctx + '\n\n' + m.content }
      : m
  );

  return geminiFetch(messages, CHAT_SYSTEM, 1000, 0.7);
}

/**
 * Analyze a portfolio and return actionable advice.
 */
export async function analyzePortfolio(holdings, totalValue, pnl24h) {
  const summary = holdings
    .map(h => `${h.symbol}: ${h.qty} units @ $${h.priceNow?.toLocaleString() ?? '—'} = $${h.value?.toFixed(2) ?? '—'} | Alloc: ${h.value ? ((h.value / totalValue) * 100).toFixed(1) : '—'}% | 24h: ${h.change24 ? (h.change24 >= 0 ? '+' : '') + h.change24.toFixed(2) + '%' : '—'}`)
    .join('\n');

  const prompt = `Crypto portfolio for analysis:\n\n${summary}\n\nTotal Value: $${totalValue.toFixed(2)}\n24h P&L: $${pnl24h >= 0 ? '+' : ''}${pnl24h.toFixed(2)}`;
  return geminiFetch([{ role: 'user', content: prompt }], PORTFOLIO_SYSTEM, 600, 0.5);
}

/**
 * Score a list of news headlines for sentiment.
 */
export async function scoreNewsSentiment(headlines) {
  if (!headlines.length) return [];
  const prompt = `Score these crypto news headlines:\n\n${headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}`;
  const raw = await geminiFetch([{ role: 'user', content: prompt }], NEWS_SYSTEM, 800, 0.3);
  const cleaned = cleanJsonResponse(raw);
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse news sentiment JSON:', cleaned);
    return headlines.map(h => ({ 
      headline: h, 
      sentiment: 'neutral', 
      impact: 'low', 
      reason: 'Unable to analyze' 
    }));
  }
}

/**
 * Test API connection
 */
export async function testConnection() {
  try {
    const response = await geminiFetch(
      [{ role: 'user', content: 'Reply with: "Connected"' }],
      'You are a helpful assistant.',
      50,
      0.1
    );
    return response.includes('Connected');
  } catch (error) {
    throw error;
  }
}
