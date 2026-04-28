import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ShieldCheck, Clock, CalendarDays, AlertCircle, Radio,
  Lock as LockIcon, BookOpen, Power, Fingerprint, CheckCircle2,
  Download, MonitorOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as faceapi from '@vladmandic/face-api';
import Navbar from '../components/Navbar';
import BouncingDotLoader from '../components/BouncingDotLoader';
import api, { getSettings } from '../services/api';
import ModernAlert from '../components/ModernAlert';

/* ─────────────── Sub-components ─────────────── */

const ExamMeta = ({ exam }) => (
  <div className="flex flex-wrap items-center gap-2">
    {[
      { icon: <Fingerprint size={13} className="text-indigo-500" />, label: exam.id, color: 'bg-indigo-50 border-indigo-100 text-indigo-700' },
      { icon: <Clock size={13} className="text-amber-500" />, label: `${exam.duration} mins`, color: 'bg-amber-50 border-amber-100 text-amber-700' },
      { icon: <CalendarDays size={13} className="text-emerald-500" />, label: `${exam.questionsCount || (exam.questions?.length || 0)} questions`, color: 'bg-emerald-50 border-emerald-100 text-emerald-700' }
    ].map((m, i) => (
      <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-sm ${m.color}`}>
        {m.icon}
        <span className="text-[11px] font-semibold tracking-wide">{m.label}</span>
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
  <div className="mt-4 bg-slate-50/70 p-7 rounded-[24px] border border-slate-200/60 shadow-sm relative overflow-hidden">
    {/* Decorative background flair */}
    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
    
    <div className="flex items-center gap-3 mb-6 relative z-10">
      <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 text-orange-500 flex items-center justify-center shadow-sm">
        <AlertCircle size={18} />
      </div>
      <div>
        <h3 className="text-[13px] font-semibold text-slate-800 tracking-tight">Operational Directives</h3>
        <p className="text-[11px] text-slate-500 font-medium mt-0.5">Please review before proceeding</p>
      </div>
    </div>
    
    <div className="space-y-3 relative z-10">
      {(rules || defaultRules).map((rule, idx) => (
        <div key={idx} className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-slate-200">
          <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 text-[10px] font-bold text-slate-400">
            {idx + 1}
          </div>
          <span className="text-[13px] text-slate-600 leading-relaxed font-medium pt-0.5">{rule}</span>
        </div>
      ))}
    </div>
  </div>
);

const CountdownTimer = ({ hours, minutes, seconds, isStarted, onStart }) => (
  <div className="w-full bg-white rounded-3xl p-8 lg:p-10 border border-slate-200 shadow-sm flex flex-col items-center">
    <div className="flex items-center justify-center mb-8">
      {isStarted ? (
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full border border-emerald-200 text-[11px] font-medium">
          <Radio size={13} className="animate-pulse" /> Live — Ready to Start
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-amber-50 text-amber-600 px-4 py-1.5 rounded-full border border-amber-200 text-[11px] font-medium">
          <Clock size={13} /> Waiting for Start Time
        </div>
      )}
    </div>

    <div className="flex justify-center items-center gap-3 mb-10 text-center">
      {[
        { val: hours,   label: 'Hours' },
        { val: minutes, label: 'Mins'  },
        { val: seconds, label: 'Secs'  }
      ].map((t, i) => (
        <React.Fragment key={i}>
          <div className="flex-1">
            <div className="text-5xl lg:text-7xl font-bold text-slate-900 tabular-nums leading-none mb-2">
              {isStarted ? '00' : t.val.toString().padStart(2, '0')}
            </div>
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{t.label}</div>
          </div>
          {i < 2 && <div className="text-2xl font-light text-slate-300 -mt-6">:</div>}
        </React.Fragment>
      ))}
    </div>

    <AnimatePresence mode="wait">
      {isStarted ? (
        <motion.button
          key="unseal-btn"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          onClick={onStart}
          className="w-full bg-slate-900 hover:bg-slate-700 text-white py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-all active:scale-95 shadow-sm"
        >
          <BookOpen size={17} /> Enter Exam
        </motion.button>
      ) : (
        <motion.div
          key="locked-msg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full py-4 text-center"
        >
          <p className="text-[11px] font-medium text-slate-400 flex items-center justify-center gap-2">
            <LockIcon size={13} /> Exam locked until start time
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const SecureEnvironmentWarning = () => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="w-full bg-red-50 border border-red-100 rounded-3xl p-8 flex flex-col items-center text-center shadow-sm"
  >
    <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-6 shadow-inner">
      <MonitorOff size={32} />
    </div>
    <h3 className="text-xl font-bold text-red-900 mb-3">Secure Environment Required</h3>
    <p className="text-sm text-red-700/80 mb-8 leading-relaxed max-w-[300px]">
      This exam is protected. You must use the <strong>Vision Secure Browser</strong> to proceed. Regular browsers are blocked.
    </p>
    <button 
      onClick={() => window.open('/download-secure-browser', '_blank')}
      className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-95"
    >
      <Download size={18} /> Download Secure Browser
    </button>
    <p className="mt-5 text-[11px] font-medium text-red-400 uppercase tracking-widest">Version 1.0.0 (Windows/macOS)</p>
  </motion.div>
);

/* ─────────────── Main Component ─────────────── */

export default function ExamWaitingRoom() {
  const { examId }  = useParams();
  const navigate    = useNavigate();

  const [exam,           setExam]           = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [now,            setNow]            = useState(new Date());
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const [exitPassword,   setExitPassword]   = useState('');
  const [settings,       setSettings]       = useState(null);
  const [aiReady,        setAiReady]        = useState(false);
  const [alertConfig,    setAlertConfig]    = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [isSecure,       setIsSecure]       = useState(true);

  useEffect(() => {
    // 🛡️ Detect Secure Environment (Disabled for standard browser mode)
    document.body.style.overflow = 'hidden';
    const timer = setInterval(() => setNow(new Date()), 1000);

    const preLoadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/');
        setAiReady(true);
      } catch (err) { console.warn('AI pre-load failed'); }
    };

    const fetchExam = async () => {
      try {
        const response = await api.get(`/api/exams/${examId}`);
        setExam(response.data);
      } catch (err) {
        const cached = JSON.parse(localStorage.getItem('published_exams_v2') || 'null');
        const exams = (cached && Array.isArray(cached.data)) ? cached.data : [];
        const found = exams.find(e => e.id === examId);
        if (found) setExam(found);
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
    preLoadModels();
    
    const role = sessionStorage.getItem('vision_role');
    if (role === 'admin' || role === 'mentor' || role === 'super_mentor') {
      getSettings().then(res => {
        if (res) setSettings(res);
      }).catch(err => console.error("Failed to load settings", err));
    }

    return () => { document.body.style.overflow = 'auto'; clearInterval(timer); };
  }, [examId]);

  if (loading) return (
    <div className="h-screen w-full bg-white flex items-center justify-center">
      <BouncingDotLoader text="Syncing with server..." />
    </div>
  );

  if (!exam) return (
    <div className="h-screen w-full bg-white flex items-center justify-center p-6 text-center">
      <div>
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-5">
          <AlertCircle size={28} className="text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Sync Error</h2>
        <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">Failed to load exam details. Please return to the dashboard.</p>
        <button onClick={() => navigate('/student')} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-medium text-sm transition-all hover:bg-slate-700">
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  const startTime = exam.startTime ? new Date(exam.startTime) : null;
  const timeDiff  = startTime ? Math.max(0, startTime.getTime() - now.getTime()) : 0;
  const sTotal    = Math.ceil(timeDiff / 1000);
  const isStarted = startTime ? (now >= startTime || sTotal <= 0) : false;

  const h = Math.floor(sTotal / 3600);
  const m = Math.floor((sTotal % 3600) / 60);
  const s = sTotal % 60;

  return (
    <div className="h-screen w-full bg-[#FFFFFF] font-sans flex flex-col overflow-hidden text-slate-700 select-none">
      <Navbar role="Student" hideSignOut />
      <style>{`html, body { overflow: hidden !important; height: 100% !important; overscroll-behavior: none !important; }`}</style>

      {/* Soft background accent */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-50 rounded-full blur-[160px] opacity-60 pointer-events-none" />

      <main className="flex-1 w-full max-w-[1280px] mx-auto px-6 pt-24 pb-10 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center z-10 relative">

        {/* ── Left: Exam Info ── */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="flex flex-col py-4">
          <div className="mb-7">
            {/* Label */}
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                <ShieldCheck size={16} />
              </div>
              <span className="text-[11px] font-medium text-emerald-600 uppercase tracking-widest">Secure Pre-Flight Lobby</span>
            </div>

            {/* Title — lighter weight */}
            <h1 className="text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight mb-5 leading-snug">{exam.title}</h1>

            {/* Meta chips + AI status */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <ExamMeta exam={exam} />
              <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border shadow-sm ${aiReady ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${aiReady ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                <span className="text-[12px] font-semibold tracking-wide">{aiReady ? 'Systems Ready' : 'Calibrating AI…'}</span>
              </div>
            </div>
          </div>

          <InstructionCard rules={exam.rules} />
        </motion.div>

        {/* ── Right: Countdown or Warning ── */}
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="flex flex-col items-center ml-auto w-full max-w-[460px]">
          {isSecure ? (
            <CountdownTimer
              hours={h} minutes={m} seconds={s}
              isStarted={isStarted}
              onStart={async () => {
                try {
                  if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
                  navigate(`/exam/${exam.id}`);
                } catch (err) {
                  console.warn('Fullscreen request failed:', err);
                  setAlertConfig({
                    isOpen: true,
                    title: 'Action Required',
                    message: 'Please allow Fullscreen permission to start the exam. This is mandatory for security protocols.',
                    type: 'warning'
                  });
                }
              }}
            />
          ) : (
            <SecureEnvironmentWarning />
          )}
        </motion.div>
      </main>

      <ModernAlert 
        isOpen={alertConfig.isOpen} 
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />

      {/* Exit Modal */}
      <AnimatePresence>
        {showExitPrompt && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] bg-black/30 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} className="bg-white border border-slate-200 rounded-2xl p-8 max-w-sm w-full shadow-xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-red-500 mb-5 mx-auto flex items-center justify-center">
                <Power size={24} />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Exit Lobby</h2>
              <p className="text-xs text-slate-400 font-medium mb-6">Enter supervisor password to exit</p>
              <input
                type="password"
                value={exitPassword}
                onChange={e => setExitPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center text-slate-900 font-mono tracking-widest mb-6 outline-none focus:border-slate-900 transition-all text-sm"
              />
              <div className="flex gap-3">
                <button onClick={() => setShowExitPrompt(false)} className="flex-1 py-2.5 text-xs font-medium uppercase tracking-wider border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-all">Cancel</button>
                <button onClick={() => { 
                  const targetPass = settings?.exitPassword || '12345';
                  if (!settings?.exitPassword || exitPassword === targetPass) {
                    navigate('/student'); 
                  } else {
                    setExitPassword(''); 
                  }
                }} className="flex-1 py-2.5 text-xs font-medium uppercase tracking-wider bg-red-600 rounded-xl text-white active:scale-95 transition-all">Exit</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit FAB */}
      <button
        onClick={() => setShowExitPrompt(true)}
        className="fixed bottom-6 right-6 z-[90] w-[52px] h-[52px] bg-white border border-slate-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)] rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 hover:shadow-lg transition-all active:scale-95 group"
      >
        <Power size={20} className="stroke-[2.5px]" />
      </button>
    </div>
  );
}
