import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { apiRequest } from '../utils/api';
import { 
  ShieldAlert, 
  Database, 
  Activity, 
  Users, 
  RefreshCw,
  Trash2,
  UserCheck,
  UserX,
  Sparkles,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  MessageSquare,
  Clock,
  Mail,
  ShieldCheck,
  BadgeAlert
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard() {
  const { user: currentUser } = useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // States populated by backend API calls
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalPortfolios: 0,
    totalWatchlists: 0,
    totalAIChats: 0,
    totalAIAnalyses: 0,
    totalAlerts: 0,
    updatedAt: null
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [aiUsage, setAiUsage] = useState([]);
  const [issuesOverview, setIssuesOverview] = useState({
    totalIssues: 0,
    openIssues: 0,
    inProgressIssues: 0,
    resolvedIssues: 0
  });

  const [usersList, setUsersList] = useState([]);
  const [issuesList, setIssuesList] = useState([]);

  // Active view tabs: 'stats', 'users', 'issues'
  const [activeTab, setActiveTab] = useState('stats');

  // Load Admin Data from backend
  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch Stats & AI Usage
      const statsRes = await apiRequest('/admin/stats');
      if (statsRes.success) {
        setStats(statsRes.data.stats);
        setRecentUsers(statsRes.data.recentUsers);
        setAiUsage(statsRes.data.aiUsage);
        setIssuesOverview(statsRes.data.issuesOverview);
      }

      // 2. Fetch All Users
      const usersRes = await apiRequest('/admin/users');
      if (usersRes.success) {
        setUsersList(usersRes.data);
      }

      // 3. Fetch Reported Issues
      const issuesRes = await apiRequest('/admin/issues');
      if (issuesRes.success) {
        setIssuesList(issuesRes.data);
      }

      setLoading(false);
    } catch (err) {
      console.error('[Admin Dashboard Load Error]:', err);
      setError(err.message || 'Failed to load administrative panels');
      setLoading(false);
    }
  };

  useEffect(() => {
    const handle = setTimeout(() => {
      fetchAdminData();
    }, 0);
    return () => clearTimeout(handle);
  }, []);

  // Update user role
  const handleRoleChange = async (userId, targetRole) => {
    try {
      const res = await apiRequest(`/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: { role: targetRole }
      });
      if (res.success) {
        // Update local list
        setUsersList(prev => prev.map(u => u._id === userId ? { ...u, role: targetRole.toLowerCase() } : u));
        fetchAdminData(); // Refresh summary stats
      }
    } catch (err) {
      alert(err.message || 'Failed to change role');
    }
  };

  // Delete User with warning
  const handleDeleteUser = async (userId, username, email) => {
    const confirmDelete = window.confirm(
      `CAUTION: Are you absolutely sure you want to permanently delete user "${username || email}"?\n\nThis will instantly delete their portfolio assets, watchlists, alerts, and AI history.`
    );
    if (!confirmDelete) return;

    try {
      const res = await apiRequest(`/admin/users/${userId}`, {
        method: 'DELETE'
      });
      if (res.success) {
        setUsersList(prev => prev.filter(u => u._id !== userId));
        fetchAdminData(); // Refresh summary stats
      }
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    }
  };

  // Update Issue Status
  const handleIssueStatusChange = async (issueId, targetStatus) => {
    try {
      const res = await apiRequest(`/admin/issues/${issueId}`, {
        method: 'PATCH',
        body: { status: targetStatus }
      });
      if (res.success) {
        setIssuesList(prev => prev.map(iss => iss._id === issueId ? { ...iss, status: targetStatus } : iss));
        fetchAdminData(); // Refresh issues counts
      }
    } catch (err) {
      alert(err.message || 'Failed to update issue status');
    }
  };

  if (loading && stats.totalUsers === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3 font-mono">
          <RefreshCw className="w-8 h-8 text-white animate-spin mx-auto" />
          <p className="text-slate-400 text-xs">Synchronizing platform database metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left max-w-full">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-sans font-bold text-2xl md:text-3xl text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-white" /> Admin Command Center
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Audit platform statistics, manage global users, configure roles, and inspect reported issues.
          </p>
        </div>
        <button
          onClick={fetchAdminData}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold transition-all self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Refresh System Data
        </button>
      </div>

      {error && (
        <div className="bg-white/2 border border-white/10 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 font-medium">{error}</div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-white/5 gap-2 select-none">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-5 py-3 text-xs font-bold transition-all relative cursor-pointer ${
            activeTab === 'stats' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Overview &amp; Analytics
          {activeTab === 'stats' && (
            <motion.div layoutId="activeAdminTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-5 py-3 text-xs font-bold transition-all relative flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'users' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          User Management ({usersList.length})
          {activeTab === 'users' && (
            <motion.div layoutId="activeAdminTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('issues')}
          className={`px-5 py-3 text-xs font-bold transition-all relative flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'issues' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          Reported Issues ({issuesList.filter(i => i.status !== 'resolved').length} open)
          {activeTab === 'issues' && (
            <motion.div layoutId="activeAdminTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
          )}
        </button>
      </div>

      {/* CONTENT SWITCHER */}
      <AnimatePresence mode="wait">
        {activeTab === 'stats' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-panel p-4.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Traders</span>
                  <div className="w-8 h-8 rounded-lg bg-white/5 text-white border border-white/10 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white font-mono mt-2">{stats.totalUsers}</h3>
                <span className="text-[9px] text-slate-400 mt-1 block">Registered profiles</span>
              </div>

              <div className="glass-panel p-4.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active (30d)</span>
                  <div className="w-8 h-8 rounded-lg bg-white/5 text-white border border-white/10 flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white font-mono mt-2">{stats.activeUsers}</h3>
                <span className="text-[9px] text-accent-emerald font-bold mt-1 block font-mono">
                  {stats.totalUsers > 0 ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) : 0}% ratio
                </span>
              </div>

              <div className="glass-panel p-4.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Portfolios</span>
                  <div className="w-8 h-8 rounded-lg bg-white/5 text-white border border-white/10 flex items-center justify-center">
                    <Database className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white font-mono mt-2">{stats.totalPortfolios}</h3>
                <span className="text-[9px] text-slate-400 mt-1 block">Asset holdings recorded</span>
              </div>

              <div className="glass-panel p-4.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">AI Chats Filed</span>
                  <div className="w-8 h-8 rounded-lg bg-white/5 text-white border border-white/10 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white font-mono mt-2">{stats.totalAIChats}</h3>
                <span className="text-[9px] text-slate-400 mt-1 block font-mono">Queries processed by LLM</span>
              </div>
            </div>

            {/* Sub Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="glass-panel p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Watchlist Items</span>
                  <span className="text-lg font-bold text-white font-mono">{stats.totalWatchlists}</span>
                </div>
                <TrendingUp className="w-5 h-5 text-white opacity-40" />
              </div>
              <div className="glass-panel p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">AI Analyses Run</span>
                  <span className="text-lg font-bold text-white font-mono">{stats.totalAIAnalyses || 0}</span>
                </div>
                <Sparkles className="w-5 h-5 text-white opacity-40" />
              </div>
              <div className="glass-panel p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Price Alerts Set</span>
                  <span className="text-lg font-bold text-white font-mono">{stats.totalAlerts}</span>
                </div>
                <BadgeAlert className="w-5 h-5 text-slate-400 opacity-60" />
              </div>
              <div className="glass-panel p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Open Issues</span>
                  <span className="text-lg font-bold text-accent-rose font-mono">{issuesOverview.openIssues}</span>
                </div>
                <AlertCircle className="w-5 h-5 text-accent-rose opacity-60" />
              </div>
            </div>

            {/* Analytics Chart & Recent Users */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* AI Usage Analytics Area Chart */}
              <div className="glass-panel p-5 lg:col-span-2 space-y-4">
                <div>
                  <h3 className="font-bold text-base text-white">AI Assistant Co-Pilot Usage</h3>
                  <p className="text-xs text-slate-400">Total daily chat questions vs portfolio analyses generated.</p>
                </div>

                <div className="h-64 w-full">
                  {aiUsage.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={aiUsage} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorChats" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorAnalyses" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#888888" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#888888" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.015)" />
                        <XAxis 
                          dataKey="date" 
                          stroke="rgba(255,255,255,0.2)" 
                          fontSize={9}
                          tickLine={false}
                        />
                        <YAxis 
                          stroke="rgba(255,255,255,0.2)" 
                          fontSize={9}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0B0B0B', 
                            borderColor: 'rgba(255,255,255,0.08)',
                            borderRadius: '12px'
                          }} 
                          labelClassName="text-slate-500 text-xs font-mono"
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                        <Area 
                          name="LLM Chats" 
                          type="monotone" 
                          dataKey="chats" 
                          stroke="#FFFFFF" 
                          strokeWidth={1.5}
                          fillOpacity={1} 
                          fill="url(#colorChats)" 
                        />
                        <Area 
                          name="Portfolio Analyses" 
                          type="monotone" 
                          dataKey="analyses" 
                          stroke="#888888" 
                          strokeWidth={1.5}
                          fillOpacity={1} 
                          fill="url(#colorAnalyses)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                      No active AI usage records found over the past 14 days.
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Users List */}
              <div className="glass-panel p-5 flex flex-col space-y-4">
                <div>
                  <h3 className="font-bold text-base text-white">Recent Registrations</h3>
                  <p className="text-xs text-slate-400">Newly registered trading accounts.</p>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-64 pr-1">
                  {recentUsers.map(u => (
                    <div key={u._id} className="flex items-center justify-between p-2 rounded-lg bg-white/2 hover:bg-white/5 border border-white/5 transition-all">
                      <div className="flex items-center gap-2">
                        <img 
                          src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop'} 
                          alt="avatar" 
                          className="w-7 h-7 rounded-full border border-white/10"
                        />
                        <div className="text-left">
                          <span className="text-xs font-bold text-white block leading-tight">
                            {u.name || u.username || 'Anonymous'}
                          </span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                            <Mail className="w-3 h-3" /> {u.email}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-white uppercase font-mono">
                          {u.role}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono block mt-1">
                          {new Date(u.joinedDate || u.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-panel overflow-hidden"
          >
            <div className="p-5 border-b border-white/5 bg-white/2 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">System User Directory</h3>
                <p className="text-xs text-slate-400">Promote roles, inspect registration properties, or terminate user nodes.</p>
              </div>
              <span className="text-[10px] bg-white/5 text-white border border-white/10 px-2 py-1 rounded-md font-bold font-mono">
                {usersList.length} Accounts Active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/2 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="p-4">User</th>
                    <th className="p-4">Cash USD</th>
                    <th className="p-4">Joined Date</th>
                    <th className="p-4">Role</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => {
                    const isSelf = currentUser?._id === u._id;
                    return (
                      <tr key={u._id} className="border-b border-white/5 hover:bg-white/1 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={u.avatar} 
                              alt="" 
                              className="w-8 h-8 rounded-full border border-white/10"
                            />
                            <div>
                              <span className="font-bold text-white block">
                                {u.name || u.username} {isSelf && <span className="text-[9px] text-slate-400 font-bold">(You)</span>}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono block">{u.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-300">
                          ${(u.cashUSD || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 text-slate-400">
                          <span className="flex items-center gap-1.5 font-mono">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            {new Date(u.joinedDate || u.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                          </span>
                        </td>
                        <td className="p-4">
                          <select
                            value={u.role.toUpperCase()}
                            disabled={isSelf}
                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                            className="bg-dark-900 border border-white/10 rounded-lg text-slate-200 text-xs px-2 py-1 outline-none disabled:opacity-50 disabled:cursor-not-allowed font-semibold cursor-pointer"
                          >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {isSelf ? (
                              <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                                <ShieldCheck className="w-4 h-4 text-white" /> Primary Admin
                              </span>
                            ) : (
                              <button
                                onClick={() => handleDeleteUser(u._id, u.name || u.username || u.email, u.email)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                                title="Terminate user account"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'issues' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Summary counters for issues */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-panel p-4">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Total Reports</span>
                <span className="text-xl font-bold font-mono text-white mt-1 block">{issuesOverview.totalIssues}</span>
              </div>
              <div className="glass-panel p-4">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Open Issues</span>
                <span className="text-xl font-bold font-mono text-accent-rose mt-1 block">{issuesOverview.openIssues}</span>
              </div>
              <div className="glass-panel p-4">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">In-Progress</span>
                <span className="text-xl font-bold font-mono text-slate-400 mt-1 block">{issuesOverview.inProgressIssues}</span>
              </div>
              <div className="glass-panel p-4">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Resolved</span>
                <span className="text-xl font-bold font-mono text-accent-emerald mt-1 block">{issuesOverview.resolvedIssues}</span>
              </div>
            </div>

            {/* List of reported issues */}
            <div className="space-y-3">
              {issuesList.length > 0 ? (
                issuesList.map((issue) => (
                  <div 
                    key={issue._id} 
                    className="glass-panel p-4.5 flex flex-col md:flex-row md:items-start justify-between gap-4 text-left hover:border-white/10 transition-all"
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                          issue.status === 'open' ? 'bg-white/10 text-accent-rose border-white/5' :
                          issue.status === 'in-progress' ? 'bg-white/5 text-slate-400 border-white/5' :
                          'bg-white/10 text-accent-emerald border-white/5'
                        }`}>
                          {issue.status}
                        </span>
                        <h4 className="font-bold text-white text-sm truncate">{issue.title}</h4>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed font-sans">{issue.description}</p>

                      <div className="flex items-center gap-4 text-[10px] text-slate-400">
                        {issue.user ? (
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-white" />
                            Registered: {issue.user.name || issue.user.email}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <UserX className="w-3.5 h-3.5 text-slate-500" />
                            Guest Email: {issue.email}
                          </span>
                        )}
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {new Date(issue.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-center">
                      <label className="text-[10px] font-bold text-slate-400">Status:</label>
                      <select
                         value={issue.status}
                         onChange={(e) => handleIssueStatusChange(issue._id, e.target.value)}
                         className="bg-dark-900 border border-white/10 rounded-lg text-slate-200 text-xs px-2 py-1 outline-none font-semibold cursor-pointer"
                      >
                        <option value="open">Open</option>
                        <option value="in-progress">In-Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>
                  </div>
                ))
              ) : (
                <div className="glass-panel p-12 text-center text-slate-500 text-xs">
                  <HelpCircle className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  No customer reports or support issues have been submitted to the platform.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
