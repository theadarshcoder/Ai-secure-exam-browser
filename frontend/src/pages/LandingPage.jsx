import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Shield, Activity, ScanFace, Lock, MonitorCheck, Server } from 'lucide-react';

// ==========================================
// 1. CRED-Style Navbar
// ==========================================
const CredNavbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6 mix-blend-difference overflow-hidden">
    <div className="flex items-center gap-3">
      <Shield className="text-white w-8 h-8" />
      <span className="text-white font-bold tracking-[0.2em] text-sm uppercase">ProctoShield</span>
    </div>
    <div className="flex gap-8 items-center">
      <div className="hidden md:flex gap-8 text-white/70 text-sm font-semibold tracking-wider">
        <a href="#features" className="hover:text-white transition-colors">FEATURES</a>
        <a href="#security" className="hover:text-white transition-colors">SECURITY</a>
      </div>
      <button className="bg-white text-black px-6 py-3 font-bold text-sm tracking-widest uppercase hover:bg-slate-200 transition-colors">
        Login Options
      </button>
    </div>
  </nav>
);

// ==========================================
// 2. CRED-Style Hero
// ==========================================
const CredHero = () => {
  return (
    <section className="relative h-screen w-full bg-black flex flex-col items-center justify-center text-center px-4 overflow-hidden pt-20">
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="text-white/60 tracking-[0.4em] uppercase text-sm font-bold mb-12"
      >
        Not every platform makes the cut.
      </motion.p>
      
      <motion.h1 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="text-6xl md:text-8xl lg:text-[140px] font-serif text-white tracking-tighter leading-[0.9] mb-8"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        built for the <br />
        integrity-driven
      </motion.h1>

      <motion.p 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="text-white/80 text-xl md:text-2xl font-light tracking-wide max-w-2xl mt-12"
      >
        ProctoShield is a premium environment enabling elite institutions to conduct uncompromised assessments.
      </motion.p>

      {/* Download / Start Button mapping */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 2 }}
        className="absolute bottom-12 right-12 border border-white/20 p-6 flex flex-col gap-4 backdrop-blur-sm hover:border-white/50 transition-colors cursor-pointer"
        onClick={() => window.location.href='/login'}
      >
        <span className="text-white font-bold text-sm tracking-widest uppercase text-right">
          Launch Environment
        </span>
        <div className="w-24 h-24 bg-white/5 flex items-center justify-center border border-white/10">
          <Shield className="w-10 h-10 text-white" />
        </div>
      </motion.div>
    </section>
  );
};

