import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export const useTabVisibility = () => {
  const [toast, setToast] = useState(null);
  const blurTimeoutRef = useRef(null);

  useEffect(() => {
    const originalTitle = document.title;
    
    const handleVisibility = () => {
      if (document.hidden) {
        document.title = '⚠️ RETURN TO EXAM';
        const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
        link.rel = 'icon';
        link.href = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><circle cx='8' cy='8' r='8' fill='%23ef4444'/></svg>`;
        document.head.appendChild(link);
      } else {
        document.title = originalTitle;
        const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
        link.rel = 'icon';
        link.href = '/favicon.svg';
        document.head.appendChild(link);
        
        // Immediate toast for actual tab switch
        setToast({ id: Date.now(), msg: 'Tab switch logged. Please remain on this screen.' });
        setTimeout(() => setToast(null), 4500);
      }
    };

    const handleBlur = () => {
      // Don't toast immediately; set a 2-second grace period (buffer)
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
      
      blurTimeoutRef.current = setTimeout(() => {
        setToast({ id: Date.now(), msg: 'Window focus lost. This event has been recorded.' });
        setTimeout(() => setToast(null), 4500);
      }, 2000); // 2s Grace Period
    };

    const handleFocus = () => {
      // If student focuses back within 2s, cancel the violation
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.title = originalTitle;
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  return toast;
};

export const TabToast = ({ toast }) => (
  <AnimatePresence>
    {toast && (
      <motion.div
        key={toast.id}
        initial={{ opacity: 0, y: 32, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-8 right-8 z-[1000] flex items-center gap-3 px-5 py-4 bg-slate-900 border border-amber-500/30 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.5)] max-w-sm"
      >
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-slate-100">{toast.msg}</p>
          <p className="text-xs text-slate-500 mt-0.5">This event has been recorded.</p>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);
