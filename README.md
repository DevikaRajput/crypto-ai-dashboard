# Crypto AI Dashboard

A real-time cryptocurrency dashboard enhanced with AI-powered features using Claude.

## AI Features Added

### ⬡ AI Signal Panel (Chart Tab sidebar)
Click **ANALYZE** on any trading pair to get:
- BUY / SELL / HOLD signal with confidence percentage
- Entry zone, price target, and stop-loss levels
- Key factor breakdown (RSI, MACD, Fear & Greed)
- Risk level assessment

Powered by live Binance data + Claude analysis.

### ⬡ AI Oracle Tab (new tab)
A full conversational AI analyst:
- Ask any question about the crypto market
- Live context auto-injected (current price, RSI, Fear & Greed)
- Quick prompt buttons for common questions
- Full conversation history

### ⬡ AI Portfolio Advisor (Portfolio Tab)
- Analyzes your current holdings and allocation
- Returns risk assessment and actionable suggestions
- Considers 24h P&L and concentration risk

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set your Anthropic API key
```bash
cp .env.example .env
# Edit .env and add your key:
# REACT_APP_ANTHROPIC_API_KEY=sk-ant-api03-...
```
Get your API key at [console.anthropic.com](https://console.anthropic.com/)

**Alternative:** You can enter the key directly in the app (AI Oracle tab → key icon) — it will be saved to localStorage.

### 3. Start the app
```bash
npm start
```

The app opens at `http://localhost:3000`

---

## Original Features

- **Live prices** via Binance WebSocket
- **Candlestick charts** with TradingView Lightweight Charts
- **Technical indicators**: RSI, MACD, EMA, Bollinger Bands
- **Order book** with real-time updates
- **Market overview** (CoinGecko top coins)
- **Market heatmap** 
- **Portfolio tracker** with P&L
- **Fear & Greed index**
- **Crypto news**
- **Price alerts**

---

## Data Sources

| Source | Data |
|--------|------|
| Binance WebSocket | Live prices, order book, recent trades |
| Binance REST API | OHLCV klines, 24h tickers |
| CoinGecko | Market overview, coin details |
| Alternative.me | Fear & Greed Index |
| Anthropic Claude | AI signals, chat, portfolio advice |

---

## Project Structure

```
src/
├── App.jsx                      # Main app (enhanced with AI tab)
├── components/
│   ├── AIOracle.jsx             # ★ NEW: AI chat analyst
│   ├── AISignalPanel.jsx        # ★ NEW: Trading signal widget
│   ├── CandlestickChart.jsx     # TradingView chart
│   ├── IndicatorsPanel.jsx      # RSI, MACD, BB panels
│   ├── MarketOverview.jsx       # Top coins table
│   ├── OrderBook.jsx            # Live order book
│   ├── PortfolioTracker.jsx     # Holdings + AI advisor
│   ├── MarketHeatmap.jsx        # Coin heatmap
│   ├── NewsAndTrending.jsx      # Crypto news
│   ├── Header.jsx               # App header
│   └── SidePanels.jsx           # Fear&Greed, Trades, Alerts
├── hooks/
│   └── useMarketData.js         # All data hooks
└── services/
    ├── api.js                   # Market data APIs
    └── claude.js                # ★ NEW: Claude AI service
```
