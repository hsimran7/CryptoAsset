import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle,
  Download,
  ArrowRight,
  FileCheck
} from 'lucide-react';

export default function AIPortfolioAnalyzer() {
  const { portfolio, coins } = useApp();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateSuccess, setGenerateSuccess] = useState(false);

  // Sector calculations from active holdings
  let layer1Weight = 0;
  let defiWeight = 0;
  let aiWeight = 0;
  let memeWeight = 0;
  let totalValue = 0;

  portfolio.holdings.forEach(h => {
    const coin = coins.find(c => c.symbol === h.symbol);
    if (!coin) return;
    const val = h.amount * coin.price;
    totalValue += val;

    if (coin.category.toUpperCase() === 'LAYER 1') layer1Weight += val;
    else if (coin.category.toUpperCase() === 'DEFI') defiWeight += val;
    else if (coin.category.toUpperCase() === 'AI') aiWeight += val;
    else if (coin.category.toUpperCase() === 'MEME') memeWeight += val;
  });

  const l1Pct = totalValue === 0 ? 0 : (layer1Weight / totalValue) * 100;
  const defiPct = totalValue === 0 ? 0 : (defiWeight / totalValue) * 100;
  const aiPct = totalValue === 0 ? 0 : (aiWeight / totalValue) * 100;
  const memePct = totalValue === 0 ? 0 : (memeWeight / totalValue) * 100;

  const handleExport = () => {
    setIsGenerating(true);
    setGenerateSuccess(false);
    setTimeout(() => {
      setIsGenerating(false);
      setGenerateSuccess(true);
      setTimeout(() => setGenerateSuccess(false), 3000);
    }, 2000);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-white tracking-tight">
            AI Portfolio Analyzer
          </h1>
          <p className="text-slate-400 text-xs mt-1">Audit diversification ratings, volatility betas, and asset allocations.</p>
        </div>
        
        <button
          onClick={handleExport}
          disabled={isGenerating}
          className="btn-premium-indigo text-xs flex items-center justify-center gap-2 self-start py-2.5 px-4"
        >
          {isGenerating ? (
            <>
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              Generating Audit PDF...
            </>
          ) : generateSuccess ? (
            <>
              <FileCheck className="w-4 h-4 text-emerald-400" />
              Audit Downloaded!
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Export Risk Audit
            </>
          )}
        </button>
      </div>

      {/* 1. RISK SCORE & VOLATILITY KPI ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Diversification Rating Dial Card */}
        <div className="glass-panel rounded-xl border border-white/5 p-5 flex flex-col items-center justify-center text-center space-y-4">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider self-start">Diversification Rating</span>
          
          <div className="relative w-36 h-36 flex items-center justify-center select-none">
            {/* Custom SVG gauge arc */}
            <svg width="144" height="144" className="transform -rotate-90">
              <circle cx="72" cy="72" r="54" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="8" />
              <circle 
                cx="72" 
                cy="72" 
                r="54" 
                fill="none" 
                stroke="#6366f1" 
                strokeWidth="8" 
                strokeDasharray="339.2" 
                strokeDashoffset="74.6" /* 78% filled */
                strokeLinecap="round" 
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center font-display">
              <span className="text-3xl font-extrabold text-white">78</span>
              <span className="text-[10px] font-bold text-slate-400">OUT OF 100</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-emerald-400">HEALTHY BALANCED RATING</span>
            <p className="text-[10px] text-slate-400 px-4">Assets spread across 4 primary sectors with good cap weighting limits.</p>
          </div>
        </div>

        {/* Volatility indicators parameters (2/3 width) */}
        <div className="glass-panel rounded-xl border border-white/5 p-5 space-y-4 lg:col-span-2 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="font-bold text-base text-white">Volatility Profile Matrix</h3>
            <p className="text-[11px] text-slate-400">Audited against BTC and S&amp;P 500 benchmarks.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-t border-b border-white/5 font-mono text-xs">
            <div className="space-y-1">
              <div className="text-slate-500 font-semibold uppercase text-[9px]">Beta Rating (BTC)</div>
              <div className="text-white text-base font-bold">1.14</div>
              <span className="text-[9px] text-slate-400">Moderately active</span>
            </div>
            <div className="space-y-1">
              <div className="text-slate-500 font-semibold uppercase text-[9px]">Sharpe Ratio</div>
              <div className="text-emerald-400 text-base font-bold">1.82</div>
              <span className="text-[9px] text-emerald-500">Strong returns/risk</span>
            </div>
            <div className="space-y-1">
              <div className="text-slate-500 font-semibold uppercase text-[9px]">Avg Monthly Vol</div>
              <div className="text-white text-base font-bold">12.4%</div>
              <span className="text-[9px] text-slate-400">Standard deviation</span>
            </div>
            <div className="space-y-1">
              <div className="text-slate-500 font-semibold uppercase text-[9px]">Max Drawdown</div>
              <div className="text-rose-400 text-base font-bold">-14.8%</div>
              <span className="text-[9px] text-rose-500">90-day peak limits</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/5 p-3 rounded-lg text-xs leading-normal flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
            <p className="text-slate-300">
              <span className="font-bold text-white">Verdict: Moderate Risk.</span> Volatility remains slightly above index targets due to high SOL and FET allocation. Portfolio beta remains healthy overall.
            </p>
          </div>
        </div>
      </div>

      {/* 2. DIVERSIFICATION AUDIT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sector Allocation check table (2/3 width) */}
        <div className="glass-panel rounded-xl border border-white/5 p-5 lg:col-span-2 space-y-4">
          <h3 className="font-bold text-base text-white">Asset Class Allocation Audit</h3>
          
          <div className="space-y-4 pt-1 font-mono text-xs">
            {/* L1 sector progress */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300 font-sans">
                <span className="font-bold">Layer 1 Protocols (BTC, ETH, SOL)</span>
                <span className="font-bold">{l1Pct.toFixed(1)}%</span>
              </div>
              <div className="w-full h-2 bg-dark-900 border border-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${l1Pct}%` }} />
              </div>
            </div>

            {/* DeFi sector progress */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300 font-sans">
                <span className="font-bold">Decentralized Finance (DeFi) (LINK)</span>
                <span className="font-bold">{defiPct.toFixed(1)}%</span>
              </div>
              <div className="w-full h-2 bg-dark-900 border border-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${defiPct}%` }} />
              </div>
            </div>

            {/* AI sector progress */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300 font-sans">
                <span className="font-bold">Artificial Intelligence (AI) (FET)</span>
                <span className="font-bold">{aiPct.toFixed(1)}%</span>
              </div>
              <div className="w-full h-2 bg-dark-900 border border-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full" style={{ width: `${aiPct}%` }} />
              </div>
            </div>

            {/* Meme sector progress */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300 font-sans">
                <span className="font-bold">Meme Tokens</span>
                <span className="font-bold">{memePct.toFixed(1)}%</span>
              </div>
              <div className="w-full h-2 bg-dark-900 border border-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${memePct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* AI Action Items list card (1/3 width) */}
        <div className="glass-panel rounded-xl border border-white/5 p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-violet-400" /> Action Items
            </h3>
            <p className="text-[11px] text-slate-400">Proactive trade balancing triggers.</p>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[170px] pt-1 text-xs">
            <div className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span className="text-slate-300 leading-normal">L1 holdings index exposure is well-hedged between BTC and ETH.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <span className="text-slate-300 leading-normal">AI token weights (FET) exceed 10%. Keep threshold alerts active to prevent sudden correction drawdowns.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <ArrowRight className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
              <span className="text-slate-300 leading-normal">Recommendation: Allocate 5% to stablecoins to create capital cushions.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
