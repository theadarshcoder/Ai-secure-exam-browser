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
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useTabVisibility, TabToast } from '../components/TabVisibility';
import * as faceapi from '@vladmandic/face-api';
import VisionLogo from '../components/VisionLogo';

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const TOTAL_SECONDS = 45 * 60;

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

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
    'current': 'bg-[#0d9488] text-white border-[#0d9488] ring-2 ring-teal-300 font-bold scale-110 z-10',
    'answered': 'bg-[#15803d] text-white border-[#15803d] font-bold',
    'marked': 'bg-[#7c3aed] text-white border-[#7c3aed] font-bold',
    'marked-answered': 'bg-[#7c3aed] text-white border-[#7c3aed] font-bold ring-2 ring-green-400',
    'visited': 'bg-[#ea580c] text-white border-[#ea580c] font-bold',
    'not-visited': 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200 hover:text-gray-600',
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-5 pt-5 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">Question Palette</span>
          <div className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded text-[10px] font-bold text-[#0f766e] tabular-nums">{answered}/{questions.length}</div>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="px-4 py-1.5 bg-[#0f766e] text-white text-[9px] font-bold rounded-lg uppercase tracking-wide shadow-sm shadow-teal-900/10">Section A</button>
          <button className="px-4 py-1.5 bg-gray-50 text-gray-400 text-[9px] font-bold rounded-lg uppercase tracking-wide hover:bg-gray-100 transition-colors border border-gray-200">All</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin px-4 py-6">
        <div className="grid grid-cols-5 gap-2">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => navigateTo(i)}
              className={`w-full aspect-square rounded-xl flex items-center justify-center text-[12px] border transition-all duration-100 cursor-pointer ${stateStyles[getQState(i)]}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto px-5 py-6 border-t border-gray-100 bg-gray-50/30">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-4">Legend</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {[
            { color: 'bg-[#15803d]', label: `Answered (${answered})` },
            { color: 'bg-[#ea580c]', label: `Visited (${visitedNotAnswered})` },
            { color: 'bg-gray-200', label: `Not Visited (${notVisitedCount})` },
            { color: 'bg-[#7c3aed]', label: `Marked (${markedCount})` },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-md ${item.color} shrink-0 shadow-sm shadow-black/5`} />
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tight truncate">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProctoringSidebar = ({ cameraActive, videoRef, faceActive }) => (
  <div className="flex flex-col items-center gap-3">
    <div className="relative w-36 h-36 rounded-2xl bg-gray-900 border-2 border-slate-100 shadow-inner overflow-hidden group transition-all hover:border-sky-200">
      {cameraActive ? (
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-slate-50">
          <CameraOff size={16} className="text-slate-300" />
          <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">No Feed</span>
        </div>
      )}
      <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded-md text-[7px] font-black text-white uppercase tracking-[0.15em] z-10">
        Live
      </div>
    </div>
    
    <div className="flex items-center gap-2 px-3 py-1 bg-white/50 backdrop-blur-sm rounded-full border border-gray-100">
      {[true, true, true, faceActive].map((ok, i) => (
        <div key={i} title={['Engine', 'Network', 'Audio', 'Face'][i]} className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
      ))}
    </div>
  </div>
);

const SubmitModal = ({ isOpen, onClose, onConfirm, stats }) => (
  <AnimatePresence>
    {isOpen && (
      <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
        <Motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-200">
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
        </Motion.div>
      </Motion.div>
    )}
  </AnimatePresence>
);

