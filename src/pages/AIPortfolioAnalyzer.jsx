import React, { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import {
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  History,
  ChevronRight,
  RefreshCw,
  Info,
  BarChart3,
  Layers
} from 'lucide-react';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

/* ─── helpers ─────────────────────────────────────────── */
const getToken = () => localStorage.getItem('cv_token');

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);

const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

/* ─── Score Gauge ─────────────────────────────────────── */
const FULL_DASH = 339.2; // circumference for r=54

function ScoreGauge({ score, label, colorClass, trackColor, sublabel }) {
  const filled = FULL_DASH * (score / 100);
  const offset = FULL_DASH - filled;

  let strokeColor = '#6366f1';
  if (colorClass === 'emerald') strokeColor = '#10b981';
  if (colorClass === 'amber')   strokeColor = '#f59e0b';
  if (colorClass === 'rose')    strokeColor = '#f43f5e';

  const textColor =
    colorClass === 'emerald' ? '#34d399' :
    colorClass === 'amber'   ? '#fbbf24' :
    colorClass === 'rose'    ? '#fb7185' : '#a5b4fc';

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-3">
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg width="144" height="144" className="transform -rotate-90">
          <circle cx="72" cy="72" r="54" fill="none" stroke={trackColor || 'rgba(255,255,255,0.04)'} strokeWidth="9" />
          <circle
            cx="72" cy="72" r="54"
            fill="none"
            stroke={strokeColor}
            strokeWidth="9"
            strokeDasharray={FULL_DASH}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)', filter: `drop-shadow(0 0 6px ${strokeColor}80)` }}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center font-display">
          <span className="text-3xl font-extrabold text-white">{score}</span>
          <span className="text-[10px] font-bold text-slate-500">/ 100</span>
        </div>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: textColor }}>{label}</p>
        {sublabel && <p className="text-[10px] text-slate-500 mt-0.5 px-2">{sublabel}</p>}
      </div>
    </div>
  );
}

/* ─── Risk badge helper ───────────────────────────────── */
function riskMeta(score) {
  if (score >= 70) return { label: 'High Risk',     color: 'rose',    icon: ShieldAlert };
  if (score >= 40) return { label: 'Moderate Risk', color: 'amber',   icon: AlertTriangle };
  return              { label: 'Low Risk',      color: 'emerald', icon: ShieldCheck };
}

/* ─── Pie slice colours ───────────────────────────────── */
const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

/* ─── Custom Pie tooltip ──────────────────────────────── */
const PieTooltipContent = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-dark-800 border border-white/10 rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="text-white font-bold">{d.name}</p>
      <p className="text-slate-400">{d.value.toFixed(1)}% of portfolio</p>
      <p className="text-slate-400">{fmt(d.payload.valueUSD)}</p>
    </div>
  );
};

