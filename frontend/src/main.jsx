import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from "@sentry/react";
import './index.css';
import App from './App.jsx';
import ErrorBoundary from './components/common/ErrorBoundary';

// 🛰️ Initialize Sentry Tracking
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  environment: import.meta.env.MODE,
  // Tracing
  tracesSampleRate: 1.0, 
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
