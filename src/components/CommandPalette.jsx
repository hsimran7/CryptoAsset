import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Search, 
  Terminal, 
  Sun, 
  Moon, 
  Sliders, 
  DollarSign, 
  User, 
  TrendingUp, 
  ShieldAlert, 
  X,
  Languages,
  ChevronRight
} from 'lucide-react';

export default function CommandPalette({ isOpen, onClose }) {
  const { 
    coins, 
    theme, 
    toggleTheme, 
    mode, 
    toggleMode, 
    changeLanguage, 
    t, 
    user 
  } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Focus input on mount
  useEffect(() => {
    if (isOpen) {
      const handle = setTimeout(() => {
        setSearch('');
        setSelectedIndex(0);
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(handle);
    }
  }, [isOpen]);

  // List of constant action items
  const navigationItems = [
    { name: 'Go to Dashboard', action: () => navigate('/dashboard'), icon: <TrendingUp className="w-4 h-4 text-indigo-400" /> },
    { name: 'Go to Market Feed', action: () => navigate('/market'), icon: <TrendingUp className="w-4 h-4 text-emerald-400" /> },
    { name: 'Go to Portfolio Ledger', action: () => navigate('/portfolio'), icon: <DollarSign className="w-4 h-4 text-cyan-400" /> },
    { name: 'Go to Profile Settings', action: () => navigate('/profile'), icon: <User className="w-4 h-4 text-violet-400" /> },
    { name: 'Go to AI Chat Assistant', action: () => navigate('/ai-assistant'), icon: <Terminal className="w-4 h-4 text-pink-400" /> },
  ];

  if (user && user.role && user.role.toUpperCase() === 'ADMIN') {
    navigationItems.push({
      name: 'Go to Admin Panel',
      action: () => navigate('/admin'),
      icon: <ShieldAlert className="w-4 h-4 text-rose-400" />
    });
  }

  const actionItems = [
    { 
      name: `Toggle Theme (Current: ${theme === 'dark' ? 'Dark' : 'Light'})`, 
      action: () => { toggleTheme(); onClose(); }, 
      icon: theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" /> 
    },
    { 
      name: `Toggle Mode (Current: ${mode === 'beginner' ? 'Beginner' : 'Pro'})`, 
      action: () => { toggleMode(); onClose(); }, 
      icon: <Sliders className="w-4 h-4 text-rose-400" /> 
    },
    { 
      name: 'Change Language to Spanish', 
      action: () => { changeLanguage('es'); onClose(); }, 
      icon: <Languages className="w-4 h-4 text-teal-400" /> 
    },
    { 
      name: 'Change Language to English', 
      action: () => { changeLanguage('en'); onClose(); }, 
      icon: <Languages className="w-4 h-4 text-teal-400" /> 
    }
  ];

  // Coin Items mapping
  const coinItems = coins.map(c => ({
    name: `Analyze ${c.name} (${c.symbol})`,
    action: () => navigate(`/coin/${c.id}`),
    icon: c.image ? (
      <img src={c.image} alt={c.symbol} className="w-4 h-4 rounded-full" />
    ) : (
      <TrendingUp className="w-4 h-4 text-indigo-400" />
    )
  }));

  // Combine items
  const allItems = [...navigationItems, ...actionItems, ...coinItems];

  // Filter items based on search query
  const filteredItems = search.trim() === ''
    ? allItems.slice(0, 8)
    : allItems.filter(item => 
        item.name.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 8);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-55 flex items-start justify-center pt-24 px-4 bg-dark-950/80 backdrop-blur-sm">
      <div 
        onClick={onClose} 
        className="fixed inset-0 cursor-default" 
      />
      <div className="w-full max-w-lg glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-3xl flex flex-col z-10 text-left">
        {/* Search header */}
        <div className="flex items-center gap-3 p-4 border-b border-white/5 bg-white/2">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder={t('shortcutTip')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent border-none text-white focus:outline-none text-sm placeholder-slate-500"
          />
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results list */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left text-xs font-semibold font-sans ${
                    isSelected 
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/25' 
                      : 'text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span>{item.name}</span>
                  </div>
                  {isSelected && <ChevronRight className="w-4 h-4 text-indigo-400 animate-pulse" />}
                </button>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs font-sans">
              No actions or coins match your search parameters.
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="p-3 border-t border-white/5 bg-white/2 flex justify-between items-center text-[10px] text-slate-400 font-mono">
          <div className="flex gap-2">
            <span>↑↓ to navigate</span>
            <span>•</span>
            <span>↵ to select</span>
          </div>
          <div>ESC to close</div>
        </div>
      </div>
    </div>
  );
}
