import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Star,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Compass,
  Loader2,
  Bell,
  Plus
} from 'lucide-react';

// Custom tooltips inside Recharts
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-2.5 rounded-lg border border-white/10 text-xs font-mono text-left">
        <p className="text-slate-400 mb-0.5">{payload[0].payload.time}</p>
        <p className="text-white font-bold">${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
      </div>
    );
  }
  return null;
};

export default function CoinDetails() {
  const { id } = useParams();
  const { watchlist, toggleWatchlist, portfolio, handleBuy, handleSell, addAlert } = useApp();

  // Time filter state for historical chart (1 = 24H, 7 = 7D, 30 = 30D, 90 = 90D, 365 = 1Y)
  const [days, setDays] = useState(30);

  // Trading panel state
  const [tradeType, setTradeType] = useState('BUY');
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeSuccess, setTradeSuccess] = useState('');
  const [tradeError, setTradeError] = useState('');

  // Alerts panel state
  const [alertDirection, setAlertDirection] = useState('ABOVE');
  const [alertPrice, setAlertPrice] = useState('');
  const [alertSuccess, setAlertSuccess] = useState('');

  // 1. Query Specific Coin details
  const {
    data: coin,
    isLoading: isDetailsLoading,
    isError: isDetailsError,
    error: detailsError,
    refetch: refetchDetails
  } = useQuery({
    queryKey: ['coinDetails', id],
    queryFn: async () => {
      const response = await axios.get(`http://localhost:5000/api/coins/${id}`);
      return response.data.data;
    }
  });

  // 2. Query Historical chart data
  const {
    data: chartData = [],
    isLoading: isChartLoading
  } = useQuery({
    queryKey: ['coinChart', id, days],
    queryFn: async () => {
      const response = await axios.get(`http://localhost:5000/api/coins/${id}/chart`, {
        params: { days }
      });
      return response.data.data;
    }
  });

  if (isDetailsLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-slate-400 text-xs">Fetching asset metrics from database...</p>
      </div>
    );
  }

  if (isDetailsError || !coin) {
    return (
      <div className="glass-panel rounded-xl border border-white/5 p-12 text-center max-w-xl mx-auto space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/10 flex items-center justify-center mx-auto">
          <Compass className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-white text-base">Asset Metrics Offline</h3>
          <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
            {detailsError?.message || 'Unable to retrieve details for this cryptocurrency. Check connection.'}
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => refetchDetails()}
            className="bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs py-2 px-5 rounded-lg font-semibold transition-all"
          >
            Retry Connection
          </button>
          <Link to="/market" className="btn-premium-indigo text-xs py-2 px-5 inline-block font-semibold">
            Back to Screener
          </Link>
        </div>
      </div>
    );
  }

  const isWatched = watchlist.includes(coin.symbol);
  const isPositive = coin.change24h >= 0;

  // Trading balances details
  const liveCash = portfolio.cashUSD;
  const currentHolding = portfolio.holdings.find(h => h.symbol === coin.symbol);
  const holdingAmount = currentHolding ? currentHolding.amount : 0;
  const estCost = tradeAmount ? (parseFloat(tradeAmount) * coin.price) : 0;


  const handleTradeSubmit = (e) => {
    e.preventDefault();
    setTradeError('');
    setTradeSuccess('');

    const amt = parseFloat(tradeAmount);
    if (!amt || amt <= 0) {
      setTradeError('Please enter a valid amount.');
      return;
    }

    if (tradeType === 'BUY') {
      const cost = amt * coin.price;
      if (liveCash < cost) {
        setTradeError('Insufficient available cash.');
        return;
      }
      const ok = handleBuy(coin.symbol, amt, cost);
      if (ok) {
        setTradeSuccess(`Successfully purchased ${amt} ${coin.symbol}!`);
        setTradeAmount('');
      }
    } else {
      if (holdingAmount < amt) {
        setTradeError(`Insufficient holdings of ${coin.symbol}.`);
        return;
      }
      const proceeds = amt * coin.price;
      const ok = handleSell(coin.symbol, amt, proceeds);
      if (ok) {
        setTradeSuccess(`Successfully sold ${amt} ${coin.symbol}!`);
        setTradeAmount('');
      }
    }
  };

  const handleSetAlert = () => {
    setAlertSuccess('');
    const targetPrice = parseFloat(alertPrice);
    if (!targetPrice || targetPrice <= 0) {
      return;
    }
    addAlert(coin.symbol, alertDirection, targetPrice);
    setAlertSuccess(`Alert set: ${coin.symbol} goes ${alertDirection.toLowerCase()} $${targetPrice.toLocaleString()}`);
    setAlertPrice('');
  };

  const filterOptions = [
    { label: '24H', value: 1 },
    { label: '7D', value: 7 },
    { label: '30D', value: 30 },
    { label: '90D', value: 90 },
    { label: '1Y', value: 365 }
  ];

  return (
    <div className="space-y-6 text-left">
      {/* 1. COIN DETAILS HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <img
            src={coin.image}
            alt={coin.name}
            className="w-12 h-12 rounded-full object-cover bg-white/5 border border-white/5"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=40&auto=format&fit=crop';
            }}
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="font-display font-extrabold text-2xl md:text-3xl text-white tracking-tight">
                {coin.name}
              </h1>
              <span className="text-slate-400 font-mono font-bold text-base">({coin.symbol}/USD)</span>
              
              {/* Watchlist Toggle */}
              <button
                onClick={() => toggleWatchlist(coin.symbol)}
                className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-amber-400 transition-colors ml-1"
                title={isWatched ? 'Remove from Watchlist' : 'Add to Watchlist'}
              >
                <Star className={`w-5 h-5 ${isWatched ? 'fill-amber-400 text-amber-400' : ''}`} />
              </button>
            </div>
            
            <div className="flex gap-2">
              <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-semibold capitalize font-sans">
                Rank #{coin.rank}
              </span>
              <span className="text-[10px] bg-white/5 border border-white/5 text-slate-400 px-2 py-0.5 rounded font-semibold capitalize font-sans">
                Live Data
              </span>
            </div>
          </div>
        </div>

        {/* Live Prices summary block */}
        <div className="flex flex-col sm:text-right font-mono">
          <span className="text-2xl font-bold text-white leading-tight">
            ${coin.price.toLocaleString(undefined, { minimumFractionDigits: coin.price > 1 ? 2 : 6 })}
          </span>
          <div className={`text-xs font-bold flex items-center justify-start sm:justify-end mt-0.5 ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
            {isPositive ? (
              <ArrowUpRight className="w-4 h-4 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-4 h-4 mr-0.5" />
            )}
            <span>{isPositive ? '+' : ''}{coin.change24h.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {/* 2. STATS ROW GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-dark-900/40 border border-white/5 p-4 rounded-xl text-xs font-mono">
        <div>
          <div className="text-slate-500 font-semibold mb-1">Market Capitalization</div>
          <div className="text-slate-200 font-bold">
            ${coin.marketCap.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div>
          <div className="text-slate-500 font-semibold mb-1">24h Trading Volume</div>
          <div className="text-slate-200 font-bold">
            ${coin.volume24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div>
          <div className="text-slate-500 font-semibold mb-1">All-Time High (ATH)</div>
          <div className="text-emerald-400 font-bold">
            ${coin.ath.toLocaleString(undefined, { minimumFractionDigits: coin.ath > 1 ? 2 : 6 })}
          </div>
        </div>
        <div>
          <div className="text-slate-500 font-semibold mb-1">All-Time Low (ATL)</div>
          <div className="text-rose-400 font-bold">
            ${coin.atl.toLocaleString(undefined, { minimumFractionDigits: coin.atl > 1 ? 2 : 6 })}
          </div>
        </div>
      </div>

      {/* 3. RECHARTS HISTORICAL CHART AREA (2/3 width) & UTILITIES PANEL (1/3 width) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area */}
        <div className="glass-panel rounded-xl border border-white/5 p-5 lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="font-bold text-base text-white">Historical Market Rate</h3>
            
            {/* Time Filter Buttons */}
            <div className="flex bg-dark-900 border border-white/5 rounded-lg p-0.5 text-xs font-semibold self-stretch sm:self-auto">
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDays(opt.value)}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md transition-colors ${
                    days === opt.value
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Historical Chart Canvas */}
          <div className="h-[280px] w-full pt-4 relative select-none">
            {isChartLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-dark-950/20 backdrop-blur-sm z-10 rounded-lg">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <RechartsAreaChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="time"
                  stroke="rgba(255,255,255,0.15)"
                  tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.15)"
                  tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={false}
                  domain={['auto', 'auto']}
                  tickFormatter={(val) => `$${val.toLocaleString(undefined, { maximumFractionDigits: val > 1000 ? 0 : 2 })}`}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={isPositive ? '#10b981' : '#f43f5e'}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPrice)"
                />
              </RechartsAreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sidebar execution widgets */}
        <div className="space-y-6">
          {/* Watchlist Quick Toggle button info */}
          <div className="glass-panel rounded-xl border border-white/5 p-5 space-y-3.5">
            <h3 className="font-bold text-base text-white">Watchlist Watch</h3>
            <button
              onClick={() => toggleWatchlist(coin.symbol)}
              className={`w-full py-2.5 px-4 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                isWatched
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20'
                  : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
              }`}
            >
              <Star className={`w-4 h-4 ${isWatched ? 'fill-amber-400' : ''}`} />
              {isWatched ? 'Watching (Click to remove)' : 'Add to Watchlist'}
            </button>
          </div>

          {/* Alert Configuration */}
          <div className="glass-panel rounded-xl border border-white/5 p-5 space-y-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-400" />
              Set Price Alert
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 bg-dark-900 border border-white/5 rounded-lg p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => { setAlertDirection('ABOVE'); setAlertSuccess(''); }}
                  className={`py-1.5 rounded-md transition-all ${
                    alertDirection === 'ABOVE' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
                  }`}
                >
                  Goes Above
                </button>
                <button
                  type="button"
                  onClick={() => { setAlertDirection('BELOW'); setAlertSuccess(''); }}
                  className={`py-1.5 rounded-md transition-all ${
                    alertDirection === 'BELOW' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
                  }`}
                >
                  Goes Below
                </button>
              </div>

              <div className="relative">
                <input
                  type="number"
                  placeholder="Target Price Threshold"
                  value={alertPrice}
                  onChange={(e) => { setAlertPrice(e.target.value); setAlertSuccess(''); }}
                  className="w-full p-2.5 pr-12 text-xs glass-input focus:ring-1 focus:ring-indigo-500"
                />
                <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-xs font-bold font-mono text-slate-500">
                  USD
                </span>
              </div>

              {alertSuccess && <div className="text-[10px] text-emerald-400 font-semibold">{alertSuccess}</div>}

              <button
                onClick={handleSetAlert}
                className="w-full btn-premium-indigo text-xs py-2.5 font-bold rounded-lg flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Create Threshold Alert
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. EXECUTION PORTAL & TECHNICAL GAUGES GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Buy/Sell trading portal */}
        <div className="glass-panel rounded-xl border border-white/5 p-5 space-y-4">
          <h3 className="font-bold text-base text-white">Interactive Order Panel (Portfolio)</h3>
          
          <form onSubmit={handleTradeSubmit} className="space-y-4">
            {/* BUY/SELL Selector */}
            <div className="grid grid-cols-2 bg-dark-900 border border-white/5 rounded-lg p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setTradeType('BUY'); setTradeError(''); setTradeSuccess(''); }}
                className={`py-2 rounded-md transition-all ${
                  tradeType === 'BUY' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400'
                }`}
              >
                BUY
              </button>
              <button
                type="button"
                onClick={() => { setTradeType('SELL'); setTradeError(''); setTradeSuccess(''); }}
                className={`py-2 rounded-md transition-all ${
                  tradeType === 'SELL' ? 'bg-rose-600 text-white shadow' : 'text-slate-400'
                }`}
              >
                SELL
              </button>
            </div>

            {/* Balances details */}
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Cash Bal: <span className="text-white">${liveCash.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></span>
              <span>Holdings: <span className="text-white">{holdingAmount.toLocaleString()} {coin.symbol}</span></span>
            </div>

            {/* Input field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quantity</label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={tradeAmount}
                  onChange={(e) => { setTradeAmount(e.target.value); setTradeError(''); setTradeSuccess(''); }}
                  className="w-full p-2.5 pr-12 text-xs glass-input focus:ring-1 focus:ring-indigo-500"
                />
                <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[10px] font-bold text-slate-400">
                  {coin.symbol}
                </span>
              </div>
            </div>

            {/* Estimates block */}
            <div className="bg-white/5 border border-white/5 p-3 rounded-lg text-xs font-mono flex justify-between">
              <span className="text-slate-400">Est. total:</span>
              <span className="text-indigo-400 font-bold">${estCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>

            {tradeError && <div className="text-[10px] text-rose-400 font-semibold">{tradeError}</div>}
            {tradeSuccess && <div className="text-[10px] text-emerald-400 font-semibold">{tradeSuccess}</div>}

            <button
              type="submit"
              className={`w-full py-2.5 text-xs font-bold rounded-lg ${
                tradeType === 'BUY' ? 'btn-premium-emerald' : 'btn-premium-rose bg-rose-600 hover:bg-rose-500 text-white border border-rose-500/20'
              }`}
            >
              Confirm {tradeType === 'BUY' ? 'Buy Order' : 'Sell Order'}
            </button>
          </form>
        </div>

        {/* Technical Info Detail Summary Card */}
        <div className="glass-panel rounded-xl border border-white/5 p-5 flex flex-col justify-between space-y-4 lg:col-span-2">
          <div className="space-y-3">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Asset Metric & Summary
            </h3>
            
            {/* Description block */}
            <div className="text-xs text-slate-400 leading-relaxed max-h-[140px] overflow-y-auto pr-1">
              {coin.description ? coin.description : 'No description available for this digital asset.'}
            </div>
          </div>

          <div className="bg-white/5 p-4 rounded-xl border border-white/5 grid grid-cols-2 gap-4 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Circulating Supply:</span>
              <span className="text-slate-200 font-bold">
                {coin.circulatingSupply > 0
                  ? `${coin.circulatingSupply.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${coin.symbol}`
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Supply:</span>
              <span className="text-slate-200 font-bold">
                {coin.totalSupply > 0
                  ? `${coin.totalSupply.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${coin.symbol}`
                  : 'Infinite / N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
