import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Camera, CameraOff, Clock, Shield, CheckCircle,
  ChevronRight, ChevronLeft, Send,
  Bookmark, Terminal, Eye
} from 'lucide-react';

/* ─────────────── Exam Data ─────────────── */
const EXAM_QUESTIONS = [
  ...Array(20).fill(null).map((_, i) => ({
    id: i + 1,
    text:
      i === 0 ? 'Examine the relationship between time complexity and spatial constraints in a distributed ledger environment. What is the primary bottleneck for O(n log n) operations at scale?'
      : i === 1 ? 'In a high-concurrency LIFO structure, identify the most common race condition when performing atomic POP operations across multiple threads.'
      : i === 2 ? 'Identify the correct OSI layer where BGP routing protocols primarily operate and manage inter-autonomous system connectivity.'
      : i === 3 ? 'Analyze the Priority Scheduling algorithm. In what scenario does "Priority Inversion" lead to a total system deadlock?'
      : i === 4 ? 'Distinguish between Blind SQL Injection and Error-based SQL Injection in terms of data exfiltration efficiency.'
      : `Technical Assessment Q${i + 1}: Analyze the provided architectural pattern and identify the most critical flaw that would lead to service degradation under peak load.`,
    options: [
      'Linear scaling limits in distributed state management.',
      'Quadratic complexity in local cache invalidation cycles.',
      'Logarithmic latency in peer-to-peer discovery protocols.',
      'Constant-time overhead in cryptographic verification layers.'
    ],
    correct: 1,
  }))
];

const TOTAL_SECONDS = 45 * 60;

