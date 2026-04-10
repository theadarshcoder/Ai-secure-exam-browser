import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import socketService from '../services/socket';
import api, { runCodingQuestion } from '../services/api';
import Editor from '@monaco-editor/react';
import {
  Camera, CameraOff, Clock, Shield, CheckCircle, CheckCircle2,
  ChevronRight, ChevronLeft, ChevronDown, Send, XCircle,
  Bookmark, Terminal, Eye, Fingerprint, AlertCircle, Power,
  Loader2, RotateCcw, Play, Monitor, ScanFace, ShieldAlert
} from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useTabVisibility, TabToast } from '../components/TabVisibility';
import * as faceapi from '@vladmandic/face-api';
import VisionLogo from '../components/VisionLogo';

/* ────────────────────────────────────────────── Config ────────────────────────────────────────────── */

const TOTAL_SECONDS = 45 * 60;

/* ────────────────────────────────────────── Sub-components ────────────────────────────────────────── */

const QuestionPalette = ({ questions, currentQ, answers, visited, markedForReview, navigateTo }) => {
  const answered = Object.keys(answers).length;
  const visitedCount = Object.keys(visited).length;
  const markedCount = Object.values(markedForReview).filter(Boolean).length;
  const notVisitedCount = questions.length - visitedCount;

  const sections = [];
  const hasMCQ    = questions.some(q => q.type === 'mcq');
  const hasShort  = questions.some(q => q.type === 'short');
  const hasCoding = questions.some(q => q.type === 'coding');

  if (hasMCQ)   sections.push({ id: 'a', label: 'Sec A', types: ['mcq'] });
  if (hasShort) sections.push({ id: 'b', label: 'Sec B', types: ['short'] });
  if (hasCoding) sections.push({ id: 'c', label: 'Sec C', types: ['coding'] });

  const [activeSection, setActiveSection] = React.useState(sections[0]?.id || 'a');

  React.useEffect(() => {
    const qType = questions[currentQ]?.type;
    const correctSec = sections.find(s => s.types.includes(qType));
    if (correctSec && correctSec.id !== activeSection) {
      setActiveSection(correctSec.id);
    }
  }, [currentQ, questions, activeSection]);

  const activeSec = sections.find(s => s.id === activeSection) || sections[0];
  const visibleIndices = questions
    .map((q, i) => ({ q, i }))
    .filter(({ q }) => activeSec?.types.includes(q.type))
    .map(({ i }) => i);

  const handleSectionClick = (sec) => {
    setActiveSection(sec.id);
    const firstIdx = questions.findIndex(q => sec.types.includes(q.type));
    if (firstIdx !== -1) navigateTo(firstIdx);
  };

  const stateStyles = {
    'current':  'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-200 ring-offset-2 scale-110 z-10 font-black',
    'answered': 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold',
    'marked':   'bg-amber-50 text-amber-700 border-amber-200 font-bold',
    'visited':  'bg-slate-50 text-slate-600 border-slate-200 font-bold',
    'unseen':   'bg-white text-slate-400 border-slate-100 hover:border-slate-300',
  };

  const getQState = (i) => {
    if (i === currentQ) return 'current';
    if (markedForReview[i]) return 'marked';
    if (answers[i] !== undefined) return 'answered';
    if (visited[i]) return 'visited';
    return 'unseen';
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Questions</span>
          </div>
          <span className="text-[10px] font-black text-slate-400 tabular-nums uppercase">{answered}/{questions.length} Solved</span>
        </div>
        <div className="p-1 bg-slate-100 rounded-xl flex items-center gap-1">
          {sections.map(sec => (
            <button key={sec.id} onClick={() => handleSectionClick(sec)} className={`flex-1 py-2 text-[10px] font-black rounded-lg uppercase tracking-wider transition-all ${activeSection === sec.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {sec.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-2 scroll-thin">
        <div className="grid grid-cols-4 gap-3">
          {visibleIndices.map(i => (
            <button key={i} onClick={() => navigateTo(i)} className={`relative group h-10 rounded-xl flex items-center justify-center text-[13px] border transition-all duration-200 ${stateStyles[getQState(i)]}`}>
              {i + 1}
              {markedForReview[i] && getQState(i) !== 'current' && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 border-2 border-white rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="p-5 border-t border-slate-100 bg-slate-50/50 mt-auto">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {[
            { dot: 'bg-indigo-600', label: 'Current' },
            { dot: 'bg-emerald-500', label: 'Solved' },
            { dot: 'bg-amber-500', label: 'Marked' },
            { dot: 'bg-slate-300', label: 'Unseen' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProctoringSidebar = ({ cameraActive, videoRef, faceActive, confidence }) => (
  <div className="flex flex-col w-full gap-5">
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 animate-pulse"></div>
      <div className="relative aspect-square w-full rounded-2xl bg-slate-900 border border-slate-200 overflow-hidden shadow-2xl">
        {cameraActive ? (
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-slate-50">
            <CameraOff size={24} className="text-slate-200" />
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Feed Disabled</span>
          </div>
        )}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[8px] font-black text-white uppercase tracking-widest border border-white/10 z-10">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          Live
        </div>
      </div>
    </div>
    <div className="grid grid-cols-1 gap-2.5">
      <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100"><Shield size={16} /></div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Integrity</p>
            <p className="text-[14px] font-black text-slate-900 tabular-nums">{confidence}%</p>
          </div>
        </div>
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      </div>
      <div className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Compliance</p>
        <div className="grid grid-cols-2 gap-2">
          {[{ label: 'Eye', status: faceActive }, { label: 'Device', status: true }, { label: 'Network', status: true }, { label: 'Env', status: true }].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-1 h-1 rounded-full ${item.status ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const SubmitModal = ({ isOpen, onClose, onConfirm, stats }) => (
  <AnimatePresence>
    {isOpen && (
      <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
        <Motion.div initial={{ scale: 0.95, y: 10, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/20">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 mb-6 flex items-center justify-center shadow-sm"><Send size={28} /></div>
          <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Hand In Assessment?</h2>
          <p className="text-[13px] font-medium text-slate-500 mb-8 leading-relaxed">You are about to submit your response. This action is final and your work will be graded as currently saved.</p>
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-8 grid grid-cols-2 gap-4 text-center">
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Answered</p><p className="text-2xl font-black text-slate-900 tabular-nums">{stats.answered}</p></div>
            <div className="border-l border-slate-200"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unsolved</p><p className="text-2xl font-black text-slate-900 tabular-nums">{stats.unanswered}</p></div>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all text-[12px] font-black uppercase tracking-widest">Wait, I'll Review</button>
            <button onClick={onConfirm} className="flex-1 py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all text-[12px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">Confirm & Submit</button>
          </div>
        </Motion.div>
      </Motion.div>
    )}
  </AnimatePresence>
);

const ExitModal = ({ isOpen, onClose, onExit, password, setPassword, error }) => (
  <AnimatePresence>
    {isOpen && (
      <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6">
        <Motion.div initial={{ scale: 0.95, y: 10, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} className="bg-white rounded-3xl p-8 max-sm-w-full shadow-2xl border border-white/20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 text-red-600 mb-6 mx-auto flex items-center justify-center shadow-sm"><ShieldAlert size={28} /></div>
          <h2 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Security Override</h2>
          <p className="text-[12px] font-medium text-zinc-500 mb-8 mx-auto max-w-[240px]">Enter supervisor credentials to force terminate this session.</p>
          <div className="relative mb-6">
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Supervisor Password" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-center text-slate-900 font-mono text-[14px] tracking-[0.4em] focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10 transition-all" />
            {error && <div className="absolute top-full left-0 right-0 mt-2"><span className="text-[10px] font-black text-red-600 uppercase tracking-widest">{error}</span></div>}
          </div>
          <div className="flex gap-3 mt-8">
            <button onClick={onClose} className="flex-1 py-3.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all text-[12px] font-black uppercase tracking-widest">Cancel</button>
            <button onClick={onExit} className="flex-1 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all text-[12px] font-black uppercase tracking-widest shadow-lg shadow-red-100">Terminate</button>
          </div>
        </Motion.div>
      </Motion.div>
    )}
  </AnimatePresence>
);

/* ────────────────────────────────────────── Main Component ────────────────────────────────────────── */

export default function ExamCockpit() {
  const navigate = useNavigate();
  const { examId } = useParams();
  const videoRef = useRef(null);
  const tabToast = useTabVisibility();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [cameraActive, setCameraActive] = useState(true);
  const [stream, setStream] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [visited, setVisited] = useState({ 0: true });
  const [submitted, setSubmitted] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceBoxes, setFaceBoxes] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const [exitPassword, setExitPassword] = useState('');
  const [exitError, setExitError] = useState('');
  const [terminated, setTerminated] = useState(null);
  const [terminateCountdown, setTerminateCountdown] = useState(8);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [confidence, setConfidence] = useState(98);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Test Cases');
  const [editorHeight, setEditorHeight] = useState(55);
  const isResizing = useRef(false);

  const isTimeCritical = secondsLeft < 300 && secondsLeft > 0;

  const logIncident = useCallback(async (type, severity, details) => {
    const studentId = sessionStorage.getItem('vision_email') || 'VSN-89241';
    const incident = {
      id: `INC-${Date.now()}`,
      examId,
      studentId,
      type,
      severity,
      details,
      timestamp: new Date().toISOString(),
    };
    try {
      await api.post('/api/exams/incident', incident);
      socketService.emitViolation(incident);
    } catch (err) { console.warn('Incident log failed'); }
  }, [examId]);

  // 1. Fullscreen Enforcement & Shortcut Blocking
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    const blockShortcuts = (e) => {
      if (e.ctrlKey || e.metaKey || ['F12', 'PrintScreen'].includes(e.key) || (e.altKey && e.key === 'Tab')) {
        e.preventDefault();
        logIncident('Shortcut Blocked', 'medium', `Attempted shortcut: ${e.key}`);
        return false;
      }
    };
    const blockContextMenu = (e) => { e.preventDefault(); logIncident('Right Click Blocked', 'low', 'Context menu attempt'); return false; };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', blockShortcuts);
    document.addEventListener('contextmenu', blockContextMenu);
    
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => console.warn('Fullscreen interaction required'));
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', blockShortcuts);
      document.removeEventListener('contextmenu', blockContextMenu);
    };
  }, [logIncident]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    const storedTheme = document.documentElement.getAttribute('data-theme');
    document.documentElement.removeAttribute('data-theme');
    return () => {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
      if (storedTheme) document.documentElement.setAttribute('data-theme', storedTheme);
    };
  }, []);

  useEffect(() => {
    if (submitted || terminated) return;
    const studentId = sessionStorage.getItem('vision_email') || 'VSN-89241';
    const poll = setInterval(async () => {
      try {
        const list = JSON.parse(localStorage.getItem('vision_terminated_sessions') || '[]');
        const hit = list.find(t => t.studentId === studentId || t.examId === examId);
        if (hit) setTerminated(hit);
      } catch (err) { console.warn('Termination poll failed'); }
    }, 3000);
    return () => clearInterval(poll);
  }, [submitted, terminated, examId]);

  useEffect(() => {
    if (!terminated) return;
    if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); }
    const tick = setInterval(() => {
      setTerminateCountdown(c => {
        if (c <= 1) { clearInterval(tick); navigate('/student'); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [terminated, navigate, stream]);

  useEffect(() => {
    if (submitted) return;
    const interval = setInterval(() => setSecondsLeft(s => (s <= 0 ? 0 : s - 1)), 1000);
    return () => clearInterval(interval);
  }, [submitted]);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await api.get(`/api/exams/${examId}`);
        setExam(res.data);
        setQuestions(res.data.questions || []);
        if (res.data.duration) setSecondsLeft(res.data.duration * 60);
      } catch (err) { console.warn('Exam fetch failed'); }
    };
    fetchExam();
  }, [examId]);

  useEffect(() => {
    let localStream = null;
    const init = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true });
        localStream = s;
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
      } catch (err) { console.warn('AI/Camera setup failed'); }
    };
    init();
    return () => { if (localStream) localStream.getTracks().forEach(t => t.stop()); };
  }, []);

  useEffect(() => {
    if (!modelsLoaded || !cameraActive || submitted) return;
    let timerId;
    const runDetection = async () => {
      if (videoRef.current?.readyState === 4) {
        const dets = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 160 }));
        setFaceBoxes(dets.map(d => d.box));
      }
      timerId = setTimeout(runDetection, 1000); // 1 FPS to save CPU
    };
    runDetection();
    return () => clearTimeout(timerId);
  }, [modelsLoaded, cameraActive, submitted]);

  useEffect(() => {
    const syncResizing = (e) => {
      if (!isResizing.current) return;
      const container = document.getElementById('coding-right-panel');
      if (container) {
        const rect = container.getBoundingClientRect();
        const pct = ((e.clientY - rect.top) / rect.height) * 100;
        setEditorHeight(Math.min(85, Math.max(15, pct)));
      }
    };
    const stopResizing = () => { isResizing.current = false; document.body.style.cursor = ''; };
    window.addEventListener('mousemove', syncResizing);
    window.addEventListener('mouseup', stopResizing);
    return () => { window.removeEventListener('mousemove', syncResizing); window.removeEventListener('mouseup', stopResizing); };
  }, []);

  // Auto-Save Pipeline
  const progressRef = useRef({ answers, currentQ, visited, secondsLeft });
  useEffect(() => { progressRef.current = { answers, currentQ, visited, secondsLeft }; }, [answers, currentQ, visited, secondsLeft]);
  useEffect(() => {
    if (submitted || terminated || !examId) return;
    const saveTimer = setInterval(async () => {
      try {
        await api.post('/api/exams/save-progress', {
          examId,
          answers: progressRef.current.answers,
          currentQuestionIndex: progressRef.current.currentQ,
          questionStates: progressRef.current.visited,
          remainingTimeSeconds: progressRef.current.secondsLeft
        });
      } catch (err) { console.warn('Auto-save failed'); }
    }, 30000);
    return () => clearInterval(saveTimer);
  }, [examId, submitted, terminated]);

  const handleRunCode = async () => {
    if (questions[currentQ]?.type !== 'coding') return;
    setIsExecuting(true); setExecutionResult(null); setActiveTab('Execution Details');
    try {
      const q = questions[currentQ];
      const answer = answers[currentQ];
      const sourceCode = typeof answer === 'object' ? (answer.code || "") : (answer || q.initialCode || "");
      const res = await runCodingQuestion(examId, q.id || q._id, sourceCode, selectedLanguage, false);
      setExecutionResult(res);
    } catch (err) { setExecutionResult({ error: 'Failed' }); }
    finally { setIsExecuting(false); }
  };

  const handleCheckTestCases = async () => {
    if (questions[currentQ]?.type !== 'coding') return;
    setIsExecuting(true); setExecutionResult(null); setActiveTab('Test Cases');
    try {
      const q = questions[currentQ];
      const answer = answers[currentQ];
      const sourceCode = typeof answer === 'object' ? (answer.code || "") : (answer || q.initialCode || "");
      const res = await runCodingQuestion(examId, q.id || q._id, sourceCode, selectedLanguage, true);
      setExecutionResult(res);
    } catch (err) { setExecutionResult({ error: 'Failed' }); }
    finally { setIsExecuting(false); }
  };

  const handleFinalSubmit = async () => {
    try {
      setSubmitted(true);
      await api.post('/api/exams/submit', { examId: examId || exam._id, answers });
      setTimeout(() => navigate('/student'), 2000);
    } catch (err) { setTimeout(() => navigate('/student'), 2000); }
  };

  const fmtTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const q = questions[currentQ];
  const answeredCount = Object.keys(answers).length;

  if (terminated) return (
    <div className="h-screen bg-[#08020a] flex items-center justify-center font-sans overflow-hidden">
      <div className="text-center relative z-10 max-w-lg mx-auto px-6">
        <XCircle size={48} className="text-red-500 mx-auto mb-8" />
        <h2 className="text-4xl font-black text-white mb-3 tracking-tight">Exam Terminated</h2>
        <p className="text-zinc-400 text-sm mb-8 leading-relaxed">{terminated.reason || 'Session terminated by supervisor.'}</p>
        <div className="flex items-center justify-center gap-3 text-sm text-red-400 font-bold border border-red-500/20 bg-red-500/5 px-6 py-3 rounded-2xl">
          <span className="w-10 h-10 rounded-full border-2 border-red-500/30 flex items-center justify-center tabular-nums">{terminateCountdown}</span>
          <p className="uppercase tracking-widest text-[10px]">Redirecting to Portal</p>
        </div>
      </div>
    </div>
  );

  if (submitted) return <div className="h-screen flex items-center justify-center bg-white font-sans"><div className="text-center"><CheckCircle size={60} className="text-emerald-500 mx-auto mb-6" /><h2 className="text-2xl font-black text-slate-900 tracking-tight">Submission Successful</h2><p className="text-slate-400 text-[12px] font-bold uppercase tracking-widest">Saving encrypted responses...</p></div></div>;

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col overflow-hidden select-none font-sans text-slate-900">
      <style>{`.scroll-thin::-webkit-scrollbar { width: 4px; } .scroll-thin::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }`}</style>
      
      <header className="shrink-0 bg-white border-b border-slate-200 shadow-sm px-5 h-[48px] flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100"><VisionLogo className="w-5 h-5 text-white" /></div>
          <span className="text-[13px] font-black tracking-widest">VISION</span>
          <div className="h-4 w-px bg-slate-200" />
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest max-w-[200px] truncate">{exam?.title || 'Exam'}</span>
        </div>
        <div className="flex items-center gap-6">
          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full ${isTimeCritical ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-700 border-slate-200'} border`}>
            <Clock size={14} className={isTimeCritical ? 'animate-pulse' : ''} />
            <span className="text-base font-bold tabular-nums">{fmtTime(secondsLeft)}</span>
          </div>
          <div className="flex items-center gap-3 pl-4 border-l border-slate-100 text-right">
            <div><p className="text-[11px] font-bold leading-none">Candidate AM</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">VSN-89241</p></div>
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 shadow-sm">AM</div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-50"><div className="h-full bg-indigo-600 transition-all duration-700" style={{ width: `${(answeredCount/questions.length)*100}%` }} /></div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[240px] shrink-0 bg-white border-r border-slate-200 flex flex-col shadow-sm">
          <QuestionPalette questions={questions} currentQ={currentQ} answers={answers} visited={visited} markedForReview={markedForReview} navigateTo={(i) => { setCurrentQ(i); setVisited(v => ({ ...v, [i]: true })); }} />
          <div className="mt-auto p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5"><div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" /> Encrypted Session</span>
            <button onClick={() => setShowExitPrompt(true)} className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors border border-red-100"><Power size={14} /></button>
          </div>
        </aside>

        <main className="flex-1 flex overflow-hidden bg-slate-50">
          <div className="flex-1 flex flex-col min-w-0">
            {q?.type === 'coding' ? (
              <div className="flex-1 flex min-h-0 overflow-hidden">
                <div className="w-[42%] shrink-0 flex flex-col min-h-0 bg-white border-r border-slate-200">
                  <div className="bg-slate-50 border-b border-slate-100 px-6 py-3.5 flex items-center justify-between shrink-0">
                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Objective</span>
                    {markedForReview[currentQ] && <div className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md border border-amber-100"><Bookmark size={10} className="fill-amber-600" /><span className="text-[9px] font-black uppercase tracking-wider">Flagged</span></div>}
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 scroll-thin font-medium">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">Sec C ΓÇó Q{currentQ + 1}</div>
                      <div className="px-2.5 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest">{q?.marks || 10} Marks</div>
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 mb-6 leading-tight tracking-tight">{q?.questionText}</h1>
                    <div className="prose prose-slate prose-sm max-w-none text-slate-600 leading-relaxed space-y-4">
                        <p>Implement the solution according to the problem constraints. Ensure your code is optimized and handles edge cases.</p>
                        <ul className="list-disc pl-5 mt-4 space-y-2 text-[13px] font-semibold text-slate-500">
                            <li>All test cases must pass for full marks.</li>
                            <li>Standard input/output is supported.</li>
                            <li>Time and memory limits apply.</li>
                        </ul>
                    </div>
                  </div>
                </div>
                <div id="coding-right-panel" className="flex-1 flex flex-col min-h-0 relative bg-slate-50">
                  <div className="absolute inset-0 flex flex-col">
                    <div style={{ height: `${editorHeight}%` }} className="flex flex-col shrink-0 min-h-0 bg-white">
                      <div className="flex items-center justify-between px-4 h-10 bg-slate-50 border-b border-slate-200 shrink-0">
                        <div className="flex items-center gap-2 text-slate-400"><Terminal size={14} /><span className="text-[11px] font-black uppercase tracking-widest">Environment</span></div>
                        <div className="relative">
                          <button onClick={() => setIsLangDropdownOpen(p => !p)} className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2.5 h-[26px] hover:bg-slate-50 transition-all text-[11px] font-black uppercase tracking-widest text-slate-600 shadow-sm">{selectedLanguage}<ChevronDown size={12} /></button>
                          {isLangDropdownOpen && (
                            <div className="absolute top-full right-0 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 overflow-hidden border-t-0 ring-1 ring-slate-200 ring-offset-0">
                              {['javascript', 'python', 'cpp', 'java'].map(l => (
                                <button key={l} onClick={() => { setSelectedLanguage(l); setIsLangDropdownOpen(false); }} className={`w-full text-left px-3 py-1.5 text-[11px] font-black uppercase tracking-wider transition-colors ${selectedLanguage === l ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}>{l}</button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 shadow-inner"><Editor height="100%" language={selectedLanguage === 'cpp' ? 'cpp' : selectedLanguage} theme="light" value={typeof answers[currentQ] === 'object' ? answers[currentQ].code : (answers[currentQ] ?? q.initialCode)} onChange={v => setAnswers(p => ({ ...p, [currentQ]: { code: v, language: selectedLanguage } }))} options={{ fontSize: 13, minimap: { enabled: false }, automaticLayout: true, padding: { top: 16 } }} /></div>
                    </div>
                    <div className="h-1 bg-slate-200 hover:bg-indigo-300 cursor-row-resize z-10 transition-all flex items-center justify-center group" onMouseDown={() => { isResizing.current = true; document.body.style.cursor = 'row-resize'; }}><div className="w-12 h-1 bg-slate-300 group-hover:bg-indigo-500 rounded-full transition-colors" /></div>
                    <div className="flex-1 flex flex-col min-h-0 bg-white">
                      <div className="flex items-center px-4 border-b border-slate-200 shrink-0 h-10 bg-white z-10">
                        <button onClick={() => setActiveTab('Test Cases')} className={`h-full px-4 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'Test Cases' ? 'text-indigo-600 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>Test Cases</button>
                        <button onClick={() => setActiveTab('Execution Details')} className={`h-full px-4 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'Execution Details' ? 'text-indigo-600 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>Output Log</button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-6 scroll-thin bg-slate-50/40">
                        {isExecuting ? <div className="h-full flex flex-col items-center justify-center gap-3 text-indigo-500"><RotateCcw size={24} className="animate-spin" /><span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Processing Execution...</span></div> : executionResult ? (
                          <div className="space-y-4 animate-in fade-in duration-500">
                            {activeTab === 'Test Cases' ? (
                                <div className="grid grid-cols-1 gap-4">
                                    {executionResult.results ? executionResult.results.map((res, i) => (
                                        <div key={i} className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all border-slate-200`}>
                                            <div className={`px-4 py-2.5 border-b flex items-center justify-between ${res.passed ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${res.passed ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Case {res.testCaseId || i + 1}</span>
                                                </div>
                                                <span className="text-[9px] font-black uppercase tracking-tighter">{res.passed ? 'Passed ✅' : 'Failed ❌'}</span>
                                            </div>
                                            <div className="p-5 grid grid-cols-3 gap-8">
                                                <div><p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">Input</p><pre className="text-[11px] font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-600 overflow-x-auto">{res.input || 'N/A'}</pre></div>
                                                <div><p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">Expected</p><pre className="text-[11px] font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-600 overflow-x-auto">{res.expectedOutput || 'Success'}</pre></div>
                                                <div className="relative group">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">Actual</p>
                                                    <pre className={`text-[11px] font-mono p-2.5 rounded-lg border transition-all ${res.passed ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100 shadow-sm'} overflow-x-auto`}>{res.actualOutput || res.error || 'N/A'}</pre>
                                                </div>
                                            </div>
                                        </div>
                                    )) : <div className="text-center py-8"><pre className="text-red-500 font-mono text-sm">{executionResult.error}: {executionResult.details}</pre></div>}
                                </div>
                            ) : (
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative group">
                                    <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-800/50">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="font-mono text-[10px] font-black text-slate-400 uppercase">Process Log</span>
                                    </div>
                                    <pre className="text-[13px] font-mono whitespace-pre-wrap leading-relaxed transition-all text-emerald-400/90">{executionResult.stdout || executionResult.details || 'Execution finished with no output.'}</pre>
                                    {executionResult.stderr && <div className="mt-4 pt-4 border-t border-slate-800"><pre className="text-red-400 font-mono text-[12px]">{executionResult.stderr}</pre></div>}
                                </div>
                            )}
                          </div>
                        ) : <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4"><div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center border border-slate-200"><Play size={32} className="text-slate-300 ml-1" /></div><span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Ready for Compile & Execution</span></div>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-y-auto scroll-thin px-8 py-10 bg-slate-50/50">
                <div className="max-w-3xl mx-auto w-full bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden mb-12">
                  <div className="p-8 border-b border-slate-100 bg-white">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[11px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm">Sec A ΓÇó Q{currentQ + 1}</div>
                      <div className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[11px] font-bold uppercase tracking-widest border border-slate-200">{q?.type === 'mcq' ? 'Choice Selection' : 'Written Response'}</div>
                      <div className="ml-auto text-[11px] font-black text-slate-400 uppercase tracking-widest tabular-nums">{q?.marks || 4} Weightage</div>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 leading-snug tracking-tight">{q?.questionText}</h2>
                  </div>
                  <div className="p-8 pb-10">
                    {q?.type === 'mcq' ? (
                      <div className="space-y-4">
                        {q?.options?.map((opt, idx) => {
                          const isS = answers[currentQ] === idx;
                          return (
                            <button key={idx} onClick={() => setAnswers(p => ({ ...p, [currentQ]: idx }))} className={`w-full flex items-start gap-5 p-6 rounded-2xl border-2 transition-all duration-300 text-left relative group ${isS ? 'bg-indigo-50/50 border-indigo-600 shadow-md shadow-indigo-100/50 ring-4 ring-indigo-500/5' : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-lg hover:bg-slate-50/50'}`}>
                              <div className={`mt-0.5 w-7 h-7 rounded-xl flex items-center justify-center text-[12px] font-black transition-all ${isS ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-400'}`}>{String.fromCharCode(65 + idx)}</div>
                              <span className={`text-[16px] leading-relaxed flex-1 pt-0.5 ${isS ? 'font-bold text-indigo-900' : 'font-medium text-slate-600 group-hover:text-slate-900'}`}>{opt}</span>
                              {isS && <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white scale-110 shadow-lg animate-in zoom-in duration-300"><CheckCircle2 size={14} strokeWidth={3} /></div>}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="relative group">
                          <textarea value={answers[currentQ] || ''} onChange={e => setAnswers(p => ({ ...p, [currentQ]: e.target.value }))} placeholder="Type your structured response here..." className="w-full h-96 bg-slate-50/50 border-2 border-slate-100 rounded-3xl p-10 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none resize-none shadow-inner font-medium text-slate-700 leading-relaxed text-[15px]" />
                          <div className="absolute top-4 right-4"><div className="w-1.5 h-1.5 rounded-full bg-indigo-200 group-focus-within:bg-indigo-500 animate-pulse" /></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white border-t border-slate-200 px-8 py-3.5 flex items-center justify-between shrink-0 shadow-[0_-8px_20px_-8px_rgba(0,0,0,0.08)] z-20">
              <div className="flex items-center gap-3">
                <button onClick={() => setCurrentQ(p => Math.max(0, p - 1))} disabled={currentQ === 0} className={`px-5 py-2.5 flex items-center gap-2.5 rounded-xl text-[12px] font-bold border transition-all ${currentQ === 0 ? 'text-slate-300 border-slate-100 cursor-not-allowed' : 'text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-95 shadow-sm'}`}><ChevronLeft size={18} /> Previous</button>
                <button onClick={() => setCurrentQ(p => Math.min(questions.length-1, p + 1))} disabled={currentQ === questions.length-1} className={`px-5 py-2.5 flex items-center gap-2.5 rounded-xl text-[12px] font-bold border transition-all ${currentQ === questions.length-1 ? 'text-slate-300 border-slate-100 cursor-not-allowed' : 'text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-95 shadow-sm'}`}>Next <ChevronRight size={18} /></button>
              </div>
              <div className="flex items-center gap-4">
                {q?.type === 'coding' && (
                  <>
                    <button onClick={handleRunCode} disabled={isExecuting} className="px-5 py-2.5 flex items-center gap-2.5 rounded-xl text-[12px] font-black uppercase tracking-wider border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:shadow-sm disabled:opacity-50 transition-all active:scale-95"><Play size={16} fill="currentColor" /> Run</button>
                    <button onClick={handleCheckTestCases} disabled={isExecuting} className="px-8 py-2.5 flex items-center gap-2.5 rounded-xl text-[12px] font-black uppercase tracking-wider bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 disabled:opacity-50 transition-all active:scale-95 transform"><Send size={16} /> Submit Code</button>
                  </>
                )}
                <div className="h-8 w-px bg-slate-100 mx-2" />
                <button onClick={() => setShowConfirm(true)} className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all border ${answeredCount === questions.length ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-100' : 'text-slate-400 border-slate-100 hover:text-slate-600 hover:border-slate-200 bg-slate-50/50'}`}>{answeredCount === questions.length ? 'Final Review' : 'Incomplete'}</button>
              </div>
            </div>
          </div>
          
          <aside className="w-[240px] shrink-0 bg-white border-l border-slate-200 flex flex-col items-center pt-8 px-5 gap-7 overflow-y-auto scroll-thin shadow-[inset_1px_0_0_0_rgba(0,0,0,0.02)]">
            <ProctoringSidebar cameraActive={cameraActive} videoRef={videoRef} faceActive={faceBoxes.length > 0} confidence={confidence} />
            <div className="w-full space-y-3 mt-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Candidate Health</p>
                <div className="w-full bg-slate-50 rounded-2xl border border-slate-100 p-5 shadow-inner">
                    <div className="flex items-center gap-2.5 mb-5"><Monitor size={14} className="text-slate-400" /><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Network Telemetry</span></div>
                    <div className="space-y-3.5 text-[9px] font-bold text-slate-500">
                        <div className="flex items-center justify-between"><span>Session Uptime</span><span className="text-slate-800 font-bold tabular-nums">00:44:12</span></div>
                        <div className="flex items-center justify-between"><span>Latencies</span><span className="text-emerald-500 font-bold tabular-nums">12ms</span></div>
                        <div className="flex items-center justify-between"><span>Proctor Warnings</span><span className="text-red-500 font-bold tabular-nums">0</span></div>
                    </div>
                </div>
            </div>
            <div className="mt-auto pb-6 w-full opacity-60">
                <VisionLogo className="w-6 h-6 text-slate-200 mx-auto grayscale" />
            </div>
          </aside>
        </main>
      </div>

      <SubmitModal isOpen={showConfirm} onClose={() => setShowConfirm(false)} stats={{ answered: answeredCount, unanswered: questions.length - answeredCount }} onConfirm={handleFinalSubmit} />
      <ExitModal isOpen={showExitPrompt} onClose={() => { setShowExitPrompt(false); setExitError(''); setExitPassword(''); }} password={exitPassword} setPassword={setExitPassword} error={exitError} onExit={() => { if (exitPassword === '12345') navigate('/student'); else { setExitError('Incorrect Override Path'); setExitPassword(''); } }} />
      <TabToast toast={tabToast} />

      {!isFullscreen && !submitted && !terminated && (
        <div className="fixed inset-0 z-[200] bg-slate-900/98 backdrop-blur-2xl flex items-center justify-center p-8 text-center animate-in fade-in duration-700">
          <div className="max-w-md w-full bg-slate-900 border border-red-500/20 p-10 rounded-[32px] shadow-2xl ring-1 ring-white/5">
            <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner ring-1 ring-red-500/20"><ShieldAlert size={40} className="text-red-500" /></div>
            <h2 className="text-3xl font-black text-white mb-3 uppercase tracking-tight">Security Violation</h2>
            <p className="text-slate-400 text-sm mb-10 leading-relaxed font-medium">Exam integrity check failed. Fullscreen mode is mandatory. Your departure has been recorded and encrypted locally for post-exam evaluation.</p>
            <button onClick={() => document.documentElement.requestFullscreen()} className="w-full py-5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase tracking-[0.1em] text-[12px] transition-all shadow-xl shadow-red-900/40 transform active:scale-95">Restore Secure View</button>
          </div>
        </div>
      )}
    </div>
  );
}
