import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Error Boundary Caught Exception]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-panel p-6 max-w-xl mx-auto my-12 border border-rose-500/20 rounded-2xl bg-dark-900/60 shadow-3xl text-left space-y-4">
          <div className="flex items-center gap-3 text-rose-400">
            <AlertCircle className="w-8 h-8 flex-shrink-0" />
            <div>
              <h2 className="font-display font-extrabold text-lg text-white">Interface Crash Detected</h2>
              <p className="text-slate-400 text-xs mt-0.5">An error occurred in the child component tree.</p>
            </div>
          </div>
          <div className="bg-rose-500/5 border border-rose-500/10 p-3 rounded-lg text-xs font-mono text-rose-300 overflow-x-auto whitespace-pre-wrap max-h-48">
            {this.state.error?.toString() || 'Unknown rendering error'}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="btn-premium-indigo text-xs py-2.5 px-4 font-bold flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
          >
            <RotateCcw className="w-4 h-4" /> Reload Terminal
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
