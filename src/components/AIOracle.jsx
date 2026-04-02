// ─────────────────────────────────────────────────────────────────────────────
//  AIOracle — Full-page Conversational AI Analyst
//  Provides a chat interface powered by Google Gemini with live market context.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import { Brain, Send, Trash2, AlertTriangle, ChevronRight, Sparkles } from 'lucide-react';
import { chatWithOracle } from '../services/geminiService';

const mono = "'Space Mono', monospace";
const syne = "'Syne', sans-serif";
const GREEN  = '#00ff88';
const DIM    = '#2a5a3a';
const BORDER = '#1a2e1a';

// ── Quick Prompt Templates ────────────────────────────────────────────────────
function quickPrompts(symbol, rsi) {
  const coin = symbol.replace('USDT', '');
  return [
    { label: `Is ${coin} a buy right now?`,        text: `Given the current market conditions, is ${coin} a good buy right now? What are the key signals to watch?` },
    { label: `RSI ${rsi?.toFixed(0) ?? '—'} analysis`, text: `The RSI for ${coin} is currently at ${rsi?.toFixed(1) ?? 'N/A'}. What does this mean for my trading strategy?` },
    { label: 'Explain Fear & Greed index',          text: 'Explain the Fear & Greed index and how I should use it in my crypto trading strategy. What does the current reading imply?' },
    { label: 'Key support & resistance levels',     text: `Based on recent price action, what are the key support and resistance levels I should watch for ${coin}?` },
    { label: 'Best indicators for crypto',          text: 'What are the most reliable technical indicators for crypto trading and how should I combine them?' },
    { label: 'Risk management tips',                text: 'Give me 3–5 practical risk management rules I should follow for crypto trading, especially in volatile conditions.' },
  ];
}

// ── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: isUser ? 'flex-end' : 'flex-start', animation: 'fadeIn 0.3s ease' }}>
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginTop: 2,
          background: '#00ff8815', border: `1px solid ${GREEN}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Brain size={13} color={GREEN} />
        </div>
      )}
      <div style={{
        maxWidth: '78%', padding: '11px 14px', borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
        background:  isUser ? '#0f2010' : '#0a0f0a',
        border: `1px solid ${isUser ? GREEN + '44' : BORDER}`,
        fontSize: 11, lineHeight: 1.85, fontFamily: mono,
        color: isUser ? GREEN : '#c0ddc8',
        whiteSpace: 'pre-wrap',
      }}>
        {msg.content}
      </div>
      {isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginTop: 2,
          background: `${GREEN}15`, border: `1px solid ${GREEN}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: mono, fontSize: 10, color: GREEN,
        }}>YOU</div>
      )}
    </div>
  );
}

// ── Main AIOracle Component ───────────────────────────────────────────────────
export default function AIOracle({ symbol, price, indicators, fearGreed }) {
  const [history, setHistory] = useState([]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const chatEndRef = useRef(null);
  const inputRef   = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setError('');

    const newHistory = [...history, { role: 'user', content: msg }];
    setHistory(newHistory);
    setLoading(true);

    try {
      const reply = await chatWithOracle(newHistory, {
        symbol,
        price,
        rsi:     indicators?.rsi,
        fgValue: fearGreed?.value,
        fgLabel: fearGreed?.value_classification,
      });
      setHistory(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      setError('Failed to connect: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => { setHistory([]); setError(''); };
  const prompts = quickPrompts(symbol, indicators?.rsi);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>

      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#040a06', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#00ff8812', border: `1px solid ${GREEN}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Brain size={14} color={GREEN} />
        </div>
        <div>
          <div style={{ fontFamily: syne, fontSize: 13, fontWeight: 700, color: GREEN, letterSpacing: '0.1em' }}>CRYPTO ORACLE</div>
          <div style={{ fontFamily: mono, fontSize: 9, color: DIM }}>
            {symbol} · ${price?.toLocaleString() ?? '—'} · RSI {indicators?.rsi?.toFixed(1) ?? '—'} · F&G {fearGreed?.value ?? '—'} ({fearGreed?.value_classification ?? '—'})
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          {history.length > 0 && (
            <button onClick={clearChat} style={{ background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 4, padding: '4px 8px', color: DIM, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: mono, fontSize: 9 }}>
              <Trash2 size={11} /> CLEAR
            </button>
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>

        {/* Empty state */}
        {history.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 10, background: '#060c06', border: `1px solid ${GREEN}22`, borderRadius: 8, padding: 14 }}>
              <Sparkles size={16} color={GREEN} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontFamily: syne, fontSize: 12, color: GREEN, letterSpacing: '0.08em', marginBottom: 4 }}>WELCOME TO CRYPTO ORACLE</p>
                <p style={{ fontFamily: mono, fontSize: 10, color: '#6a9a7a', lineHeight: 1.8 }}>
                  I'm your AI-powered crypto analyst powered by Google Gemini. Ask me anything about market conditions,
                  technical analysis, trading strategies, or specific coins. I'll automatically
                  use your live market context ({symbol} @ ${price?.toLocaleString() ?? '—'}).
                </p>
              </div>
            </div>

            <div>
              <p style={{ fontFamily: mono, fontSize: 9, color: DIM, letterSpacing: '0.1em', marginBottom: 8 }}>QUICK PROMPTS</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {prompts.map((p, i) => (
                  <button key={i} onClick={() => send(p.text)} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: '#060c06', border: `1px solid ${BORDER}`,
                    borderRadius: 6, padding: '9px 12px', textAlign: 'left', cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#0a1208';
                    e.currentTarget.style.borderColor = GREEN + '33';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#060c06';
                    e.currentTarget.style.borderColor = BORDER;
                  }}
                  >
                    <ChevronRight size={11} color={DIM} />
                    <span style={{ fontFamily: mono, fontSize: 10, color: '#6a9a7a' }}>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {history.map((msg, i) => <MessageBubble key={i} msg={msg} />)}

        {/* Loading bubble */}
        {loading && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#00ff8815', border: `1px solid ${GREEN}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={13} color={GREEN} />
            </div>
            <div style={{ fontFamily: mono, fontSize: 10, color: GREEN, animation: 'pulse 1.5s ease-in-out infinite' }}>
              Analyzing market data...
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ display: 'flex', gap: 8, background: '#1a0a0a', border: '1px solid #ff4d6d33', borderRadius: 6, padding: '10px 12px' }}>
            <AlertTriangle size={13} color="#ff4d6d" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontFamily: mono, fontSize: 10, color: '#cc7788', lineHeight: 1.7 }}>{error}</p>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input bar */}
      <div style={{ padding: '10px 14px', background: '#040a06', borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={`Ask about ${symbol.replace('USDT', '')} or any crypto question...`}
            style={{
              flex: 1, fontFamily: mono, fontSize: 11, background: '#060c06',
              border: `1px solid ${BORDER}`, borderRadius: 6, padding: '10px 14px',
              color: '#c0ddc8', outline: 'none',
            }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: input.trim() && !loading ? '#00ff8818' : 'transparent',
              border: `1px solid ${input.trim() && !loading ? GREEN + '55' : BORDER}`,
              borderRadius: 6, padding: '10px 16px', color: GREEN,
              fontFamily: mono, fontSize: 10, letterSpacing: '0.1em',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              opacity: input.trim() && !loading ? 1 : 0.4,
            }}
          >
            <Send size={13} /> SEND
          </button>
        </div>
        <p style={{ fontFamily: mono, fontSize: 8, color: '#1a3a2a', marginTop: 5 }}>
          Enter ↵ to send · Live context auto-injected · Powered by Google Gemini
        </p>
      </div>
    </div>
  );
}
