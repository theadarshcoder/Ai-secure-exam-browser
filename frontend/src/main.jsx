import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { loader } from "@monaco-editor/react";
import './index.css';
import App from './App.jsx';

// 🚀 Pre-warm Monaco globally (Instant Load Strategy)
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs'
  },
  'vs/nls': { availableLanguages: { '*': 'en' } }
});
loader.init().catch(() => {});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
