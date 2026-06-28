import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { apiRequest } from '../utils/api';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
  CartesianGrid
} from 'recharts';
import {
  Plus,
  Edit3,
  Trash2,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  Loader2,
  CheckCircle,
  X,
  FileText
} from 'lucide-react';

const CHART_COLORS = ['#6366f1', '#10b981', '#06b6d4', '#f59e0b', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6'];

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-2.5 rounded-lg border border-white/10 text-xs font-mono text-left">
        <p className="text-white font-bold">{payload[0].name}</p>
        <p className="text-indigo-400 font-bold">${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-2.5 rounded-lg border border-white/10 text-xs font-mono text-left space-y-1">
        <p className="text-white font-bold mb-1">{payload[0].payload.name}</p>
        {payload.map((entry, idx) => (
          <p key={idx} style={{ color: entry.color }} className="font-semibold">
            {entry.name}: ${entry.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Portfolio() {
  const { coins } = useApp();
  const [assets, setAssets] = useState([]);
  const [summary, setSummary] = useState({ totalInvested: 0, currentValue: 0, totalProfitValue: 0, totalRoi: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);

  // Form states
  const [addForm, setAddForm] = useState({
    coinId: '',
    coinName: '',
    symbol: '',
    coinImage: '',
    quantity: '',
    buyPrice: '',
    buyDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [editForm, setEditForm] = useState({
    quantity: '',
    buyPrice: '',
    buyDate: '',
    notes: ''
  });

  // Fetch portfolio assets from database
  const loadPortfolio = async () => {
    try {
      setIsLoading(true);
      const res = await apiRequest('/portfolio-assets');
      if (res.success && res.data) {
        setAssets(res.data.assets || []);
        setSummary(res.data.summary || { totalInvested: 0, currentValue: 0, totalProfitValue: 0, totalRoi: 0 });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load portfolio assets.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handle = setTimeout(() => {
      loadPortfolio();
    }, 0);
    return () => clearTimeout(handle);
  }, []);

  // Set default details in form when coin dropdown selection changes
  const handleCoinSelectChange = (e) => {
    const selectedCoinId = e.target.value;
    const coin = coins.find(c => c.id === selectedCoinId);
    if (coin) {
      setAddForm(prev => ({
        ...prev,
        coinId: selectedCoinId,
        coinName: coin.name,
        symbol: coin.symbol,
        coinImage: coin.image,
        buyPrice: coin.price
      }));
    } else {
      setAddForm(prev => ({
        ...prev,
        coinId: '',
        coinName: '',
        symbol: '',
        coinImage: '',
        buyPrice: ''
      }));
    }
  };

  // Add Asset Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await apiRequest('/portfolio-assets', {
        method: 'POST',
        body: addForm
      });
      if (res.success) {
        setSuccessMessage('Asset added successfully!');
        setIsAddOpen(false);
        // Reset form
        setAddForm({
          coinId: '',
          coinName: '',
          symbol: '',
          coinImage: '',
          quantity: '',
          buyPrice: '',
          buyDate: new Date().toISOString().split('T')[0],
          notes: ''
        });
        loadPortfolio();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to add asset.');
    }
  };

  // Edit Asset Trigger
  const openEditModal = (asset) => {
    setEditingAsset(asset);
    setEditForm({
      quantity: asset.quantity.toString(),
      buyPrice: asset.buyPrice.toString(),
      buyDate: asset.buyDate ? asset.buyDate.split('T')[0] : new Date().toISOString().split('T')[0],
      notes: asset.notes || ''
    });
    setIsEditOpen(true);
  };

  // Edit Asset Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await apiRequest(`/portfolio-assets/${editingAsset._id}`, {
        method: 'PUT',
        body: editForm
      });
      if (res.success) {
        setSuccessMessage('Asset updated successfully!');
        setIsEditOpen(false);
        setEditingAsset(null);
        loadPortfolio();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update asset.');
    }
  };

  // Delete Asset Entry
  const handleDeleteAsset = async (assetId) => {
    if (!window.confirm('Are you sure you want to delete this asset entry?')) return;
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await apiRequest(`/portfolio-assets/${assetId}`, {
        method: 'DELETE'
      });
      if (res.success) {
        setSuccessMessage('Asset entry deleted successfully.');
        loadPortfolio();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to delete asset.');
    }
  };

  // Setup Pie Chart Data
  const pieData = assets.map(a => ({
    name: a.symbol,
    value: a.currentValue
  })).sort((a, b) => b.value - a.value);

  // Setup Bar Chart Data
  const barData = assets.map(a => ({
    name: a.symbol,
    'Invested (USD)': a.totalInvested,
    'Current Value (USD)': a.currentValue
  }));

  const isProfit = summary.totalProfitValue >= 0;

  return (
    <div className="space-y-6 text-left relative">
      {/* Notifications Toast */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-lg flex items-center gap-2 shadow-2xl backdrop-blur-md">
          <CheckCircle className="w-4.5 h-4.5" />
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="ml-2 hover:text-white"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-3 rounded-lg flex items-center gap-2 shadow-2xl backdrop-blur-md">
          <AlertTriangle className="w-4.5 h-4.5" />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="ml-2 hover:text-white"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-white tracking-tight">
            Portfolio Management
          </h1>
          <p className="text-slate-400 text-xs mt-1">Audit multi-asset ledgers, evaluate cost basis, and track live ROI metrics.</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="btn-premium-indigo text-xs py-2.5 px-4 flex items-center justify-center gap-1.5 self-start sm:self-auto font-bold"
        >
          <Plus className="w-4 h-4" /> Add Asset Entry
        </button>
      </div>

      {isLoading && assets.length === 0 ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-slate-400 text-xs">Querying asset balances and live prices...</p>
        </div>
      ) : (
        <>
          {/* Main KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Net Value */}
            <div className="glass-panel rounded-xl border border-white/5 p-5 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Net Portfolio Value</span>
              <h2 className="text-2xl font-extrabold text-white font-mono mt-1.5">${summary.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
              <span className="text-[10px] text-slate-400 mt-1 block">Live assets valuation</span>
            </div>

            {/* Total Invested */}
            <div className="glass-panel rounded-xl border border-white/5 p-5 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Invested Cost</span>
              <h2 className="text-2xl font-extrabold text-white font-mono mt-1.5">${summary.totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
              <span className="text-[10px] text-slate-400 mt-1 block">Cumulative purchase basis</span>
            </div>

            {/* Total Profit/Loss */}
            <div className="glass-panel rounded-xl border border-white/5 p-5 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Profit / Loss</span>
              <h2 className={`text-2xl font-extrabold font-mono mt-1.5 ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isProfit ? '+' : ''}${summary.totalProfitValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h2>
              <span className={`text-[10px] font-bold flex items-center gap-1 mt-1 ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                {isProfit ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span>{isProfit ? 'Bullish gain' : 'Net drawdown'}</span>
              </span>
            </div>

            {/* ROI */}
            <div className="glass-panel rounded-xl border border-white/5 p-5 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">ROI Percentage</span>
              <h2 className={`text-2xl font-extrabold font-mono mt-1.5 ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isProfit ? '+' : ''}{summary.totalRoi.toFixed(2)}%
              </h2>
              <span className="text-[10px] text-slate-400 mt-1 block">Return on Investment</span>
            </div>
          </div>

          {assets.length > 0 && (
            /* Visual Charts Section */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Asset Allocation Pie (1/3 width) */}
              <div className="glass-panel rounded-xl border border-white/5 p-5 flex flex-col items-center justify-between space-y-4">
                <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider self-start">Asset Allocation</h3>
                <div className="h-[200px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom Legend */}
                <div className="grid grid-cols-3 gap-2 w-full text-[10px] text-slate-400 font-mono pt-1">
                  {pieData.slice(0, 6).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Comparison (2/3 width) */}
              <div className="glass-panel rounded-xl border border-white/5 p-5 lg:col-span-2 space-y-4 flex flex-col justify-between">
                <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider">Invested Capital vs Current Valuation</h3>
                <div className="h-[220px] w-full pt-1 select-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace' }} />
                      <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace' }} domain={[0, 'auto']} />
                      <RechartsTooltip content={<CustomBarTooltip />} />
                      <Legend tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Bar dataKey="Invested (USD)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Current Value (USD)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Ledger Table */}
          <div className="glass-panel rounded-xl border border-white/5 p-5 space-y-4">
            <h3 className="font-bold text-base text-white">Active Holdings Ledger</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs font-mono text-left">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400 font-semibold uppercase tracking-wider pb-2">
                    <th className="pb-2">Asset</th>
                    <th className="pb-2 text-right">Quantity</th>
                    <th className="pb-2 text-right">Cost Price</th>
                    <th className="pb-2 text-right">Live Price</th>
                    <th className="pb-2 text-right">Invested Basis</th>
                    <th className="pb-2 text-right">Current Value</th>
                    <th className="pb-2 text-right">Profit / ROI</th>
                    <th className="pb-2 text-center w-16">Edit</th>
                    <th className="pb-2 text-center w-16">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {assets.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-12 text-center text-slate-500 font-sans">
                        Your custom portfolio ledger is empty. Click 'Add Asset Entry' above to document custom purchases.
                      </td>
                    </tr>
                  ) : (
                    assets.map((a) => {
                      const isProfitVal = a.profitValue >= 0;
                      return (
                        <tr key={a._id} className="hover:bg-white/[0.01]">
                          <td className="py-3.5 font-sans">
                            <div className="flex items-center gap-2">
                              {a.coinImage && (
                                <img src={a.coinImage} alt={a.symbol} className="w-5 h-5 rounded-full object-cover" />
                              )}
                              <div>
                                <span className="font-bold text-white block leading-tight">{a.symbol}</span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">{a.coinName}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 text-right font-bold text-slate-200">{a.quantity.toLocaleString(undefined, { maximumFractionDigits: 5 })}</td>
                          <td className="py-3.5 text-right text-slate-400">${a.buyPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="py-3.5 text-right text-slate-200">${a.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="py-3.5 text-right text-slate-400">${a.totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="py-3.5 text-right font-bold text-slate-100">${a.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className={`py-3.5 text-right font-bold ${isProfitVal ? 'text-emerald-500' : 'text-rose-500'}`}>
                            <div>{isProfitVal ? '+' : ''}${a.profitValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            <div className="text-[10px]">{isProfitVal ? '+' : ''}{a.roi.toFixed(2)}%</div>
                          </td>
                          <td className="py-3.5 text-center">
                            <button
                              onClick={() => openEditModal(a)}
                              className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-indigo-400 transition-colors"
                            >
                              <Edit3 className="w-4 h-4 mx-auto" />
                            </button>
                          </td>
                          <td className="py-3.5 text-center">
                            <button
                              onClick={() => handleDeleteAsset(a._id)}
                              className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Add Asset Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md glass-panel rounded-2xl border border-white/10 p-6 space-y-4 shadow-3xl text-left">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="font-bold text-lg text-white">Add Asset Purchase</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              {/* Coin Select */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cryptocurrency</label>
                <select
                  required
                  value={addForm.coinId}
                  onChange={handleCoinSelectChange}
                  className="w-full p-2.5 text-xs glass-input text-white focus:ring-indigo-500"
                >
                  <option value="" className="bg-dark-950 text-slate-500">-- Select Cryptocurrency --</option>
                  {coins.map((c) => (
                    <option key={c.id} value={c.id} className="bg-dark-950 text-white">
                      {c.symbol} ({c.name}) - ${c.price.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quantity</label>
                <input
                  required
                  type="number"
                  step="any"
                  min="0.00000001"
                  placeholder="0.00"
                  value={addForm.quantity}
                  onChange={(e) => setAddForm({ ...addForm, quantity: e.target.value })}
                  className="w-full p-2.5 text-xs glass-input focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              {/* Buy Price */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Purchase Price (USD per Unit)</label>
                <input
                  required
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={addForm.buyPrice}
                  onChange={(e) => setAddForm({ ...addForm, buyPrice: e.target.value })}
                  className="w-full p-2.5 text-xs glass-input focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              {/* Buy Date */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Purchase Date
                </label>
                <input
                  required
                  type="date"
                  value={addForm.buyDate}
                  onChange={(e) => setAddForm({ ...addForm, buyDate: e.target.value })}
                  className="w-full p-2.5 text-xs glass-input focus:ring-1 focus:ring-indigo-500 text-white font-sans"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" /> Transaction Notes
                </label>
                <textarea
                  placeholder="Add exchange details, block explorer tx hash, or reference labels..."
                  rows={2}
                  value={addForm.notes}
                  onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                  className="w-full p-2.5 text-xs glass-input focus:ring-1 focus:ring-indigo-500 font-sans"
                />
              </div>

              <button
                type="submit"
                className="w-full btn-premium-indigo text-xs py-3 flex items-center justify-center gap-1.5 font-bold mt-2"
              >
                <Plus className="w-4 h-4" /> Add Asset purchase
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Asset Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md glass-panel rounded-2xl border border-white/10 p-6 space-y-4 shadow-3xl text-left">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <h3 className="font-bold text-lg text-white">Edit Asset purchase</h3>
                <span className="text-[10px] text-indigo-400 font-bold uppercase font-mono mt-0.5 block">{editingAsset?.symbol} - {editingAsset?.coinName}</span>
              </div>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Quantity */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quantity</label>
                <input
                  required
                  type="number"
                  step="any"
                  min="0.00000001"
                  placeholder="0.00"
                  value={editForm.quantity}
                  onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                  className="w-full p-2.5 text-xs glass-input focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              {/* Buy Price */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Purchase Price (USD per Unit)</label>
                <input
                  required
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={editForm.buyPrice}
                  onChange={(e) => setEditForm({ ...editForm, buyPrice: e.target.value })}
                  className="w-full p-2.5 text-xs glass-input focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              {/* Buy Date */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Purchase Date
                </label>
                <input
                  required
                  type="date"
                  value={editForm.buyDate}
                  onChange={(e) => setEditForm({ ...editForm, buyDate: e.target.value })}
                  className="w-full p-2.5 text-xs glass-input focus:ring-1 focus:ring-indigo-500 text-white font-sans"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" /> Transaction Notes
                </label>
                <textarea
                  placeholder="Notes..."
                  rows={2}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full p-2.5 text-xs glass-input focus:ring-1 focus:ring-indigo-500 font-sans"
                />
              </div>

              <button
                type="submit"
                className="w-full btn-premium-indigo text-xs py-3 flex items-center justify-center gap-1.5 font-bold mt-2"
              >
                <Edit3 className="w-4 h-4" /> Save changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
