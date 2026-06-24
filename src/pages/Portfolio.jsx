import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PortfolioAllocationChart } from '../components/Charts';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Minus, 
  DollarSign, 
  TrendingUp, 
  Activity,
  History
} from 'lucide-react';

export default function Portfolio() {
  const { coins, portfolio, handleBuy, handleSell, depositCash, withdrawCash } = useApp();

  // Transaction Terminal States
  const [txType, setTxType] = useState('BUY');
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [txAmount, setTxAmount] = useState('');
  const [txError, setTxError] = useState('');
  const [txSuccess, setTxSuccess] = useState('');

  // Cash Operations States
  const [cashAmount, setCashAmount] = useState('');
  const [cashError, setCashError] = useState('');

  // Fetch current live coin details helper
  const getCoinData = (symbol) => coins.find(c => c.symbol === symbol);

  // Compute live holdings metrics
  let totalHoldingsVal = 0;
  const holdingsWithMetrics = portfolio.holdings.map(h => {
    const liveCoin = getCoinData(h.symbol);
    const currentPrice = liveCoin ? liveCoin.price : 0;
    const value = h.amount * currentPrice;
    totalHoldingsVal += value;

    const totalCost = h.amount * h.avgBuyPrice;
    const profitVal = value - totalCost;
    const profitPct = totalCost === 0 ? 0 : (profitVal / totalCost) * 100;

    return {
      ...h,
      currentPrice,
      value,
      profitVal,
      profitPct
    };
  });

  const totalCapitalInvested = portfolio.holdings.reduce((sum, h) => sum + (h.amount * h.avgBuyPrice), 0);
  const totalProfitValue = totalHoldingsVal - totalCapitalInvested;
  const totalProfitPct = totalCapitalInvested === 0 ? 0 : (totalProfitValue / totalCapitalInvested) * 100;

  // Selected coin for buying/selling
  const activeCoinForTx = getCoinData(selectedSymbol);
  const estCost = txAmount && activeCoinForTx ? (parseFloat(txAmount) * activeCoinForTx.price) : 0;

  const handleTxSubmit = (e) => {
    e.preventDefault();
    setTxError('');
    setTxSuccess('');

    const amount = parseFloat(txAmount);
    if (!amount || amount <= 0) {
      setTxError('Please enter a valid amount.');
      return;
    }

    if (txType === 'BUY') {
      const cost = amount * activeCoinForTx.price;
      if (portfolio.cashUSD < cost) {
        setTxError('Insufficient cash balance.');
        return;
      }
      const ok = handleBuy(selectedSymbol, amount, cost);
      if (ok) {
        setTxSuccess(`Successfully purchased ${amount} ${selectedSymbol}!`);
        setTxAmount('');
      } else {
        setTxError('Purchase transaction failed.');
      }
    } else {
      const currentHolding = portfolio.holdings.find(h => h.symbol === selectedSymbol);
      if (!currentHolding || currentHolding.amount < amount) {
        setTxError(`Insufficient holdings of ${selectedSymbol}.`);
        return;
      }
      const proceeds = amount * activeCoinForTx.price;
      const ok = handleSell(selectedSymbol, amount, proceeds);
      if (ok) {
        setTxSuccess(`Successfully sold ${amount} ${selectedSymbol}!`);
        setTxAmount('');
      } else {
        setTxError('Sale transaction failed.');
      }
    }
  };

  const handleCashOperation = (action) => {
    setCashError('');
    const amount = parseFloat(cashAmount);
    if (!amount || amount <= 0) {
      setCashError('Please enter a valid amount.');
      return;
    }

    if (action === 'DEPOSIT') {
      depositCash(amount);
      setCashAmount('');
    } else {
      if (portfolio.cashUSD < amount) {
        setCashError('Insufficient funds to withdraw.');
        return;
      }
      withdrawCash(amount);
      setCashAmount('');
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div>
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-white tracking-tight">
          Asset Portfolio
        </h1>
        <p className="text-slate-400 text-xs mt-1">Manage balances, execute transactions, and audit allocation.</p>
      </div>

      {/* Main Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Allocation breakdown visual */}
        <div className="glass-panel rounded-xl border border-white/5 p-5 flex flex-col items-center justify-center space-y-4">
          <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider self-start">Asset Allocation</h3>
          <div className="py-2">
            <PortfolioAllocationChart 
              holdings={holdingsWithMetrics.map(h => ({ name: h.symbol, value: h.value }))} 
              size={180} 
            />
          </div>
          {/* Custom legends grid */}
          <div className="grid grid-cols-3 gap-2 w-full text-[10px] text-slate-400 font-mono">
            {holdingsWithMetrics.map((h, i) => (
              <div key={h.symbol} className="flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: ['#6366f1', '#10b981', '#06b6d4', '#f59e0b', '#8b5cf6'][i % 5] }} />
                <span>{h.symbol}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Portfolio Balance Audit Card */}
        <div className="glass-panel rounded-xl border border-white/5 p-5 flex flex-col justify-between space-y-4 md:col-span-2">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Net Net Worth</span>
              <h2 className="text-3xl font-extrabold text-white font-mono">${portfolio.balanceUSD.toLocaleString()}</h2>
            </div>
            <div className={`flex items-center text-xs font-bold px-2 py-1 rounded bg-white/5 border border-white/5 ${totalProfitValue >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {totalProfitValue >= 0 ? <ArrowUpRight className="w-4 h-4 mr-0.5" /> : <ArrowDownRight className="w-4 h-4 mr-0.5" />}
              <span>{totalProfitValue >= 0 ? '+' : ''}{totalProfitValue.toLocaleString(undefined, { maximumFractionDigits: 2 })} ({totalProfitPct.toFixed(2)}%)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-t border-b border-white/5 text-xs font-mono">
            <div>
              <div className="text-slate-500 font-semibold mb-1">Holdings Value</div>
              <div className="text-white font-bold">${totalHoldingsVal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            </div>
            <div>
              <div className="text-slate-500 font-semibold mb-1">Available Cash</div>
              <div className="text-white font-bold">${portfolio.cashUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            </div>
            <div>
              <div className="text-slate-500 font-semibold mb-1">Capital Invested</div>
              <div className="text-white font-bold">${totalCapitalInvested.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            </div>
            <div>
              <div className="text-slate-500 font-semibold mb-1">Total P&amp;L</div>
              <div className={`font-bold ${totalProfitValue >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ${totalProfitValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Cash Management Panel */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            <div className="relative w-full sm:flex-1">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
                <DollarSign className="w-4 h-4" />
              </span>
              <input
                type="number"
                placeholder="USD Amount"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2 text-xs glass-input focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={() => handleCashOperation('DEPOSIT')}
                className="flex-1 sm:flex-none btn-premium-emerald text-xs py-2 px-4 flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Deposit
              </button>
              <button 
                onClick={() => handleCashOperation('WITHDRAW')}
                className="flex-1 sm:flex-none btn-premium-dark text-xs py-2 px-4 flex items-center justify-center gap-1"
              >
                <Minus className="w-3.5 h-3.5" /> Withdraw
              </button>
            </div>
          </div>
          {cashError && <div className="text-[10px] text-rose-400 mt-1 font-semibold">{cashError}</div>}
        </div>
      </div>

      {/* Main ledger & transaction panel grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Holdings Table (2/3 width) */}
        <div className="glass-panel rounded-xl border border-white/5 p-5 lg:col-span-2 space-y-4">
          <h3 className="font-bold text-base text-white">Current Asset Ledger</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs font-mono text-left">
              <thead>
                <tr className="border-b border-white/5 text-slate-400 font-semibold uppercase tracking-wider pb-2">
                  <th className="pb-2">Asset</th>
                  <th className="pb-2 text-right">Holdings</th>
                  <th className="pb-2 text-right">Avg Buy Price</th>
                  <th className="pb-2 text-right">Current Price</th>
                  <th className="pb-2 text-right">Total Value</th>
                  <th className="pb-2 text-right">Profit / ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {holdingsWithMetrics.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500 font-sans">
                      Your ledger is currently empty. Buy crypto using the execution terminal.
                    </td>
                  </tr>
                ) : (
                  holdingsWithMetrics.map((h) => {
                    const isProfit = h.profitVal >= 0;
                    return (
                      <tr key={h.symbol} className="hover:bg-white/[0.01]">
                        <td className="py-3.5 font-bold text-white text-sm font-sans">{h.symbol}</td>
                        <td className="py-3.5 text-right font-bold text-slate-200">{h.amount.toLocaleString(undefined, { maximumFractionDigits: 5 })}</td>
                        <td className="py-3.5 text-right text-slate-400">${h.avgBuyPrice.toLocaleString()}</td>
                        <td className="py-3.5 text-right text-slate-200">${h.currentPrice.toLocaleString()}</td>
                        <td className="py-3.5 text-right font-bold text-slate-100">${h.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className={`py-3.5 text-right font-bold ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                          <div>${h.profitVal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                          <div className="text-[10px]">{isProfit ? '+' : ''}{h.profitPct.toFixed(2)}%</div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trade execution terminal (1/3 width) */}
        <div className="glass-panel rounded-xl border border-white/5 p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <h3 className="font-bold text-base text-white">Execution Terminal</h3>
            <p className="text-[11px] text-slate-400">Trade assets instantly against available cash.</p>
          </div>

          <form onSubmit={handleTxSubmit} className="space-y-4 flex-1">
            {/* BUY / SELL Switcher */}
            <div className="grid grid-cols-2 bg-dark-900 border border-white/5 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => { setTxType('BUY'); setTxError(''); setTxSuccess(''); }}
                className={`py-2 rounded-md font-bold transition-all ${
                  txType === 'BUY' 
                    ? 'bg-emerald-600 text-white shadow' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                BUY
              </button>
              <button
                type="button"
                onClick={() => { setTxType('SELL'); setTxError(''); setTxSuccess(''); }}
                className={`py-2 rounded-md font-bold transition-all ${
                  txType === 'SELL' 
                    ? 'bg-rose-600 text-white shadow' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                SELL
              </button>
            </div>

            {/* Coin Selector */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Asset Pair</label>
              <select
                value={selectedSymbol}
                onChange={(e) => { setSelectedSymbol(e.target.value); setTxError(''); setTxSuccess(''); }}
                className="w-full p-2.5 text-xs glass-input focus:ring-indigo-500 text-white"
              >
                {coins.map((c) => (
                  <option key={c.symbol} value={c.symbol} className="bg-dark-950 text-white">
                    {c.symbol} ({c.name}) - ${c.price.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount Input */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount</label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={txAmount}
                onChange={(e) => { setTxAmount(e.target.value); setTxError(''); setTxSuccess(''); }}
                className="w-full p-2.5 text-xs glass-input focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Estimates block */}
            {activeCoinForTx && (
              <div className="bg-white/5 border border-white/5 p-3 rounded-lg text-xs font-mono space-y-1.5 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-400">Live Price:</span>
                  <span className="text-white font-bold">${activeCoinForTx.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Est. Total Cost:</span>
                  <span className="text-indigo-400 font-bold">${estCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}

            {txError && <div className="text-[10px] text-rose-400 font-semibold">{txError}</div>}
            {txSuccess && <div className="text-[10px] text-emerald-400 font-semibold">{txSuccess}</div>}

            <button
              type="submit"
              className={`w-full py-2.5 text-xs font-bold rounded-lg transition-transform active:scale-[0.98] mt-2 ${
                txType === 'BUY' ? 'btn-premium-emerald' : 'btn-premium-rose bg-rose-600 hover:bg-rose-500 text-white border border-rose-500/20'
              }`}
            >
              Confirm {txType === 'BUY' ? 'Purchase' : 'Sale'}
            </button>
          </form>
        </div>
      </div>

      {/* 5. HISTORICAL TRANSACTION ARCHIVE */}
      <div className="glass-panel rounded-xl border border-white/5 p-5 space-y-4">
        <h3 className="font-bold text-base text-white flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-400" /> Transaction Logs Archive
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs font-mono text-left">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 font-semibold uppercase tracking-wider pb-2">
                <th className="pb-2">Transaction ID</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Asset</th>
                <th className="pb-2 text-right">Amount</th>
                <th className="pb-2 text-right">Price (USD)</th>
                <th className="pb-2 text-right">Executed Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {portfolio.transactions.map((tx) => {
                const isBuy = tx.type === 'BUY' || tx.type === 'DEPOSIT';
                return (
                  <tr key={tx.id} className="hover:bg-white/[0.01]">
                    <td className="py-3 text-slate-500">{tx.id}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tx.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' :
                        tx.type === 'SELL' ? 'bg-rose-500/10 text-rose-400' :
                        tx.type === 'DEPOSIT' ? 'bg-indigo-500/10 text-indigo-400' :
                        'bg-slate-500/10 text-slate-400'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-white">{tx.symbol}</td>
                    <td className="py-3 text-right font-bold text-slate-200">{tx.amount.toLocaleString()}</td>
                    <td className="py-3 text-right text-slate-300">${tx.price.toLocaleString()}</td>
                    <td className="py-3 text-right text-slate-400">{new Date(tx.date).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
