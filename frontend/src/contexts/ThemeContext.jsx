import React, { createContext, useContext, useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

/* ─── Context ─── */
const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => {} });
export const useTheme = () => useContext(ThemeContext);

/* ─── Provider ─── */
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('vision_theme') || 'dark'; } catch { return 'dark'; }
  });

  useEffect(() => {
    // If we are currently on the Landing Page, rigidly force dark mode
    if (window.location.pathname === '/') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    
    // Always persist user preference regardless of current page enforcement
    localStorage.setItem('vision_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/* ─── Reusable Toggle Button ─── */
export const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      id="theme-toggle-btn"
      onClick={toggleTheme}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`
        relative flex items-center justify-center w-9 h-9 rounded-xl border transition-all duration-300 group
        ${isDark
          ? 'border-white/10 bg-white/[0.04] text-zinc-400 hover:text-amber-300 hover:bg-amber-500/10 hover:border-amber-500/20'
          : 'border-black/10 bg-black/[0.04] text-slate-500 hover:text-indigo-500 hover:bg-indigo-500/10 hover:border-indigo-500/20'
        }
        active:scale-90 ${className}
      `}
    >
      <span className="absolute inset-0 flex items-center justify-center transition-all duration-300">
        {isDark ? <Sun size={15} /> : <Moon size={15} />}
      </span>
    </button>
  );
};