const ExitModal = ({ isOpen, onClose, onExit, password, setPassword }) => (
  <AnimatePresence>
    {isOpen && (
      <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
        <Motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-gray-200 text-center">
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
        </Motion.div>
      </Motion.div>
    )}
  </AnimatePresence>
);

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

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
  const [terminated, setTerminated] = useState(null);
  const [terminateCountdown, setTerminateCountdown] = useState(8);
  const [isFullscreen, setIsFullscreen] = useState(true);

  // We define logIncident first so it's available for effects
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

    socketService.emitViolation(incident);

    try {
      await api.post('/api/exams/incident', { examId, type, severity, details });
    } catch (apiErr) {
      console.warn('Incident API save failed:', apiErr.message);
    }

    const existing = JSON.parse(localStorage.getItem('vision_incidents') || '[]');
    localStorage.setItem('vision_incidents', JSON.stringify([incident, ...existing]));
  }, [examId]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    const storedTheme = document.documentElement.getAttribute('data-theme');
    document.documentElement.removeAttribute('data-theme');
    return () => {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
      if (storedTheme) document.documentElement.setAttribute('data-theme', storedTheme);
      else document.documentElement.removeAttribute('data-theme');
    };
  }, []);

  useEffect(() => {
    if (submitted || terminated) return;
    const studentId = localStorage.getItem('vision_email') || 'VSN-89241';
    const check = () => {
      try {
        const list = JSON.parse(localStorage.getItem('vision_terminated_sessions') || '[]');
        const hit = list.find(t => t.studentId === studentId || t.examId === examId);
        if (hit) setTerminated(hit);
      } catch (err) {
        console.warn('Termination poll failed:', err);
      }
    };
    const poll = setInterval(check, 3000);
    return () => clearInterval(poll);
  }, [submitted, terminated, examId]);

  useEffect(() => {
    if (!terminated) return;
    if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); }
    localStorage.removeItem(`vision_offline_exam_${examId}`);
    const tick = setInterval(() => {
      setTerminateCountdown(c => {
        if (c <= 1) { clearInterval(tick); navigate('/student'); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [terminated, examId, navigate, stream]);

  useEffect(() => {
    if (submitted) return;
    const interval = setInterval(() => {
      setSecondsLeft(s => (s <= 0 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [submitted]);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const response = await api.get(`/api/exams/${examId}`);
        const data = response.data;
        setExam(data);
        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
          if (data.duration) setSecondsLeft(data.duration * 60);
        }
      } catch (err) {
        console.warn('Backend unavailable, using mock data:', err.message);
        const fallbackExam = {
          id: examId,
          title: 'Demonstration Exam',
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
            { id: 4, type: 'mcq', text: 'What is the time complexity of binary search on a sorted array of n elements?', options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], marks: 4 },
            { id: 5, type: 'mcq', text: 'Which scheduling algorithm can cause starvation of low-priority processes?', options: ['Round Robin', 'First Come First Serve', 'Shortest Job First (SJF)', 'Priority Scheduling'], marks: 4 },
            { id: 6, type: 'mcq', text: 'In SQL, which clause is used to filter groups after aggregation?', options: ['WHERE', 'GROUP BY', 'HAVING', 'ORDER BY'], marks: 4 },
            { id: 7, type: 'mcq', text: 'Which HTTP status code indicates that a requested resource has been permanently moved?', options: ['301', '302', '404', '500'], marks: 4 },
            { id: 8, type: 'mcq', text: 'In React, what hook is used to perform side effects in a functional component?', options: ['useState', 'useContext', 'useEffect', 'useReducer'], marks: 4 },
            { id: 9, type: 'mcq', text: 'Which of the following is NOT a valid JavaScript data type?', options: ['Symbol', 'BigInt', 'Float', 'undefined'], marks: 4 },
            { id: 10, type: 'mcq', text: 'What does the CAP theorem state about distributed systems?', options: ['They can guarantee all three: Consistency, Availability, and Partition tolerance', 'They must sacrifice one of Consistency, Availability, or Partition tolerance', 'Consistency and Availability cannot coexist', 'Partition tolerance is optional'], marks: 4 },
            { id: 11, type: 'mcq', text: 'Which sorting algorithm has the best average-case time complexity?', options: ['Bubble Sort', 'Insertion Sort', 'Merge Sort', 'Selection Sort'], marks: 4 },
            { id: 12, type: 'mcq', text: 'In object-oriented design, which SOLID principle states that a class should have only one reason to change?', options: ['Open/Closed Principle', 'Single Responsibility Principle', 'Liskov Substitution', 'Interface Segregation'], marks: 4 },
            { id: 13, type: 'mcq', text: 'Which data structure is used internally by a HashMap for collision resolution in Java?', options: ['Array', 'Linked List / Red-Black Tree', 'Binary Heap', 'Stack'], marks: 4 },
            { id: 14, type: 'mcq', text: 'What is the primary purpose of a virtual memory system?', options: ['To speed up CPU processing', 'To allow processes to use more memory than physically available', 'To encrypt memory contents', 'To share GPU memory with the CPU'], marks: 4 },
            { id: 15, type: 'mcq', text: 'Which protocol operates at the Transport layer of the OSI model?', options: ['HTTP', 'IP', 'TCP', 'Ethernet'], marks: 4 },
            { id: 16, type: 'mcq', text: 'In CSS, which property establishes a new stacking context?', options: ['display: flex', 'position: relative with z-index', 'margin: auto', 'box-sizing: border-box'], marks: 4 },
            { id: 17, type: 'mcq', text: 'Which Git command creates a new branch and immediately switches to it?', options: ['git branch <name>', 'git checkout <name>', 'git checkout -b <name>', 'git switch --create <name>'], marks: 4 },
            { id: 18, type: 'mcq', text: 'What is a deadlock in operating systems?', options: ['A process that consumes 100% CPU', 'A set of processes each waiting on a resource held by another', 'A process that crashes unexpectedly', 'Memory that is allocated but never freed'], marks: 4 },
            { id: 19, type: 'mcq', text: 'In asymptotic notation, if an algorithm is O(1), what does that mean?', options: ['It runs in one millisecond', 'Its runtime grows linearly with input', 'Its runtime is constant regardless of input size', 'It uses one unit of memory'], marks: 4 },
            { id: 20, type: 'mcq', text: 'Which design pattern separates the construction of a complex object from its representation?', options: ['Factory', 'Builder', 'Prototype', 'Singleton'], marks: 4 }
          ]
        };
        setExam(fallbackExam);
        setQuestions(fallbackExam.questions);
      }
    };
    fetchExam();
  }, [examId]);

  useEffect(() => {
    const initCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: 640, height: 480 }
        });
        setStream(mediaStream);
        setCameraActive(true);
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      } catch (err) { 
        console.error("Camera access failed", err);
        setCameraActive(false); 
      }
    };
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
      } catch (err) { console.error("AI engine failure", err); }
    };
    initCamera();
    loadModels();
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()); };
  }, []);

  useEffect(() => {
    if (videoRef.current && stream && cameraActive) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
      videoRef.current.play().catch(e => console.warn("Auto-play blocked", e));
    }
  }, [stream, cameraActive, currentQ]);

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

  useEffect(() => {
    if (tabToast && !submitted) logIncident('Tab Switch', 'high', tabToast.msg);
  }, [tabToast, submitted]);

  useEffect(() => {
    const studentId = localStorage.getItem('vision_email') || 'VSN-89241';
    socketService.connect(studentId);
    return () => socketService.disconnect();
  }, []);

  const logIncident = async (type, severity, details) => {
    const studentId = localStorage.getItem('vision_email') || 'VSN-89241';
    const incident = { id: `INC-${Date.now()}`, examId, studentId, type, severity, details, timestamp: new Date().toISOString() };
    socketService.emitViolation(incident);
    try { await api.post('/api/exams/incident', { examId, type, severity, details }); } catch (err) {}
    const existing = JSON.parse(localStorage.getItem('vision_incidents') || '[]');
    localStorage.setItem('vision_incidents', JSON.stringify([incident, ...existing]));
  };

  const handleRunCode = async () => {
    setIsExecuting(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      setExecutionResult({ stdout: 'Environment active. Results simulated for demo.\n> Final output: Validated.', time: 0.24, memory: 1024 });
    } catch (err) { setExecutionResult({ error: 'Execution Error', details: err.message }); } finally { setIsExecuting(false); }
  };

  const fmtTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sc = (s % 60).toString().padStart(2, '0');
    return `${m}:${sc}`;
  };

  const q = questions[currentQ];
  const answeredCount = Object.keys(answers).length;

  if (terminated) {
    return (
      <div className="h-screen bg-[#08020a] flex items-center justify-center font-sans relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.15)_0%,transparent_70%)]" />
        <div className="text-center relative z-10 max-w-lg mx-auto px-6">
          <XCircle size={48} className="text-red-500 mx-auto mb-8" />
          <h2 className="text-4xl font-black text-white mb-3">Exam Terminated</h2>
          <p className="text-zinc-400 text-sm mb-8">{terminated.reason || 'Session terminated by supervisor.'}</p>
          <div className="flex items-center justify-center gap-3 text-sm text-red-400 font-bold">
            <span className="w-10 h-10 rounded-full border-2 border-red-500/30 flex items-center justify-center">{terminateCountdown}</span>
            <p>Redirecting in {terminateCountdown}s</p>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="h-screen bg-white flex items-center justify-center font-sans">
        <div className="text-center">
          <CheckCircle size={60} className="text-green-600 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Exam Submitted Successfully</h2>
          <p className="text-gray-400 text-xs">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#f8f9fa] flex flex-col overflow-hidden select-none font-sans">
      <style>{`
        html, body { overflow: hidden !important; height: 100% !important; overscroll-behavior: none !important; }
        .scroll-thin::-webkit-scrollbar { width: 4px; }
        .scroll-thin::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>

      {/* Header */}
      <header className="shrink-0 z-30">
        <div className="h-[52px] bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <VisionLogo className="w-[18px] h-[18px] text-white" />
            <span className="text-[12px] font-bold tracking-[0.22em] uppercase text-white">VISION</span>
            <div className="h-4 w-px bg-zinc-800" />
            <span className="text-[12px] font-medium text-zinc-400 truncate max-w-[200px]">{exam?.title || 'Technical Assessment'}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-3 px-5 py-1.5 rounded-full ${isTimeCritical ? 'bg-red-500/10 border border-red-500/20' : 'bg-white/5 border border-white/10'}`}>
              <Clock size={14} className={isTimeCritical ? 'text-red-400 animate-pulse' : 'text-zinc-400'} />
              <span className={`text-lg font-semibold tabular-nums text-zinc-200`}>{fmtTime(secondsLeft)}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-medium text-zinc-200">Adarsh Maurya</p>
            <p className="text-[9px] text-zinc-500 font-mono">VSN-89241</p>
          </div>
        </div>
        <div className="h-[1px] bg-zinc-900">
          <div className="h-full bg-white transition-all duration-700" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[240px] shrink-0 bg-white border-r border-gray-200 flex flex-col gap-[24px]">
          <QuestionPalette 
            questions={questions} currentQ={currentQ} answers={answers} visited={visited} markedForReview={markedForReview} 
            navigateTo={(i) => { setCurrentQ(i); setVisited(v => ({ ...v, [i]: true })); }}
          />
          <div className="mt-auto p-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[8px] font-black text-emerald-600 tracking-wider">ENCRYPTED</span>
            <button onClick={() => setShowExitPrompt(true)} className="p-2 rounded-lg bg-red-500/10 text-red-500"><Power size={14} /></button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col bg-[#f8f9fa] overflow-hidden relative">
          {/* Floating Live Feed at Top-Right */}
          <div className="absolute top-6 right-8 z-50">
            <div className="bg-white/80 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-2xl">
              <ProctoringSidebar cameraActive={cameraActive} videoRef={videoRef} faceActive={faceBoxes.length > 0} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scroll-thin px-8 py-6">
            <div className="max-w-4xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div key={currentQ} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <div className="px-8 py-4 flex items-center justify-between bg-gray-50/50 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-bold text-gray-900 tracking-tight">QUESTION {currentQ + 1} OF {questions.length}</span>
                        <div className="h-3 w-px bg-gray-200" />
                        <div className="flex gap-4 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          <span>COMPUTER SCIENCE</span>
                          <span>MAX: {questions.length * 4}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {markedForReview[currentQ] && <span className="text-[9px] font-black text-violet-600 bg-violet-50 px-2 py-0.5 rounded border border-violet-100 uppercase tracking-widest">Review</span>}
                        {answers[currentQ] !== undefined && <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100 uppercase tracking-widest">Saved</span>}
                      </div>
                    </div>
                    
                    <div className="p-8 pt-10">
                      <h2 className="text-[18px] font-semibold text-gray-900 leading-snug">{q?.text}</h2>
                    </div>
                    <div className="h-px bg-gray-100 mx-8" />
                    
                    <div className="p-8">
                      {q?.type === 'mcq' && (
                        <div className="grid gap-3">
                          {q.options.map((opt, i) => (
                            <button key={i} onClick={() => setAnswers(p => ({ ...p, [currentQ]: i }))} className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${answers[currentQ] === i ? 'border-teal-600 bg-teal-50' : 'border-gray-100 hover:border-gray-200'}`}>
                              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${answers[currentQ] === i ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-400'}`}>{String.fromCharCode(65 + i)}</span>
                              <span className={`text-[15px] flex-1 text-left ${answers[currentQ] === i ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>{opt}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {q?.type === 'coding' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{q.language} EDITOR</span>
                            <button onClick={handleRunCode} disabled={isExecuting} className="px-4 py-1.5 bg-[#0f766e] text-white text-[10px] font-bold rounded-lg flex items-center gap-2">
                              {isExecuting ? <RotateCcw size={12} className="animate-spin" /> : <Play size={12} />} RUN CODE
                            </button>
                          </div>
                          <textarea
                            value={answers[currentQ] ?? q.starterCode}
                            onChange={(e) => setAnswers(p => ({ ...p, [currentQ]: e.target.value }))}
                            className="w-full h-80 bg-slate-50 border border-gray-100 rounded-lg p-5 font-mono text-[13px] text-gray-800 focus:outline-none focus:border-teal-200 transition-all resize-none"
                            spellCheck="false"
                          />
                          {executionResult && (
                            <div className={`p-4 rounded-lg border ${executionResult.error ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-900 border-slate-700 text-emerald-400'} font-mono text-[11px]`}>
                              <pre className="whitespace-pre-wrap">{executionResult.stdout || executionResult.error}</pre>
                            </div>
                          )}
                        </div>
                      )}
                      {q?.type === 'short' && (
                        <textarea
                          value={answers[currentQ] || ''}
                          onChange={(e) => setAnswers(p => ({ ...p, [currentQ]: e.target.value }))}
                          placeholder="Type your response here..."
                          className="w-full h-64 bg-slate-50 border border-gray-100 rounded-lg p-6 text-gray-800 text-[15px] focus:outline-none focus:border-teal-200 transition-all resize-none"
                        />
                      )}
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between">
                    <div className="flex gap-3">
                      <button onClick={() => setCurrentQ(p => Math.max(0, p - 1))} disabled={currentQ === 0} className="px-6 py-2.5 rounded-xl text-[12px] font-bold text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 flex items-center gap-2 disabled:opacity-30"><ChevronLeft size={16} /> Previous</button>
                      <button onClick={() => setMarkedForReview(p => ({ ...p, [currentQ]: !p[currentQ] }))} className={`px-6 py-2.5 rounded-xl text-[12px] font-bold border transition-all ${markedForReview[currentQ] ? 'bg-violet-600 text-white' : 'bg-white text-gray-600'}`}>Review Later</button>
                    </div>
                    {currentQ < questions.length - 1 ? (
                      <button onClick={() => { setCurrentQ(currentQ + 1); setVisited(v => ({ ...v, [currentQ + 1]: true })); }} className="bg-[#0f766e] text-white px-8 py-2.5 rounded-xl text-[12px] font-bold flex items-center gap-2">Save & Next <ChevronRight size={16} /></button>
                    ) : (
                      <button onClick={() => setShowConfirm(true)} className="bg-green-600 text-white px-8 py-2.5 rounded-xl text-[12px] font-bold flex items-center gap-2">Complete Exam <Send size={16} /></button>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>

      <SubmitModal isOpen={showConfirm} onClose={() => setShowConfirm(false)} stats={{ answered: answeredCount, unanswered: questions.length - answeredCount, marked: Object.values(markedForReview).filter(Boolean).length }} onConfirm={() => { setSubmitted(true); setTimeout(() => navigate('/student'), 2000); }} />
      <ExitModal isOpen={showExitPrompt} onClose={() => setShowExitPrompt(false)} password={exitPassword} setPassword={setExitPassword} onExit={() => { if (exitPassword === '12345') { setSubmitted(true); setTimeout(() => navigate('/student'), 1000); } else { alert('Incorrect Pass'); setExitPassword(''); } }} />
      <TabToast toast={tabToast} />
    </div>
  );
}

