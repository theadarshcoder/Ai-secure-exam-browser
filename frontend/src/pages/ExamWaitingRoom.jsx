import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import VisionLogo from '../components/VisionLogo';
import { Clock, AlertCircle, ShieldCheck, Radio, Fingerprint, CalendarDays, Lock, BookOpen, Power } from 'lucide-react';
import { Navbar } from '../components/Navbar';

/* ─────────────── Sub-components ─────────────── */

const ExamMeta = ({ exam }) => (
  <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
    {[
      { icon: <Fingerprint size={14} className="text-indigo-400" />, label: exam.id },
      { icon: <Clock size={14} className="text-amber-400" />, label: `${exam.duration} MINS` },
      { icon: <CalendarDays size={14} className="text-emerald-400" />, label: `${exam.questionsCount} QUESTIONS` }
    ].map((m, i) => (
      <div key={i} className="flex items-center gap-2.5 bg-[#12141a] px-3 py-1.5 rounded-lg border border-white/5 active:scale-95 transition-all">
        {m.icon}
        <span className="text-[11px] font-bold tracking-widest uppercase text-slate-300 font-mono">{m.label}</span>
      </div>
    ))}
  </div>
);

const defaultRules = [
  "Biometric tracking and facial recognition must remain active throughout the session.",
  "Tab switching or unfocusing the window will trigger an immediate session lock.",
  "Environment is isolated via secure sandbox protocols. Hardware virtualization detected."
];

const InstructionCard = ({ rules = defaultRules }) => (
  <div className="mt-4 bg-gradient-to-b from-[#12141a] to-[#0a0c10] p-6 lg:p-8 rounded-3xl border border-white/[0.05] shadow-2xl">
    <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
      <AlertCircle size={16} className="text-red-400" /> Operational Protocols
    </h3>
    <ul className="space-y-4 text-sm text-slate-400">
      {(rules || []).map((rule, idx) => (
        <li key={idx} className="flex items-start gap-4 group">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500/20 mt-1.5 shrink-0 flex items-center justify-center group-hover:scale-125 transition-transform">
            <div className="w-1 h-1 bg-red-400 rounded-full" />
          </div>
          <span className="leading-relaxed font-semibold transition-colors group-hover:text-slate-200">{rule}</span>
        </li>
      ))}
    </ul>
  </div>
);

