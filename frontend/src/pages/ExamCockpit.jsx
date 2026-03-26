import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import socketService from '../services/socket';
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

const MOCK_QUESTIONS = [
  { id: 1, type: 'mcq', text: 'Analyze the Priority Scheduling algorithm. In what scenario does "Priority Inversion" lead to a total system deadlock?', options: ['Normal Execution', 'Resource Contention', 'Bounded Waiting', 'Preemption Violation'], correct: 1 },
  { id: 2, type: 'coding', text: 'Implement a high-performance memory-efficient algorithm to detect the longest unique subsequence within a stream.', language: 'javascript', starterCode: '/**\n * @param {string} s\n * @return {number}\n */\nfunction lengthOfLongestSubstring(s) {\n  // Your code here\n}' },
  { id: 3, type: 'short', text: 'Explain the ACID properties in database transactions and how they ensure data integrity.' },
  ...Array(17).fill(null).map((_, i) => ({
    id: i + 4,
    type: 'mcq',
    text: 'Identify the most critical optimization flaw in the provided high-concurrency architecture that would lead to systematic degradation.',
    options: ['Scalability limit', 'Single point of failure', 'Latency overhead', 'Memory leak'],
    correct: 1
  }))
];

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
    <aside className="w-[220px] shrink-0 bg-white border-r border-gray-200 flex flex-col">
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
    </aside>
  );
};

const ProctoringSidebar = ({ cameraActive, videoRef, faceActive }) => (
  <div className="px-3 py-3 border-t border-gray-100 bg-white">
    <div className="relative w-full aspect-[4/3] rounded-lg bg-gray-100 border border-gray-200 overflow-hidden">
      {cameraActive ? (
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
      ) : (
        <div className="w-full h-full flex items-center justify-center"><CameraOff size={20} className="text-gray-300" /></div>
      )}
      <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 bg-black/60 rounded text-[8px] font-bold text-white uppercase tracking-wider">
        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Live
      </div>
    </div>
    
    <div className="mt-3">
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
  const [questions, setQuestions] = useState(MOCK_QUESTIONS);
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [cameraActive, setCameraActive] = useState(true);
  const [stream, setStream] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [visited, setVisited] = useState({ 0: true });
  const [submitted, setSubmitted] = useState(false);
  const [confidence, setConfidence] = useState(98);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceBoxes, setFaceBoxes] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const [exitPassword, setExitPassword] = useState('');

  // Cinematic Command Center lock
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    };
  }, []);

  // Timer logic
  useEffect(() => {
    if (submitted) return;
    const interval = setInterval(() => {
      setSecondsLeft(s => (s <= 0 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [submitted]);

  // Load Exam
  useEffect(() => {
    const published = JSON.parse(localStorage.getItem('published_exams') || '[]');
    const foundExam = published.find(e => e.id === examId);
    if (foundExam) setExam(foundExam);
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

  const logIncident = (type, severity, details) => {
    const incident = {
      id: `INC-${Date.now()}`,
      examId,
      studentId: 'VSN-89241',
      type,
      severity,
      details,
      timestamp: new Date().toISOString(),
    };

    // Emit to backend for real-time mentor alerts
    socketService.emitViolation(incident);

    const existing = JSON.parse(localStorage.getItem('vision_incidents') || '[]');
    localStorage.setItem('vision_incidents', JSON.stringify([incident, ...existing]));
  };

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
      <style>{`
        html, body { overflow: hidden !important; height: 100% !important; overscroll-behavior: none !important; }
        .scroll-thin::-webkit-scrollbar { width: 4px; }
        .scroll-thin::-webkit-scrollbar-track { background: transparent; }
        .scroll-thin::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>

      {/* Header */}
      <header className="shrink-0 z-30">
        <div className="h-[52px] bg-[#1e3a5f] text-white flex items-center justify-between px-5">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <VisionLogo className="w-4 h-4 text-sky-300" />
              <span className="text-[11px] font-bold tracking-wider uppercase">VISION</span>
            </div>
            <div className="h-4 w-px bg-white/20" />
            <span className="text-[12px] font-medium text-sky-200 truncate max-w-[200px]">{exam?.title || 'Technical Assessment'}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-3 px-5 py-1.5 rounded-lg ${isTimeCritical ? 'bg-red-600/90' : 'bg-white/10'} transition-all`}>
              <Clock size={15} className={isTimeCritical ? 'text-white animate-pulse' : 'text-sky-300'} />
              <span className="text-2xl font-bold tabular-nums tracking-tight text-white">{fmtTime(secondsLeft)}</span>
            </div>
            <div className="text-[10px] text-sky-300/50 font-mono tabular-nums uppercase">
              {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[11px] font-semibold text-white leading-none">Adarsh Maurya</p>
              <p className="text-[9px] text-sky-300/70 font-mono mt-0.5">VSN-89241</p>
            </div>
          </div>
        </div>
        <div className="h-[3px] bg-[#15294a] relative">
          <div className="h-full bg-sky-400 transition-all duration-700 ease-out" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="flex flex-col border-r border-gray-200">
          <QuestionPalette 
            questions={questions} 
            currentQ={currentQ} 
            answers={answers} 
            visited={visited} 
            markedForReview={markedForReview} 
            navigateTo={(i) => { setCurrentQ(i); setVisited(v => ({ ...v, [i]: true })); }}
          />
          <ProctoringSidebar cameraActive={cameraActive} videoRef={videoRef} faceActive={faceBoxes.length > 0} />
        </div>

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

      <button onClick={() => setShowExitPrompt(true)} className="fixed bottom-4 right-4 w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl hover:bg-red-700 hover:scale-110 active:scale-90 transition-all z-[100]"><Power size={18} /></button>

      <SubmitModal 
        isOpen={showConfirm} 
        onClose={() => setShowConfirm(false)} 
        onConfirm={() => { setSubmitted(true); setTimeout(() => navigate('/student'), 2500); }} 
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