// ==========================================
// 3. Scroll-Linked "Trust" Story
// ==========================================
const CredStoryParallax = () => {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0.1, 0.3, 0.4], [0.1, 1, 0]);
  const y = useTransform(scrollYProgress, [0.1, 0.4], [50, -100]);

  return (
    <section className="relative h-[150vh] bg-black">
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
        <motion.div style={{ opacity, y }} className="max-w-4xl px-8 text-center md:text-left">
          <h2 className="text-5xl md:text-7xl font-serif text-white leading-tight tracking-tight mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
            the story of <br />
            ProctoShield <br />
            begins with trust.
          </h2>
          <p className="text-3xl md:text-5xl font-serif text-white/30 leading-tight tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            we believe institutions who've proven their rigor <span className="text-white">deserve the absolute best.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

// ==========================================
// 4. Massive Phone/Browser Mockup 400vh Track
// ==========================================
const CredMockupSequence = () => {
  return (
    <section className="relative bg-black w-full" style={{ height: "400vh" }}>
      {/* 
        This is a classic CRED native scroll-jacked track. 
        Left side: 3 massive text blocks taking 100vh each.
        Right side: A sticky container holding a Browser Mockup.
      */}
      <div className="flex w-full max-w-7xl mx-auto h-full px-8 relative">
        
        {/* Left Scroll Track */}
        <div className="w-1/2 flex flex-col relative z-20">
          <div className="h-screen flex flex-col justify-center">
            <h3 className="text-white text-5xl md:text-6xl font-black tracking-tight mb-6">biometric handshake.</h3>
            <p className="text-white/60 text-2xl font-light max-w-md leading-relaxed">A seamless 3-second identity verification against structural university databases.</p>
          </div>
          <div className="h-screen flex flex-col justify-center">
            <h3 className="text-white text-5xl md:text-6xl font-black tracking-tight mb-6">environment lockdown.</h3>
            <p className="text-white/60 text-2xl font-light max-w-md leading-relaxed">Immediate suspension of background applications, display mirroring, and network bleed.</p>
          </div>
          <div className="h-screen flex flex-col justify-center">
            <h3 className="text-white text-5xl md:text-6xl font-black tracking-tight mb-6">AI-powered vigilance.</h3>
            <p className="text-white/60 text-2xl font-light max-w-md leading-relaxed">Real-time eye-tracking and peripheral audio monitoring to ensure absolute fairness.</p>
          </div>
          {/* Bottom buffer */}
          <div className="h-screen"></div>
        </div>

        {/* Right Sticky Mockup */}
        <div className="w-1/2 h-screen sticky top-0 flex flex-col items-center justify-center p-12">
          {/* Glass Mockup Window */}
          <div className="w-full aspect-[4/3] bg-[#0c0c0c] border border-white/10 rounded-2xl overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative flex flex-col">
            
            {/* Fake Safari Top Bar */}
            <div className="h-10 border-b border-white/10 flex items-center px-4 gap-2 bg-[#141414]">
              <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
              <div className="mx-auto bg-black/50 px-6 py-1 rounded-md text-[10px] text-white/30 font-mono tracking-widest border border-white/5">EXAMVAULT CORE</div>
            </div>

            {/* Mockup Inside Visuals - CRED uses cross-fading screenshots but we'll use an abstract radar/grid */}
            <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
               <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-50"></div>
               
               <div className="relative z-10 w-32 h-32 rounded-full border border-indigo-500/30 flex items-center justify-center">
                  <div className="absolute w-full h-full border border-indigo-500/20 rounded-full animate-[ping_3s_ease-out_infinite]"></div>
                  <div className="w-16 h-16 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center backdrop-blur-md">
                    <ScanFace className="text-indigo-400 w-8 h-8" />
                  </div>
               </div>

               {/* Scanning Line */}
               <motion.div 
                 animate={{ top: ["0%", "100%", "0%"] }}
                 transition={{ duration: 4, ease: "linear", repeat: Infinity }}
                 className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent shadow-[0_0_20px_theme(colors.indigo.500)]"
               />
            </div>
            
          </div>
        </div>

      </div>
    </section>
  );
};

// ==========================================
// 5. White Contrast Rewards Block
// ==========================================
const CredWhiteFeatures = () => {
  const cards = [
    { title: "zero-latency streaming.", desc: "WebRTC protocols optimized for seamless video without lagging your timer.", icon: <Activity size={32}/> },
    { title: "anti-vm protection.", desc: "Detection matrices blocking Virtual Machines, RDPs, and Screen-Sharing.", icon: <MonitorCheck size={32}/> },
    { title: "offline resilience.", desc: "Sync-Back technology allows continuation during minor net partitions.", icon: <Server size={32}/> }
  ];

  return (
    <section className="bg-white py-32 px-8 text-black border-t border-slate-100">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-5xl md:text-7xl font-sans font-black tracking-tighter mb-20 max-w-3xl leading-[0.9]">
          upgrade your life. <br />
          <span className="font-serif italic font-medium">bit by bit.</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {cards.map((card, i) => (
            <div key={i} className="group relative border border-black/10 hover:border-black/30 p-10 transition-colors duration-500 bg-[#FAFAFA]">
              <div className="mb-8 p-4 bg-black text-white inline-flex rounded-xl transform group-hover:scale-110 transition-transform duration-500">
                {card.icon}
              </div>
              <h3 className="text-3xl font-black tracking-tight mb-4">{card.title}</h3>
              <p className="text-black/60 font-medium leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ==========================================
// 6. Giant Trust Section / Footer
// ==========================================
const CredTrustFooter = () => {
  return (
    <section className="bg-black text-white relative pt-40 pb-20 px-8 border-t border-white/10 overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="max-w-5xl mx-auto text-center relative z-10 mb-32">
        <div className="inline-flex mb-12 border border-white/20 p-6 rounded-3xl bg-white/5 backdrop-blur-md">
          <Lock className="w-12 h-12 text-white/90" />
        </div>
        <h2 className="text-md font-bold tracking-[0.3em] uppercase mb-12 text-[#f3f4f6]">
          YOUR DATA ISN'T OUR BUSINESS. KEEPING IT SAFE IS.
        </h2>
        <p className="text-3xl md:text-5xl font-sans font-medium text-white/40 leading-tight tracking-tight">
          all your personal data and live video feeds are <strong className="text-white font-black">encrypted and secured.</strong> there's no room for mistakes <strong className="text-white font-black">because we didn't leave any.</strong>
        </p>
      </div>

      <div className="max-w-7xl mx-auto border-t border-white/10 pt-10 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6" />
          <span className="font-bold tracking-[0.2em] text-xs uppercase">ProctoShield | 2026</span>
        </div>
        <div className="text-xs text-white/40 font-bold uppercase tracking-widest">
          BUILT FOR STRUCTURAL INTEGRITY.
        </div>
      </div>
    </section>
  );
};

// ==========================================
// Assembly
// ==========================================
export default function LandingPage() {
  // Ensure we are tracking fonts
  useEffect(() => {
    // Inject Playfair Display if needed, though system serifs work.
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  return (
    <div className="bg-black min-h-screen text-white overflow-x-hidden selection:bg-white selection:text-black font-sans scroll-smooth">
      <CredNavbar />
      <CredHero />
      <CredStoryParallax />
      <CredMockupSequence />
      <CredWhiteFeatures />
      <CredTrustFooter />
    </div>
  );
}
