import React, { useState, useCallback } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import {
  GitCompare, Sparkles, Search,
  CheckCircle, TrendingUp, ShieldAlert,
  AlertTriangle, Zap, BarChart3, ArrowRight,
  Info, RefreshCw, ChevronDown
} from 'lucide-react';

const API   = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;
const token = () => localStorage.getItem('cv_token');

/* ─── Popular coin presets ────────────────────────────── */
const POPULAR_COINS = [
  { id: 'bitcoin',      name: 'Bitcoin',   symbol: 'BTC', color: '#f7931a' },
  { id: 'ethereum',     name: 'Ethereum',  symbol: 'ETH', color: '#627eea' },
  { id: 'solana',       name: 'Solana',    symbol: 'SOL', color: '#9945ff' },
  { id: 'binancecoin',  name: 'BNB',       symbol: 'BNB', color: '#f3ba2f' },
  { id: 'cardano',      name: 'Cardano',   symbol: 'ADA', color: '#0d1e6e' },
  { id: 'ripple',       name: 'XRP',       symbol: 'XRP', color: '#346aa9' },
  { id: 'dogecoin',     name: 'Dogecoin',  symbol: 'DOGE',color: '#c2a633' },
  { id: 'avalanche-2',  name: 'Avalanche', symbol: 'AVAX',color: '#e84142' },
  { id: 'polkadot',     name: 'Polkadot',  symbol: 'DOT', color: '#e6007a' },
  { id: 'chainlink',    name: 'Chainlink', symbol: 'LINK',color: '#375bd2' },
];

/* ─── Helpers ─────────────────────────────────────────── */
const fmt  = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2 }).format(n);
const fmtP = (n) => `${n >= 0 ? '+' : ''}${parseFloat(n).toFixed(2)}%`;
const isPos = (v) => parseFloat(v) >= 0;

