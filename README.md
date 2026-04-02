# Software Requirements Specification (SRS)
## Crypto AI Dashboard v1.0

**Document Version:** 1.0  
**Date:** April 2, 2026  
**Prepared by:** DevikaRajput  
**Project Repository:** https://github.com/DevikaRajput/crypto-ai-dashboard  
**Live Demo:** https://crypto-ai-dashboard-theta.vercel.app

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [System Features](#3-system-features)
4. [External Interface Requirements](#4-external-interface-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [Technical Specifications](#6-technical-specifications)

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for the Crypto AI Dashboard, a real-time cryptocurrency trading analysis platform enhanced with artificial intelligence capabilities.

### 1.2 Scope
The Crypto AI Dashboard is a web-based application that provides:
- Real-time cryptocurrency market data visualization
- AI-powered trading signal generation
- Portfolio tracking and management
- Interactive charting tools
- Market sentiment analysis
- News aggregation

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|------|------------|
| **API** | Application Programming Interface |
| **AI** | Artificial Intelligence |
| **RSI** | Relative Strength Index |
| **MACD** | Moving Average Convergence Divergence |
| **BTC** | Bitcoin |
| **ETH** | Ethereum |
| **SPA** | Single Page Application |
| **REST** | Representational State Transfer |
| **WebSocket** | Full-duplex communication protocol |

### 1.4 References
- CoinGecko API Documentation: https://www.coingecko.com/api/documentation
- Anthropic Claude API: https://docs.anthropic.com/
- Google Gemini API: https://ai.google.dev/docs

---

## 2. Overall Description

### 2.1 Product Perspective
The Crypto AI Dashboard is a standalone web application that integrates with:
- **CoinGecko API** for market data
- **Anthropic Claude** for AI analysis
- **Google Gemini** for AI predictions
- **Chart.js** for data visualization

### 2.2 Product Functions

#### Primary Functions:
1. **Market Monitoring**
   - Display real-time cryptocurrency prices
   - Show 24-hour price changes
   - Display market capitalization data

2. **AI-Powered Analysis**
   - Generate trading signals (Buy/Sell/Hold)
   - Provide market sentiment analysis
   - Answer user queries via AI chatbot

3. **Technical Analysis**
   - Display candlestick charts
   - Show technical indicators (RSI, MACD, Moving Averages)
   - Visualize trading volume

4. **Portfolio Management**
   - Track user holdings
   - Calculate profit/loss
   - Show portfolio allocation

5. **Information Aggregation**
   - Display crypto news
   - Show trending cryptocurrencies
   - Present market heatmap

### 2.3 User Classes and Characteristics

| User Type | Characteristics | Technical Expertise |
|-----------|----------------|---------------------|
| **Day Trader** | Active trading, needs real-time data | High |
| **Long-term Investor** | Portfolio tracking, trend analysis | Medium |
| **Crypto Beginner** | Learning, exploring markets | Low |
| **Analyst** | Research, data analysis | High |

### 2.4 Operating Environment
- **Platform:** Web Browser (Chrome, Firefox, Safari, Edge)
- **Minimum Resolution:** 1280x720
- **Internet Connection:** Required (broadband recommended)
- **Supported Devices:** Desktop, Tablet, Mobile

### 2.5 Design and Implementation Constraints
- Must use React 18+
- API rate limits (CoinGecko: 50 calls/minute on free tier)
- AI API costs (Claude and Gemini are paid services)
- Browser localStorage for client-side data persistence

### 2.6 Assumptions and Dependencies

#### Assumptions:
- Users have stable internet connection
- Users have modern web browsers
- API services remain available

#### Dependencies:
- CoinGecko API availability
- Anthropic Claude API access
- Google Gemini API access
- Vercel hosting platform

---

## 3. System Features

### 3.1 Market Overview Dashboard

**Priority:** High  
**Description:** Display real-time data for top cryptocurrencies

#### Functional Requirements:

**FR-3.1.1:** The system shall display current price for each cryptocurrency  
**FR-3.1.2:** The system shall show 24-hour percentage change  
**FR-3.1.3:** The system shall display market capitalization  
**FR-3.1.4:** The system shall update data every 30 seconds  
**FR-3.1.5:** The system shall use color coding (green for gains, red for losses)

#### Input:
- API request to CoinGecko

#### Processing:
- Fetch market data
- Parse JSON response
- Calculate percentage changes
- Format currency values

#### Output:
- Grid of cryptocurrency cards
- Price, change, and market cap for each coin

---

### 3.2 Interactive Trading Charts

**Priority:** High  
**Description:** Provide candlestick and line charts for price analysis

#### Functional Requirements:

**FR-3.2.1:** The system shall display candlestick charts  
**FR-3.2.2:** The system shall support multiple timeframes (1H, 4H, 1D, 1W)  
**FR-3.2.3:** The system shall allow chart zooming and panning  
**FR-3.2.4:** The system shall display volume bars  
**FR-3.2.5:** The system shall show moving averages overlay

#### Input:
- Selected cryptocurrency
- Selected timeframe
- Historical price data

#### Processing:
- Fetch OHLCV data (Open, High, Low, Close, Volume)
- Calculate moving averages
- Generate chart data structure

#### Output:
- Interactive candlestick chart
- Volume histogram
- Technical indicator overlays

---

### 3.3 AI Oracle (Chatbot)

**Priority:** High  
**Description:** AI-powered assistant for market analysis and user queries

#### Functional Requirements:

**FR-3.3.1:** The system shall accept natural language queries  
**FR-3.3.2:** The system shall provide contextual market analysis  
**FR-3.3.3:** The system shall maintain conversation history  
**FR-3.3.4:** The system shall cite data sources  
**FR-3.3.5:** The system shall handle multiple AI providers (Claude, Gemini)

#### Input:
- User text query
- Current market data context

#### Processing:
- Send query to AI API
- Include market data in context
- Parse AI response

#### Output:
- Formatted AI response
- Relevant market insights
- Actionable recommendations

---

### 3.4 AI Signal Generation

**Priority:** Medium  
**Description:** Generate automated trading signals based on AI analysis

#### Functional Requirements:

**FR-3.4.1:** The system shall generate Buy/Sell/Hold signals  
**FR-3.4.2:** The system shall provide confidence percentage (0-100%)  
**FR-3.4.3:** The system shall explain reasoning for each signal  
**FR-3.4.4:** The system shall suggest entry and exit points  
**FR-3.4.5:** The system shall calculate stop-loss levels

#### Input:
- Current market data
- Technical indicators
- Historical price patterns

#### Processing:
- AI analysis of market conditions
- Pattern recognition
- Risk assessment calculation

#### Output:
- Signal type (Buy/Sell/Hold)
- Confidence level
- Entry price
- Target price
- Stop-loss price
- Reasoning text

---

### 3.5 Portfolio Tracker

**Priority:** Medium  
**Description:** Track user cryptocurrency holdings and performance

#### Functional Requirements:

**FR-3.5.1:** The system shall allow users to add holdings  
**FR-3.5.2:** The system shall calculate total portfolio value  
**FR-3.5.3:** The system shall show profit/loss for each asset  
**FR-3.5.4:** The system shall display portfolio allocation pie chart  
**FR-3.5.5:** The system shall persist data in browser localStorage

#### Input:
- Cryptocurrency symbol
- Quantity held
- Purchase price (optional)

#### Processing:
- Fetch current prices
- Calculate current value
- Calculate profit/loss
- Generate allocation percentages

#### Output:
- Portfolio summary table
- Total value
- 24h change
- Allocation pie chart

---

### 3.6 Market Heatmap

**Priority:** Low  
**Description:** Visual representation of market performance

#### Functional Requirements:

**FR-3.6.1:** The system shall display color-coded boxes for each coin  
**FR-3.6.2:** Box size shall represent market capitalization  
**FR-3.6.3:** Color intensity shall represent percentage change  
**FR-3.6.4:** The system shall support hover tooltips  
**FR-3.6.5:** The system shall update every 60 seconds

#### Input:
- Market data for top 50 cryptocurrencies

#### Processing:
- Calculate relative sizes
- Determine color gradients
- Generate treemap layout

#### Output:
- Interactive heatmap visualization
- Tooltips with detailed data

---

### 3.7 Order Book Display

**Priority:** Low  
**Description:** Show real-time buy and sell orders

#### Functional Requirements:

**FR-3.7.1:** The system shall display top 10 buy orders  
**FR-3.7.2:** The system shall display top 10 sell orders  
**FR-3.7.3:** The system shall show price, quantity, and total  
**FR-3.7.4:** The system shall highlight current market price  
**FR-3.7.5:** The system shall update in real-time

#### Input:
- Order book data from exchange API

#### Processing:
- Sort orders by price
- Calculate cumulative volumes
- Format display data

#### Output:
- Two-column order book
- Buy orders (bids) in green
- Sell orders (asks) in red

---

### 3.8 News and Trending

**Priority:** Medium  
**Description:** Aggregate cryptocurrency news and trending topics

#### Functional Requirements:

**FR-3.8.1:** The system shall display latest news headlines  
**FR-3.8.2:** The system shall show trending cryptocurrencies  
**FR-3.8.3:** The system shall provide news source links  
**FR-3.8.4:** The system shall update news every 5 minutes  
**FR-3.8.5:** The system shall show social sentiment indicators

#### Input:
- News API data
- Trending data from CoinGecko

#### Processing:
- Fetch and parse news
- Rank by recency and relevance
- Extract trending coins

#### Output:
- News article list
- Trending coins list
- Sentiment indicators

---

### 3.9 Technical Indicators Panel

**Priority:** Medium  
**Description:** Display key technical analysis indicators

#### Functional Requirements:

**FR-3.9.1:** The system shall calculate RSI (Relative Strength Index)  
**FR-3.9.2:** The system shall calculate MACD  
**FR-3.9.3:** The system shall show moving averages (50, 200)  
**FR-3.9.4:** The system shall indicate overbought/oversold conditions  
**FR-3.9.5:** The system shall provide trend signals

#### Input:
- Historical price data

#### Processing:
- Calculate RSI formula
- Calculate MACD (12, 26, 9)
- Calculate moving averages
- Determine signal conditions

#### Output:
- Indicator values
- Visual signal indicators
- Interpretation text

---

## 4. External Interface Requirements

### 4.1 User Interfaces

#### 4.1.1 Dashboard Layout
