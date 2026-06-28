import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { Sparkline } from '../components/Charts';
import {
  Search,
  Star,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  XCircle,
  TrendingUp
} from 'lucide-react';

export default function Market() {
  const { watchlist, toggleWatchlist } = useApp();
  
  // Screener states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('marketCap');
  const [sortOrder, setSortOrder] = useState('desc');
  const perPage = 10;

  const navigate = useNavigate();

  // 1. Debounce Search Queries
  useEffect(() => {
    const delay = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset page to 1 on searching
    }, 450);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  // 2. Fetch market list details via TanStack Query
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['markets', page, debouncedSearch, sortBy, sortOrder],
    queryFn: async () => {
      const response = await axios.get('http://localhost:5000/api/coins/markets', {
        params: {
          page,
          perPage,
          search: debouncedSearch,
          sortBy,
          sortOrder
        }
      });
      return response.data.data;
    },
    placeholderData: (prev) => prev
  });

  const coins = data?.coins || [];
  const pagination = data?.pagination || { total: 0, page: 1, perPage: 10, totalPages: 1 };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1); // Reset page to 1 on sorting
  };

  const handleRowClick = (coinId) => {
    navigate(`/coin/${coinId}`);
  };

  // Render Table Header with Sort Arrow indicators
  const renderSortHeader = (label, field, alignment = 'text-left') => {
    const isCurrent = sortBy === field;
    return (
      <th
        className={`py-3.5 px-4 cursor-pointer hover:text-white transition-colors ${alignment}`}
        onClick={() => handleSort(field)}
      >
        <div className={`flex items-center gap-1 ${alignment === 'text-right' ? 'justify-end' : 'justify-start'}`}>
          <span>{label}</span>
          <ArrowUpDown className={`w-3.5 h-3.5 ${isCurrent ? 'text-indigo-400' : 'text-slate-500'}`} />
        </div>
      </th>
    );
  };

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-white tracking-tight flex items-center gap-2">
            Live Market Screener
            {isFetching && <LoaderSpinner />}
          </h1>
          <p className="text-slate-400 text-xs mt-1">Explore, filter, and track digital assets in real time.</p>
        </div>
        
        {/* Refresh Button */}
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="self-start sm:self-auto flex items-center justify-center gap-1.5 px-4 py-2 border border-white/5 hover:border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-semibold transition-all duration-200"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh Feed
        </button>
      </div>

      {/* Controls: Search, Tabs, etc. */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search name or symbol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs glass-input focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Categories Banner info */}
        <div className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 self-stretch sm:self-auto">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Real-time rates bridged from CoinGecko API</span>
        </div>
      </div>

      {/* Main Table Screen */}
      <div className="glass-panel rounded-xl border border-white/5 overflow-hidden shadow-2xl">
        {isLoading ? (
          <TableSkeleton />
        ) : isError ? (
          <TableError message={error?.message} onRetry={refetch} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 text-slate-400 font-semibold uppercase tracking-wider text-left bg-dark-900/30">
                  <th className="py-3.5 px-4 w-12 text-center">Watch</th>
                  {renderSortHeader('Rank', 'rank', 'text-center w-16')}
                  {renderSortHeader('Name', 'name', 'text-left')}
                  {renderSortHeader('Price', 'price', 'text-right')}
                  {renderSortHeader('24h Change', 'change24h', 'text-right')}
                  {renderSortHeader('Market Cap', 'marketCap', 'text-right')}
                  {renderSortHeader('Volume', 'volume', 'text-right')}
                  <th className="py-3.5 px-6 text-center w-36">Last 7 Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {coins.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-500 font-sans">
                      No cryptocurrency matches your search criteria.
                    </td>
                  </tr>
                ) : (
                  coins.map((coin) => {
                    const isWatched = watchlist.includes(coin.symbol);
                    const isPositive = coin.change24h >= 0;

                    return (
                      <tr
                        key={coin.id}
                        className="hover:bg-white/[0.02] cursor-pointer group transition-colors"
                        onClick={() => handleRowClick(coin.id)}
                      >
                        {/* Watchlist toggle column */}
                        <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => toggleWatchlist(coin.symbol)}
                            className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-amber-400 transition-colors"
                          >
                            <Star className={`w-4 h-4 ${isWatched ? 'fill-amber-400 text-amber-400' : ''}`} />
                          </button>
                        </td>

                        {/* Rank Badge */}
                        <td className="py-4 px-4 text-center font-bold text-slate-400">
                          <span className="bg-white/5 px-2 py-0.5 rounded text-[10px]">{coin.rank}</span>
                        </td>

                        {/* Coin Logo + Name */}
                        <td className="py-4 px-4 font-sans text-left">
                          <div className="flex items-center gap-3">
                            <img
                              src={coin.image}
                              alt={coin.name}
                              className="w-6.5 h-6.5 rounded-full object-cover bg-white/5"
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=30&auto=format&fit=crop';
                              }}
                            />
                            <div className="flex flex-col">
                              <span className="font-bold text-white text-sm tracking-wide font-mono group-hover:text-indigo-400 transition-colors">
                                {coin.symbol}
                              </span>
                              <span className="text-slate-400 font-medium text-[10px] mt-0.5">
                                {coin.name}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="py-4 px-4 text-right font-bold text-slate-200">
                          ${coin.price.toLocaleString(undefined, { minimumFractionDigits: coin.price > 1 ? 2 : 6 })}
                        </td>

                        {/* 24h Change */}
                        <td className={`py-4 px-4 text-right font-bold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {isPositive ? '+' : ''}{coin.change24h.toFixed(2)}%
                        </td>

                        {/* Market Cap */}
                        <td className="py-4 px-4 text-right text-slate-300">
                          ${(coin.marketCap / 1e9).toLocaleString(undefined, { maximumFractionDigits: 2 })}B
                        </td>

                        {/* Volume */}
                        <td className="py-4 px-4 text-right text-slate-400">
                          ${(coin.volume24h / 1e6).toLocaleString(undefined, { maximumFractionDigits: 1 })}M
                        </td>

                        {/* Sparkline Graphic */}
                        <td className="py-3 px-6">
                          <div className="opacity-90 hover:opacity-100 transition-opacity flex justify-center">
                            {coin.sparkline && coin.sparkline.length > 0 ? (
                              <Sparkline data={coin.sparkline} isPositive={isPositive} width={100} height={28} />
                            ) : (
                              <span className="text-[10px] text-slate-600 font-sans">N/A</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {!isLoading && !isError && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-dark-900/30 border border-white/5 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-sans">
            Showing <span className="font-bold text-white">{coins.length}</span> of{' '}
            <span className="font-bold text-white">{pagination.total}</span> coins
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border border-white/5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-white/5 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="text-xs font-semibold text-slate-300 font-sans px-2">
              Page <span className="text-white font-bold">{page}</span> of {pagination.totalPages}
            </div>

            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="p-2 border border-white/5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-white/5 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponents helper - Table Loading Skeleton
const TableSkeleton = () => (
  <div className="animate-pulse space-y-0.5 divide-y divide-white/5">
    <div className="bg-dark-900/30 py-4 flex items-center justify-between px-6 border-b border-white/5">
      <div className="h-4 bg-slate-800 rounded w-16" />
      <div className="h-4 bg-slate-800 rounded w-28" />
      <div className="h-4 bg-slate-800 rounded w-20" />
      <div className="h-4 bg-slate-800 rounded w-20" />
      <div className="h-4 bg-slate-800 rounded w-24" />
      <div className="h-4 bg-slate-800 rounded w-24" />
      <div className="h-4 bg-slate-800 rounded w-28" />
    </div>
    {[...Array(10)].map((_, i) => (
      <div key={i} className="flex items-center justify-between py-5.5 px-6">
        <div className="w-4 h-4 bg-slate-800 rounded" />
        <div className="w-8 h-4 bg-slate-800 rounded" />
        <div className="flex items-center gap-2.5">
          <div className="w-6.5 h-6.5 bg-slate-800 rounded-full" />
          <div className="flex flex-col gap-1">
            <div className="w-12 h-3 bg-slate-800 rounded" />
            <div className="w-20 h-2 bg-slate-800 rounded" />
          </div>
        </div>
        <div className="w-20 h-3 bg-slate-800 rounded" />
        <div className="w-16 h-3 bg-slate-800 rounded" />
        <div className="w-24 h-3 bg-slate-800 rounded" />
        <div className="w-24 h-3 bg-slate-800 rounded" />
        <div className="w-24 h-6 bg-slate-800 rounded-lg" />
      </div>
    ))}
  </div>
);

// Subcomponents helper - Error Screen
const TableError = ({ message, onRetry }) => (
  <div className="py-16 text-center space-y-4 px-4">
    <div className="flex justify-center text-rose-500">
      <XCircle className="w-14 h-14" />
    </div>
    <h3 className="font-display font-extrabold text-white text-lg">Market Feed Offline</h3>
    <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
      {message || 'Unable to retrieve live market details. CoinGecko public API may be rate limited. Please try again.'}
    </p>
    <button
      onClick={onRetry}
      className="btn-premium-indigo text-xs py-2.5 px-6 font-bold inline-flex items-center gap-1.5 mt-2"
    >
      <RefreshCw className="w-3.5 h-3.5" />
      Reconnect Feed
    </button>
  </div>
);

// Mini loader dot animation
const LoaderSpinner = () => (
  <span className="flex h-2 w-2 relative">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
  </span>
);
