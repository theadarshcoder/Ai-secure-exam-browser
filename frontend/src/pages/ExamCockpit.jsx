import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import socketService from '../services/socket';
import api, { runCodingQuestion, requestHelp } from '../services/api';
import Editor from '@monaco-editor/react';
import {
  CameraOff, Clock, Shield, CheckCircle, CheckCircle2, Lock,
  ChevronRight, ChevronLeft, ChevronDown, Send, XCircle,
  Bookmark, Terminal, Power,
  Loader2, RotateCcw, Play, Monitor, ShieldAlert,
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
    .filter(({ q }) => activeSec?.types?.includes(q.type))
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
});

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
));

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
));

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
));

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
  return (
    <div style={{ height: '100vh', background: 'red', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: 'bold' }}>
      DEBUG: COCKPIT COMPONENT ALIVE
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
