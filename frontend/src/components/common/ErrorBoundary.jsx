import React from 'react';
import * as Sentry from "@sentry/react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, eventId: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    Sentry.withScope((scope) => {
      scope.setExtras(errorInfo);
      const eventId = Sentry.captureException(error);
      this.setState({ eventId });
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-width-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h1>
            <p className="text-slate-600 mb-8">
              The application encountered an unexpected error. Our team has been notified and we're working on a fix.
            </p>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-emerald-200"
              >
                Reload Application
              </button>
              
              <button 
                onClick={() => {
                    localStorage.clear();
                    window.location.href = '/';
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-6 rounded-xl transition-all"
              >
                Clear Cache & Reset
              </button>
            </div>

            {this.state.eventId && (
              <div className="mt-8 pt-6 border-top border-slate-50">
                <p className="text-xs text-slate-400 font-mono">
                  Error ID: <span className="text-slate-500 select-all">{this.state.eventId}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
