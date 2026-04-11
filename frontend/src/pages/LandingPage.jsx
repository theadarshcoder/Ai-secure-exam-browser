import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Check, Cpu, Eye, Lock, MonitorCheck, ScanFace, Server, Shield } from 'lucide-react';
import VisionLogo from '../components/VisionLogo';

void motion;

const PILL_STATES = [
  { label: 'LOCK', text: 'text-blue-300', border: 'border-blue-500/30', bg: 'bg-blue-500/15', glow: 'from-blue-600 via-blue-500 to-indigo-500', icon: <Lock className="w-5 h-5 text-blue-300" /> },
  { label: 'SEAL', text: 'text-emerald-300', border: 'border-emerald-500/30', bg: 'bg-emerald-500/15', glow: 'from-emerald-600 via-emerald-400 to-teal-500', icon: <Shield className="w-5 h-5 text-emerald-300" /> },
  { label: 'VERIFY', text: 'text-violet-300', border: 'border-violet-500/30', bg: 'bg-violet-500/15', glow: 'from-violet-600 via-purple-500 to-fuchsia-500', icon: <ScanFace className="w-5 h-5 text-violet-300" /> },
  { label: 'TRUST', text: 'text-amber-300', border: 'border-amber-500/30', bg: 'bg-amber-500/15', glow: 'from-amber-500 via-orange-400 to-rose-500', icon: <Eye className="w-5 h-5 text-amber-300" /> },
];

const FEATURE_ROWS = [
  {
    step: 'Step 1 Verify',
    title: 'Know exactly who is taking the test',
    accent: 'text-indigo-400',
    dot: 'bg-indigo-500/20',
    icon: 'text-indigo-400',
    tone: 'indigo',
    label: 'vision.identity',
    bullets: [
      'Instant face and ID verification before the exam starts',
      'Continuous tracking ensures nobody swaps places',
      'Automatic cross-checking against student records',
    ],
  },
  {
    step: 'Step 2 Secure',
    title: 'Total environment lockdown',
    accent: 'text-emerald-400',
    dot: 'bg-emerald-500/20',
    icon: 'text-emerald-400',
    tone: 'emerald',
    label: 'vision.lockdown',
    bullets: [
      'Blocks all other apps, tabs, and screen-sharing tools',
      'Disables copy-paste, printing, and secondary monitors',
      'Limits internet access exclusively to the exam portal',
    ],
  },
  {
    step: 'Step 3 Monitor',
    title: 'Smart automated vision monitoring',
    accent: 'text-zinc-300',
    dot: 'bg-white/10',
    icon: 'text-white',
    tone: 'rose',
    label: 'vision.monitor',
    bullets: [
      'Tracks eye movement to ensure focus remains on the screen',
      'Flags background voices or unusual audio spikes immediately',
      'Alerts human reviewers only when suspicious activity occurs',
    ],
  },
];

const INFO_CARDS = [
  { title: 'Live vision monitoring', desc: 'Real-time webcam monitoring with automated anomaly detection on every frame.', icon: <Activity className="w-6 h-6 text-indigo-400" /> },
  { title: 'Screen-share blocking', desc: 'Detects and prevents virtual machines, RDP sessions, and screen mirroring instantly.', icon: <MonitorCheck className="w-6 h-6 text-emerald-400" /> },
  { title: 'Offline resilience', desc: 'Seamless continuation during brief network interruptions with automatic sync-back.', icon: <Server className="w-6 h-6 text-rose-400" /> },
  { title: 'Smart behavior tracking', desc: 'Tracks gaze deviation, audio spikes, and keystroke patterns with clean reviewer escalation.', icon: <Cpu className="w-6 h-6 text-amber-400" /> },
  { title: 'Strict access control', desc: 'Exam links are time-locked and single-use with no sharing, replay, or re-entry.', icon: <Lock className="w-6 h-6 text-cyan-400" /> },
  { title: 'Room environment scan', desc: 'Detects additional faces, mobile phones, and unauthorized materials in view.', icon: <Eye className="w-6 h-6 text-fuchsia-400" /> },
];

