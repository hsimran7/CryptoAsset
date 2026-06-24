import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Terminal, 
  HelpCircle,
  TrendingUp,
  Activity,
  Layers
} from 'lucide-react';

export default function AIAssistant() {
  const { chatMessages, askAIAssistant, isTyping } = useApp();
  const [query, setQuery] = useState('');
  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    askAIAssistant(query);
    setQuery('');
  };

  const handleShortcut = (cmd) => {
    askAIAssistant(cmd);
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col lg:flex-row gap-6 text-left">
      {/* Left Pane: Suggested commands (1/3 width on desktop) */}
      <div className="w-full lg:w-80 glass-panel rounded-xl border border-white/5 p-5 flex flex-col justify-between space-y-4">
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-400" /> CLI Command Prompt
            </h3>
            <p className="text-[11px] text-slate-400">Click quick triggers below to execute AI evaluation protocols.</p>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => handleShortcut('/analyze portfolio')}
              className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/20 text-xs font-mono text-slate-200 transition-all flex items-start gap-2"
            >
              <Activity className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-bold text-indigo-400 block">/analyze portfolio</span>
                <span className="text-[10px] text-slate-400">Audits holdings diversification &amp; volatility risk score.</span>
              </div>
            </button>

            <button
              onClick={() => handleShortcut('/market bullish')}
              className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/20 text-xs font-mono text-slate-200 transition-all flex items-start gap-2"
            >
              <TrendingUp className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-bold text-emerald-400 block">/market bullish</span>
                <span className="text-[10px] text-slate-400">Queries the screener to fetch highest bullish indicators.</span>
              </div>
            </button>

            <button
              onClick={() => handleShortcut('What alerts do I have active right now?')}
              className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/20 text-xs font-mono text-slate-200 transition-all flex items-start gap-2"
            >
              <HelpCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-bold text-amber-400 block">Check active alerts</span>
                <span className="text-[10px] text-slate-400">Summarizes pricing thresholds set in notifications.</span>
              </div>
            </button>
          </div>
        </div>

        {/* Advisor Credentials Footer */}
        <div className="bg-indigo-600/15 border border-indigo-500/10 p-3.5 rounded-lg text-[10px] text-slate-300 font-mono leading-normal">
          <span className="font-bold text-indigo-400 block mb-1">Model Layer: CryptoVision V4</span>
          Evaluates multi-sector correlations, technical RSI bands, and order book volumes dynamically.
        </div>
      </div>

      {/* Right Pane: Chat Console Area (2/3 width) */}
      <div className="flex-1 glass-panel rounded-xl border border-white/5 flex flex-col justify-between overflow-hidden shadow-2xl">
        {/* Console Header */}
        <div className="h-12 border-b border-white/5 bg-dark-900/40 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-bold text-white tracking-wide">CryptoVision AI Co-Pilot Console</span>
          </div>
          <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-semibold">
            SECURE PORT
          </span>
        </div>

        {/* Message Logs */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto font-mono text-xs">
          {chatMessages.map((msg, idx) => {
            const isAI = msg.sender === 'ai';
            return (
              <div 
                key={idx} 
                className={`flex gap-3 max-w-[85%] ${isAI ? 'mr-auto text-left' : 'ml-auto text-right flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                  isAI ? 'bg-indigo-600/10 border-indigo-500/20 text-indigo-400' : 'bg-white/5 border-white/10 text-slate-300'
                }`}>
                  {isAI ? <Bot className="w-4.5 h-4.5" /> : <span className="font-sans font-bold">U</span>}
                </div>

                {/* Bubble */}
                <div className={`p-3 rounded-xl ${
                  isAI ? 'bg-white/5 border border-white/5 text-slate-200 rounded-tl-none' : 'bg-indigo-600/25 border border-indigo-500/30 text-white rounded-tr-none'
                }`}>
                  {isAI && (
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">Co-Pilot Advisor</span>
                  )}
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            );
          })}

          {/* Typing Loading Indicator */}
          {isTyping && (
            <div className="flex gap-3 mr-auto text-left">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div className="bg-white/5 border border-white/5 p-3 rounded-xl rounded-tl-none flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* Console Input Bar */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-white/5 bg-dark-900/20 flex gap-2">
          <input
            type="text"
            placeholder="Query market indicators, portfolio analysis or coin pairs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs glass-input focus:ring-1 focus:ring-indigo-500 font-mono"
          />
          <button
            type="submit"
            className="btn-premium-indigo p-2.5 rounded-lg flex items-center justify-center flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
