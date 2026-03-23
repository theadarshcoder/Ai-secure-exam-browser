import React from 'react';
import { motion } from 'framer-motion';

const RefractiveCard = ({ children, className = "" }) => {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative p-[1px] rounded-2xl overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative h-full w-full bg-zinc-950 backdrop-blur-xl rounded-2xl border border-zinc-700/30 p-8 flex flex-col shadow-2xl">
        <div className="absolute -inset-px bg-gradient-to-br from-indigo-500/20 via-transparent to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />
        
        <div className="relative z-10 flex-1 flex flex-col">
          {children}
        </div>
      </div>
    </motion.div>
  );
};

export default RefractiveCard;
