import React, { useState, useRef, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { 
  Bot, 
  Send, 
  Terminal, 
  HelpCircle,
  TrendingUp,
  Activity,
  Trash2,
  BookOpen,
  AlertTriangle,
  RefreshCw,
  Cpu
} from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  { id: 'q1', text: 'What is Bitcoin?', icon: HelpCircle, color: 'text-amber-400' },
  { id: 'q2', text: 'Explain Ethereum simply.', icon: BookOpen, color: 'text-indigo-400' },
  { id: 'q3', text: 'Why is Bitcoin falling today?', icon: TrendingUp, color: 'text-rose-400' },
  { id: 'q4', text: 'Compare Bitcoin and Ethereum.', icon: Activity, color: 'text-emerald-400' },
  { id: 'q5', text: 'Explain this crypto trend.', icon: Terminal, color: 'text-violet-400' }
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('beginner'); // 'beginner' | 'pro'
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentTypingText, setCurrentTypingText] = useState('');
  const [historyLoading, setHistoryLoading] = useState(true);
  
  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, currentTypingText]);



  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await apiRequest('/ai/chat-history');
        if (active && res.success && res.data && res.data.history) {
          const formattedHistory = res.data.history.map(item => [
            { sender: 'user', text: item.question, timestamp: item.createdAt },
            { sender: 'ai', text: item.answer, timestamp: item.createdAt }
          ]).flat();
          setMessages(formattedHistory);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        if (active) setHistoryLoading(false);
      }
    };

    const timer = setTimeout(() => {
      load();
    }, 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  // Simulator for typewriter writing effect
  const typeOutResponse = (fullText, callback) => {
    setIsTyping(true);
    setCurrentTypingText('');
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < fullText.length) {
        const nextChar = fullText.charAt(index);
        setCurrentTypingText(prev => prev + nextChar);
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
        callback();
      }
    }, 8); // Fast typing speed
  };

  // Submit Prompt
  const handleQuerySubmit = async (textToSend) => {
    if (!textToSend || !textToSend.trim()) return;
    
    // Add user question to messages state
    const userMsg = { sender: 'user', text: textToSend, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setQuery('');

    try {
      const res = await apiRequest('/ai/chat', {
        method: 'POST',
        body: { question: textToSend, mode }
      });

      if (res.success && res.data && res.data.chat) {
        const aiResponseText = res.data.chat.answer;
        
        // Run typewriter effect
        typeOutResponse(aiResponseText, () => {
          setMessages(prev => [...prev, { 
            sender: 'ai', 
            text: aiResponseText, 
            timestamp: res.data.chat.createdAt 
          }]);
          setCurrentTypingText('');
        });
      } else {
        throw new Error(res.message || 'Unknown response format');
      }
    } catch (err) {
      console.error('AI chat failed:', err);
      const errorMsg = `Error communicating with co-pilot: ${err.message || 'Please check connection'}`;
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: errorMsg, 
        timestamp: new Date().toISOString() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading || isTyping) return;
    handleQuerySubmit(query);
  };

  // Clear Chat History
  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear your AI Assistant chat history?')) return;
    try {
      const res = await apiRequest('/ai/chat-history', { method: 'DELETE' });
      if (res.success) {
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to clear chat history:', err);
    }
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col lg:flex-row gap-6 text-left relative">
      {/* Left Pane: CLI Quick Triggers & Disclaimer */}
      <div className="w-full lg:w-80 glass-panel rounded-xl border border-white/5 p-5 flex flex-col justify-between space-y-4">
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="font-display font-extrabold text-base text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400 animate-pulse" /> Copilot Settings
            </h3>
            <p className="text-[11px] text-slate-400">Configure explanation level and prompt triggers.</p>
          </div>

          {/* Mode Selector */}
          <div className="space-y-2 pt-2">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Explanation Mode</label>
            <div className="grid grid-cols-2 bg-dark-900/60 border border-white/5 rounded-lg p-0.5">
              <button
                onClick={() => setMode('beginner')}
                className={`py-1.5 px-3 rounded-md text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'beginner' 
                    ? 'bg-indigo-600 text-white shadow' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" /> Beginner
              </button>
              <button
                onClick={() => setMode('pro')}
                className={`py-1.5 px-3 rounded-md text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'pro' 
                    ? 'bg-indigo-600 text-white shadow' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" /> Pro Terminal
              </button>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal">
              {mode === 'beginner' 
                ? 'Simplifies concepts using basic terminology and analogies.' 
                : 'Provides technical metrics, RSI levels, support values, and pro charts terms.'}
            </p>
          </div>

          {/* CLI Triggers */}
          <div className="space-y-2 pt-3">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Quick Presets</label>
            <div className="space-y-1.5">
              <button
                onClick={() => handleQuerySubmit('Give me a macro technical analysis of top 5 coins.')}
                disabled={isLoading || isTyping}
                className="w-full text-left py-2 px-2.5 rounded bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-mono text-slate-300 transition-colors flex items-center gap-1.5"
              >
                <TrendingUp className="w-3 h-3 text-emerald-400" /> Technical summary
              </button>
              <button
                onClick={() => handleQuerySubmit('Explain standard risk diversification techniques.')}
                disabled={isLoading || isTyping}
                className="w-full text-left py-2 px-2.5 rounded bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-mono text-slate-300 transition-colors flex items-center gap-1.5"
              >
                <Activity className="w-3 h-3 text-indigo-400" /> Explain diversification
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer Area */}
        <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg flex items-start gap-2 select-none">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-rose-400 text-[10px] block uppercase">Compliance Disclaimer</span>
            <p className="text-[9px] text-slate-300 leading-normal font-sans">
              This is educational information, not financial advice. Do not make trades based solely on co-pilot statements.
            </p>
          </div>
        </div>
      </div>

      {/* Right Pane: Chat Console Area */}
      <div className="flex-1 glass-panel rounded-xl border border-white/5 flex flex-col justify-between overflow-hidden shadow-2xl relative">
        
        {/* Chat Console Header */}
        <div className="h-12 border-b border-white/5 bg-dark-900/40 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-400" />
            <div>
              <span className="text-xs font-bold text-white tracking-wide block leading-none">CryptoVision AI Co-Pilot</span>
              <span className="text-[9px] text-slate-400 mt-1 block">Powered by Gemini 1.5 Flash</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 text-[10px] font-bold"
                title="Clear Chat History"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear History
              </button>
            )}
            <span className="text-[9px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-mono font-semibold uppercase">
              {mode} Mode
            </span>
          </div>
        </div>

        {/* Message Logs */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto font-mono text-xs scrollbar-thin">
          {historyLoading ? (
            <div className="min-h-[50vh] flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
              <p className="text-slate-500 text-[10px]">Retrieving secure co-pilot chat log...</p>
            </div>
          ) : messages.length === 0 && !isTyping ? (
            /* Empty Chat State with Suggested Questions */
            <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4 max-w-xl mx-auto space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Bot className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display font-extrabold text-sm text-slate-200 uppercase tracking-wider">Start a Conversation</h3>
                <p className="text-[11px] text-slate-400 max-w-md leading-relaxed font-sans">
                  Hello! I am your real-time co-pilot. Ask me details on market performance, technical indicators, or coin models.
                </p>
              </div>

              <div className="w-full space-y-2 pt-2 text-left">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-2 px-1">Suggested Questions</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTED_QUESTIONS.map(q => {
                    const IconComp = q.icon;
                    return (
                      <button
                        key={q.id}
                        onClick={() => handleQuerySubmit(q.text)}
                        className="p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/20 transition-all text-[11px] text-slate-200 text-left flex items-start gap-2.5 group"
                      >
                        <IconComp className={`w-4 h-4 mt-0.5 flex-shrink-0 ${q.color}`} />
                        <span className="group-hover:text-indigo-400 transition-colors font-sans">{q.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => {
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
                      {isAI ? <Bot className="w-4 h-4" /> : <span className="font-sans font-bold text-[10px]">U</span>}
                    </div>

                    {/* Bubble */}
                    <div className={`p-3.5 rounded-xl text-left leading-relaxed whitespace-pre-wrap select-text ${
                      isAI ? 'bg-white/5 border border-white/5 text-slate-200 rounded-tl-none font-sans' : 'bg-indigo-600/25 border border-indigo-500/30 text-white rounded-tr-none font-sans'
                    }`}>
                      {isAI && (
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-wider block">Co-Pilot Advisor</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                      )}
                      <p className="text-slate-100 text-[11.5px] leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                );
              })}

              {/* Character Typing effect container */}
              {isTyping && currentTypingText && (
                <div className="flex gap-3 max-w-[85%] mr-auto text-left">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white/5 border border-white/5 p-3.5 rounded-xl rounded-tl-none text-left font-sans">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-wider block">Co-Pilot Advisor</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                    </div>
                    <p className="text-slate-100 text-[11.5px] leading-relaxed whitespace-pre-wrap">{currentTypingText}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Loading Loader */}
          {isLoading && (
            <div className="flex gap-3 mr-auto text-left">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white/5 border border-white/5 px-4 py-3.5 rounded-xl rounded-tl-none flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* Suggested chips above input bar */}
        {messages.length > 0 && !isTyping && !isLoading && (
          <div className="px-3 py-1.5 bg-dark-950/20 border-t border-white/5 flex gap-2 overflow-x-auto select-none scrollbar-none whitespace-nowrap">
            {SUGGESTED_QUESTIONS.slice(0, 3).map(q => (
              <button
                key={q.id}
                onClick={() => handleQuerySubmit(q.text)}
                className="px-2.5 py-1 text-[10px] rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 font-sans transition-colors"
              >
                {q.text}
              </button>
            ))}
          </div>
        )}

        {/* Input Form Console */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-white/5 bg-dark-900/20 flex gap-2 relative">
          <input
            type="text"
            placeholder={isLoading || isTyping ? "Co-pilot is writing response..." : "Query market prices, comparisons or technical trends..."}
            value={query}
            disabled={isLoading || isTyping}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs glass-input focus:ring-1 focus:ring-indigo-500 font-mono text-white placeholder-slate-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || isTyping || !query.trim()}
            className="btn-premium-indigo p-2.5 rounded-lg flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
}