const STATS = [
  { stat: '0.2ms', label: 'Detection Latency', icon: <Activity className="w-4 h-4 text-indigo-400" /> },
  { stat: '99.9%', label: 'Biometric Accuracy', icon: <ScanFace className="w-4 h-4 text-emerald-400" /> },
  { stat: '1.2B+', label: 'Telemetry Points', icon: <Server className="w-4 h-4 text-rose-400" /> },
  { stat: '100%', label: 'Uptime SLA', icon: <Shield className="w-4 h-4 text-amber-400" /> },
];

function useTicker(length, ms) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex((prev) => (prev + 1) % length), ms);
    return () => clearInterval(id);
  }, [length, ms]);
  return index;
}

const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-8 py-6 mix-blend-difference text-white">
    <div className="flex items-center gap-3">
      <VisionLogo className="w-12 h-12 text-white" />
      <span className="font-bold tracking-[0.2em] text-sm uppercase">Vision</span>
    </div>
    <button onClick={() => { window.location.href = '/login'; }} className="bg-white text-black px-6 py-3 font-bold text-sm tracking-widest uppercase hover:bg-slate-200 transition-colors">
      Login Options
    </button>
  </nav>
);

const Hero = () => {
  const phase = useTicker(4, 850);
  const words = ['JUST YOU', 'THE SCREEN', 'THE TRUTH', 'UNCOMPROMISED EXAMS'];

  return (
    <section className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_28%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.12),transparent_24%)]" />
      <div className="absolute inset-x-0 bottom-0 h-80 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:42px_42px] [mask-image:linear-gradient(to_top,black,transparent)]" />
      <div className="relative z-10 text-center pt-24">
        <AnimatePresence mode="wait">
          <motion.h1 key={words[phase]} initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }} transition={{ duration: 0.45 }} className="text-5xl md:text-8xl font-black tracking-tighter text-white">
            {words[phase]}
          </motion.h1>
        </AnimatePresence>
        <p className="mt-8 text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
          A perfect score means nothing if the process is broken. Vision protects the integrity of the exam so hard work still means something.
        </p>
      </div>
    </section>
  );
};

const CyclingHeadline = () => {
  const idx = useTicker(PILL_STATES.length, 2500);
  const current = PILL_STATES[idx];

  return (
    <section className="bg-black py-12 px-6 text-center relative overflow-hidden">
      <div className={`absolute inset-x-0 top-1/2 mx-auto h-64 w-[42rem] max-w-full -translate-y-1/2 rounded-full blur-[120px] opacity-20 bg-gradient-to-r ${current.glow}`} />
      <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white">The exam platform</h2>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
        <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white">built to</h2>
        <div className={`relative inline-flex items-center gap-3 rounded-full border px-6 py-3 ${current.bg} ${current.border}`}>
          {current.icon}
          <span className={`text-3xl md:text-5xl font-black tracking-tighter uppercase ${current.text}`}>{current.label}</span>
        </div>
      </div>
      <p className="mt-4 text-zinc-400 text-lg md:text-xl max-w-xl mx-auto">
        Vision protects the real effort: <strong className="text-zinc-200 font-medium">the person, the process, and the place.</strong>
      </p>
    </section>
  );
};

