import { useEffect, useRef, useState } from 'react';
import ChatBubble from './ChatBubble';

export default function ChatWindow({ messages, onSend, onStop, isLoading }) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: isMobile ? 'auto' : 'smooth' });
  }, [messages, isLoading, isMobile]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col flex-1 h-full bg-chat overflow-hidden">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-3 md:px-8 py-4 md:py-6">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center select-none relative overflow-hidden">

            {/* Floating bubbles */}
            {!isMobile && [...Array(14)].map((_, i) => (
              <div key={i} style={{
                position:'absolute',
                width: 16 + (i * 13) % 50,
                height: 16 + (i * 13) % 50,
                borderRadius:'50%',
                background:'rgba(99,102,241,0.07)',
                border:'1px solid rgba(99,102,241,0.15)',
                left:`${(i * 7 + 5) % 90}%`,
                animation:`homeBubble ${8 + (i % 5) * 2}s ${i * 0.6}s linear infinite`,
                pointerEvents:'none',
              }}/>
            ))}

            {/* Glow rings behind logo */}
            <div style={{ position:'relative', marginBottom:24 }}>
              <div style={{
                position:'absolute', top:'50%', left:'50%',
                transform:'translate(-50%,-50%)',
                width:160, height:160, borderRadius:'50%',
                background:'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
                animation:'ringPulse 3s ease-in-out infinite',
              }}/>
              <div style={{
                position:'absolute', top:'50%', left:'50%',
                transform:'translate(-50%,-50%)',
                width:220, height:220, borderRadius:'50%',
                border:'1px solid rgba(99,102,241,0.12)',
                animation:'ringExpand 3s ease-in-out infinite',
              }}/>
              <div style={{
                position:'absolute', top:'50%', left:'50%',
                transform:'translate(-50%,-50%)',
                width:280, height:280, borderRadius:'50%',
                border:'1px solid rgba(139,92,246,0.07)',
                animation:'ringExpand 3s 0.5s ease-in-out infinite',
              }}/>
              <img
                src="/logo.png" alt="RAM LLM"
                style={{
                  width:110, height:110, objectFit:'contain', position:'relative', zIndex:1,
                  filter:'drop-shadow(0 0 28px rgba(99,102,241,0.6)) drop-shadow(0 0 60px rgba(139,92,246,0.3))',
                  animation:'logoFloat 4s ease-in-out infinite',
                }}
              />
            </div>

            {/* Title */}
            <h2 style={{
              fontSize:28, fontWeight:800, margin:'0 0 8px',
              background:'linear-gradient(135deg, #fff 0%, #a78bfa 60%, #60a5fa 100%)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              animation:'titleShimmer 4s linear infinite',
              backgroundSize:'200% auto',
            }}>RAM LLM</h2>
            <p className="text-slate-400 text-sm mb-6" style={{ maxWidth:280, lineHeight:1.6 }}>
              Your local AI<br/>
              <span style={{ color:'rgba(99,102,241,0.7)', fontSize:12 }}>Ask me anything to get started</span>
            </p>

            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2 justify-center" style={{ maxWidth:440 }}>
              {['Explain quantum computing', 'Write a Python script', 'Summarize a topic', 'Tell me a joke'].map((s, i) => (
                <button key={s} onClick={() => onSend(s)} style={{
                  padding:'8px 16px', borderRadius:999,
                  background:'rgba(99,102,241,0.08)',
                  border:'1px solid rgba(99,102,241,0.25)',
                  color:'rgba(255,255,255,0.7)', fontSize:12, cursor:'pointer',
                  transition:'all 0.2s',
                  animation:`chipIn 0.5s ${i * 0.1}s both`,
                }}
                  onMouseEnter={e=>{e.target.style.background='rgba(99,102,241,0.2)';e.target.style.borderColor='rgba(99,102,241,0.6)';e.target.style.color='#fff';e.target.style.transform='translateY(-2px)';}}
                  onMouseLeave={e=>{e.target.style.background='rgba(99,102,241,0.08)';e.target.style.borderColor='rgba(99,102,241,0.25)';e.target.style.color='rgba(255,255,255,0.7)';e.target.style.transform='translateY(0)';}}
                >{s}</button>
              ))}
            </div>

            <style>{`
              @keyframes homeBubble {
                0%   { transform:translateY(100vh) scale(0.8); opacity:0; }
                10%  { opacity:1; }
                90%  { opacity:0.6; }
                100% { transform:translateY(-20vh) scale(1.1); opacity:0; }
              }
              @keyframes ringPulse {
                0%,100% { transform:translate(-50%,-50%) scale(1); opacity:0.8; }
                50%     { transform:translate(-50%,-50%) scale(1.15); opacity:0.4; }
              }
              @keyframes ringExpand {
                0%   { transform:translate(-50%,-50%) scale(0.85); opacity:0; }
                30%  { opacity:1; }
                100% { transform:translate(-50%,-50%) scale(1.2); opacity:0; }
              }
              @keyframes logoFloat {
                0%,100% { transform:translateY(0) rotate(-1deg); }
                50%     { transform:translateY(-10px) rotate(1deg); }
              }
              @keyframes titleShimmer {
                0%   { background-position:0% center; }
                100% { background-position:200% center; }
              }
              @keyframes chipIn {
                from { opacity:0; transform:translateY(12px); }
                to   { opacity:1; transform:translateY(0); }
              }
            `}</style>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="px-3 md:px-8 py-3 md:py-4 border-t border-border bg-surface/50 backdrop-blur-sm pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-end gap-2 md:gap-3 bg-surface border border-border rounded-2xl px-3 md:px-4 py-2.5 md:py-3 focus-within:border-accent transition-colors duration-200 shadow-lg">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? 'AI is responding...' : 'Message RAM LLM...'}
            rows={1}
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 resize-none outline-none leading-relaxed max-h-40"
          />

          {/* Stop button while streaming, Send button otherwise */}
          {isLoading ? (
            <button
              onClick={onStop}
              title="Stop generating"
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/30 transition-all duration-150 active:scale-95"
            >
              {/* Stop square icon */}
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="5" y="5" width="14" height="14" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              title="Send message"
              className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 ${
                input.trim()
                  ? 'bg-accent hover:bg-accent-hover text-white shadow-md shadow-accent/30 scale-100 active:scale-95'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed scale-95'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
        <p className="text-xs text-slate-600 text-center mt-2">
          Cloud AI backend · Fast streaming responses
        </p>
      </div>
    </div>
  );
}




