import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, TrendingUp, TrendingDown, Flame,
  Newspaper, RefreshCw, ChevronRight, ExternalLink,
  AlertTriangle, ThumbsUp, ThumbsDown, Minus,
  BookOpen, Terminal
} from 'lucide-react';

const API = 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('token');

/* ─── Sentiment badge ─────────────────────────────────── */
function SentimentBadge({ sentiment, small = false }) {
  const cfg = {
    Positive: { color: 'text-accent-emerald bg-white/5 border-white/10', Icon: ThumbsUp },
    Negative: { color: 'text-accent-rose bg-white/5 border-white/10', Icon: ThumbsDown },
    Neutral:  { color: 'text-slate-400 bg-white/5 border-white/10', Icon: Minus }
  };
  const { color, Icon } = cfg[sentiment] || cfg.Neutral;
  return (
    <span className={`inline-flex items-center gap-1.5 border rounded-full font-bold uppercase tracking-wider ${small ? 'text-[8px] px-1.5 py-0.5' : 'text-[9px] px-2.5 py-0.5'} ${color}`}>
      <Icon className={small ? 'w-2.5 h-2.5' : 'w-3 h-3'} /> {sentiment}
    </span>
  );
}

/* ─── Overall sentiment bar ───────────────────────────── */
function OverallSentimentBar({ sentiment, articles }) {
  const counts = { Positive: 0, Neutral: 0, Negative: 0 };
  articles.forEach(a => { counts[a.sentiment] = (counts[a.sentiment] || 0) + 1; });
  const total = articles.length || 1;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-slate-400 font-semibold uppercase tracking-wider">Overall Market Sentiment</span>
        <SentimentBadge sentiment={sentiment} />
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5 bg-white/5">
        <div className="bg-white rounded-l-full transition-all" style={{ width: `${(counts.Positive / total) * 100}%` }} />
        <div className="bg-slate-400 transition-all" style={{ width: `${(counts.Neutral / total) * 100}%` }} />
        <div className="bg-slate-700 rounded-r-full transition-all" style={{ width: `${(counts.Negative / total) * 100}%` }} />
      </div>
      <div className="flex gap-3 text-[9px] text-slate-500 font-mono">
        <span><span className="text-white font-bold">{counts.Positive}</span> Positive</span>
        <span><span className="text-slate-400 font-bold">{counts.Neutral}</span> Neutral</span>
        <span><span className="text-slate-600 font-bold">{counts.Negative}</span> Negative</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN WIDGET
   ═══════════════════════════════════════════════════════ */
export default function DailySummaryWidget() {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [mode, setMode]         = useState('beginner'); // 'beginner' | 'pro'
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'trending' | 'news'

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/ai/daily-summary`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const json = await res.json();
      if (res.ok && json.data?.summary) {
        setData(json.data.summary);
      } else {
        setError(json.message || 'Failed to load summary.');
      }
    } catch {
      setError('Network error loading daily summary.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const t = setTimeout(() => { if (active) load(); }, 0);
    return () => { active = false; clearTimeout(t); };
  }, [load]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-white" />
          <span className="text-xs font-bold text-slate-300">AI Daily Summary</span>
        </div>
        <div className="flex items-center justify-center py-10 gap-3 text-slate-500 text-xs font-mono">
          <span className="w-3.5 h-3.5 border-2 border-white/10 border-t-white rounded-full animate-spin" />
          Generating today's market intelligence…
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error || !data) {
    return (
      <div className="glass-panel p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-white" />
          <span className="text-xs font-bold text-slate-300">AI Daily Summary</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-300 bg-white/2 border border-white/5 rounded-xl p-3">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-slate-400" />
          {error || 'Summary unavailable.'}
        </div>
        <button onClick={load} className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer">
          <RefreshCw className="w-3 h-3" /> Retry
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'summary',  label: 'AI Summary',  Icon: Sparkles  },
    { id: 'trending', label: 'Trending',     Icon: Flame     },
    { id: 'news',     label: 'News',         Icon: Newspaper }
  ];

  return (
    <div className="glass-panel overflow-hidden">

      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-3 space-y-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </span>
            <div>
              <p className="text-xs font-bold text-white">AI Daily Market Summary</p>
              <p className="text-[10px] text-slate-500 font-mono">
                {new Date(data.generatedAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                {' · '}
                <span className={`font-bold ${data.overallSentiment === 'Positive' ? 'text-accent-emerald' : data.overallSentiment === 'Negative' ? 'text-accent-rose' : 'text-slate-400'}`}>
                  {data.overallSentiment} Sentiment
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={load}
            title="Refresh"
            className="w-6 h-6 rounded-lg border border-white/10 flex items-center justify-center text-slate-500 hover:text-slate-300 hover:border-white/20 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex bg-black/40 border border-white/5 rounded-lg p-0.5 text-[10px] gap-0.5">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                activeTab === id ? 'bg-white text-black shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3 h-3" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="px-5 py-4 space-y-4">

        {/* ────────── AI SUMMARY TAB ────────── */}
        {activeTab === 'summary' && (
          <div className="space-y-4">
            {/* Mode toggle */}
            <div className="flex bg-black/40 border border-white/5 rounded-lg p-0.5 text-[10px] gap-0.5 w-44">
              <button
                onClick={() => setMode('beginner')}
                className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  mode === 'beginner' ? 'bg-white text-black shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-3 h-3" /> Beginner
              </button>
              <button
                onClick={() => setMode('pro')}
                className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  mode === 'pro' ? 'bg-white text-black shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Terminal className="w-3 h-3" /> Pro
              </button>
            </div>

            {/* AI narrative */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5">
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {mode === 'beginner' ? data.beginnerSummary : data.aiSummary}
              </p>
            </div>

            {/* Sentiment bar */}
            {data.newsSentiment?.length > 0 && (
              <OverallSentimentBar sentiment={data.overallSentiment} articles={data.newsSentiment} />
            )}

            {/* Quick movers row */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Top gainer */}
              {data.topGainers?.[0] && (
                <div className="bg-white/3 border border-white/5 rounded-xl p-2.5 space-y-0.5">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1"><TrendingUp className="w-3 h-3 text-accent-emerald" /> Top Gainer</p>
                  <p className="text-xs font-bold text-white font-mono">{data.topGainers[0].symbol}</p>
                  <p className="text-[10px] text-accent-emerald font-bold font-mono">+{data.topGainers[0].change24h}%</p>
                </div>
              )}
              {/* Top loser */}
              {data.topLosers?.[0] && (
                <div className="bg-white/3 border border-white/5 rounded-xl p-2.5 space-y-0.5">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1"><TrendingDown className="w-3 h-3 text-accent-rose" /> Top Loser</p>
                  <p className="text-xs font-bold text-white font-mono">{data.topLosers[0].symbol}</p>
                  <p className="text-[10px] text-accent-rose font-bold font-mono">{data.topLosers[0].change24h}%</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ────────── TRENDING TAB ────────── */}
        {activeTab === 'trending' && (
          <div className="space-y-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">CoinGecko Trending Coins</p>

            {/* Trending list */}
            <div className="space-y-1.5">
              {(data.trendingCoins || []).map((coin, i) => (
                <Link
                  key={coin.id}
                  to={`/coin/${coin.id}`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.04] border border-transparent hover:border-white/5 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] text-slate-600 font-bold w-4">#{i + 1}</span>
                    {coin.thumb && <img src={coin.thumb} alt={coin.symbol} className="w-5 h-5 rounded-full filter grayscale" />}
                    <div>
                      <p className="text-xs font-bold text-white">{coin.symbol}</p>
                      <p className="text-[10px] text-slate-500">{coin.name}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                </Link>
              ))}
            </div>

            <div className="pt-2 border-t border-white/5 space-y-2">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Top Gainers vs Losers</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  {(data.topGainers || []).slice(0, 4).map(g => (
                    <div key={g.id} className="flex items-center justify-between text-[10px] px-2 py-1 rounded-lg bg-white/3 border border-white/5 font-mono">
                      <span className="text-white font-bold">{g.symbol}</span>
                      <span className="text-accent-emerald font-bold">+{g.change24h}%</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  {(data.topLosers || []).slice(0, 4).map(l => (
                    <div key={l.id} className="flex items-center justify-between text-[10px] px-2 py-1 rounded-lg bg-white/3 border border-white/5 font-mono">
                      <span className="text-white font-bold">{l.symbol}</span>
                      <span className="text-accent-rose font-bold">{l.change24h}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ────────── NEWS TAB ────────── */}
        {activeTab === 'news' && (
          <div className="space-y-3">
            {data.newsSentiment?.length > 0 ? (
              <>
                <OverallSentimentBar sentiment={data.overallSentiment} articles={data.newsSentiment} />
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {data.newsSentiment.map((item, i) => (
                    <a
                      key={i}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs text-slate-200 font-semibold leading-snug group-hover:text-white transition-colors line-clamp-2">
                          {item.title}
                        </p>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-600 flex-shrink-0 mt-0.5 group-hover:text-slate-400 transition-colors" />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <SentimentBadge sentiment={item.sentiment} small />
                        {item.explanation && (
                          <p className="text-[9px] text-slate-600 truncate max-w-[180px] font-mono">{item.explanation}</p>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs">
                <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No news articles available today.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="px-5 pb-4 border-t border-white/5 pt-3">
        <p className="text-[9px] text-slate-600 leading-relaxed font-mono">
          ⚠️ Educational information only. Not financial advice. Refreshes once per day at midnight UTC.
        </p>
      </div>
    </div>
  );
}
