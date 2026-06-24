import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Loader2 } from 'lucide-react';

/**
 * Loading component displaying a sleek, themed spinner
 */
const ThemedLoadingScreen = () => {
  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Decorative background blurs */}
      <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="z-10 flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
          <div className="absolute inset-0 rounded-full border border-indigo-500/30 animate-pulse pointer-events-none" />
        </div>
        <div className="text-center">
          <p className="font-display font-bold text-sm tracking-wider text-slate-200">CRYPTOVISION AI</p>
          <p className="text-xs text-slate-500 mt-1">Securing connection to terminal...</p>
        </div>
      </div>
    </div>
  );
};

/**
 * ProtectedRoute blocks access to unauthenticated users
 */
export const ProtectedRoute = ({ children }) => {
  const { user, authLoading } = useApp();

  if (authLoading) {
    return <ThemedLoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
};

/**
 * AdminRoute blocks access to non-admin users
 */
export const AdminRoute = ({ children }) => {
  const { user, authLoading } = useApp();

  if (authLoading) {
    return <ThemedLoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isUserAdmin = user.role === 'ADMIN' || user.role === 'admin';
  if (!isUserAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? children : <Outlet />;
};
