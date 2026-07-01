import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Briefcase, 
  Star, 
  Bot, 
  Sliders, 
  Bell, 
  FileText, 
  User, 
  ShieldAlert, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  GitCompare,
  Download
} from 'lucide-react';

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, alerts, t, isInstallable, installApp } = useApp();
  const location = useLocation();

  const activeAlertsCount = alerts.filter(a => a.isActive).length;

  const menuItems = [
    { key: 'dashboard', path: '/dashboard', icon: LayoutDashboard },
    { key: 'market', path: '/market', icon: TrendingUp },
    { key: 'portfolio', path: '/portfolio', icon: Briefcase },
    { key: 'watchlist', path: '/watchlist', icon: Star },
    { key: 'aiAssistant', path: '/ai-assistant', icon: Bot, highlight: true },
    { key: 'aiAnalyzer',  path: '/ai-analyzer',  icon: Sliders },
    { key: 'compareCoins',path: '/compare',       icon: GitCompare },
    { key: 'alerts',       path: '/alerts',        icon: Bell, badge: activeAlertsCount > 0 ? activeAlertsCount : null },
    { key: 'reports', path: '/reports', icon: FileText },
    { key: 'profile', path: '/profile', icon: User },
  ];

  // If user is Admin or username is empty (let's display Admin anyway or dynamically based on user role)
  const showAdmin = user && user.role && user.role.toUpperCase() === 'ADMIN';

  return (
    <aside 
      className={`glass-panel border-r border-white/5 h-screen sticky top-0 flex flex-col z-20 transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Sidebar Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
        <Link to="/" className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center flex-shrink-0 neon-border-indigo">
            <Eye className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="font-display font-bold text-base bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent tracking-wide whitespace-nowrap">
              CryptoVision <span className="text-xs text-indigo-400 align-super">AI</span>
            </span>
          )}
        </Link>
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const displayName = t(item.key);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center relative group rounded-lg p-2.5 transition-all duration-200 ${
                isActive 
                  ? 'bg-indigo-600/15 text-indigo-400 border-l-[3px] border-indigo-500' 
                  : item.highlight 
                    ? 'text-violet-400 hover:bg-violet-600/10' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className={`w-5.5 h-5.5 flex-shrink-0 ${collapsed ? 'mx-auto' : 'mr-3'}`} />
              
              {!collapsed && (
                <span className="text-sm font-medium tracking-wide">
                  {displayName}
                </span>
              )}

              {/* Collapsed Tooltip */}
              {collapsed && (
                <span className="absolute left-20 scale-0 group-hover:scale-100 bg-dark-900 border border-white/10 px-2 py-1 rounded text-xs text-white z-30 transition-transform origin-left pointer-events-none whitespace-nowrap shadow-lg">
                  {displayName}
                </span>
              )}

              {/* Alert Badge */}
              {item.badge && !collapsed && (
                <span className="ml-auto bg-indigo-600 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
              {item.badge && collapsed && (
                <span className="absolute top-1 right-3 bg-indigo-600 w-2.5 h-2.5 rounded-full border border-dark-950" />
              )}
            </Link>
          );
        })}

        {/* Admin Link Override */}
        {showAdmin && (
          <Link
            to="/admin"
            className={`flex items-center relative group rounded-lg p-2.5 transition-all duration-200 ${
              location.pathname === '/admin'
                ? 'bg-rose-600/15 text-rose-400 border-l-[3px] border-rose-500' 
                : 'text-rose-400/80 hover:bg-rose-600/10 hover:text-rose-400'
            }`}
          >
            <ShieldAlert className={`w-5.5 h-5.5 flex-shrink-0 ${collapsed ? 'mx-auto' : 'mr-3'}`} />
            {!collapsed && <span className="text-sm font-medium">{t('adminPanel')}</span>}
            
            {collapsed && (
              <span className="absolute left-20 scale-0 group-hover:scale-100 bg-dark-900 border border-white/10 px-2 py-1 rounded text-xs text-rose-400 z-30 transition-transform origin-left pointer-events-none whitespace-nowrap shadow-lg">
                {t('adminPanel')}
              </span>
            )}
          </Link>
        )}

        {/* PWA Install Trigger Button */}
        {isInstallable && (
          <button
            onClick={installApp}
            className="w-full flex items-center relative group rounded-lg p-2.5 transition-all duration-200 text-indigo-400 hover:bg-indigo-600/10 border border-indigo-500/10 mt-2 font-sans cursor-pointer"
          >
            <Download className={`w-5.5 h-5.5 flex-shrink-0 ${collapsed ? 'mx-auto' : 'mr-3'}`} />
            {!collapsed && <span className="text-sm font-semibold tracking-wide text-left">Install Terminal</span>}
            
            {collapsed && (
              <span className="absolute left-20 scale-0 group-hover:scale-100 bg-dark-900 border border-white/10 px-2 py-1 rounded text-xs text-indigo-400 z-30 transition-transform origin-left pointer-events-none whitespace-nowrap shadow-lg">
                Install Terminal
              </span>
            )}
          </button>
        )}
      </nav>

      {/* User Status Bar */}
      {user && (
        <div className="p-3 border-t border-white/5 bg-dark-900/30 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <img 
              src={user.avatar} 
              alt="avatar" 
              className="w-8 h-8 rounded-full border border-white/10" 
            />
            {!collapsed && (
              <div className="flex flex-col text-left overflow-hidden">
                <span className="text-xs font-semibold text-white truncate">{user.username}</span>
                <span className="text-[10px] text-slate-400 truncate capitalize">{user.role.toLowerCase()}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
