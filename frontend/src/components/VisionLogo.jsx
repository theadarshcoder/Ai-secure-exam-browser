import React, { useEffect } from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';

export default function VisionLogo({ className = "w-12 h-12 text-[#ff3b00]" }) {
  const springConfig = { damping: 30, stiffness: 180 };
  const rawMouseX = useMotionValue(0);
  const rawMouseY = useMotionValue(0);
  const mouseX = useSpring(rawMouseX, springConfig);
  const mouseY = useSpring(rawMouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      rawMouseX.set(x);
      rawMouseY.set(y);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [rawMouseX, rawMouseY]);

  // Subtle pupil tracking — tighter range for realism
  const pupilX = useTransform(mouseX, [-1, 1], [-3, 3]);
  const pupilY = useTransform(mouseY, [-1, 1], [-2, 2]);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Eye outline */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full opacity-95"
      >
        {/* Main eye almond shape */}
        <path d="M2.5 12c0 0 3.5-7 9.5-7s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />

        {/* Corner scan tick marks — top-left and top-right */}
        <path d="M7.5 6.2 L6.5 5.5" opacity="0.35" strokeWidth="1" />
        <path d="M16.5 6.2 L17.5 5.5" opacity="0.35" strokeWidth="1" />
        {/* Corner scan tick marks — bottom-left and bottom-right */}
        <path d="M7.5 17.8 L6.5 18.5" opacity="0.35" strokeWidth="1" />
        <path d="M16.5 17.8 L17.5 18.5" opacity="0.35" strokeWidth="1" />
      </svg>

      {/* Iris ring — subtle depth layer */}
      <div className="absolute w-[42%] h-[42%] rounded-full border border-current opacity-20" />

      {/* Tracking pupil */}
      <motion.div
        style={{ x: pupilX, y: pupilY }}
        className="absolute w-[28%] h-[28%] rounded-full border-[1.5px] border-current flex items-center justify-center"
      >
        {/* Pupil core fill */}
        <div className="w-[55%] h-[55%] bg-current rounded-full" />
        {/* Tiny highlight */}
        <div className="absolute top-[18%] right-[18%] w-[18%] h-[18%] bg-white rounded-full opacity-70" />
      </motion.div>
    </div>
  );
}
