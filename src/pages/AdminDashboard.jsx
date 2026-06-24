import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldAlert, 
  Cpu, 
  Database, 
  Activity, 
  Users, 
  Server, 
  ToggleLeft, 
  ToggleRight,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export default function AdminDashboard() {
  const { adminStats, toggleMaintenanceMode } = useApp();

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div>
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-rose-400 tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-8 h-8 text-rose-500" /> Admin Command Center
        </h1>
        <p className="text-slate-400 text-xs mt-1">Audit real-time system connections, configure maintenance blocks, and inspect gateway logs.</p>
      </div>

      {/* Warning Alert banner if maintenance is enabled */}
      {adminStats.maintenanceMode && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5.5 h-5.5 text-amber-400 mt-0.5 flex-shrink-0 animate-bounce" />
          <div>
            <span className="text-sm font-bold text-white block">System Maintenance Mode Active</span>
            <p className="text-xs text-slate-300 leading-normal mt-0.5">
              Warning: Database writes are currently set to read-only for public traders. System operations are in sandbox mode.
            </p>
          </div>
        </div>
      )}

      {/* System Health KPIs grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: Server CPU */}
        <div className="glass-panel rounded-xl border border-white/5 p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Server Cpu Load</span>
            <h3 className="text-xl font-bold text-white font-mono">{adminStats.serverLoad}%</h3>
            <span className="text-[10px] text-indigo-400 font-bold flex items-center">
              <Cpu className="w-3.5 h-3.5 mr-0.5" /> High availability
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/10 flex items-center justify-center">
            <Cpu className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* KPI: Active WebSocket connections */}
        <div className="glass-panel rounded-xl border border-white/5 p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">WebSocket Connections</span>
            <h3 className="text-xl font-bold text-white font-mono">{adminStats.dbConnections}</h3>
            <span className="text-[10px] text-slate-400 font-medium">Ticking feeds pool</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-600/10 text-emerald-400 border border-emerald-500/10 flex items-center justify-center">
            <Database className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* KPI: API Requests counter */}
        <div className="glass-panel rounded-xl border border-white/5 p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total API Hits</span>
            <h3 className="text-xl font-bold text-white font-mono">{adminStats.apiRequests.toLocaleString()}</h3>
            <span className="text-[10px] text-slate-400 font-medium">Requests since epoch</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-cyan-600/10 text-cyan-400 border border-cyan-500/10 flex items-center justify-center">
            <Activity className="w-5.5 h-5.5" />
          </div>
        </div>

        {/* KPI: Active sessions */}
        <div className="glass-panel rounded-xl border border-white/5 p-4.5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Active Trader Sessions</span>
            <h3 className="text-xl font-bold text-white font-mono">{adminStats.activeSessions}</h3>
            <span className="text-[10px] text-slate-400 font-medium">Online sessions</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-violet-600/10 text-violet-400 border border-violet-500/10 flex items-center justify-center">
            <Users className="w-5.5 h-5.5" />
          </div>
        </div>
      </div>

      {/* Main settings panel & gateway logs grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gateway activity logs (2/3 width) */}
        <div className="glass-panel rounded-xl border border-white/5 p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-white">Security &amp; API Gateway Logs</h3>
            <span className="text-[10px] text-slate-500 font-mono font-semibold flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Stream ticking
            </span>
          </div>

          <div className="bg-dark-950 p-4 rounded-xl border border-white/5 font-mono text-[11px] h-72 overflow-y-auto space-y-3.5">
            {adminStats.errorLogs.map((log) => (
              <div key={log.id} className="text-left flex items-start gap-2 select-text">
                <span className="text-slate-500">[{log.time}]</span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                  log.level === 'warn' ? 'bg-amber-500/10 text-amber-400' : 'bg-indigo-500/10 text-indigo-400'
                }`}>
                  {log.level}
                </span>
                <span className="text-rose-400 font-semibold flex-shrink-0">{log.service}:</span>
                <span className="text-slate-300 leading-normal">{log.error}</span>
              </div>
            ))}
            <div className="text-slate-500 flex items-start gap-2">
              <span>[12:35:10]</span>
              <span className="bg-slate-500/10 text-slate-400 px-1 py-0.2 rounded text-[9px] font-bold uppercase">info</span>
              <span className="text-slate-400">Database pool:</span> Connection verified. DB cluster is healthy.
            </div>
          </div>
        </div>

        {/* Global toggles list card (1/3 width) */}
        <div className="glass-panel rounded-xl border border-white/5 p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <h3 className="font-bold text-base text-white">System Controls</h3>
            <p className="text-[11px] text-slate-400">Configure public sandbox limitations.</p>
          </div>

          <div className="space-y-5 border-t border-white/5 pt-4 flex-1">
            {/* Maintenance toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 text-left">
                <span className="text-xs font-bold text-white block">Maintenance Mode</span>
                <span className="text-[10px] text-slate-400">Restricts trading features and locks SQL write routes.</span>
              </div>
              <button 
                onClick={toggleMaintenanceMode}
                className="text-slate-400 hover:text-white transition-colors"
              >
                {adminStats.maintenanceMode ? (
                  <ToggleRight className="w-7 h-7 text-rose-500" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-slate-600" />
                )}
              </button>
            </div>

            {/* Sandbox toggle mockup */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 text-left">
                <span className="text-xs font-bold text-white block">API Rate Limiting</span>
                <span className="text-[10px] text-slate-400">Limits user requests to 100 queries per minute limit.</span>
              </div>
              <ToggleRight className="w-7 h-7 text-indigo-400 opacity-50 cursor-not-allowed" />
            </div>

            {/* Debug logs toggle mockup */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 text-left">
                <span className="text-xs font-bold text-white block">Detailed Debug Logs</span>
                <span className="text-[10px] text-slate-400">Streams developer warnings in connection panels.</span>
              </div>
              <ToggleLeft className="w-7 h-7 text-slate-600 opacity-50 cursor-not-allowed" />
            </div>
          </div>

          <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg text-[10px] font-mono leading-normal text-rose-300">
            <span className="font-bold text-rose-400 block mb-1">Administrative Node Override</span>
            Changes executed here are broadcast immediately to websocket connections.
          </div>
        </div>
      </div>
    </div>
  );
}
