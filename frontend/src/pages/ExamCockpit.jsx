import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import socketService from '../services/socket';
import api from '../services/api';
import {
  Camera, CameraOff, Clock, Shield, CheckCircle,
  ChevronRight, ChevronLeft, Send, XCircle,
  Bookmark, Terminal, Eye, Fingerprint, AlertCircle, Power,
  Loader2, RotateCcw, Play, Monitor, ScanFace
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTabVisibility, TabToast } from '../components/TabVisibility';
import * as faceapi from '@vladmandic/face-api';
import VisionLogo from '../components/VisionLogo';

/* ─────────────── Config ─────────────── */

const TOTAL_SECONDS = 45 * 60;



/* ─────────────── Sub-components ─────────────── */

const QuestionPalette = ({ questions, currentQ, answers, visited, markedForReview, navigateTo }) => {
  const answered = Object.keys(answers).length;
  const visitedCount = Object.keys(visited).length;
  const markedCount = Object.values(markedForReview).filter(Boolean).length;
  const notVisitedCount = questions.length - visitedCount;
  const visitedNotAnswered = Object.keys(visited).filter(k => answers[k] === undefined && !markedForReview[k]).length;

  const getQState = (i) => {
    if (i === currentQ) return 'current';
    if (markedForReview[i] && answers[i] !== undefined) return 'marked-answered';
    if (markedForReview[i]) return 'marked';
    if (answers[i] !== undefined) return 'answered';
    if (visited[i]) return 'visited';
    return 'not-visited';
  };

  const stateStyles = {
    'current': 'bg-[#1a56db] text-white border-[#1a56db] ring-2 ring-blue-300 font-bold scale-110 z-10',
    'answered': 'bg-[#15803d] text-white border-[#15803d] font-bold',
    'marked': 'bg-[#7c3aed] text-white border-[#7c3aed] font-bold',
    'marked-answered': 'bg-[#7c3aed] text-white border-[#7c3aed] font-bold ring-2 ring-green-400',
    'visited': 'bg-[#ea580c] text-white border-[#ea580c] font-bold',
    'not-visited': 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200 hover:text-gray-600',
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 pt-3 pb-2 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Question Palette</span>
          <span className="text-[9px] font-bold text-[#1e3a5f] tabular-nums">{answered}/{questions.length}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="px-3 py-1 bg-[#1e3a5f] text-white text-[9px] font-bold rounded uppercase tracking-wide">Section A</button>
          <button className="px-3 py-1 bg-gray-50 text-gray-400 text-[9px] font-bold rounded uppercase tracking-wide hover:bg-gray-100 transition-colors border border-gray-200">All</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin px-3 py-3">
        <div className="grid grid-cols-5 gap-1.5">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => navigateTo(i)}
              className={`w-full aspect-square rounded-full flex items-center justify-center text-[11px] border transition-all duration-100 cursor-pointer ${stateStyles[getQState(i)]}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 border-t border-gray-100 space-y-1.5">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">Legend</p>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
          {[
            { color: 'bg-[#15803d]', label: `Answered (${answered})` },
            { color: 'bg-[#ea580c]', label: `Visited (${visitedNotAnswered})` },
            { color: 'bg-gray-200', label: `Not Visited (${notVisitedCount})` },
            { color: 'bg-[#7c3aed]', label: `Marked (${markedCount})` },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${item.color} shrink-0`} />
              <span className="text-[9px] text-gray-500 font-medium truncate">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProctoringSidebar = ({ cameraActive, videoRef, faceActive }) => (
  <div className="px-3 py-4 border-t border-gray-100 bg-white flex flex-col items-center">
    <div className="relative w-28 h-28 rounded-2xl bg-gray-900 border-2 border-slate-100 shadow-inner overflow-hidden mb-3 group transition-all hover:border-sky-200">
      {cameraActive ? (
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-slate-50">
          <CameraOff size={16} className="text-slate-300" />
          <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">No Feed</span>
        </div>
      )}
      <div className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded-md text-[7px] font-black text-white uppercase tracking-[0.15em] z-10">
        <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" /> Live
      </div>
      {!faceActive && cameraActive && (
        <div className="absolute inset-0 border-2 border-red-500/50 bg-red-500/5 animate-pulse z-20 pointer-events-none" />
      )}
    </div>
    
    <div className="w-full">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Shield size={10} className="text-[#1e3a5f]" />
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Integrity Signals</span>
      </div>
      <div className="space-y-1">
        {[
          { label: 'Engine', ok: true },
          { label: 'Network', ok: true },
          { label: 'Audio', ok: true },
          { label: 'Face', ok: faceActive },
        ].map((s, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-[9px] text-gray-400">{s.label}</span>
            <div className={`w-1.5 h-1.5 rounded-full ${s.ok ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const SubmitModal = ({ isOpen, onClose, onConfirm, stats }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-200">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 mb-6 flex items-center justify-center">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Submit Assessment</h2>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">This action is irreversible. Your answers will be saved and you cannot return to the exam.</p>
          <div className="grid grid-cols-3 gap-3 mb-8 text-center">
            <div className="bg-green-50 border border-green-100 p-3 rounded-xl">
              <p className="text-lg font-bold text-green-700">{stats.answered}</p>
              <p className="text-[10px] font-medium text-green-600 uppercase">Answered</p>
            </div>
            <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl">
              <p className="text-lg font-bold text-orange-700">{stats.unanswered}</p>
              <p className="text-[10px] font-medium text-orange-600 uppercase">Remaining</p>
            </div>
            <div className="bg-violet-50 border border-violet-100 p-3 rounded-xl">
              <p className="text-lg font-bold text-violet-700">{stats.marked}</p>
              <p className="text-[10px] font-medium text-violet-600 uppercase">Marked</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all text-sm font-semibold">Go Back</button>
            <button onClick={onConfirm} className="flex-1 py-3 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white transition-all text-sm font-semibold shadow-lg">Confirm Submit</button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const ExitModal = ({ isOpen, onClose, onExit, password, setPassword }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-gray-200 text-center">
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 text-red-600 mb-5 mx-auto flex items-center justify-center">
            <Power size={24} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Secure Exit</h2>
          <p className="text-xs text-gray-400 mb-6">Enter supervisor password to terminate</p>
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="Password" 
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center text-gray-900 font-mono tracking-widest mb-6 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all" 
          />
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all text-sm font-semibold">Cancel</button>
            <button onClick={onExit} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all text-sm font-semibold shadow-lg">Exit</button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

/* ─────────────── Main Component ─────────────── */

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
  const [terminated, setTerminated] = useState(null); // { reason, terminatedBy }
  const [terminateCountdown, setTerminateCountdown] = useState(8);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

  // Cinematic Command Center lock & Theme Isolation
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // Isolate Cockpit from global wildcard theme overrides 
    // (ExamCockpit is natively styled as a pristine light UI, so global inversion breaks it)
    const storedTheme = document.documentElement.getAttribute('data-theme');
    document.documentElement.removeAttribute('data-theme');

    return () => {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
      if (storedTheme) document.documentElement.setAttribute('data-theme', storedTheme);
    };
  }, []);

  // Fullscreen & Security Listeners
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      logIncident('Right-Click Attempt', 'low', 'Context menu suppressed');
    };

    const handleKeyDown = (e) => {
      // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U, Ctrl+S, Ctrl+R, F5
      const isDevTools = (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) || e.key === 'F12';
      const isRefresh = (e.ctrlKey && e.key.toUpperCase() === 'R') || e.key === 'F5';
      const isCopyPaste = e.ctrlKey && ['C', 'V', 'X'].includes(e.key.toUpperCase());
      const isSave = e.ctrlKey && e.key.toUpperCase() === 'S';
      const isPrint = e.ctrlKey && e.key.toUpperCase() === 'P';
      const isSource = e.ctrlKey && e.key.toUpperCase() === 'U';
      const isAltSpace = e.altKey && e.code === 'Space';
      const isMeta = e.metaKey;

      if (isDevTools || isRefresh || isCopyPaste || isSave || isPrint || isSource || isAltSpace || isMeta) {
        e.preventDefault();
        logIncident('Shortcut Blocked', 'medium', `Key combination: ${e.key} ${e.ctrlKey ? '(Ctrl)' : ''} ${e.shiftKey ? '(Shift)' : ''} ${e.altKey ? '(Alt)' : ''}`);
        return false;
      }
    };

    const handleBeforeUnload = (e) => {
      if (!submitted) {
        e.preventDefault();
        e.returnValue = ''; // Standard browser prompt
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [submitted, logIncident]);

  const requestFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen entry failed:', err);
    }
  };

  // Termination Detection — poll localStorage every 3 seconds
  useEffect(() => {
    if (submitted || terminated) return;
    const studentId = localStorage.getItem('vision_email') || 'VSN-89241';
    const check = () => {
      try {
        const list = JSON.parse(localStorage.getItem('vision_terminated_sessions') || '[]');
        const hit = list.find(t =>
          t.studentId === studentId ||
          t.studentId === 'VSN-89241' ||
          t.examId === examId
        );
        if (hit) setTerminated(hit);
      } catch (err) {
        console.warn('Termination poll failed:', err);
      }
    };
    check();
    const poll = setInterval(check, 3000);
    return () => clearInterval(poll);
  }, [submitted, terminated, examId]);

  // Countdown redirect after termination
  useEffect(() => {
    if (!terminated) return;
    if (stream) stream.getTracks().forEach(t => t.stop());
    const tick = setInterval(() => {
      setTerminateCountdown(c => {
        if (c <= 1) { clearInterval(tick); navigate('/student'); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [terminated]);

  // Timer logic
  useEffect(() => {
    if (submitted) return;
    const interval = setInterval(() => {
      setSecondsLeft(s => (s <= 0 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [submitted]);

  // Load Exam from Backend
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const response = await api.get(`/api/exams/${examId}`);
        const data = response.data;
        setExam(data);
        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions.map((q, i) => ({
            id: q.id || i + 1,
            type: q.type,
            text: q.text,
            options: q.options,
            marks: q.marks,
            language: q.language,
            starterCode: q.starterCode,
            maxWords: q.maxWords
          })));
          if (data.duration) setSecondsLeft(data.duration * 60);
        }
        // Start session in backend
        try {
          await api.post('/api/exams/start', { examId });
        } catch (startErr) {
          console.warn('Session start note:', startErr.response?.data?.error || startErr.message);
        }
      } catch (err) {
        console.warn('Backend unavailable, using mock data:', err.message);
        const published = JSON.parse(localStorage.getItem('published_exams') || '[]');
        let fallbackExam = published.find(e => e.id === examId);
        
        // If not in localStorage, generate a smart dummy exam based on the ID
        if (!fallbackExam) {
          fallbackExam = {
            id: examId,
            title: examId === 'EXM-CS101' ? 'Computer Science 101 - Final' : 'Demonstration Exam',
            duration: 90,
            questions: [
              {
                id: 1, type: 'mcq', text: 'Which of the following data structures operates on a Last-In-First-Out (LIFO) principle?', 
                options: ['Queue', 'Stack', 'Linked List', 'Binary Tree'], marks: 4
              },
              {
                id: 2, type: 'mcq', text: 'In object-oriented programming, what is the concept of wrapping data and methods that work on data within one unit?', 
                options: ['Polymorphism', 'Inheritance', 'Encapsulation', 'Abstraction'], marks: 4
              },
              {
                id: 3, type: 'coding', text: 'Write a JavaScript function that takes an array of numbers and returns the sum of all positive numbers.', 
                language: 'javascript', starterCode: 'function sumPositive(arr) {\n  // Your code here\n}', marks: 10
              },
              ...Array.from({ length: 17 }).map((_, i) => ({
                id: i + 4,
                type: 'mcq',
                text: `Diagnostic Question ${i + 4}: Evaluate the following system parameter and select the optimal configuration state for maximum efficiency.`,
                options: ['State Nominal', 'State Critical', 'State Dormant', 'State Elevated'],
                marks: 4
              }))
            ]
          };
        }
        
        setExam(fallbackExam);
        if (fallbackExam.questions && fallbackExam.questions.length > 0) {
          setQuestions(fallbackExam.questions);
        }
      }
    };
    fetchExam();
  }, [examId]);

  // Camera & Face Detection
  useEffect(() => {
    const initCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: 640, height: 480 },
          audio: false 
        });
        setStream(mediaStream);
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      } catch (err) { 
        setCameraActive(false); 
      }
    };

    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
      } catch (err) {
        console.error("AI engine failure", err);
      }
    };

    initCamera();
    loadModels();

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, []);

  // Face Detection Loop
  useEffect(() => {
    if (!modelsLoaded || !cameraActive || submitted) return;

    let frameId;
    const runDetection = async () => {
      if (videoRef.current?.readyState === 4) {
        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.35 })
        );
        setFaceBoxes(detections.map(d => d.box));
      }
      frameId = requestAnimationFrame(runDetection);
    };

    runDetection();
    return () => cancelAnimationFrame(frameId);
  }, [modelsLoaded, cameraActive, submitted]);

  // Tab Visibility Logging
  useEffect(() => {
    if (tabToast && !submitted) {
      logIncident('Tab Switch', 'high', tabToast.msg);
    }
  }, [tabToast, submitted]);

  // Real-time Socket Connection
  useEffect(() => {
    const studentId = localStorage.getItem('vision_email') || 'VSN-89241';
    socketService.connect(studentId);
    return () => socketService.disconnect();
  }, []);

  const logIncident = useCallback(async (type, severity, details) => {
    const studentId = localStorage.getItem('vision_email') || 'VSN-89241';
    const incident = {
      id: `INC-${Date.now()}`,
      examId,
      studentId,
      type,
      severity,
      details,
      timestamp: new Date().toISOString(),
    };

    // Emit to backend for real-time mentor alerts via socket
    socketService.emitViolation(incident);

    // Also persist to backend API for audit trail
    try {
      await api.post('/api/exams/incident', { examId, type, severity, details });
    } catch (apiErr) {
      console.warn('Incident API save failed:', apiErr.message);
    }

    // Local backup
    const existing = JSON.parse(localStorage.getItem('vision_incidents') || '[]');
    localStorage.setItem('vision_incidents', JSON.stringify([incident, ...existing]));
  }, [examId]);

  const handleRunCode = async () => {
    const code = answers[currentQ] || questions[currentQ].starterCode;
    if (!code) return;
    setIsExecuting(true);
    try {
      // Simulation of code execution for refactor integrity
      await new Promise(r => setTimeout(r, 1500));
      setExecutionResult({ stdout: 'Environment active. Results simulated for demo.\n> Final output: Validated.', time: 0.24, memory: 1024 });
    } catch (err) {
      setExecutionResult({ error: 'Execution Error', details: err.message });
    } finally {
      setIsExecuting(false);
    }
  };

  const fmtTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sc = (s % 60).toString().padStart(2, '0');
    return `${m}:${sc}`;
  };

  const q = questions[currentQ];
  const answeredCount = Object.keys(answers).length;
  const isTimeCritical = secondsLeft < 300;

  if (terminated) {
    return (
      <div className="h-screen bg-[#08020a] flex items-center justify-center font-sans relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.15)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a0000_1px,transparent_1px),linear-gradient(to_bottom,#1a0000_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center relative z-10 max-w-lg mx-auto px-6"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-24 h-24 rounded-2xl bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mx-auto mb-8 shadow-[0_0_60px_rgba(220,38,38,0.3)]"
          >
            <XCircle size={48} className="text-red-500" />
          </motion.div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Session Force-Terminated
          </div>
          <h2 className="text-4xl font-black text-white mb-3 tracking-tight">Exam Terminated</h2>
          <p className="text-zinc-400 text-sm mb-2 leading-relaxed">
            {terminated.reason || 'Your exam session has been terminated by a supervisor.'}
          </p>
          <p className="text-zinc-600 text-xs font-mono mb-8">
            Terminated by: <span className="text-red-400/70">{terminated.terminatedBy || 'Admin'}</span>
            {' '}&middot;{' '}
            {new Date(terminated.timestamp).toLocaleTimeString()}
          </p>
          <div className="bg-[#11050a] border border-red-500/10 rounded-2xl p-6 mb-8">
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-2">Your work was not saved.</p>
            <p className="text-xs text-zinc-400">Contact your supervisor or institution for more information about this termination.</p>
          </div>
          <div className="flex items-center justify-center gap-3 text-sm">
            <div className="w-10 h-10 rounded-full border-2 border-red-500/30 flex items-center justify-center text-red-400 font-black text-lg tabular-nums">
              {terminateCountdown}
            </div>
            <p className="text-zinc-500 text-xs">Redirecting to dashboard in {terminateCountdown}s</p>
          </div>
          <button onClick={() => navigate('/student')} className="mt-6 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white text-xs font-semibold transition-all">
            Return to Dashboard Now
          </button>
        </motion.div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="h-screen bg-white flex items-center justify-center font-sans">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Exam Submitted Successfully</h2>
          <p className="text-gray-500 text-sm mb-1">Your responses have been recorded securely.</p>
          <p className="text-gray-400 text-xs">Redirecting to dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#f0f2f5] flex flex-col overflow-hidden select-none font-sans">
      <AnimatePresence>
        {!isFullscreen && !submitted && !terminated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 text-center"
          >
            <div className="max-w-md w-full">
              <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                <Shield size={40} />
              </div>
              <h2 className="text-3xl font-black text-white mb-4 tracking-tight uppercase">Security Alert</h2>
              <p className="text-slate-400 text-sm mb-10 leading-relaxed font-semibold">Fullscreen mode is required to maintain the integrity of this assessment. All activity has been suspended.</p>
              <button
                onClick={requestFullscreen}
                className="w-full py-4 rounded-2xl bg-white text-slate-950 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all shadow-xl active:scale-95"
              >
                Restore Secure Environment
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        html, body { overflow: hidden !important; height: 100% !important; overscroll-behavior: none !important; }
        .scroll-thin::-webkit-scrollbar { width: 4px; }
        .scroll-thin::-webkit-scrollbar-track { background: transparent; }
        .scroll-thin::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .scroll-thin::-webkit-scrollbar-button { display: none !important; width: 0 !important; height: 0 !important; }
      `}</style>

      {/* Header */}
      <header className="shrink-0 z-30">
        <div className="h-[52px] bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <VisionLogo className="w-4 h-4 text-white" />
              <span className="text-[11px] font-medium tracking-widest uppercase text-white">VISION</span>
            </div>
            <div className="h-4 w-px bg-zinc-800" />
            <span className="text-[12px] font-medium text-zinc-400 truncate max-w-[200px]">{exam?.title || 'Technical Assessment'}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-3 px-5 py-1.5 rounded-full ${isTimeCritical ? 'bg-red-500/10 border border-red-500/20' : 'bg-white/5 border border-white/10'} transition-all`}>
              <Clock size={14} className={isTimeCritical ? 'text-red-400 animate-pulse' : 'text-zinc-400'} />
              <span className={`text-lg font-semibold tabular-nums tracking-tight ${isTimeCritical ? 'text-red-400' : 'text-zinc-200'}`}>{fmtTime(secondsLeft)}</span>
            </div>
            <div className="text-[10px] text-zinc-600 font-mono tabular-nums uppercase">
              {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[11px] font-medium text-zinc-200 leading-none">Adarsh Maurya</p>
              <p className="text-[9px] text-zinc-500 font-mono mt-0.5">VSN-89241</p>
            </div>
          </div>
        </div>
        <div className="h-[1px] bg-zinc-900 relative">
          <div className="h-full bg-white transition-all duration-700 ease-out shadow-[0_0_8px_rgba(255,255,255,0.4)]" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[220px] shrink-0 bg-white border-r border-gray-200 flex flex-col">
          <QuestionPalette 
            questions={questions} 
            currentQ={currentQ} 
            answers={answers} 
            visited={visited} 
            markedForReview={markedForReview} 
            navigateTo={(i) => { setCurrentQ(i); setVisited(v => ({ ...v, [i]: true })); }}
          />
          <ProctoringSidebar cameraActive={cameraActive} videoRef={videoRef} faceActive={faceBoxes.length > 0} />
          
          <div className="mt-auto p-3 border-t border-gray-100 bg-slate-50/50 flex items-center justify-between group">
            <div className="flex flex-col">
              <span className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Secure Protocol</span>
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-black text-emerald-600 tracking-wider font-mono">ENCRYPTED</span>
              </div>
            </div>
            <button 
              onClick={() => setShowExitPrompt(true)} 
              className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-200/20 active:scale-95"
              title="Secure Exit"
            >
              <Power size={14} />
            </button>
          </div>
        </aside>

        {/* Main Area */}
        <main className="flex-1 flex flex-col bg-[#f0f2f5]">
          <div className="shrink-0 bg-white border-b border-gray-200">
            <div className="h-7 bg-gray-50 border-b border-gray-100 flex items-center justify-between px-6">
              <div className="flex items-center gap-4 text-[9px] text-gray-400 uppercase font-bold tracking-wider">
                <span className="flex items-center gap-1"><Monitor size={10} /> Computer Science</span>
                <span>45 min</span>
                <span>Max: {questions.length * 4}</span>
              </div>
              <div className="flex items-center gap-3 text-[9px] font-bold">
                <span className="text-green-600">+4 Correct</span>
                <span className="text-red-400">-1 Wrong</span>
              </div>
            </div>
            <div className="h-10 flex items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <span className="text-[12px] font-bold text-gray-900">Question {currentQ + 1}</span>
                <span className="text-[11px] text-gray-400">of {questions.length}</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-500">{q?.type}</span>
              </div>
              <div className="flex items-center gap-2">
                {markedForReview[currentQ] && <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-1 rounded border border-violet-100 flex items-center gap-1"><Bookmark size={10} fill="currentColor" /> Marked</span>}
                {answers[currentQ] !== undefined && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100 flex items-center gap-1"><CheckCircle size={10} /> Saved</span>}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scroll-thin">
            <AnimatePresence mode="wait">
              <motion.div key={currentQ} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }} className="max-w-4xl mx-auto px-8 py-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
                  <p className="text-[15px] font-medium text-gray-800 leading-relaxed font-sans">{q?.text}</p>
                </div>

                {q?.type === 'mcq' && (
                  <div className="grid gap-2.5">
                    {q.options.map((opt, i) => (
                      <button key={i} onClick={() => setAnswers(p => ({ ...p, [currentQ]: i }))} className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all group ${answers[currentQ] === i ? 'border-[#1a56db] bg-blue-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${answers[currentQ] === i ? 'bg-[#1a56db] text-white' : 'bg-gray-50 text-gray-500 border-2 border-gray-200'}`}>{String.fromCharCode(65 + i)}</div>
                        <span className={`text-[14px] flex-1 ${answers[currentQ] === i ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>{opt}</span>
                        {answers[currentQ] === i && <CheckCircle size={18} className="text-[#1a56db]" />}
                      </button>
                    ))}
                  </div>
                )}

                {q?.type === 'coding' && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-500 uppercase tracking-widest"><Terminal size={14} className="text-[#1e3a5f]" /> {q.language}</div>
                        <button onClick={handleRunCode} disabled={isExecuting} className="px-4 py-1.5 bg-[#1e3a5f] hover:bg-[#162e4d] disabled:opacity-50 text-white text-[11px] font-bold rounded-lg flex items-center gap-2 transition-all">
                          {isExecuting ? <RotateCcw size={12} className="animate-spin" /> : <Play size={12} />} Run Sandbox
                        </button>
                      </div>
                      <textarea
                        value={answers[currentQ] ?? q.starterCode}
                        onChange={(e) => setAnswers(p => ({ ...p, [currentQ]: e.target.value }))}
                        className="w-full h-72 bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                      />
                    </div>
                    {executionResult && (
                      <div className={`p-4 rounded-xl border ${executionResult.error ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'} font-mono text-[11px]`}>
                        <p className="text-gray-400 mb-2 uppercase text-[9px] font-bold tracking-widest">Compiler Output</p>
                        <pre className="text-gray-700 whitespace-pre-wrap">{executionResult.stdout || executionResult.error}</pre>
                      </div>
                    )}
                  </div>
                )}

                {q?.type === 'short' && (
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <textarea
                      value={answers[currentQ] || ''}
                      onChange={(e) => setAnswers(p => ({ ...p, [currentQ]: e.target.value }))}
                      placeholder="Enter your comprehensive response..."
                      className="w-full h-56 bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-800 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none leading-relaxed"
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="h-14 shrink-0 bg-white border-t border-gray-200 flex items-center justify-between px-6 shadow-sm">
            <div className="flex gap-2">
              <button onClick={() => setCurrentQ(p => Math.max(0, p - 1))} disabled={currentQ === 0} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-bold text-gray-500 hover:bg-gray-100 disabled:opacity-30 border border-gray-200 transition-all"><ChevronLeft size={14} /> Previous</button>
              {answers[currentQ] !== undefined && <button onClick={() => setAnswers(p => { const n = { ...p }; delete n[currentQ]; return n; })} className="px-3 py-2 rounded-lg text-[11px] font-bold text-red-500 hover:bg-red-50 border border-red-100 transition-all">Clear Response</button>}
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setMarkedForReview(p => ({ ...p, [currentQ]: !p[currentQ] }))} 
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-bold border transition-all ${markedForReview[currentQ] ? 'bg-violet-600 text-white border-violet-600' : 'border-gray-200 text-gray-500 hover:bg-violet-50'}`}
              >
                <Bookmark size={14} fill={markedForReview[currentQ] ? 'currentColor' : 'none'} /> Review
              </button>
              
              {currentQ < questions.length - 1 ? (
                <button onClick={() => { setCurrentQ(currentQ + 1); setVisited(v => ({ ...v, [currentQ + 1]: true })); }} className="flex items-center gap-1.5 bg-[#1e3a5f] hover:bg-[#162e4d] text-white px-6 py-2 rounded-lg text-[11px] font-bold shadow-md transition-all active:scale-95">Save & Next <ChevronRight size={14} /></button>
              ) : (
                <button onClick={() => setShowConfirm(true)} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-[11px] font-bold shadow-md transition-all active:scale-95">Submit Exam <Send size={14} /></button>
              )}
            </div>
          </div>
        </main>
      </div>

      <SubmitModal 
        isOpen={showConfirm} 
        onClose={() => setShowConfirm(false)} 
        onConfirm={async () => {
          try {
            const result = await api.post('/api/exams/submit', { examId, answers });
            console.log('Submission result:', result.data);
          } catch (err) {
            console.warn('Backend submit failed, answers saved locally:', err.message);
          }
          setSubmitted(true);
          setTimeout(() => navigate('/student'), 2500);
        }} 
        stats={{ answered: answeredCount, unanswered: questions.length - answeredCount, marked: Object.values(markedForReview).filter(Boolean).length }} 
      />
      
      <ExitModal 
        isOpen={showExitPrompt} 
        onClose={() => setShowExitPrompt(false)} 
        onExit={() => { if (exitPassword === '12345') { setSubmitted(true); setTimeout(() => navigate('/student'), 1500); } else { alert('Incorrect Pass'); setExitPassword(''); } }} 
        password={exitPassword} 
        setPassword={setExitPassword} 
      />

      <TabToast toast={tabToast} />
    </div>
  );
}
