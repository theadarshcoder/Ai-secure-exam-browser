import React from 'react';
import { Toaster } from 'react-hot-toast';
import AppRouter from './routes';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <AppRouter />
      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
}

export default App;
