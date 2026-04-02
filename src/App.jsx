import React, { useState } from 'react';
import Header from './components/Header';
import CandlestickChart from './components/CandlestickChart';
import IndicatorsPanel from './components/IndicatorsPanel';
import MarketOverview from './components/MarketOverview';
import OrderBook from './components/OrderBook';
import PortfolioTracker from './components/PortfolioTracker';
import MarketHeatmap from './components/MarketHeatmap';
import NewsAndTrending from './components/NewsAndTrending';
import AIOracle from './components/AIOracle';
import AISignalPanel from './components/AISignalPanel';
import { FearGreedPanel, RecentTrades, PriceAlerts } from './components/SidePanels';
import { useBinanceStream, useFearGreed, useChartData } from './hooks/useMarketData';
import { getBinanceTicker24h } from './services/api';
import { BarChart2, Layers, PieChart, Map, Newspaper, Brain } from 'lucide-react';

const COIN_TO_SYMBOL = {
  bitcoin:'BTCUSDT',ethereum:'ETHUSDT',binancecoin:'BNBUSDT',
  solana:'SOLUSDT',ripple:'XRPUSDT',dogecoin:'DOGEUSDT',
  cardano:'ADAUSDT','avalanche-2':'AVAXUSDT',polkadot:'DOTUSDT',
  chainlink:'LINKUSDT','matic-network':'MATICUSDT',uniswap:'UNIUSDT',
  litecoin:'LTCUSDT',cosmos:'ATOMUSDT',near:'NEARUSDT',
};

const POPULAR = ['BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT','ADAUSDT','DOGEUSDT','LINKUSDT'];
const TABS = [
  { id:'chart',     label:'CHART',      icon: BarChart2 },
  { id:'oracle',    label:'AI ORACLE',  icon: Brain     },
  { id:'portfolio', label:'PORTFOLIO',  icon: PieChart  },
  { id:'markets',   label:'MARKETS',    icon: Layers    },
  { id:'heatmap',   label:'HEATMAP',    icon: Map       },
  { id:'news',      label:'NEWS',       icon: Newspaper },
];

const mono = "'Space Mono', monospace";

