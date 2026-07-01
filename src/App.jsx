import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { usePriceStore } from './store/usePriceStore';
import { motion, AnimatePresence } from 'framer-motion';

// Layout Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Pages (Lazy Loaded)
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Market = React.lazy(() => import('./pages/Market'));
const Portfolio = React.lazy(() => import('./pages/Portfolio'));
const Watchlist = React.lazy(() => import('./pages/Watchlist'));
const CoinDetails = React.lazy(() => import('./pages/CoinDetails'));
const AIAssistant = React.lazy(() => import('./pages/AIAssistant'));
const AIPortfolioAnalyzer = React.lazy(() => import('./pages/AIPortfolioAnalyzer'));
const CoinComparison = React.lazy(() => import('./pages/CoinComparison'));
const Alerts = React.lazy(() => import('./pages/Alerts'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Profile = React.lazy(() => import('./pages/Profile'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));

// Auth & Route Protection
import { ProtectedRoute, AdminRoute } from './components/AuthRoutes';
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const VerifyEmail = React.lazy(() => import('./pages/VerifyEmail'));
const OAuthSuccess = React.lazy(() => import('./pages/OAuthSuccess'));
import ToastContainer from './components/ToastContainer';
import CommandPalette from './components/CommandPalette';

// Custom Route Wrapper for layout alignment
function LayoutWrapper({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toggleTheme, toggleMode, addToast } = useApp();

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. Command Palette: Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
      
      // 2. Toggle Theme: Ctrl+L or Cmd+L
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        toggleTheme();
      }

      // 3. Toggle Mode: Ctrl+B or Cmd+B
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleMode();
      }

      // 4. Navigate Dashboard: Ctrl+D
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && !e.shiftKey) {
        e.preventDefault();
        navigate('/dashboard');
        addToast('Navigated to Dashboard', 'info');
      }

      // 5. Navigate Market: Ctrl+M
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        navigate('/market');
        addToast('Navigated to Market Feed', 'info');
      }

      // 6. Navigate Portfolio: Ctrl+P
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        navigate('/portfolio');
        addToast('Navigated to Portfolio Ledger', 'info');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, toggleTheme, toggleMode, addToast]);

  // Route exceptions: Authentication routes do not display standard dashboard chrome
  const isAuthRoute =
    location.pathname === '/' ||
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname.startsWith('/verify-email/') ||
    location.pathname === '/forgot-password' ||
    location.pathname.startsWith('/reset-password/') ||
    location.pathname.startsWith('/oauth-success');

  const mainContent = isAuthRoute ? (
    <div className="w-full min-h-screen">
      <Suspense fallback={<RouteLoadingSpinner />}>
        {children}
      </Suspense>
    </div>
  ) : (
    <div className="flex min-h-screen bg-dark-950 text-slate-100 overflow-x-hidden font-sans">
      {/* 1. SIDEBAR NAVIGATION */}
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      </div>

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-dark-950/60 backdrop-blur-sm z-30 md:hidden"
            />
            {/* Menu container */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-64 z-40 md:hidden"
            >
              <Sidebar collapsed={false} setCollapsed={() => {}} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 2. MAIN WORKSPACE CONTENT PANEL */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Navbar 
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} 
          mobileMenuOpen={mobileMenuOpen} 
        />
        
        <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-[1600px] mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="w-full h-full"
            >
              <Suspense fallback={<RouteLoadingSpinner />}>
                {children}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );

  return (
    <>
      {mainContent}
      <ToastContainer />
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
    </>
  );
}

export default function App() {
  const connectSocket = usePriceStore((state) => state.connectSocket);
  const disconnectSocket = usePriceStore((state) => state.disconnectSocket);

  useEffect(() => {
    connectSocket();
    return () => disconnectSocket();
  }, [connectSocket, disconnectSocket]);

  return (
    <AppProvider>
      <Router>
        <LayoutWrapper>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/oauth-success" element={<OAuthSuccess />} />
            
            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/market" element={<Market />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/coin/:id" element={<CoinDetails />} />
              <Route path="/ai-assistant" element={<AIAssistant />} />
              <Route path="/ai-analyzer" element={<AIPortfolioAnalyzer />} />
              <Route path="/compare" element={<CoinComparison />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Admin Only routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </LayoutWrapper>
      </Router>
    </AppProvider>
  );
}

const RouteLoadingSpinner = () => (
  <div className="w-full min-h-[40vh] flex flex-col items-center justify-center gap-3">
    <div className="w-10 h-10 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
    <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider animate-pulse">Loading Terminal Module...</span>
  </div>
);
