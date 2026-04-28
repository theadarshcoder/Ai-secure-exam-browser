import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import AppRouter from './routes';
import ErrorBoundary from './components/ErrorBoundary';

function App() {


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