export default function App() {
  const [symbol,    setSymbol] = useState('BTCUSDT');
  const [activeTab, setTab]    = useState('chart');
  const [ticker,    setTicker] = useState(null);

  const { price, isConnected }  = useBinanceStream(symbol);
  const { data: fearGreedData } = useFearGreed();
  const fearGreed               = fearGreedData?.[0];
  const { candles, indicators } = useChartData(symbol, '1h');

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try { const t = await getBinanceTicker24h(symbol); if (!cancelled) setTicker(t); } catch {}
    }
    load();
    const id = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [symbol]);

  const handleCoinSelect = (coin) => {
    const sym = COIN_TO_SYMBOL[coin.id];
    if (sym) { setSymbol(sym); setTab('chart'); }
  };

  const fmtLivePrice = (p) =>
    p ? '$' + p.toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 }) : '—';

  const showSymBar = activeTab === 'chart' || activeTab === 'markets' || activeTab === 'oracle';

  const aiIndicators = {
    rsi:    indicators.rsi14 ? indicators.rsi14[indicators.rsi14.length - 1] : null,
    macd:   indicators.macd,
    closes: candles.map(c => c.close),
  };

  return (
    <div style={{ background:'#030712', minHeight:'100vh', color:'#e0f0e8', display:'flex', flexDirection:'column', fontFamily:mono }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#0d1117}
        ::-webkit-scrollbar-thumb{background:#1e3a2f;border-radius:2px}
        button{cursor:pointer}
        button:hover{opacity:.85}
        tr:hover td{background:#0f2010!important}
      `}</style>

      <Header isConnected={isConnected} activeSymbol={symbol} onSymbolChange={setSymbol} />

      {/* Tab bar */}
      <div style={{ display:'flex', background:'#060c06', borderBottom:'1px solid #1a2e1a', padding:'0 12px', overflowX:'auto', flexShrink:0 }}>
        {TABS.map(({ id, label, icon:Icon }) => {
          const active = activeTab === id;
          const isAI   = id === 'oracle';
          return (
            <button key={id} onClick={() => setTab(id)} style={{
              display:'flex', alignItems:'center', gap:6,
              fontFamily:mono, fontSize:11, letterSpacing:'0.1em',
              padding:'10px 18px', cursor:'pointer',
              background: active ? '#00ff8808' : 'transparent',
              border:'none',
              borderBottom:`2px solid ${active ? '#00ff88' : 'transparent'}`,
              color: active ? '#00ff88' : '#4a7a5a',
              transition:'all .15s', whiteSpace:'nowrap', flexShrink:0,
            }}>
              <Icon size={12} />
              {label}
              {isAI && (
                <span style={{ background:'#00ff8820', border:'1px solid #00ff8844', borderRadius:3, padding:'1px 5px', fontSize:8, color:'#00ff88', marginLeft:2 }}>AI</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Symbol bar */}
      {showSymBar && (
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 12px', background:'#060c06', borderBottom:'1px solid #0f1e0f', overflowX:'auto', flexShrink:0 }}>
          <span style={{ fontFamily:mono, fontSize:9, color:'#2a5a3a', letterSpacing:'0.12em', flexShrink:0 }}>PAIR</span>
          {POPULAR.map((sym) => (
            <button key={sym} onClick={() => setSymbol(sym)} style={{
              fontFamily:mono, fontSize:10, padding:'3px 10px', borderRadius:4, border:'1px solid', transition:'all .15s', flexShrink:0,
              background: symbol===sym ? '#00ff8818':'transparent',
              borderColor: symbol===sym ? '#00ff8866':'#1a2e1a',
              color: symbol===sym ? '#00ff88':'#4a7a5a',
            }}>{sym.replace('USDT','')}</button>
          ))}
          <div style={{ display:'flex', alignItems:'center', gap:5, marginLeft:'auto', flexShrink:0 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:isConnected?'#00ff88':'#ff4d6d', animation:'pulse 2s infinite' }} />
            <span style={{ fontFamily:mono, fontSize:13, fontWeight:700, color:'#00ff88' }}>{fmtLivePrice(price)}</span>
            <span style={{ fontFamily:mono, fontSize:9, color:'#2a5a3a' }}>{isConnected?'LIVE':'OFFLINE'}</span>
          </div>
        </div>
      )}

      {/* CHART TAB */}
      {activeTab==='chart' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 310px', gap:10, padding:10, flex:1, overflow:'hidden', minHeight:0 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:10, minWidth:0, overflow:'hidden' }}>
            <CandlestickChart symbol={symbol} height={400} />
            <IndicatorsPanel symbol={symbol} interval="1h" height={180} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10, overflowY:'auto' }}>
            <AISignalPanel
              symbol={symbol}
              price={price}
              indicators={aiIndicators}
              fearGreed={fearGreed}
              ticker={ticker}
            />
            <FearGreedPanel />
            <OrderBook symbol={symbol} />
            <RecentTrades symbol={symbol} />
            <PriceAlerts currentPrice={price} symbol={symbol} />
          </div>
        </div>
      )}

      {/* AI ORACLE TAB */}
      {activeTab==='oracle' && (
        <AIOracle
          symbol={symbol}
          price={price}
          indicators={aiIndicators}
          fearGreed={fearGreed}
        />
      )}

      {/* PORTFOLIO TAB */}
      {activeTab==='portfolio' && (
        <div style={{ display:'flex', flexDirection:'column', flex:1, padding:10, minHeight:600, overflowY:'auto' }}>
          <PortfolioTracker />
        </div>
      )}

      {/* MARKETS TAB */}
      {activeTab==='markets' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:10, padding:10, flex:1, overflow:'hidden', minHeight:0 }}>
          <div style={{ overflowY:'auto' }}><MarketOverview onSelectCoin={handleCoinSelect} /></div>
          <div style={{ overflowY:'auto' }}><NewsAndTrending onSelectCoin={handleCoinSelect} /></div>
        </div>
      )}

      {/* HEATMAP TAB */}
      {activeTab==='heatmap' && (
        <div style={{ display:'flex', flexDirection:'column', flex:1, padding:10, minHeight:0, overflow:'hidden' }}>
          <MarketHeatmap onSelectCoin={handleCoinSelect} />
        </div>
      )}

      {/* NEWS TAB */}
      {activeTab==='news' && (
        <div style={{ display:'flex', flexDirection:'column', flex:1, padding:10, minHeight:0, overflow:'hidden' }}>
          <NewsAndTrending onSelectCoin={handleCoinSelect} />
        </div>
      )}
    </div>
  );
}
