import React, { useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Fingerprint, Activity, Lock, Cpu, Gem } from 'lucide-react';

const SECTIONS = [
  { id: 'hero',     label: 'Home',     icon: <Fingerprint className="w-3.5 h-3.5" /> },
  { id: 'security', label: 'Verify',   icon: <Lock        className="w-3.5 h-3.5" /> },
  { id: 'features', label: 'Features', icon: <Activity    className="w-3.5 h-3.5" /> },
  { id: 'stats',    label: 'Stats',    icon: <Cpu         className="w-3.5 h-3.5" /> },
  { id: 'trust',    label: 'Trust',    icon: <Gem         className="w-3.5 h-3.5" /> },
];

const ScrollHUD = () => {
  const { scrollY } = useScroll();
  const [activeIdx, setActiveIdx] = useState(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    let currentIdx = activeIdx;
    
    // Default to first section near top
    if (latest < 100) {
      currentIdx = 0;
    } else if (latest + window.innerHeight >= document.documentElement.scrollHeight - 100) {
      // Force last section if scrolled to very bottom
      currentIdx = SECTIONS.length - 1;
    } else {
      // Find the first section whose offset top is passed the viewport center line
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(SECTIONS[i].id);
        if (el && latest >= el.offsetTop - window.innerHeight * 0.4) {
          currentIdx = i;
          break;
        }
      }
    }
    
    if (currentIdx !== activeIdx) setActiveIdx(currentIdx);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 3.0, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-5 left-1/2 -translate-x-1/2 z-[1001] hidden lg:flex"
    >
      <div className="flex items-center gap-1 p-1 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        {SECTIONS.map((s, i) => {
          const isActive = i === activeIdx;
          return (
            <button
              key={s.id}
              onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' })}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 outline-none ${
                isActive
                  ? 'text-black'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="pill-indicator"
                  className="absolute inset-0 bg-white rounded-full"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {s.icon}
                {s.label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ScrollHUD;