/* ─── Coin Selector ───────────────────────────────────── */
function CoinSelector({ label, selected, onSelect, otherSelectedId }) {
  const [query, setQuery] = useState('');
  const [open,  setOpen]  = useState(false);

  const filtered = POPULAR_COINS.filter(c =>
    c.id !== otherSelectedId &&
    (c.name.toLowerCase().includes(query.toLowerCase()) ||
     c.symbol.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="relative flex-1 min-w-0">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</p>
      <button
        id={`coin-selector-${label.replace(/\s/g, '-').toLowerCase()}`}
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border transition-all ${
          selected
            ? 'border-white/10 bg-white/[0.04] hover:border-white/20'
            : 'border-dashed border-white/15 hover:border-white/25 bg-transparent'
        }`}
      >
        {selected ? (
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-extrabold flex-shrink-0"
              style={{ background: (POPULAR_COINS.find(c => c.id === selected.id)?.color || '#6366f1') + '30',
                       border: `1.5px solid ${POPULAR_COINS.find(c => c.id === selected.id)?.color || '#6366f1'}60` }}>
              {selected.symbol?.slice(0, 3)}
            </span>
            <div className="text-left min-w-0">
              <p className="text-sm font-bold text-white truncate">{selected.name}</p>
              <p className="text-[10px] text-slate-500">{selected.symbol}</p>
            </div>
          </div>
        ) : (
          <span className="text-sm text-slate-500 flex items-center gap-2">
            <Search className="w-4 h-4" /> Select a coin…
          </span>
        )}
        <ChevronDown className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-dark-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-white/5">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search coins…"
              className="w-full bg-transparent text-xs text-white placeholder-slate-600 outline-none px-2 py-1.5"
              autoFocus
            />
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="text-[11px] text-slate-600 text-center py-4">No coins found</p>
            ) : filtered.map(c => (
              <button
                key={c.id}
                onClick={() => { onSelect(c); setOpen(false); setQuery(''); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.04] transition-colors"
              >
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                  style={{ background: c.color + '30', border: `1.5px solid ${c.color}60` }}>
                  {c.symbol.slice(0, 3)}
                </span>
                <div>
                  <p className="text-xs font-bold text-white">{c.name}</p>
                  <p className="text-[10px] text-slate-500">{c.symbol}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Summary Table Row ───────────────────────────────── */
function TableRow({ row, i }) {
  const isChange = row.metric.includes('Change') || row.metric.includes('change');
  const highlight = (val) => {
    if (!isChange) return 'text-slate-200';
    return isPos(val.replace('%','')) ? 'text-emerald-400' : 'text-rose-400';
  };

  return (
    <tr className={`border-b border-white/[0.04] ${i % 2 === 0 ? '' : 'bg-white/[0.015]'} hover:bg-white/[0.03] transition-colors`}>
      <td className="py-2.5 px-4 text-[11px] text-slate-500 font-semibold">{row.metric}</td>
      <td className={`py-2.5 px-4 text-[11px] font-bold text-center ${highlight(row.coinA)}`}>{row.coinA}</td>
      <td className={`py-2.5 px-4 text-[11px] font-bold text-center ${highlight(row.coinB)}`}>{row.coinB}</td>
    </tr>
  );
}

/* ─── Pros/Cons card ──────────────────────────────────── */
function ProsConsCard({ coin, pros, cons, color }) {
  return (
    <div className="glass-panel rounded-2xl border border-white/5 p-5 space-y-4">
      {/* Coin header */}
      <div className="flex items-center gap-3">
        <span className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-extrabold"
          style={{ background: color + '25', border: `1.5px solid ${color}50` }}>
          {coin.symbol?.slice(0, 3)}
        </span>
        <div>
          <p className="text-sm font-extrabold text-white">{coin.name}</p>
          <p className="text-[10px] text-slate-500">{coin.symbol} · Rank #{coin.rank}</p>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/5">
        <div className="text-center">
          <p className="text-[9px] text-slate-500 uppercase tracking-wider">Price</p>
          <p className="text-xs font-bold text-white mt-0.5">{fmt(coin.price)}</p>
        </div>
        <div className="text-center border-x border-white/5">
          <p className="text-[9px] text-slate-500 uppercase tracking-wider">Mkt Cap</p>
          <p className="text-xs font-bold text-white mt-0.5">{fmt(coin.marketCap)}</p>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-slate-500 uppercase tracking-wider">24h</p>
          <p className={`text-xs font-bold mt-0.5 ${coin.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {fmtP(coin.change24h)}
          </p>
        </div>
      </div>

      {/* Pros */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
          <CheckCircle className="w-3 h-3" /> Strengths
        </p>
        <ul className="space-y-1.5">
          {pros.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px] text-slate-300 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />{p}
            </li>
          ))}
        </ul>
      </div>

      {/* Cons */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3" /> Considerations
        </p>
        <ul className="space-y-1.5">
          {cons.map((c, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px] text-slate-300 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />{c}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ─── Radar chart data builder ────────────────────────── */
const buildRadarData = (coinA, coinB) => {
  const norm = (val, max) => Math.min(100, Math.round((val / max) * 100));
  const volScore = (c) => Math.max(0, 100 - Math.min(100, (Math.abs(c.change30d) * 2)));
  const commScore = (c) => norm(c.twitterFollowers + c.redditSubscribers, 5e7);
  const mcapScore = (c) => norm(c.marketCap, 2e12);
  const volScore24h = (c) => norm(c.volume24h, 5e10);
  const athScore = (c) => c.ath > 0 ? norm(c.price / c.ath * 100, 100) : 50;

  return [
    { subject: 'Market Cap',  A: mcapScore(coinA),    B: mcapScore(coinB) },
    { subject: 'Volume',      A: volScore24h(coinA),  B: volScore24h(coinB) },
    { subject: 'Stability',   A: volScore(coinA),     B: volScore(coinB) },
    { subject: 'Community',   A: commScore(coinA),    B: commScore(coinB) },
    { subject: 'ATH Ratio',   A: athScore(coinA),     B: athScore(coinB) },
  ];
};

/* ─── Bar chart custom tooltip ────────────────────────── */
const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-800 border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.fill }} className="font-bold">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════ */
export default function CoinComparison() {
  const [selectedA, setSelectedA] = useState(POPULAR_COINS[0]); // Bitcoin
  const [selectedB, setSelectedB] = useState(POPULAR_COINS[1]); // Ethereum
  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const COLOR_A = POPULAR_COINS.find(c => c.id === selectedA?.id)?.color || '#6366f1';
  const COLOR_B = POPULAR_COINS.find(c => c.id === selectedB?.id)?.color || '#10b981';

  const handleCompare = useCallback(async () => {
    if (!selectedA || !selectedB) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`${API}/ai/compare-coins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ coinIdA: selectedA.id, coinIdB: selectedB.id })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Comparison failed. Please try again.'); return; }
      setResult(data.data);
    } catch {
      setError('Network error — please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedA, selectedB]);

  const { coinA, coinB, comparison } = result || {};
  const radarData = coinA && coinB ? buildRadarData(coinA, coinB) : [];

  // Bar chart data for 24h / 7d / 30d side by side
  const barData = coinA && coinB ? [
    { name: '24h', [coinA.symbol]: parseFloat(coinA.change24h.toFixed(2)), [coinB.symbol]: parseFloat(coinB.change24h.toFixed(2)) },
    { name: '7d',  [coinA.symbol]: parseFloat(coinA.change7d.toFixed(2)),  [coinB.symbol]: parseFloat(coinB.change7d.toFixed(2)) },
    { name: '30d', [coinA.symbol]: parseFloat(coinA.change30d.toFixed(2)), [coinB.symbol]: parseFloat(coinB.change30d.toFixed(2)) }
  ] : [];

  return (
    <div className="space-y-6 text-left">

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-white tracking-tight flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <GitCompare className="w-4 h-4 text-white" />
            </span>
            Coin Comparison
          </h1>
          <p className="text-slate-400 text-xs mt-1.5 ml-11">
            AI-powered educational coin analysis — select two coins to compare.
          </p>
        </div>
      </div>

      {/* ── Coin Selectors ── */}
      <div className="glass-panel rounded-2xl border border-white/5 p-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
          <CoinSelector
            label="Coin A"
            selected={selectedA}
            onSelect={setSelectedA}
            otherSelectedId={selectedB?.id}
          />

          <div className="flex items-center justify-center sm:pb-3">
            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </div>
          </div>

          <CoinSelector
            label="Coin B"
            selected={selectedB}
            onSelect={setSelectedB}
            otherSelectedId={selectedA?.id}
          />

          <button
            id="compare-coins-btn"
            onClick={handleCompare}
            disabled={loading || !selectedA || !selectedB}
            className="sm:self-end flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm
                       bg-gradient-to-r from-cyan-600 to-indigo-600 text-white
                       hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50
                       transition-all duration-200 shadow-lg shadow-indigo-900/40
                       hover:shadow-indigo-700/50 hover:-translate-y-0.5 whitespace-nowrap flex-shrink-0"
          >
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing…</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Compare Now</>
            )}
          </button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/25 rounded-2xl px-4 py-3 text-sm text-rose-300">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-400" />{error}
        </div>
      )}

      {/* ── Empty / Prompt state ── */}
      {!result && !loading && !error && (
        <div className="glass-panel rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/15 to-indigo-600/15 border border-white/5 flex items-center justify-center">
            <GitCompare className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <p className="text-white font-bold">Select two coins and click Compare Now</p>
            <p className="text-slate-500 text-xs mt-1 max-w-xs mx-auto">
              Gemini AI will generate a complete educational analysis including pros, cons, risk levels, and a summary table.
            </p>
          </div>
        </div>
      )}

      {/* ── RESULTS ── */}
      {result && coinA && coinB && comparison && (
        <div className="space-y-6">

          {/* ── Row 1: Pros/Cons Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <ProsConsCard coin={coinA} pros={comparison.prosA} cons={comparison.consA} color={COLOR_A} />
            <ProsConsCard coin={coinB} pros={comparison.prosB} cons={comparison.consB} color={COLOR_B} />
          </div>

          {/* ── Row 2: Charts (Radar + Bar) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Radar */}
            <div className="glass-panel rounded-2xl border border-white/5 p-5 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" /> Capability Radar
              </h3>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.06)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Radar name={coinA.symbol} dataKey="A" stroke={COLOR_A} fill={COLOR_A} fillOpacity={0.25} strokeWidth={2} />
                  <Radar name={coinB.symbol} dataKey="B" stroke={COLOR_B} fill={COLOR_B} fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 text-[10px]">
                <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded" style={{ background: COLOR_A }} />{coinA.symbol}</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded" style={{ background: COLOR_B }} />{coinB.symbol}</span>
              </div>
            </div>

            {/* Performance Bar Chart */}
            <div className="glass-panel rounded-2xl border border-white/5 p-5 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" /> Historical Performance (%)
              </h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData} barCategoryGap="30%">
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey={coinA.symbol} name={coinA.symbol} radius={[4, 4, 0, 0]}>
                    {barData.map((entry, i) => (
                      <Cell key={i} fill={entry[coinA.symbol] >= 0 ? COLOR_A : '#f43f5e'} opacity={0.85} />
                    ))}
                  </Bar>
                  <Bar dataKey={coinB.symbol} name={coinB.symbol} radius={[4, 4, 0, 0]}>
                    {barData.map((entry, i) => (
                      <Cell key={i} fill={entry[coinB.symbol] >= 0 ? COLOR_B : '#f43f5e'} opacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 text-[10px]">
                <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded" style={{ background: COLOR_A }} />{coinA.symbol}</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded" style={{ background: COLOR_B }} />{coinB.symbol}</span>
              </div>
            </div>
          </div>

          {/* ── Row 3: Summary Table ── */}
          <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-slate-400" /> Side-by-Side Summary Table
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left">Metric</th>
                    <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-center" style={{ color: COLOR_A }}>
                      {coinA.symbol}
                    </th>
                    <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-center" style={{ color: COLOR_B }}>
                      {coinB.symbol}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(comparison.summaryTable || []).map((row, i) => (
                    <TableRow key={i} row={row} i={i} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Row 4: AI Narratives ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Beginner explanation */}
            <div className="glass-panel rounded-2xl border border-cyan-500/15 p-5 space-y-3 bg-cyan-500/[0.03]">
              <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" /> Beginner Explanation
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">{comparison.beginnerComparison}</p>
            </div>

            {/* Risk explanation */}
            <div className="glass-panel rounded-2xl border border-amber-500/15 p-5 space-y-3 bg-amber-500/[0.03]">
              <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" /> Risk Awareness
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">{comparison.riskExplanation}</p>
            </div>
          </div>

          {/* ── Quick Stats Bar ── */}
          <div className="glass-panel rounded-2xl border border-white/5 p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: `${coinA.symbol} Market Cap`,  val: fmt(coinA.marketCap),  color: COLOR_A, Icon: BarChart3 },
                { label: `${coinB.symbol} Market Cap`,  val: fmt(coinB.marketCap),  color: COLOR_B, Icon: BarChart3 },
                { label: `${coinA.symbol} 24h Volume`,  val: fmt(coinA.volume24h),  color: COLOR_A, Icon: Zap },
                { label: `${coinB.symbol} 24h Volume`,  val: fmt(coinB.volume24h),  color: COLOR_B, Icon: Zap },
              ].map(({ label, val, color, Icon }, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + '20' }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </span>
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider">{label}</p>
                    <p className="text-xs font-bold text-white">{val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Disclaimer ── */}
          <div className="flex items-start gap-3 bg-amber-500/8 border border-amber-500/20 rounded-2xl px-4 py-3">
            <Info className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-200/80 leading-relaxed">
              <span className="font-bold text-amber-300">Educational Analysis Only.</span> This comparison is generated for educational and awareness purposes. It does not constitute financial, investment, or trading advice. All crypto assets carry significant price risk. Always conduct independent research before making any decisions.
            </p>
          </div>

          {/* ── Re-compare button ── */}
          <div className="flex justify-center">
            <button
              onClick={() => setResult(null)}
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors py-2 px-4 rounded-xl border border-white/5 hover:border-white/10"
            >
              <RefreshCw className="w-3 h-3" /> Start New Comparison
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
