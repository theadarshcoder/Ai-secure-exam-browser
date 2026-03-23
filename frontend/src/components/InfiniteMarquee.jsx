import React, { useState } from 'react';
import { Shield, Activity, Lock, Cpu, Eye, MonitorCheck, ScanFace, Headphones, Camera, Server } from 'lucide-react';

const TAGS = [
  { label: "AI VIGILANCE", icon: <Activity className="w-4 h-4" /> },
  { label: "SECURE LOCKDOWN", icon: <Lock className="w-4 h-4" /> },
  { label: "BIOMETRIC SYNC", icon: <ScanFace className="w-4 h-4" /> },
  { label: "AES-256 ENCRYPTION", icon: <Shield className="w-4 h-4" /> },
  { label: "LIVE PROCTORING", icon: <MonitorCheck className="w-4 h-4" /> },
  { label: "REAL-TIME TELEMETRY", icon: <Cpu className="w-4 h-4" /> },
  { label: "GAZE TRACKING", icon: <Eye className="w-4 h-4" /> },
  { label: "AUDIO ANALYSIS", icon: <Headphones className="w-4 h-4" /> },
  { label: "LIVENESS DETECTION", icon: <Camera className="w-4 h-4" /> },
  { label: "ZERO DATA REPLAY", icon: <Server className="w-4 h-4" /> },
];

const MarqueeRow = ({ direction = "left", duration = "60s" }) => {
  const [isPaused, setIsPaused] = useState(false);
  const duplicatedTags = [...TAGS, ...TAGS];

  return (
    <div 
      className="flex overflow-hidden py-1 select-none group/marquee cursor-pointer"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div 
        className={`flex gap-4 pr-4 whitespace-nowrap marquee-${direction}`}
        style={{ 
          animationDuration: duration,
          animationPlayState: isPaused ? 'paused' : 'running'
        }}
      >
        {duplicatedTags.map((tag, i) => (
          <div 
            key={i}
            className="flex items-center gap-3 px-5 py-2.5 shrink-0 rounded-full border border-zinc-700/60 bg-zinc-900/60 backdrop-blur-sm transition-all duration-500 group/tag hover:!border-indigo-500/60 hover:bg-zinc-800/80 group-hover/marquee:opacity-50 hover:!opacity-100"
          >
            <span className="text-zinc-500 group-hover/tag:text-indigo-400 transition-colors duration-300">
              {tag.icon}
            </span>
            <span className="text-xs font-bold tracking-[0.2em] text-zinc-400 uppercase group-hover/tag:text-zinc-100 transition-colors duration-300">
              {tag.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const InfiniteMarquee = () => {
  return (
    <section className="bg-black pt-2 pb-10 border-b border-zinc-800/40 relative overflow-hidden">
      <style>{`
        .marquee-left {
          animation: slide-left linear infinite;
        }
        .marquee-right {
          animation: slide-right linear infinite;
        }
        @keyframes slide-left {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes slide-right {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
      `}</style>
      
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
      
      <div className="flex flex-col gap-0">
        <MarqueeRow direction="left" duration="80s" />
        <MarqueeRow direction="right" duration="95s" />
      </div>
    </section>
  );
};

export default InfiniteMarquee;
