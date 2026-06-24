import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Bell, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Plus, 
  AlertCircle,
  Activity,
  CheckCircle2
} from 'lucide-react';

export default function Alerts() {
  const { coins, alerts, notifications, addAlert, deleteAlert, toggleAlertStatus } = useApp();
  
  // Quick prefill from search queries (e.g. /alerts?symbol=BTC)
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialSymbol = queryParams.get('symbol') || 'BTC';

  const [symbol, setSymbol] = useState(initialSymbol);
  const [condition, setCondition] = useState('ABOVE');
  const [targetValue, setTargetValue] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const symbolParam = queryParams.get('symbol');
    if (symbolParam) {
      setSymbol(symbolParam);
    }
  }, [location.search]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const value = parseFloat(targetValue);
    if (!value || value <= 0) {
      setError('Please enter a valid price threshold.');
      return;
    }

    addAlert(symbol, condition, value);
    setSuccess(`Alert created successfully for ${symbol} ${condition.toLowerCase()} $${value.toLocaleString()}!`);
    setTargetValue('');
  };

  // Filter triggered alerts from context notifications list
  const alertLogs = notifications.filter(n => n.type === 'alert');

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div>
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-white tracking-tight">
          Price Alerts Console
        </h1>
        <p className="text-slate-400 text-xs mt-1">Configure threshold trackers to prompt desktop notices upon price triggers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Alert Panel (1/3 width) */}
        <div className="glass-panel rounded-xl border border-white/5 p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <h3 className="font-bold text-base text-white">Create Target Tracker</h3>
            <p className="text-[11px] text-slate-400">Establish pricing limits for immediate warning notices.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 flex-1 pt-2">
            {/* Symbol Select */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cryptocurrency</label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full p-2.5 text-xs glass-input text-white focus:ring-indigo-500"
              >
                {coins.map((c) => (
                  <option key={c.symbol} value={c.symbol} className="bg-dark-950 text-white">
                    {c.symbol} - ${c.price.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            {/* Condition Select */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Trigger Condition</label>
              <div className="grid grid-cols-2 bg-dark-900 border border-white/5 rounded-lg p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setCondition('ABOVE')}
                  className={`py-2 rounded-md transition-all ${
                    condition === 'ABOVE' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  GOES ABOVE
                </button>
                <button
                  type="button"
                  onClick={() => setCondition('BELOW')}
                  className={`py-2 rounded-md transition-all ${
                    condition === 'BELOW' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  GOES BELOW
                </button>
              </div>
            </div>

            {/* Target Value Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Price (USD)</label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0.00"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full p-2.5 text-xs glass-input focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {error && <div className="text-[10px] text-rose-400 font-semibold">{error}</div>}
            {success && <div className="text-[10px] text-emerald-400 font-semibold">{success}</div>}

            <button
              type="submit"
              className="w-full btn-premium-indigo text-xs py-2.5 flex items-center justify-center gap-1.5 font-bold mt-2"
            >
              <Plus className="w-4 h-4" /> Create Alert Rule
            </button>
          </form>
        </div>

        {/* Alerts List panel (2/3 width) */}
        <div className="glass-panel rounded-xl border border-white/5 p-5 lg:col-span-2 space-y-4">
          <h3 className="font-bold text-base text-white">Active Alert Lists</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs font-mono text-left">
              <thead>
                <tr className="border-b border-white/5 text-slate-400 font-semibold uppercase tracking-wider pb-2">
                  <th className="pb-2">Asset Pair</th>
                  <th className="pb-2">Trigger Limit</th>
                  <th className="pb-2 text-right">Created Date</th>
                  <th className="pb-2 text-center">Active Status</th>
                  <th className="pb-2 text-center">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {alerts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-500 font-sans">
                      No price trackers active. Populate rules using the left configuration card.
                    </td>
                  </tr>
                ) : (
                  alerts.map((a) => (
                    <tr key={a.id} className="hover:bg-white/[0.01]">
                      <td className="py-3.5 font-bold text-white text-sm font-sans">{a.symbol}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          a.type === 'ABOVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {a.type} ${a.value.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3.5 text-right text-slate-400">{new Date(a.createdAt).toLocaleDateString()}</td>
                      <td className="py-3.5 text-center">
                        <button
                          onClick={() => toggleAlertStatus(a.id)}
                          className="text-slate-400 hover:text-white transition-colors"
                        >
                          {a.isActive ? (
                            <ToggleRight className="w-6 h-6 text-indigo-400 mx-auto" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-slate-600 mx-auto" />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 text-center">
                        <button
                          onClick={() => deleteAlert(a.id)}
                          className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. TRIGGERED HISTORY LOG */}
      <div className="glass-panel rounded-xl border border-white/5 p-5 space-y-4">
        <h3 className="font-bold text-base text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400" /> Triggered Warnings History
        </h3>
        <div className="space-y-2.5">
          {alertLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">No warning triggers recorded yet.</div>
          ) : (
            alertLogs.map((log) => (
              <div 
                key={log.id} 
                className="bg-white/5 border border-white/5 p-3 rounded-lg flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/10 flex items-center justify-center text-rose-400 flex-shrink-0">
                    <AlertCircle className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">{log.title}</span>
                    <p className="text-[10px] text-slate-400 leading-normal mt-0.5">{log.message}</p>
                  </div>
                </div>
                <span className="text-[9px] text-slate-500 whitespace-nowrap">{log.time}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
