import React, { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import {
  FileText, Download, Sparkles, DollarSign,
  Calculator, Clock, FileSpreadsheet, TrendingUp,
  TrendingDown, AlertTriangle, CheckCircle, BarChart3,
  RefreshCw, Info
} from 'lucide-react';

const API   = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;
const token = () => localStorage.getItem('cv_token');

const fmt     = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
const fmtCpct = (n) => `${(n || 0) >= 0 ? '+' : ''}${parseFloat(n || 0).toFixed(2)}%`;

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#84cc16'];

/* ─── Small helpers ───────────────────────────────────── */
function StatCard({ label, value, sub, Icon, iconBg, iconColor }) {
  return (
    <div className="glass-panel rounded-2xl border border-white/5 p-4 flex items-center justify-between">
      <div className="space-y-0.5">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-lg font-extrabold text-white font-mono">{value}</p>
        {sub && <p className="text-[10px] text-slate-500">{sub}</p>}
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
    </div>
  );
}

/* ─── PDF Generation (pure client-side jsPDF) ────────── */
const generatePDF = async (data) => {
  const { default: jsPDF } = await import('jspdf');

  const {
    user, assets, totalValue, totalInvested, totalPnL, totalPnLPct, lastAnalysis
  } = data;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210; // A4 width in mm
  const M = 15;  // margin
  const CW = W - M * 2; // content width

  let y = 0;

  /* ─── HELPERS ── */
  const addPage = () => { doc.addPage(); y = 20; };
  const checkY = (needed = 20) => { if (y + needed > 270) addPage(); };
  const text = (t, x, yp, opts = {}) => doc.text(String(t ?? ''), x, yp, opts);
  const line = (x1, y1, x2, y2) => { doc.line(x1, y1, x2, y2); };
  const rect = (x, yp, w, h, style = 'F') => doc.rect(x, yp, w, h, style);

  const hexToRGB = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };

  const setColor = (hex) => { const [r,g,b] = hexToRGB(hex); doc.setTextColor(r,g,b); };
  const setFill  = (hex) => { const [r,g,b] = hexToRGB(hex); doc.setFillColor(r,g,b); };
  const setDraw  = (hex) => { const [r,g,b] = hexToRGB(hex); doc.setDrawColor(r,g,b); };

  /* ════════════ PAGE 1: COVER ════════════ */

  // Dark background
  setFill('#0f1117'); rect(0, 0, 210, 297);

  // Accent gradient strip (simulated via rectangles)
  for (let i = 0; i < 6; i++) {
    const r = Math.round(99  + (i * 3));
    const g = Math.round(102 + (i * 3));
    const b = Math.round(241 - (i * 2));
    doc.setFillColor(r, g, b);
    doc.rect(0, i * 10, 6, 10, 'F');
  }

  y = 30;

  // Logo area
  setFill('#6366f1'); rect(M, y, 10, 10, 'F');
  setFill('#06b6d4'); rect(M + 11, y, 5, 5, 'F');
  setFill('#8b5cf6'); rect(M + 11, y + 6, 5, 4, 'F');

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  setColor('#ffffff');
  text('CryptoVision AI', M + 20, y + 7.5);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  setColor('#94a3b8');
  text('Advanced Portfolio Intelligence Terminal', M + 20, y + 14);

  y += 35;

  // Divider
  setDraw('#6366f1');
  doc.setLineWidth(0.4);
  line(M, y, W - M, y);
  y += 12;

  // Report title
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  setColor('#ffffff');
  text('PORTFOLIO PERFORMANCE', M, y);
  y += 10;
  text('& RISK ANALYSIS REPORT', M, y);
  y += 8;

  setFill('#6366f1'); rect(M, y, 40, 1.5, 'F');
  y += 10;

  // Subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  setColor('#94a3b8');
  const now = new Date();
  text(`Generated: ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, M, y);
  y += 8;
  text(`Account: ${user?.username || 'N/A'}  ·  ${user?.email || ''}`, M, y);
  y += 25;

  // Summary KPI boxes
  const kpis = [
    { label: 'Total Portfolio Value', value: fmt(totalValue),      color: '#6366f1' },
    { label: 'Total Invested',        value: fmt(totalInvested),    color: '#10b981' },
    { label: 'Net Profit / Loss',     value: fmt(totalPnL),         color: totalPnL >= 0 ? '#10b981' : '#f43f5e' },
    { label: 'Overall ROI',           value: fmtCpct(totalPnLPct),  color: totalPnLPct >= 0 ? '#10b981' : '#f43f5e' }
  ];

  const boxW = (CW - 6) / 4;
  kpis.forEach((k, i) => {
    const bx = M + i * (boxW + 2);
    setFill('#1e2330'); rect(bx, y, boxW, 24, 'F');
    setDraw('#2d3748'); doc.setLineWidth(0.2); rect(bx, y, boxW, 24, 'S');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    setColor('#64748b');
    text(k.label.toUpperCase(), bx + 3, y + 7);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    setColor(k.color);
    text(k.value, bx + 3, y + 18);
  });
  y += 34;

  // Risk score (from last AI analysis)
  if (lastAnalysis) {
    const riskColor = lastAnalysis.riskScore > 70 ? '#f43f5e' : lastAnalysis.riskScore > 40 ? '#f59e0b' : '#10b981';
    setFill('#1e2330'); rect(M, y, CW, 18, 'F');
    setDraw('#2d3748'); doc.setLineWidth(0.2); rect(M, y, CW, 18, 'S');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    setColor('#64748b');
    text('LAST AI RISK ASSESSMENT', M + 3, y + 6);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    setColor('#e2e8f0');
    text(`Risk Score: `, M + 3, y + 13);
    setColor(riskColor);
    text(`${lastAnalysis.riskScore}/100`, M + 25, y + 13);
    setColor('#e2e8f0');
    text(`  ·  Diversification: `, M + 40, y + 13);
    setColor('#6366f1');
    text(`${lastAnalysis.diversificationScore}/100`, M + 85, y + 13);
    setColor('#94a3b8');
    const analysisDate = new Date(lastAnalysis.createdAt).toLocaleDateString();
    text(`  ·  Analysis date: ${analysisDate}`, M + 108, y + 13);
    y += 26;
  }

  // Cover page footer
  y = 265;
  setDraw('#1e2330'); doc.setLineWidth(0.3); line(M, y, W - M, y);
  y += 6;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  setColor('#475569');
  text('This report is for educational purposes only. Not financial advice. CryptoVision AI © ' + now.getFullYear(), M, y, { maxWidth: CW });

  /* ════════════ PAGE 2: ASSET BREAKDOWN TABLE ════════════ */
  doc.addPage();
  setFill('#0f1117'); rect(0, 0, 210, 297);
  y = 20;

  // Section header
  setFill('#6366f1'); rect(M, y - 4, 3, 10, 'F');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  setColor('#ffffff');
  text('Asset Breakdown', M + 6, y + 2);
  y += 14;

  // Table header
  const cols = [
    { label: 'Asset',          x: M,       w: 28 },
    { label: 'Symbol',         x: M + 28,  w: 18 },
    { label: 'Qty',            x: M + 46,  w: 20 },
    { label: 'Buy Price',      x: M + 66,  w: 28 },
    { label: 'Current',        x: M + 94,  w: 28 },
    { label: 'Value (USD)',     x: M + 122, w: 30 },
    { label: 'P&L',            x: M + 152, w: 25 },
    { label: 'Alloc %',        x: M + 177, w: 18 }
  ];

  setFill('#1e2a3a'); rect(M, y, CW, 8, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  setColor('#94a3b8');
  cols.forEach(c => text(c.label, c.x + 1, y + 5.5));
  y += 9;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');

  assets.forEach((a, i) => {
    checkY(8);
    if (i % 2 === 0) { setFill('#141824'); rect(M, y, CW, 7.5, 'F'); }
    setColor('#e2e8f0');
    text(a.coinName.slice(0, 16), cols[0].x + 1, y + 5);
    setColor('#94a3b8');
    text(a.symbol, cols[1].x + 1, y + 5);
    text(String(a.quantity), cols[2].x + 1, y + 5);
    text(fmt(a.buyPrice), cols[3].x + 1, y + 5);
    text(fmt(a.livePrice), cols[4].x + 1, y + 5);
    setColor('#ffffff');
    text(fmt(a.valueUSD), cols[5].x + 1, y + 5);
    setColor(a.pnl >= 0 ? '#10b981' : '#f43f5e');
    text(fmt(a.pnl), cols[6].x + 1, y + 5);
    setColor('#94a3b8');
    text(`${a.alloc.toFixed(1)}%`, cols[7].x + 1, y + 5);
    y += 7.5;
  });

  // Totals row
  y += 2;
  setFill('#1e2a3a'); rect(M, y, CW, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  setColor('#6366f1');
  text('TOTALS', cols[0].x + 1, y + 5.5);
  setColor('#ffffff');
  text(fmt(totalValue), cols[5].x + 1, y + 5.5);
  setColor(totalPnL >= 0 ? '#10b981' : '#f43f5e');
  text(fmt(totalPnL), cols[6].x + 1, y + 5.5);
  setColor('#94a3b8');
  text('100%', cols[7].x + 1, y + 5.5);
  y += 14;

  /* ════════════ PAGE 2 CONT: ALLOCATION PIE CHART (ASCII bars) ════════════ */
  checkY(50);

  setFill('#6366f1'); rect(M, y - 4, 3, 10, 'F');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  setColor('#ffffff');
  text('Asset Allocation', M + 6, y + 2);
  y += 14;

  // Draw simple horizontal bar chart per asset
  assets.forEach((a, i) => {
    checkY(9);
    const barW = Math.max(1, (a.alloc / 100) * 120);
    const [cr,cg,cb] = hexToRGB(PIE_COLORS[i % PIE_COLORS.length]);
    doc.setFillColor(cr, cg, cb);
    rect(M, y, barW, 5, 'F');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    setColor('#e2e8f0');
    text(`${a.symbol}`, M + barW + 2, y + 4);
    setColor('#64748b');
    text(`${a.alloc.toFixed(1)}% · ${fmt(a.valueUSD)}`, M + barW + 18, y + 4);
    y += 7;
  });

  y += 6;

  /* ════════════ PAGE 3: AI ANALYSIS & DISCLAIMER ════════════ */
  if (lastAnalysis?.summary || lastAnalysis?.strengths?.length) {
    doc.addPage();
    setFill('#0f1117'); rect(0, 0, 210, 297);
    y = 20;

    setFill('#8b5cf6'); rect(M, y - 4, 3, 10, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    setColor('#ffffff');
    text('AI Portfolio Analysis Summary', M + 6, y + 2);
    y += 14;

    if (lastAnalysis.summary) {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      setColor('#cbd5e1');
      const lines = doc.splitTextToSize(lastAnalysis.summary, CW);
      lines.forEach(l => { checkY(6); text(l, M, y); y += 5.5; });
      y += 6;
    }

    const renderList = (title, items, color) => {
      if (!items?.length) return;
      checkY(12);
      setFill(color); rect(M, y, CW, 7, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      setColor('#ffffff');
      text(title, M + 3, y + 5);
      y += 9;

      items.forEach(item => {
        checkY(8);
        const wrapped = doc.splitTextToSize(`• ${item}`, CW - 6);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        setColor('#e2e8f0');
        wrapped.forEach(l => { text(l, M + 3, y); y += 5; });
        y += 1;
      });
      y += 4;
    };

    renderList('✓ STRENGTHS', lastAnalysis.strengths, '#064e3b');
    renderList('⚠ AREAS TO MONITOR', lastAnalysis.weaknesses, '#7c2d12');
    renderList('💡 EDUCATIONAL SUGGESTIONS', lastAnalysis.suggestions, '#312e81');
  }

  /* ════════════ FINAL PAGE: DISCLAIMER ════════════ */
  doc.addPage();
  setFill('#0f1117'); rect(0, 0, 210, 297);
  y = 30;

  setFill('#f43f5e'); rect(M, y - 4, 3, 40, 'F');
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  setColor('#f43f5e');
  text('IMPORTANT DISCLAIMER', M + 6, y + 6);
  y += 16;

  const disclaimerText = [
    'EDUCATIONAL PURPOSE ONLY',
    'This report has been generated by CryptoVision AI for educational and informational purposes only.',
    '',
    'NOT FINANCIAL ADVICE',
    'The information contained in this report does not constitute financial, investment, tax, or legal advice.',
    'CryptoVision AI is not a licensed financial advisor, broker, or investment firm.',
    '',
    'RISK WARNING',
    'Cryptocurrency markets are highly volatile. Past performance is not indicative of future results.',
    'The value of digital assets can go up or down significantly and you may lose all of your investment.',
    '',
    'INDEPENDENT ADVICE',
    'Always consult a qualified and licensed financial advisor, tax professional, or legal counsel before',
    'making any investment, financial, or tax-related decisions.',
    '',
    `Report generated: ${new Date().toUTCString()}`,
    `Account: ${user?.username || 'N/A'}  ·  CryptoVision AI © ${new Date().getFullYear()}`
  ];

  let disclaimerBold = false;
  disclaimerText.forEach(line => {
    checkY(7);
    if (!line) { y += 4; return; }
    if (line === line.toUpperCase() && line.length > 3) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      setColor('#f1f5f9');
      disclaimerBold = true;
    } else {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      setColor('#94a3b8');
      disclaimerBold = false;
    }
    const wrapped = doc.splitTextToSize(line, CW - 6);
    wrapped.forEach(l => { text(l, M + 6, y); y += 5.5; });
    if (disclaimerBold) y += 2;
  });

  // Save
  const fileName = `CryptoVision_Portfolio_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
  return fileName;
};

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════ */
export default function Reports() {
  const [pdfLoading,    setPdfLoading]    = useState(false);
  const [csvLoading,    setCsvLoading]    = useState(false);
  const [history,       setHistory]       = useState([]);
  const [historyLoading,setHistoryLoading]= useState(true);
  const [previewData,   setPreviewData]   = useState(null);
  const [error,         setError]         = useState('');
  const [successMsg,    setSuccessMsg]    = useState('');

  // Capital Gains Calculator
  const [calcCost,    setCalcCost]   = useState('');
  const [calcProc,    setCalcProc]   = useState('');
  const [calcTerm,    setCalcTerm]   = useState('SHORT');
  const [calcResult,  setCalcResult] = useState(null);

  const flash = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 4000); };
  const errMsg = (msg) => { setError(msg);    setTimeout(() => setError(''), 5000); };

  /* Load history */
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API}/reports/history`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      if (res.ok) setHistory(data.data?.history || []);
    } catch { /* silent */ }
    finally { setHistoryLoading(false); }
  }, []);

  /* Load preview data (used for both PDF and preview panel) */
  const loadPreview = useCallback(async () => {
    try {
      const res = await fetch(`${API}/reports/pdf`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      if (res.ok && data.data) setPreviewData(data.data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    let active = true;
    setTimeout(() => { if (active) { loadHistory(); loadPreview(); } }, 0);
    return () => { active = false; };
  }, [loadHistory, loadPreview]);

  /* Download PDF */
  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/reports/pdf`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      if (!res.ok) { errMsg(data.message || 'Failed to fetch PDF data.'); return; }
      const filename = await generatePDF(data.data);
      flash(`✅ PDF downloaded: ${filename}`);
      setPreviewData(data.data);
      loadHistory();
    } catch (e) {
      errMsg(`PDF generation failed: ${e.message}`);
    } finally {
      setPdfLoading(false);
    }
  };

  /* Download CSV */
  const handleDownloadCSV = async () => {
    setCsvLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/reports/csv`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        errMsg(data.message || 'CSV export failed.'); return;
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `CryptoVision_Portfolio_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      flash('✅ CSV exported successfully!');
      loadHistory();
    } catch (e) {
      errMsg(`CSV export failed: ${e.message}`);
    } finally {
      setCsvLoading(false);
    }
  };

  /* Capital gains calculator */
  const handleCalc = (e) => {
    e.preventDefault();
    const cost = parseFloat(calcCost);
    const proc = parseFloat(calcProc);
    if (isNaN(cost) || isNaN(proc) || cost < 0 || proc < 0) { errMsg('Please enter valid positive numbers.'); return; }
    const gain = proc - cost;
    const rate = calcTerm === 'SHORT' ? 0.30 : 0.15;
    setCalcResult({ gain, tax: gain > 0 ? gain * rate : 0, rate: rate * 100 });
  };

  /* Pie data */
  const pieData = previewData?.assets?.map(a => ({
    name: a.symbol, value: parseFloat(a.alloc?.toFixed(1) || 0), valueUSD: a.valueUSD
  })) || [];

  const totalValue    = previewData?.totalValue    || 0;
  const totalInvested = previewData?.totalInvested || 0;
  const totalPnL      = previewData?.totalPnL      || 0;
  const totalPnLPct   = previewData?.totalPnLPct   || 0;
  const username      = previewData?.user?.username || '—';

  return (
    <div className="space-y-6 text-left">

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-white tracking-tight flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <FileText className="w-4 h-4 text-white" />
            </span>
            Reports & Statements
          </h1>
          <p className="text-slate-400 text-xs mt-1.5 ml-11">
            Export professional fintech-grade portfolio reports as PDF or CSV.
          </p>
        </div>

        {/* Export action buttons */}
        <div className="flex items-center gap-3 self-start">
          <button
            id="download-pdf-btn"
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm
                       bg-gradient-to-r from-rose-600 to-indigo-600 text-white
                       hover:from-rose-500 hover:to-indigo-500 disabled:opacity-50
                       transition-all duration-200 shadow-lg hover:-translate-y-0.5"
          >
            {pdfLoading ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating…</>
            ) : (
              <><FileText className="w-4 h-4" /> Download PDF</>
            )}
          </button>
          <button
            id="download-csv-btn"
            onClick={handleDownloadCSV}
            disabled={csvLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm
                       bg-gradient-to-r from-emerald-600 to-teal-600 text-white
                       hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50
                       transition-all duration-200 shadow-lg hover:-translate-y-0.5"
          >
            {csvLoading ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Exporting…</>
            ) : (
              <><FileSpreadsheet className="w-4 h-4" /> Export CSV</>
            )}
          </button>
        </div>
      </div>

      {/* ── Status banners ── */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl px-4 py-3 text-sm text-emerald-300">
          <CheckCircle className="w-4 h-4 flex-shrink-0" /> {successMsg}
        </div>
      )}
      {error && (
        <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/25 rounded-2xl px-4 py-3 text-sm text-rose-300">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
        </div>
      )}

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Portfolio Value"   value={fmt(totalValue)}      sub={`${username}'s holdings`} Icon={DollarSign}  iconBg="bg-indigo-600/10 border-indigo-500/10"  iconColor="text-indigo-400" />
        <StatCard label="Total Invested"    value={fmt(totalInvested)}   sub="cost basis"               Icon={BarChart3}   iconBg="bg-slate-600/10 border-slate-500/10"    iconColor="text-slate-400" />
        <StatCard label="Net Profit / Loss" value={fmt(totalPnL)}        sub={fmtCpct(totalPnLPct) + ' ROI'} Icon={totalPnL >= 0 ? TrendingUp : TrendingDown} iconBg={totalPnL >= 0 ? "bg-emerald-600/10 border-emerald-500/10" : "bg-rose-600/10 border-rose-500/10"} iconColor={totalPnL >= 0 ? "text-emerald-400" : "text-rose-400"} />
        <StatCard label="Reports Generated" value={`${history.length} Files`} sub="download history" Icon={FileText}     iconBg="bg-violet-600/10 border-violet-500/10"  iconColor="text-violet-400" />
      </div>

      {/* ── Main Grid: Preview + sidebar ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">

        {/* ── LEFT: Portfolio Preview Panel ── */}
        <div className="space-y-5">

          {/* ── Allocation Pie + Asset Table ── */}
          <div className="glass-panel rounded-2xl border border-white/5 p-5 space-y-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" /> Portfolio Preview
              <span className="ml-auto text-[10px] text-slate-600 font-normal">
                {previewData ? `${previewData.assets?.length || 0} assets` : 'No data'}
              </span>
            </h3>

            {!previewData ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
                Add portfolio assets to preview your report.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-5 items-center">
                {/* Pie */}
                {pieData.length > 0 && (
                  <div>
                    <ResponsiveContainer width="100%" height={170}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                          {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="transparent" />)}
                        </Pie>
                        <Tooltip formatter={(v, n) => [`${v}%`, n]} contentStyle={{ background: '#1e2330', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Legend */}
                <div className="space-y-1.5 overflow-y-auto max-h-44">
                  {previewData.assets?.map((a, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-white/[0.04]">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-white font-bold">{a.symbol}</span>
                        <span className="text-slate-500 text-[10px]">{a.coinName}</span>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <span className="text-slate-300 font-mono">{fmt(a.valueUSD)}</span>
                        <span className={`font-bold ${a.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'} text-[11px]`}>
                          {a.pnl >= 0 ? '+' : ''}{a.pnlPct?.toFixed(1)}%
                        </span>
                        <span className="text-slate-600 text-[10px]">{a.alloc?.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── AI Analysis Preview ── */}
          {previewData?.lastAnalysis && (
            <div className="glass-panel rounded-2xl border border-violet-500/15 p-5 space-y-4 bg-violet-500/[0.03]">
              <h3 className="text-sm font-bold text-violet-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" /> Latest AI Analysis (Included in PDF)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Risk Score',          value: `${previewData.lastAnalysis.riskScore}/100`,          color: previewData.lastAnalysis.riskScore > 70 ? 'text-rose-400' : previewData.lastAnalysis.riskScore > 40 ? 'text-amber-400' : 'text-emerald-400' },
                  { label: 'Diversification',     value: `${previewData.lastAnalysis.diversificationScore}/100`, color: 'text-indigo-400' },
                  { label: 'Strengths Found',     value: `${previewData.lastAnalysis.strengths?.length || 0}`,  color: 'text-emerald-400' },
                  { label: 'Suggestions',         value: `${previewData.lastAnalysis.suggestions?.length || 0}`,color: 'text-cyan-400'    }
                ].map(({ label, value, color }, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-3 text-center">
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider">{label}</p>
                    <p className={`text-sm font-extrabold mt-1 ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
              {previewData.lastAnalysis.summary && (
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{previewData.lastAnalysis.summary}</p>
              )}
            </div>
          )}

          {/* ── Generation History Table ── */}
          <div className="glass-panel rounded-2xl border border-white/5 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" /> Generation History
              </h3>
              <button onClick={loadHistory} className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors">
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {historyLoading ? (
              <div className="flex justify-center py-6">
                <span className="w-4 h-4 border-2 border-white/10 border-t-indigo-400 rounded-full animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-6">No reports generated yet. Click Download PDF or Export CSV to begin.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 text-[10px] uppercase tracking-wider border-b border-white/5">
                      <th className="pb-2 text-left font-semibold">File Name</th>
                      <th className="pb-2 text-center font-semibold">Type</th>
                      <th className="pb-2 text-right font-semibold">Generated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {history.map((h) => (
                      <tr key={h._id} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 text-slate-300 font-medium">{h.fileName || `Report_${h._id?.slice(-6)}`}</td>
                        <td className="py-2.5 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            h.reportType === 'PDF'
                              ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                              : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                          }`}>{h.reportType}</span>
                        </td>
                        <td className="py-2.5 text-right text-slate-500 text-[10px]">
                          {new Date(h.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="space-y-5">

          {/* What's included */}
          <div className="glass-panel rounded-2xl border border-white/5 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">PDF Report Includes</h3>
            {[
              { label: 'Cover page with branding',     ok: true },
              { label: 'User name & account details',  ok: true },
              { label: 'Portfolio value KPIs',         ok: true },
              { label: 'Full asset breakdown table',   ok: true },
              { label: 'Investment vs current value',  ok: true },
              { label: 'P&L and ROI per asset',        ok: true },
              { label: 'Asset allocation bars',        ok: true },
              { label: 'AI risk & analysis summary',   ok: !!previewData?.lastAnalysis },
              { label: 'Strengths & suggestions',      ok: !!previewData?.lastAnalysis },
              { label: 'Legal disclaimer page',        ok: true }
            ].map(({ label, ok }, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs">
                <CheckCircle className={`w-3.5 h-3.5 flex-shrink-0 ${ok ? 'text-emerald-400' : 'text-slate-600'}`} />
                <span className={ok ? 'text-slate-300' : 'text-slate-600'}>{label}</span>
                {!ok && <span className="text-[9px] text-amber-500 ml-auto">Run AI Analyzer first</span>}
              </div>
            ))}
          </div>

          {/* CSV info */}
          <div className="glass-panel rounded-2xl border border-emerald-500/15 p-5 space-y-3 bg-emerald-500/[0.03]">
            <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" /> CSV Export
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Downloads a fully formatted spreadsheet with all your holdings, current prices, P&L, ROI, and allocation — ready for Excel or Google Sheets.
            </p>
            <button onClick={handleDownloadCSV} disabled={csvLoading}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-xs
                         bg-emerald-600/20 border border-emerald-500/25 text-emerald-300
                         hover:bg-emerald-600/30 disabled:opacity-50 transition-all">
              {csvLoading ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Export Now
            </button>
          </div>

          {/* Capital Gains Calculator */}
          <div className="glass-panel rounded-2xl border border-white/5 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-indigo-400" /> Tax Estimator
            </h3>
            <p className="text-[10px] text-slate-500">Simulate capital gains tax for educational purposes.</p>
            <form onSubmit={handleCalc} className="space-y-3">
              {[
                { label: 'Acquisition Cost (USD)', val: calcCost, set: setCalcCost },
                { label: 'Sale Proceeds (USD)',    val: calcProc, set: setCalcProc }
              ].map(({ label, val, set }, i) => (
                <div key={i} className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{label}</label>
                  <input type="number" value={val} onChange={e => set(e.target.value)} placeholder="0.00"
                    className="w-full p-2.5 text-xs bg-dark-900/60 border border-white/10 rounded-xl text-white placeholder-slate-600 outline-none focus:border-indigo-500/50 font-mono transition-colors" />
                </div>
              ))}

              <div className="flex bg-dark-900/60 border border-white/10 rounded-xl p-0.5 text-xs">
                {['SHORT', 'LONG'].map(t => (
                  <button key={t} type="button" onClick={() => setCalcTerm(t)}
                    className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${calcTerm === t ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>
                    {t === 'SHORT' ? '<1 Year' : '>1 Year'}
                  </button>
                ))}
              </div>

              <button type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold hover:from-indigo-500 hover:to-violet-500 transition-all">
                Calculate Estimate
              </button>
            </form>

            {calcResult && (
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3 font-mono text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Net Gain/Loss</span>
                  <span className={`font-bold ${calcResult.gain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{fmt(calcResult.gain)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tax Rate</span>
                  <span className="text-white font-bold">{calcResult.rate}%</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-1.5">
                  <span className="text-slate-400 font-bold">Est. Tax Liability</span>
                  <span className="text-indigo-400 font-black">{fmt(calcResult.tax)}</span>
                </div>
                <p className="text-[9px] text-slate-600 pt-1">Educational estimate only. Consult a tax advisor.</p>
              </div>
            )}
          </div>

          {/* Disclaimer notice */}
          <div className="flex items-start gap-3 bg-amber-500/8 border border-amber-500/20 rounded-2xl px-4 py-3">
            <Info className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-amber-200/70 leading-relaxed">
              All reports are educational only. Not financial, investment, or tax advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
