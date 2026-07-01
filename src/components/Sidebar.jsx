import React, { useState } from 'react';
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
  const [isHovered, setIsHovered] = useState(false);

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

  const showAdmin = user && user.role && user.role.toUpperCase() === 'ADMIN';
  const isExpanded = !collapsed || isHovered;

  return (
    <aside 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`glass-panel border-r border-white/5 h-screen sticky top-0 flex flex-col z-30 transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-64 shadow-2xl backdrop-blur-xl' : 'w-20'
      }`}
    >
      {/* Sidebar Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
        <Link to="/" className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8.5 h-8.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
            <Eye className="w-4.5 h-4.5 text-white" />
          </div>
          {isExpanded && (
            <span className="font-sans font-bold text-sm tracking-tight text-white whitespace-nowrap">
              CryptoVision <span className="text-[10px] text-slate-400 font-mono align-super">AI</span>
            </span>
          )}
        </Link>
        {isExpanded && (
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
                  ? 'bg-white/10 text-white font-medium border-l-2 border-white' 
                  : item.highlight 
                    ? 'text-slate-300 hover:bg-white/5 hover:text-white' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isExpanded ? 'mr-3' : 'mx-auto'}`} />
              
              {isExpanded && (
                <span className="text-xs font-semibold tracking-wide">
                  {displayName}
                </span>
              )}

              {/* Collapsed Tooltip */}
              {!isExpanded && (
                <span className="absolute left-20 scale-0 group-hover:scale-100 bg-black/90 border border-white/10 px-2 py-1 rounded text-[10px] text-white z-30 transition-transform origin-left pointer-events-none whitespace-nowrap shadow-lg">
                  {displayName}
                </span>
              )}

              {/* Alert Badge */}
              {item.badge && isExpanded && (
                <span className="ml-auto bg-white text-black font-bold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
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
                ? 'bg-white/10 text-white font-medium border-l-2 border-white' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <ShieldAlert className={`w-5 h-5 flex-shrink-0 ${isExpanded ? 'mr-3' : 'mx-auto'}`} />
            {isExpanded && <span className="text-xs font-semibold tracking-wide">{t('adminPanel')}</span>}
            
            {!isExpanded && (
              <span className="absolute left-20 scale-0 group-hover:scale-100 bg-black/90 border border-white/10 px-2 py-1 rounded text-[10px] text-white z-30 transition-transform origin-left pointer-events-none whitespace-nowrap shadow-lg">
                {t('adminPanel')}
              </span>
            )}
          </Link>
        )}

        {/* PWA Install Trigger Button */}
        {isInstallable && (
          <button
            onClick={installApp}
            className="w-full flex items-center relative group rounded-lg p-2.5 transition-all duration-200 text-slate-300 hover:bg-white/5 border border-white/10 mt-2 font-sans cursor-pointer"
          >
            <Download className={`w-5 h-5 flex-shrink-0 ${isExpanded ? 'mr-3' : 'mx-auto'}`} />
            {isExpanded && <span className="text-xs font-semibold tracking-wide text-left">Install Terminal</span>}
            
            {!isExpanded && (
              <span className="absolute left-20 scale-0 group-hover:scale-100 bg-black/90 border border-white/10 px-2 py-1 rounded text-[10px] text-white z-30 transition-transform origin-left pointer-events-none whitespace-nowrap shadow-lg">
                Install Terminal
              </span>
            )}
          </button>
        )}
      </nav>

      {/* User Status Bar */}
      {user && (
        <div className="p-3.5 border-t border-white/5 bg-black/20 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <img 
              src={user.avatar} 
              alt="avatar" 
              className="w-7.5 h-7.5 rounded-full border border-white/10" 
            />
            {isExpanded && (
              <div className="flex flex-col text-left overflow-hidden">
                <span className="text-xs font-semibold text-white truncate">{user.username}</span>
                <span className="text-[9px] text-slate-500 truncate capitalize">{user.role.toLowerCase()}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
