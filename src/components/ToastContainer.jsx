import React from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useApp();

  const getToastStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          icon: <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
        };
      case 'error':
        return {
          bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
          icon: <AlertCircle className="w-4.5 h-4.5 text-rose-400" />
        };
      case 'warning':
        return {
          bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          icon: <AlertTriangle className="w-4.5 h-4.5 text-amber-400" />
        };
      case 'info':
      default:
        return {
          bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
          icon: <Info className="w-4.5 h-4.5 text-indigo-400" />
        };
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-60 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const styles = getToastStyles(toast.type);
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9, transition: { duration: 0.15 } }}
              className={`p-3.5 rounded-xl border backdrop-blur-md flex items-center justify-between gap-3 shadow-2xl pointer-events-auto ${styles.bg}`}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex-shrink-0">{styles.icon}</div>
                <span className="text-xs font-semibold tracking-wide text-left">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="hover:opacity-80 p-0.5 rounded transition-all flex-shrink-0"
              >
                <X className="w-4 h-4 opacity-60 hover:opacity-100" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
