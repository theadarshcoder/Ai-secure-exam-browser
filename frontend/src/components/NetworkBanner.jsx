import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';

const NetworkBanner = () => {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [showReturn, setShowReturn] = useState(false);

  useEffect(() => {
    const goOffline = () => { setOffline(true); setShowReturn(false); };
    const goOnline = () => { setOffline(false); setShowReturn(true); setTimeout(() => setShowReturn(false), 4000); };
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => { window.removeEventListener('offline', goOffline); window.removeEventListener('online', goOnline); };
  }, []);

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          key="offline"
          initial={{ opacity: 0, y: -64 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -64 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed top-0 left-0 right-0 z-[997] flex items-center justify-center gap-3 px-6 py-3 bg-red-950/90 border-b border-red-500/30"
          style={{ backdropFilter: 'blur(12px)' }}
        >
          <WifiOff className="w-4 h-4 text-red-400 shrink-0" />
          <span className="text-sm font-semibold text-red-200 tracking-wide">Connection unstable. Local caching active.</span>
        </motion.div>
      )}
      {showReturn && !offline && (
        <motion.div
          key="back-online"
          initial={{ opacity: 0, y: -64 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -64 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed top-0 left-0 right-0 z-[997] flex items-center justify-center gap-3 px-6 py-3 bg-emerald-950/90 border-b border-emerald-500/30"
          style={{ backdropFilter: 'blur(12px)' }}
        >
          <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold text-emerald-200 tracking-wide">Connection restored.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NetworkBanner;
