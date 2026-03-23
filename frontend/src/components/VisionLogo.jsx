import React, { useEffect } from 'react';
import { motion, useSpring, useTransform, useScroll, useMotionValue } from 'framer-motion';

export default function VisionLogo({ className = "w-12 h-12 text-white" }) {
  // Use framer-motion springs for smooth pupil tracking
  const springConfig = { damping: 25, stiffness: 200 };
  const rawMouseX = useMotionValue(0);
  const rawMouseY = useMotionValue(0);
  const mouseX = useSpring(rawMouseX, springConfig);
  const mouseY = useSpring(rawMouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e) => {
      // Normalize mouse position between -1 and 1
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      rawMouseX.set(x);
      rawMouseY.set(y);
    };
    
    // Initial centering, but it responds broadly across the whole window
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [rawMouseX, rawMouseY]);

  // Translate mouse movement into small, bounded shifts for the pupil
  const pupilX = useTransform(mouseX, [-1, 1], [-4, 4]);
  const pupilY = useTransform(mouseY, [-1, 1], [-3, 3]);
  
  // Stronger scaling and rotation effect dependent on overall page scroll
  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.7]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 180]); // Slowly spins as we scroll

  return (
    <motion.div style={{ scale }} className={`relative flex items-center justify-center ${className}`}>
      {/* Tech-inspired Eye Boundary */}
      <motion.svg 
        style={{ rotate }}
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        className="w-full h-full opacity-90 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
      >
        {/* Main Eye Shape */}
        <path d="M2.5 12c0 0 3.5-7.5 9.5-7.5S21.5 12 21.5 12s-3.5 7.5-9.5 7.5S2.5 12 2.5 12z" strokeLinejoin="round"/>
        {/* Top/Bottom precision notches */}
        <path d="M12 3v1.5" opacity="0.4"/>
        <path d="M12 19.5V21" opacity="0.4"/>
      </motion.svg>
      {/* Inner tracking pupil */}
      <motion.div 
        style={{ x: pupilX, y: pupilY }}
        className="absolute w-[35%] h-[35%] border-[1.5px] border-current rounded-full flex items-center justify-center bg-transparent backdrop-blur-sm"
      >
         {/* Pupil Core */}
         <div className="w-[30%] h-[30%] bg-current rounded-full shadow-[0_0_5px_currentColor]"></div>
      </motion.div>
    </motion.div>
  );
}
