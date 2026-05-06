import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import AppRouter from './routes';
import ErrorBoundary from './components/ErrorBoundary';
import socketService from './services/socket';

function App() {
  useEffect(() => {
    const socket = socketService.connect();
    
    if (socket) {
      socket.on('platform_announcement', (data) => {
        toast((t) => (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span className="font-black uppercase tracking-widest text-[10px] text-amber-600">Platform Announcement</span>
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{data.title}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{data.message}</p>
          </div>
        ), {
          duration: 10000,
          position: 'top-center',
          style: {
            borderRadius: '20px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-main)',
            padding: '16px',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
          }
        });
      });
    }

    return () => {
      if (socket) socket.off('platform_announcement');
    };
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <AppRouter />
        <Toaster position="top-right" reverseOrder={false} />
      </div>
    </ErrorBoundary>
  );
}

export default App;
