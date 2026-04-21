import React from 'react';
import { motion } from 'framer-motion';

export default function BouncingDotLoader({ text = "Loading data..." }) {
  const bars = [32, 24, 16, 10, 4];
  const barWidth = 6;
  const gap = 4;
  const dotSize = 6;
  
  // Hardcode perfectly tuned bouncing coordinates
  // x increases by 10 for each bar, 5 for mid-air
  const xKeyframes = [
    0, 5, 10, 15, 20, 25, 30, 35, 40, // forward
    35, 30, 25, 20, 15, 10, 5, 0 // backward
  ];
  
  const yKeyframes = [
    -32, -40, -24, -32, -16, -24, -10, -18, -4, // forward bounces
    -18, -10, -24, -16, -32, -24, -40, -32 // backward bounces
  ];

  return (
    <div className="flex flex-col items-center justify-center p-8 w-full h-full min-h-[200px]">
      <div 
        style={{ 
          position: 'relative', 
          display: 'flex', 
          alignItems: 'flex-end', 
          gap: gap, 
          height: Math.max(...bars) + 15,
          width: bars.length * barWidth + (bars.length - 1) * gap
        }}
      >
        {/* Bouncing Dot */}
        <motion.div
          animate={{
            x: xKeyframes,
            y: yKeyframes,
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            background: '#3B82F6', // bright blue
            zIndex: 10,
          }}
        />
        
        {/* Bars */}
        {bars.map((h, i) => (
          <div
            key={i}
            style={{
              width: barWidth,
              height: h,
              background: '#111111',
              borderRadius: 1
            }}
          />
        ))}
      </div>
      {text && (
        <div className="mt-8 text-[13px] font-medium text-slate-400 tracking-wide animate-pulse">
          {text}
        </div>
      )}
    </div>
  );
}
