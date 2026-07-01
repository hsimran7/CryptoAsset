import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { usePriceStore } from '../store/usePriceStore';
import { 
  Bell, 
  Search, 
  LogOut, 
  LogIn, 
  UserPlus, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Menu,
  X,
  Mic,
  Sun,
  Moon,
  Languages
} from 'lucide-react';

export default function Navbar({ onToggleMobileMenu, mobileMenuOpen }) {
  const { 
    user, 
    coins, 
    notifications, 
    logoutUser, 
    markNotificationAsRead, 
    clearNotifications,
    t,
    theme,
    toggleTheme,
    language,
    changeLanguage,
    addToast
  } = useApp();
  const livePrices = usePriceStore((state) => state.prices);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  const navigate = useNavigate();
  const notifRef = useRef(null);
  const searchRef = useRef(null);
  const langRef = useRef(null);

  // Voice Command / Voice Search Handler
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addToast(t('voiceNotSupported'), 'error');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === 'es' ? 'es-ES' : language === 'fr' ? 'fr-FR' : language === 'de' ? 'de-DE' : 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      addToast(t('voiceSearchActive'), 'info');
    };

    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript.toLowerCase().trim();
      addToast(`Heard: "${speechToText}"`, 'info');

      // Command processing
      if (speechToText.includes('dashboard') || speechToText.includes('tablero') || speechToText.includes('tableau')) {
        navigate('/dashboard');
        addToast('Redirecting to Dashboard...', 'success');
      } else if (speechToText.includes('market') || speechToText.includes('mercado') || speechToText.includes('marché') || speechToText.includes('markt')) {
        navigate('/market');
        addToast('Redirecting to Market Feed...', 'success');
      } else if (speechToText.includes('portfolio') || speechToText.includes('portafolio') || speechToText.includes('portefeuille')) {
        navigate('/portfolio');
        addToast('Redirecting to Portfolio...', 'success');
      } else if (speechToText.includes('profile') || speechToText.includes('perfil') || speechToText.includes('profil')) {
        navigate('/profile');
        addToast('Redirecting to Profile...', 'success');
      } else if (speechToText.includes('light theme') || speechToText.includes('light mode') || speechToText.includes('modo claro') || speechToText.includes('thème clair')) {
        if (theme === 'dark') toggleTheme();
      } else if (speechToText.includes('dark theme') || speechToText.includes('dark mode') || speechToText.includes('modo oscuro') || speechToText.includes('thème sombre')) {
        if (theme === 'light') toggleTheme();
      } else {
        // Fallback to text search
        setSearchQuery(speechToText);
        setShowSearchDropdown(true);
      }
    };

    recognition.onerror = (event) => {
      console.error('[Speech Recognition Error]', event.error);
      setIsListening(false);
      addToast('Voice command capture failed or timed out.', 'warning');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const searchResults = searchQuery.trim().length > 0
    ? coins.filter(
        c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
             c.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
      if (langRef.current && !langRef.current.contains(event.target)) {
        setShowLangDropdown(false);
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
            placeholder={t('shortcutTip')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(e.target.value.trim().length > 0);
            }}
            onFocus={() => {
              if (searchQuery.trim().length > 0) {
                setShowSearchDropdown(true);
              }
            }}
            className="w-full pl-9 pr-10 py-1.5 text-xs glass-input focus:ring-1 focus:ring-indigo-500"
          />
          <button
            onClick={startListening}
            className={`absolute inset-y-0 right-3 flex items-center transition-all ${
              isListening ? 'text-rose-500 animate-pulse' : 'text-slate-400 hover:text-white'
            }`}
            title="Search by voice / say commands"
          >
            <Mic className="w-4 h-4" />
          </button>

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
                    <span className={`flex items-center text-[10px] font-bold ${coin.change24h >= 0 ? 'text-accent-emerald' : 'text-accent-rose'}`}>
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
          const liveData = livePrices[coin.id] || { price: coin.price, change24h: coin.change24h, status: 'same' };
          const isUp = liveData.change24h >= 0;
          
          let flashClass = '';
          if (liveData.status === 'up') flashClass = 'price-flash-up';
          else if (liveData.status === 'down') flashClass = 'price-flash-down';

          return (
            <Link 
              key={coin.id} 
              to={`/coin/${coin.id}`} 
              className="flex items-center gap-2 hover:bg-white/5 py-1 px-2.5 rounded transition-all whitespace-nowrap"
            >
              <span className="font-bold text-slate-300">{coin.symbol}</span>
              <span className={`text-white font-mono font-semibold transition-all ${flashClass}`}>
                ${liveData.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className={`flex items-center font-bold ${isUp ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                {isUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                {isUp ? '+' : ''}{liveData.change24h.toFixed(2)}%
              </span>
            </Link>
          );
        })}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Language Dropdown Selector */}
        <div ref={langRef} className="relative">
          <button
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors flex items-center gap-1"
            title="Change Language"
          >
            <Languages className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase">{language}</span>
          </button>
          {showLangDropdown && (
            <>
              <div 
                onClick={() => setShowLangDropdown(false)}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[18px]"
              />
              <div className="absolute right-0 top-11 w-32 glass-panel rounded-xl shadow-2xl border border-white/10 p-1.5 z-55 text-left">
                <button onClick={() => { changeLanguage('en'); setShowLangDropdown(false); }} className="w-full text-left text-xs font-semibold px-2 py-1.5 hover:bg-white/5 rounded-lg text-slate-300 hover:text-white">English</button>
                <button onClick={() => { changeLanguage('es'); setShowLangDropdown(false); }} className="w-full text-left text-xs font-semibold px-2 py-1.5 hover:bg-white/5 rounded-lg text-slate-300 hover:text-white">Español</button>
                <button onClick={() => { changeLanguage('fr'); setShowLangDropdown(false); }} className="w-full text-left text-xs font-semibold px-2 py-1.5 hover:bg-white/5 rounded-lg text-slate-300 hover:text-white">Français</button>
                <button onClick={() => { changeLanguage('de'); setShowLangDropdown(false); }} className="w-full text-left text-xs font-semibold px-2 py-1.5 hover:bg-white/5 rounded-lg text-slate-300 hover:text-white">Deutsch</button>
              </div>
            </>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          title="Toggle Dark/Light Mode"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-slate-400" />}
        </button>

        {/* Notifications Dropdown Toggle */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white relative transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 bg-white text-black font-bold text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center border border-black">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div 
                onClick={() => setShowNotifications(false)}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[18px]"
              />
              <div className="absolute right-0 top-11 w-80 glass-panel rounded-xl shadow-2xl border border-white/10 p-2 z-50 text-left">
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                <span className="font-bold text-xs text-white">Notifications ({unreadCount})</span>
                {notifications.length > 0 && (
                  <button 
                    onClick={clearNotifications}
                    className="text-[10px] text-slate-400 hover:text-white hover:underline"
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
                        notif.read ? 'opacity-60' : 'bg-white/2 border-l-2 border-white'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-bold text-xs text-white flex items-center gap-1.5">
                          {notif.type === 'ai' && <Sparkles className="w-3.5 h-3.5 text-white" />}
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
          </>
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
