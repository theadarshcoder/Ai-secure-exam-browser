import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import socketService from "../services/socket";
import api, {
  runCodingQuestion,
  requestHelp,
  getSettings,
} from "../services/api";
import Editor from "@monaco-editor/react";
import {
  CameraOff,
  Clock,
  Shield,
  CheckCircle,
  CheckCircle2,
  Lock as LockIcon,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Send,
  XCircle,
  X,
  Bookmark,
  Terminal,
  Power,
  Check,
  Loader2,
  RotateCcw,
  Play,
  Monitor,
  ShieldAlert,
  AlertCircle,
  MessageSquare,
  Radio,
  Bot,
  ChevronsLeftRight,
  ChevronsUpDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTabVisibility, TabToast } from "../components/TabVisibility";
import StudentMessageModal from "../components/StudentMessageModal";
import FAQBot from "../components/FAQBot";
import * as faceapi from "@vladmandic/face-api";
import VisionLogo from "../components/VisionLogo";
import AnimatedStatusIcon from "../components/AnimatedStatusIcon";
import storageService from "../services/storageService";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
} from "@codesandbox/sandpack-react";

/* ────────────────────────────────────────────── Config ────────────────────────────────────────────── */

const TOTAL_SECONDS = 45 * 60;

/* ────────────────────────────────────────── Sub-components ────────────────────────────────────────── */

const QuestionPalette = React.memo(
  ({ questions, currentQ, answers, visited, markedForReview, navigateTo }) => {
    const answered = Object.keys(answers).length;

    const sections = [];
    const hasMCQ = questions.some((q) => q.type === "mcq");
    const hasShort = questions.some((q) => q.type === "short");
    const hasCoding = questions.some((q) => q.type === "coding");
    const hasReact = questions.some((q) => q.type === "frontend-react");

    if (hasMCQ) sections.push({ id: "a", label: "Sec A", types: ["mcq"] });
    if (hasShort) sections.push({ id: "b", label: "Sec B", types: ["short"] });
    if (hasCoding)
      sections.push({ id: "c", label: "Sec C", types: ["coding"] });
    if (hasReact)
      sections.push({ id: "d", label: "Sec D", types: ["frontend-react"] });

    const [activeSection, setActiveSection] = React.useState(
      sections[0]?.id || "a",
    );

    React.useEffect(() => {
      const qType = questions[currentQ]?.type;
      const correctSec = sections.find((s) => s.types.includes(qType));
      if (correctSec && correctSec.id !== activeSection) {
        setActiveSection(correctSec.id);
      }
    }, [currentQ, questions, activeSection]);

    const activeSec =
      sections.find((s) => s.id === activeSection) || sections[0];
    const visibleIndices = questions
      .map((q, i) => ({ q, i }))
      .filter(({ q }) => activeSec?.types?.includes(q.type))
      .map(({ i }) => i);

    const handleSectionClick = (sec) => {
      setActiveSection(sec.id);
      const firstIdx = questions.findIndex((q) => sec.types.includes(q.type));
      if (firstIdx !== -1) {
        navigateTo(firstIdx);
      }
    };

    const getQState = (shuffledIndex) => {
      const q = questions[shuffledIndex];
      if (!q) return "unseen";
      const qId = q.originalId || q.id || q._id;
      if (shuffledIndex === currentQ) return "current";
      if (markedForReview[qId] && answers[qId] !== undefined)
        return "marked-answered";
      if (markedForReview[qId]) return "marked";
      if (answers[qId] !== undefined) return "answered";
      if (visited[qId]) return "visited";
      return "unseen";
    };

    const stateStyles = {
      current:
        "bg-[#14172a] text-white border-2 border-[#14172a] shadow-md font-bold",
      answered: "bg-emerald-50 text-emerald-700 border-emerald-200 font-medium",
      marked: "bg-amber-50 text-amber-700 border-amber-200 font-medium",
      "marked-answered":
        "bg-amber-50 text-amber-700 border-amber-200 font-medium ring-2 ring-[#1e2235] ring-offset-1",
      visited: "bg-slate-50 text-slate-600 border-slate-200 font-medium",
      unseen:
        "bg-white text-slate-500 border-slate-100 hover:border-indigo-300 font-medium",
    };

    return (
      <div className="flex flex-col shrink-0">
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                Questions
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 tabular-nums uppercase">
              {answered}/{questions.length} Solved
            </span>
          </div>
          <div className="p-1 bg-slate-100 rounded-xl flex items-center gap-1">
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => handleSectionClick(sec)}
                className={`flex-1 py-2 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all ${activeSection === sec.id ? "bg-white text-[#1e2235] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                {sec.label}
              </button>
            ))}
          </div>
        </div>
        <div className="pl-3 pr-2 pt-0 pb-2">
          <div className="grid grid-cols-4 gap-2 max-h-[294px] overflow-y-auto scroll-thin pl-1 pr-2 pt-1.5 pb-2">
            {visibleIndices.map((i) => (
              <button
                key={i}
                onClick={() => navigateTo(i)}
                className={`relative group h-10 rounded-xl flex items-center justify-center text-[13px] border transition-all duration-200 ${stateStyles[getQState(i)]}`}
              >
                {i + 1}
                {markedForReview[
                  questions[i]?.originalId ||
                    questions[i]?.id ||
                    questions[i]?._id
                ] &&
                  getQState(i) !== "current" && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 border-2 border-white rounded-full" />
                  )}
              </button>
            ))}
          </div>
        </div>
        <div className="px-3 py-2.5 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { color: "bg-[#14172a]", text: "text-slate-700", bg: "bg-slate-100", border: "border-slate-200", label: "Current" },
              { color: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-100", label: "Solved" },
              { color: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-100", label: "Marked" },
              { color: "bg-slate-300", text: "text-slate-500", bg: "bg-slate-50", border: "border-slate-100", label: "Unseen" },
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border ${item.bg} ${item.border}`}>
                <div className={`w-2 h-2 rounded-sm shrink-0 ${item.color}`} />
                <span className={`text-[10px] font-bold uppercase tracking-wide ${item.text}`}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
);

const ProctoringSidebar = React.memo(
  ({
    cameraActive,
    videoRef,
    faceActive,
    confidence,
    camError,
    onRetryCamera,
  }) => (
    <div className="flex flex-col items-center w-full gap-2">
      <div className="relative group w-full">
        <div className="relative aspect-[4/3] w-full rounded-xl bg-surface border border-main overflow-hidden shadow-xl">
          {cameraActive ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                disablePictureInPicture
                controlsList="noplaybackrate nodownload"
                className="w-full h-full object-cover scale-x-[-1]"
              />
              {/* Transparent overlay to block Chrome's native video hover controls */}
              <div className="absolute inset-0 z-[5]" />
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-surface-hover">
              <CameraOff size={24} className="text-muted opacity-20" />
              <span className="text-[9px] font-bold text-muted uppercase tracking-widest">
                Feed Disabled
              </span>
            </div>
          )}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[8px] font-bold text-white uppercase tracking-widest border border-white/10 z-10">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            Live
          </div>
        </div>
      </div>

      {camError && (
        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-center">
          <p className="text-red-400 text-xs mb-2">
            Camera/Mic access denied. Please click the 🔒 icon in the URL bar to
            allow, then retry.
          </p>
          <button
            onClick={onRetryCamera}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold uppercase"
          >
            Retry Camera
          </button>
        </div>
      )}
    </div>
  ),
);