/* ─────────────── Component ─────────────── */
export default function StudentExamPage() {
  const navigate = useNavigate();
  const { examId } = useParams();
  const videoRef = useRef(null);

  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [cameraActive, setCameraActive] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [visited, setVisited] = useState({ 0: true });
  const [submitted, setSubmitted] = useState(false);
  const [confidence, setConfidence] = useState(98);
  const [logs, setLogs] = useState([
    '> SYSTEM_INIT: ProctoShield v5.0',
    '> HANDSHAKE: 256-bit AES Verified',
    '> BIOMETRIC: Identity Confirmed',
  ]);

  /* Camera */
  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch { setCameraActive(false); }
    })();
  }, []);

  /* Timer */
  useEffect(() => {
    if (submitted) return;
    const id = setInterval(() => setSecondsLeft(s => (s <= 0 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [submitted]);

  /* AI Log Simulation */
  useEffect(() => {
    const entries = [
      '> GAZE: Fixated Center',
      '> AUDIO: Ambient 12 dB — Nominal',
      '> FRAME: Consistency Check OK',
      '> NEURAL: Match Score 99.7%',
      '> CRYPTO: Handshake Re-verified',
      '> DEPTH: Face Map Stable',
    ];
    const id = setInterval(() => {
      setLogs(prev => [...prev.slice(-7), entries[Math.floor(Math.random() * entries.length)]]);
      setConfidence(prev => Math.min(100, Math.max(93, prev + (Math.random() * 3 - 1.5))));
    }, 3500);
    return () => clearInterval(id);
  }, []);

  const fmt = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sc = (s % 60).toString().padStart(2, '0');
    return `${m}:${sc}`;
  };

  const navigateTo   = (i) => { setCurrentQ(i); setVisited(p => ({ ...p, [i]: true })); };
  const handleAnswer = (i) => { setAnswers(p => ({ ...p, [currentQ]: i })); };
  const toggleReview = ()  => { setMarkedForReview(p => ({ ...p, [currentQ]: !p[currentQ] })); };
  const handleSubmit = ()  => { setSubmitted(true); setTimeout(() => navigate('/student'), 3000); };

  const q = EXAM_QUESTIONS[currentQ];
  const isTimeCritical = secondsLeft < 300;
  const answered = Object.keys(answers).length;

  /* ── Submitted State ── */
  if (submitted) {
    return (
      <div className="h-screen bg-[#0F172A] flex items-center justify-center text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-8 shadow-[0_0_60px_rgba(16,185,129,0.25)]">
            <CheckCircle size={48} className="text-emerald-400" />
          </div>
          <h2 className="text-3xl font-bold mb-3 tracking-tight">Exam Submitted</h2>
          <p className="text-slate-500 text-sm">Your session has been securely closed and encrypted.</p>
        </div>
      </div>
    );
  }

  /* ── Main Cockpit ── */
  return (
    <div className="h-screen w-full bg-[#0F172A] flex flex-col overflow-hidden select-none text-slate-300" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Fonts + Utility CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');

        @keyframes pulseRing {
          0%   { transform: scale(1);   opacity: 0.6; }
          50%  { transform: scale(1.1); opacity: 0.2; }
          100% { transform: scale(1);   opacity: 0.6; }
        }
        @keyframes scanLine {
          from { top: 0%; }
          to   { top: 100%; }
        }
        .pulse-ring { animation: pulseRing 2s ease-in-out infinite; }
        .scroll-thin::-webkit-scrollbar { width: 3px; }
        .scroll-thin::-webkit-scrollbar-track { background: transparent; }
        .scroll-thin::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.15); border-radius: 10px; }
      `}</style>

      {/* ═══ HEADER ═══ */}
      <header className="h-14 shrink-0 border-b border-white/[0.06] flex items-center justify-between px-8 bg-[#0F172A] z-30">
        {/* Left: Branding */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Shield size={18} className="text-indigo-500" />
            <span className="text-xs font-bold tracking-widest uppercase text-white">
              Procto<span className="text-indigo-500">Shield</span>
            </span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase">Secure Assessment</span>
        </div>

        {/* Center: Timer */}
        <div className={`flex items-center gap-3 px-8 h-full border-x border-white/[0.06] transition-colors duration-500 ${isTimeCritical ? 'bg-red-500/10 text-red-400' : 'text-slate-300'}`}>
          <Clock size={15} className="opacity-50" />
          <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {fmt(secondsLeft)}
          </span>
        </div>

        {/* Right: Status */}
        <div className="flex items-center gap-2 text-[10px] font-semibold text-emerald-500 uppercase tracking-wider">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Secure Connection
        </div>
      </header>

      {/* ═══ 3-COLUMN BODY ═══ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ─── LEFT SIDEBAR: Question Navigator (20%) ─── */}
        <aside className="w-[20%] shrink-0 border-r border-white/[0.06] flex flex-col p-6 bg-white/[0.02] backdrop-blur-xl">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-6">Questions</h3>

          {/* 4×5 Grid */}
          <div className="grid grid-cols-4 gap-2.5">
            {EXAM_QUESTIONS.map((_, i) => {
              const isCurrent  = i === currentQ;
              const isAnswered = answers[i] !== undefined;
              const isMarked   = markedForReview[i];

              let style = 'bg-slate-800/60 text-slate-500 border-transparent hover:bg-slate-700/60';
              if (isCurrent)       style = 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.35)] scale-105 z-10';
              else if (isAnswered) style = 'bg-indigo-600/80 text-white border-indigo-500/50';

              return (
                <button
                  key={i}
                  onClick={() => navigateTo(i)}
                  className={`relative aspect-square rounded-lg flex items-center justify-center text-[11px] font-bold border transition-all duration-300 ${style}`}
                >
                  {i + 1}
                  {isMarked && !isCurrent && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-[#0F172A]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Progress */}
          <div className="mt-auto pt-6 border-t border-white/[0.06]">
            <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">
              <span>Progress</span>
              <span className="text-indigo-400">{answered}/20</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-700"
                style={{ width: `${(answered / 20) * 100}%` }}
              />
            </div>
          </div>
        </aside>

        {/* ─── CENTER PANEL: Question Arena (60%) ─── */}
        <main className="w-[60%] flex flex-col relative">
          {/* Scrollable Question Area */}
          <div className="flex-1 overflow-y-auto scroll-thin p-10 pb-36 flex justify-center">
            {/* Floating White Card */}
            <div className="w-full max-w-3xl bg-white rounded-[32px] p-12 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border border-white/10">

              {/* Question Header */}
              <div className="flex items-center justify-between mb-8">
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                  Question {q.id} of 20
                </span>
                {markedForReview[currentQ] && (
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Bookmark size={12} fill="currentColor" /> Flagged
                  </span>
                )}
              </div>

              {/* Question Text */}
              <h2 className="text-xl font-bold text-slate-900 leading-relaxed mb-10">
                {q.text}
              </h2>

              {/* Selection Tiles */}
              <div className="space-y-4">
                {q.options.map((opt, i) => {
                  const isSelected = answers[currentQ] === i;
                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      className={`group w-full flex items-center gap-5 p-5 rounded-2xl border-2 transition-all duration-300 text-left ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50 shadow-[inset_0_0_20px_rgba(99,102,241,0.08)]'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border-2 shrink-0 transition-all ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                          : 'bg-slate-100 border-slate-200 text-slate-400 group-hover:border-indigo-300 group-hover:text-indigo-500'
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <span className={`font-medium transition-colors ${isSelected ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-800'}`}>
                        {opt}
                      </span>
                      {isSelected && (
                        <CheckCircle size={18} className="ml-auto text-indigo-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ─── BOTTOM ACTION BAR ─── */}
          <div className="absolute bottom-0 left-0 right-0 z-20 p-5">
            <div className="flex items-center justify-between max-w-3xl mx-auto px-8 py-4 bg-[#0F172A]/80 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-xl">
              <button
                onClick={() => navigateTo(Math.max(0, currentQ - 1))}
                disabled={currentQ === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-semibold uppercase tracking-wider text-slate-500 hover:text-white hover:bg-white/5 transition-all disabled:opacity-0"
              >
                <ChevronLeft size={14} /> Prev
              </button>

              <div className="flex items-center gap-4">
                <button
                  onClick={toggleReview}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-semibold uppercase tracking-wider border transition-all ${
                    markedForReview[currentQ]
                      ? 'border-amber-400/50 text-amber-400 bg-amber-400/10'
                      : 'border-white/10 text-slate-500 hover:text-white hover:border-white/20'
                  }`}
                >
                  <Bookmark size={13} fill={markedForReview[currentQ] ? 'currentColor' : 'none'} />
                  Mark for Review
                </button>

                {currentQ < EXAM_QUESTIONS.length - 1 ? (
                  <button
                    onClick={() => navigateTo(currentQ + 1)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/25 transition-all active:scale-95"
                  >
                    Save & Next <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider shadow-lg shadow-emerald-600/25 transition-all active:scale-95"
                  >
                    Submit Exam <Send size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* ─── RIGHT SIDEBAR: Security Sentinel (20%) ─── */}
        <aside className="w-[20%] shrink-0 border-l border-white/[0.06] flex flex-col p-6 bg-white/[0.02]">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-6">Security Sentinel</h3>

          {/* Circular Webcam with Pulsing Ring */}
          <div className="relative w-40 h-40 mx-auto mb-8">
            {/* Pulsing outer ring */}
            <div className="absolute inset-0 rounded-full border-2 border-indigo-500/40 pulse-ring" />
            <div className="absolute inset-2 rounded-full border border-indigo-500/20" />
            {/* Video circle */}
            <div className="absolute inset-3 rounded-full bg-black overflow-hidden border-2 border-white/10 shadow-xl">
              {cameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <CameraOff size={32} className="text-slate-700" />
                </div>
              )}
            </div>
            {/* Live badge */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 bg-[#0F172A] border border-white/10 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[8px] font-bold text-white uppercase tracking-wider">Live</span>
            </div>
          </div>

          {/* Biometric Confidence Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Eye size={11} /> Biometric Confidence
              </span>
              <span className="text-[11px] font-bold text-indigo-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {Math.round(confidence)}%
              </span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>

          {/* System Status */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="bg-slate-800/50 rounded-xl p-3 border border-white/[0.04]">
              <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Camera</p>
              <p className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Active
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 border border-white/[0.04]">
              <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Audio</p>
              <p className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Active
              </p>
            </div>
          </div>

          {/* AI Vigilance Terminal */}
          <div className="flex-1 flex flex-col bg-black/50 rounded-2xl border border-white/[0.06] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
              <Terminal size={12} className="text-emerald-500" />
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-500/80">AI Vigilance</span>
              <span className="ml-auto text-[8px] text-slate-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>LIVE</span>
            </div>
            <div className="flex-1 p-4 overflow-y-auto scroll-thin space-y-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {logs.map((log, i) => (
                <p
                  key={i}
                  className={`text-[10px] leading-relaxed ${
                    i === logs.length - 1 ? 'text-emerald-400' : 'text-emerald-500/40'
                  }`}
                >
                  {log}
                </p>
              ))}
              <span className="inline-block w-1.5 h-3.5 bg-emerald-500 animate-pulse" />
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
