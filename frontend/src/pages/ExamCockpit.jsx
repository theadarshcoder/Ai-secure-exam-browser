import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import socketService from '../services/socket';
import api, { runCodingQuestion, requestHelp } from '../services/api';
import Editor from '@monaco-editor/react';
import {
  Camera, CameraOff, Clock, Shield, CheckCircle,
  ChevronRight, ChevronLeft, Send, XCircle,
  Bookmark, Terminal, Eye, Fingerprint, AlertCircle, Power,
  Loader2, RotateCcw, Play, Monitor, ScanFace, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTabVisibility, TabToast } from '../components/TabVisibility';
import * as faceapi from '@vladmandic/face-api';
import VisionLogo from '../components/VisionLogo';

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const TOTAL_SECONDS = 45 * 60;

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const QuestionPalette = ({ questions, currentQ, answers, visited, markedForReview, navigateTo }) => {
  const answered = Object.keys(answers).length;

  const getQState = (shuffledIndex) => {
    const originalIndex = questions[shuffledIndex]?.originalIndex;
    if (shuffledIndex === currentQ) return 'current';
    if (markedForReview[originalIndex] && answers[originalIndex] !== undefined) return 'marked-answered';
    if (markedForReview[originalIndex]) return 'marked';
    if (answers[originalIndex] !== undefined) return 'answered';
    if (visited[originalIndex]) return 'visited';
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

      <div className="mt-auto px-4 py-4 border-t border-gray-100 bg-gray-50/40">
        <div className="flex flex-wrap gap-x-3 gap-y-2">
          {[
            { color: 'bg-[#15803d]', label: 'Answered' },
            { color: 'bg-[#ea580c]', label: 'Visited' },
            { color: 'bg-gray-300', label: 'Unseen' },
            { color: 'bg-[#7c3aed]', label: 'Marked' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${item.color} shrink-0`} />
              <span className="text-[9px] text-gray-400 font-semibold">{item.label}</span>
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
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const ExitModal = ({ isOpen, onClose, onExit, password, setPassword, error }) => (
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
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center text-gray-900 font-mono tracking-widest mb-2 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all" 
          />
          <div className="min-h-[20px] mb-4">
            {error && <span className="text-xs font-bold text-red-500">{error}</span>}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all text-sm font-semibold">Cancel</button>
            <button onClick={onExit} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all text-sm font-semibold shadow-lg">Exit</button>
          </div>
        </motion.div>
      </motion.div>
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
  const [visited, setVisited] = useState({});
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
  const [confidence] = useState(98);
  const [broadcastMessage, setBroadcastMessage] = useState(null);
  const [helpLoading, setHelpLoading] = useState(false);
  const isTimeCritical = secondsLeft < 300 && secondsLeft > 0;

  // Listen for Mentor Broadcasts
  useEffect(() => {
    socketService.connect();
    socketService.onBroadcast((data) => {
      // Only show broadcast if it's meant for this specific exam
      if (!data.examId || data.examId === examId) {
        setBroadcastMessage(data.message);
        // Auto-dismiss after 10 seconds
        setTimeout(() => setBroadcastMessage(null), 10000);
      }
    });
    return () => socketService.disconnect();
  }, [examId]);

  // We define logIncident first so it's available for effects
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

    socketService.emitViolation(incident);

    try {
      await api.post('/api/exams/incident', { examId, type, severity, details });
    } catch (apiErr) {
      console.warn('Incident API save failed:', apiErr.message);
    }

    const existing = JSON.parse(localStorage.getItem('vision_incidents') || '[]');
    localStorage.setItem('vision_incidents', JSON.stringify([incident, ...existing]));
  }, [examId]);

  const handleRequestHelp = async () => {
    try {
      setHelpLoading(true);
      await requestHelp("Student needs manual intervention or has a query.");
      setToasts(prev => [...prev, { id: Date.now(), msg: "Help request sent to Mentors.", type: 'success' }]);
    } catch (err) {
      setToasts(prev => [...prev, { id: Date.now(), msg: "Failed to send help request.", type: 'error' }]);
    } finally {
      setHelpLoading(false);
    }
  };

  // 1. Fullscreen Enforcement & Shortcut Blocking
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const blockShortcuts = (e) => {
      // Block Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+F, Ctrl+P, F12, PrintScreen, etc.
      if (
        e.ctrlKey || e.metaKey || 
        ['F12', 'PrintScreen'].includes(e.key) ||
        (e.altKey && e.key === 'Tab')
      ) {
        e.preventDefault();
        logIncident('Shortcut Blocked', 'medium', `Attempted to use shortcut: ${e.key}`);
        return false;
      }
    };

    const blockContextMenu = (e) => {
      e.preventDefault();
      logIncident('Right Click Blocked', 'low', 'Attempted to open context menu.');
      return false;
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', blockShortcuts);
    document.addEventListener('contextmenu', blockContextMenu);
    
    // Auto-trigger fullscreen on mount
    const triggerFullscreen = async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch {
        console.warn('Fullscreen request failed — requires user interaction first.');
      }
    };
    triggerFullscreen();

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
      else document.documentElement.removeAttribute('data-theme');
    };
  }, []);

  useEffect(() => {
    if (submitted || terminated) return;
    const studentId = sessionStorage.getItem('vision_email') || 'VSN-89241';
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
        // ⭐ FETCH RESUME DATA INSTEAD OF JUST EXAM TEMPLATE
        const response = await api.get(`/api/exams/resume/${examId}`);
        
        if (response.data.isCompleted) {
          setSubmitted(true);
          return;
        }

        const data = response.data.exam;
        const sessionProgress = response.data;
        setExam(data);
        if (data.questions && data.questions.length > 0) {          
          // ⭐ SHUFFLE LOGIC STARTS HERE
          const studentId = sessionStorage.getItem('vision_email') || 'VSN-89241';
          // Create a unique randomizer for this specific student and exam
          const randomFunc = generateSeed(examId + studentId);

          // Map original indices before shuffling
          const processedQuestions = data.questions.map((q, qIndex) => {
            const processedQ = { ...q, originalIndex: qIndex };
            
            // Shuffle MCQ options
            if (processedQ.type === 'mcq' && processedQ.options) {
              const optionsWithIndex = processedQ.options.map((optText, optIndex) => ({
                text: optText,
                originalIndex: optIndex
              }));
              processedQ.displayOptions = seededShuffle(optionsWithIndex, randomFunc);
            }
            return processedQ;
          });

          // Finally, shuffle the questions array
          const finalShuffledQuestions = seededShuffle(processedQuestions, randomFunc);
          
          setQuestions(finalShuffledQuestions);
          // ⭐ SHUFFLE LOGIC ENDS HERE
          
          // ⭐ RESTORE SESSION STATE
          let restoredSecondsLeft = sessionProgress.remainingTimeSeconds !== undefined && sessionProgress.remainingTimeSeconds !== null 
            ? sessionProgress.remainingTimeSeconds 
            : (data.duration ? data.duration * 60 : TOTAL_SECONDS);
          let restoredAnswers = sessionProgress.answers || {};
          let startingQ = sessionProgress.currentQuestionIndex !== undefined ? sessionProgress.currentQuestionIndex : 0;
          let restoredVisited = sessionProgress.questionStates || {};

          // ⭐ OFFLINE RECOVERY: Check if there's a more recent backup in localStorage
          try {
            const offlineBackup = localStorage.getItem(`vision_offline_exam_${examId}`);
            if (offlineBackup) {
              const parsedOffline = JSON.parse(decodeURIComponent(atob(offlineBackup)));
              // If offline data has less time remaining, it is more recent than server data
              if (parsedOffline.remainingTimeSeconds < restoredSecondsLeft) {
                restoredSecondsLeft = parsedOffline.remainingTimeSeconds;
                restoredAnswers = parsedOffline.answers || {};
                startingQ = parsedOffline.currentQuestionIndex || 0;
                restoredVisited = parsedOffline.questionStates || {};
                console.log("Restored more recent state from offline backup.");
                
                // Fire a background sync to update the server immediately
                api.post('/api/exams/save-progress', parsedOffline).catch(e => console.warn('Background sync failed:', e));
              }
            }
          } catch (e) {
            console.warn('Failed to parse offline backup, ignoring:', e.message);
          }

          setSecondsLeft(restoredSecondsLeft);
          setAnswers(restoredAnswers);
          setCurrentQ(startingQ);
          
          // ⭐ FIX: Backend sends {"0": "not_visited"} which evaluates to true. We only extract actual visited states.
          let cleanedVisited = {};
          if (restoredVisited) {
            Object.entries(restoredVisited).forEach(([k, v]) => {
              if (v === true) cleanedVisited[k] = true;
            });
          }
          setVisited(Object.keys(cleanedVisited).length > 0 ? cleanedVisited : { [finalShuffledQuestions[startingQ].originalIndex]: true });
          if (finalShuffledQuestions[startingQ]?.type === 'coding') {
            setSelectedLanguage(finalShuffledQuestions[startingQ].language || 'javascript');
          }
        }
      } catch (err) {
        console.warn('Backend unavailable, using mock data:', err.message);
        const fallbackExam = {
          id: examId,
          title: 'Demonstration Exam',
          duration: 90,
          questions: [
            {
              id: 1, type: 'mcq', questionText: 'Which of the following data structures operates on a Last-In-First-Out (LIFO) principle?', 
              options: ['Queue', 'Stack', 'Linked List', 'Binary Tree'], marks: 4
            },
            {
              id: 2, type: 'mcq', questionText: 'In object-oriented programming, what is the concept of wrapping data and methods that work on data within one unit?', 
              options: ['Polymorphism', 'Inheritance', 'Encapsulation', 'Abstraction'], marks: 4
            },
            {
              id: 3, type: 'coding', questionText: 'Write a JavaScript function that takes an array of numbers and returns the sum of all positive numbers.', 
              language: 'javascript', initialCode: 'function sumPositive(arr) {\n  // Your code here\n}', marks: 10
            },
            { id: 4, type: 'mcq', questionText: 'What is the time complexity of binary search on a sorted array of n elements?', options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], marks: 4 },
            { id: 5, type: 'mcq', questionText: 'Which scheduling algorithm can cause starvation of low-priority processes?', options: ['Round Robin', 'First Come First Serve', 'Shortest Job First (SJF)', 'Priority Scheduling'], marks: 4 },
            { id: 6, type: 'mcq', questionText: 'In SQL, which clause is used to filter groups after aggregation?', options: ['WHERE', 'GROUP BY', 'HAVING', 'ORDER BY'], marks: 4 },
            { id: 7, type: 'mcq', questionText: 'Which HTTP status code indicates that a requested resource has been permanently moved?', options: ['301', '302', '404', '500'], marks: 4 },
            { id: 8, type: 'mcq', questionText: 'In React, what hook is used to perform side effects in a functional component?', options: ['useState', 'useContext', 'useEffect', 'useReducer'], marks: 4 },
            { id: 9, type: 'mcq', questionText: 'Which of the following is NOT a valid JavaScript data type?', options: ['Symbol', 'BigInt', 'Float', 'undefined'], marks: 4 },
            { id: 10, type: 'mcq', questionText: 'What does the CAP theorem state about distributed systems?', options: ['They can guarantee all three: Consistency, Availability, and Partition tolerance', 'They must sacrifice one of Consistency, Availability, or Partition tolerance', 'Consistency and Availability cannot coexist', 'Partition tolerance is optional'], marks: 4 },
            { id: 11, type: 'mcq', questionText: 'Which sorting algorithm has the best average-case time complexity?', options: ['Bubble Sort', 'Insertion Sort', 'Merge Sort', 'Selection Sort'], marks: 4 },
            { id: 12, type: 'mcq', questionText: 'In object-oriented design, which SOLID principle states that a class should have only one reason to change?', options: ['Open/Closed Principle', 'Single Responsibility Principle', 'Liskov Substitution', 'Interface Segregation'], marks: 4 },
            { id: 13, type: 'mcq', questionText: 'Which data structure is used internally by a HashMap for collision resolution in Java?', options: ['Array', 'Linked List / Red-Black Tree', 'Binary Heap', 'Stack'], marks: 4 },
            { id: 14, type: 'mcq', questionText: 'What is the primary purpose of a virtual memory system?', options: ['To speed up CPU processing', 'To allow processes to use more memory than physically available', 'To encrypt memory contents', 'To share GPU memory with the CPU'], marks: 4 },
            { id: 15, type: 'mcq', questionText: 'Which protocol operates at the Transport layer of the OSI model?', options: ['HTTP', 'IP', 'TCP', 'Ethernet'], marks: 4 },
            { id: 16, type: 'mcq', questionText: 'In CSS, which property establishes a new stacking context?', options: ['display: flex', 'position: relative with z-index', 'margin: auto', 'box-sizing: border-box'], marks: 4 },
            { id: 17, type: 'mcq', questionText: 'Which Git command creates a new branch and immediately switches to it?', options: ['git branch <name>', 'git checkout <name>', 'git checkout -b <name>', 'git switch --create <name>'], marks: 4 },
            { id: 18, type: 'mcq', questionText: 'What is a deadlock in operating systems?', options: ['A process that consumes 100% CPU', 'A set of processes each waiting on a resource held by another', 'A process that crashes unexpectedly', 'Memory that is allocated but never freed'], marks: 4 },
            { id: 19, type: 'mcq', questionText: 'In asymptotic notation, if an algorithm is O(1), what does that mean?', options: ['It runs in one millisecond', 'Its runtime grows linearly with input', 'Its runtime is constant regardless of input size', 'It uses one unit of memory'], marks: 4 },
            { id: 20, type: 'mcq', questionText: 'Which design pattern separates the construction of a complex object from its representation?', options: ['Factory', 'Builder', 'Prototype', 'Singleton'], marks: 4 }
          ]
        };
        
        // ⭐ FALLBACK EXAM SHUFFLE FIX
        const studentId = sessionStorage.getItem('vision_email') || 'VSN-89241';
        const randomFunc = generateSeed(examId + studentId);
        const processedQuestions = fallbackExam.questions.map((q, qIndex) => {
          const processedQ = { ...q, originalIndex: qIndex };
          if (processedQ.type === 'mcq' && processedQ.options) {
            const optionsWithIndex = processedQ.options.map((optText, optIndex) => ({ text: optText, originalIndex: optIndex }));
            processedQ.displayOptions = seededShuffle(optionsWithIndex, randomFunc);
          }
          return processedQ;
        });
        const finalShuffledQuestions = seededShuffle(processedQuestions, randomFunc);

        setExam(fallbackExam);
        setQuestions(finalShuffledQuestions);
        setSecondsLeft(fallbackExam.duration * 60);
        setVisited(v => ({ ...v, [finalShuffledQuestions[0].originalIndex]: true }));
      }
    };
    fetchExam();
  }, [examId]);

  // Sync language dropdown when navigating to a coding question
  useEffect(() => {
    const q = questions[currentQ];
    if (q?.type === 'coding') {
        const saved = answers[q.originalIndex];
        if (saved?.language && saved.language !== selectedLanguage) {
            setSelectedLanguage(saved.language);
        } else if (!saved?.language && q.language && q.language !== selectedLanguage) {
            setSelectedLanguage(q.language);
        }
    }
  }, [currentQ]);

  useEffect(() => {
    let localStream = null;
    const initCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: 640, height: 480 }
        });
        localStream = mediaStream;
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
    return () => { if (localStream) localStream.getTracks().forEach(t => t.stop()); };
  }, []);

  useEffect(() => {
    if (videoRef.current && stream && cameraActive) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
      videoRef.current.play().catch(e => console.warn("Auto-play blocked", e));
    }
  }, [stream, cameraActive]);

  useEffect(() => {
    if (!modelsLoaded || !cameraActive || submitted) return;
    let timerId;
    const runDetection = async () => {
      if (videoRef.current?.readyState === 4) {
        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.35 })
        );
        setFaceBoxes(detections.map(d => d.box));
      }
      // Throttle detection to 1 frame per second to save student's CPU
      timerId = setTimeout(runDetection, 1000);
    };
    runDetection();
    return () => clearTimeout(timerId);
  }, [modelsLoaded, cameraActive, submitted, stream]);

  useEffect(() => {
    if (tabToast && !submitted) logIncident('Tab Switch', 'high', tabToast.msg);
  }, [tabToast, submitted, logIncident]);

  useEffect(() => {
    socketService.connect();
    return () => socketService.disconnect();
  }, []);

  // ⭐ State references to avoid resetting auto-save interval on every keypress
  const progressRef = useRef({ answers, currentQ, visited, secondsLeft });
  useEffect(() => {
    progressRef.current = { answers, currentQ, visited, secondsLeft };
  }, [answers, currentQ, visited, secondsLeft]);

  // ⭐ Auto-Save Pipeline Connection: Calls Backend every 30 Seconds
  useEffect(() => {
    if (submitted || terminated || !examId) return;
    
    const saveTimer = setInterval(async () => {
      const payload = {
        examId: examId,
        answers: progressRef.current.answers,
        currentQuestionIndex: progressRef.current.currentQ,
        questionStates: progressRef.current.visited,
        remainingTimeSeconds: progressRef.current.secondsLeft
      };

      if (!navigator.onLine) {
        console.warn('Currently offline. Saving progress locally.');
        localStorage.setItem(`vision_offline_exam_${examId}`, btoa(encodeURIComponent(JSON.stringify(payload))));
        return;
      }

      try {
        await api.post('/api/exams/save-progress', payload);
        // ⭐ If successful, remove any offline backup
        localStorage.removeItem(`vision_offline_exam_${examId}`);
      } catch (err) {
        console.warn('Silent Auto-save failed, saving locally:', err.message);
        // ⭐ Fallback: save to localStorage if API fails despite being "online"
        localStorage.setItem(`vision_offline_exam_${examId}`, btoa(encodeURIComponent(JSON.stringify(payload))));
      }
    }, 30000); // 30 seconds

    return () => clearInterval(saveTimer);
  }, [examId, submitted, terminated]);

  const handleRunCode = async () => {
    if (!q || q.type !== 'coding') return;
    setIsExecuting(true);
    setExecutionResult(null);
    try {
      const answer = answers[q.originalIndex];
      const sourceCode = typeof answer === 'object' && answer !== null ? answer.code : (answer || q.initialCode || "");
      const result = await runCodingQuestion(examId, q.id || q._id, sourceCode, selectedLanguage);
      setExecutionResult(result);
    } catch (err) { 
      setExecutionResult({ error: 'Execution Failed', details: typeof err === 'string' ? err : (err.error || err.message || 'Unknown error') }); 
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

  const handleFinalSubmit = async () => {
    try {
      setSubmitted(true);
      await api.post('/api/exams/submit', {
        examId: examId || exam._id,
        answers: answers
      });
      // Clear offline backup on successful submission
      localStorage.removeItem(`vision_offline_exam_${examId}`);
      setTimeout(() => navigate('/student'), 2000);
    } catch (err) {
      console.error('Final Submit error:', err);
      setTimeout(() => navigate('/student'), 2000);
    }
  };

  // ⭐ FIX: Auto-Submit Exam when the timer runs out
  const hasAutoSubmitted = useRef(false);
  useEffect(() => {
    if (secondsLeft === 0 && !submitted && !terminated && !hasAutoSubmitted.current) {
      hasAutoSubmitted.current = true;
      logIncident('Time Expired', 'medium', 'Exam auto-submitted due to time limit.');
      handleFinalSubmit();
    }
  }, [secondsLeft, submitted, terminated, logIncident]);

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
            <div className="flex-1 overflow-hidden">
               <QuestionPalette 
                  questions={questions} currentQ={currentQ} answers={answers} visited={visited} markedForReview={markedForReview} 
                  navigateTo={(shuffledIndex) => { 
                    setCurrentQ(shuffledIndex); 
                    const originalIndex = questions[shuffledIndex]?.originalIndex;
                    if (originalIndex !== undefined) {
                      setVisited(v => ({ ...v, [originalIndex]: true })); 
                    }
                  }}
               />
            </div>

            {/* Help Button Area */}
            <div className="p-4 border-t border-gray-100 bg-white">
               <button 
                  onClick={handleRequestHelp}
                  disabled={helpLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-amber-100 transition-all active:scale-95 disabled:opacity-50"
               >
                  {helpLoading ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
                  Need Help?
               </button>
            </div>

            <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
               <span className="text-[8px] font-black text-emerald-600 tracking-wider">ENCRYPTED</span>
               <button onClick={() => setShowExitPrompt(true)} className="p-2 rounded-lg bg-red-500/10 text-red-500"><Power size={14} /></button>
            </div>
          </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex overflow-hidden bg-[#f8f9fa]">
          {/* Question Scroll Area */}
          <div className="flex-1 overflow-y-auto scroll-thin px-8 py-6">
            <div className="w-full">
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
                        {markedForReview[q?.originalIndex] && <span className="text-[9px] font-black text-violet-600 bg-violet-50 px-2 py-0.5 rounded border border-violet-100 uppercase tracking-widest">Review</span>}
                        {answers[q?.originalIndex] !== undefined && <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100 uppercase tracking-widest">Saved</span>}
                      </div>
                    </div>
                    
                    <div className="p-8 pt-10">
                      <h2 className="text-[18px] font-semibold text-gray-900 leading-snug">{q?.questionText}</h2>
                    </div>
                    <div className="h-px bg-gray-100 mx-8" />
                    
                    <div className="p-8">
                      {q?.type === 'mcq' && (
                        <div className="grid gap-3">
                          {q?.displayOptions?.map((opt, i) => {
                            const isSelected = answers[q.originalIndex] === opt.originalIndex;
                            return (
                              <button 
                                key={i} 
                                onClick={() => setAnswers(p => ({ ...p, [q.originalIndex]: opt.originalIndex }))} 
                                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${isSelected ? 'border-teal-600 bg-teal-50' : 'border-gray-100 hover:border-gray-200'}`}
                              >
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${isSelected ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-400'}`}>{String.fromCharCode(65 + i)}</span>
                                <span className={`text-[15px] flex-1 text-left ${isSelected ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>{opt.text}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {q?.type === 'coding' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Environment</span>
                              <select 
                                value={selectedLanguage} 
                                onChange={(e) => setSelectedLanguage(e.target.value)}
                                className="bg-white border border-gray-200 rounded-md px-2 py-1 text-[10px] font-bold text-gray-600 focus:outline-none focus:border-teal-400"
                              >
                                <option value="javascript">Node.js</option>
                                <option value="python">Python 3</option>
                                <option value="cpp">C++</option>
                                <option value="java">Java</option>
                              </select>
                            </div>
                            <button onClick={handleRunCode} disabled={isExecuting} className="px-4 py-1.5 bg-[#0f766e] hover:bg-[#0d9488] text-white text-[10px] font-bold rounded-lg flex items-center gap-2 transition-colors shadow-sm">
                              {isExecuting ? <RotateCcw size={12} className="animate-spin" /> : <Play size={12} />} RUN CODE
                            </button>
                          </div>
                          
                          <div 
                            className="border border-gray-200 rounded-xl overflow-hidden shadow-inner bg-white"
                            onPaste={(e) => {
                              e.preventDefault();
                              logIncident('Paste Blocked', 'high', 'Attempted to paste content into the code editor.');
                              return false;
                            }}
                            onCopy={(e) => e.preventDefault()}
                            onCut={(e) => e.preventDefault()}
                          >
                             <Editor 
                                key={`editor-${q.originalIndex}`}
                                height="400px" 
                                language={selectedLanguage === 'cpp' ? 'cpp' : selectedLanguage} 
                                theme="light"
                                defaultValue={typeof answers[q.originalIndex] === 'object' ? answers[q.originalIndex].code : (answers[q.originalIndex] ?? q.initialCode)}
                                onChange={(value) => setAnswers(p => ({ 
                                  ...p, 
                                  [q.originalIndex]: { code: value, language: selectedLanguage } 
                                }))}
                                options={{
                                  fontSize: 14,
                                  minimap: { enabled: false },
                                  scrollBeyondLastLine: false,
                                  automaticLayout: true,
                                  padding: { top: 20, bottom: 20 },
                                  contextmenu: false
                                }}
                            />
                          </div>

                          {executionResult && (
                            <div className={`rounded-xl border overflow-hidden ${executionResult.allPassed ? 'border-green-100 bg-green-50/30' : 'border-red-100 bg-red-50/10'} transition-all`}>
                              <div className={`px-4 py-2 border-b flex items-center justify-between ${executionResult.allPassed ? 'bg-green-100/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
                                <h4 className={`text-[11px] font-bold uppercase tracking-wider ${executionResult.allPassed ? 'text-green-700' : 'text-red-700'}`}>
                                  {executionResult.allPassed ? 'Execution Results: All Passed ✅' : 'Execution Results: Breakdown'}
                                </h4>
                                {executionResult.results && (
                                  <div className="text-[10px] font-mono text-zinc-500">
                                    Total Cases: {executionResult.results.length}
                                  </div>
                                )}
                              </div>
                              <div className="p-4 space-y-3">
                                {executionResult.results ? (
                                  executionResult.results.map((tc, index) => (
                                    <div key={index} className={`p-3 rounded-lg border flex flex-col gap-2 ${tc.passed ? 'bg-green-50/50 border-green-100/50' : 'bg-red-50/50 border-red-100/50'}`}>
                                      <div className="flex items-center justify-between">
                                          <span className={`text-[10px] font-bold uppercase ${tc.passed ? 'text-green-700' : 'text-red-700'}`}>
                                            Case {tc.testCaseId}: {tc.passed ? 'Passed ✅' : 'Failed ❌'}
                                          </span>
                                          {tc.time && <span className="text-[9px] font-mono text-gray-500">{tc.time}s | {tc.memory} KB</span>}
                                      </div>
                                      {!tc.passed && tc.actualOutput && (
                                        <div className="bg-white/50 p-2 rounded border border-red-100/50">
                                          <p className="text-[9px] font-bold text-red-400 uppercase mb-1">Actual Output</p>
                                          <pre className="text-[11px] font-mono text-red-600 whitespace-pre-wrap">{tc.actualOutput}</pre>
                                        </div>
                                      )}
                                      {!tc.passed && tc.error && (
                                        <div className="bg-red-900/5 p-2 rounded border border-red-100/50">
                                          <p className="text-[9px] font-bold text-red-400 uppercase mb-1">Engine Error</p>
                                          <pre className="text-[11px] font-mono text-red-800 whitespace-pre-wrap">{tc.error}</pre>
                                        </div>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <div className="flex flex-col gap-1">
                                    <pre className="text-[11px] font-mono text-red-400 whitespace-pre-wrap font-bold">{executionResult.error}</pre>
                                    <pre className="text-[11px] font-mono text-red-400 whitespace-pre-wrap">{executionResult.details}</pre>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {q?.type === 'short' && (
                        <textarea
                          value={answers[q.originalIndex] || ''}
                          onChange={(e) => setAnswers(p => ({ ...p, [q.originalIndex]: e.target.value }))}
                          placeholder="Type your response here..."
                          className="w-full h-64 bg-slate-50 border border-gray-100 rounded-lg p-6 text-gray-800 text-[15px] focus:outline-none focus:border-teal-200 transition-all resize-none"
                        />
                      )}
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between">
                    <div className="flex gap-3">
                      <button onClick={() => {
                        const prevQIndex = Math.max(0, currentQ - 1);
                        setCurrentQ(prevQIndex);
                        const originalIndex = questions[prevQIndex]?.originalIndex;
                        if (originalIndex !== undefined) setVisited(v => ({ ...v, [originalIndex]: true }));
                      }} disabled={currentQ === 0} className="px-6 py-2.5 rounded-xl text-[12px] font-bold text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 flex items-center gap-2 disabled:opacity-30"><ChevronLeft size={16} /> Previous</button>                      
                      <button onClick={() => {
                        const originalIndex = questions[currentQ]?.originalIndex;
                        if (originalIndex !== undefined) setMarkedForReview(p => ({ ...p, [originalIndex]: !p[originalIndex] }));
                      }} className={`px-6 py-2.5 rounded-xl text-[12px] font-bold border transition-all ${markedForReview[q?.originalIndex] ? 'bg-violet-600 text-white' : 'bg-white text-gray-600'}`}>Review Later</button>
                    </div>
                    {currentQ < questions.length - 1 ? (                      
                      <button onClick={() => { 
                        const nextQIndex = currentQ + 1;
                        setCurrentQ(nextQIndex); 
                        const originalIndex = questions[nextQIndex]?.originalIndex;
                        if (originalIndex !== undefined) setVisited(v => ({ ...v, [originalIndex]: true })); 
                      }} className="bg-[#0f766e] text-white px-8 py-2.5 rounded-xl text-[12px] font-bold flex items-center gap-2">Save & Next <ChevronRight size={16} /></button>
                    ) : (
                      <div className="text-[11px] font-bold text-gray-400 py-2.5">End of Assessment</div>
                    )}
                  </div>

                  {/* ── Bottom Info Panel ── */}
                  <div className="mt-6 sticky bottom-0 z-10 bg-white rounded-xl border border-gray-200 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] overflow-hidden">
                    {/* Progress bar */}
                    <div className="h-1 bg-gray-100">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-teal-600 transition-all duration-700"
                        style={{ width: `${(answeredCount / Math.max(questions.length, 1)) * 100}%` }}
                      />
                    </div>

                    <div className="px-6 py-4 flex items-center justify-between gap-6 flex-wrap">
                      {/* Stats pills */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#15803d]" />
                          <span className="text-[11px] font-bold text-gray-500">
                            <span className="text-gray-900">{answeredCount}</span> Answered
                          </span>
                        </div>
                        <div className="w-px h-3 bg-gray-200" />
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-300" />
                          <span className="text-[11px] font-bold text-gray-500">
                            <span className="text-gray-900">{questions.length - answeredCount}</span> Remaining
                          </span>
                        </div>
                        <div className="w-px h-3 bg-gray-200" />
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#7c3aed]" />
                          <span className="text-[11px] font-bold text-gray-500">
                            <span className="text-gray-900">{Object.values(markedForReview).filter(Boolean).length}</span> Marked
                          </span>
                        </div>
                      </div>

                      {/* Marks badge */}
                      {q?.marks && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 border border-teal-100 rounded-lg">
                          <CheckCircle size={12} className="text-teal-600" />
                          <span className="text-[11px] font-bold text-teal-700">+{q.marks} marks for correct answer</span>
                        </div>
                      )}

                      {/* Final Action */}
                      <button onClick={() => setShowConfirm(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl text-[12px] font-bold flex items-center gap-2 shadow-lg transition-colors ml-auto">
                        Complete Assessment <Send size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* ── Proctoring Right Panel ── */}
          <aside className="w-[200px] shrink-0 bg-white border-l border-gray-100 flex flex-col items-center pt-6 px-4 gap-5 overflow-y-auto scroll-thin">
            {/* Camera Feed */}
            <div className="w-full">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.18em] mb-3 text-center">Live Feed</p>
              <div className="bg-white/80 backdrop-blur-md p-2 rounded-2xl border border-gray-100 shadow-md">
                <ProctoringSidebar cameraActive={cameraActive} videoRef={videoRef} faceActive={faceBoxes.length > 0} />
              </div>
            </div>

            {/* Integrity Score */}
            <div className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2">Integrity</p>
              <div className="relative w-14 h-14 mx-auto mb-2">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#0d9488" strokeWidth="3"
                    strokeDasharray={`${confidence} ${100 - confidence}`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[13px] font-black text-gray-800">{confidence}%</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide">Verified</span>
              </div>
            </div>

            {/* Proctoring Status */}
            <div className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] mb-3">Status</p>
              <div className="flex flex-col gap-2.5">
                {[
                  { label: 'Camera', ok: cameraActive },
                  { label: 'Network', ok: true },
                  { label: 'Audio', ok: true },
                  { label: 'Face ID', ok: faceBoxes.length > 0 },
                ].map(({ label, ok }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-gray-500">{label}</span>
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wide ${
                      ok ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                    }`}>
                      <div className={`w-1 h-1 rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
                      {ok ? 'OK' : 'Off'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </main>
      </div>

      <SubmitModal isOpen={showConfirm} onClose={() => setShowConfirm(false)} stats={{ answered: answeredCount, unanswered: questions.length - answeredCount, marked: Object.values(markedForReview).filter(Boolean).length }} onConfirm={handleFinalSubmit} />
      <ExitModal isOpen={showExitPrompt} onClose={() => { setShowExitPrompt(false); setExitError(''); setExitPassword(''); }} password={exitPassword} setPassword={e => { setExitPassword(e); setExitError(''); }} error={exitError} onExit={() => { if (exitPassword === '12345') { handleFinalSubmit(); } else { setExitError('Incorrect Pass'); setExitPassword(''); } }} />
      <TabToast toast={tabToast} />

      {/* Broadcast Alert Overlay */}
      <AnimatePresence>
        {broadcastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -50 }} 
            className="fixed top-16 left-1/2 -translate-x-1/2 z-[250] pointer-events-none"
          >
            <div className="bg-blue-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-start gap-4 max-w-xl">
              <div className="bg-white/20 p-2 rounded-xl shrink-0 mt-0.5">
                <Radio size={20} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1">Live Announcement</h3>
                <p className="text-sm font-medium leading-snug">{broadcastMessage}</p>
              </div>
              <button 
                onClick={() => setBroadcastMessage(null)}
                className="pointer-events-auto ml-2 p-1 hover:bg-white/10 rounded-lg transition-colors text-blue-200 hover:text-white"
              >
                <XCircle size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Overlay */}
      {!isFullscreen && !submitted && !terminated && (
        <div className="fixed inset-0 z-[200] bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-zinc-900 border border-red-500/30 p-8 rounded-3xl text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShieldAlert size={32} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Fullscreen Required</h2>
            <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
              Exiting fullscreen is a violation. Please return to fullscreen immediately to continue the exam. 
              Multiple violations will result in automatic termination.
            </p>
            <button 
              onClick={() => document.documentElement.requestFullscreen()}
              className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-red-900/20 active:scale-95"
            >
              Back to Fullscreen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 🎲 SEEDED RANDOMIZER HOOK (LCG)
 * Seeded by a unique string (examId + studentId) so the student
 * always gets the same sequence even on page refresh.
 */
function generateSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  let seed = Math.abs(hash) || 1;
  return function() {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

/**
 * 🔀 SEEDED FISHER-YATES SHUFFLE
 * Standard shuffle algorithm but uses our seeded randomFunc
 * to ensure consistency.
 */
function seededShuffle(array, randomFunc) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(randomFunc() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