const CountdownTimer = ({ hours, minutes, seconds, isStarted, onStart }) => (
  <div className="w-full bg-[#12141a]/60 backdrop-blur-2xl rounded-[40px] p-8 lg:p-12 border border-white/[0.08] shadow-2xl relative overflow-hidden flex flex-col items-center">
    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full blur-[100px] opacity-20 pointer-events-none transition-colors duration-1000 ${isStarted ? 'bg-emerald-500' : 'bg-amber-500'}`} />
    
    <div className="relative z-10 w-full">
      <div className="flex items-center justify-center gap-2.5 text-xs font-black uppercase tracking-[0.2em] mb-10">
        {isStarted ? (
          <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full border border-emerald-500/20">
            <Radio size={14} className="animate-pulse" /> Uplink Synchronized
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-amber-500/10 text-amber-500 px-4 py-1.5 rounded-full border border-amber-500/20">
            <Clock size={14} /> Waiting for Server Clock
          </div>
        )}
      </div>

      <div className="flex justify-center items-center gap-4 mb-12 text-center">
        {[
          { val: hours, label: 'Hours' },
          { val: minutes, label: 'Mins' },
          { val: seconds, label: 'Secs' }
        ].map((t, i) => (
          <React.Fragment key={i}>
            <div className="flex-1">
              <div className="text-6xl lg:text-8xl font-black text-white tabular-nums tracking-tighter leading-none mb-3">
                {isStarted ? '00' : t.val.toString().padStart(2, '0')}
              </div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{t.label}</div>
            </div>
            {i < 2 && <div className="text-3xl lg:text-5xl font-black text-slate-800 -mt-8 opacity-50">:</div>}
          </React.Fragment>
        ))}
      </div>

      {isStarted ? (
        <button onClick={onStart} className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#0a0c10] py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all active:scale-95">
          <BookOpen size={20} className="fill-transparent stroke-[#0a0c10] stroke-[2.5px]" /> Unseal Test Environment
        </button>
      ) : (
        <button disabled className="w-full bg-[#0a0c10]/50 border border-white/5 text-slate-700 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] cursor-not-allowed flex items-center justify-center gap-3">
          <Lock size={18} /> Packet Encrypted
        </button>
      )}
    </div>
  </div>
);

/* ─────────────── Main Component ─────────────── */

export default function ExamWaitingRoom() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [now, setNow] = useState(new Date());
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const [exitPassword, setExitPassword] = useState('');
  
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const timer = setInterval(() => setNow(new Date()), 1000);
    
    // Load exam data
    const exams = JSON.parse(localStorage.getItem('published_exams') || '[]');
    const found = exams.find(e => e.id === examId) || {
      id: examId?.toUpperCase() || 'EXM-PROTO',
      title: 'Advanced Computer Architecture',
      duration: 90,
      questionsCount: 50,
      startTime: new Date(Date.now() + 10000).toISOString(),
      rules: [
        "Biometric tracking must remain active throughout.",
        "Tab switching triggers immediate session lock.",
        "Environment isolated via secure sandbox protocols."
      ]
    };
    setExam(found);

    return () => {
      document.body.style.overflow = 'auto';
      clearInterval(timer);
    };
  }, [examId]);

  if (!exam) return null;

  const startTime = new Date(exam.startTime);
  const isStarted = now >= startTime;
  const timeDiff = Math.max(0, startTime.getTime() - now.getTime());
  const sTotal = Math.round(timeDiff / 1000);
  const h = Math.floor(sTotal / 3600);
  const m = Math.floor((sTotal % 3600) / 60);
  const s = sTotal % 60;

  return (
    <div className="h-screen w-full bg-[#0a0c10] font-sans flex flex-col overflow-hidden text-slate-200 select-none">
      <Navbar role="Student" hideSignOut />
      <style>{`html, body { overflow: hidden !important; height: 100% !important; overscroll-behavior: none !important; }`}</style>
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-emerald-500/5 rounded-full blur-[180px] pointer-events-none" />

      <main className="flex-1 w-full max-w-[1280px] mx-auto px-6 pt-24 pb-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center z-10">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="flex flex-col py-4">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center animate-pulse shadow-lg"><ShieldCheck size={20} /></div>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Secure Pre-Flight Lobby</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tighter mb-6 leading-tight uppercase">{exam.title}</h1>
            <ExamMeta exam={exam} />
          </div>
          <InstructionCard rules={exam.rules} />
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="flex flex-col items-center ml-auto w-full max-w-[500px]">
          <CountdownTimer 
            hours={h} 
            minutes={m} 
            seconds={s} 
            isStarted={isStarted} 
            onStart={async () => {
              try {
                if (document.documentElement.requestFullscreen) {
                  await document.documentElement.requestFullscreen();
                }
              } catch (err) {
                console.warn('Fullscreen request failed:', err);
              }
              navigate(`/exam/${exam.id}`);
            }} 
          />
        </motion.div>
      </main>

      <AnimatePresence>
        {showExitPrompt && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#11131a] border border-white/10 rounded-[32px] p-10 max-w-sm w-full shadow-2xl text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 mb-6 mx-auto flex items-center justify-center"><Power size={32} /></div>
              <h2 className="text-2xl font-black text-white tracking-tight mb-2 uppercase italic">Secure Exit</h2>
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-8">Enter pass to terminate lobby</p>
              <input type="password" value={exitPassword} onChange={e => setExitPassword(e.target.value)} placeholder="••••" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-center text-white font-mono tracking-widest mb-8 outline-none focus:border-red-500 transition-all" />
              <div className="flex gap-4">
                <button onClick={() => setShowExitPrompt(false)} className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest border border-white/10 rounded-xl text-slate-400 hover:bg-white/5 transition-all">Cancel</button>
                <button onClick={() => { if (exitPassword === '12345') navigate('/student'); else setExitPassword(''); }} className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest bg-red-600 rounded-xl text-white shadow-lg active:scale-95 transition-all">Power Off</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={() => setShowExitPrompt(true)} className="fixed bottom-6 right-6 z-50 bg-[#12141a] hover:bg-red-600/10 border border-white/5 hover:border-red-500/50 text-slate-500 hover:text-red-500 rounded-full p-4 shadow-2xl transition-all group"><Power size={22} /></button>
    </div>
  );
}
