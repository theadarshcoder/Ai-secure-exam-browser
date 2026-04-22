import React, { useEffect, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { useScroll, useTransform, useSpring, AnimatePresence, useMotionValueEvent, useMotionValue, motion } from 'framer-motion';
import { 
  Shield, Activity, ScanFace, Lock, MonitorCheck, 
  Server, ChevronRight, Cpu, Eye, QrCode, Check 
} from 'lucide-react';
import VisionLogo from '../components/VisionLogo';
import { ThemeToggle } from '../contexts/ThemeContext';

// --- Static Metadata & Configuration ---

const CYCLING_STATES = [
  {
    label: 'LOCK',
    gradient: 'from-blue-600 via-blue-500 to-indigo-500',
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/30',
    text: 'text-blue-300',
    icon: <Lock className="w-5 h-5 text-blue-300" />,
  },
  {
    label: 'SEAL',
    gradient: 'from-emerald-600 via-emerald-400 to-teal-500',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    text: 'text-emerald-300',
    icon: <Shield className="w-5 h-5 text-emerald-300" />,
  },
  {
    label: 'VERIFY',
    gradient: 'from-violet-600 via-purple-500 to-fuchsia-500',
    bg: 'bg-violet-500/15',
    border: 'border-violet-500/30',
    text: 'text-violet-300',
    icon: <ScanFace className="w-5 h-5 text-violet-300" />,
  },
  {
    label: 'TRUST',
    gradient: 'from-amber-500 via-orange-400 to-rose-500',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
    text: 'text-amber-300',
    icon: <Eye className="w-5 h-5 text-amber-300" />,
  },
];

const MOCKUP_STATES = [
  {
    id: 0,
    icon: <ScanFace className="text-indigo-400 w-12 h-12" />,
    color: "indigo",
    text: "BIOMETRIC SYNC",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/30",
    innerBorder: "border-indigo-500/20",
    textColor: "text-indigo-500",
    effect: "animate-[ping_3s_ease-out_infinite]"
  },
  {
    id: 1,
    icon: <Lock className="text-emerald-400 w-12 h-12" />,
    color: "emerald",
    text: "SHIELD ACTIVE",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    innerBorder: "border-emerald-500/20",
    textColor: "text-emerald-500",
    effect: "animate-pulse"
  },
  {
    id: 2,
    icon: <Activity className="text-rose-400 w-12 h-12" />,
    color: "rose",
    text: "AI VIGILANCE",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    innerBorder: "border-rose-500/20",
    textColor: "text-rose-500",
    effect: "animate-bounce"
  }
];

const GRID_COLORS = {
  indigo: "rgba(99, 102, 241, 0.4)",
  emerald: "rgba(16, 185, 129, 0.4)",
  rose: "rgba(244, 63, 94, 0.4)"
};

const FEATURE_STEPS = [
  { label: 'Detecting face…', color: 'text-indigo-400' },
  { label: 'Mapping geometry…', color: 'text-indigo-400' },
  { label: 'Matching records…', color: 'text-amber-400' },
  { label: '✓ Identity confirmed', color: 'text-emerald-400' },
];

const LOCKDOWN_STEPS = [
  { label: 'Suspending processes…', color: 'text-emerald-400' },
  { label: 'Blocking net egress…',  color: 'text-emerald-400' },
  { label: 'Disabling clipboard…',  color: 'text-amber-400'   },
  { label: '✓ Environment secured', color: 'text-emerald-400' },
];

const MONITOR_STEPS = [
  { label: 'Calibrating gaze…',   color: 'text-zinc-400'  },
  { label: 'Audio analysis on…', color: 'text-rose-400'   },
  { label: 'Anomaly detected!',  color: 'text-amber-400'  },
  { label: '✓ All clear',         color: 'text-emerald-400'},
];

const SYSTEM_PROCESSES = [
  { proc: 'anydesk.exe',    pid: '4921', status: 'KILLED',      color: 'text-rose-400'    },
  { proc: 'TeamViewer',     pid: '3810', status: 'KILLED',      color: 'text-rose-400'    },
  { proc: 'screen-share',   pid: '5102', status: 'BLOCKED',     color: 'text-amber-400'   },
  { proc: 'net egress',     pid: 'eth1', status: 'RESTRICTED',  color: 'text-amber-400'   },
  { proc: 'clipboard',      pid: 'sys',  status: 'DISABLED',    color: 'text-emerald-400' },
  { proc: 'print spooler', pid: '2048', status: 'STOPPED',     color: 'text-emerald-400' },
];

const SECURITY_EVENTS = [
  { time: '10:42:01', event: 'Audio Spike',  conf: '98%',  color: 'text-rose-300',  badge: 'bg-rose-500/20 border-rose-500/30 text-rose-300' },
  { time: '10:41:55', event: 'Looking Away', conf: '12%',  color: 'text-zinc-400',  badge: '' },
  { time: '10:40:12', event: 'Tab Switch',   conf: '100%', color: 'text-amber-300', badge: 'bg-amber-500/20 border-amber-500/30 text-amber-300' },
  { time: '10:39:40', event: 'Key Anomaly',  conf: '45%',  color: 'text-white/50',  badge: '' },
  { time: '10:38:05', event: 'Multi-Face',   conf: '95%',  color: 'text-rose-300',  badge: 'bg-rose-500/20 border-rose-500/30 text-rose-300' },
];

// --- Sub-components ---

const HybridNavbar = () => {
  const [scrolled, setScrolled] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState('hero');

  // Section definitions — map to the div ids in the page
  const NAV_LINKS = [
    { label: 'Home',     section: 'hero'     },
    { label: 'Security', section: 'security' },
    { label: 'Features', section: 'features' },
    { label: 'Platform', section: 'stats'    },
    { label: 'About',    section: 'trust'    },
  ];

  // Track scroll position for pill morph
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // IntersectionObserver — highlight nav link matching visible section
  React.useEffect(() => {
    const observers = [];
    NAV_LINKS.forEach(({ section }) => {
      const el = document.getElementById(section);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(section);
        },
        { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);

  const scrollTo = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
      style={{ paddingTop: 14 }}
    >
      <motion.div
        variants={{
          top: {
            width: '100%',
            borderRadius: 0,
            backgroundColor: 'transparent',
            backdropFilter: 'blur(0px)',
            boxShadow: 'none',
            paddingLeft: 32,
            paddingRight: 32,
            paddingTop: 10,
            paddingBottom: 10,
            border: '1px solid transparent',
          },
          scrolled: {
            width: '860px',
            borderRadius: 100,
            backgroundColor: 'rgba(10,10,10,0.80)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.07)',
            paddingLeft: 18,
            paddingRight: 18,
            paddingTop: 10,
            paddingBottom: 10,
            border: '1px solid rgba(255,255,255,0.08)',
          },
        }}
        transition={{ type: 'spring', stiffness: 280, damping: 30, mass: 0.8 }}
        initial="top"
        animate={scrolled ? 'scrolled' : 'top'}
        className="flex items-center justify-between pointer-events-auto"
        style={{ maxWidth: '100%' }}
      >
        {/* ── Logo — always shows VISION ── */}
        <div
          className="flex items-center gap-2.5 cursor-pointer shrink-0"
          onClick={() => scrollTo('hero')}
        >
          <motion.div
            variants={{
              top:      { width: 38, height: 38 },
              scrolled: { width: 26, height: 26 },
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={{ flexShrink: 0 }}
          >
            <VisionLogo className="w-full h-full text-white" />
          </motion.div>

          <motion.span
            variants={{
              top:      { fontSize: '15px', letterSpacing: '0.18em' },
              scrolled: { fontSize: '12px', letterSpacing: '0.16em' },
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="text-white font-bold uppercase tracking-[0.18em] leading-none"
          >
            VISION
          </motion.span>
        </div>

        {/* ── Center nav links ── */}
        <div className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.map(({ label, section }) => {
            const isActive = activeSection === section;
            return (
              <motion.button
                key={section}
                onClick={() => scrollTo(section)}
                whileTap={{ scale: 0.94 }}
                className="relative px-4 py-2 rounded-full text-[13px] font-medium tracking-tight transition-all duration-150 outline-none"
                style={{
                  color: isActive ? '#ffffff' : 'rgba(255,255,255,0.55)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {/* active sliding underline / pill */}
                {isActive && (
                  <motion.span
                    layoutId="navActivePill"
                    className="absolute inset-0 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.10)' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{label}</span>

                {/* active underline dot */}
                {isActive && (
                  <motion.span
                    layoutId="navActiveDot"
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-teal-400"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* ── Right side ── */}
        <div className="flex items-center shrink-0">
          <motion.button
            whileHover={{ scale: 1.04, backgroundColor: '#e4e4e7' }}
            whileTap={{ scale: 0.96 }}
            onClick={() => window.location.href = '/login'}
            className="bg-white text-black text-[12px] font-bold tracking-tight px-4 py-2 rounded-full leading-none"
          >
            Get Started
          </motion.button>
        </div>
      </motion.div>
    </motion.nav>
  );
};



const AnimatedStat = ({ target, suffix, label }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 30);
    return () => clearInterval(timer);
  }, [target]);

  return (
    <div className="flex flex-col items-center">
      <span className="text-2xl md:text-3xl font-bold text-slate-900 tabular-nums tracking-tight">
        {count}{suffix}
      </span>
      <span className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase mt-1">
        {label}
      </span>
    </div>
  );
};

const MagneticButton = ({ children, onClick, className }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });
  
  const handleMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.35);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.35);
  };
  
  const handleLeave = () => { x.set(0); y.set(0); };
  
  return (
    <motion.button ref={ref} style={{ x: springX, y: springY }} onMouseMove={handleMove} onMouseLeave={handleLeave} onClick={onClick} className={className}>
      {children}
    </motion.button>
  );
};

const FloatingCard = ({ delay, duration, x, y, rotate, children, className }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1, y: [0, -10, 0], rotate: [rotate, rotate + 4, rotate - 4, rotate] }}
    transition={{ 
      opacity: { duration: 1, delay },
      scale: { duration: 1, delay },
      y: { duration: duration, repeat: Infinity, ease: "easeInOut", delay },
      rotate: { duration: duration * 1.5, repeat: Infinity, ease: "easeInOut", delay }
    }}
    className={`absolute pointer-events-none rounded-2xl border bg-white/70 backdrop-blur-md flex-col p-4 z-0 ${className}`}
    style={{ left: x, top: y }}
  >
    {children}
  </motion.div>
);

const CurvedNeonGrid = () => {
  return (
    <div className="absolute inset-x-0 bottom-0 h-[45%] md:h-[65%] overflow-hidden z-0 pointer-events-none">
      <svg
        viewBox="0 0 1000 450"
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="glowBlue" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="transparent" />
            <stop offset="30%"  stopColor="transparent" />
            <stop offset="50%"  stopColor="#60a5fa" stopOpacity="1" />
            <stop offset="70%"  stopColor="transparent" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <linearGradient id="glowViolet" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="transparent" />
            <stop offset="30%"  stopColor="transparent" />
            <stop offset="50%"  stopColor="#818cf8" stopOpacity="1" />
            <stop offset="70%"  stopColor="transparent" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <linearGradient id="glowEmerald" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="transparent" />
            <stop offset="30%"  stopColor="transparent" />
            <stop offset="50%"  stopColor="#34d399" stopOpacity="1" />
          </linearGradient>
        </defs>

        {[...Array(16)].map((_, i) => {
          const yEdge   = 220 + i * 16;
          const yCenter = 60  + i * 12;
          const pathD = `M -50,${yEdge} Q 500,${yCenter} 1050,${yEdge}`;
          const glowId = i % 3 === 0 ? "glowEmerald" : i % 3 === 1 ? "glowBlue" : "glowViolet";
          const dur = 5 + (i % 4) * 1.2;

          return (
            <g key={i}>
              {/* Static dim baseline */}
              <path d={pathD} fill="none" stroke="rgba(51,65,85,0.35)" strokeWidth="1.2" />
              {/* Moving glow slug */}
              <motion.path
                d={pathD}
                fill="none"
                stroke={`url(#${glowId})`}
                strokeWidth="3"
                pathLength={1}
                strokeDasharray="0.18 1"
                initial={{ strokeDashoffset: 1.2 }}
                animate={{ strokeDashoffset: -0.2 }}
                transition={{
                  duration: dur,
                  repeat: Infinity,
                  ease: "linear",
                  delay: i * 0.35,
                }}
              />
            </g>
          );
        })}
      </svg>
      {/* Fade out bottom so lines dissolve into black floor */}
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black via-black/70 to-transparent" />
    </div>
  );
};

const KineticTextSequence = () => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const sequence = [
      { t: 800, p: 1 },
      { t: 1600, p: 2 },
      { t: 2400, p: 3 }, // clear screen
      { t: 2600, p: 4 }, // show final
    ];
    const timers = sequence.map(s => setTimeout(() => setPhase(s.p), s.t));
    return () => timers.forEach(clearTimeout);
  }, []);

  const singleWordVariants = {
    initial: { scale: 1.5, opacity: 0, rotateX: 90, z: -300, filter: 'blur(10px)' },
    animate: { scale: 1, opacity: 1, rotateX: 0, z: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 500, damping: 25, mass: 1.5 } },
    exit: { scale: 0.8, opacity: 0, rotateX: -90, z: 200, filter: 'blur(10px)', transition: { duration: 0.25 } }
  };

  const finalVariants = {
    initial: { opacity: 0, scale: 0.9, rotateX: 45, z: -100 },
    animate: { opacity: 1, scale: 1, rotateX: 0, z: 0, transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } }
  };



  return (
    <div style={{ perspective: '2000px' }} className="relative z-30 flex flex-col items-center justify-center h-auto w-full px-6 py-8">
      <AnimatePresence mode="popLayout">
        {phase === 0 && (
          <motion.h1 key="w1" variants={singleWordVariants} initial="initial" animate="animate" exit="exit" className={`absolute text-7xl md:text-9xl font-semibold tracking-tight uppercase text-white`} style={{ transformStyle: 'preserve-3d' }}>
            JUST YOU
          </motion.h1>
        )}
        {phase === 1 && (
          <motion.h1 key="w2" variants={singleWordVariants} initial="initial" animate="animate" exit="exit" className={`absolute text-7xl md:text-9xl font-semibold tracking-tight uppercase text-white`} style={{ transformStyle: 'preserve-3d' }}>
            THE SCREEN
          </motion.h1>
        )}
        {phase === 2 && (
          <motion.h1 key="w3" variants={singleWordVariants} initial="initial" animate="animate" exit="exit" className={`absolute text-7xl md:text-9xl font-semibold tracking-tight uppercase text-white`} style={{ transformStyle: 'preserve-3d' }}>
            THE TRUTH
          </motion.h1>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 4 && (
          <motion.div key="final" variants={finalVariants} initial="initial" animate="animate" style={{ transformStyle: 'preserve-3d' }} className="flex flex-col items-center text-center">
             <h1 className="text-5xl md:text-7xl lg:text-[6.5rem] font-semibold uppercase tracking-tight text-glow-sweep flex items-center gap-2 md:gap-4 mb-4">
                UNCOMPROMISED EXAMS<span className="w-4 h-4 md:w-6 md:h-6 bg-emerald-500 rounded-full shadow-[0_0_40px_rgba(16,185,129,1)] animate-pulse" style={{ flexShrink: 0, WebkitTextFillColor: 'initial', backgroundClip: 'unset', background: 'none' }}></span>
             </h1>
             <p className="text-zinc-400 text-lg md:text-xl font-medium max-w-2xl tracking-wide opacity-90 mt-4">
               A perfect score means nothing if the process is broken<br />We protect the integrity of the test so your hard work actually matters
             </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CredHeroParallax = () => {
  
  return (
    <section id="hero" style={{ backgroundColor: '#000000' }} className="w-full h-screen overflow-hidden relative flex flex-col">
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,800;0,900;1,700&display=swap');
          .font-playfair { font-family: 'Playfair Display', serif; }`}
      </style>

      {/* Neon Base Floor — positioned absolutely at bottom */}
      <CurvedNeonGrid />

      {/* Center content — fills the screen minus navbar height */}
      <div className="flex-1 flex items-center justify-center pt-20 pb-8 relative z-30">
        <KineticTextSequence />
      </div>


    </section>
  );
};

const CleanFeatureBlocks = () => {
  return (
    <div className="w-full bg-[#030303] py-16 md:py-24 flex flex-col gap-20 border-t border-white/5 relative z-10">
      
      {/* Feature 1: Identity */}
      <motion.section
        className="max-w-7xl mx-auto px-6 md:px-12 w-full flex flex-col md:flex-row items-center gap-16 lg:gap-24"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Identity Check Visual — Premium Redesign */}
          {React.createElement(function IdentityVisual() {
            const [stepIndex, setStepIndex] = React.useState(0);
            const [clock, setClock] = React.useState('');
            
            React.useEffect(() => {
              const tick = () => setClock(new Date().toLocaleTimeString('en-US', { hour12: false }));
              tick();
              const t = setInterval(tick, 1000);
              return () => clearInterval(t);
            }, []);
            
            React.useEffect(() => {
              const t = setInterval(() => setStepIndex(i => (i + 1) % FEATURE_STEPS.length), 2200);
              return () => clearInterval(t);
            }, []);
            
            const step = FEATURE_STEPS[stepIndex];
          return (
            <div className="w-full md:w-1/2 aspect-[16/10] bg-[#06060e] rounded-2xl border border-white/[0.06] shadow-[0_0_80px_rgba(0,0,0,0.9),0_0_0_1px_rgba(99,102,241,0.07)] overflow-hidden flex flex-col group relative">
              {/* ── Title bar ── */}
              <div className="h-9 bg-[#0d0d18] border-b border-white/[0.05] flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10 group-hover:bg-[#ff5f56] transition-colors duration-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10 group-hover:bg-[#ffbd2e] transition-colors duration-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10 group-hover:bg-[#27c93f] transition-colors duration-300" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white/20 text-[10px] font-mono tracking-[0.25em] uppercase">vision.identity</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/25 text-[10px] font-mono tabular-nums">{clock}</span>
                  <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.8, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.8)]" />
                  <span className="text-indigo-400/80 text-[10px] font-mono tracking-widest">LIVE</span>
                </div>
              </div>

              {/* Main viewport */}
              <div className="flex-1 overflow-hidden bg-[#050510] flex flex-col">
                {/* Dot-grid texture */}
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.25) 1px, transparent 1px)', backgroundSize: '22px 22px', opacity: 0.6, pointerEvents: 'none' }} />

                {/* Step ticker */}
                <div className="shrink-0 h-8 flex items-center justify-center border-b border-white/[0.04]">
                  <AnimatePresence mode="wait">
                    <motion.span key={stepIndex} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} transition={{ duration: 0.3 }}
                      className={`text-[10px] font-mono tracking-[0.2em] ${step.color} uppercase`}>{step.label}</motion.span>
                  </AnimatePresence>
                </div>

                {/* Content: dual mini-panels + log */}
                <div className="flex-1 flex flex-col px-4 pt-3 pb-3 gap-2.5 overflow-hidden relative z-10">
                  {/* Top row */}
                  <div className="flex gap-2.5" style={{ height: '42%' }}>
                    {/* Face scanner panel */}
                    <div className="flex-1 bg-black/30 rounded-xl border border-indigo-500/10 flex flex-col overflow-hidden">
                      <div className="flex items-center gap-2 px-3 pt-2.5 pb-2 border-b border-white/[0.04]">
                        <ScanFace className="w-3 h-3 text-indigo-400" strokeWidth={1.5} />
                        <span className="text-indigo-400/70 text-[9px] font-mono tracking-widest uppercase">Face Scan</span>
                      </div>
                      <div className="flex-1 relative flex items-center justify-center">
                        {/* Corner brackets */}
                        <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-indigo-500/60" />
                        <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-indigo-500/60" />
                        <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-indigo-500/60" />
                        <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-indigo-500/60" />
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }} className="absolute w-14 h-14 rounded-full border border-dashed border-indigo-500/20" />
                        <ScanFace strokeWidth={1.1} className="w-8 h-8 text-indigo-400 drop-shadow-[0_0_14px_rgba(99,102,241,1)] relative z-10" />
                        {/* Scan line */}
                        <motion.div
                          animate={{ y: [0, 80, 0] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                          className="absolute left-4 right-4 h-px z-20 pointer-events-none"
                          style={{ top: '15%', background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.8) 50%, transparent)', boxShadow: '0 0 6px rgba(99,102,241,0.6)' }} />
                      </div>
                    </div>
                    {/* Biometric confidence panel */}
                    <div className="flex-1 bg-black/30 rounded-xl border border-indigo-500/10 flex flex-col overflow-hidden">
                      <div className="flex items-center gap-2 px-3 pt-2.5 pb-2 border-b border-white/[0.04]">
                        <Shield className="w-3 h-3 text-indigo-400" strokeWidth={1.5} />
                        <span className="text-indigo-400/70 text-[9px] font-mono tracking-widest uppercase">Biometrics</span>
                      </div>
                      <div className="flex-1 flex flex-col justify-center gap-2.5 px-3 py-2">
                        {[{ label: 'Face Match', val: 99, color: 'bg-indigo-500' }, { label: 'Liveness', val: 94, color: 'bg-emerald-500' }, { label: 'ID Verify', val: 87, color: 'bg-amber-400' }].map((m, i) => (
                          <div key={i} className="flex flex-col gap-1">
                            <div className="flex justify-between">
                              <span className="text-white/30 text-[8px] font-mono tracking-wider">{m.label}</span>
                              <span className="text-white/40 text-[8px] font-mono tabular-nums">{m.val}%</span>
                            </div>
                            <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
                              <motion.div
                                animate={{ scaleX: [(m.val - 8) / 100, m.val / 100, (m.val - 4) / 100, m.val / 100] }}
                                transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut' }}
                                style={{ transformOrigin: 'left', width: '100%', willChange: 'transform' }}
                                className={`h-full ${m.color} rounded-full`} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Verify log table */}
                  <div className="flex-1 bg-black/30 rounded-xl border border-white/[0.04] overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center px-4 py-2 border-b border-white/[0.04]">
                      <span className="text-white/20 text-[9px] font-mono tracking-widest uppercase w-1/4">Check</span>
                      <span className="text-white/20 text-[9px] font-mono tracking-widest uppercase w-1/2">Result</span>
                      <span className="text-white/20 text-[9px] font-mono tracking-widest uppercase w-1/4 text-right">Score</span>
                    </div>
                    <div className="overflow-hidden flex-1 relative">
                      <motion.div animate={{ y: [0, -5 * 26] }} transition={{ duration: 5, repeat: Infinity, ease: 'linear', repeatType: 'loop' }} className="flex flex-col">
                        {[...[
                          { check: 'Face detect',  result: 'Matched',   score: '99%', color: 'text-emerald-300', badge: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' },
                          { check: 'Liveness',     result: 'Real',      score: '94%', color: 'text-emerald-300', badge: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' },
                          { check: 'ID document',  result: 'Scanning…', score: '—',   color: 'text-indigo-300', badge: 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' },
                          { check: 'Multi-person', result: 'Clear',     score: '100%',color: 'text-emerald-300', badge: '' },
                          { check: 'Spoof detect', result: 'Passed',    score: '97%', color: 'text-emerald-300', badge: '' },
                        ], ...[
                          { check: 'Face detect',  result: 'Matched',   score: '99%', color: 'text-emerald-300', badge: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' },
                          { check: 'Liveness',     result: 'Real',      score: '94%', color: 'text-emerald-300', badge: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' },
                          { check: 'ID document',  result: 'Scanning…', score: '—',   color: 'text-indigo-300', badge: 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' },
                          { check: 'Multi-person', result: 'Clear',     score: '100%',color: 'text-emerald-300', badge: '' },
                          { check: 'Spoof detect', result: 'Passed',    score: '97%', color: 'text-emerald-300', badge: '' },
                        ]].map((row, i) => (
                          <div key={i} className={`flex justify-between items-center px-4 py-1.5 border-b border-white/[0.03] ${row.color}`}>
                            <span className="text-[9px] font-mono w-1/4">{row.check}</span>
                            <span className="text-[9px] font-mono w-1/2">{row.badge ? <span className={`px-1.5 py-0.5 rounded border ${row.badge} text-[9px]`}>{row.result}</span> : row.result}</span>
                            <span className="text-[9px] font-mono w-1/4 text-right">{row.score}</span>
                          </div>
                        ))}
                      </motion.div>
                      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Pill bar */}
                <div className="shrink-0 px-5 py-3 flex items-center justify-between border-t border-white/[0.04] bg-[#050510]">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm border border-emerald-500/20 rounded-full px-2.5 py-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
                      <span className="text-emerald-400 text-[9px] font-mono tracking-widest uppercase">Liveness</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm border border-emerald-500/20 rounded-full px-2.5 py-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
                      <span className="text-emerald-400 text-[9px] font-mono tracking-widest uppercase">Face</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm border border-indigo-500/30 rounded-full px-2.5 py-1">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }} className="w-2 h-2 rounded-full border border-indigo-400 border-t-transparent" />
                      <span className="text-indigo-300 text-[9px] font-mono tracking-widest uppercase">ID Doc</span>
                    </div>
                  </div>
                  <span className="text-white/25 text-[9px] font-mono tabular-nums tracking-wider">99.3% conf.</span>
                </div>
              </div>
            </div>
          );
          })}

        {/* Text */}
        <div className="w-full md:w-1/2 flex flex-col">
          <span className="text-indigo-400 font-bold mb-4 font-mono tracking-wider text-sm flex items-center gap-4">
            Step 1 Verify
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-[1.1] tracking-tight">
            Know exactly who is taking the test
          </h2>
          <ul className="flex flex-col gap-5 text-slate-400 mb-10 text-lg">
            <li className="flex items-start gap-4">
               <div className="mt-1 bg-indigo-500/20 p-1 rounded-full"><Check className="w-4 h-4 text-indigo-400" /></div>
               <span>Instant face and ID verification before the exam starts</span>
            </li>
            <li className="flex items-start gap-4">
               <div className="mt-1 bg-indigo-500/20 p-1 rounded-full"><Check className="w-4 h-4 text-indigo-400" /></div>
               <span>Continuous tracking ensures nobody swaps places</span>
            </li>
            <li className="flex items-start gap-4">
               <div className="mt-1 bg-indigo-500/20 p-1 rounded-full"><Check className="w-4 h-4 text-indigo-400" /></div>
               <span>Automatic cross-checking against student records</span>
            </li>
          </ul>
        </div>
      </motion.section>

      {/* Feature 2: Lockdown (Text Left, Visual Right) */}
      <motion.section
        className="max-w-7xl mx-auto px-6 md:px-12 w-full flex flex-col-reverse md:flex-row items-center gap-16 lg:gap-24"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
      >
        {/* Text */}
        <div className="w-full md:w-1/2 flex flex-col">
          <span className="text-emerald-400 font-bold mb-4 font-mono tracking-wider text-sm flex items-center gap-4">
            Step 2 Secure
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-[1.1] tracking-tight">
            Total environment lockdown
          </h2>
          <ul className="flex flex-col gap-5 text-slate-400 mb-10 text-lg">
            <li className="flex items-start gap-4">
               <div className="mt-1 bg-emerald-500/20 p-1 rounded-full"><Check className="w-4 h-4 text-emerald-400" /></div>
               <span>Blocks all other apps, tabs, and screen-sharing tools</span>
            </li>
            <li className="flex items-start gap-4">
               <div className="mt-1 bg-emerald-500/20 p-1 rounded-full"><Check className="w-4 h-4 text-emerald-400" /></div>
               <span>Disables copy-paste, printing, and secondary monitors</span>
            </li>
            <li className="flex items-start gap-4">
               <div className="mt-1 bg-emerald-500/20 p-1 rounded-full"><Check className="w-4 h-4 text-emerald-400" /></div>
               <span>Limits internet access exclusively to the exam portal</span>
            </li>
          </ul>
        </div>
        {/* Feature 2 Visual — Lockdown */}
        {React.createElement(function LockdownVisual() {
          const [lockStep, setLockStep] = React.useState(0);
          const [clock2, setClock2] = React.useState('');
          
          React.useEffect(() => {
            const tick = () => setClock2(new Date().toLocaleTimeString('en-US', { hour12: false }));
            tick(); 
            const t = setInterval(tick, 1000); 
            return () => clearInterval(t);
          }, []);
          
          React.useEffect(() => {
            const t = setInterval(() => setLockStep(i => (i + 1) % LOCKDOWN_STEPS.length), 2000);
            return () => clearInterval(t);
          }, []);
          
          const ls = LOCKDOWN_STEPS[lockStep];
          return (
            <div className="w-full md:w-1/2 aspect-[16/10] bg-[#06060e] rounded-2xl border border-white/[0.06] shadow-[0_0_80px_rgba(0,0,0,0.9),0_0_0_1px_rgba(16,185,129,0.07)] overflow-hidden flex flex-col group relative">
              {/* Title bar */}
              <div className="h-9 bg-[#0a0f0d] border-b border-white/[0.05] flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10 group-hover:bg-[#ff5f56] transition-colors duration-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10 group-hover:bg-[#ffbd2e] transition-colors duration-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10 group-hover:bg-[#27c93f] transition-colors duration-300" />
                </div>
                <span className="text-white/20 text-[10px] font-mono tracking-[0.25em] uppercase">vision.lockdown</span>
                <div className="flex items-center gap-2">
                  <span className="text-white/25 text-[10px] font-mono tabular-nums">{clock2}</span>
                  <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.8, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                  <span className="text-emerald-400/80 text-[10px] font-mono tracking-widest">ACTIVE</span>
                </div>
              </div>

              {/* Main viewport */}
              <div className="flex-1 overflow-hidden bg-[#04080a] flex flex-col">
                {/* Dot grid */}
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.15) 1px, transparent 1px)', backgroundSize: '22px 22px', opacity: 0.7, pointerEvents: 'none' }} />

                {/* Step ticker */}
                <div className="shrink-0 h-8 flex items-center justify-center border-b border-white/[0.04]">
                  <AnimatePresence mode="wait">
                    <motion.span key={lockStep} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} transition={{ duration: 0.3 }}
                      className={`text-[10px] font-mono tracking-[0.2em] ${ls.color} uppercase`}>{ls.label}</motion.span>
                  </AnimatePresence>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col px-4 pt-3 pb-3 gap-2.5 overflow-hidden relative z-10">
                  {/* Top row */}
                  <div className="flex gap-2.5" style={{ height: '42%' }}>
                    {/* Lock status panel */}
                    <div className="flex-1 bg-black/30 rounded-xl border border-emerald-500/10 flex flex-col overflow-hidden">
                      <div className="flex items-center gap-2 px-3 pt-2.5 pb-2 border-b border-white/[0.04]">
                        <Lock className="w-3 h-3 text-emerald-400" strokeWidth={1.5} />
                        <span className="text-emerald-400/70 text-[9px] font-mono tracking-widest uppercase">Lockdown</span>
                      </div>
                      <div className="flex-1 relative flex items-center justify-center">
                        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                          style={{ willChange: 'transform, opacity' }}
                          className="absolute w-12 h-12 rounded-full bg-emerald-500/20 blur-lg" />
                        <Lock strokeWidth={1.1} className="w-7 h-7 text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.9)] relative z-10" />
                      </div>
                    </div>
                    {/* Network panel */}
                    <div className="flex-1 bg-black/30 rounded-xl border border-emerald-500/10 flex flex-col overflow-hidden">
                      <div className="flex items-center gap-2 px-3 pt-2.5 pb-2 border-b border-white/[0.04]">
                        <Activity className="w-3 h-3 text-emerald-400" strokeWidth={1.5} />
                        <span className="text-emerald-400/70 text-[9px] font-mono tracking-widest uppercase">Network</span>
                      </div>
                      <div className="flex-1 flex flex-col justify-center gap-2 px-3 py-2">
                        {[{ label: 'Exam portal', status: 'ALLOWED', color: 'text-emerald-400' }, { label: 'External web', status: 'BLOCKED', color: 'text-rose-400' }, { label: 'Screen share', status: 'BLOCKED', color: 'text-rose-400' }].map((n, i) => (
                          <div key={i} className="flex justify-between items-center">
                            <span className="text-white/30 text-[8px] font-mono tracking-wider">{n.label}</span>
                            <span className={`text-[8px] font-mono font-bold tracking-widest ${n.color}`}>{n.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Process kill table */}
                  <div className="flex-1 bg-black/30 rounded-xl border border-white/[0.04] overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center px-4 py-2 border-b border-white/[0.04]">
                      <span className="text-white/20 text-[9px] font-mono tracking-widest uppercase w-1/3">Process</span>
                      <span className="text-white/20 text-[9px] font-mono tracking-widest uppercase w-1/4 text-center">PID</span>
                      <span className="text-white/20 text-[9px] font-mono tracking-widest uppercase w-1/3 text-right">Status</span>
                    </div>
                    <div className="overflow-hidden flex-1 relative">
                      <motion.div 
                        animate={{ y: [0, -SYSTEM_PROCESSES.length * 26] }} 
                        transition={{ duration: 5, repeat: Infinity, ease: 'linear', repeatType: 'loop' }} 
                        className="flex flex-col"
                      >
                        {[...SYSTEM_PROCESSES, ...SYSTEM_PROCESSES].map((r, i) => (
                          <div key={i} className="flex justify-between items-center px-4 py-1.5 border-b border-white/[0.03]">
                            <span className="text-white/50 text-[9px] font-mono w-1/3 truncate">{r.proc}</span>
                            <span className="text-white/30 text-[9px] font-mono w-1/4 text-center">{r.pid}</span>
                            <span className={`text-[9px] font-mono font-bold tracking-widest ${r.color} w-1/3 text-right`}>{r.status}</span>
                          </div>
                        ))}
                      </motion.div>
                      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Pill bar */}
                <div className="shrink-0 px-5 py-3 flex items-center justify-between border-t border-white/[0.04] bg-[#04080a]">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm border border-emerald-500/20 rounded-full px-2.5 py-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
                      <span className="text-emerald-400 text-[9px] font-mono tracking-widest uppercase">Display</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm border border-emerald-500/20 rounded-full px-2.5 py-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
                      <span className="text-emerald-400 text-[9px] font-mono tracking-widest uppercase">Clipboard</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm border border-amber-500/20 rounded-full px-2.5 py-1">
                      <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span className="text-amber-300 text-[9px] font-mono tracking-widest uppercase">Net</span>
                    </div>
                  </div>
                  <span className="text-white/25 text-[9px] font-mono tracking-wider">3 threats blocked</span>
                </div>
              </div>
            </div>
          );
          })}
      </motion.section>

      {/* Feature 3: Monitor (Visual Left, Text Right) */}
      <motion.section
        className="max-w-7xl mx-auto px-6 md:px-12 w-full flex flex-col md:flex-row items-center gap-16 lg:gap-24"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
      >
        {/* Feature 3 Visual — Monitor */}
        {React.createElement(function MonitorVisual() {
          const [monStep, setMonStep] = React.useState(0);
          const [clock3, setClock3] = React.useState('');
          
          React.useEffect(() => {
            const tick = () => setClock3(new Date().toLocaleTimeString('en-US', { hour12: false }));
            tick(); 
            const t = setInterval(tick, 1000); 
            return () => clearInterval(t);
          }, []);
          
          React.useEffect(() => {
            const t = setInterval(() => setMonStep(i => (i + 1) % MONITOR_STEPS.length), 2000);
            return () => clearInterval(t);
          }, []);
          
          const ms = MONITOR_STEPS[monStep];
          return (
            <div className="w-full md:w-1/2 aspect-[16/10] bg-[#06060e] rounded-2xl border border-white/[0.06] shadow-[0_0_80px_rgba(0,0,0,0.9),0_0_0_1px_rgba(244,63,94,0.07)] overflow-hidden flex flex-col group relative">
              {/* Title bar */}
              <div className="h-9 bg-[#0e0a0a] border-b border-white/[0.05] flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10 group-hover:bg-[#ff5f56] transition-colors duration-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10 group-hover:bg-[#ffbd2e] transition-colors duration-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10 group-hover:bg-[#27c93f] transition-colors duration-300" />
                </div>
                <span className="text-white/20 text-[10px] font-mono tracking-[0.25em] uppercase">vision.monitor</span>
                <div className="flex items-center gap-2">
                  <span className="text-white/25 text-[10px] font-mono tabular-nums">{clock3}</span>
                  <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.4, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
                  <span className="text-rose-400/80 text-[10px] font-mono tracking-widest">WATCH</span>
                </div>
              </div>

              {/* Main viewport */}
              <div className="flex-1 relative overflow-hidden bg-[#080508] flex flex-col">
                {/* Dot grid */}
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(244,63,94,0.12) 1px, transparent 1px)', backgroundSize: '22px 22px', opacity: 0.8 }} />

                {/* Step ticker */}
                <div className="absolute top-4 left-0 right-0 flex justify-center z-30">
                  <AnimatePresence mode="wait">
                    <motion.span key={monStep} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.3 }}
                      className={`text-[10px] font-mono tracking-[0.2em] ${ms.color} uppercase`}>{ms.label}</motion.span>
                  </AnimatePresence>
                </div>

                {/* Content: dual mini-panels */}
                <div className="flex-1 flex flex-col px-5 pt-9 pb-3 gap-3 relative z-10 overflow-hidden">
                  {/* Top row: Audio + Gaze */}
                  <div className="flex gap-3" style={{ height: '42%' }}>
                    {/* Audio waveform */}
                    <div className="flex-1 bg-black/30 rounded-xl border border-rose-500/10 flex flex-col overflow-hidden">
                      <div className="flex items-center gap-2 px-3 pt-2.5 pb-2 border-b border-white/[0.04]">
                        <Activity className="w-3 h-3 text-rose-400" />
                        <span className="text-rose-400/70 text-[9px] font-mono tracking-widest uppercase">Audio dB</span>
                      </div>
                      <div className="flex-1 flex items-end justify-between px-3 pb-2.5 gap-0.5">
                        {[...Array(18)].map((_, i) => {
                          const h = 15 + ((i * 37 + 13) % 60);
                          return (
                            <motion.div key={i}
                              animate={{ scaleY: [0.4, 1, 0.6, 1] }}
                              style={{ height: `${h}%`, transformOrigin: 'bottom', willChange: 'transform' }}
                              transition={{ duration: 0.6 + (i % 4) * 0.15, repeat: Infinity, ease: 'easeInOut', delay: i * 0.05 }}
                              className="flex-1 bg-gradient-to-t from-rose-600/60 to-rose-400/30 rounded-t-sm"
                            />
                          );
                        })}
                      </div>
                    </div>
                    {/* Gaze tracker */}
                    <div className="flex-1 bg-black/30 rounded-xl border border-indigo-500/10 flex flex-col overflow-hidden">
                      <div className="flex items-center gap-2 px-3 pt-2.5 pb-2 border-b border-white/[0.04]">
                        <Eye className="w-3 h-3 text-indigo-400" />
                        <span className="text-indigo-400/70 text-[9px] font-mono tracking-widest uppercase">Gaze</span>
                      </div>
                      <div className="flex-1 relative flex items-center justify-center">
                        {/* crosshair */}
                        <div className="absolute w-12 h-12 border border-white/10 rounded-full" />
                        <div className="absolute w-5 h-5 border border-white/10 rounded-full" />
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/5" />
                        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/5" />
                        <motion.div
                          animate={{ x: [-16, 12, -8, 18, -4, 6, -16], y: [-8, 10, -14, 4, 12, -6, -8] }}
                          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                          className="relative z-10 w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.9)]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Event log table */}
                  <div className="flex-1 bg-black/30 rounded-xl border border-white/[0.04] overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center px-4 py-2 border-b border-white/[0.04]">
                      <span className="text-white/20 text-[9px] font-mono tracking-widest uppercase w-1/4">Time</span>
                      <span className="text-white/20 text-[9px] font-mono tracking-widest uppercase w-1/2">Event</span>
                      <span className="text-white/20 text-[9px] font-mono tracking-widest uppercase w-1/4 text-right">Conf</span>
                    </div>
                    <div className="overflow-hidden flex-1 relative">
                      <motion.div 
                        animate={{ y: [0, -SECURITY_EVENTS.length * 26] }} 
                        transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatType: 'loop' }} 
                        className="flex flex-col"
                      >
                        {[...SECURITY_EVENTS, ...SECURITY_EVENTS].map((ev, i) => (
                          <div key={i} className={`flex justify-between items-center px-4 py-1.5 border-b border-white/[0.03] ${ev.color}`}>
                            <span className="text-[9px] font-mono w-1/4">{ev.time}</span>
                            <span className="text-[9px] font-mono w-1/2">
                              {ev.badge ? <span className={`px-1.5 py-0.5 rounded border ${ev.badge} text-[9px]`}>{ev.event}</span> : ev.event}
                            </span>
                            <span className="text-[9px] font-mono w-1/4 text-right">{ev.conf}</span>
                          </div>
                        ))}
                      </motion.div>
                      <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Pill bar */}
                <div className="shrink-0 px-5 py-3 flex items-center justify-between border-t border-white/[0.04] bg-[#080508]">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm border border-rose-500/20 rounded-full px-2.5 py-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.8)]" />
                      <span className="text-rose-400 text-[9px] font-mono tracking-widest uppercase">Audio</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm border border-indigo-500/20 rounded-full px-2.5 py-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_5px_rgba(99,102,241,0.8)]" />
                      <span className="text-indigo-300 text-[9px] font-mono tracking-widest uppercase">Gaze</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm border border-amber-500/20 rounded-full px-2.5 py-1">
                      <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span className="text-amber-300 text-[9px] font-mono tracking-widest uppercase">Events</span>
                    </div>
                  </div>
                  <span className="text-white/25 text-[9px] font-mono tracking-wider">AI score 94.1</span>
                </div>
              </div>
            </div>
          );
          })}
        {/* Text */}
        <div className="w-full md:w-1/2 flex flex-col">
          <span className="text-zinc-300 font-bold mb-4 font-mono tracking-wider text-sm flex items-center gap-4">
            Step 3 Monitor
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-[1.1] tracking-tight">
            Smart automated Vision Monitoring
          </h2>
          <ul className="flex flex-col gap-5 text-slate-400 mb-10 text-lg">
            <li className="flex items-start gap-4">
               <div className="mt-1 bg-white/10 p-1 rounded-full"><Check className="w-4 h-4 text-white" /></div>
               <span>Tracks eye movement to ensure focus remains on the screen</span>
            </li>
            <li className="flex items-start gap-4">
               <div className="mt-1 bg-white/10 p-1 rounded-full"><Check className="w-4 h-4 text-white" /></div>
               <span>Flags background voices or unusual audio spikes immediately</span>
            </li>
            <li className="flex items-start gap-4">
               <div className="mt-1 bg-white/10 p-1 rounded-full"><Check className="w-4 h-4 text-white" /></div>
               <span>Alerts human reviewers only when suspicious activity occurs</span>
            </li>
          </ul>
        </div>
      </motion.section>

    </div>
  );
};


const MagneticText = ({ children, isActive }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 });
  const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 });

  const handleMouse = (e) => {
    if (!isActive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.2);
    y.set((e.clientY - centerY) * 0.2);
  };

  return (
    <motion.div 
      onMouseMove={handleMouse} 
      onMouseLeave={() => { x.set(0); y.set(0); }} 
      style={{ x: springX, y: springY }} 
      className="w-fit"
    >
      {children}
    </motion.div>
  );
};

const CredMockupSequence = () => {
  const trackRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });
  const [activeStep, setActiveStep] = useState(0);
  const springProgress = useSpring(scrollYProgress, { stiffness: 400, damping: 90, mass: 0.1 });
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), { stiffness: 300, damping: 30 });

  const handleMockupHover = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(px);
    mouseY.set(py);
  };
  
  const handleMockupLeave = () => { mouseX.set(0); mouseY.set(0); };

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest < 0.33) {
      if (activeStep !== 0) setActiveStep(0);
    } else if (latest < 0.66) {
      if (activeStep !== 1) setActiveStep(1);
    } else {
      if (activeStep !== 2) setActiveStep(2);
    }
  });

  return (
    <section id="features" ref={trackRef} className="relative bg-[#030303] w-full" style={{ height: "150vh" }}>
      {/* Dynamic Marquee Divider */}
      <div className="w-full h-16 border-y border-white/5 bg-[#080808] overflow-hidden flex items-center relative z-20">
        <div className="absolute inset-0 bg-gradient-to-r from-[#030303] via-transparent to-[#030303] z-10" />
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="flex whitespace-nowrap gap-12 font-mono text-xs tracking-[0.3em] text-white/20 uppercase"
        >
          {Array(8).fill("Continuous Verification · Zero Trust Environment · AI-Powered Vision · ").map((text, i) => (
            <span key={i}>{text}</span>
          ))}
        </motion.div>
      </div>

      <div className="flex w-full max-w-7xl mx-auto h-[calc(100%-7rem)] px-8 relative mt-12">
        <div className="absolute left-4 top-0 bottom-0 w-1 bg-white/10 z-10 hidden md:block">
           <motion.div 
             style={{ scaleY: springProgress, originY: 0 }} 
             className="w-full h-full bg-white relative"
           />
        </div>

        <div className="w-full md:w-1/2 flex flex-col relative z-20 pl-0 md:pl-8 lg:pl-16 pr-4 md:pr-12 lg:pr-16 justify-center">
          {[
            { step: "01", title: "Identity verified", desc: "Instant biometric face scan cross-checks with student records to ensure no start until confirmed", color: "indigo" },
            { step: "02", title: "Environment secured", desc: "Background apps suspended, screen-sharing blocked and copy-paste disabled to keep the exam secure", color: "emerald" },
            { step: "03", title: "Live monitoring", desc: "Every eye movement and audio spike is logged and flagged for review in real-time", color: "rose" }
          ].map((item, i) => {
            const isActive = activeStep === i;
            return (
              <motion.div 
                key={i} 
                className={"py-16 md:py-24 flex flex-col justify-center relative pl-10 md:pl-12 transition-all duration-700 " + (isActive ? "opacity-100 scale-100" : "opacity-30 scale-95")}
              >
                <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                  <span className={"font-mono text-xs font-bold transition-colors duration-700 " + (isActive ? "text-" + item.color + "-400" : "text-white/20")}>
                    {item.step}
                  </span>
                  <div className={"w-1 transition-all duration-700 rounded-full " + (isActive ? "h-12 shadow-[0_0_15px_rgba(255,255,255,0.5)] bg-" + item.color + "-500 shadow-" + item.color + "-500/50" : "h-4 bg-white/10")} />
                </div>

                <MagneticText isActive={isActive}>
                   <h3 className="text-white text-4xl lg:text-5xl font-semibold tracking-tight mb-4">{item.title}</h3>
                </MagneticText>
                
                <p className="text-white/60 text-lg md:text-xl font-light max-w-sm lg:max-w-md leading-relaxed">{item.desc}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="hidden md:flex w-1/2 h-[calc(100vh-6rem)] sticky top-24 flex-col items-center justify-center p-8 perspective-1000 z-30">
          <motion.div 
            onMouseMove={handleMockupHover}
            onMouseLeave={handleMockupLeave}
            style={{ rotateX, rotateY }}
            className="w-[90%] max-w-[420px] aspect-[4/3] bg-[#0c0c0c] border border-white/10 rounded-2xl overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative flex flex-col origin-center"
          >
            <div className="h-10 border-b border-white/10 flex items-center px-4 gap-2 bg-[#141414] z-20 shrink-0">
              <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
              <div className="mx-auto bg-black/50 px-6 py-1 rounded-md text-[10px] text-white/50 font-mono tracking-widest border border-white/5">VISION // KERNEL</div>
            </div>

            <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden z-10 w-full h-full" style={{ perspective: "1000px" }}>
               <motion.div 
                 className="absolute origin-top pointer-events-none z-0"
                 style={{ 
                   width: '300%', height: '300%',
                   top: '-50%', left: '-100%',
                   rotateX: 75,
                   backgroundImage: `linear-gradient(${GRID_COLORS[MOCKUP_STATES[activeStep].color]} 1px, transparent 1px), linear-gradient(90deg, ${GRID_COLORS[MOCKUP_STATES[activeStep].color]} 1px, transparent 1px)`,
                   backgroundSize: '80px 80px',
                   backgroundPositionY: useTransform(springProgress, [0, 1], ['0px', '4000px']),
                   transition: 'background-image 0.5s ease-in-out'
                 }}
               >
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
               </motion.div>
               
               <AnimatePresence mode="wait">
                 <motion.div 
                    key={activeStep}
                    initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 1.2, filter: "blur(10px)" }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 flex flex-col items-center justify-center"
                 >
                    <div className="relative flex items-center justify-center">
                       <svg className="absolute w-[140px] h-[140px] -rotate-90 pointer-events-none opacity-50 z-20">
                         <circle cx="70" cy="70" r="68" stroke="currentColor" strokeWidth="2" fill="none" className="text-white/10" />
                         <motion.circle 
                            cx="70" cy="70" r="68" 
                            stroke="currentColor" 
                            strokeWidth="2" fill="none" 
                            className={MOCKUP_STATES[activeStep].textColor} 
                            strokeDasharray="427" 
                            style={{ strokeDashoffset: useTransform(springProgress, [0, 1], [427, 0]) }} 
                         />
                       </svg>

                       <div className={`relative w-28 h-28 rounded-full border ${MOCKUP_STATES[activeStep].border} flex items-center justify-center ${MOCKUP_STATES[activeStep].bg} backdrop-blur-md z-10`}>
                           <div className={`absolute w-full h-full border ${MOCKUP_STATES[activeStep].innerBorder} rounded-full ${MOCKUP_STATES[activeStep].effect}`}></div>
                           {React.cloneElement(MOCKUP_STATES[activeStep].icon, { className: MOCKUP_STATES[activeStep].icon.props.className.replace('w-12 h-12', 'w-10 h-10') })}
                       </div>
                    </div>

                    <span className={"mt-6 tracking-[0.4em] font-mono text-[10px] md:text-xs font-bold " + MOCKUP_STATES[activeStep].textColor + " z-10"}>
                      {MOCKUP_STATES[activeStep].text}
                    </span>
                 </motion.div>
               </AnimatePresence>

               <motion.div 
                 animate={{ top: ["0%", "100%", "0%"] }}
                 transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                 className="absolute left-0 w-full h-[2px] bg-white/20 shadow-[0_0_30px_rgba(255,255,255,0.5)] z-0 pointer-events-none"
               />
            </div>
            
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const CredStatsGrid = () => {
  return (
    <section id="stats" className="bg-black text-zinc-100 py-16 px-6 md:px-12 border-y border-zinc-800/60">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-16 justify-between items-center">
        <div className="lg:w-1/3 flex flex-col justify-center">
          <h2 className="text-4xl md:text-5xl font-semibold mb-6 tracking-tight leading-tight text-slate-50">
            Built for exams that actually matter
          </h2>
          <p className="text-slate-400 text-base font-normal leading-[1.7] max-w-sm">
            Crafted for the weight of your future
          </p>
        </div>

        <div className="lg:w-3/5 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
           {[ 
             { stat: "0.2ms", label: "Detection Latency", icon: <Activity className="w-4 h-4 text-indigo-400" /> },
             { stat: "99.9%", label: "Biometric Accuracy", icon: <ScanFace className="w-4 h-4 text-emerald-400" /> },
             { stat: "1.2B+", label: "Telemetry Points", icon: <Server className="w-4 h-4 text-rose-400" /> },
             { stat: "100%", label: "Uptime SLA", icon: <Shield className="w-4 h-4 text-amber-400" /> }
           ].map((item, i) => (
             <div key={i} className="p-0 shadow-none border-none flex flex-col justify-center">
               <div className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-50 mb-4 block">
                 {item.stat}
               </div>

               <div className="flex items-center gap-3 mt-1">
                 <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center border border-zinc-700 group-hover:border-zinc-600 transition-colors duration-300">
                   {item.icon}
                 </div>
                 <div className="text-slate-400 text-xs font-semibold uppercase tracking-widest group-hover:text-slate-300 transition-colors duration-300">
                   {item.label}
                 </div>
               </div>
             </div>
           ))}
        </div>
      </div>
    </section>
  );
};

const CredWhiteFeatures = () => {
  const cards = [
    { title: "Live Vision monitoring", desc: "Real-time webcam monitoring with automated anomaly detection on every frame", icon: <Activity className="text-white group-hover:text-indigo-400 transition-colors duration-500" size={24}/> },
    { title: "Screen-share blocking", desc: "Detects and prevents virtual machines, RDP sessions, and screen mirroring instantly", icon: <MonitorCheck className="text-white group-hover:text-emerald-400 transition-colors duration-500" size={24}/> },
    { title: "Offline resilience", desc: "Seamless continuation during brief network interruptions with automatic sync-back", icon: <Server className="text-white group-hover:text-rose-400 transition-colors duration-500" size={24}/> },
    { title: "Smart behavior tracking", desc: "Tracks multiple signals carefully: gaze deviation, audio spikes, and keystroke patterns", icon: <Cpu className="text-white group-hover:text-amber-400 transition-colors duration-500" size={24}/> },
    { title: "Strict access control", desc: "Exam links are time-locked and single-use with no sharing, replay, or re-entry", icon: <Lock className="text-white group-hover:text-cyan-400 transition-colors duration-500" size={24}/> },
    { title: "Room environment scan", desc: "Detects additional faces, mobile phones, and unauthorized materials in view", icon: <Eye className="text-white group-hover:text-fuchsia-400 transition-colors duration-500" size={24}/> }
  ];

  return (
    <section className="bg-slate-50 py-16 px-8 text-slate-900 border-t border-slate-100 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl md:text-7xl font-sans font-semibold tracking-tight mb-16 max-w-3xl leading-[0.9] text-slate-900"
        >
          Every exam detail <br />
          <span className="font-serif italic font-medium">Protected</span>
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: (i % 3) * 0.1, ease: "easeOut" }}
              className="group relative border border-slate-200 hover:border-slate-300 hover:shadow-lg hover:-translate-y-0.5 p-8 rounded-2xl transition-all duration-500 bg-white"
            >
              <div className="mb-6 p-3 bg-zinc-800 inline-flex rounded-xl transform group-hover:scale-105 group-hover:-rotate-2 transition-transform duration-500">
                {card.icon}
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-slate-900 mb-3">{card.title}</h3>
              <p className="text-slate-500 font-normal leading-[1.7] text-sm">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CredTrustFooter = () => {
  const [email, setEmail] = React.useState('');
  const [subscribed, setSubscribed] = React.useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) { setSubscribed(true); setEmail(''); }
  };

  const cols = [
    {
      title: 'Platform',
      links: ['Overview', 'Live Proctoring', 'AI Monitoring', 'Secure Browser', 'Exam Management', 'Analytics & Reports'],
    },
    {
      title: 'Use Cases',
      links: ['Universities', 'Coding Assessments', 'Corporate HR', 'Certification Bodies', 'Remote Hiring', 'Competitive Exams'],
    },
    {
      title: 'Company',
      links: ['About Vision', 'How It Works', 'Security & Privacy', 'Documentation', 'Contact Us', 'Changelog'],
    },
  ];

  const socials = [
    { label: 'GH', title: 'GitHub' },
    { label: 'LI', title: 'LinkedIn' },
    { label: 'TW', title: 'Twitter / X' },
    { label: 'YT', title: 'YouTube' },
  ];

  return (
    <section className="bg-[#080808] text-zinc-300 relative border-t border-white/[0.06] overflow-hidden">

      {/* Subtle ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[200px] bg-teal-600/5 blur-[100px] pointer-events-none rounded-full" />

      {/* ── Trust quote band ── */}
      <div className="border-b border-white/[0.06] py-12 px-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-2xl md:text-3xl font-light text-zinc-400 leading-snug tracking-tight max-w-2xl"
          >
            We secure the test, then{' '}
            <strong className="text-white font-semibold">get out of your way.</strong>
          </motion.p>
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => window.location.href = '/login'}
            className="shrink-0 bg-white text-black font-bold text-sm tracking-widest uppercase px-8 py-4 rounded-full hover:bg-zinc-100 transition-colors"
          >
            Get Started →
          </motion.button>
        </div>
      </div>

      {/* ── Main footer grid ── */}
      <div className="max-w-7xl mx-auto px-8 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">

        {/* Link columns */}
        {cols.map((col) => (
          <div key={col.title}>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 mb-5">
              {col.title}
            </p>
            <ul className="flex flex-col gap-3">
              {col.links.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-[15px] text-zinc-400 hover:text-white transition-colors duration-150 leading-none"
                    onClick={e => e.preventDefault()}
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Newsletter + Social */}
        <div className="lg:col-span-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 mb-5">
            Stay in the loop
          </p>

          {subscribed ? (
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-6">
              <Check size={16} /> You're subscribed!
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex items-center gap-0 mb-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Your email here"
                className="flex-1 bg-transparent border-b border-zinc-700 focus:border-zinc-400 outline-none text-white text-sm py-2 pr-3 placeholder:text-zinc-600 transition-colors"
              />
              <button
                type="submit"
                className="ml-3 w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:bg-zinc-200 transition-colors shrink-0"
              >
                <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </form>
          )}

          <p className="text-[11px] text-zinc-600 leading-relaxed mb-10">
            By signing up, you agree to our{' '}
            <a href="#" className="underline hover:text-zinc-400 transition-colors" onClick={e=>e.preventDefault()}>
              Privacy Policy
            </a>
            . We respect your data. Unsubscribe anytime.
          </p>

          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 mb-4">
            Follow us on:
          </p>
          <div className="flex items-center gap-3">
            {socials.map((s) => (
              <motion.a
                key={s.label}
                href="#"
                title={s.title}
                onClick={e => e.preventDefault()}
                whileHover={{ scale: 1.1, backgroundColor: '#fff', color: '#000' }}
                whileTap={{ scale: 0.94 }}
                className="w-10 h-10 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors text-[11px] font-black tracking-tight"
                style={{ transition: 'background 0.15s, color 0.15s' }}
              >
                {s.label}
              </motion.a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-white/[0.06] px-8 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <VisionLogo className="w-5 h-5 text-zinc-500" />
            <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-zinc-500">
              Vision
            </span>
          </div>

          {/* Copyright */}
          <p className="text-[11px] text-zinc-600 font-medium">
            © 2026 Vision Secure Exams. All rights reserved.
          </p>

          {/* Right links */}
          <div className="flex items-center gap-6">
            <span className="text-zinc-800 text-[10px]">•</span>
            <a href="#" onClick={e=>e.preventDefault()} className="text-[11px] text-zinc-500 hover:text-white transition-colors font-medium">Privacy Policy</a>
            <a href="#" onClick={e=>e.preventDefault()} className="text-[11px] text-zinc-500 hover:text-white transition-colors font-medium">Terms of Use</a>
            <a href="#" onClick={e=>e.preventDefault()} className="text-[11px] text-zinc-500 hover:text-white transition-colors font-medium">Security</a>
          </div>

          {/* Scroll to top */}
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: '#fff', color: '#000' }}
            whileTap={{ scale: 0.92 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-10 h-10 rounded-full border border-zinc-700 text-zinc-400 flex items-center justify-center text-sm font-bold transition-colors"
          >
            ↑
          </motion.button>
        </div>
      </div>
    </section>
  );
};

const CyclingPillHeadline = () => {
  const [idx, setIdx] = useState(0);
  const current = CYCLING_STATES[idx];

  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % CYCLING_STATES.length), 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <section style={{ backgroundColor: '#000000' }} className="pt-12 pb-12 px-6 relative overflow-hidden flex flex-col items-center text-center">
      <div
        className={`absolute w-[600px] h-[300px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 blur-[120px] opacity-20 rounded-full bg-gradient-to-r ${current.gradient} transition-all duration-1000`}
      />
      <h2 className="text-5xl md:text-7xl font-semibold tracking-tight text-white leading-tight mb-0">
        The exam platform
      </h2>
      <div className="flex items-center gap-4 mt-1 flex-wrap justify-center">
        <h2 className="text-5xl md:text-7xl font-semibold tracking-tight text-white leading-tight">
          built to
        </h2>
        <div
          className={`relative inline-flex items-center gap-3 px-6 py-3 rounded-full border ${current.bg} ${current.border} overflow-hidden`}
          style={{ minWidth: '200px' }}
        >
          <div className={`absolute inset-0 bg-gradient-to-r ${current.gradient} opacity-10 rounded-full`} />
          <AnimatePresence mode="popLayout">
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -28 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-3 relative z-10"
            >
              {current.icon}
              <span className={`text-3xl md:text-5xl font-black tracking-tighter uppercase ${current.text}`}>
                {current.label}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <p className="mt-4 text-zinc-400 text-lg md:text-xl max-w-xl leading-relaxed">
        Vision protects the real effort: <strong className="text-zinc-200 font-medium">The Person, The Process, and The Place</strong>
      </p>
    </section>
  );
};

export default function LandingPage() {

  useEffect(() => {
    // 🛡️ Security: Flush existing sessions when visiting landing page (fixes auto-login bug)
    if (sessionStorage.getItem('vision_token') || localStorage.getItem('vision_token')) {
      sessionStorage.clear();
      localStorage.clear();
    }

    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    return () => { 
      if (document.head.contains(link)) document.head.removeChild(link); 
    };
  }, []);

  return (
    <div style={{ backgroundColor: '#000000' }} className="min-h-screen font-sans scroll-smooth selection:bg-zinc-800 relative landing-page-root">
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .landing-page-root, #hero, #security, #features, #stats, #trust {
          background-color: #000000 !important;
        }
      `}</style>
      <HybridNavbar />
      <div id="hero">
        <CredHeroParallax />
      </div>
      <div id="security">
        <CyclingPillHeadline />
        <CleanFeatureBlocks />
      </div>
      <div id="features">
        <CredMockupSequence />
        <CredWhiteFeatures />
      </div>
      <div id="stats">
        <CredStatsGrid />
      </div>
      <div id="trust">
        <CredTrustFooter />
      </div>
    </div>
  );
}
