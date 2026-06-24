import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Sparkline } from '../components/Charts';
import { 
  Star, 
  LayoutGrid, 
  List, 
  Bell, 
  ArrowUpRight, 
  ArrowDownRight,
  Trash2,
  ExternalLink
} from 'lucide-react';

export default function Watchlist() {
  const { coins, watchlist, toggleWatchlist } = useApp();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const watchedCoins = coins.filter(c => watchlist.includes(c.symbol));

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-white tracking-tight">
            Favorite Watchlist
          </h1>
          <p className="text-slate-400 text-xs mt-1">Curate, prioritize, and track your favored assets.</p>
        </div>
        <div className="flex bg-dark-900 border border-white/5 rounded-lg p-0.5 text-slate-400">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow' : 'hover:text-white'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow' : 'hover:text-white'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Empty State */}
      {watchedCoins.length === 0 ? (
        <div className="glass-panel rounded-xl border border-white/5 p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 flex items-center justify-center mx-auto">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Watchlist Empty</h3>
            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
              You haven't favorited any digital assets yet. Navigate to the Screener and toggle stars to populate this panel.
            </p>
          </div>
          <Link to="/market" className="btn-premium-indigo text-xs py-2 px-5 inline-block font-semibold">
            Explore Market Screener
          </Link>
        </div>
      ) : (
        <>
          {/* GRID LAYOUT */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {watchedCoins.map((coin) => {
                const isPositive = coin.change24h >= 0;
                return (
                  <div key={coin.id} className="glass-panel-interactive rounded-xl border border-white/5 p-5 flex flex-col justify-between h-48">
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm font-mono">{coin.symbol}</span>
                          <span className="text-slate-400 text-[10px] truncate max-w-[80px]">{coin.name}</span>
                        </div>
                        <span className="text-[9px] bg-white/5 border border-white/5 text-slate-400 px-1 py-0.5 rounded font-semibold capitalize font-sans">
                          {coin.category}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Link 
                          to={`/alerts?symbol=${coin.symbol}`}
                          className="p-1 rounded bg-white/5 text-slate-400 hover:text-amber-400 transition-colors"
                          title="Set Price Alert"
                        >
                          <Bell className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => toggleWatchlist(coin.symbol)}
                          className="p-1 rounded bg-white/5 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Remove from watchlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Sparkline & Pricing Middle portion */}
                    <div className="py-2 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-lg font-bold text-white font-mono">
                          ${coin.price.toLocaleString(undefined, { minimumFractionDigits: coin.price > 1 ? 2 : 5 })}
                        </span>
                        <div className={`text-[10px] font-bold flex items-center ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                          {isPositive ? '+' : ''}{coin.change24h}%
                        </div>
                      </div>
                      <Sparkline data={coin.sparkline} isPositive={isPositive} width={90} height={28} />
                    </div>

                    {/* Footer buttons */}
                    <div className="border-t border-white/5 pt-3 flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 font-mono">MCap: ${(coin.marketCap / 1e9).toFixed(1)}B</span>
                      <Link to={`/coin/${coin.id}`} className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5">
                        Details <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* LIST LAYOUT */}
          {viewMode === 'list' && (
            <div className="glass-panel rounded-xl border border-white/5 overflow-hidden shadow-2xl">
              <table className="w-full border-collapse text-xs font-mono text-left">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400 font-semibold uppercase tracking-wider bg-dark-900/30">
                    <th className="py-3 px-4 w-12 text-center">Delete</th>
                    <th className="py-3 px-4">Symbol</th>
                    <th className="py-3 px-4 text-right">Price</th>
                    <th className="py-3 px-4 text-right">24h Change</th>
                    <th className="py-3 px-4 text-right">Market Cap</th>
                    <th className="py-3 px-4 text-center w-32">Trend</th>
                    <th className="py-3 px-4 text-center">Alerts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {watchedCoins.map((coin) => {
                    const isPositive = coin.change24h >= 0;
                    return (
                      <tr key={coin.id} className="hover:bg-white/[0.01]">
                        <td className="py-3 text-center">
                          <button
                            onClick={() => toggleWatchlist(coin.symbol)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                        <td className="py-3 px-2 font-sans">
                          <Link to={`/coin/${coin.id}`} className="hover:text-indigo-400 transition-colors">
                            <span className="font-bold text-white font-mono">{coin.symbol}</span> - <span className="text-slate-400 text-xs">{coin.name}</span>
                          </Link>
                        </td>
                        <td className="py-3 text-right font-bold text-slate-200">${coin.price.toLocaleString()}</td>
                        <td className={`py-3 text-right font-bold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {isPositive ? '+' : ''}{coin.change24h}%
                        </td>
                        <td className="py-3 text-right text-slate-400">${(coin.marketCap / 1e9).toFixed(1)}B</td>
                        <td className="py-2 flex items-center justify-center">
                          <Sparkline data={coin.sparkline} isPositive={isPositive} width={90} height={25} />
                        </td>
                        <td className="py-3 text-center">
                          <Link 
                            to={`/alerts?symbol=${coin.symbol}`}
                            className="btn-premium-dark text-[10px] py-1 px-3 border border-dark-600 rounded flex items-center gap-1 mx-auto w-fit"
                          >
                            <Bell className="w-3.5 h-3.5 text-amber-400" /> Alert
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
