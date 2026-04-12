import React from 'react';
import { AlertOctagon, RefreshCw, Copy, RotateCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Critical System Crash Catch:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleCopyError = () => {
    const errorText = `${this.state.error?.toString()}\n\nStack Trace:\n${this.state.errorInfo?.componentStack}`;
    navigator.clipboard.writeText(errorText);
    toast.success('Error details copied to clipboard');
  };

  handleReset = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080808] flex items-center justify-center p-6 font-sans">
          <div className="max-w-xl w-full">
            {/* Visual Header */}
            <div className="flex flex-col items-center text-center mb-10">
              <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 animate-pulse">
                <AlertOctagon size={40} className="text-red-500" />
              </div>
              <h1 className="text-2xl font-black text-white uppercase tracking-[0.2em] mb-2">System Interruption</h1>
              <p className="text-zinc-500 text-sm font-medium max-w-sm">
                The secure data layer encountered an unhandled exception. This usually happens during data rendering.
              </p>
            </div>

            {/* Error Details */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden mb-8 backdrop-blur-xl">
              <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Crash Manifest</span>
                <button 
                  onClick={this.handleCopyError}
                  className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-widest transition-colors"
                >
                  <Copy size={12} /> Copy Diagnostic
                </button>
              </div>
              <div className="p-6">
                <pre className="text-red-400 text-xs font-mono overflow-auto max-h-40 custom-scrollbar leading-relaxed">
                  {this.state.error?.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button 
                onClick={this.handleReset}
                className="w-full h-14 bg-white text-black text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-zinc-200 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-white/10"
              >
                <RotateCcw size={16} /> Reinitialize Module
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full h-14 bg-zinc-800 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-zinc-700 transition-all active:scale-95 flex items-center justify-center border border-white/5"
              >
                Return to Core
              </button>
            </div>

            {/* Footer */}
            <p className="text-center mt-12 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em]">
              Vision Secure Layer — Diagnostic v1.0.4
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
