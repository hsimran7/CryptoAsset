import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Eye, 
  ArrowRight, 
  Bot, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight,
  Layers,
  Terminal,
  Activity
} from 'lucide-react';

export default function LandingPage() {
  const { coins } = useApp();

  return (
    <div className="min-h-screen bg-dark-950 animated-bg-mesh terminal-grid relative overflow-hidden flex flex-col justify-between">
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] animate-pulse-slow pointer-events-none" />

      {/* 1. TOP LOGO BAR */}
      <header className="w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center neon-border-indigo">
            <Eye className="w-5.5 h-5.5 text-white" />
          </div>
          <span className="font-display font-bold text-xl tracking-wider text-white">
            CryptoVision <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded ml-1 font-semibold">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link to="/register" className="btn-premium-indigo text-xs py-2 px-4">
            Get Started
          </Link>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <main className="max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col lg:flex-row items-center gap-12 z-10 relative flex-1 justify-center">
        <div className="flex-1 text-left space-y-6">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Next-Generation Fintech Portal
          </div>
          {/* Main Title */}
          <h1 className="text-4xl md:text-6xl font-display font-extrabold text-white leading-tight tracking-tight">
            Advanced Intelligence <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              For Crypto Markets
            </span>
          </h1>
          <p className="text-slate-400 text-base md:text-lg max-w-xl leading-relaxed">
            CryptoVision AI blends premium Bloomberg-grade terminal structures with real-time portfolio tracking, technical analysis alerts, and an autonomous AI investment assistant.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 pt-2">
            <Link to="/dashboard" className="btn-premium-indigo text-sm px-6 py-3 flex items-center gap-2 font-bold group">
              Launch Terminal <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/register" className="btn-premium-dark text-sm px-6 py-3 hover:bg-dark-600 transition-colors">
              Create Account
            </Link>
          </div>

          {/* Ticking Tickers display */}
          <div className="pt-8 border-t border-white/5 grid grid-cols-3 gap-4 max-w-md">
            {coins.slice(0, 3).map((coin) => {
              const isUp = coin.change24h >= 0;
              return (
                <div key={coin.id} className="text-left">
                  <div className="text-slate-400 text-xs font-semibold">{coin.symbol}/USD</div>
                  <div className="text-white font-bold text-sm font-mono mt-0.5">${coin.price.toLocaleString()}</div>
                  <div className={`text-[10px] font-bold flex items-center mt-0.5 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isUp ? '+' : ''}{coin.change24h}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hero visual panel mockup (interactive simulated screen) */}
        <div className="flex-1 w-full max-w-xl">
          <div className="glass-panel rounded-2xl shadow-3xl border border-white/10 p-5 relative overflow-hidden group">
            {/* Top terminal headers */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-slate-500 font-mono ml-2">TERMINAL_INSIGHTS_PRO</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono bg-white/5 px-2 py-0.5 rounded">
                SIMULATOR ACTIVE
              </div>
            </div>

            {/* Content preview blocks */}
            <div className="space-y-4">
              {/* Simulated chat widget */}
              <div className="flex gap-3 text-left">
                <div className="w-7 h-7 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white/5 p-3 rounded-xl rounded-tl-none border border-white/5 flex-1">
                  <span className="text-[10px] font-semibold text-violet-400 uppercase tracking-wide block mb-1">AI Assistant</span>
                  <p className="text-xs text-slate-200 leading-relaxed font-mono">
                    BTC is exhibiting high-volume breakout patterns past $67k. Target: $69,200. Recommending Portfolio Beta re-balancing.
                  </p>
                </div>
              </div>

              {/* Ticking mini order blocks */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 text-left">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Portfolio Allocation</span>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-lg font-bold text-white font-mono">$145,820</span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      +14.2%
                    </span>
                  </div>
                </div>
                <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 text-left">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Alert Engine</span>
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs text-slate-200 font-semibold">ETH Above $3,500 Triggered</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Glowing bottom grid overlay */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-indigo-500/10 to-transparent pointer-events-none" />
          </div>
        </div>
      </main>

      {/* 3. CORE BENEFITS SECTION */}
      <section className="bg-dark-900/40 border-t border-b border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex gap-4 text-left">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 text-indigo-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Conversational Assistant</h3>
              <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                Interact with a specialized investment chatbot capable of evaluating coin details, querying live charts, and issuing trade guidelines.
              </p>
            </div>
          </div>
          <div className="flex gap-4 text-left">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0 text-violet-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Interactive Visualization</h3>
              <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                Read deep-dive candlestick charts, sparklines, and allocation donuts designed specifically for elite dark-mode layout experiences.
              </p>
            </div>
          </div>
          <div className="flex gap-4 text-left">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 text-cyan-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Alert &amp; Safety Hub</h3>
              <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                Establish custom price thresholds. Our background simulation engine checks ticking feed prices and triggers notifications in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FOOTER */}
      <footer className="w-full max-w-7xl mx-auto px-6 h-16 flex items-center justify-between border-t border-white/5 text-slate-500 text-xs z-10 relative">
        <span>&copy; 2026 CryptoVision AI. All rights reserved.</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
}