const SubmitModal = React.memo(({ isOpen, onClose, onConfirm, stats, password, setPassword, error }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-md flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.95, y: 10, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          className="bg-surface rounded-3xl p-8 max-w-md w-full shadow-2xl border border-main"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#1e2235]/10 border border-[#1e2235]/20 text-[#1e2235] mb-6 flex items-center justify-center shadow-lg shadow-[#1e2235]/10">
            <Send size={28} />
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2 tracking-tight">
            Confirm Exam Submission?
          </h2>
          <p className="text-[13px] font-medium text-muted mb-6 leading-relaxed">
            You are about to submit your response. This action is final and your
            work will be graded as currently saved.
          </p>
          <div className="bg-surface-hover border border-main rounded-2xl p-6 mb-6 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-[9px] font-bold text-muted uppercase tracking-widest">
                Answered
              </p>
              <p className="text-xl font-bold text-primary tabular-nums">
                {stats.answered}
              </p>
            </div>
            <div className="border-l border-main">
              <p className="text-[9px] font-bold text-muted uppercase tracking-widest">
                Marked
              </p>
              <p className="text-xl font-bold text-primary tabular-nums">
                {stats.marked}
              </p>
            </div>
            <div className="border-l border-main">
              <p className="text-[9px] font-bold text-muted uppercase tracking-widest">
                Total
              </p>
              <p className="text-xl font-bold text-primary tabular-nums">
                {stats.total}
              </p>
            </div>
          </div>
          <div className="relative mb-6">
             <input
               type="password"
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               placeholder="Supervisor Password"
               className="w-full bg-surface-hover border border-main rounded-xl px-4 py-3.5 text-center text-primary font-mono text-[14px] tracking-[0.4em] focus:outline-none focus:border-[#1e2235] focus:ring-4 focus:ring-[#1e2235]/10 transition-all"
             />
             {error && (
               <div className="absolute top-full left-0 right-0 mt-2 text-center">
                 <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">
                   {error}
                 </span>
               </div>
             )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 px-4 rounded-xl border border-main text-muted hover:text-primary hover:bg-surface-hover transition-all text-[12px] font-bold uppercase tracking-widest"
            >
              Wait, I'll Review
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3.5 px-4 rounded-xl bg-[#1e2235] hover:bg-[#14172a] text-white transition-all text-[12px] font-bold uppercase tracking-widest shadow-lg shadow-[#1e2235]/20"
            >
              Confirm & Submit
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
));

const TabViolationOverlay = React.memo(({ isOpen, onResume }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.95, y: 10, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          className="bg-surface rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-main text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 mb-6 mx-auto flex items-center justify-center border border-red-100 shadow-sm relative">
            <ShieldAlert size={28} strokeWidth={2.5} />
            <div className="absolute top-0 right-0 -mt-1 -mr-1 w-3 h-3 bg-[#1e2235] rounded-full animate-ping" />
            <div className="absolute top-0 right-0 -mt-1 -mr-1 w-3 h-3 bg-[#1e2235] rounded-full border-2 border-black" />
          </div>
          <h2 className="text-2xl font-bold text-primary mb-3 tracking-tight">
            Navigation Alert
          </h2>
          <p className="text-[14px] font-medium text-muted mb-8 leading-relaxed px-2">
            Leaving the exam environment is prohibited. This incident has been
            recorded and securely flagged for the examiner.
          </p>
          <button
            onClick={onResume}
            className="w-full h-12 rounded-xl bg-[#1e2235] hover:bg-[#14172a] text-white transition-all text-[13px] font-bold shadow-xl shadow-[#1e2235]/20 active:scale-95 flex items-center justify-center gap-2"
          >
            Acknowledge & Resume
          </button>
          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] font-semibold text-muted">
            <LockIcon size={12} />
            <span>Secure Environment Enforced</span>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
));

const ExitModal = React.memo(
  ({ isOpen, onClose, onExit, password, setPassword, error }) => (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <motion.div
            initial={{ scale: 0.95, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            className="bg-surface rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-main text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 mb-6 mx-auto flex items-center justify-center shadow-sm">
              <ShieldAlert size={28} />
            </div>
            <h2 className="text-xl font-bold text-primary mb-2 tracking-tight">
              Security Override
            </h2>
            <p className="text-[12px] font-medium text-zinc-500 mb-8 mx-auto max-w-[240px]">
              Enter supervisor credentials to force terminate this session.
            </p>
            <div className="relative mb-6">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Supervisor Password"
                className="w-full bg-surface-hover border border-main rounded-xl px-4 py-3.5 text-center text-primary font-mono text-[14px] tracking-[0.4em] focus:outline-none focus:border-[#1e2235] focus:ring-4 focus:ring-[#1e2235]/10 transition-all"
              />
              {error && (
                <div className="absolute top-full left-0 right-0 mt-2">
                  <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">
                    {error}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3.5 rounded-xl border border-main text-muted hover:text-primary hover:bg-surface-hover transition-all text-[12px] font-bold uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                onClick={onExit}
                className="flex-1 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-all text-[12px] font-bold uppercase tracking-widest shadow-lg shadow-red-900/20"
              >
                Terminate
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  ),
);

const FullBlockOverlay = React.memo(({ isOpen, reason }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] bg-black flex items-center justify-center p-6 select-none"
      >
        <div className="text-center max-w-md bg-surface p-10 rounded-3xl shadow-xl border border-main">
          <div className="w-20 h-20 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-6 border border-red-500/20">
            <LockIcon size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-primary mb-3 tracking-tight">
            Access Restricted
          </h1>
          <p className="text-muted text-[15px] mb-8 leading-relaxed font-medium">
            {reason ||
              "Your exam session has been suspended by the supervisor due to suspicious activity."}
          </p>
          <div className="p-4 bg-surface-hover border border-main rounded-2xl">
            <p className="text-[12.5px] font-semibold text-muted">
              Please contact your instructor immediately to regain access.
            </p>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
));


const ObjectivePanel = React.memo(
  ({ question, index, markedForReview, panelWidth }) => (
    <div
      style={{ width: `${panelWidth}%` }}
      className="shrink-0 flex flex-col min-h-0 bg-surface"
    >
      <div className="bg-surface-hover border-b border-main px-6 h-10 flex items-center justify-between shrink-0">
        <span className="text-[11px] font-bold text-primary uppercase tracking-widest">
          Objective
        </span>
        {markedForReview[
          question?.originalId || question?.id || question?._id
        ] && (
          <div className="flex items-center gap-1.5 bg-[#1e2235]/10 text-[#1e2235] px-2 py-0.5 rounded-md border border-[#1e2235]/20">
            <Bookmark size={10} className="fill-slate-800" />
            <span className="text-[9px] font-bold uppercase tracking-wider">
              Flagged
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-8 scroll-thin font-medium">
        <div className="flex items-center gap-3 mb-6">
          <div className="px-2.5 py-1 bg-surface-hover text-primary border border-main rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-sm">
            Q{index + 1}
          </div>
          <div className="px-2.5 py-1 bg-surface text-muted border border-main rounded-lg text-[10px] font-bold uppercase tracking-widest">
            {question?.marks || 10} Marks
          </div>
        </div>
        <h2 className="text-xl font-medium text-primary leading-snug tracking-tight mb-6"
          dangerouslySetInnerHTML={{ __html: question?.questionText || '' }}
        />
        <div className="prose prose-invert prose-sm text-muted leading-relaxed space-y-4">
          <p>
            Implement the solution according to constraints. Standard
            input/output is supported.
          </p>
          <ul className="list-disc pl-5 text-[12px] font-semibold space-y-1">
            <li>Ensure code is optimized.</li>
            <li>Handle edge cases (empty input, null, etc).</li>
          </ul>
        </div>
      </div>
    </div>
  ),
);

const CodingEnvironment = React.memo(
  ({
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
    onMouseDown,
  }) => {
    const [showResetConfirm, setShowResetConfirm] = React.useState(false);

    return (
      <div
        id="coding-right-panel"
        className="flex-1 flex flex-col min-h-0 relative bg-page overflow-hidden"
      >
        <div className="absolute inset-0 flex flex-col overflow-hidden">
          <div
            style={{ height: `${editorHeight}%` }}
            className="flex flex-col shrink-0 min-h-0 bg-surface overflow-hidden relative z-0 border-b border-main"
          >
            <div className="flex items-center justify-between px-4 h-10 bg-surface-hover border-b border-main shrink-0 z-10">
              <div className="flex items-center gap-2 text-muted">
                <Terminal size={14} />
                <span className="text-[11px] font-bold uppercase tracking-widest">
                  Code
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center justify-center w-[26px] h-[26px] bg-surface border border-main rounded-lg text-muted hover:text-primary hover:bg-surface-hover transition-all shadow-sm group relative"
                >
                  <RotateCcw size={13} />
                  <div className="absolute top-[calc(100%+6px)] left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap bg-surface-hover text-primary text-[10px] font-medium tracking-wide px-2.5 py-1 rounded-md shadow-lg z-50 border border-main">
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-surface-hover rotate-45 border-t border-l border-main" />
                    <span className="relative z-10">Reset code</span>
                  </div>
                </button>
                <div className="relative">
                  <button
                    onClick={() => setIsLangDropdownOpen((p) => !p)}
                    className="flex items-center gap-2 bg-surface border border-main rounded-lg px-2.5 h-[26px] hover:bg-surface-hover transition-all text-[11px] font-bold uppercase tracking-widest text-muted shadow-sm"
                  >
                    {selectedLanguage}
                    <ChevronDown size={12} />
                  </button>
                  {isLangDropdownOpen && (
                    <div className="absolute top-full right-0 mt-1 w-32 bg-surface border border-main rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                      {["javascript", "python", "cpp", "java"].map((l) => (
                        <button
                          key={l}
                          onClick={() => {
                            setSelectedLanguage(l);
                            setIsLangDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${selectedLanguage === l ? "bg-[#1e2235] text-white" : "text-muted hover:bg-surface-hover"}`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-1 relative overflow-hidden bg-surface shadow-inner">
              <Editor
                key={`editor-${question?.originalId || question?.id || question?._id}`}
                height="100%"
                language={selectedLanguage === "cpp" ? "cpp" : selectedLanguage}
                theme="vs-dark"
                value={
                  typeof answer === "object"
                    ? answer.code
                    : (answer ?? question?.initialCode)
                }
                onChange={onCodeChange}
                options={{
                  fontSize: 13,
                  minimap: { enabled: false },
                  automaticLayout: true,
                  padding: { top: 16 },
                  hover: { enabled: false },
                  lightbulb: { enabled: false },
                  codeLens: false,
                  renderValidationDecorations: "off",
                  quickSuggestions: false,
                  contextmenu: false,
                  scrollBeyondLastLine: false,
                  lineNumbersMinChars: 3,
                  unicodeHighlight: {
                    ambiguousCharacters: false,
                    invisibleCharacters: false,
                    nonBasicASCII: false,
                  },
                }}
              />
            </div>
          </div>
          <div
            className="relative h-4 -my-2 cursor-row-resize z-20 flex group/resizer shrink-0"
            onMouseDown={onMouseDown}
            onMouseMove={(e) => {
              const icon = e.currentTarget.querySelector('.grip-icon-h');
              if (icon) {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = Math.max(20, Math.min(e.clientX - rect.left, rect.width - 20));
                icon.style.left = `${x}px`;
              }
            }}
            onMouseLeave={(e) => {
              const icon = e.currentTarget.querySelector('.grip-icon-h');
              if (icon) icon.style.left = '50%';
            }}
          >
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-transparent group-hover/resizer:bg-[#1e2235]/20 transition-colors duration-200" />
            <div className="grip-icon-h absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 z-30 opacity-0 group-hover/resizer:opacity-100 bg-surface border border-main rounded-full shadow-sm text-primary flex items-center justify-center pointer-events-none" style={{ transition: 'opacity 0.2s, left 0.05s linear' }}>
              <ChevronsUpDown size={14} className="m-[3px]" />
            </div>
          </div>
          <div className="flex-1 flex flex-col min-h-0 bg-surface relative z-10 overflow-hidden">
            <div className="flex items-center px-4 border-b border-main shrink-0 h-10 bg-surface z-10">
              <button
                onClick={() => setActiveTab("Test Cases")}
                className={`h-full px-4 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-all ${activeTab === "Test Cases" ? "text-primary border-[#1e2235]" : "text-muted border-transparent hover:text-primary"}`}
              >
                Test Cases
              </button>
              <button
                onClick={() => setActiveTab("Execution Details")}
                className={`h-full px-4 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-all ${activeTab === "Execution Details" ? "text-primary border-[#1e2235]" : "text-muted border-transparent hover:text-primary"}`}
              >
                Output Log
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 scroll-thin bg-page/50">
              {isExecuting ? (
                <div className="h-full flex flex-col items-center justify-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-main border-t-emerald-500 animate-spin" />
                  <span className="text-[11px] font-medium text-muted tracking-widest uppercase">
                    Fetching result...
                  </span>
                </div>
              ) : executionResult ? (
                <div className="space-y-3">
                  {activeTab === "Test Cases" ? (() => {
                    const results = executionResult.results;
                    if (!results) {
                      // Raw "Run" execution — no test case results yet
                      if (executionResult.isRawExecution || executionResult.rawOutput !== undefined) {
                        return (
                          <div className="h-full flex flex-col items-center justify-center gap-3 text-muted py-10">
                            <div className="w-10 h-10 rounded-full bg-surface-hover border border-main flex items-center justify-center">
                              <Check size={18} className="text-muted" />
                            </div>
                            <p className="text-[12px] font-semibold text-primary text-center">Code ran successfully</p>
                            <p className="text-[11px] text-muted text-center max-w-[220px] leading-relaxed">
                              Check the <strong>Output Log</strong> tab for output, or click <strong>Check Test Cases</strong> to validate against all test cases.
                            </p>
                          </div>
                        );
                      }
                      // Actual error from backend
                      if (executionResult.error) return (
                        <div className="p-4 rounded-xl border border-red-300 bg-red-50 text-red-600 font-mono text-sm">
                          {executionResult.error}: {executionResult.details}
                        </div>
                      );
                      // No data at all — empty state
                      return (
                        <div className="h-full flex flex-col items-center justify-center gap-3 text-muted py-10">
                          <p className="text-[11px] font-medium">No test case results yet.</p>
                        </div>
                      );
                    }
                    const allPassed = results.every(r => r.passed);
                    const passedCount = results.filter(r => r.passed).length;
                    const total = results.length;
                    return (
                      <div className="space-y-3">

                        {/* ── Summary banner ── */}
                        <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-l-[3px] ${
                          allPassed
                            ? 'border-l-emerald-500 bg-emerald-50 border border-emerald-200'
                            : 'border-l-red-500 bg-red-50 border border-red-200'
                        }`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                            allPassed ? 'bg-emerald-500' : 'bg-red-500'
                          }`}>
                            {allPassed
                              ? <Check size={14} className="text-white" strokeWidth={3} />
                              : <X size={14} className="text-white" strokeWidth={3} />}
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className={`text-[14px] font-bold leading-tight ${
                              allPassed ? 'text-emerald-700' : 'text-red-700'
                            }`}>
                              {allPassed ? 'Excellent work! All test cases passed.' : 'Some test cases failed.'}
                            </span>
                            <span className={`text-[11px] font-medium mt-0.5 ${
                              allPassed ? 'text-emerald-600' : 'text-red-500'
                            }`}>
                              {passedCount} of {total} test cases passed
                            </span>
                          </div>
                          <span className={`text-[13px] font-bold px-3 py-1.5 rounded-lg shrink-0 ${
                            allPassed
                              ? 'bg-emerald-500 text-white'
                              : 'bg-red-500 text-white'
                          }`}>
                            {passedCount}/{total}
                          </span>
                        </div>

                        {/* ── Per-case rows ── */}
                        {results.map((res, i) => (
                          <div key={i} className="rounded-xl border border-main bg-surface overflow-hidden shadow-sm">
                            {/* Header */}
                            <div className={`flex items-center justify-between px-4 py-2.5 border-b border-main ${
                              res.passed ? 'bg-emerald-50' : 'bg-red-50'
                            }`}>
                              <span className="text-[12px] font-bold text-primary">
                                Test Case {i + 1}
                              </span>
                              <span className={`flex items-center gap-1.5 text-[11px] font-bold ${
                                res.passed ? 'text-emerald-600' : 'text-red-600'
                              }`}>
                                {res.passed
                                  ? <><Check size={11} strokeWidth={3}/> Passed</>
                                  : <><X size={11} strokeWidth={3}/> Failed</>}
                              </span>
                            </div>

                            {/* Columns */}
                            <div className="grid grid-cols-2 divide-x divide-main">
                              <div className="p-4">
                                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">
                                  Your Output
                                </p>
                                <div className={`px-3 py-2.5 rounded-lg border text-[13px] font-mono font-semibold ${
                                  res.passed
                                    ? 'bg-surface-hover border-main text-primary'
                                    : 'bg-red-50 border-red-200 text-red-700'
                                }`}>
                                  {res.actualOutput || <span className="text-muted italic">no output</span>}
                                </div>
                              </div>
                              <div className="p-4">
                                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">
                                  {res.error ? 'Error' : 'Expected'}
                                </p>
                                <div className={`px-3 py-2.5 rounded-lg border text-[13px] font-mono font-semibold ${
                                  res.error
                                    ? 'bg-red-50 border-red-200 text-red-700'
                                    : 'bg-surface-hover border-main text-primary'
                                }`}>
                                  {res.error || res.expectedOutput || <span className="text-muted italic">—</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })() : (
                    /* Output Log tab */
                    <div className="rounded-xl border border-main bg-surface overflow-hidden shadow-sm">
                      <div className="px-4 py-2.5 bg-surface-hover border-b border-main flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[11px] font-bold text-muted uppercase tracking-widest">Output Log</span>
                      </div>
                      <div className="p-5">
                        <pre className="text-[14px] font-mono text-primary leading-relaxed whitespace-pre-wrap">
                          {executionResult.rawOutput ||
                            executionResult.stdout ||
                            executionResult.details ||
                            executionResult.error ||
                            "No output."}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-muted">
                  <Play size={32} className="translate-x-0.5 opacity-25" />
                  <span className="text-[11px] font-semibold uppercase tracking-widest">
                    Run your code to see results
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reset Confirm Modal */}
        {showResetConfirm && (
          <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface rounded-3xl shadow-2xl border border-main max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4 border border-red-500/20 shadow-sm">
                  <RotateCcw size={20} />
                </div>
                <h3 className="text-lg font-bold text-primary mb-2">
                  Reset Code Editor?
                </h3>
                <p className="text-sm text-muted font-medium mb-6 leading-relaxed">
                  This will erase all your current code and restore the default
                  starting template. This action cannot be undone.
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 h-10 rounded-xl bg-surface-hover text-muted font-bold text-sm border border-main hover:text-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onCodeChange(question?.initialCode || "");
                      setShowResetConfirm(false);
                    }}
                    className="flex-1 h-10 rounded-xl bg-red-600 text-white font-bold text-sm border border-red-700 hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all active:scale-95"
                  >
                    Yes, Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);

const FrontendReactEnvironment = React.memo(
  ({
    question,
    answer,
    onCodeChange,
    isExecuting,
    executionResult,
    activeTab,
    setActiveTab,
  }) => {
    const files =
      typeof answer === "object" && answer.files
        ? answer.files
        : question?.frontendTemplate?.files || {
            "/App.jsx":
              "import React from 'react';\n\nexport default function App() {\n  return <div>Hello World</div>;\n}",
          };

    return (
      <div className="flex-1 flex flex-col min-h-0 relative bg-page">
        <div className="absolute inset-0 flex flex-col">
          <div className="flex-1 flex min-h-0 bg-surface">
            <SandpackProvider
              template="react"
              theme="dark"
              files={files}
              options={{
                activeFile: question?.frontendTemplate?.mainFile || "/App.jsx",
                recompileMode: "immediate",
                recompileDelay: 300,
              }}
              onCodeUpdate={(newFiles) => {
                // 🐢 Fix 4: Debounce Sandpack updates to prevent whole-page re-renders
                if (window.sandpackDebounce) clearTimeout(window.sandpackDebounce);
                window.sandpackDebounce = setTimeout(() => {
                  onCodeChange({ files: newFiles });
                }, 800);
              }}
            >
              <SandpackLayout
                style={{ height: "100%", border: "none", borderRadius: 0 }}
              >
                <div className="flex-1 border-r border-main">
                  <SandpackCodeEditor
                    showTabs={true}
                    showLineNumbers={true}
                    showInlineErrors={true}
                    style={{ height: "100%" }}
                  />
                </div>
                <div className="flex-1 bg-page">
                  <SandpackPreview
                    showOpenInCodeSandbox={false}
                    showRefreshButton={false}
                    showRestartButton={false}
                    additionalIframeProps={{
                      sandbox: "allow-scripts allow-forms allow-popups",
                    }}
                    style={{ height: "100%" }}
                  />
                </div>
              </SandpackLayout>
            </SandpackProvider>
          </div>

          {/* Results Panel */}
          <div className="h-48 border-t border-main flex flex-col bg-surface">
            <div className="flex items-center px-4 border-b border-main shrink-0 h-10 bg-surface-hover">
              <button
                onClick={() => setActiveTab("Test Cases")}
                className={`h-full px-4 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-all ${activeTab === "Test Cases" ? "text-primary border-[#1e2235]" : "text-muted border-transparent hover:text-primary"}`}
              >
                UI Validation Results
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 scroll-thin bg-page/50">
              {isExecuting ? (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-primary">
                  <RotateCcw size={20} className="animate-spin" />
                  <span className="text-[9px] font-bold uppercase tracking-widest animate-pulse">
                    Running UI Verification...
                  </span>
                </div>
              ) : executionResult ? (
                <div className="space-y-3">
                  {executionResult.testCaseResults?.map((res, i) => (
                    <div
                      key={i}
                      className={`bg-surface border rounded-xl p-3 flex items-center justify-between border-main shadow-sm ${res.passed ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-red-500"}`}
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-primary">
                          {res.description}
                        </span>
                        {res.errorMsg && (
                          <span className="text-[9px] text-red-500 font-mono">
                            {res.errorMsg}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] font-bold uppercase shrink-0">
                        {res.passed ? "PASSED ✅" : "FAILED ❌"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted/30 gap-2">
                  <Play size={32} />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted/50">
                    Submit to Validate UI
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

const ExamTimer = React.memo(({ seconds, isCritical }) => {
  const fmtTime = (s) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  return (
    <div
      className={`flex items-center gap-2 px-4 py-1.5 rounded-full ${isCritical ? "bg-red-50 text-red-600 border-red-200" : "bg-slate-50 text-slate-700 border-slate-200"} border`}
    >
      <Clock size={14} className={isCritical ? "animate-pulse" : ""} />
      <span className="text-base font-bold tabular-nums">
        {fmtTime(seconds)}
      </span>
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
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]); // Will store shuffled list
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [endTime, setEndTime] = useState(null);
  const [cameraActive, setCameraActive] = useState(false); // false until stream is confirmed active
  const [stream, setStream] = useState(null);
  const [currentQ, setCurrentQ] = useState(0); // Shuffled array index
  const [answers, setAnswers] = useState({}); // Keyed by ORIGINAL question index/ID
  const [markedForReview, setMarkedForReview] = useState({}); // Keyed by ORIGINAL index
  const [visited, setVisited] = useState({}); // Keyed by ORIGINAL index
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [submitted, setSubmitted] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceBoxes, setFaceBoxes] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResultsByQuestion, setExecutionResultsByQuestion] = useState(
    {},
  );
  const [showConfirm, setShowConfirm] = useState(false);
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const [isFAQOpen, setIsFAQOpen] = useState(false);
  const [exitPassword, setExitPassword] = useState("");
  const [exitError, setExitError] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [terminated, setTerminated] = useState(null);
  const [terminateCountdown, setTerminateCountdown] = useState(8);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [needsInteraction, setNeedsInteraction] = useState(
    !document.fullscreenElement,
  );
  const [isFullscreen, setIsFullscreen] = useState(
    !!document.fullscreenElement,
  );
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [isOffline, setIsOffline] = useState(!window.navigator.onLine);
  const [selectedLanguages, setSelectedLanguages] = useState({});
  const [confidence] = useState(98);
  const [broadcastMessage, setBroadcastMessage] = useState(null);
  const [helpStatus, setHelpStatus] = useState("idle");
  const [isTabViolation, setIsTabViolation] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [activeWarning, setActiveWarning] = useState(null);
  const [camError, setCamError] = useState(false);
  const [settings, setSettings] = useState(null);
  const [headerAlert, setHeaderAlert] = useState(null);

  // Layout state
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Test Cases");
  const [editorHeight, setEditorHeight] = useState(55);
  const [panelWidth, setPanelWidth] = useState(42);
  const isResizing = useRef(false);
  const isPanelResizing = useRef(false);
  const progressRef = useRef({ answers: {}, currentQ: 0, secondsLeft: 0, visited: {} });

  // 📡 Real-time Socket Connection & Admin Communication
  useEffect(() => {
    if (!examId) return;
    
    const socket = socketService.connect();
    if (!socket) return;

    // Join room for exam-specific broadcasts
    socketService.joinExamRoom(examId);

    // Handle incoming admin messages & commands
    const handleAdminMessage = (data) => {
        const { action, message, type } = data;
        
        // Handle normal broadcasts (show in overlay + toast)
        if (type === 'broadcast') {
            setBroadcastMessage(message);
            toast(message, { icon: '📩', duration: 8000 });
            return;
        }

        // Handle commands
        if (action === 'BLOCK') {
            setIsBlocked(true);
            toast.error(message || "Your screen has been blocked by an administrator.");
        } else if (action === 'UNBLOCK') {
            setIsBlocked(false);
            toast.success("Your screen has been unblocked. You can resume.");
        } else if (action === 'TERMINATE') {
            setTerminated({ reason: message || "Exam terminated by administrator." });
            toast.error("EXAM TERMINATED", { duration: 10000 });
        } else if (type === 'direct') {
            // plain direct message (no command)
            toast(message, { icon: '💬', duration: 8000 });
            // Also show in broadcast overlay if it's important
            setBroadcastMessage(`[DIRECT] ${message}`);
        }
    };

    socketService.onAdminMessage(handleAdminMessage);

    // 🚀 BullMQ Code Evaluation Results
    const handleCodeEvaluationResult = (data) => {
      setExecutionResultsByQuestion((prev) => ({
        ...prev,
        [data.questionId]: data,
      }));
      setIsExecuting(false);
      setCooldownSeconds(10);
      toast.dismiss("code-queued");
      toast.success("Code evaluation complete!", { id: "code-eval-success" });
    };

    const handleCodeEvaluationError = (err) => {
      setExecutionResultsByQuestion((prev) => ({
        ...prev,
        [err.questionId]: { error: "Evaluation Failed", details: err.message },
      }));
      setIsExecuting(false);
      setCooldownSeconds(0);
      toast.dismiss("code-queued");
      toast.error(err.message || "Background evaluation failed.", {
        id: "code-eval-error",
      });
    };

    const handleTimeExtension = ({
      extraSeconds,
      extraMinutes,
      serverSyncTime,
    }) => {
      const networkDelay = Math.floor((Date.now() - serverSyncTime) / 1000);
      setSecondsLeft((prev) => {
        const newSeconds = prev + extraSeconds - (networkDelay > 0 ? networkDelay : 0);
        endRef.current = Date.now() + newSeconds * 1000;
        return newSeconds;
      });
      toast.success(`🚨 Exam time extended by ${extraMinutes} minutes!`, {
        icon: "⏱️",
        duration: 5000,
      });
    };

    const handleWarning = (data) => {
      setActiveWarning(data.message);
      toast(data.message, { icon: '⚠️' });
      setTimeout(() => setActiveWarning(null), 10000);
    };

    socket.on("time_extended", handleTimeExtension);
    socket.on("code_evaluation_result", handleCodeEvaluationResult);
    socket.on("code_evaluation_error", handleCodeEvaluationError);
    socket.on("warning", handleWarning);

    // 🛡️ Sync Socket if Token Refreshed
    socketService.reAuth();

    return () => {
      socketService.offAdminMessage(handleAdminMessage);
      socket.off("time_extended", handleTimeExtension);
      socket.off("code_evaluation_result", handleCodeEvaluationResult);
      socket.off("code_evaluation_error", handleCodeEvaluationError);
      socket.off("warning", handleWarning);
    };
  }, [examId]);

  const headerAlertTimer = useRef(null);
  const prevQTypeRef = useRef(null);
  const bgHiddenTimeRef = useRef(null);

  useEffect(() => {
    if (questions && questions.length > 0 && questions[currentQ]) {
      const qType = questions[currentQ].type;
      if (prevQTypeRef.current && prevQTypeRef.current !== qType) {
        const typeStr =
          qType === "mcq" ? "Sec A" : qType === "short" ? "Sec B" : "Sec C";
        setHeaderAlert(`Switched to ${typeStr}`);
        if (headerAlertTimer.current) clearTimeout(headerAlertTimer.current);
        headerAlertTimer.current = setTimeout(() => setHeaderAlert(null), 3000);
      }
      prevQTypeRef.current = qType;
    }
  }, [currentQ, questions]);

  // 🛡️ Refs for Lifecycle & Reliability (Bug Fix 6 & 7)
  const endRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    progressRef.current = { answers, currentQ, visited, secondsLeft };
  }, [answers, currentQ, visited, secondsLeft]);

  // Window resize events for CodingEnvironment panel
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizing.current) {
        // The coding panel is in the right pane, below the 48px header
        const offsetTop = 48;
        const availableHeight = window.innerHeight - offsetTop;
        const percentage = ((e.clientY - offsetTop) / availableHeight) * 100;

        // Clamp between 20% and 80% to avoid crushing either pane
        if (percentage >= 20 && percentage <= 80) {
          setEditorHeight(percentage);
        }
      }
      if (isPanelResizing.current) {
        // The coding panel is to the right of the 240px sidebar
        const offsetLeft = 240;
        const availableWidth = window.innerWidth - offsetLeft;
        const percentage = ((e.clientX - offsetLeft) / availableWidth) * 100;

        // Clamp between 20% and 80%
        if (percentage >= 20 && percentage <= 80) {
          setPanelWidth(percentage);
        }
      }
    };

    const handleMouseUp = () => {
      if (isResizing.current || isPanelResizing.current) {
        isResizing.current = false;
        isPanelResizing.current = false;
        document.body.style.cursor = "default";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const isTimeCritical = secondsLeft < 300 && secondsLeft > 0;
  const currentQuestionId =
    questions[currentQ]?.originalId ||
    questions[currentQ]?.id ||
    questions[currentQ]?._id;
  const selectedLanguage =
    currentQuestionId && selectedLanguages[currentQuestionId]
      ? selectedLanguages[currentQuestionId]
      : questions[currentQ]?.language || "javascript";

  const handleSetLanguage = useCallback(
    (lang) => {
      if (currentQuestionId) {
        setSelectedLanguages((prev) => ({
          ...prev,
          [currentQuestionId]: lang,
        }));
        setAnswers((p) => ({
          ...p,
          [currentQuestionId]: {
            code:
              typeof p[currentQuestionId] === "object" &&
              p[currentQuestionId] !== null
                ? p[currentQuestionId]?.code
                : (p[currentQuestionId] ??
                  questions[currentQ]?.initialCode ??
                  ""),
            language: lang,
          },
        }));
      }
    },
    [currentQuestionId, questions, currentQ],
  );
  const executionResult = currentQuestionId
    ? (executionResultsByQuestion[currentQuestionId] ?? null)
    : null;

  // 🛡️ Global Session Guard
  useEffect(() => {
    const token = sessionStorage.getItem("vision_token");
    const id = sessionStorage.getItem("vision_id");
    if (!token || !id) {
      console.warn("Session lost. Redirecting to login.");
      navigate("/login");
    }
  }, [navigate]);

  // 📡 Socket Connection & Broadcast Listener (DELETED - Merged Above)

  const captureAndUploadSnapshot = useCallback(
    async (type = "random") => {
      if (!videoRef.current || !sessionId) return;

      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      if (canvas.width === 0 || canvas.height === 0) return;

      canvas
        .getContext("2d")
        .drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        async (blob) => {
          if (!blob) return;
          const formData = new FormData();
          formData.append("image", blob, `snapshot_${Date.now()}.jpg`);
          formData.append("sessionId", sessionId);
          formData.append("type", type);

          try {
            await api.post("/api/upload/snapshot", formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            console.log(`Snapshot (${type}) secured to S3`);
          } catch (err) {
            console.warn("Snapshot upload failed");
          }
        },
        "image/jpeg",
        0.6,
      );
    },
    [sessionId],
  );

  const logIncident = useCallback(
    async (type, severity, details) => {
      const studentId = sessionStorage.getItem("vision_id") || sessionStorage.getItem("vision_email");
      if (!studentId) return; // Guarded by useEffect above
      const incident = {
        id: `INC-${Date.now()}`,
        examId,
        studentId,
        studentName: sessionStorage.getItem("vision_name") || studentId,
        type,
        severity,
        details,
        timestamp: new Date().toISOString(),
      };
      try {
        await api.post("/api/exams/incident", incident);
        socketService.emitViolation(incident);

        // Telemetry for Backend Rule Engine
        if (severity === "high" || severity === "critical") {
          socketService.emitViolationReport("CHEATING_FLAG", 0, examId);
          captureAndUploadSnapshot("violation");
        }
      } catch (_err) {
        console.warn("Incident log failed");
      }
    },
    [examId, captureAndUploadSnapshot],
  );

  const handleRequestHelp = async () => {
    const lastTimeStr = sessionStorage.getItem(`lastHelpReq_${examId}`);
    const now = Date.now();
    if (lastTimeStr && now - parseInt(lastTimeStr, 10) < 5 * 60 * 1000) {
      toast.error("You have already requested help recently. Please wait 5 minutes.", { position: "top-center", id: "help-cooldown" });
      return;
    }

    try {
      setHelpStatus("loading");
      await requestHelp(examId, "Student needs manual intervention or has a query.");
      sessionStorage.setItem(`lastHelpReq_${examId}`, now.toString());
      setHelpStatus("success");
      toast.success("Help Request Submitted Successfully", { position: "top-center", id: "help-success" });
      setTimeout(() => setHelpStatus("idle"), 5000);
    } catch (_err) {
      console.error("Failed to send help request.");
      setHelpStatus("error");
      toast.error("Failed to submit help request", { position: "top-center", id: "help-error" });
      setTimeout(() => setHelpStatus("idle"), 5000);
    }
  };

  // 📸 Random Snapshot Interval
  useEffect(() => {
    if (submitted || terminated || !sessionId || !cameraActive) return;

    // Random interval between 2 and 5 minutes for proctoring
    const minMs = 2 * 60 * 1000;
    const maxMs = 5 * 60 * 1000;
    let timerId;

    const scheduleNextCapture = () => {
      const timeout = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
      timerId = setTimeout(() => {
        captureAndUploadSnapshot("random");
        scheduleNextCapture();
      }, timeout);
    };

    scheduleNextCapture();
    return () => clearTimeout(timerId);
  }, [
    submitted,
    terminated,
    sessionId,
    cameraActive,
    captureAndUploadSnapshot,
  ]);

  // 🔒 Security: Fullscreen & Shortcuts
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);

      // Dynamic Check: Only enforce if Admin enabled Force Fullscreen
      const shouldForce = exam?.settings?.forceFullscreen ?? true;
      if (!isFull && !submitted && !terminated && shouldForce) {
        setNeedsInteraction(true);
        logIncident(
          "Fullscreen Exit",
          "high",
          "Student exited fullscreen mode",
        );
      }
    };

    const handleBeforeUnload = (e) => {
      if (!submitted && !terminated) {
        e.preventDefault();
        e.returnValue =
          "Are you sure you want to leave? Your exam progress might be lost.";
        return e.returnValue;
      }
    };

    const blockShortcuts = (e) => {
      // Dynamic Check: Skip blocking if Admin disabled Copy/Paste restriction
      const isRestricted = exam?.settings?.disableCopyPaste ?? true;
      if (!isRestricted) return true;

      if (
        e.ctrlKey ||
        e.metaKey ||
        ["F12", "PrintScreen"].includes(e.key) ||
        (e.altKey && e.key === "Tab")
      ) {
        e.preventDefault();
        // Shortcut Blocked incident removed as per user request to reduce noise
        // logIncident(
        //   "Shortcut Blocked",
        //   "medium",
        //   `Attempted shortcut: ${e.key}`,
        // );
        return false;
      }
    };
    const blockContextMenu = (e) => {
      const isRestricted = exam?.settings?.disableCopyPaste ?? true;
      if (!isRestricted) return true;

      e.preventDefault();
      // Right Click Blocked incident removed as per user request to reduce noise
      // logIncident("Right Click Blocked", "low", "Context menu attempt");
      return false;
    };

    // Bug 8: Tab Switch Incident Logging (Backend Authoritative)
    const handleVisibilityChange = () => {
      if (submitted || terminated) return;

      if (document.hidden) {
        bgHiddenTimeRef.current = Date.now();
      } else {
        if (bgHiddenTimeRef.current) {
          const duration = Math.floor(
            (Date.now() - bgHiddenTimeRef.current) / 1000,
          );
          socketService.emitViolationReport("TAB_HIDDEN", duration, examId);
          bgHiddenTimeRef.current = null;
          setIsTabViolation(true);
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("keydown", blockShortcuts);
    document.addEventListener("contextmenu", blockContextMenu);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Auto-check initially (though it will stay blocked, the overlay handles the reset)
    if (!document.fullscreenElement) {
      setNeedsInteraction(true);
    }

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("keydown", blockShortcuts);
      document.removeEventListener("contextmenu", blockContextMenu);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [logIncident]);

  // 🧱 Global Styles/UI Reset
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    const storedTheme = document.documentElement.getAttribute("data-theme");
    document.documentElement.removeAttribute("data-theme");
    return () => {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
      if (storedTheme)
        document.documentElement.setAttribute("data-theme", storedTheme);
    };
  }, []);

  // 📶 Offline Connectivity Detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      toast.success("Internet Restored! Submissions enabled.", {
        id: "online-toast",
      });
    };
    const handleOffline = () => {
      setIsOffline(true);
      toast.error(
        "INTERNET LOST: Some features will be disabled until connection is restored.",
        {
          id: "offline-toast",
          duration: Infinity, // Keep it visible until online
        },
      );
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 📡 Poll for Supervisor Termination
  useEffect(() => {
    if (submitted || terminated) return;
    const studentId = sessionStorage.getItem("vision_id") || sessionStorage.getItem("vision_email");
    if (!studentId) return;

    const poll = setInterval(() => {
      try {
        const list = JSON.parse(
          localStorage.getItem("vision_terminated_sessions") || "[]",
        );
        const hit = list.find(
          (t) => t.studentId === studentId && t.examId === examId,
        );
        if (hit) setTerminated(hit);
      } catch (_err) {
        console.warn("Termination poll failed");
      }
    }, 3000);
    return () => clearInterval(poll);
  }, [submitted, terminated, examId]);

  // ⏲️ Termination Countdown Effect
  useEffect(() => {
    if (!terminated) return;

    // Trigger auto-submit on termination to save student work
    if (handleFinalSubmitRef.current) {
        console.log("🔒 Termination detected: Triggering emergency auto-submit...");
        handleFinalSubmitRef.current();
    }

    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    const tick = setInterval(() => {
      setTerminateCountdown((c) => {
        if (c <= 1) {
          clearInterval(tick);
          navigate("/student");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [terminated, navigate, stream]);

  // ⏲️ Code Execution Cooldown Timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

   const handleFinalSubmit = useCallback(async () => {
    if (isSubmittingRef.current || submitted) {
      console.warn("⚠️ Submission already in progress or completed. Ignoring call.");
      return;
    }

    try {
      isSubmittingRef.current = true;
      setIsSubmitting(true);
      
      // 🛡️ Professional submission flow
      toast.loading("Finalizing your submission... Please wait.", { id: "submit-toast" });
      
      await api.post("/api/exams/submit", { 
        examId, 
        answers,
        lastUpdated: Date.now() 
      });
      
      await storageService.deleteProgress(examId);
      
      // 📸 Fix 3: Explicitly stop camera tracks for privacy
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
        setStream(null);
        setCameraActive(false);
      }
      
       toast.success("Exam submitted successfully!", { id: "submit-toast" });
      setSubmitted(true);
    } catch (err) {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      console.error("Submission error:", err);
      toast.error(
        err.response?.data?.message || err.message || "Submission failed! Please try again.", 
        { id: "submit-toast" }
      );
    }
  }, [examId, answers, stream, submitted]);

  const handleFinalSubmitRef = useRef(handleFinalSubmit);
  useEffect(() => {
    handleFinalSubmitRef.current = handleFinalSubmit;
  }, [handleFinalSubmit]);

  // ⏱️ Exam Timer (Absolute Drift-Free Sync)
  // FIX: handleFinalSubmit removed from dependency array to prevent timer reset during typing
  useEffect(() => {
    if (submitted || terminated || secondsLeft < 0) return;

    const tick = () => {
      if (endRef.current) {
        const remainingMs = Math.max(0, endRef.current - Date.now());
        const remainingSec = Math.floor(remainingMs / 1000);

        if (remainingSec === 0 && secondsLeft > 0 && !isSubmittingRef.current) {
          setSecondsLeft(0);
          handleFinalSubmitRef.current();
        } else {
          setSecondsLeft(remainingSec);
        }
      }
    };

    const interval = setInterval(tick, 1000);

    // Re-sync on tab focus
    const handleFocus = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [submitted, terminated]);

  // 🏢 Fetch Exam + Seeded Shuffle + Resume Data
  useEffect(() => {
    const fetchExam = async (retryCount = 0) => {
      // Clear any previous retry toasts
      toast.dismiss("exam-retry");

      // On first attempt, show a professional loading indicator instead of waiting for error
      let loadingToast = null;
      if (retryCount === 0) {
        loadingToast = toast.loading("Connecting to secure server...", {
          id: "exam-init",
        });
      }

      try {
        const response = await api.post("/api/exams/start", { examId });

        // Success! Clean up all initialization toasts
        if (loadingToast) toast.dismiss(loadingToast);
        toast.dismiss("exam-init");

        if (
          response.data.status === "submitted" ||
          response.data.status === "auto_submitted"
        ) {
          setSubmitted(true);
          return;
        }

        const data = response.data.exam;
        const sessionProgress = response.data;
        setExam(data);
        setSessionId(sessionProgress.sessionId);

        if (data.questions && data.questions.length > 0) {
          const mainSeedStr = examId + sessionProgress.sessionId;
          const getRNG = (salt) => generateSeed(mainSeedStr + salt);

          const processedQuestions = data.questions.map((q) => {
            const questionId = q.id || q._id;
            const processedQ = { ...q, originalId: questionId };

            if (
              processedQ.type === "mcq" &&
              processedQ.options &&
              Array.isArray(processedQ.options)
            ) {
              const optionsWithIndex = processedQ.options.map(
                (optText, optIndex) => ({
                  text: optText,
                  originalIndex: optIndex,
                }),
              );
              processedQ.displayOptions = seededShuffle(
                optionsWithIndex,
                getRNG(questionId),
              );
            } else if (processedQ.type === "mcq") {
              // Handle MCQ with missing options gracefully
              processedQ.displayOptions = [];
              console.warn(`MCQ Question ${questionId} has no options!`);
            }
            return processedQ;
          });

          const finalShuffledQuestions = seededShuffle(
            processedQuestions,
            getRNG("main_questions"),
          );
          setQuestions(finalShuffledQuestions);

          // Restore Progress
          let restoredTime =
            sessionProgress.remainingTimeSeconds ?? data.duration * 60;
          let rawAnswers = sessionProgress.answers || {};
          let startIdx = sessionProgress.currentQuestionIndex || 0;
          let rawVisited = sessionProgress.questionStates || {};

          try {
            const parsed = await storageService.getProgress(examId);
            if (parsed && parsed.remainingTimeSeconds < restoredTime) {
              restoredTime = parsed.remainingTimeSeconds;
              rawAnswers = parsed.answers || {};
              startIdx = parsed.currentQuestionIndex || 0;
              rawVisited = parsed.questionStates || {};
              api.post("/api/exams/save-progress", parsed).catch(() => {});
            }
          } catch (err) {
            console.warn("IndexedDB recovery failed");
          }

          const restoredAnswers = {};
          const restoredVisited = {};

          Object.entries(rawAnswers).forEach(([key, val]) => {
            if (!isNaN(key) && Number(key) < data.questions.length) {
              const qForIndex = data.questions[Number(key)];
              if (qForIndex)
                restoredAnswers[qForIndex.id || qForIndex._id] = val;
            } else {
              restoredAnswers[key] = val;
            }
          });

          Object.entries(rawVisited).forEach(([key, val]) => {
            if (val !== true && val !== "answered" && val !== "visited") return;
            if (!isNaN(key) && Number(key) < data.questions.length) {
              const qForIndex = data.questions[Number(key)];
              if (qForIndex)
                restoredVisited[qForIndex.id || qForIndex._id] = true;
            } else {
              restoredVisited[key] = true;
            }
          });

          setSecondsLeft(restoredTime);
          endRef.current = Date.now() + restoredTime * 1000;
          setAnswers(restoredAnswers);
          setCurrentQ(startIdx);

          // Initial Block Sync
          if (sessionProgress.status === "blocked") {
            setIsBlocked(true);
          }

          const currentId = finalShuffledQuestions[startIdx]?.originalId;
          if (currentId) restoredVisited[currentId] = true;
          setVisited(restoredVisited);

          if (finalShuffledQuestions[startIdx]?.type === "coding") {
            const startId =
              finalShuffledQuestions[startIdx].originalId ||
              finalShuffledQuestions[startIdx]._id;
            if (startId) {
              setSelectedLanguages((prev) => ({
                ...prev,
                [startId]:
                  finalShuffledQuestions[startIdx].language || "javascript",
              }));
            }
          }
        }
      } catch (err) {
        console.error("Fetch exam failed:", err);
        toast.dismiss("exam-init");

        // If it's a 403/401, don't retry, just kick them out
        if (err.response?.status === 401 || err.response?.status === 403) {
          toast.error("Session expired. Redirection to portal.");
          navigate("/student");
          return;
        }

        if (retryCount < 3) {
          const delay = retryCount === 0 ? 500 : 2500; // Fast retry first, then steady

          // No more red error toasts. We keep the 'exam-init' loading state active.
          // Optional: We can update the loading toast message to show persistence
          if (retryCount === 1) {
            toast.loading("Establishing secure connection...", {
              id: "exam-init",
            });
          }

          setTimeout(() => fetchExam(retryCount + 1), delay);
          return;
        }

        toast.error(
          err.response?.data?.message ||
            "Critical error: Connection failed. Please check your internet.",
          {
            duration: 5000,
            id: "exam-load-failure",
          },
        );
        setTimeout(() => navigate("/student"), 3000);
      }
    };
    fetchExam(0);

    // Fetch Global Settings for Exit Password (Admin/Mentor only)
    const role = sessionStorage.getItem("vision_role");
    if (role === "admin" || role === "mentor" || role === "super_mentor") {
      getSettings()
        .then((res) => {
          if (res) setSettings(res);
        })
        .catch((err) => console.error("Failed to load global settings", err));
    }
  }, [examId, navigate]);

  // 📷 Camera & AI Setup
  const initCamera = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
      setCamError(false); // Clear any prior error
      setCameraActive(true); // ✅ Only set active AFTER stream is confirmed

/* 
      const MODEL_URL =
        "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/";
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      setModelsLoaded(true);
*/

      return s;
    } catch (err) {
      console.warn("Camera/Mic permission denied");
      setCameraActive(false); // ❌ Keep disabled — show placeholder, not black video
      setCamError(true); // Show the error banner with Retry button
      // Log to telemetry
      api
        .post("/telemetry/log", {
          errorType: "CAMERA_DENIED",
          severity: "high",
          message: `Exam Cockpit camera access failed: ${err.message}`,
          metadata: { examId, errorName: err.name },
        })
        .catch(() => {});
      throw err;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    const setupCameraAndAI = async () => {
      try {
        const s = await initCamera();
        if (!mountedRef.current) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = s;

        // Start Detection Loop (Disabled as per request)

        // Track listener for permission revocation mid-session
        s.getTracks().forEach((t) => {
          t.onended = () => {
            if (mountedRef.current) {
              setCamError(true);
              setCameraActive(false); // Show placeholder if stream is killed
            }
          };
        });

      } catch (err) {
        // Error handled in initCamera
      }
    };
    setupCameraAndAI();

    return () => {
      mountedRef.current = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    };
  }, [logIncident, submitted, terminated, initCamera]);

  useEffect(() => {
    if (submitted || terminated || !examId) return;
    const saveTimer = setInterval(async () => {
      const payload = {
        examId,
        answers: progressRef.current.answers,
        currentQuestionIndex: progressRef.current.currentQ,
        questionStates: progressRef.current.visited,
        remainingTimeSeconds: progressRef.current.secondsLeft,
        lastUpdated: Date.now(), // 🏎️ Fix 5: Auto-Save Race Condition
      };
      if (!navigator.onLine) {
        await storageService.saveProgress(examId, payload);
        return;
      }
      try {
        await api.post("/api/exams/save-progress", payload);
        await storageService.deleteProgress(examId);
      } catch (err) {
        await storageService.saveProgress(examId, payload);
      }
    }, 30000);
    return () => clearInterval(saveTimer);
  }, [examId, submitted, terminated]);

  // ⚙️ Code Execution Handlers
  const handleRunCode = async () => {
    const q = questions[currentQ];
    if (q?.type !== "coding" && q?.type !== "frontend-react") return;
    if (cooldownSeconds > 0) return;

    if (q.type === "frontend-react") {
      handleCheckTestCases();
      return;
    }

    setIsExecuting(true);
    setActiveTab("Execution Details");

    // Safety net: clear spinner after 15s no matter what
    const safetyTimer = setTimeout(() => {
      setIsExecuting(false);
    }, 15000);

    try {
      const qId = q.originalId || q.id || q._id;
      setExecutionResultsByQuestion((prev) => {
        const next = { ...prev };
        delete next[qId];
        return next;
      });
      const answer = answers[qId];
      const sourceCode =
        typeof answer === "object" && answer !== null
          ? answer.code
          : answer || q.initialCode || "";
      const res = await runCodingQuestion(
        examId,
        q.id || q._id,
        sourceCode,
        selectedLanguage,
        false,
      );
      setExecutionResultsByQuestion((prev) => ({ ...prev, [qId]: res }));
      setCooldownSeconds(10);
    } catch (err) {
      const qId = q.originalId || q.id || q._id;
      setExecutionResultsByQuestion((prev) => ({
        ...prev,
        [qId]: { error: "Failed", details: err.message },
      }));
      if (err.error === "Cooldown Active") setCooldownSeconds(10);
    } finally {
      clearTimeout(safetyTimer);
      setIsExecuting(false);
    }
  };

  const handleCheckTestCases = async () => {
    const q = questions[currentQ];
    if (q?.type !== "coding" && q?.type !== "frontend-react") return;
    if (cooldownSeconds > 0) return;

    setIsExecuting(true);
    setActiveTab("Test Cases");

    // Safety net: clear spinner after 15s no matter what
    const safetyTimer = setTimeout(() => {
      setIsExecuting(false);
    }, 15000);

    try {
      const qId = q.originalId || q.id || q._id;
      setExecutionResultsByQuestion((prev) => {
        const next = { ...prev };
        delete next[qId];
        return next;
      });
      const answer = answers[qId];

      if (q.type === "frontend-react") {
        const files =
          typeof answer === "object" && answer.files
            ? answer.files
            : q.frontendTemplate?.files || {};
        const res = await api.post(`/api/exams/run-frontend`, {
          examId,
          questionId: q.id || q._id,
          files,
        });

        if (res.data.status === "queued") {
          toast.loading("UI verification queued...", {
            id: "code-queued",
            duration: 3000,
          });
          // Spinner clears via safety timer
        } else {
          setExecutionResultsByQuestion((prev) => ({
            ...prev,
            [qId]: res.data,
          }));
          clearTimeout(safetyTimer);
          setIsExecuting(false);
          setCooldownSeconds(5);
        }
        return;
      }

      const sourceCode =
        typeof answer === "object" && answer !== null
          ? answer.code
          : answer || q.initialCode || "";
      const res = await runCodingQuestion(
        examId,
        q.id || q._id,
        sourceCode,
        selectedLanguage,
        true,
      );

      // Backend always returns results synchronously — no queue/socket needed
      setExecutionResultsByQuestion((prev) => ({ ...prev, [qId]: res }));
      clearTimeout(safetyTimer);
      setIsExecuting(false);
      setCooldownSeconds(10);
    } catch (err) {
      const qId = q.originalId || q.id || q._id;
      setExecutionResultsByQuestion((prev) => ({
        ...prev,
        [qId]: { error: "Failed", details: err.message },
      }));
      clearTimeout(safetyTimer);
      setIsExecuting(false);
      if (err.error === "Cooldown Active") setCooldownSeconds(10);
    }
  };

  const navigateTo = useCallback(
    (i) => {
      setCurrentQ(i);
      const qId =
        questions[i]?.originalId || questions[i]?.id || questions[i]?._id;
      if (qId) setVisited((v) => ({ ...v, [qId]: true }));
    },
    [questions],
  );

  const handleSecureEntry = async () => {
    if (!document.documentElement.requestFullscreen) return;
    try {
      if (exam?.settings?.forceFullscreen !== false) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
      if (exam?.settings?.enableWebcam !== false) {
        await initCamera();
      }
      setNeedsInteraction(false);
    } catch (err) {
      console.error("Secure entry failed:", err);
      toast.error("Security initialization failed. Please try again.");
    }
  };

  const q = questions[currentQ];
  const answeredCount = Object.keys(answers).length;

  const onCodeChange = useCallback(
    (v) => {
      if (!q) return;
      const qId = q.originalId || q.id || q._id;
      if (qId) {
        if (q.type === "frontend-react") {
          setAnswers((p) => ({ ...p, [qId]: { files: v.files } }));
        } else {
          setAnswers((p) => ({
            ...p,
            [qId]: { code: v, language: selectedLanguage },
          }));
        }
      }
    },
    [q, selectedLanguage],
  );

  const onMouseDown = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = "row-resize";
  }, []);

  const onPanelMouseDown = useCallback(() => {
    isPanelResizing.current = true;
    document.body.style.cursor = "col-resize";
  }, []);

  if (terminated)
    return (
      <div className="h-screen bg-black flex items-center justify-center font-sans overflow-hidden">
        <div className="text-center relative z-10 max-w-lg mx-auto px-6">
          <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-red-500/10">
            <XCircle size={40} className="text-red-500" />
          </div>
          <h2 className="text-4xl font-black text-primary mb-3 tracking-tight">
            Exam Terminated
          </h2>
          <p className="text-muted text-sm mb-8 leading-relaxed font-medium">
            {terminated.reason || "Session terminated by supervisor."}
          </p>
          <div className="flex items-center justify-center gap-3 text-sm text-red-500 font-bold border border-red-500/20 bg-red-500/5 px-6 py-3 rounded-2xl">
            <span className="w-10 h-10 rounded-full border-2 border-red-500/30 bg-black flex items-center justify-center tabular-nums text-red-500 font-black">
              {terminateCountdown}
            </span>
            <p className="uppercase tracking-widest text-[10px]">
              Redirecting to Portal
            </p>
          </div>
        </div>
      </div>
    );

  if (submitted)
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 font-sans relative overflow-hidden">
        {/* Premium Light Backdrop Effects */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-100/50 rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute bottom-0 left-20 w-80 h-80 bg-blue-50 rounded-full blur-3xl opacity-60 pointer-events-none" />

        <div className="text-center relative z-10 max-w-md w-full mx-4 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out bg-white p-10 rounded-[2rem] shadow-2xl shadow-indigo-900/5 border border-indigo-50">
          {/* Success Icon */}
          <div className="relative mb-6 inline-block animate-in zoom-in duration-500 delay-150 fill-mode-both">
            <div className="absolute inset-0 bg-emerald-100 blur-xl opacity-60 rounded-full"></div>
            <div className="w-20 h-20 bg-emerald-50 border-2 border-emerald-100 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-900/5 relative z-10">
              <CheckCircle
                size={36}
                className="text-emerald-500"
                strokeWidth={2.5}
              />
            </div>
          </div>

          {/* Titles */}
          <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
            Submission Successful
          </h2>
          <p className="text-gray-500 text-[13px] font-medium leading-relaxed mb-8 px-2">
            Your responses have been securely stored and evaluated. How would
            you rate your assessment experience?
          </p>

          {/* Star Rating System */}
          <div
            className="flex justify-center gap-3 mb-8 group"
            onMouseLeave={() => setHoverRating(0)}
          >
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = (hoverRating || rating) >= star;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  className={`p-1.5 transition-all duration-300 transform outline-none hover:scale-110 active:scale-95 ${
                    isFilled
                      ? "text-yellow-400 drop-shadow-sm"
                      : "text-gray-200 group-hover:text-gray-300"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="42"
                    height="42"
                    viewBox="0 0 24 24"
                    fill={isFilled ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth={isFilled ? "0" : "2"}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-colors duration-200"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>
              );
            })}
          </div>

          {/* Action Button */}
          <button
            onClick={() => navigate("/student")}
            className="w-full flex items-center justify-center gap-2 h-14 bg-[#1e2235] text-white rounded-xl font-bold uppercase tracking-widest text-[12px] shadow-lg shadow-[#1e2235]/20 hover:bg-[#14172a] transition-all hover:-translate-y-0.5 active:scale-95 group/btn"
          >
            Exit to Dashboard
            <span className="group-hover/btn:translate-x-1 transition-transform">
              →
            </span>
          </button>
        </div>
      </div>
    );

  return (
    <div className="h-screen w-full bg-page relative font-sans text-primary overflow-hidden">
      {/* 1. LAYER BASE: Content with Blur Wrapper */}
      <div
        className={`flex flex-col h-full w-full bg-page transition-all duration-700 ${isTabViolation || !isFullscreen ? "blur-xl grayscale pointer-events-none" : ""}`}
      >
        <style>{`.scroll-thin::-webkit-scrollbar { width: 4px; } .scroll-thin::-webkit-scrollbar-thumb { background: #1f1f1f; border-radius: 10px; }`}</style>

        <header className="shrink-0 bg-surface border-b border-main shadow-sm px-5 h-[48px] flex items-center justify-between z-30 relative">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1e2235] flex items-center justify-center shadow-lg shadow-[#1e2235]/20">
              <VisionLogo className="w-5 h-5 text-white" />
            </div>
            <span className="text-[13px] font-black tracking-widest text-primary">
              VISION
            </span>
            <div className="h-4 w-px bg-main" />
            <span className="text-[11px] font-bold text-muted uppercase tracking-widest">
              {exam?.title || "Exam"}
            </span>
          </div>

          <AnimatePresence>
            {headerAlert && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-1/2 -translate-x-1/2 bg-[#1e2235] text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg z-50 shadow-[#1e2235]/20"
              >
                {headerAlert}
              </motion.div>
            )}
          </AnimatePresence>


          <div className="flex items-center gap-6">
            <ExamTimer seconds={secondsLeft} isCritical={isTimeCritical} />
            <div className="flex items-center gap-3 pl-4 border-l border-main text-right">
              <div>
                <p className="text-[11px] font-bold leading-none text-primary">
                  {sessionStorage.getItem("vision_name") || "Candidate"}
                </p>
                <p className="text-[9px] text-muted font-bold uppercase tracking-tighter">
                  {sessionStorage.getItem("vision_email") || "VSN-USER"}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-surface border border-main flex items-center justify-center text-[10px] font-black text-primary shadow-sm">
                {(sessionStorage.getItem("vision_name") || "C").charAt(0)}
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-surface">
            <div
              className="h-full bg-[#0a0a0a] transition-all duration-700 shadow-[0_0_8px_rgba(10,10,10,0.8)]"
              style={{
                width: `${(answeredCount / Math.max(questions.length, 1)) * 100}%`,
              }}
            />
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <aside className="w-[240px] shrink-0 bg-surface border-r border-main flex flex-col shadow-sm">
            <QuestionPalette
              questions={questions}
              currentQ={currentQ}
              answers={answers}
              visited={visited}
              markedForReview={markedForReview}
              navigateTo={navigateTo}
            />
            <div className="px-3 pb-3 pt-5 border-t border-main flex justify-center">
              <ProctoringSidebar
                cameraActive={cameraActive}
                videoRef={videoRef}
                faceActive={false}
                confidence={0}
                camError={camError}
                onRetryCamera={initCamera}
              />
            </div>
            <div className="h-[92px] border-t border-main shrink-0 mt-auto flex flex-col bg-surface">
              <div className="flex-1 px-3 flex flex-col justify-center">
                <button
                  onClick={handleRequestHelp}
                  disabled={helpStatus !== "idle"}
                  className={`w-full h-8 rounded-lg flex items-center justify-center gap-2 text-[12px] font-semibold tracking-tight transition-all active:scale-95 disabled:opacity-80 border ${helpStatus === "success" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : helpStatus === "error" ? "bg-red-50 text-red-600 border-red-200" : "bg-[#0a0a0a] text-white shadow-sm shadow-black/10 hover:bg-black hover:shadow-md"}`}
                >
                  <AnimatedStatusIcon
                    status={helpStatus}
                    icon={<MessageSquare size={13} />}
                    size={13}
                  />
                  {helpStatus === "success"
                    ? "Request Sent"
                    : helpStatus === "error"
                      ? "Request Failed"
                      : "Need Help?"}
                </button>
              </div>

              <div className="h-10 px-3 border-t border-main shrink-0 flex items-center justify-between gap-2 bg-gray-50/50">
                <button
                  onClick={() => setIsFAQOpen(!isFAQOpen)}
                  className={`flex-1 h-7 rounded-md flex items-center justify-center gap-1.5 text-[11px] font-semibold tracking-tight transition-all active:scale-95 border ${isFAQOpen ? "bg-[#0a0a0a] text-white border-transparent shadow-sm" : "bg-white text-[#0a0a0a] border-[#0a0a0a]/10 hover:border-[#0a0a0a]/30 hover:bg-gray-50 shadow-sm"}`}
                >
                  <Bot size={13} /> AI Chat
                </button>
                <button
                  onClick={() => setShowExitPrompt(true)}
                  className="w-7 h-7 shrink-0 rounded-md bg-white border border-[#0a0a0a]/10 text-[#0a0a0a] hover:text-white hover:bg-red-500 hover:border-red-500 transition-all flex items-center justify-center active:scale-95 shadow-sm"
                  title="Exit Session"
                >
                  <Power size={13} className="stroke-[2px]" />
                </button>
              </div>
            </div>
            {/* Encrypted Session moved to global bottom bar */}
          </aside>

          <main className="flex-1 flex overflow-hidden bg-page">
            <div className="flex-1 flex flex-col min-w-0">
              {q?.type?.toLowerCase() === "coding" ? (
                <div className="flex-1 flex min-h-0 overflow-hidden">
                  <ObjectivePanel
                    question={q}
                    index={currentQ}
                    markedForReview={markedForReview}
                    panelWidth={panelWidth}
                  />
                  <div
                    className="relative w-4 -mx-2 cursor-col-resize z-20 flex group/resizer shrink-0"
                    onMouseDown={onPanelMouseDown}
                    onMouseMove={(e) => {
                      const icon = e.currentTarget.querySelector('.grip-icon');
                      if (icon) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const y = Math.max(20, Math.min(e.clientY - rect.top, rect.height - 20));
                        icon.style.top = `${y}px`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      const icon = e.currentTarget.querySelector('.grip-icon');
                      if (icon) icon.style.top = '50%';
                    }}
                  >
                    <div className="absolute inset-y-0 left-1/2 w-[1px] bg-transparent group-hover/resizer:bg-[#1e2235]/20 transition-colors duration-200" />
                    <div className="grip-icon absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-30 opacity-0 group-hover/resizer:opacity-100 bg-surface border border-main rounded-full shadow-sm text-primary flex items-center justify-center pointer-events-none" style={{ transition: 'opacity 0.2s, top 0.05s linear' }}>
                      <ChevronsLeftRight size={14} className="m-[3px]" />
                    </div>
                  </div>
                  <CodingEnvironment
                    question={q}
                    answer={answers[currentQuestionId]}
                    onCodeChange={onCodeChange}
                    selectedLanguage={selectedLanguage}
                    setSelectedLanguage={handleSetLanguage}
                    isLangDropdownOpen={isLangDropdownOpen}
                    setIsLangDropdownOpen={setIsLangDropdownOpen}
                    editorHeight={editorHeight}
                    setEditorHeight={setEditorHeight}
                    isExecuting={isExecuting}
                    executionResult={executionResult}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onMouseDown={onMouseDown}
                  />
                </div>
              ) : q?.type?.toLowerCase() === "frontend-react" ? (
                <div className="flex-1 flex min-h-0 overflow-hidden">
                  <ObjectivePanel
                    question={q}
                    index={currentQ}
                    markedForReview={markedForReview}
                  />
                  <FrontendReactEnvironment
                    question={q}
                    answer={answers[currentQuestionId]}
                    onCodeChange={onCodeChange}
                    isExecuting={isExecuting}
                    executionResult={executionResult}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-page px-4 py-6 overflow-y-auto">
                  <div className="max-w-5xl w-full flex flex-col bg-surface rounded-xl border border-main shadow-md overflow-hidden min-h-[500px] max-h-full">
                    <div className="px-6 py-5 border-b border-main shrink-0 bg-surface">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="px-3 py-1 bg-surface-hover text-primary rounded-xl text-[11px] font-black uppercase tracking-widest border border-main shadow-sm">
                          Q{currentQ + 1}
                        </div>
                        <div className="px-3 py-1 bg-surface text-muted rounded-xl text-[11px] font-bold uppercase tracking-widest border border-main">
                          {q?.type?.toLowerCase() === "mcq"
                            ? "Choice Selection"
                            : q?.type?.toLowerCase() === "coding"
                              ? "Coding Challenge"
                              : "Written Case"}
                        </div>
                        {markedForReview[currentQuestionId] && (
                          <div className="ml-auto text-[#1e2235] bg-[#1e2235]/10 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-[#1e2235]/20 shadow-sm flex items-center gap-1.5">
                            <Bookmark size={12} fill="currentColor" /> Flagged
                          </div>
                        )}
                      </div>
                      <h2 className="text-[19px] font-medium text-primary leading-snug tracking-tight"
                        dangerouslySetInnerHTML={{ __html: q?.questionText || '' }}
                      />
                    </div>
                    <div className="p-10 flex flex-col min-h-0 bg-surface">
                      {q?.type?.toLowerCase() === "mcq" ? (
                        <div className="grid gap-4 max-w-4xl overflow-y-auto scroll-thin pr-2 pb-2">
                          {q?.displayOptions?.map((opt, i) => {
                            const isS =
                              answers[currentQuestionId] === opt.originalIndex;
                            return (
                              <button
                                key={i}
                                onClick={() =>
                                  setAnswers((p) => ({
                                    ...p,
                                    [currentQuestionId]: opt.originalIndex,
                                  }))
                                }
                                className={`w-full flex items-center gap-4 p-5 rounded-xl border-2 transition-all duration-200 text-left relative group outline-none ${
                                  isS
                                    ? "bg-slate-50 border-[#1e2235] shadow-sm"
                                    : "bg-surface border-main hover:border-indigo-300 hover:shadow-sm"
                                }`}
                              >
                                <div
                                  className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-[13px] font-bold transition-all ${
                                    isS
                                      ? "bg-[#1e2235] text-white"
                                      : "bg-surface-hover text-muted group-hover:bg-slate-50 group-hover:text-[#1e2235]"
                                  }`}
                                >
                                  {String.fromCharCode(65 + i)}
                                </div>
                                <span
                                  className={`text-[14px] leading-snug flex-1 ${
                                    isS ? "font-semibold text-[#1e2235]" : "font-medium text-muted"
                                  }`}
                                >
                                  {opt.text}
                                </span>
                                {isS && (
                                  <div className="shrink-0 w-5 h-5 rounded-full bg-[#1e2235] flex items-center justify-center animate-in zoom-in duration-300">
                                    <Check size={11} className="text-white" strokeWidth={3} />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex-1 relative flex flex-col min-h-0 animate-in fade-in duration-500">
                          <textarea
                            value={answers[currentQuestionId] || ""}
                            onChange={(e) =>
                              setAnswers((p) => ({
                                ...p,
                                [currentQuestionId]: e.target.value,
                              }))
                            }
                            placeholder="Type your structured response here..."
                            className="flex-1 w-full min-h-[280px] bg-surface-hover border-2 border-main rounded-2xl p-5 focus:bg-surface focus:border-[#1e2235] focus:ring-2 focus:ring-[#1e2235]/10 transition-all outline-none resize-none font-medium text-primary leading-relaxed text-[14px] scroll-thin placeholder:text-muted/30"
                          />
                          {(() => {
                            const words = (
                              (answers[currentQuestionId] || "").match(
                                /\S+/g,
                              ) || []
                            ).length;
                            const limit = q?.maxWords || 150;
                            const isOver = words > limit;
                            return (
                              <div
                                className={`absolute bottom-6 right-6 text-[10px] font-bold uppercase tracking-widest bg-surface/95 backdrop-blur-md px-4 py-2 rounded-xl border shadow-lg select-none pointer-events-none flex items-center gap-2 transition-colors duration-300 ${isOver ? "text-red-500 border-red-500/20" : "text-muted border-main"}`}
                              >
                                <div
                                  className={`w-1.5 h-1.5 rounded-full animate-pulse ${isOver ? "bg-red-500" : "bg-emerald-500"}`}
                                ></div>
                                {words} / {limit} Words
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <footer className="bg-surface border-t border-main shrink-0 shadow-2xl z-20 flex flex-col">
                <div className="h-[56px] px-8 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        const p = Math.max(0, currentQ - 1);
                        setCurrentQ(p);
                        const qId =
                          questions[p]?.originalId || questions[p]?._id;
                        if (qId) setVisited((v) => ({ ...v, [qId]: true }));
                      }}
                      disabled={currentQ === 0}
                      className={`h-9 px-4 flex items-center gap-2 rounded-lg text-[11px] font-bold uppercase tracking-widest border transition-all ${currentQ === 0 ? "text-muted/30 border-main opacity-50" : "text-primary border-main hover:bg-surface-hover shadow-sm active:scale-95"}`}
                    >
                      <ChevronLeft size={16} /> Back
                    </button>
                    <button
                      onClick={() => {
                        const isCurrentlyFlagged =
                          !!markedForReview[currentQuestionId];
                        setMarkedForReview((p) => ({
                          ...p,
                          [currentQuestionId]: !isCurrentlyFlagged,
                        }));

                        // Auto-advance if we are flagging the question
                        if (!isCurrentlyFlagged) {
                          setTimeout(() => {
                            if (currentQ < questions.length - 1) {
                              const n = currentQ + 1;
                              setCurrentQ(n);
                              const qId =
                                questions[n]?.originalId || questions[n]?._id;
                              if (qId)
                                setVisited((v) => ({ ...v, [qId]: true }));
                            } else {
                              setShowConfirm(true);
                            }
                          }, 200); // 200ms delay so they can visually see the button turn orange first
                        }
                      }}
                      className={`h-9 px-4 rounded-lg text-[11px] font-bold uppercase tracking-widest border transition-all ${markedForReview[currentQuestionId] ? "bg-[#1e2235] text-white border-[#1e2235] shadow-lg shadow-[#1e2235]/20" : "bg-surface text-muted border-main hover:text-primary hover:bg-surface-hover"}`}
                    >
                      {markedForReview[currentQuestionId]
                        ? "Flagged"
                        : "Flag for Review"}
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    {(q?.type?.toLowerCase() === "coding" ||
                      q?.type?.toLowerCase() === "frontend-react") && (
                      <div className="flex gap-2">
                        <button
                          onClick={handleRunCode}
                          disabled={
                            isExecuting || cooldownSeconds > 0 || isOffline
                          }
                          className={`h-9 px-4 flex items-center gap-2 rounded-lg text-[11px] font-bold uppercase tracking-widest border transition-all active:scale-95 ${isOffline ? "bg-surface text-muted/30 border-main cursor-not-allowed" : cooldownSeconds > 0 ? "bg-surface text-muted/50 border-main" : "bg-surface border-main text-muted hover:text-primary hover:bg-surface-hover hover:shadow-sm"}`}
                        >
                          {isExecuting ? (
                            <RotateCcw size={14} className="animate-spin" />
                          ) : (
                            <Play size={14} fill="currentColor" />
                          )}{" "}
                          {isOffline
                            ? "Offline"
                            : cooldownSeconds > 0
                              ? `Wait (${cooldownSeconds}s)`
                              : q?.type === "frontend-react"
                                ? "Verify UI"
                                : "Run"}
                        </button>
                        <button
                          onClick={handleCheckTestCases}
                          disabled={
                            isExecuting || cooldownSeconds > 0 || isOffline
                          }
                          className={`h-9 px-5 flex items-center gap-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 ${isOffline ? "bg-surface-hover text-muted/30 cursor-not-allowed shadow-none" : cooldownSeconds > 0 ? "bg-[#14172a] text-white cursor-not-allowed opacity-80" : "bg-[#1e2235] text-white hover:bg-[#14172a] shadow-lg shadow-[#1e2235]/20"}`}
                        >
                          {isOffline
                            ? "Internet Required"
                            : cooldownSeconds > 0
                              ? `Ready in ${cooldownSeconds}s`
                              : q?.type === "frontend-react"
                                ? "Check Results"
                                : "Submit Code"}
                        </button>
                      </div>
                    )}
                    <div className="h-6 w-px bg-main mx-2" />
                    <button
                      onClick={() => {
                        if (currentQ < questions.length - 1) {
                          const n = currentQ + 1;
                          setCurrentQ(n);
                          const qId =
                            questions[n]?.originalId || questions[n]?._id;
                          if (qId) setVisited((v) => ({ ...v, [qId]: true }));
                        } else {
                          setShowConfirm(true);
                        }
                      }}
                      disabled={isOffline}
                      className={`h-9 px-6 rounded-lg text-[12px] font-bold uppercase tracking-widest transition-all ${isOffline ? "bg-surface-hover text-muted/30 cursor-not-allowed shadow-none" : currentQ === questions.length - 1 ? "bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 active:scale-95" : "bg-[#1e2235] text-white shadow-lg hover:bg-[#14172a] active:scale-95"}`}
                    >
                      {isOffline
                        ? "Offline"
                        : currentQ === questions.length - 1
                          ? "Submit"
                          : "Save & Next"}
                      {currentQ !== questions.length - 1 && (
                        <ChevronRight
                          size={16}
                          className="ml-2 inline-block opacity-70"
                        />
                      )}
                    </button>
                  </div>
                </div>

                <div className="h-10 bg-surface border-t border-main flex items-center justify-between px-8">
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />{" "}
                    Encrypted Session
                  </span>
                </div>
              </footer>
            </div>
          </main>
        </div>
      </div>

      {/* 2. LAYER OVERLAY: Modals and Alerts (Never Blurry) */}
      <SubmitModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        stats={{
          answered: answeredCount,
          total: questions.length,
          marked: Object.values(markedForReview).filter(Boolean).length,
        }}
        password={exitPassword}
        setPassword={setExitPassword}
        error={exitError}
        onConfirm={() => {
          const targetPass = settings?.exitPassword || "12345";
          if (!settings?.exitPassword || exitPassword === targetPass) {
            handleFinalSubmit();
          } else {
            setExitError("Incorrect Password");
          }
        }}
      />
      <ExitModal
        isOpen={showExitPrompt}
        onClose={() => setShowExitPrompt(false)}
        password={exitPassword}
        setPassword={setExitPassword}
        error={exitError}
        onExit={() => {
          const targetPass = settings?.exitPassword || "12345"; // Fallback to 12345 if not set or failed to load
          if (!settings?.exitPassword || exitPassword === targetPass) {
            window.removeEventListener("beforeunload", () => {});
            navigate("/student");
          } else {
            setExitError("Incorrect Password");
          }
        }}
      />
      <TabViolationOverlay
        isOpen={isTabViolation}
        onResume={() => setIsTabViolation(false)}
      />
      <TabToast toast={tabToast} />

      {/* Fullscreen Guard */}
      {!isFullscreen && !submitted && !terminated && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-surface rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-main text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#1e2235]/10 text-[#1e2235] mb-6 mx-auto flex items-center justify-center border border-[#1e2235]/20 shadow-sm relative">
              <ShieldAlert size={28} strokeWidth={2.5} />
              <div className="absolute top-0 right-0 -mt-1 -mr-1 w-3 h-3 bg-[#1e2235] rounded-full animate-ping" />
              <div className="absolute top-0 right-0 -mt-1 -mr-1 w-3 h-3 bg-[#1e2235] rounded-full border-2 border-black" />
            </div>
            <h2 className="text-2xl font-bold text-primary mb-3 tracking-tight">
              Security Violation
            </h2>
            <p className="text-[14px] font-medium text-muted mb-8 leading-relaxed px-2">
              Fullscreen mode is mandatory for exam integrity. This incident has
              been recorded and flagged for the examiner.
            </p>
            <button
              onClick={() => document.documentElement.requestFullscreen()}
              className="w-full h-12 rounded-xl bg-[#1e2235] hover:bg-[#14172a] text-white transition-all text-[13px] font-bold shadow-xl shadow-[#1e2235]/20 active:scale-95 flex items-center justify-center gap-2"
            >
              Restore Secure Session
            </button>
            <div className="mt-6 flex items-center justify-center gap-2 text-[11px] font-semibold text-muted">
              <LockIcon size={12} />
              <span>Secure Environment Enforced</span>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {activeWarning && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[2000] flex justify-center pointer-events-none"
          >
            <div className="bg-red-600 text-white px-8 py-4 rounded-2xl shadow-2xl border-4 border-white flex items-center gap-4 max-w-2xl text-center pointer-events-auto">
              <ShieldAlert size={32} className="animate-bounce shrink-0" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">
                  Supervisor Warning
                </p>
                <p className="text-xl font-black uppercase">{activeWarning}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📡 Live Broadcast Overlay */}
      <AnimatePresence>
        {broadcastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-[250] pointer-events-none"
          >
            <div className="bg-surface text-primary px-6 py-4 rounded-2xl shadow-2xl flex items-start gap-4 max-w-xl border border-main ring-8 ring-[#1e2235]/5 pointer-events-auto">
              <div className="bg-white/20 p-2 rounded-xl shrink-0 mt-0.5">
                <Radio size={20} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">
                  Live Announcement
                </h3>
                <p className="text-sm font-semibold leading-relaxed text-white">
                  {broadcastMessage}
                </p>
              </div>
              <button
                onClick={() => setBroadcastMessage(null)}
                className="ml-2 p-1 hover:bg-surface-hover rounded-lg transition-colors text-muted hover:text-primary"
              >
                <XCircle size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Needs Interaction Overlay */}
      <AnimatePresence>
        {needsInteraction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#1e2235]/5 via-transparent to-[#1e2235]/10" />
            <div className="relative z-10 max-w-md">
              <div className="w-20 h-20 rounded-3xl bg-[#1e2235] flex items-center justify-center shadow-2xl mb-10 mx-auto animate-bounce shadow-[#1e2235]/20">
                <Shield size={40} className="text-white" />
              </div>
              <h1 className="text-4xl font-black text-primary tracking-tighter mb-4 uppercase italic">
                Secure Environment
              </h1>
              <p className="text-muted text-sm mb-12 leading-relaxed">
                To maintain integrity, this assessment requires a locked
                environment. Please re-enter the secure perimeter to continue.
              </p>
              <button
                onClick={handleSecureEntry}
                className="w-full h-14 bg-[#1e2235] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-[#14172a] transition-all flex items-center justify-center gap-3 active:scale-95 shadow-[#1e2235]/20"
              >
                <LockIcon size={18} /> Initialize Secure Entry
              </button>
              <p className="mt-8 text-[9px] font-black text-muted uppercase tracking-widest flex items-center justify-center gap-2">
                <Monitor size={12} /> Encrypted Session • Biometric Link Enabled
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <FullBlockOverlay isOpen={isBlocked} />

      <StudentMessageModal 
        userId={sessionStorage.getItem("vision_id") || sessionStorage.getItem("vision_email")} 
        examId={examId}
      />
      <FAQBot 
        examId={examId} 
        userId={sessionStorage.getItem("vision_id") || sessionStorage.getItem("vision_email")} 
        isOpen={isFAQOpen}
        onClose={() => setIsFAQOpen(false)}
      />
      

    </div>
  );
}

// 🎲 Randomization Helpers
function generateSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  let seed = Math.abs(hash) || 1;
  return function () {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}
function seededShuffle(array, randomFunc) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(randomFunc() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
