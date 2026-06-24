import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Bell, 
  Search, 
  LogOut, 
  LogIn, 
  UserPlus, 
  Check, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Menu,
  X
} from 'lucide-react';

export default function Navbar({ onToggleMobileMenu, mobileMenuOpen }) {
  const { user, coins, notifications, logoutUser, markNotificationAsRead, clearNotifications } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const navigate = useNavigate();
  const notifRef = useRef(null);
  const searchRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Search filter implementation
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const filtered = coins.filter(
        c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
             c.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);
      setSearchResults(filtered);
      setShowSearchDropdown(true);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  }, [searchQuery, coins]);

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchResultClick = (coinId) => {
    navigate(`/coin/${coinId}`);
    setSearchQuery('');
    setShowSearchDropdown(false);
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  return (
    <header className="glass-panel border-b border-white/5 h-16 sticky top-0 flex items-center justify-between px-4 md:px-6 z-10 w-full">
      {/* Left section: Mobile menu trigger & search */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <button 
          onClick={onToggleMobileMenu}
          className="md:hidden p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Search Input Bar */}
        <div ref={searchRef} className="relative hidden sm:block w-full">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search coin details, tickers, pairs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs glass-input focus:ring-1 focus:ring-indigo-500"
          />

          {/* Search Results Dropdown */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute top-11 left-0 right-0 glass-panel rounded-lg shadow-2xl border border-white/10 p-2 text-left z-55">
              <div className="text-[10px] font-semibold text-slate-500 px-2.5 py-1 uppercase tracking-wider">Cryptocurrencies</div>
              {searchResults.map((coin) => (
                <button
                  key={coin.id}
                  onClick={() => handleSearchResultClick(coin.id)}
                  className="w-full flex items-center justify-between px-2.5 py-2 hover:bg-white/5 rounded-md text-left transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{coin.symbol}</span>
                    <span className="text-slate-400 text-[11px]">{coin.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-200">${coin.price.toLocaleString()}</span>
                    <span className={`flex items-center text-[10px] font-bold ${coin.change24h >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {coin.change24h >= 0 ? '+' : ''}{coin.change24h}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ticking Ticker tape slider (Mid portion) */}
      <div className="hidden lg:flex items-center gap-6 overflow-hidden mx-6 flex-1 max-w-lg select-none text-[11px]">
        {coins.slice(0, 3).map((coin) => {
          const isUp = coin.change24h >= 0;
          return (
            <Link 
              key={coin.id} 
              to={`/coin/${coin.id}`} 
              className="flex items-center gap-2 hover:bg-white/5 py-1 px-2.5 rounded transition-all whitespace-nowrap"
            >
              <span className="font-bold text-slate-300">{coin.symbol}</span>
              <span className="text-white font-mono font-semibold">${coin.price.toLocaleString()}</span>
              <span className={`flex items-center font-bold ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                {isUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                {isUp ? '+' : ''}{coin.change24h}%
              </span>
            </Link>
          );
        })}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        {/* Notifications Dropdown Toggle */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white relative transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1.5 bg-rose-500 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-11 w-80 glass-panel rounded-xl shadow-2xl border border-white/10 p-2 z-50 text-left">
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                <span className="font-bold text-xs text-white">Notifications ({unreadCount})</span>
                {notifications.length > 0 && (
                  <button 
                    onClick={clearNotifications}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto py-1 space-y-1">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">No new alerts</div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => markNotificationAsRead(notif.id)}
                      className={`p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors ${
                        notif.read ? 'opacity-60' : 'bg-indigo-500/5 border-l-2 border-indigo-500'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-bold text-xs text-white flex items-center gap-1.5">
                          {notif.type === 'ai' && <Sparkles className="w-3.5 h-3.5 text-violet-400" />}
                          {notif.title}
                        </span>
                        <span className="text-[9px] text-slate-500">{notif.time}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account Controls */}
        {user ? (
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs font-semibold text-slate-300">
              {user.username}
            </span>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-rose-400 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link 
              to="/login" 
              className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all flex items-center gap-1"
            >
              <LogIn className="w-3.5 h-3.5" /> Login
            </Link>
            <Link 
              to="/register" 
              className="btn-premium-indigo text-xs px-3 py-1.5 flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" /> Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
