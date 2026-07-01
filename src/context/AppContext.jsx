import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiRequest } from '../utils/api';

const AppContext = createContext();

const INITIAL_COINS = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', price: 67240.50, change24h: 2.45, marketCap: 1320000000000, volume24h: 28400000000, high24h: 68100.00, low24h: 65120.00, supply: 19710000, sparkline: [65.1, 65.8, 65.4, 66.2, 65.9, 66.8, 67.24], category: 'Layer 1', desc: 'The original decentralized cryptocurrency.' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', price: 3512.20, change24h: -1.15, marketCap: 421000000000, volume24h: 15100000000, high24h: 3620.50, low24h: 3450.10, supply: 120100000, sparkline: [36.2, 35.8, 35.9, 35.5, 35.7, 35.3, 35.12], category: 'Layer 1', desc: 'A decentralized, open-source blockchain with smart contract functionality.' },
  { id: 'solana', name: 'Solana', symbol: 'SOL', price: 148.75, change24h: 6.82, marketCap: 68000000000, volume24h: 3800000000, high24h: 152.40, low24h: 138.20, supply: 462000000, sparkline: [13.8, 14.1, 14.0, 14.4, 14.3, 14.6, 14.88], category: 'Layer 1', desc: 'A high-performance blockchain supporting builders globally.' },
  { id: 'binancecoin', name: 'BNB', symbol: 'BNB', price: 582.40, change24h: 0.85, marketCap: 87000000000, volume24h: 1200000000, high24h: 588.10, low24h: 574.90, supply: 147000000, sparkline: [57.4, 57.8, 58.1, 57.9, 58.2, 58.0, 58.24], category: 'Layer 1', desc: 'The native cryptocurrency of the Binance smart chain ecosystem.' },
  { id: 'cardano', name: 'Cardano', symbol: 'ADA', price: 0.465, change24h: -2.35, marketCap: 16500000000, volume24h: 340000000, high24h: 0.482, low24h: 0.458, supply: 35600000000, sparkline: [0.48, 0.47, 0.48, 0.47, 0.46, 0.47, 0.465], category: 'Layer 1', desc: 'A blockchain platform for changemakers, innovators, and visionaries.' },
  { id: 'polkadot', name: 'Polkadot', symbol: 'DOT', price: 6.12, change24h: -0.45, marketCap: 8800000000, volume24h: 180000000, high24h: 6.25, low24h: 6.02, supply: 1430000000, sparkline: [6.2, 6.1, 6.2, 6.0, 6.1, 6.0, 6.12], category: 'Layer 1', desc: 'Sharded blockchain connecting multiple specialized chains in one network.' },
  { id: 'chainlink', name: 'Chainlink', symbol: 'LINK', price: 15.35, change24h: 4.12, marketCap: 9000000000, volume24h: 420000000, high24h: 15.60, low24h: 14.65, supply: 587000000, sparkline: [14.6, 14.8, 14.7, 15.1, 14.9, 15.2, 15.35], category: 'DeFi', desc: 'Decentralized oracle network connecting smart contracts with real-world data.' },
  { id: 'ripple', name: 'Ripple', symbol: 'XRP', price: 0.495, change24h: 0.15, marketCap: 27000000000, volume24h: 890000000, high24h: 0.505, low24h: 0.488, supply: 55000000000, sparkline: [0.49, 0.50, 0.49, 0.50, 0.49, 0.49, 0.495], category: 'Layer 1', desc: 'Global payments network facilitating instant cross-border settlement.' },
  { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE', price: 0.138, change24h: 8.54, marketCap: 20000000000, volume24h: 1800000000, high24h: 0.142, low24h: 0.125, supply: 144000000000, sparkline: [1.25, 1.28, 1.30, 1.27, 1.32, 1.35, 1.38], category: 'Meme', desc: 'An open-source peer-to-peer cryptocurrency, favored by Shiba Inus worldwide.' },
  { id: 'shiba-inu', name: 'Shiba Inu', symbol: 'SHIB', price: 0.0000215, change24h: 5.12, marketCap: 12600000000, volume24h: 780000000, high24h: 0.0000222, low24h: 0.0000201, supply: 589000000000000, sparkline: [2.01, 2.05, 2.10, 2.03, 2.12, 2.09, 2.15], category: 'Meme', desc: 'A decentralized, community-led currency held by millions of users.' },
  { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX', price: 32.80, change24h: -1.95, marketCap: 12800000000, volume24h: 310000000, high24h: 33.90, low24h: 32.10, supply: 392000000, sparkline: [33.9, 33.5, 33.2, 32.8, 33.0, 32.5, 32.8], category: 'Layer 1', desc: 'An umbrella platform for launching decentralized finance applications.' },
  { id: 'near-protocol', name: 'Near Protocol', symbol: 'NEAR', price: 5.92, change24h: 7.21, marketCap: 6400000000, volume24h: 510000000, high24h: 6.10, low24h: 5.48, supply: 1080000000, sparkline: [5.48, 5.60, 5.55, 5.82, 5.70, 5.88, 5.92], category: 'Layer 1', desc: 'A community-run cloud computing platform designed for usability.' },
  { id: 'lido-dao', name: 'Lido DAO', symbol: 'LDO', price: 1.88, change24h: -3.40, marketCap: 1680000000, volume24h: 98000000, high24h: 1.96, low24h: 1.84, supply: 890000000, sparkline: [1.96, 1.92, 1.94, 1.89, 1.91, 1.86, 1.88], category: 'DeFi', desc: 'Liquid staking solution for Ethereum backed by several industry-leading providers.' },
  { id: 'fetch-ai', name: 'FET', symbol: 'FET', price: 1.62, change24h: 12.45, marketCap: 4100000000, volume24h: 890000000, high24h: 1.68, low24h: 1.42, supply: 2500000000, sparkline: [1.42, 1.48, 1.45, 1.54, 1.51, 1.58, 1.62], category: 'AI', desc: 'Decentralized machine learning network mapping coordinates for smart agents.' },
  { id: 'render', name: 'RNDR', symbol: 'RNDR', price: 8.15, change24h: 9.35, marketCap: 3100000000, volume24h: 410000000, high24h: 8.32, low24h: 7.42, supply: 388000000, sparkline: [7.42, 7.65, 7.50, 7.88, 7.72, 8.05, 8.15], category: 'AI', desc: 'Distributed GPU rendering network built on the Ethereum blockchain.' }
];

const INITIAL_PORTFOLIO = {
  balanceUSD: 145820.75,
  cashUSD: 12500.00,
  holdings: [
    { symbol: 'BTC', amount: 1.25, avgBuyPrice: 62100.00 },
    { symbol: 'ETH', amount: 8.50, avgBuyPrice: 3150.00 },
    { symbol: 'SOL', amount: 120.00, avgBuyPrice: 115.50 },
    { symbol: 'LINK', amount: 250.00, avgBuyPrice: 12.80 },
    { symbol: 'FET', amount: 1500.00, avgBuyPrice: 1.10 }
  ],
  transactions: [
    { id: 't1', type: 'BUY', symbol: 'BTC', amount: 0.5, price: 61500.00, date: '2026-05-18T10:30:00Z' },
    { id: 't2', type: 'BUY', symbol: 'ETH', amount: 3.0, price: 3080.00, date: '2026-05-20T14:45:00Z' },
    { id: 't3', type: 'SELL', symbol: 'SOL', amount: 30.0, price: 142.00, date: '2026-06-01T09:15:00Z' },
    { id: 't4', type: 'DEPOSIT', symbol: 'USD', amount: 5000.0, price: 1.0, date: '2026-06-05T16:00:00Z' },
    { id: 't5', type: 'BUY', symbol: 'FET', amount: 1500.0, price: 1.10, date: '2026-06-08T11:20:00Z' }
  ]
};

const INITIAL_ALERTS = [
  { id: 'a1', symbol: 'BTC', type: 'ABOVE', value: 70000, isActive: true, createdAt: '2026-06-01T12:00:00Z' },
  { id: 'a2', symbol: 'ETH', type: 'BELOW', value: 34000, isActive: true, createdAt: '2026-06-05T15:30:00Z' },
  { id: 'a3', symbol: 'SOL', type: 'ABOVE', value: 160, isActive: false, createdAt: '2026-06-08T09:00:00Z' }
];

const TRANSLATIONS = {
  en: {
    dashboard: 'Dashboard',
    market: 'Market',
    portfolio: 'Portfolio',
    watchlist: 'Watchlist',
    aiAssistant: 'AI Assistant',
    aiAnalyzer: 'AI Analyzer',
    compareCoins: 'Compare Coins',
    alerts: 'Alerts',
    reports: 'Reports',
    profile: 'Profile',
    adminPanel: 'Admin Panel',
    logout: 'Logout',
    login: 'Login',
    signUp: 'Sign Up',
    netPortfolioValue: 'Net Portfolio Value',
    totalInvested: 'Total Invested Cost',
    totalProfitLoss: 'Total Profit / Loss',
    roiPercentage: 'ROI Percentage',
    assetAllocation: 'Asset Allocation',
    investedVsCurrent: 'Invested Capital vs Current Valuation',
    activeHoldings: 'Active Holdings Ledger',
    addAssetEntry: 'Add Asset Entry',
    beginnerMode: 'Beginner Mode',
    proMode: 'Pro Mode',
    beginnerDesc: 'Showing simple summaries and definitions.',
    proDesc: 'Showing complex charts and financial indicators.',
    voiceSearchActive: 'Listening for voice command...',
    voiceSearchTip: 'Try saying: "go to market" or "toggle theme"',
    voiceNotSupported: 'Speech recognition is not supported in this browser.',
    shortcutTip: 'Press ⌘K or Ctrl+K to open command palette'
  },
  es: {
    dashboard: 'Tablero',
    market: 'Mercado',
    portfolio: 'Portafolio',
    watchlist: 'Lista de seguimiento',
    aiAssistant: 'Asistente de IA',
    aiAnalyzer: 'Analizador de IA',
    compareCoins: 'Comparar monedas',
    alerts: 'Alertas',
    reports: 'Informes',
    profile: 'Perfil',
    adminPanel: 'Panel de administración',
    logout: 'Cerrar sesión',
    login: 'Iniciar sesión',
    signUp: 'Registrarse',
    netPortfolioValue: 'Valor neto de la cartera',
    totalInvested: 'Costo total invertido',
    totalProfitLoss: 'Ganancia / Pérdida total',
    roiPercentage: 'Porcentaje de ROI',
    assetAllocation: 'Asignación de activos',
    investedVsCurrent: 'Capital invertido vs Valoración actual',
    activeHoldings: 'Libro de cartera activo',
    addAssetEntry: 'Agregar activo',
    beginnerMode: 'Modo principiante',
    proMode: 'Modo profesional',
    beginnerDesc: 'Mostrando resúmenes y definiciones simples.',
    proDesc: 'Mostrando gráficos complejos e indicadores financieros.',
    voiceSearchActive: 'Escuchando comando de voz...',
    voiceSearchTip: 'Prueba a decir: "ir al mercado" o "cambiar tema"',
    voiceNotSupported: 'El reconocimiento de voz no es compatible con este navegador.',
    shortcutTip: 'Presiona ⌘K o Ctrl+K para abrir la paleta de comandos'
  },
  fr: {
    dashboard: 'Tableau de bord',
    market: 'Marché',
    portfolio: 'Portefeuille',
    watchlist: 'Liste de surveillance',
    aiAssistant: 'Assistant IA',
    aiAnalyzer: 'Analyseur IA',
    compareCoins: 'Comparer les pièces',
    alerts: 'Alertes',
    reports: 'Rapports',
    profile: 'Profil',
    adminPanel: 'Panneau d\'administration',
    logout: 'Déconnexion',
    login: 'Connexion',
    signUp: 'S\'inscrire',
    netPortfolioValue: 'Valeur nette du portefeuille',
    totalInvested: 'Coût total investi',
    totalProfitLoss: 'Bénéfice / perte total',
    roiPercentage: 'Pourcentage de ROI',
    assetAllocation: 'Allocation d\'actifs',
    investedVsCurrent: 'Capital investi vs Valorisation actuelle',
    activeHoldings: 'Registre des avoirs actifs',
    addAssetEntry: 'Ajouter une entrée',
    beginnerMode: 'Mode débutant',
    proMode: 'Mode pro',
    beginnerDesc: 'Affichage de résumés simples et de définitions.',
    proDesc: 'Affichage de graphiques complexes et d\'indicateurs financiers.',
    voiceSearchActive: 'Écoute de la commande vocale...',
    voiceSearchTip: 'Dites par exemple : "aller au marché" ou "changer de thème"',
    voiceNotSupported: 'La reconnaissance vocale n\'est pas prise en charge par ce navigateur.',
    shortcutTip: 'Appuyez sur ⌘K ou Ctrl+K pour ouvrir la palette de commandes'
  },
  de: {
    dashboard: 'Dashboard',
    market: 'Markt',
    portfolio: 'Portfolio',
    watchlist: 'Beobachtungsliste',
    aiAssistant: 'KI-Assistent',
    aiAnalyzer: 'KI-Analysator',
    compareCoins: 'Münzen vergleichen',
    alerts: 'Benachrichtigungen',
    reports: 'Berichte',
    profile: 'Profil',
    adminPanel: 'Admin-Bereich',
    logout: 'Abmelden',
    login: 'Anmelden',
    signUp: 'Registrieren',
    netPortfolioValue: 'Netto-Portfoliowert',
    totalInvested: 'Investierte Gesamtkosten',
    totalProfitLoss: 'Gesamtgewinn / -verlust',
    roiPercentage: 'ROI-Prozentsatz',
    assetAllocation: 'Anlagenaufteilung',
    investedVsCurrent: 'Investiertes Kapital vs. Aktuelle Bewertung',
    activeHoldings: 'Aktives Bestandsbuch',
    addAssetEntry: 'Anlage hinzufügen',
    beginnerMode: 'Einsteiger-Modus',
    proMode: 'Profi-Modus',
    beginnerDesc: 'Zeigt einfache Zusammenfassungen und Definitionen.',
    proDesc: 'Zeigt komplexe Charts und Finanzindikatoren.',
    voiceSearchActive: 'Warte auf Sprachbefehl...',
    voiceSearchTip: 'Sagen Sie z. B.: "gehe zum Markt" oder "Farbschema ändern"',
    voiceNotSupported: 'Spracherkennung wird in diesem Browser nicht unterstützt.',
    shortcutTip: 'Drücken Sie ⌘K oder Ctrl+K, um die Befehlspalette zu öffnen'
  }
};

let toastCounter = 0;

export const AppProvider = ({ children }) => {
  // Authentication State
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('cv_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [authLoading, setAuthLoading] = useState(true);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] Install choice outcome: ${outcome}`);
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  // Global Toasts State
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    toastCounter++;
    const id = `toast-${toastCounter}`;
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Language Support
  const [language, setLanguage] = useState(() => localStorage.getItem('cv_lang') || 'en');
  
  const changeLanguage = (lang) => {
    if (TRANSLATIONS[lang]) {
      setLanguage(lang);
      localStorage.setItem('cv_lang', lang);
      addToast(`Language changed to ${lang.toUpperCase()}`, 'info');
    }
  };

  const t = (key) => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['en']?.[key] || key;
  };

  // Theme Support
  const [theme, setTheme] = useState(() => localStorage.getItem('cv_theme') || 'dark');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
    localStorage.setItem('cv_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    addToast(`Theme switched to ${nextTheme} mode`, 'info');
  };

  // Beginner / Pro Mode Support
  const [mode, setMode] = useState(() => localStorage.getItem('cv_mode') || 'pro');

  const toggleMode = () => {
    const nextMode = mode === 'beginner' ? 'pro' : 'beginner';
    setMode(nextMode);
    localStorage.setItem('cv_mode', nextMode);
    addToast(`Switched to ${nextMode === 'beginner' ? 'Beginner' : 'Pro'} mode`, 'info');
  };

  // Restore authenticated session on startup
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('cv_token');
      if (token) {
        try {
          const response = await apiRequest('/auth/me');
          const userData = response.data;
          // Normalize role for UI components
          userData.role = userData.role ? userData.role.toUpperCase() : 'USER';
          setUser(userData);
          localStorage.setItem('cv_user', JSON.stringify(userData));
        } catch (error) {
          console.error('[Session Restore Error]', error.message);
          setUser(null);
          localStorage.removeItem('cv_user');
          localStorage.removeItem('cv_token');
        }
      }
      setAuthLoading(false);
    };
    restoreSession();
  }, []);

  // Coins State (Simulating Price Tickers)
  const [coins, setCoins] = useState(INITIAL_COINS);
  
  // Watchlist State
  const [watchlist, setWatchlist] = useState(['BTC', 'ETH', 'SOL', 'FET', 'LINK']);

  // Portfolio State
  const [portfolio, setPortfolio] = useState(INITIAL_PORTFOLIO);

  // Calculate live portfolio balanceUSD dynamically
  const liveHoldingsValue = portfolio.holdings.reduce((sum, holding) => {
    const liveCoin = coins.find(c => c.symbol === holding.symbol);
    const price = liveCoin ? liveCoin.price : 0;
    return sum + holding.amount * price;
  }, 0);
  const portfolioBalanceUSD = parseFloat((portfolio.cashUSD + liveHoldingsValue).toFixed(2));

  // Price Alerts State
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);

  // Notifications
  const [notifications, setNotifications] = useState([
    { id: 'n1', title: 'Welcome to CryptoVision AI', message: 'Explore real-time data and AI-driven portfolio insights.', time: 'Just now', type: 'info', read: false },
    { id: 'n2', title: 'FET Momentum Alert', message: 'FET surged over 12% in the past 24h, triggering buy signal recommendations.', time: '1h ago', type: 'ai', read: false }
  ]);

  // AI Assistant Chat History
  const [chatMessages, setChatMessages] = useState(() => [
    { sender: 'ai', text: 'Hello! I am CryptoVision AI, your advanced market assistant. Ask me to analyze your portfolio risk, summarize the latest FET activity, or check which coins look bullish today!', timestamp: new Date(Date.now() - 3600000).toISOString() }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Admin Logs & Stats Simulator
  const [adminStats, setAdminStats] = useState({
    serverLoad: 42,
    dbConnections: 124,
    apiRequests: 89120,
    maintenanceMode: false,
    activeSessions: 328,
    errorLogs: [
      { id: 'e1', service: 'Price Feed Service', error: 'Websocket connection timeout, retrying...', level: 'warn', time: '12:44:12' },
      { id: 'e2', service: 'Auth API Gateway', error: 'Rate limit exceeded on /api/auth/register from 192.168.1.144', level: 'info', time: '12:38:05' }
    ]
  });

  // Toggle Maintenance Mode
  const toggleMaintenanceMode = () => {
    setAdminStats(prev => ({
      ...prev,
      maintenanceMode: !prev.maintenanceMode
    }));
  };

  // Simulate real-time ticking price changes
  useEffect(() => {
    const interval = setInterval(() => {
      setCoins(prevCoins => {
        const nextCoins = prevCoins.map(coin => {
          // Add random price fluctuate -0.25% to +0.30%
          const pctChange = (Math.random() * 0.55 - 0.25) / 100;
          const currentPrice = coin.price * (1 + pctChange);
          const raw24hChange = coin.change24h + pctChange * 100;
          
          // Append new point to sparkline, keep length 7
          const updatedSparkline = [...coin.sparkline.slice(1), parseFloat(currentPrice.toFixed(2))];
          
          return {
            ...coin,
            price: parseFloat(currentPrice.toFixed(currentPrice > 100 ? 2 : currentPrice > 1 ? 3 : 7)),
            change24h: parseFloat(raw24hChange.toFixed(2)),
            high24h: currentPrice > coin.high24h ? currentPrice : coin.high24h,
            low24h: currentPrice < coin.low24h ? currentPrice : coin.low24h,
            sparkline: updatedSparkline
          };
        });

        // Trigger Alert Check
        checkAlerts(nextCoins);
        return nextCoins;
      });

      // Fluctuate Admin Metrics
      setAdminStats(prev => ({
        ...prev,
        serverLoad: Math.max(10, Math.min(99, prev.serverLoad + Math.floor(Math.random() * 9 - 4))),
        apiRequests: prev.apiRequests + Math.floor(Math.random() * 10),
        activeSessions: prev.activeSessions + Math.floor(Math.random() * 3 - 1)
      }));
    }, 4000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerts]);


  // Auth Operations
  const loginUser = async (loginCredential, password) => {
    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: { loginCredential, password }
      });
      const userData = response.data;
      // Normalize role for UI components
      userData.role = userData.role ? userData.role.toUpperCase() : 'USER';
      setUser(userData);
      localStorage.setItem('cv_user', JSON.stringify(userData));
      localStorage.setItem('cv_token', userData.token);
      addToast('Logged in successfully!', 'success');
      return userData;
    } catch (error) {
      console.error('[Login Error]', error.message);
      addToast(error.message || 'Login failed', 'error');
      throw error;
    }
  };

  const registerUser = async (username, email, password) => {
    try {
      const response = await apiRequest('/auth/register', {
        method: 'POST',
        body: { username, email, password }
      });
      addToast('Registration successful! Check your email to verify.', 'success');
      return response;
    } catch (error) {
      console.error('[Registration Error]', error.message);
      addToast(error.message || 'Registration failed', 'error');
      throw error;
    }
  };

  const resendVerificationEmail = async (email) => {
    try {
      const response = await apiRequest('/auth/resend-verification', {
        method: 'POST',
        body: { email }
      });
      addToast('Verification email resent.', 'success');
      return response;
    } catch (error) {
      console.error('[Resend Verification Error]', error.message);
      addToast(error.message || 'Resend failed', 'error');
      throw error;
    }
  };

  const logoutUser = () => {
    setUser(null);
    localStorage.removeItem('cv_user');
    localStorage.removeItem('cv_token');
    addToast('Logged out successfully.', 'info');
  };

  // Watchlist Actions
  const toggleWatchlist = (symbol) => {
    if (watchlist.includes(symbol)) {
      setWatchlist(watchlist.filter(s => s !== symbol));
      addToast(`Removed ${symbol} from watchlist.`, 'info');
    } else {
      setWatchlist([...watchlist, symbol]);
      addToast(`Added ${symbol} to watchlist.`, 'success');
    }
  };

  // Portfolio Actions
  const handleBuy = (symbol, amount, usdValue) => {
    if (portfolio.cashUSD < usdValue) {
      addToast('Insufficient USD cash balance!', 'error');
      return false;
    }
    
    setPortfolio(prev => {
      const holdingsCopy = [...prev.holdings];
      const index = holdingsCopy.findIndex(h => h.symbol === symbol);
      
      if (index > -1) {
        const currentAmount = holdingsCopy[index].amount;
        const currentAvg = holdingsCopy[index].avgBuyPrice;
        const totalCost = (currentAmount * currentAvg) + usdValue;
        const nextAmount = currentAmount + parseFloat(amount);
        holdingsCopy[index] = {
          symbol,
          amount: nextAmount,
          avgBuyPrice: parseFloat((totalCost / nextAmount).toFixed(2))
        };
      } else {
        const livePrice = coins.find(c => c.symbol === symbol)?.price || 0;
        holdingsCopy.push({
          symbol,
          amount: parseFloat(amount),
          avgBuyPrice: livePrice
        });
      }

      const nextCash = prev.cashUSD - usdValue;
      const newTx = {
        id: 'tx-' + Date.now(),
        type: 'BUY',
        symbol,
        amount: parseFloat(amount),
        price: parseFloat((usdValue / amount).toFixed(2)),
        date: new Date().toISOString()
      };

      return {
        ...prev,
        cashUSD: parseFloat(nextCash.toFixed(2)),
        holdings: holdingsCopy,
        transactions: [newTx, ...prev.transactions]
      };
    });
    addToast(`Successfully purchased ${amount} ${symbol}!`, 'success');
    return true;
  };

  const handleSell = (symbol, amount, usdValue) => {
    const currentHolding = portfolio.holdings.find(h => h.symbol === symbol);
    if (!currentHolding || currentHolding.amount < amount) {
      addToast('Insufficient asset balance!', 'error');
      return false;
    }

    setPortfolio(prev => {
      let holdingsCopy = [...prev.holdings];
      const index = holdingsCopy.findIndex(h => h.symbol === symbol);
      
      const nextAmount = holdingsCopy[index].amount - parseFloat(amount);
      if (nextAmount <= 0) {
        holdingsCopy = holdingsCopy.filter(h => h.symbol !== symbol);
      } else {
        holdingsCopy[index] = {
          ...holdingsCopy[index],
          amount: nextAmount
        };
      }

      const nextCash = prev.cashUSD + usdValue;
      const newTx = {
        id: 'tx-' + Date.now(),
        type: 'SELL',
        symbol,
        amount: parseFloat(amount),
        price: parseFloat((usdValue / amount).toFixed(2)),
        date: new Date().toISOString()
      };

      return {
        ...prev,
        cashUSD: parseFloat(nextCash.toFixed(2)),
        holdings: holdingsCopy,
        transactions: [newTx, ...prev.transactions]
      };
    });
    addToast(`Successfully sold ${amount} ${symbol}!`, 'success');
    return true;
  };

  const depositCash = (amount) => {
    setPortfolio(prev => {
      const nextCash = prev.cashUSD + parseFloat(amount);
      const newTx = {
        id: 'tx-' + Date.now(),
        type: 'DEPOSIT',
        symbol: 'USD',
        amount: parseFloat(amount),
        price: 1.0,
        date: new Date().toISOString()
      };

      return {
        ...prev,
        cashUSD: parseFloat(nextCash.toFixed(2)),
        transactions: [newTx, ...prev.transactions]
      };
    });
    addToast(`Deposited $${parseFloat(amount).toLocaleString()} successfully!`, 'success');
  };

  const withdrawCash = (amount) => {
    if (portfolio.cashUSD < amount) {
      addToast('Insufficient cash balance to withdraw!', 'error');
      return false;
    }
    setPortfolio(prev => {
      const nextCash = prev.cashUSD - parseFloat(amount);
      const newTx = {
        id: 'tx-' + Date.now(),
        type: 'WITHDRAW',
        symbol: 'USD',
        amount: parseFloat(amount),
        price: 1.0,
        date: new Date().toISOString()
      };

      return {
        ...prev,
        cashUSD: parseFloat(nextCash.toFixed(2)),
        transactions: [newTx, ...prev.transactions]
      };
    });
    addToast(`Withdrew $${parseFloat(amount).toLocaleString()} successfully!`, 'success');
    return true;
  };

  // Price Alerts Management
  const addAlert = (symbol, type, value) => {
    const newAlert = {
      id: 'alert-' + Date.now(),
      symbol,
      type,
      value: parseFloat(value),
      isActive: true,
      createdAt: new Date().toISOString()
    };
    setAlerts([newAlert, ...alerts]);
    addToast(`Price alert created for ${symbol} at $${parseFloat(value).toLocaleString()}!`, 'success');
  };

  const deleteAlert = (id) => {
    setAlerts(alerts.filter(a => a.id !== id));
    addToast('Alert deleted successfully.', 'info');
  };

  const toggleAlertStatus = (id) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
    addToast('Alert status modified.', 'info');
  };

  // Core Price Alert Trigger Checker
  const checkAlerts = (latestCoins) => {
    alerts.forEach(alert => {
      if (!alert.isActive) return;
      const coin = latestCoins.find(c => c.symbol === alert.symbol);
      if (!coin) return;

      const triggeredAbove = alert.type === 'ABOVE' && coin.price >= alert.value;
      const triggeredBelow = alert.type === 'BELOW' && coin.price <= alert.value;

      if (triggeredAbove || triggeredBelow) {
        // Trigger notification
        const newNotif = {
          id: 'notif-' + Date.now(),
          title: `Alert Triggered: ${alert.symbol}`,
          message: `${alert.symbol} has gone ${alert.type.toLowerCase()} $${alert.value.toLocaleString()}! Current: $${coin.price.toLocaleString()}`,
          time: 'Just now',
          type: 'alert',
          read: false
        };

        setNotifications(prev => [newNotif, ...prev]);

        // Toggle alert off to avoid spam
        setAlerts(prevAlerts => prevAlerts.map(a => a.id === alert.id ? { ...a, isActive: false } : a));
      }
    });
  };

  // Notification Operations
  const markNotificationAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // AI Assistant Typing Simulator
  const askAIAssistant = (userQuery) => {
    const newMsg = { sender: 'user', text: userQuery, timestamp: new Date().toISOString() };
    setChatMessages(prev => [...prev, newMsg]);
    setIsTyping(true);

    setTimeout(() => {
      let aiText = '';
      const cleaned = userQuery.toLowerCase();
      
      if (cleaned.includes('portfolio') || cleaned.includes('/analyze')) {
        aiText = `Based on your portfolio assets, you have a solid concentration in Layer 1 platforms (Bitcoin, Ethereum, Solana) and Artificial Intelligence protocols (FET). Your risk factor is Moderate (Beta: 1.14) due to high SOL and FET allocation. Recommendations: Consider allocating 10% to stablecoins to cushion against sudden dips, and maintain regular alerts on FET price bands ($1.40 - $1.85).`;
      } else if (cleaned.includes('market') || cleaned.includes('/market') || cleaned.includes('bullish')) {
        const topGainers = [...coins].sort((a,b) => b.change24h - a.change24h).slice(0,2);
        aiText = `Market analysis: Trend is moderately bullish. The leaders are currently ${topGainers[0].symbol} (+${topGainers[0].change24h}%) and ${topGainers[1].symbol} (+${topGainers[1].change24h}%). Ethereum exhibits short-term consolidation around $3,500 with solid support, while Bitcoin trades stably near $67,000.`;
      } else if (cleaned.includes('alert') || cleaned.includes('price')) {
        aiText = `I see you have active alerts set for BTC ($70k above) and ETH ($34k below). Let me know if you would like me to simulate additional technical indicator alerts (e.g. RSI crossing 30/70) for your core holdings!`;
      } else {
        aiText = `Analyzing market structures... CryptoVision AI model projects short term bullish targets for L1 networks. For FET, support lines are holding firm at $1.55. What specific coins or trading metrics can I evaluate for you today?`;
      }

      setChatMessages(prev => [...prev, { sender: 'ai', text: aiText, timestamp: new Date().toISOString() }]);
      setIsTyping(false);
      
      // Auto notification for new AI signal
      setNotifications(prev => [
        { id: 'notif-' + Date.now(), title: 'AI Assistant Insight', message: 'New portfolio advice generated. View AI Chat.', time: 'Just now', type: 'ai', read: false },
        ...prev
      ]);
    }, 1500);
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await apiRequest('/auth/profile', {
        method: 'PUT',
        body: profileData
      });
      if (response.success && response.data) {
        const updated = response.data;
        updated.role = updated.role ? updated.role.toUpperCase() : 'USER';
        setUser(updated);
        localStorage.setItem('cv_user', JSON.stringify(updated));
        addToast('Profile updated successfully!', 'success');
        return updated;
      }
    } catch (error) {
      addToast(error.message || 'Failed to update profile', 'error');
      throw error;
    }
  };

  return (
    <AppContext.Provider value={{
      user,
      authLoading,
      coins,
      watchlist,
      portfolio: {
        ...portfolio,
        balanceUSD: portfolioBalanceUSD
      },
      alerts,
      notifications,
      chatMessages,
      isTyping,
      adminStats,
      loginUser,
      registerUser,
      resendVerificationEmail,
      logoutUser,
      toggleWatchlist,
      handleBuy,
      handleSell,
      depositCash,
      withdrawCash,
      addAlert,
      deleteAlert,
      toggleAlertStatus,
      markNotificationAsRead,
      clearNotifications,
      askAIAssistant,
      toggleMaintenanceMode,
      language,
      changeLanguage,
      t,
      theme,
      toggleTheme,
      mode,
      toggleMode,
      toasts,
      addToast,
      removeToast,
      updateProfile,
      isInstallable,
      installApp
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
