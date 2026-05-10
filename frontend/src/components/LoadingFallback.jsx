import React from 'react';
import { motion } from 'framer-motion';
import VisionLogo from './VisionLogo';
import { Loader2 } from 'lucide-react';

const LoadingFallback = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#030303] flex flex-col items-center justify-center">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative flex flex-col items-center">
        {/* Logo Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="w-20 h-20">
            <VisionLogo className="w-full h-full text-white" />
          </div>
        </motion.div>

        {/* Loading Indicator */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
            <span className="text-[11px] font-bold text-white/70 uppercase tracking-[0.2em]">
              Loading Secure Environment
            </span>
          </div>
          
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: 140 }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"
          />
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">
          Vision Secure Engine v4.0
        </span>
      </div>
    </div>
  );
};

export default LoadingFallback;