/* ─── History item card ───────────────────────────────── */
function HistoryItem({ entry, isActive, onClick }) {
  const rm = riskMeta(entry.riskScore);
  const colors = { rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20', amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20', emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl border transition-all duration-200 group ${isActive ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-white/5 hover:border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold text-white truncate">{entry.portfolioSnapshot?.length || 0} assets analyzed</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{fmtDate(entry.createdAt)}</p>
        </div>
        <ChevronRight className={`w-4 h-4 mt-0.5 flex-shrink-0 transition-transform ${isActive ? 'rotate-90 text-indigo-400' : 'text-slate-600 group-hover:text-slate-400'}`} />
      </div>
      <div className="flex gap-2 mt-2">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors[rm.color]}`}>
          Risk {entry.riskScore}
        </span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
          Div {entry.diversificationScore}
        </span>
      </div>
    </button>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════ */
export default function AIPortfolioAnalyzer() {
  const [analysis, setAnalysis]     = useState(null);
  const [history, setHistory]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError]           = useState('');

  /* Load history on mount */
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API}/ai/analysis-history`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (res.ok && data.data?.history) {
        setHistory(data.data.history);
        if (data.data.history.length > 0 && !analysis) {
          setAnalysis(data.data.history[0]);
        }
      }
    } catch (e) {
      console.warn('History load error:', e.message);
    } finally {
      setHistoryLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let active = true;
    setTimeout(() => { if (active) loadHistory(); }, 0);
    return () => { active = false; };
  }, [loadHistory]);

  /* Run new analysis */
  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/ai/analyze-portfolio`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Analysis failed. Please try again.');
        return;
      }
      const newAnalysis = data.data.analysis;
      setAnalysis(newAnalysis);
      setHistory(prev => [newAnalysis, ...prev]);
    } catch {
      setError('Network error — please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  /* Build pie data from active analysis snapshot */
  const pieData = analysis?.portfolioSnapshot?.map(a => ({
    name: a.symbol,
    value: analysis.portfolioSnapshot.reduce((s, x) => s + x.valueUSD, 0) > 0
      ? parseFloat(((a.valueUSD / analysis.portfolioSnapshot.reduce((s, x) => s + x.valueUSD, 0)) * 100).toFixed(1))
      : 0,
    valueUSD: a.valueUSD
  })) || [];

  const totalValue = analysis?.portfolioSnapshot?.reduce((s, a) => s + a.valueUSD, 0) || 0;

  const rm = analysis ? riskMeta(analysis.riskScore) : null;

  /* ── RENDER ── */
  return (
    <div className="space-y-6 text-left">

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-white tracking-tight flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <BarChart3 className="w-4 h-4 text-white" />
            </span>
            AI Portfolio Analyzer
          </h1>
          <p className="text-slate-400 text-xs mt-1.5 ml-11">
            Educational risk audit powered by Gemini AI — not financial advice.
          </p>
        </div>

        <button
          id="analyze-portfolio-btn"
          onClick={handleAnalyze}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm
                     bg-gradient-to-r from-violet-600 to-indigo-600 text-white
                     hover:from-violet-500 hover:to-indigo-500 disabled:opacity-60
                     transition-all duration-200 shadow-lg shadow-indigo-900/40
                     hover:shadow-indigo-700/50 hover:-translate-y-0.5 self-start"
        >
          {loading ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing…</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Analyze My Portfolio</>
          )}
        </button>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/25 rounded-xl px-4 py-3 text-sm text-rose-300">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-400" />
          {error}
        </div>
      )}

      {/* ── Main layout: sidebar + content ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-6">

        {/* ── History Sidebar ── */}
        <div className="glass-panel rounded-2xl border border-white/5 p-4 space-y-3 h-fit">
          <div className="flex items-center gap-2 mb-1">
            <History className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Analysis History</span>
          </div>

          {historyLoading ? (
            <div className="flex justify-center py-6">
              <span className="w-5 h-5 border-2 border-white/10 border-t-indigo-400 rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Layers className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-500">No analyses yet.<br />Click "Analyze My Portfolio" to begin.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {history.map(h => (
                <HistoryItem
                  key={h._id}
                  entry={h}
                  isActive={analysis?._id === h._id}
                  onClick={() => setAnalysis(h)}
                />
              ))}
            </div>
          )}

          {/* Refresh button */}
          <button
            onClick={loadHistory}
            className="w-full flex items-center justify-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-300 transition-colors py-1.5"
          >
            <RefreshCw className="w-3 h-3" /> Refresh history
          </button>
        </div>

        {/* ── Analysis Panel ── */}
        {!analysis ? (
          /* Empty state */
          <div className="glass-panel rounded-2xl border border-white/5 flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 flex items-center justify-center border border-white/5">
              <Sparkles className="w-7 h-7 text-violet-400" />
            </div>
            <div>
              <p className="text-white font-bold text-base">No analysis loaded</p>
              <p className="text-slate-500 text-xs mt-1 max-w-xs mx-auto">
                Click "Analyze My Portfolio" above to generate your first AI-powered educational risk audit.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">

            {/* ── Row 1: Score Gauges ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

              {/* Risk Score */}
              <div className="glass-panel rounded-2xl border border-white/5 p-5 flex flex-col items-center space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider self-start w-full">Risk Score</span>
                <ScoreGauge
                  score={analysis.riskScore}
                  label={rm.label}
                  colorClass={rm.color}
                  sublabel={
                    analysis.riskScore >= 70 ? 'High concentration or volatility detected'
                    : analysis.riskScore >= 40 ? 'Moderate exposure across assets'
                    : 'Well-balanced risk profile'
                  }
                />
              </div>

              {/* Diversification Score */}
              <div className="glass-panel rounded-2xl border border-white/5 p-5 flex flex-col items-center space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider self-start w-full">Diversification</span>
                <ScoreGauge
                  score={analysis.diversificationScore}
                  label={
                    analysis.diversificationScore >= 70 ? 'Well Diversified'
                    : analysis.diversificationScore >= 40 ? 'Moderate Spread'
                    : 'Concentrated'
                  }
                  colorClass={
                    analysis.diversificationScore >= 70 ? 'emerald'
                    : analysis.diversificationScore >= 40 ? 'amber' : 'rose'
                  }
                  sublabel="Asset spread across your holdings"
                />
              </div>

              {/* Portfolio Value KPI */}
              <div className="glass-panel rounded-2xl border border-white/5 p-5 flex flex-col justify-between space-y-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Snapshot Value</span>
                <div>
                  <p className="text-2xl font-extrabold text-white font-display">{fmt(totalValue)}</p>
                  <p className="text-xs text-slate-500 mt-1">at time of analysis</p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Assets</p>
                    <p className="text-sm font-bold text-white">{analysis.portfolioSnapshot?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Analysed</p>
                    <p className="text-[11px] font-semibold text-slate-300">{fmtDate(analysis.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Row 2: Pie Chart + Holdings Table ── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-5">

              {/* Pie */}
              <div className="glass-panel rounded-2xl border border-white/5 p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-500/20 flex items-center justify-center">
                    <Layers className="w-3 h-3 text-indigo-400" />
                  </span>
                  Asset Distribution
                </h3>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltipContent />} />
                      <Legend
                        formatter={(val) => <span className="text-slate-300 text-[11px]">{val}</span>}
                        iconType="circle"
                        iconSize={8}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-slate-500 text-center py-8">No snapshot data available.</p>
                )}
              </div>

              {/* Holdings Table */}
              <div className="glass-panel rounded-2xl border border-white/5 p-5 space-y-3">
                <h3 className="text-sm font-bold text-white">Holdings Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-500 uppercase tracking-wider text-[10px] border-b border-white/5">
                        <th className="pb-2 text-left font-semibold">Asset</th>
                        <th className="pb-2 text-right font-semibold">Value</th>
                        <th className="pb-2 text-right font-semibold">Alloc %</th>
                        <th className="pb-2 text-right font-semibold">PnL</th>
                        <th className="pb-2 text-right font-semibold">24h</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {analysis.portfolioSnapshot?.map((a, i) => {
                        const allocPct = totalValue > 0 ? ((a.valueUSD / totalValue) * 100).toFixed(1) : '0.0';
                        const pnlPos = a.pnlPct >= 0;
                        const chgPos = a.change24h >= 0;
                        return (
                          <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-2.5 pr-3">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                                  style={{ background: PIE_COLORS[i % PIE_COLORS.length] + '33', border: `1px solid ${PIE_COLORS[i % PIE_COLORS.length]}55` }}>
                                  {a.symbol?.slice(0, 2)}
                                </span>
                                <div>
                                  <p className="font-bold text-white">{a.symbol}</p>
                                  <p className="text-slate-500 text-[10px]">{a.coinName}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 text-right text-white font-semibold">{fmt(a.valueUSD)}</td>
                            <td className="py-2.5 text-right text-slate-400">{allocPct}%</td>
                            <td className={`py-2.5 text-right font-bold ${pnlPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {pnlPos ? '+' : ''}{a.pnlPct?.toFixed(1)}%
                            </td>
                            <td className={`py-2.5 text-right font-semibold ${chgPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {chgPos ? '↑' : '↓'} {Math.abs(a.change24h).toFixed(2)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ── Row 3: Strengths / Weaknesses / Suggestions ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

              {/* Strengths */}
              <div className="glass-panel rounded-2xl border border-emerald-500/15 p-5 space-y-3 bg-emerald-500/[0.03]">
                <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Strengths
                </h3>
                <ul className="space-y-2.5">
                  {(analysis.strengths || []).map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="glass-panel rounded-2xl border border-rose-500/15 p-5 space-y-3 bg-rose-500/[0.03]">
                <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" /> Weaknesses
                </h3>
                <ul className="space-y-2.5">
                  {(analysis.weaknesses || []).map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Suggestions */}
              <div className="glass-panel rounded-2xl border border-indigo-500/15 p-5 space-y-3 bg-indigo-500/[0.03]">
                <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" /> Suggestions
                </h3>
                <ul className="space-y-2.5">
                  {(analysis.suggestions || []).map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ── Row 4: AI Summary Card ── */}
            <div className="glass-panel rounded-2xl border border-violet-500/15 p-5 space-y-3 bg-violet-500/[0.03]">
              <h3 className="text-sm font-bold text-violet-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" /> AI Portfolio Summary
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">{analysis.summary}</p>
            </div>

            {/* ── Disclaimer Banner ── */}
            <div className="flex items-start gap-3 bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-3">
              <Info className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-200/80 leading-relaxed">
                <span className="font-bold text-amber-300">Educational Analysis Only.</span> This analysis is generated for educational and awareness purposes. It does not constitute financial, investment, or trading advice. Always conduct independent research and consult a licensed financial advisor before making any investment decisions.
              </p>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
