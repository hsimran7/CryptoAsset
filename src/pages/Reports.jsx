import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Sparkles, 
  DollarSign, 
  Calculator, 
  Clock
} from 'lucide-react';

const MOCK_REPORTS = [
  { id: 'rep1', name: 'Q2 Portfolio Valuation Audit', date: '2026-06-01', size: '1.2 MB', format: 'PDF', status: 'READY' },
  { id: 'rep2', name: 'May 2026 Performance Statement', date: '2026-05-31', size: '820 KB', format: 'PDF', status: 'READY' },
  { id: 'rep3', name: 'FY 2025/2026 Capital Gains Estimate', date: '2026-04-15', size: '3.4 MB', format: 'XLSX', status: 'READY' }
];

export default function Reports() {

  const [reportsList, setReportsList] = useState(MOCK_REPORTS);
  const [generatingReportId, setGeneratingReportId] = useState(null);

  // Capital Gains Calculator States
  const [calcCostBasis, setCalcCostBasis] = useState('');
  const [calcProceeds, setCalcProceeds] = useState('');
  const [calcTerm, setCalcTerm] = useState('SHORT');
  const [calcResult, setCalcResult] = useState(null);

  const triggerStatementGenerate = (statementName) => {
    const newId = 'rep-' + Date.now();
    setGeneratingReportId(statementName);
    
    setTimeout(() => {
      const newReport = {
        id: newId,
        name: statementName,
        date: new Date().toISOString().split('T')[0],
        size: '1.5 MB',
        format: 'PDF',
        status: 'READY'
      };
      setReportsList([newReport, ...reportsList]);
      setGeneratingReportId(null);
    }, 2000);
  };

  const handleComputeGains = (e) => {
    e.preventDefault();
    const cost = parseFloat(calcCostBasis);
    const proceeds = parseFloat(calcProceeds);
    
    if (isNaN(cost) || isNaN(proceeds) || cost < 0 || proceeds < 0) {
      alert('Please enter valid positive numbers.');
      return;
    }

    const netGain = proceeds - cost;
    const taxRate = calcTerm === 'SHORT' ? 0.30 : 0.15; // Short term vs long term bracket
    const estTax = netGain > 0 ? netGain * taxRate : 0;

    setCalcResult({
      netGain,
      estTax,
      rate: taxRate * 100
    });
  };

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div>
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-white tracking-tight">
          Reports &amp; Tax Audits
        </h1>
        <p className="text-slate-400 text-xs mt-1">Export transaction histories, evaluate capital gains tax, and retrieve statements.</p>
      </div>

      {/* Main KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Estimated tax liabilities */}
        <div className="glass-panel rounded-xl border border-white/5 p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">YTD Capital Gains Liability</span>
            <h3 className="text-xl font-bold text-white font-mono">$4,850.20</h3>
            <span className="text-[10px] text-slate-400 font-medium">Estimated tax liability</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/10 flex items-center justify-center">
            <DollarSign className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* Audited statements list */}
        <div className="glass-panel rounded-xl border border-white/5 p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Statements Generated</span>
            <h3 className="text-xl font-bold text-white font-mono">{reportsList.length} Files</h3>
            <span className="text-[10px] text-slate-400 font-medium">Archived statements</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-600/10 text-emerald-400 border border-emerald-500/10 flex items-center justify-center">
            <FileText className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* AI Tax Recommendations */}
        <div className="glass-panel rounded-xl border border-white/5 p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Tax-Loss Harvest Signal</span>
            <h3 className="text-xl font-bold text-amber-400 font-mono">1 Target</h3>
            <span className="text-[10px] text-violet-400 font-bold flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-0.5" /> Harvest recommendations
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-violet-600/10 text-violet-400 border border-violet-500/10 flex items-center justify-center">
            <Sparkles className="w-5.5 h-5.5" />
          </div>
        </div>
      </div>

      {/* Main Reports download & tax calculator grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports lists table (2/3 width) */}
        <div className="glass-panel rounded-xl border border-white/5 p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-white">Generated Reports Archive</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => triggerStatementGenerate('Monthly Performance Audit - Jun 2026')}
                disabled={generatingReportId !== null}
                className="btn-premium-dark text-[10px] py-1.5 px-3 flex items-center gap-1 hover:border-slate-500"
              >
                {generatingReportId === 'Monthly Performance Audit - Jun 2026' ? (
                  <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                )}
                Generate June Report
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs font-mono text-left">
              <thead>
                <tr className="border-b border-white/5 text-slate-400 font-semibold uppercase tracking-wider pb-2">
                  <th className="pb-2">Report Document</th>
                  <th className="pb-2">Date Created</th>
                  <th className="pb-2">Size</th>
                  <th className="pb-2 text-center">Format</th>
                  <th className="pb-2 text-center">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reportsList.map((rep) => (
                  <tr key={rep.id} className="hover:bg-white/[0.01]">
                    <td className="py-3 font-semibold text-white font-sans">{rep.name}</td>
                    <td className="py-3 text-slate-400">{rep.date}</td>
                    <td className="py-3 text-slate-400">{rep.size}</td>
                    <td className="py-3 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        rep.format === 'PDF' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {rep.format}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <button className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-indigo-400 transition-colors">
                        <Download className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Capital Gains Tax Estimator calculator (1/3 width) */}
        <div className="glass-panel rounded-xl border border-white/5 p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-400" /> Tax Calculator
            </h3>
            <p className="text-[11px] text-slate-400 font-sans">Simulate gains taxes for short or long term brackets.</p>
          </div>

          <form onSubmit={handleComputeGains} className="space-y-4 flex-1 pt-1">
            {/* Cost Basis Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Acquisition Cost (USD)</label>
              <input
                type="number"
                placeholder="10000.00"
                value={calcCostBasis}
                onChange={(e) => setCalcCostBasis(e.target.value)}
                className="w-full p-2.5 text-xs glass-input focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>

            {/* Sale Proceeds Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sale Proceeds (USD)</label>
              <input
                type="number"
                placeholder="15000.00"
                value={calcProceeds}
                onChange={(e) => setCalcProceeds(e.target.value)}
                className="w-full p-2.5 text-xs glass-input focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>

            {/* Holding Term switcher */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Holding Period</label>
              <div className="grid grid-cols-2 bg-dark-900 border border-white/5 rounded-lg p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setCalcTerm('SHORT')}
                  className={`py-2 rounded-md transition-all ${
                    calcTerm === 'SHORT' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  SHORT-TERM (&lt;1Y)
                </button>
                <button
                  type="button"
                  onClick={() => setCalcTerm('LONG')}
                  className={`py-2 rounded-md transition-all ${
                    calcTerm === 'LONG' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  LONG-TERM (&gt;1Y)
                </button>
              </div>
            </div>

            {/* Compute button */}
            <button
              type="submit"
              className="w-full btn-premium-indigo text-xs py-2.5 font-bold"
            >
              Compute Taxes
            </button>
          </form>

          {/* Calculator results block */}
          {calcResult && (
            <div className="bg-white/5 border border-white/5 p-3 rounded-lg text-[11px] font-mono space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Net Gain/Loss:</span>
                <span className={`font-bold ${calcResult.netGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ${calcResult.netGain.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Est. Tax Rate:</span>
                <span className="text-white font-bold">{calcResult.rate}%</span>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-1.5">
                <span className="text-slate-400 font-bold">Estimated Tax:</span>
                <span className="text-indigo-400 font-black">${calcResult.estTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
