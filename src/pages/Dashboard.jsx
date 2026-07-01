import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useApp } from '../context/AppContext';
import { usePriceStore } from '../store/usePriceStore';
import { apiRequest } from '../utils/api';
import { AreaChart } from '../components/Charts';
import DailySummaryWidget from '../components/DailySummaryWidget';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Bell, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronRight,
  Briefcase
} from 'lucide-react';

const MOCK_GROWTH_DATA = [
  { label: 'May 10', value: 120500 },
  { label: 'May 15', value: 124000 },
  { label: 'May 20', value: 122200 },
  { label: 'May 25', value: 129500 },
  { label: 'May 30', value: 133800 },
  { label: 'Jun 05', value: 139100 },
  { label: 'Jun 10', value: 145820 }
];

export default function Dashboard() {
  const { coins, portfolio, alerts, notifications, t, mode } = useApp();
  const [chartInterval, setChartInterval] = useState('7D');
  const livePrices = usePriceStore((state) => state.prices);
  const { data: assetsData } = useQuery({
    queryKey: ['portfolio-assets'],
    queryFn: () => apiRequest('/portfolio-assets').then(res => res.data?.assets || []),
    placeholderData: (prev) => prev
  });
  const assets = assetsData || [];

  // Compute stats dynamically
  const activeAlerts = alerts.filter(a => a.isActive).length;
  const recentAiSignals = notifications.filter(n => n.type === 'ai').length;

  // Compute live portfolio balance based on custom assets ledger
  const liveHoldingsValue = assets.reduce((sum, asset) => {
    const livePrice = livePrices[asset.coinId]?.price || asset.buyPrice;
    return sum + (asset.quantity * livePrice);
  }, 0);

  const liveNetWorth = portfolio.cashUSD + liveHoldingsValue;

  const totalCostBasis = assets.reduce((sum, asset) => sum + (asset.quantity * asset.buyPrice), 0);
  const livePnL = liveHoldingsValue - totalCostBasis;
  const livePnLPct = totalCostBasis === 0 ? 0 : (livePnL / totalCostBasis) * 100;

  // Sorting gainers and losers dynamically from ticking live prices
  const liveCoins = coins.map(c => {
    const liveData = livePrices[c.id];
    return {
      ...c,
      price: liveData?.price || c.price,
      change24h: liveData?.change24h || c.change24h,
      status: liveData?.status || 'same'
    };
  });

  const sortedCoins = [...liveCoins].sort((a, b) => b.change24h - a.change24h);
  const topGainers = sortedCoins.slice(0, 3);
  const topLosers = [...sortedCoins].reverse().slice(0, 3);
  return (
    <div className="space-y-6 text-left">
      {/* 1. WELCOME BANNER HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-white tracking-tight">
            {t('dashboard')}
          </h1>
          <p className="text-slate-400 text-xs mt-1">Real-time portfolio intelligence and terminal controls.</p>
        </div>
        <div className="text-xs bg-dark-900/40 border border-white/5 py-2 px-3 rounded-lg flex items-center gap-2 select-none">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-slate-400">Feed Status:</span>
          <span className="font-bold text-white uppercase tracking-wider">Live Connection</span>
        </div>
      </div>

      {/* 2. STATS GRID CARD PANELS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: Net Worth */}
        <div className="glass-panel rounded-xl border border-white/5 p-4.5 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
              {t('netPortfolioValue')}
              {mode === 'beginner' && (
                <span className="cursor-help text-indigo-400 font-normal normal-case text-[9px]" title="The combined USD value of all your holdings and cash.">
                  (?)
                </span>
              )}
            </span>
            <h3 className="text-xl font-bold text-white font-mono">${liveNetWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <span className={`text-[10px] font-bold flex items-center ${livePnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {livePnL >= 0 ? <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> : <TrendingDown className="w-3.5 h-3.5 mr-0.5" />}
              <span>{livePnL >= 0 ? '+' : ''}{livePnLPct.toFixed(2)}% (ROI)</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/10 flex items-center justify-center">
            <DollarSign className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* KPI: Cash USD */}
        <div className="glass-panel rounded-xl border border-white/5 p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
              Available Balance
              {mode === 'beginner' && (
                <span className="cursor-help text-indigo-400 font-normal normal-case text-[9px]" title="The amount of USD cash you have to trade.">
                  (?)
                </span>
              )}
            </span>
            <h3 className="text-xl font-bold text-white font-mono">${portfolio.cashUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <span className="text-[10px] text-slate-400 font-medium">USD Cash reserves</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-600/10 text-emerald-400 border border-emerald-500/10 flex items-center justify-center">
            <Briefcase className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* KPI: Active Alerts */}
        <div className="glass-panel rounded-xl border border-white/5 p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
              Active Price Alerts
              {mode === 'beginner' && (
                <span className="cursor-help text-indigo-400 font-normal normal-case text-[9px]" title="Triggers that alert you when a coin price threshold is met.">
                  (?)
                </span>
              )}
            </span>
            <h3 className="text-xl font-bold text-white font-mono">{activeAlerts}</h3>
            <span className="text-[10px] text-slate-400 font-medium">Monitoring thresholds</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-600/10 text-amber-400 border border-amber-500/10 flex items-center justify-center">
            <Bell className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* KPI: AI Advisor Signals */}
        <div className="glass-panel rounded-xl border border-white/5 p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
              AI Buy/Sell Signals
              {mode === 'beginner' && (
                <span className="cursor-help text-indigo-400 font-normal normal-case text-[9px]" title="Dynamic automated metrics suggesting purchase decisions.">
                  (?)
                </span>
              )}
            </span>
            <h3 className="text-xl font-bold text-white font-mono">{recentAiSignals}</h3>
            <span className="text-[10px] text-violet-400 font-bold flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-0.5" /> Recommended actions
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-violet-600/10 text-violet-400 border border-violet-500/10 flex items-center justify-center">
            <Sparkles className="w-5.5 h-5.5" />
          </div>
        </div>
      </div>

      {/* 3. MAIN INDEX CHART & INSIGHTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Area Chart (2/3 width) */}
        <div className="glass-panel rounded-xl border border-white/5 p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-white">Portfolio Valuation Index</h3>
              <p className="text-[11px] text-slate-400">Simulated growth curve index track.</p>
              {mode === 'pro' && (
                <div className="flex gap-3 text-[9px] font-mono text-slate-500 mt-1">
                  <span>ALPHA: 0.12</span>
                  <span>BETA: 1.08</span>
                  <span>SHARPE: 2.14</span>
                  <span>VOLATILITY (30D): 14.5%</span>
                </div>
              )}
            </div>
            <div className="flex bg-dark-900 border border-white/5 rounded-lg p-0.5 text-[10px]">
              {['24H', '7D', '30D', 'ALL'].map((interval) => (
                <button
                  key={interval}
                  onClick={() => setChartInterval(interval)}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                    chartInterval === interval 
                      ? 'bg-indigo-600 text-white shadow' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {interval}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <AreaChart data={MOCK_GROWTH_DATA} height={230} color="#6366f1" />
          </div>
        </div>

        {/* AI Recommendations panel (1/3 width) */}
        <div className="glass-panel rounded-xl border border-white/5 p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" /> AI Advisor Insights
            </h3>
            <p className="text-[11px] text-slate-400">Automated structural recommendations.</p>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[190px] pt-1">
            <div className="bg-white/5 p-3 rounded-lg border border-white/5">
              <div className="flex items-center justify-between text-[10px] font-bold text-emerald-400 mb-1.5 uppercase">
                <span>Solana Rebalance Target</span>
                <span className="bg-emerald-500/10 px-1 rounded">Moderate Buy</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-normal font-mono">
                SOL shows bullish consolidation above $140. Accumulating 5% additional weight reduces Ethereum cross-exposure volatility.
              </p>
            </div>
            <div className="bg-white/5 p-3 rounded-lg border border-white/5">
              <div className="flex items-center justify-between text-[10px] font-bold text-amber-400 mb-1.5 uppercase">
                <span>RSI Divergence: BTC</span>
                <span className="bg-amber-500/10 px-1 rounded">Hold Alert</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-normal font-mono">
                RSI has reached 68 on daily limits. Suggesting locking short-term profits or placing trailing alert brackets at $65.8k.
              </p>
            </div>
          </div>

          <Link to="/ai-assistant" className="btn-premium-indigo text-[11px] py-2 w-full text-center flex items-center justify-center gap-1">
            Consult Assistant <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 4. GAINERS & LOSERS ROW (3 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* TOP GAINERS */}
        <div className="glass-panel rounded-xl border border-white/5 p-4.5 space-y-3.5">
          <h3 className="font-bold text-xs text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" /> Top 3 Gainers
          </h3>
          <div className="space-y-2.5">
            {topGainers.map((coin) => {
              const flashClass = coin.status === 'up' ? 'price-flash-up' : coin.status === 'down' ? 'price-flash-down' : '';
              return (
                <Link 
                  key={coin.id} 
                  to={`/coin/${coin.id}`} 
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-white text-xs">{coin.symbol}</span>
                    <span className="text-slate-400 text-[10px]">{coin.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className={`font-semibold text-slate-200 text-xs font-mono transition-all ${flashClass}`}>
                      ${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center">
                      <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +{coin.change24h.toFixed(2)}%
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* TOP LOSERS */}
        <div className="glass-panel rounded-xl border border-white/5 p-4.5 space-y-3.5">
          <h3 className="font-bold text-xs text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingDown className="w-4 h-4" /> Top 3 Losers
          </h3>
          <div className="space-y-2.5">
            {topLosers.map((coin) => {
              const flashClass = coin.status === 'up' ? 'price-flash-up' : coin.status === 'down' ? 'price-flash-down' : '';
              return (
                <Link 
                  key={coin.id} 
                  to={`/coin/${coin.id}`} 
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-white text-xs">{coin.symbol}</span>
                    <span className="text-slate-400 text-[10px]">{coin.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className={`font-semibold text-slate-200 text-xs font-mono transition-all ${flashClass}`}>
                      ${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] font-bold text-rose-400 flex items-center">
                      <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" /> {coin.change24h.toFixed(2)}%
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* AI DAILY SUMMARY WIDGET — replaces static sentiment card */}
        <DailySummaryWidget />
      </div>
    </div>
  );
}