const FeatureVisual = ({ tone, label }) => {
  const step = useTicker(3, 1800);
  const tones = {
    indigo: { shell: 'border-indigo-500/20', glow: 'bg-indigo-500/10', text: 'text-indigo-400', line: 'from-indigo-500/0 via-indigo-400 to-indigo-500/0' },
    emerald: { shell: 'border-emerald-500/20', glow: 'bg-emerald-500/10', text: 'text-emerald-400', line: 'from-emerald-500/0 via-emerald-400 to-emerald-500/0' },
    rose: { shell: 'border-rose-500/20', glow: 'bg-rose-500/10', text: 'text-rose-400', line: 'from-rose-500/0 via-rose-400 to-rose-500/0' },
  };
  const current = tones[tone];

  return (
    <div className={`w-full md:w-1/2 aspect-[16/10] rounded-3xl border ${current.shell} bg-[#070707] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.9)]`}>
      <div className="h-10 border-b border-white/5 flex items-center justify-between px-4 text-[10px] font-mono tracking-[0.25em] text-white/30 uppercase">
        <div className="flex gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
        </div>
        <span>{label}</span>
        <span>LIVE</span>
      </div>
      <div className="relative h-[calc(100%-40px)] bg-black/60">
        <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(circle,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="relative z-10 h-full p-5 flex flex-col gap-4">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className={`text-[11px] font-mono uppercase tracking-[0.25em] ${current.text}`}>
              {['Signal stable', 'Reviewing inputs', 'State confirmed'][step]}
            </motion.div>
          </AnimatePresence>
          <div className="grid grid-cols-2 gap-4 flex-1">
            <div className={`rounded-2xl border ${current.shell} ${current.glow} p-4 flex items-center justify-center relative`}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 14, repeat: Infinity, ease: 'linear' }} className={`absolute inset-6 rounded-full border border-dashed ${current.shell}`} />
              <div className={`w-20 h-20 rounded-full border ${current.shell} flex items-center justify-center ${current.glow}`}>
                {tone === 'indigo' && <ScanFace className={`w-8 h-8 ${current.text}`} />}
                {tone === 'emerald' && <Lock className={`w-8 h-8 ${current.text}`} />}
                {tone === 'rose' && <Activity className={`w-8 h-8 ${current.text}`} />}
              </div>
            </div>
            <div className={`rounded-2xl border ${current.shell} bg-black/30 p-4`}>
              <div className="space-y-3">
                {[91, 97, 99].map((value, index) => (
                  <div key={value}>
                    <div className="flex justify-between text-[10px] font-mono text-white/40 mb-1">
                      <span>Metric {index + 1}</span>
                      <span>{value}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                      <motion.div animate={{ scaleX: [value / 100, (value - 6) / 100, value / 100] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} style={{ transformOrigin: 'left' }} className={`h-full bg-gradient-to-r ${current.line}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureSection = ({ row }) => (
  <motion.section className="max-w-7xl mx-auto px-6 md:px-12 w-full flex flex-col md:flex-row items-center gap-16 lg:gap-24" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
    <FeatureVisual tone={row.tone} label={row.label} />
    <div className="w-full md:w-1/2">
      <span className={`font-bold mb-4 font-mono tracking-wider text-sm flex items-center gap-4 ${row.accent}`}>{row.step}</span>
      <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-[1.1] tracking-tight">{row.title}</h2>
      <ul className="flex flex-col gap-5 text-slate-400 mb-10 text-lg">
        {row.bullets.map((bullet) => (
          <li key={bullet} className="flex items-start gap-4">
            <div className={`mt-1 rounded-full p-1 ${row.dot}`}>
              <Check className={`w-4 h-4 ${row.icon}`} />
            </div>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  </motion.section>
);

const SecurityBlocks = () => (
  <section className="bg-[#030303] py-16 md:py-24 flex flex-col gap-20 border-t border-white/5">
    {FEATURE_ROWS.map((row) => <FeatureSection key={row.step} row={row} />)}
  </section>
);

const PlatformSection = () => {
  const active = useTicker(3, 2400);
  const current = ['BIOMETRIC SYNC', 'SHIELD ACTIVE', 'AI VIGILANCE'][active];
  const colors = ['text-indigo-400', 'text-emerald-400', 'text-rose-400'];

  return (
    <section className="bg-black py-20 px-6 md:px-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-14 items-center">
        <div>
          <div className="text-[11px] uppercase tracking-[0.35em] text-slate-500 mb-4">Control Surface</div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-none max-w-2xl">One surface for identity, lockdown, and live anomaly review.</h2>
          <p className="mt-6 text-slate-400 text-lg max-w-xl leading-8">Students get a focused exam environment while reviewers get a clean timeline instead of guesswork.</p>
        </div>
        <div className="rounded-[28px] border border-white/10 bg-[#090909] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
          <div className="h-11 border-b border-white/10 flex items-center px-4 gap-2 bg-[#141414]">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-amber-500/50" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
            <div className="mx-auto rounded-md border border-white/5 bg-black/50 px-6 py-1 text-[10px] text-white/50 font-mono tracking-widest">VISION // KERNEL</div>
          </div>
          <div className="relative h-80 bg-black overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_40%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.14),transparent_35%)]" />
            <AnimatePresence mode="wait">
              <motion.div key={current} initial={{ opacity: 0, scale: 0.88, filter: 'blur(12px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, scale: 1.12, filter: 'blur(12px)' }} transition={{ duration: 0.4 }} className="relative z-10 flex flex-col items-center">
                <div className="w-28 h-28 rounded-full border border-white/10 bg-white/[0.03] flex items-center justify-center">
                  {active === 0 && <ScanFace className="w-10 h-10 text-indigo-400" />}
                  {active === 1 && <Lock className="w-10 h-10 text-emerald-400" />}
                  {active === 2 && <Activity className="w-10 h-10 text-rose-400" />}
                </div>
                <div className={`mt-6 text-[11px] font-mono tracking-[0.35em] ${colors[active]}`}>{current}</div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

const WhiteFeatures = () => (
  <section className="bg-slate-50 py-16 px-8 text-slate-900 border-t border-slate-100">
    <div className="max-w-7xl mx-auto">
      <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-16 max-w-3xl leading-[0.9] text-slate-900">
        Every exam detail
        <br />
        <span className="font-serif italic font-medium">Protected</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {INFO_CARDS.map((card) => (
          <div key={card.title} className="border border-slate-200 p-8 rounded-2xl bg-white hover:shadow-lg transition-all duration-300">
            <div className="mb-6 p-3 bg-zinc-900 inline-flex rounded-xl">{card.icon}</div>
            <h3 className="text-xl font-semibold tracking-tight text-slate-900 mb-3">{card.title}</h3>
            <p className="text-slate-500 leading-[1.7] text-sm">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Stats = () => (
  <section className="bg-black text-zinc-100 py-16 px-6 md:px-12 border-y border-zinc-800/60">
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-16 justify-between items-center">
      <div className="lg:w-1/3">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight leading-tight text-slate-50">Built for exams that actually matter</h2>
        <p className="text-slate-400 text-base leading-[1.7] max-w-sm">Crafted for high-stakes workflows where trust and fairness have to survive scale.</p>
      </div>
      <div className="lg:w-3/5 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        {STATS.map((item) => (
          <div key={item.label}>
            <div className="text-4xl md:text-5xl font-bold tracking-tight text-slate-50 mb-4">{item.stat}</div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center border border-zinc-700">{item.icon}</div>
              <div className="text-slate-400 text-xs font-semibold uppercase tracking-widest">{item.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Footer = () => (
  <section className="bg-black text-zinc-50 relative pt-16 pb-12 px-8 border-t border-zinc-800 overflow-hidden">
    <div className="max-w-4xl mx-auto text-center mb-16">
      <div className="mb-10 flex justify-center">
        <div className="w-24 h-24 border border-white/20 p-6 rounded-3xl bg-indigo-500/10 flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.15)]">
          <Lock className="w-10 h-10 text-white" />
        </div>
      </div>
      <h2 className="text-xs font-semibold uppercase mb-8 text-slate-400 tracking-[0.2em]">YOUR FOCUS, YOUR FUTURE, NOT YOUR FILES</h2>
      <p className="text-2xl md:text-4xl text-slate-500 leading-tight tracking-tight px-4 max-w-3xl mx-auto">We secure the test, then we get out of your way.</p>
    </div>
    <div className="max-w-5xl mx-auto border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="flex items-center gap-2">
        <VisionLogo className="w-5 h-5 text-slate-400" />
        <span className="font-semibold tracking-[0.2em] text-[10px] uppercase text-slate-400">Vision | 2026</span>
      </div>
      <div className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest">BUILT FOR STRUCTURAL INTEGRITY</div>
    </div>
  </section>
);

export default function LandingPage() {
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans scroll-smooth selection:bg-zinc-800">
      <Navbar />
      <Hero />
      <CyclingHeadline />
      <SecurityBlocks />
      <PlatformSection />
      <WhiteFeatures />
      <Stats />
      <Footer />
    </div>
  );
}
