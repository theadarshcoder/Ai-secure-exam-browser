import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import socketService from '../services/socket';
import api, { runCodingQuestion, requestHelp } from '../services/api';
import Editor from '@monaco-editor/react';
import {
  Camera, CameraOff, Clock, Shield, CheckCircle, CheckCircle2,
  ChevronRight, ChevronLeft, ChevronDown, Send, XCircle,
  Bookmark, Terminal, Eye, Fingerprint, AlertCircle, Power,
  Loader2, RotateCcw, Play, Monitor, ScanFace, ShieldAlert,
  MessageSquare, Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTabVisibility, TabToast } from '../components/TabVisibility';
import * as faceapi from '@vladmandic/face-api';
import VisionLogo from '../components/VisionLogo';
import storageService from '../services/storageService';

/* ────────────────────────────────────────────── Config ────────────────────────────────────────────── */

const TOTAL_SECONDS = 45 * 60;

/* ────────────────────────────────────────── Sub-components ────────────────────────────────────────── */

const QuestionPalette = React.memo(({ questions, currentQ, answers, visited, markedForReview, navigateTo }) => {
  const answered = Object.keys(answers).length;
  
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

  const getQState = (shuffledIndex) => {
    const q = questions[shuffledIndex];
    if (!q) return 'unseen';
    const qId = q.originalId || q._id;
    if (shuffledIndex === currentQ) return 'current';
    if (markedForReview[qId] && answers[qId] !== undefined) return 'marked-answered';
    if (markedForReview[qId]) return 'marked';
    if (answers[qId] !== undefined) return 'answered';
    if (visited[qId]) return 'visited';
    return 'unseen';
  };

  const stateStyles = {
    'current':         'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-200 ring-offset-2 scale-110 z-10 font-black',
    'answered':        'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold',
    'marked':          'bg-amber-50 text-amber-700 border-amber-200 font-bold',
    'marked-answered': 'bg-amber-50 text-amber-700 border-amber-200 font-bold ring-2 ring-indigo-500 ring-offset-1',
    'visited':         'bg-slate-50 text-slate-600 border-slate-200 font-bold',
    'unseen':          'bg-white text-slate-400 border-slate-100 hover:border-slate-300',
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
              {markedForReview[questions[i]?.originalId || questions[i]?._id] && getQState(i) !== 'current' && (
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

const ProctoringSidebar = React.memo(({ cameraActive, videoRef, faceActive, confidence }) => (
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
    
    <div className="flex flex-col items-center gap-2">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Candidate Health</p>
      <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-inner">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100"><Shield size={16} /></div>
            <span className="text-[13px] font-black text-slate-900 tabular-nums">{confidence}%</span>
          </div>
          <div className="relative w-10 h-10">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="16" fill="none" stroke="#e2e8f0" strokeWidth="3" />
              <circle cx="18" cy="18" r="16" fill="none" stroke="#6366f1" strokeWidth="3"
                strokeDasharray={`${confidence} ${100 - confidence}`} strokeLinecap="round" />
            </svg>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[{ label: 'Eye', status: faceActive }, { label: 'Device', status: true }, { label: 'Audio', status: true }, { label: 'Env', status: true }].map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${item.status ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const SubmitModal = React.memo(({ isOpen, onClose, onConfirm, stats }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.95, y: 10, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/20">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 mb-6 flex items-center justify-center shadow-sm"><Send size={28} /></div>
          <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Hand In Assessment?</h2>
          <p className="text-[13px] font-medium text-slate-500 mb-8 leading-relaxed">You are about to submit your response. This action is final and your work will be graded as currently saved.</p>
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-8 grid grid-cols-3 gap-4 text-center">
            <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Answered</p><p className="text-xl font-black text-slate-900 tabular-nums">{stats.answered}</p></div>
            <div className="border-l border-slate-200"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Marked</p><p className="text-xl font-black text-slate-900 tabular-nums">{stats.marked}</p></div>
            <div className="border-l border-slate-200"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</p><p className="text-xl font-black text-slate-900 tabular-nums">{stats.total}</p></div>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all text-[12px] font-black uppercase tracking-widest">Wait, I'll Review</button>
            <button onClick={onConfirm} className="flex-1 py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all text-[12px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">Confirm & Submit</button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const ExitModal = React.memo(({ isOpen, onClose, onExit, password, setPassword, error }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.95, y: 10, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-white/20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 text-red-600 mb-6 mx-auto flex items-center justify-center shadow-sm"><ShieldAlert size={28} /></div>
          <h2 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Security Override</h2>
          <p className="text-[12px] font-medium text-zinc-500 mb-8 mx-auto max-w-[240px]">Enter supervisor credentials to force terminate this session.</p>
          <div className="relative mb-6">
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Supervisor Password" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-center text-slate-900 font-mono text-[14px] tracking-[0.4em] focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10 transition-all" />
            {error && <div className="absolute top-full left-0 right-0 mt-2"><span className="text-[10px] font-black text-red-600 uppercase tracking-widest">{error}</span></div>}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all text-[12px] font-black uppercase tracking-widest">Cancel</button>
            <button onClick={onExit} className="flex-1 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all text-[12px] font-black uppercase tracking-widest shadow-lg shadow-red-100">Terminate</button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const ObjectivePanel = React.memo(({ question, index, markedForReview }) => (
  <div className="w-[42%] shrink-0 flex flex-col min-h-0 bg-white border-r border-slate-200">
    <div className="bg-slate-50 border-b border-slate-100 px-6 py-3.5 flex items-center justify-between shrink-0">
      <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Objective</span>
      {markedForReview[question?.originalId || question?._id] && <div className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md border border-amber-100"><Bookmark size={10} className="fill-amber-600" /><span className="text-[9px] font-black uppercase tracking-wider">Flagged</span></div>}
    </div>
    <div className="flex-1 overflow-y-auto p-8 scroll-thin font-medium">
      <div className="flex items-center gap-3 mb-6">
        <div className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">Q{index + 1}</div>
        <div className="px-2.5 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest">{question?.marks || 10} Marks</div>
      </div>
      <h2 className="text-xl font-black text-slate-900 leading-snug tracking-tight mb-6">{question?.questionText}</h2>
      <div className="prose prose-slate prose-sm text-slate-500 leading-relaxed space-y-4">
        <p>Implement the solution according to constraints. Standard input/output is supported.</p>
        <ul className="list-disc pl-5 text-[12px] font-semibold space-y-1">
          <li>Ensure code is optimized.</li>
          <li>Handle edge cases (empty input, null, etc).</li>
        </ul>
      </div>
    </div>
  </div>
));

const CodingEnvironment = React.memo(({ 
  question, 
  answer, 
  onCodeChange, 
  selectedLanguage, 
  setSelectedLanguage, 
  isLangDropdownOpen, 
  setIsLangDropdownOpen,
  editorHeight,
  setEditorHeight,
  isExecuting,
  executionResult,
  activeTab,
  setActiveTab,
  onMouseDown
}) => (
  <div id="coding-right-panel" className="flex-1 flex flex-col min-h-0 relative bg-slate-50">
    <div className="absolute inset-0 flex flex-col">
      <div style={{ height: `${editorHeight}%` }} className="flex flex-col shrink-0 min-h-0 bg-white">
        <div className="flex items-center justify-between px-4 h-10 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2 text-slate-400"><Terminal size={14} /><span className="text-[11px] font-black uppercase tracking-widest">Environment</span></div>
          <div className="relative">
            <button onClick={() => setIsLangDropdownOpen(p => !p)} className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2.5 h-[26px] hover:bg-slate-50 transition-all text-[11px] font-black uppercase tracking-widest text-slate-600 shadow-sm">{selectedLanguage}<ChevronDown size={12} /></button>
            {isLangDropdownOpen && (
              <div className="absolute top-full right-0 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                {['javascript', 'python', 'cpp', 'java'].map(l => (
                  <button key={l} onClick={() => { setSelectedLanguage(l); setIsLangDropdownOpen(false); }} className={`w-full text-left px-3 py-1.5 text-[11px] font-black uppercase tracking-wider transition-colors ${selectedLanguage === l ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}>{l}</button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 shadow-inner">
          <Editor 
             key={`editor-${question?.originalId || question?._id}`}
             height="100%" 
             language={selectedLanguage === 'cpp' ? 'cpp' : selectedLanguage} 
             theme="light" 
             value={typeof answer === 'object' ? answer.code : (answer ?? question?.initialCode)} 
             onChange={onCodeChange} 
             options={{ fontSize: 13, minimap: { enabled: false }, automaticLayout: true, padding: { top: 16 } }} 
          />
        </div>
      </div>
      <div className="h-1 bg-slate-200 hover:bg-indigo-300 cursor-row-resize z-10 transition-all flex items-center justify-center group" onMouseDown={onMouseDown}><div className="w-12 h-1 bg-slate-300 group-hover:bg-indigo-500 rounded-full transition-colors" /></div>
      <div className="flex-1 flex flex-col min-h-0 bg-white">
        <div className="flex items-center px-4 border-b border-slate-200 shrink-0 h-10 bg-white z-10">
          <button onClick={() => setActiveTab('Test Cases')} className={`h-full px-4 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'Test Cases' ? 'text-indigo-600 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>Test Cases</button>
          <button onClick={() => setActiveTab('Execution Details')} className={`h-full px-4 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'Execution Details' ? 'text-indigo-600 border-indigo-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>Output Log</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 scroll-thin bg-slate-50/40">
          {isExecuting ? <div className="h-full flex flex-col items-center justify-center gap-3 text-indigo-500"><RotateCcw size={24} className="animate-spin" /><span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Processing Execution...</span></div> : executionResult ? (
            <div className="space-y-4">
              {activeTab === 'Test Cases' ? (
                  <div className="grid grid-cols-1 gap-4">
                      {executionResult.results ? executionResult.results.map((res, i) => (
                          <div key={i} className={`bg-white border rounded-2xl border-slate-200 overflow-hidden`}>
                              <div className={`px-4 py-2.5 border-b flex items-center justify-between ${res.passed ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                  <span className="text-[10px] font-black uppercase tracking-widest">Case {i + 1}</span>
                                  <span className="text-[9px] font-black uppercase">{res.passed ? 'PASSED ✅' : 'FAILED ❌'}</span>
                              </div>
                              <div className="p-4 grid grid-cols-3 gap-4">
                                  <div><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Actual</p><pre className="text-[10px] font-mono bg-slate-50 p-2 rounded border border-slate-100 overflow-x-auto">{res.actualOutput || 'N/A'}</pre></div>
                                  <div className="col-span-2"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Error/Detail</p><pre className="text-[10px] font-mono text-red-500">{res.error || 'None'}</pre></div>
                              </div>
                          </div>
                      )) : <pre className="text-red-500 font-mono text-xs">{executionResult.error}: {executionResult.details}</pre>}
                  </div>
              ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                      <pre className="text-[13px] font-mono leading-relaxed text-emerald-400/90 whitespace-pre-wrap">{executionResult.stdout || executionResult.details || 'No output.'}</pre>
                  </div>
              )}
            </div>
          ) : <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4"><Play size={48} className="opacity-20 translate-x-1" /><span className="text-[10px] font-black uppercase tracking-widest">Awaiting Code Execution</span></div>}
        </div>
      </div>
    </div>
  </div>
));

const ExamTimer = React.memo(({ seconds, isCritical }) => {
  const fmtTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  return (
    <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full ${isCritical ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-700 border-slate-200'} border`}>
      <Clock size={14} className={isCritical ? 'animate-pulse' : ''} />
      <span className="text-base font-bold tabular-nums">{fmtTime(seconds)}</span>
    </div>
  );
});

/* ────────────────────────────────────────── Main Component ────────────────────────────────────────── */

export default function ExamCockpit() {
  const navigate = useNavigate();
  const { examId } = useParams();
  const videoRef = useRef(null);
  const tabToast = useTabVisibility();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]); // Will store shuffled list
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [endTime, setEndTime] = useState(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [stream, setStream] = useState(null);
  const [currentQ, setCurrentQ] = useState(0); // Shuffled array index
  const [answers, setAnswers] = useState({}); // Keyed by ORIGINAL question index/ID
  const [markedForReview, setMarkedForReview] = useState({}); // Keyed by ORIGINAL index
  const [visited, setVisited] = useState({}); // Keyed by ORIGINAL index
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
  const [needsInteraction, setNeedsInteraction] = useState(!document.fullscreenElement);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [confidence] = useState(98);
  const [broadcastMessage, setBroadcastMessage] = useState(null);
  const [helpLoading, setHelpLoading] = useState(false);
  
  // Layout state
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Test Cases');
  const [editorHeight, setEditorHeight] = useState(55);
  const [toasts, setToasts] = useState([]);
  const isResizing = useRef(false);

  const isTimeCritical = secondsLeft < 300 && secondsLeft > 0;

  const addToast = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  // 🛡️ Global Session Guard
  useEffect(() => {
    const token = sessionStorage.getItem('vision_token');
    const email = sessionStorage.getItem('vision_email');
    if (!token || !email) {
      console.warn("Session lost. Redirecting to login.");
      navigate('/login');
    }
  }, [navigate]);

  // 📡 Socket Connection & Broadcast Listener
  useEffect(() => {
    socketService.connect();
    socketService.onBroadcast((data) => {
      if (!data.examId || data.examId === examId) {
        setBroadcastMessage(data.message);
        setTimeout(() => setBroadcastMessage(null), 15000);
      }
    });
    return () => socketService.disconnect();
  }, [examId, socketService]);

  const logIncident = useCallback(async (type, severity, details) => {
    const studentId = sessionStorage.getItem('vision_email');
    if (!studentId) return; // Guarded by useEffect above
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

  const handleRequestHelp = async () => {
    try {
      setHelpLoading(true);
      await requestHelp("Student needs manual intervention or has a query.");
      addToast("Support request sent to Mentors.", 'success');
    } catch (err) {
      addToast("Failed to send help request.", 'error');
    } finally {
      setHelpLoading(false);
    }
  };

  // 🔒 Security: Fullscreen & Shortcuts
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull) setNeedsInteraction(true);
    };

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
    
    // Auto-check initially (though it will stay blocked, the overlay handles the reset)
    if (!document.fullscreenElement) {
        setNeedsInteraction(true);
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', blockShortcuts);
      document.removeEventListener('contextmenu', blockContextMenu);
    };
  }, [logIncident]);

  // 🧱 Global Styles/UI Reset
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

  // 📡 Poll for Supervisor Termination
  useEffect(() => {
    if (submitted || terminated) return;
    const studentId = sessionStorage.getItem('vision_email');
    if (!studentId) return;

    const poll = setInterval(() => {
      try {
        const list = JSON.parse(localStorage.getItem('vision_terminated_sessions') || '[]');
        const hit = list.find(t => t.studentId === studentId || t.examId === examId);
        if (hit) setTerminated(hit);
      } catch (err) { console.warn('Termination poll failed'); }
    }, 3000);
    return () => clearInterval(poll);
  }, [submitted, terminated, examId]);

  // ⏲️ Termination Countdown Effect
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

  // ⏲️ Code Execution Cooldown Timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // ⏱️ Exam Timer (Robust Absolute Sync)
  useEffect(() => {
    if (submitted || terminated || !endTime) return;
    
    const interval = setInterval(() => {
      const remainingTotalMs = endTime - Date.now();
      const s = Math.floor(remainingTotalMs / 1000);
      
      if (s <= 0) {
        clearInterval(interval);
        setSecondsLeft(0);
        handleFinalSubmit();
      } else {
        setSecondsLeft(s);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [submitted, terminated, endTime]);

  // 🛡️ Advanced Security: DevTools Trap & Keyboard Lock
  useEffect(() => {
    // 🪤 Trap 1: Debugger loop (Freezes browser if DevTools is open)
    const trap = setInterval(() => {
      (function() {
        (function a() {
          try {
            (function b(i) {
              if (('' + (i / i)).length !== 1 || i % 20 === 0) {
                (function() {}).constructor('debugger')();
              } else {
                debugger;
              }
              b(++i);
            }(0));
          } catch (e) {}
        }());
      }());
    }, 500);

    // 🔒 Trap 2: Event Blocking
    const handleKeydown = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S
      if (
        e.keyCode === 123 || // F12
        (cmdOrCtrl && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) || // I/J
        (cmdOrCtrl && e.keyCode === 85) || // U (View Source)
        (cmdOrCtrl && e.keyCode === 83) || // S (Save Page)
        (cmdOrCtrl && (e.keyCode === 67 || e.keyCode === 86 || e.keyCode === 88)) // C, V, X (Copy, Paste, Cut)
      ) {
        e.preventDefault();
        addToast("Action Blocked: Security Policy Enforcement", "error");
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      addToast("Right-click is restricted during the session", "warning");
    };

    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      clearInterval(trap);
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [addToast]);

  // 📂 Fetch Exam + Seeded Shuffle + Resume Data
  useEffect(() => {
    const fetchExam = async () => {
      try {
        // Fetch session resume data
        const response = await api.get(`/api/exams/resume/${examId}`);
        if (response.data.isCompleted) {
          setSubmitted(true);
          return;
        }

        const data = response.data.exam;
        const sessionProgress = response.data;
        setExam(data);

        if (data.questions && data.questions.length > 0) {
          // 🎲 Seeded Randomization Logic
          // Use sessionId to ensure the seed is strictly tied to the backend session
          // and cannot be spoofed via client-side sessionStorage.
          const mainSeedStr = (examId + sessionProgress.sessionId);
          
          // Helper for localized shuffling (independent of other questions)
          const getRNG = (salt) => generateSeed(mainSeedStr + salt);

          // Map original indices before shuffling so state remains consistent
          const processedQuestions = data.questions.map((q, qIndex) => {
            const questionId = q.id || q._id;
            const processedQ = { ...q, originalId: questionId }; // Use ID instead of index
            
            if (processedQ.type === 'mcq' && processedQ.options) {
              const optionsWithIndex = processedQ.options.map((optText, optIndex) => ({
                text: optText,
                originalIndex: optIndex
              }));
              // Use a derivative seed for matching options so it's stable
              processedQ.displayOptions = seededShuffle(optionsWithIndex, getRNG(questionId));
            }
            return processedQ;
          });

          // Shuffle the main question list using the base seed
          const finalShuffledQuestions = seededShuffle(processedQuestions, getRNG('main_questions'));
          setQuestions(finalShuffledQuestions);

          // Restore Progress
          let restoredTime = sessionProgress.remainingTimeSeconds ?? (data.duration * 60);
          let rawAnswers = sessionProgress.answers || {};
          let startIdx = sessionProgress.currentQuestionIndex || 0;
          let rawVisited = sessionProgress.questionStates || {};

          // Offline Recovery Check (IndexedDB)
          try {
            const parsed = await storageService.getProgress(examId);
            if (parsed && parsed.remainingTimeSeconds < restoredTime) {
              restoredTime = parsed.remainingTimeSeconds;
              rawAnswers = parsed.answers || {};
              startIdx = parsed.currentQuestionIndex || 0;
              rawVisited = parsed.questionStates || {};
              api.post('/api/exams/save-progress', parsed).catch(() => {});
            }
          } catch (err) {
            console.warn('IndexedDB recovery failed, using server state');
          }

          // 🌉 BRIDGE: Support legacy index-based answers by mapping them to IDs
          const restoredAnswers = {};
          const restoredVisited = {};
          
          Object.entries(rawAnswers).forEach(([key, val]) => {
            // If key is a small number string (index), find the Q at that index
            if (!isNaN(key) && Number(key) < data.questions.length) {
              const qForIndex = data.questions[Number(key)];
              if (qForIndex) restoredAnswers[qForIndex.id || qForIndex._id] = val;
            } else {
              restoredAnswers[key] = val; // Already an ID
            }
          });

          Object.entries(rawVisited).forEach(([key, val]) => {
            if (val !== true && val !== 'answered' && val !== 'visited') return;
            if (!isNaN(key) && Number(key) < data.questions.length) {
              const qForIndex = data.questions[Number(key)];
              if (qForIndex) restoredVisited[qForIndex.id || qForIndex._id] = true;
            } else {
              restoredVisited[key] = true;
            }
          });

          setSecondsLeft(restoredTime);
          setEndTime(Date.now() + restoredTime * 1000);
          setAnswers(restoredAnswers);
          setCurrentQ(startIdx);
          
          // Ensure at least the current question is marked as visited
          const currentId = finalShuffledQuestions[startIdx]?.originalId;
          if (currentId) restoredVisited[currentId] = true;
          setVisited(restoredVisited);
          
          if (finalShuffledQuestions[startIdx]?.type === 'coding') {
            setSelectedLanguage(finalShuffledQuestions[startIdx].language || 'javascript');
          }
        }
      } catch (err) {
        console.warn('Backend unavailable, using fallback mock.');
      }
    };
    fetchExam();
  }, [examId]);

  // 📷 Camera & AI Setup
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

   // 💾 Refs & Lifecycle Monitors
  const isMounted = useRef(true);
  const progressRef = useRef({ answers, currentQ, visited, secondsLeft });

  // Handle unmount for async guards
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Sync progressRef with state for auto-save loop
  useEffect(() => { 
    progressRef.current = { answers, currentQ, visited, secondsLeft }; 
  }, [answers, currentQ, visited, secondsLeft]);

  // 🤖 Face Detection Loop
  useEffect(() => {
    if (!modelsLoaded || !cameraActive || submitted) return;
    let timerId;
    const runDetection = async () => {
      if (videoRef.current?.readyState === 4) {
        const dets = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 160 }));
        
        // 🛡️ Mount Guard: Prevents memory leak warning if component unmounted during 'await'
        if (!isMounted.current) return;
        
        setFaceBoxes(dets.map(d => d.box));
      }
      timerId = setTimeout(runDetection, 1000); 
    };
    runDetection();
    return () => {
        clearTimeout(timerId);
    };
  }, [modelsLoaded, cameraActive, submitted]);
  
  useEffect(() => {
    if (submitted || terminated || !examId) return;
    const saveTimer = setInterval(async () => {
      const payload = {
        examId,
        answers: progressRef.current.answers,
        currentQuestionIndex: progressRef.current.currentQ,
        questionStates: progressRef.current.visited,
        remainingTimeSeconds: progressRef.current.secondsLeft
      };
      if (!navigator.onLine) {
        await storageService.saveProgress(examId, payload);
        return;
      }
      try {
        await api.post('/api/exams/save-progress', payload);
        await storageService.deleteProgress(examId); // Clear local copy once synced
      } catch (err) {
        await storageService.saveProgress(examId, payload);
      }
    }, 30000);
    return () => clearInterval(saveTimer);
  }, [examId, submitted, terminated]);

  // ⚙️ Code Execution Handlers
  const handleRunCode = async () => {
    const q = questions[currentQ];
    if (q?.type !== 'coding' || cooldownSeconds > 0) return;
    setIsExecuting(true); setExecutionResult(null); setActiveTab('Execution Details');
    try {
      const qId = q.originalId || q._id;
      const answer = answers[qId];
      const sourceCode = typeof answer === 'object' && answer !== null ? answer.code : (answer || q.initialCode || "");
      const res = await runCodingQuestion(examId, q.id || q._id, sourceCode, selectedLanguage, false);
      setExecutionResult(res);
      setCooldownSeconds(10); // Start 10s cooldown
    } catch (err) { 
        setExecutionResult({ error: 'Failed', details: err.message }); 
        if (err.error === 'Cooldown Active') setCooldownSeconds(10);
    }
    finally { setIsExecuting(false); }
  };

  const handleCheckTestCases = async () => {
    const q = questions[currentQ];
    if (q?.type !== 'coding' || cooldownSeconds > 0) return;
    setIsExecuting(true); setExecutionResult(null); setActiveTab('Test Cases');
    try {
      const qId = q.originalId || q._id;
      const answer = answers[qId];
      const sourceCode = typeof answer === 'object' && answer !== null ? answer.code : (answer || q.initialCode || "");
      const res = await runCodingQuestion(examId, q.id || q._id, sourceCode, selectedLanguage, true);
      setExecutionResult(res);
      setCooldownSeconds(10); // Start 10s cooldown
    } catch (err) { 
        setExecutionResult({ error: 'Failed', details: err.message }); 
        if (err.error === 'Cooldown Active') setCooldownSeconds(10);
    }
    finally { setIsExecuting(false); }
  };

  const handleFinalSubmit = async () => {
    try {
      setSubmitted(true);
      await api.post('/api/exams/submit', { examId, answers });
      await storageService.deleteProgress(examId);
      setTimeout(() => navigate('/student'), 2000);
    } catch (err) { setTimeout(() => navigate('/student'), 2000); }
  };

  const handleSecureEntry = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      setNeedsInteraction(false);
      setIsFullscreen(true);
    } catch (err) {
      console.error("Fullscreen initiation failed:", err);
      // Even if it fails, we let them try, but usually it works on click
    }
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
    <div className="h-screen w-full bg-slate-50 flex flex-col overflow-hidden select-none font-sans text-slate-900 relative">
      <AnimatePresence>
        {needsInteraction && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[200] bg-slate-900 flex flex-col items-center justify-center p-6 text-center"
          >
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-transparent to-emerald-500/10" />
             <div className="relative z-10 max-w-md">
                <div className="w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center shadow-2xl mb-10 mx-auto animate-bounce">
                  <Shield size={40} className="text-white" />
                </div>
                <h1 className="text-4xl font-black text-white tracking-tighter mb-4 uppercase italic">Secure Environment</h1>
                <p className="text-slate-400 text-sm mb-12 leading-relaxed">
                  To maintain integrity, this assessment requires a locked environment. Please re-enter the secure perimeter to continue.
                </p>
                <button 
                  onClick={handleSecureEntry}
                  className="w-full h-14 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  <Lock size={18} /> Initialize Secure Entry
                </button>
                <p className="mt-8 text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center justify-center gap-2">
                   <Monitor size={12} /> Encrypted Session • Biometric Link Enabled
                </p>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`.scroll-thin::-webkit-scrollbar { width: 4px; } .scroll-thin::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }`}</style>
      
      <header className="shrink-0 bg-white border-b border-slate-200 shadow-sm px-5 h-[48px] flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100"><VisionLogo className="w-5 h-5 text-white" /></div>
          <span className="text-[13px] font-black tracking-widest">VISION</span>
          <div className="h-4 w-px bg-slate-200" />
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest max-w-[200px] truncate">{exam?.title || 'Exam'}</span>
        </div>
        <div className="flex items-center gap-6">
          <ExamTimer seconds={secondsLeft} isCritical={isTimeCritical} />
          <div className="flex items-center gap-3 pl-4 border-l border-slate-100 text-right">
            <div>
              <p className="text-[11px] font-bold leading-none">{sessionStorage.getItem('vision_name') || 'Candidate'}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{sessionStorage.getItem('vision_email') || 'VSN-USER'}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600 shadow-sm">
              {(sessionStorage.getItem('vision_name') || 'C').charAt(0)}
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-50"><div className="h-full bg-indigo-600 transition-all duration-700" style={{ width: `${(answeredCount/Math.max(questions.length, 1))*100}%` }} /></div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[240px] shrink-0 bg-white border-r border-slate-200 flex flex-col shadow-sm">
          <QuestionPalette 
             questions={questions} currentQ={currentQ} answers={answers} visited={visited} markedForReview={markedForReview} 
             navigateTo={useCallback((i) => { 
                setCurrentQ(i); 
                const qId = questions[i]?.originalId || questions[i]?._id;
                if (qId) setVisited(v => ({ ...v, [qId]: true })); 
             }, [questions])} 
          />

          <div className="px-5 py-2 border-t border-slate-100 flex-shrink-0">
             <ProctoringSidebar cameraActive={cameraActive} videoRef={videoRef} faceActive={faceBoxes.length > 0} confidence={confidence} />
          </div>

          <div className="p-4 border-t border-slate-100 mt-auto">
             <button onClick={handleRequestHelp} disabled={helpLoading} className="w-full h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all active:scale-95 disabled:opacity-50">
                {helpLoading ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />} Need Help?
             </button>
          </div>

          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5"><div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" /> Encrypted Session</span>
            <button onClick={() => setShowExitPrompt(true)} className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors border border-red-100 shadow-sm active:scale-95"><Power size={14} /></button>
          </div>
        </aside>

        <main className="flex-1 flex overflow-hidden bg-slate-50">
          <div className="flex-1 flex flex-col min-w-0">
            {q?.type === 'coding' ? (
              <div className="flex-1 flex min-h-0 overflow-hidden">
                <ObjectivePanel question={q} index={currentQ} markedForReview={markedForReview} />
                <CodingEnvironment 
                  question={q}
                  answer={answers[q?.originalId || q?._id]}
                  onCodeChange={useCallback(v => setAnswers(p => ({ ...p, [q?.originalId || q?._id]: { code: v, language: selectedLanguage } })), [q?.originalId, q?._id, selectedLanguage])}
                  selectedLanguage={selectedLanguage}
                  setSelectedLanguage={setSelectedLanguage}
                  isLangDropdownOpen={isLangDropdownOpen}
                  setIsLangDropdownOpen={setIsLangDropdownOpen}
                  editorHeight={editorHeight}
                  setEditorHeight={setEditorHeight}
                  isExecuting={isExecuting}
                  executionResult={executionResult}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  onMouseDown={useCallback(() => { isResizing.current = true; document.body.style.cursor = 'row-resize'; }, [])}
                />
              </div>
            ) : (
            ) : (
              <div className="flex-1 overflow-y-auto scroll-thin px-8 py-10">
                <div className="max-w-3xl mx-auto w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden mb-12">
                  <div className="p-10 border-b border-slate-100">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-xl text-[11px] font-black uppercase tracking-widest border border-indigo-100">Q{currentQ + 1}</div>
                      <div className="px-3 py-1 bg-slate-100 text-slate-500 rounded-xl text-[11px] font-bold uppercase tracking-widest">{q?.type === 'mcq' ? 'Choice Selection' : 'Written Case'}</div>
                      {markedForReview[q?.originalId || q?._id] && <div className="ml-auto text-violet-600 bg-violet-50 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border border-violet-100 flex items-center gap-2"><Bookmark size={12} fill="currentColor" /> Flagged</div>}
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 leading-tight tracking-tight">{q?.questionText}</h2>
                  </div>
                  <div className="p-10 pb-12">
                    {q?.type === 'mcq' ? (
                      <div className="grid gap-4">
                        {q?.displayOptions?.map((opt, i) => {
                          const isS = answers[q?.originalId || q?._id] === opt.originalIndex;
                          return (
                            <button key={i} onClick={() => setAnswers(p => ({ ...p, [q?.originalId || q?._id]: opt.originalIndex }))} className={`w-full flex items-center gap-6 p-6 rounded-2xl border-2 transition-all duration-300 text-left relative group ${isS ? 'bg-indigo-50/50 border-indigo-600 shadow-lg shadow-indigo-100/50' : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/50'}`}>
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[14px] font-black transition-all ${isS ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>{String.fromCharCode(65 + i)}</div>
                              <span className={`text-[17px] leading-relaxed flex-1 ${isS ? 'font-bold text-indigo-900' : 'font-medium text-slate-600'}`}>{opt.text}</span>
                              {isS && <CheckCircle2 size={24} className="text-indigo-600 animate-in zoom-in duration-300" />}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="relative group">
                          <textarea value={answers[q?.originalId || q?._id] || ''} onChange={e => setAnswers(p => ({ ...p, [q?.originalId || q?._id]: e.target.value }))} placeholder="Type your structured response here..." className="w-full h-96 bg-slate-50/50 border-2 border-slate-100 rounded-3xl p-10 focus:bg-white focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 transition-all outline-none resize-none shadow-inner font-medium text-slate-700 leading-relaxed text-[17px]" />
                          <div className="absolute top-6 right-6"><div className="w-2 h-2 rounded-full bg-indigo-200 group-focus-within:bg-indigo-500 animate-pulse" /></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white border-t border-slate-200 px-8 h-[64px] flex items-center justify-between shrink-0 shadow-[0_-8px_20px_-8px_rgba(0,0,0,0.05)] z-20">
              <div className="flex items-center gap-3">
                <button onClick={() => {
                   const p = Math.max(0, currentQ - 1);
                   setCurrentQ(p); 
                   const qId = questions[p]?.originalId || questions[p]?._id;
                   if (qId) setVisited(v => ({ ...v, [qId]: true }));
                }} disabled={currentQ === 0} className={`h-11 px-6 flex items-center gap-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest border transition-all ${currentQ === 0 ? 'text-slate-300 border-slate-100 opacity-50' : 'text-slate-600 border-slate-200 hover:bg-slate-50 shadow-sm active:scale-95'}`}><ChevronLeft size={18} /> Back</button>
                <button onClick={() => setMarkedForReview(p => ({ ...p, [q?.originalId || q?._id]: !p[q?.originalId || q?._id] }))} className={`h-11 px-6 rounded-xl text-[12px] font-black uppercase tracking-widest border transition-all ${markedForReview[q?.originalId || q?._id] ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{markedForReview[q?.originalId || q?._id] ? 'Flagged' : 'Flag for Review'}</button>
              </div>
              <div className="flex items-center gap-4">
                {q?.type === 'coding' && (
                  <div className="flex gap-2">
                    <button 
                      onClick={handleRunCode} 
                      disabled={isExecuting || cooldownSeconds > 0} 
                      className={`h-11 px-6 flex items-center gap-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest border transition-all active:scale-95 ${cooldownSeconds > 0 ? 'bg-slate-50 text-slate-400 border-slate-200' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:shadow-sm'}`}
                    >
                      {isExecuting ? <RotateCcw size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />}
                      {cooldownSeconds > 0 ? `Wait (${cooldownSeconds}s)` : 'Run'}
                    </button>
                    <button 
                      onClick={handleCheckTestCases} 
                      disabled={isExecuting || cooldownSeconds > 0} 
                      className={`h-11 px-8 flex items-center gap-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all active:scale-95 ${cooldownSeconds > 0 ? 'bg-indigo-400 text-white cursor-not-allowed opacity-80' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'}`}
                    >
                      {cooldownSeconds > 0 ? `Ready in ${cooldownSeconds}s` : 'Submit Code'}
                    </button>
                  </div>
                )}
                <div className="h-8 w-px bg-slate-100 mx-2" />
                <button onClick={() => {
                   if (currentQ < questions.length - 1) {
                     const n = currentQ + 1;
                     setCurrentQ(n); 
                     const qId = questions[n]?.originalId || questions[n]?._id;
                     if (qId) setVisited(v => ({ ...v, [qId]: true }));
                   } else {
                     setShowConfirm(true);
                   }
                }} className={`h-11 px-8 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${currentQ === questions.length - 1 ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-900 text-white shadow-lg hover:bg-black'}`}>{currentQ === questions.length - 1 ? 'Final Hand In' : 'Save & Next'} <ChevronRight size={18} className="ml-1" /></button>
              </div>
            </div>
          </div>
          
            {/* Right sidebar was proctoring, now empty or removed */}
        </main>
      </div>

      <SubmitModal isOpen={showConfirm} onClose={() => setShowConfirm(false)} stats={{ answered: answeredCount, total: questions.length, marked: Object.values(markedForReview).filter(Boolean).length }} onConfirm={handleFinalSubmit} />
      <ExitModal isOpen={showExitPrompt} onClose={() => setShowExitPrompt(false)} password={exitPassword} setPassword={setExitPassword} error={exitError} onExit={() => { if (exitPassword === '12345') navigate('/student'); else setExitError('Denied'); }} />
      <TabToast toast={tabToast} />

      {/* 📡 Live Broadcast Overlay */}
      <AnimatePresence>
        {broadcastMessage && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} className="fixed top-16 left-1/2 -translate-x-1/2 z-[250] pointer-events-none">
            <div className="bg-indigo-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-start gap-4 max-w-xl border border-white/10 ring-8 ring-indigo-500/10 pointer-events-auto">
              <div className="bg-white/20 p-2 rounded-xl shrink-0 mt-0.5"><Radio size={20} className="animate-pulse" /></div>
              <div><h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-100 mb-1">Live Announcement</h3><p className="text-sm font-semibold leading-relaxed text-white">{broadcastMessage}</p></div>
              <button onClick={() => setBroadcastMessage(null)} className="ml-2 p-1 hover:bg-white/10 rounded-lg transition-colors"><XCircle size={18} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔒 Fullscreen Overlay */}
      {!isFullscreen && !submitted && !terminated && (
        <div className="fixed inset-0 z-[200] bg-slate-900/98 backdrop-blur-2xl flex items-center justify-center p-8 text-center animate-in fade-in duration-700">
          <div className="max-w-md w-full bg-slate-900 border border-red-500/20 p-10 rounded-[40px] shadow-2xl ring-1 ring-white/5">
            <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner ring-1 ring-red-500/20"><ShieldAlert size={40} className="text-red-500" /></div>
            <h2 className="text-3xl font-black text-white mb-3 uppercase tracking-tighter">Security Violation</h2>
            <p className="text-slate-400 text-sm mb-10 leading-relaxed font-medium">Fullscreen mode is mandatory for exam integrity. Your activity has been logged and flagged for supervisor review.</p>
            <button onClick={() => document.documentElement.requestFullscreen()} className="w-full py-5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[12px] transition-all shadow-xl shadow-red-900/40 transform active:scale-95">Restore Secure Session</button>
          </div>
        </div>
      )}
    </div>
  );
}

// 🎲 Randomization Helpers
function generateSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) { hash = (hash << 5) - hash + str.charCodeAt(i); hash |= 0; }
  let seed = Math.abs(hash) || 1;
  return function() { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
}
function seededShuffle(array, randomFunc) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(randomFunc() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
