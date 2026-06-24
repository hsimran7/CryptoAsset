import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CandlestickChart } from '../components/Charts';
import { 
  Star, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldCheck, 
  TrendingUp, 
  DollarSign, 
  Compass,
  Briefcase
} from 'lucide-react';

export default function CoinDetails() {
  const { coinId } = useParams();
  const { coins, watchlist, toggleWatchlist, portfolio, handleBuy, handleSell } = useApp();

  // Order Book state
  const [bids, setBids] = useState([]);
  const [asks, setAsks] = useState([]);

  // Trading form states
  const [tradeType, setTradeType] = useState('BUY');
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeSuccess, setTradeSuccess] = useState('');
  const [tradeError, setTradeError] = useState('');

  const coin = coins.find(c => c.id === coinId);

  // Generate mock Order Book depth walls
  useEffect(() => {
    if (!coin) return;
    
    const generateOrderBook = () => {
      const basePrice = coin.price;
      const newBids = [];
      const newAsks = [];

      for (let i = 1; i <= 5; i++) {
        // bids are slightly lower than current price
        const bidPrice = basePrice * (1 - (i * 0.0008));
        const bidSize = Math.random() * 3.5 + 0.1;
        newBids.push({ price: bidPrice, size: bidSize, total: bidSize * bidPrice });

        // asks are slightly higher than current price
        const askPrice = basePrice * (1 + (i * 0.0008));
        const askSize = Math.random() * 3.5 + 0.1;
        newAsks.push({ price: askPrice, size: askSize, total: askSize * askPrice });
      }

      setBids(newBids);
      setAsks(newAsks.reverse());
    };

    generateOrderBook();
    const interval = setInterval(generateOrderBook, 4000);
    return () => clearInterval(interval);
  }, [coin]);

  if (!coin) {
    return (
      <div className="glass-panel rounded-xl border border-white/5 p-12 text-center max-w-xl mx-auto space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/10 flex items-center justify-center mx-auto">
          <Compass className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-white text-base">Asset Not Found</h3>
          <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
            The cryptocurrency you are trying to view does not exist in our database.
          </p>
        </div>
        <Link to="/market" className="btn-premium-indigo text-xs py-2 px-5 inline-block font-semibold">
          Return to Market Screener
        </Link>
      </div>
    );
  }

  const isWatched = watchlist.includes(coin.symbol);
  const isPositive = coin.change24h >= 0;

  // Generate high fidelity Candle coordinate mock datasets
  const generateCandleData = () => {
    const base = coin.price;
    const labels = ['04:00', '08:00', '12:00', '16:00', '20:00', '00:00', 'Live'];
    
    // Simulate OHLC coordinate data
    return labels.map((lbl, idx) => {
      const scale = 1 + (Math.sin(idx) * 0.012);
      const open = base * scale;
      const close = base * scale * (1 + (Math.random() * 0.01 - 0.005));
      const high = Math.max(open, close) * (1 + (Math.random() * 0.004));
      const low = Math.min(open, close) * (1 - (Math.random() * 0.004));
      return { label: lbl, open, high, low, close };
    });
  };

  const candleData = generateCandleData();

  // Trading math
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

  return (
    <div className="space-y-6 text-left">
      {/* 1. COIN DETAILS HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="font-display font-extrabold text-2xl md:text-3xl text-white tracking-tight">
                {coin.name}
              </h1>
              <span className="text-slate-400 font-mono font-bold text-base">({coin.symbol}/USD)</span>
              <button 
                onClick={() => toggleWatchlist(coin.symbol)}
                className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-amber-400 transition-colors ml-1"
              >
                <Star className={`w-5 h-5 ${isWatched ? 'fill-amber-400 text-amber-400' : ''}`} />
              </button>
            </div>
            <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2.5 py-0.5 rounded font-semibold capitalize font-sans block w-fit">
              Sector: {coin.category}
            </span>
          </div>
        </div>

        {/* Live Prices summary block */}
        <div className="flex flex-col sm:text-right font-mono">
          <span className="text-2xl font-bold text-white leading-tight">
            ${coin.price.toLocaleString(undefined, { minimumFractionDigits: coin.price > 1 ? 2 : 5 })}
          </span>
          <div className={`text-xs font-bold flex items-center justify-start sm:justify-end mt-0.5 ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
            {isPositive ? <ArrowUpRight className="w-4 h-4 mr-0.5" /> : <ArrowDownRight className="w-4 h-4 mr-0.5" />}
            <span>{isPositive ? '+' : ''}{coin.change24h}%</span>
          </div>
        </div>
      </div>

      {/* 2. STATS ROW GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-dark-900/40 border border-white/5 p-4 rounded-xl text-xs font-mono">
        <div>
          <div className="text-slate-500 font-semibold mb-1">Market Capitalization</div>
          <div className="text-slate-200 font-bold">${coin.marketCap.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-slate-500 font-semibold mb-1">24 Hour Trading Volume</div>
          <div className="text-slate-200 font-bold">${coin.volume24h.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-slate-500 font-semibold mb-1">24h High Limit</div>
          <div className="text-emerald-400 font-bold">${coin.high24h.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-slate-500 font-semibold mb-1">24h Low Limit</div>
          <div className="text-rose-400 font-bold">${coin.low24h.toLocaleString()}</div>
        </div>
      </div>

      {/* 3. CANDLESTICK CHART & ORDER BOOK TERM GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main interactive Candlestick view (2/3 width) */}
        <div className="glass-panel rounded-xl border border-white/5 p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-white">OHLC Candlestick Feed</h3>
            <span className="text-[10px] text-slate-400 font-semibold bg-white/5 px-2 py-0.5 rounded">4H INTERVAL</span>
          </div>
          <div className="pt-2">
            <CandlestickChart data={candleData} height={260} />
          </div>
        </div>

        {/* Order Book Depth panel (1/3 width) */}
        <div className="glass-panel rounded-xl border border-white/5 p-5 flex flex-col justify-between space-y-4">
          <h3 className="font-bold text-base text-white">Order Book Depth</h3>
          
          <div className="space-y-4 flex-1 pt-1 font-mono text-[10px]">
            {/* Ask Orders (Red list, top down) */}
            <div className="space-y-1 text-rose-400">
              <div className="grid grid-cols-3 text-slate-500 font-semibold font-sans mb-1 uppercase text-[9px]">
                <span>Price (USD)</span>
                <span className="text-right">Size ({coin.symbol})</span>
                <span className="text-right">Total (USD)</span>
              </div>
              {asks.map((ask, idx) => (
                <div key={idx} className="grid grid-cols-3 hover:bg-rose-500/5 py-0.5 rounded">
                  <span>${ask.price.toLocaleString(undefined, { minimumFractionDigits: coin.price > 1 ? 2 : 4 })}</span>
                  <span className="text-right text-slate-300">{ask.size.toFixed(4)}</span>
                  <span className="text-right text-slate-300">${ask.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              ))}
            </div>

            {/* Spread Bar */}
            <div className="border-t border-b border-white/5 py-2.5 flex items-center justify-between text-xs">
              <span className="text-slate-400">Spread:</span>
              <span className="text-white font-bold">${coin.price.toLocaleString()}</span>
            </div>

            {/* Bid Orders (Green list, top down) */}
            <div className="space-y-1 text-emerald-400">
              {bids.map((bid, idx) => (
                <div key={idx} className="grid grid-cols-3 hover:bg-emerald-500/5 py-0.5 rounded">
                  <span>${bid.price.toLocaleString(undefined, { minimumFractionDigits: coin.price > 1 ? 2 : 4 })}</span>
                  <span className="text-right text-slate-300">{bid.size.toFixed(4)}</span>
                  <span className="text-right text-slate-300">${bid.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. EXECUTION PORTAL & TECHNICAL GAUGES GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Buy/Sell trading portal */}
        <div className="glass-panel rounded-xl border border-white/5 p-5 space-y-4">
          <h3 className="font-bold text-base text-white">Interactive Order Panel</h3>
          
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

        {/* Technical Gauge Panel */}
        <div className="glass-panel rounded-xl border border-white/5 p-5 flex flex-col justify-between space-y-4">
          <h3 className="font-bold text-base text-white">Technical Gauges</h3>
          
          <div className="bg-dark-900/50 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center space-y-3 flex-1">
            <span className="text-[10px] text-slate-500 font-mono tracking-wider font-semibold uppercase">Indicator Verdict</span>
            
            {/* Big Verdict Dial Mockup */}
            <div className="relative w-28 h-28 rounded-full border-4 border-dashed border-indigo-500/20 flex flex-col items-center justify-center">
              <TrendingUp className="w-7 h-7 text-indigo-400 mb-1" />
              <span className="text-sm font-black text-indigo-400">STRONG BUY</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-[10px] font-mono text-center w-full pt-2">
              <div>
                <div className="text-rose-400 font-bold">1</div>
                <div className="text-slate-500">Sell</div>
              </div>
              <div>
                <div className="text-slate-300 font-bold">10</div>
                <div className="text-slate-500">Neutral</div>
              </div>
              <div>
                <div className="text-emerald-400 font-bold">15</div>
                <div className="text-slate-500">Buy</div>
              </div>
            </div>
          </div>
        </div>

        {/* Information Summary Card */}
        <div className="glass-panel rounded-xl border border-white/5 p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <h3 className="font-bold text-base text-white">Asset Summary</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {coin.desc}
            </p>
          </div>

          <div className="bg-white/5 p-3 rounded-lg border border-white/5 space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Circulating Supply:</span>
              <span className="text-slate-200 font-bold">{coin.supply.toLocaleString()} {coin.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Audit Status:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Verified
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
