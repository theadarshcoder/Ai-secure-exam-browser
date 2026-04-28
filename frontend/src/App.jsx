import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import AppRouter from './routes';
import ErrorBoundary from './components/ErrorBoundary';

function App() {

  // 🔗 Magic Deep Link: Auto-login when Electron sends a token
  useEffect(() => {
    if (window.electronAPI?.onAuthToken) {
      window.electronAPI.onAuthToken((token) => {
        try {
          // Decode JWT payload (base64)
          const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            window.atob(base64).split('').map(c =>
              '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join('')
          );
          const payload = JSON.parse(jsonPayload);

          // Save session
          sessionStorage.setItem('vision_token', token);
          sessionStorage.setItem('vision_id', payload.id);
          sessionStorage.setItem('vision_email', payload.email);
          sessionStorage.setItem('vision_role', payload.displayRole || payload.role);
          sessionStorage.setItem('vision_name', payload.email?.split('@')[0] || 'Student');

          toast.success('Auto-authenticated via Secure Link!', { icon: '🔗', duration: 3000 });

          // Navigate to dashboard
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 500);
        } catch (err) {
          console.error('🔗 Deep link auth failed:', err);
          toast.error('Secure link expired. Please login manually.');
        }
      });
    }
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
