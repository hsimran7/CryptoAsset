import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { apiRequest } from '../utils/api';
import { Sparkline } from '../components/Charts';
import {
  Star,
  LayoutGrid,
  List,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  ExternalLink,
  Plus,
  Loader2,
  AlertTriangle,
  CheckCircle,
  X,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

export default function Watchlist() {
  const { coins } = useApp();
  const [watchlistItems, setWatchlistItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCoinId, setSelectedCoinId] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', or 'heatmap'

  // Fetch watchlist from backend
  const loadWatchlist = async () => {
    try {
      setIsLoading(true);
      const res = await apiRequest('/watchlist-items');
      if (res.success && res.data) {
        setWatchlistItems(res.data || []);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load watchlist.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handle = setTimeout(() => {
      loadWatchlist();
    }, 0);
    return () => clearTimeout(handle);
  }, []);

  // Add coin to watchlist
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCoinId) return;
    setErrorMessage('');
    setSuccessMessage('');

    const coin = coins.find(c => c.id === selectedCoinId);
    if (!coin) return;

    try {
      const res = await apiRequest('/watchlist-items', {
        method: 'POST',
        body: {
          coinId: coin.id,
          coinName: coin.name,
          symbol: coin.symbol,
          coinImage: coin.image
        }
      });
      if (res.success) {
        setSuccessMessage(`${coin.name} added to watchlist!`);
        setSelectedCoinId('');
        loadWatchlist();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to add coin to watchlist.');
    }
  };

  // Remove coin from watchlist
  const handleRemove = async (coinId, coinName) => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await apiRequest(`/watchlist-items/${coinId}`, {
        method: 'DELETE'
      });
      if (res.success) {
        setSuccessMessage(`${coinName || 'Coin'} removed from watchlist.`);
        loadWatchlist();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to remove coin.');
    }
  };

  // Map backend watchlist items to full metrics from coins list
  const watchedCoins = watchlistItems.map(item => {
    const liveCoin = coins.find(c => c.id === item.coinId);
    return {
      ...item,
      category: liveCoin?.category || 'Crypto',
      marketCap: liveCoin?.marketCap || 0,
      sparkline: liveCoin?.sparkline || [],
      price: item.price || liveCoin?.price || 0,
      change24h: item.change24h || liveCoin?.change24h || 0
    };
  });

  return (
    <div className="space-y-6 text-left relative">
      {/* Toast Notifications */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-white/5 border border-white/10 text-white text-xs px-4 py-3 rounded-lg flex items-center gap-2 shadow-2xl backdrop-blur-md">
          <CheckCircle className="w-4.5 h-4.5 text-white" />
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="ml-2 hover:text-white"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 bg-white/5 border border-white/10 text-slate-300 text-xs px-4 py-3 rounded-lg flex items-center gap-2 shadow-2xl backdrop-blur-md">
          <AlertTriangle className="w-4.5 h-4.5 text-slate-400" />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="ml-2 hover:text-white"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-sans font-bold text-2xl md:text-3xl text-white tracking-tight">
            Favorite Watchlist
          </h1>
          <p className="text-slate-400 text-xs mt-1">Monitor live metrics, track performance, and inspect asset details.</p>
        </div>

        {/* View Switchers & Dropdown Adder */}
        <div className="flex flex-wrap items-center gap-3 select-none">
          {/* Dropdown Quick Adder */}
          <form onSubmit={handleAddSubmit} className="flex gap-2">
            <select
              value={selectedCoinId}
              onChange={(e) => setSelectedCoinId(e.target.value)}
              className="p-2 text-xs glass-input text-white min-w-[160px] cursor-pointer"
            >
              <option value="" className="bg-dark-950 text-slate-500">-- Add Asset --</option>
              {coins.map((c) => (
                <option key={c.id} value={c.id} className="bg-dark-950 text-white">
                  {c.symbol} ({c.name})
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!selectedCoinId}
              className="p-2.5 rounded-lg bg-white hover:bg-white/90 disabled:opacity-40 text-black transition-colors font-bold cursor-pointer"
              title="Add to Watchlist"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          {/* Grid/List/Heatmap layout switches */}
          <div className="flex bg-black/40 border border-white/5 rounded-lg p-0.5 text-slate-400 font-mono text-[10px] font-bold">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1.5 rounded-md flex items-center gap-1 cursor-pointer ${viewMode === 'grid' ? 'bg-white text-black shadow' : 'hover:text-white'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> GRID
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1.5 rounded-md flex items-center gap-1 cursor-pointer ${viewMode === 'list' ? 'bg-white text-black shadow' : 'hover:text-white'}`}
            >
              <List className="w-3.5 h-3.5" /> LIST
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              className={`px-2.5 py-1.5 rounded-md flex items-center gap-1 cursor-pointer ${viewMode === 'heatmap' ? 'bg-white text-black shadow' : 'hover:text-white'}`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> HEATMAP
            </button>
          </div>
        </div>
      </div>

      {isLoading && watchedCoins.length === 0 ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
          <p className="text-slate-400 text-xs">Querying watchlisted coins and live metrics...</p>
        </div>
      ) : (
        <>
          {watchedCoins.length === 0 ? (
            /* Empty State */
            <div className="glass-panel p-12 text-center max-w-xl mx-auto space-y-4">
              <div className="w-11 h-11 rounded-full bg-white/5 text-white border border-white/10 flex items-center justify-center mx-auto">
                <Star className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Watchlist Empty</h3>
                <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                  Your custom watchlist is empty. Choose a coin from the top dropdown or visit the Market Screener to add assets.
                </p>
              </div>
              <Link to="/market" className="btn-premium-indigo text-xs py-2 px-5 inline-block font-semibold">
                Explore Market Screener
              </Link>
            </div>
          ) : (
            <>
              {/* GRID MODE */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {watchedCoins.map((coin) => {
                    const isPositive = coin.change24h >= 0;
                    return (
                      <div key={coin.coinId} className="glass-panel-interactive p-5 flex flex-col justify-between h-48 text-left">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            {coin.coinImage && (
                              <img src={coin.coinImage} alt={coin.symbol} className="w-7 h-7 rounded-full object-cover filter grayscale" />
                            )}
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white text-sm font-mono">{coin.symbol}</span>
                                <span className="text-slate-400 text-[10px] truncate max-w-[80px]">{coin.coinName}</span>
                              </div>
                              <span className="text-[8px] bg-white/5 border border-white/5 text-slate-500 px-1 py-0.2 rounded font-semibold capitalize font-sans">
                                {coin.category}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex gap-1.5">
                            <Link
                              to={`/alerts?symbol=${coin.symbol}`}
                              className="p-1 rounded bg-white/5 text-slate-400 hover:text-white transition-colors"
                              title="Set Price Alert"
                            >
                              <Bell className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => handleRemove(coin.coinId, coin.coinName)}
                              className="p-1 rounded bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                              title="Remove from watchlist"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Middle metrics */}
                        <div className="py-2 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-lg font-bold text-white font-mono">
                              ${coin.price.toLocaleString(undefined, { minimumFractionDigits: coin.price > 1 ? 2 : 5 })}
                            </span>
                            <div className={`text-[10px] font-bold flex items-center ${isPositive ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                              {isPositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                              {isPositive ? '+' : ''}{coin.change24h.toFixed(2)}%
                            </div>
                          </div>
                          {coin.sparkline && coin.sparkline.length > 0 && (
                            <Sparkline data={coin.sparkline} isPositive={isPositive} width={90} height={28} />
                          )}
                        </div>

                        {/* Footer details link */}
                        <div className="border-t border-white/5 pt-3 flex justify-between items-center text-[10px]">
                          <span className="text-slate-500 font-mono">MCap: ${(coin.marketCap / 1e9).toFixed(2)}B</span>
                          <Link to={`/coin/${coin.coinId}`} className="text-slate-300 hover:text-white font-semibold flex items-center gap-0.5">
                            Details <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* LIST MODE */}
              {viewMode === 'list' && (
                <div className="glass-panel overflow-hidden">
                  <table className="w-full border-collapse text-xs font-mono text-left">
                    <thead>
                      <tr className="border-b border-white/5 text-slate-500 font-semibold uppercase tracking-wider bg-white/2 text-[10px]">
                        <th className="py-3 px-4 w-12 text-center">Delete</th>
                        <th className="py-3 px-4">Asset</th>
                        <th className="py-3 px-4 text-right">Price (USD)</th>
                        <th className="py-3 px-4 text-right">24h Change</th>
                        <th className="py-3 px-4 text-right">Market Cap</th>
                        <th className="py-3 px-4 text-center w-32">Trend (7d)</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {watchedCoins.map((coin) => {
                        const isPositive = coin.change24h >= 0;
                        return (
                          <tr key={coin.coinId} className="hover:bg-white/[0.01] transition-colors">
                            <td className="py-3 text-center">
                              <button
                                onClick={() => handleRemove(coin.coinId, coin.coinName)}
                                className="p-1.5 rounded text-slate-500 hover:text-white transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                            <td className="py-3 px-2 font-sans">
                              <div className="flex items-center gap-2">
                                {coin.coinImage && (
                                  <img src={coin.coinImage} alt={coin.symbol} className="w-5 h-5 rounded-full object-cover filter grayscale" />
                                )}
                                <Link to={`/coin/${coin.coinId}`} className="hover:text-white transition-colors">
                                  <span className="font-bold text-white font-mono">{coin.symbol}</span> - <span className="text-slate-400 text-xs">{coin.coinName}</span>
                                </Link>
                              </div>
                            </td>
                            <td className="py-3 text-right font-bold text-slate-200 font-mono">${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td className={`py-3 text-right font-bold font-mono ${isPositive ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                              {isPositive ? '+' : ''}{coin.change24h.toFixed(2)}%
                            </td>
                            <td className="py-3 text-right text-slate-500 font-mono">${(coin.marketCap / 1e9).toFixed(2)}B</td>
                            <td className="py-2 text-center">
                              {coin.sparkline && coin.sparkline.length > 0 && (
                                <div className="inline-block">
                                  <Sparkline data={coin.sparkline} isPositive={isPositive} width={90} height={25} />
                                </div>
                              )}
                            </td>
                            <td className="py-3 text-center">
                              <div className="flex justify-center gap-2">
                                <Link
                                  to={`/alerts?symbol=${coin.symbol}`}
                                  className="btn-premium-dark text-[10px] py-1 px-3 border rounded flex items-center gap-1 text-slate-300"
                                >
                                  <Bell className="w-3.5 h-3.5" /> Alert
                                </Link>
                                <Link
                                  to={`/coin/${coin.coinId}`}
                                  className="btn-premium-dark text-[10px] py-1 px-3 border rounded flex items-center gap-1 text-slate-300"
                                >
                                  Details
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* HEATMAP MODE */}
              {viewMode === 'heatmap' && (
                <div className="space-y-4">
                  {/* Heatmap Grid instructions */}
                  <div className="flex items-center justify-between text-xs text-slate-500 font-sans border-b border-white/5 pb-2">
                    <span>Performance Heatmap (Intensity indicates size of 24h change)</span>
                    <div className="flex gap-2 items-center text-[10px] font-mono">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-white/10 text-accent-rose border border-white/5 rounded" /> &lt; -5%</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-white/5 text-accent-rose border border-white/5 rounded" /> negative</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-white/5 border border-white/10 rounded" /> neutral</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-white/5 text-accent-emerald border border-white/5 rounded" /> positive</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-white/15 text-accent-emerald border border-white/10 rounded" /> &gt; +5%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {watchedCoins.map((coin) => {
                      const ch = coin.change24h;
                      
                      // Calculate heat colors in premium greyscale
                      let heatClass = 'bg-white/5 border-white/10 text-slate-400';
                      let icon = null;

                      if (ch >= 5) {
                        heatClass = 'bg-white/15 border-white/20 text-accent-emerald hover:bg-white/20';
                        icon = <TrendingUp className="w-3.5 h-3.5" />;
                      } else if (ch > 0) {
                        heatClass = 'bg-white/5 border-white/10 text-accent-emerald hover:bg-white/8';
                        icon = <ArrowUpRight className="w-3.5 h-3.5" />;
                      } else if (ch <= -5) {
                        heatClass = 'bg-white/10 border-white/20 text-accent-rose hover:bg-white/15';
                        icon = <TrendingDown className="w-3.5 h-3.5" />;
                      } else if (ch < 0) {
                        heatClass = 'bg-white/5 border-white/10 text-accent-rose hover:bg-white/8';
                        icon = <ArrowDownRight className="w-3.5 h-3.5" />;
                      }

                      return (
                        <Link
                          key={coin.coinId}
                          to={`/coin/${coin.coinId}`}
                          className={`p-4 rounded-xl border transition-all flex flex-col justify-between items-center text-center aspect-square ${heatClass}`}
                        >
                          <div className="flex items-center gap-1.5">
                            {coin.coinImage && (
                              <img src={coin.coinImage} alt={coin.symbol} className="w-4 h-4 rounded-full object-cover filter grayscale" />
                            )}
                            <span className="font-bold text-sm font-mono text-white leading-none">{coin.symbol}</span>
                          </div>
                          
                          <div className="my-2 space-y-1">
                            <div className="text-base font-extrabold font-mono flex items-center justify-center gap-0.5">
                              {ch >= 0 ? '+' : ''}{ch.toFixed(2)}%
                            </div>
                            <div className="text-[10px] text-slate-300 font-mono">
                              ${coin.price.toLocaleString(undefined, { minimumFractionDigits: coin.price > 1 ? 2 : 4 })}
                            </div>
                          </div>

                          <div className="text-[8px] font-sans font-bold flex items-center gap-0.5 uppercase tracking-wide opacity-80">
                            {icon} Details
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
