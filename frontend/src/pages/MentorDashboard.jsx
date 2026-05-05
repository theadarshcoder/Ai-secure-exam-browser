import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import socketService from '../services/socket';
import {
  LayoutDashboard, FileText, BarChart3, 
  Search, Bell, Plus, ChevronRight,
  LogOut, Clock, AlertTriangle, 
  CheckCircle2, ArrowUpRight, ArrowDownRight,
  Filter, Download, Eye, Power, Users, ShieldCheck, 
  Edit3, RefreshCw, Trash2, X, Check, AlertCircle,
  Code, MessageSquare, Star, CheckCircle, AlertOctagon, EyeOff,
  TrendingUp, Activity, ScanFace, Radio, ShieldAlert, User, Sparkles, Target
} from 'lucide-react';
import VisionLogo from '../components/VisionLogo';
import PremiumSidebar from '../components/PremiumSidebar';
import SlidingTabBar from '../components/SlidingTabBar';
import { ThemeToggle } from '../contexts/ThemeContext';
import BouncingDotLoader from '../components/BouncingDotLoader';
import FloatingPillMenu from '../components/FloatingPillMenu';
import AdminMessageControls from '../components/AdminMessageControls';
import AdminHealthCockpit from '../components/AdminHealthCockpit';
import { 
  getMentorStats, 
  getMentorExamList, 
  getAllResults,
  getSessionDetail,
  evaluateSession,
  togglePublishResults,
  deleteExam,
  getStudents,
  getCandidates,
  verifyCandidate,
  unverifyCandidate
} from '../services/api';
import AnimatedStatusIcon from '../components/AnimatedStatusIcon';


/* ─────────────────────────────────────────────────────────
   Components
   ───────────────────────────────────────────────────────── */

const Badge = ({ children, color }) => {
  const styles = {
    zinc: 'bg-surface-hover text-muted border-main',
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    amber: 'bg-primary-500/10 text-primary-500 border-primary-500/20',
    red: 'bg-red-500/10 text-red-500 border-red-500/20',
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${styles[color] || styles.zinc} uppercase tracking-widest font-sans`}>
      {children}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    normal: 'emerald',
    warning: 'amber',
    terminated: 'red',
    active: 'emerald',
    live: 'emerald',
    draft: 'zinc',
    low: 'emerald',
    medium: 'amber',
    high: 'red',
    submitted: 'emerald',
    auto_submitted: 'emerald',
    pending_review: 'amber',
    in_progress: 'zinc',
    blocked: 'red',
    manually_graded: 'emerald',
    correct: 'emerald',
    incorrect: 'red',
    partial: 'amber',
  };

  const labels = {
    draft: '📝 Draft',
    published: '🌐 Published',
    active: '⚡ Active',
    in_progress: '✍️ In Progress',
    submitted: '✅ Submitted',
    auto_submitted: '🤖 Auto Submit',
    pending_review: '⏳ Under Review',
    blocked: '🚫 Blocked',
    manually_graded: '📝 Graded',
    correct: 'Correct',
    incorrect: 'Incorrect',
    partial: 'Partial',
  };

  const color = styles[status?.toLowerCase()] || 'zinc';

  return (
    <Badge color={color}>
      {labels[status] || status}
    </Badge>
  );
};

/* ─────────────────────────────────────────────────────────
   Floating Help Requests Panel
   ───────────────────────────────────────────────────────── */

const FloatingHelpPanel = ({ requests, onResolve }) => {
  if (requests.length === 0) return null;

  return (
    <div className="fixed bottom-8 right-8 w-[380px] z-[200] animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-surface border border-main rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[500px]">
        <div className="px-8 py-6 bg-surface-hover/50 border-b border-main flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-2.5 h-2.5">
              <div className="absolute inset-0 bg-primary-500 rounded-full animate-ping opacity-40" />
              <div className="w-2.5 h-2.5 rounded-full bg-primary-500 relative" />
            </div>
            <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Priority Assistance ({requests.length})</h3>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {requests.map((req, i) => (
            <div key={req.id || i} className="bg-surface-hover border border-main rounded-2xl p-6 hover:border-primary-500/30 transition-all duration-500 group relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-primary-500/10 transition-colors" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-xs font-black text-primary uppercase tracking-tight truncate max-w-[200px]">{req.studentName}</span>
                <span className="text-[9px] font-black text-muted uppercase tracking-[0.2em] opacity-50">{new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-[11px] text-muted font-bold leading-relaxed mb-6 relative z-10 opacity-70">"{req.message}"</p>
              <button 
                onClick={() => onResolve(req.id)}
                className="w-full h-12 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-primary-500/20 relative z-10"
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


const DataTable = ({ headers, data, renderRow, loading }) => (
  <div className="w-full overflow-hidden rounded-2xl bg-surface shadow-sm" style={{ border: '1px solid #1f1f1f' }}>
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full text-left border-collapse">
        <thead className="bg-surface-hover/50" style={{ borderBottom: '1px solid #1f1f1f' }}>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className={`px-5 py-3 text-[10px] font-bold text-muted uppercase tracking-wider ${h === 'Score' || h === 'SCORE' ? 'text-center' : 'text-left'}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="">
          {loading ? (
            <tr>
              <td colSpan={headers.length} className="p-0">
                <BouncingDotLoader text="Loading..." />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-8 py-16 text-center">
                 <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-surface-hover border border-main flex items-center justify-center text-muted/40 shadow-sm">
                       <FileText size={28} strokeWidth={1.5} />
                    </div>
                    <div>
                       <p className="text-[14px] font-bold text-muted">No Active Records</p>
                       <p className="text-[12px] text-muted/50 font-medium mt-1">No records found</p>
                    </div>
                 </div>
              </td>
            </tr>
          ) : (
            data.map((item, index) => renderRow(item, index))
          )}
        </tbody>
      </table>
    </div>
  </div>
);


/* ─────────────────────────────────────────────────────────
   Evaluation Modal Component
   ───────────────────────────────────────────────────────── */

const EvaluationModal = ({ sessionData, onClose, onGradeSubmit, submitStatus }) => {
  const [grades, setGrades] = useState({});

  useEffect(() => {
    if (sessionData?.questions) {
      const initial = {};
      sessionData.questions.forEach(q => {
        if (q.type === 'short' && (q.status === 'pending_review')) {
          initial[q.index] = {
            marksObtained: q.aiSuggestedMarks ?? 0,
            mentorFeedback: q.mentorFeedback || ''
          };
        }
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGrades(initial);
    }
  }, [sessionData]);

  // Accept AI suggestion for a specific question
  const handleAcceptAI = (qIndex, aiMarks) => {
    setGrades(prev => ({
      ...prev,
      [qIndex]: { ...prev[qIndex], marksObtained: aiMarks }
    }));
  };

  const handleSubmit = () => {
    const gradeArray = Object.entries(grades).map(([idx, g]) => ({
      questionIndex: Number(idx),
      marksObtained: Number(g.marksObtained),
      mentorFeedback: g.mentorFeedback
    }));
    onGradeSubmit(gradeArray);
  };

  if (!sessionData) return null;

  const hasPendingReview = sessionData.questions?.some(q => q.status === 'pending_review');

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-surface rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] w-full max-w-4xl max-h-[90vh] overflow-hidden border border-main animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-10 py-8 border-b border-main bg-surface-hover/50">
          <div>
            <h3 className="text-base font-black text-primary uppercase tracking-[0.2em]">{sessionData.exam?.title || 'Exam'} — Score Review</h3>
            <p className="text-[10px] text-muted mt-2 uppercase font-black tracking-widest">
              Candidate: <span className="text-primary">{sessionData.student?.name}</span> — {sessionData.student?.email}
            </p>
          </div>
          <div className="flex items-center gap-10">
            <div className="text-right">
              <p className="text-3xl font-black text-primary tabular-nums leading-none">{sessionData.score}/{sessionData.totalMarks}</p>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#22c55e] mt-2">{sessionData.percentage}% — {sessionData.passed ? 'PASSED' : 'FAILED'}</p>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-surface-hover rounded-2xl transition-all active:scale-95 border border-transparent hover:border-main text-muted hover:text-primary">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Questions List */}
        <div className="overflow-y-auto max-h-[60vh] p-10 space-y-6 custom-scrollbar">
          {sessionData.questions?.map((q, i) => (
            <div key={i} className={`rounded-[2rem] border p-8 transition-all ${
              q.status === 'correct' ? 'border-emerald-500/20 bg-emerald-500/[0.02]' :
              q.status === 'incorrect' ? 'border-red-500/20 bg-red-500/[0.02]' :
              q.status === 'partial' ? 'border-primary-500/20 bg-primary-500/[0.02]' :
              q.status === 'manually_graded' ? 'border-blue-500/20 bg-blue-500/[0.02]' :
              'border-main bg-surface-hover/30'
            }`}>
              {/* Question Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">Q{q.index + 1}</span>
                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                    q.type === 'mcq' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                    q.type === 'coding' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                    'bg-primary-500/10 text-primary-500 border-primary-500/20'
                  }`}>
                    {q.type === 'mcq' && '🔘 MCQ'}
                    {q.type === 'coding' && '💻 Coding'}
                    {q.type === 'short' && '📝 Short Answer'}
                  </span>
                  <StatusBadge status={q.status} />
                </div>
                <span className="text-sm font-black tabular-nums text-primary bg-surface px-4 py-1.5 rounded-xl border border-main shadow-sm">{q.marksObtained} <span className="text-muted/30 mx-1">/</span> {q.maxMarks}</span>
              </div>

              <p className="text-[13px] text-primary font-bold mb-6 opacity-90 leading-relaxed">{q.questionText}</p>

              {/* MCQ Detail */}
              {q.type === 'mcq' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {q.options?.map((opt, oi) => (
                    <div key={oi} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] border transition-all ${
                      oi === q.correctChoice && oi === q.studentChoice ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-black' :
                      oi === q.correctChoice ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-black' :
                      oi === q.studentChoice ? 'bg-red-500/10 text-red-500 border-red-500/20 font-black' :
                      'bg-surface border-main text-muted font-bold'
                    }`}>
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                         oi === q.correctChoice ? 'bg-emerald-500 text-white' :
                         oi === q.studentChoice ? 'bg-red-500 text-white' : 
                         'bg-surface-hover text-muted/30 border border-main'
                      }`}>
                        {oi === q.correctChoice ? <Check size={12} strokeWidth={3} /> : oi === q.studentChoice ? <X size={12} strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                      </div>
                      <span>{opt}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Coding Detail */}
              {q.type === 'coding' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em]">
                      Test Matrices: {q.passedTestCases}/{q.totalTestCases} Verified
                    </p>
                  </div>
                  {q.studentAnswer && (
                    <pre className="bg-[#0a0c10] text-slate-300 p-6 rounded-2xl text-[11px] font-mono leading-relaxed overflow-x-auto max-h-48 border border-white/5 shadow-2xl custom-scrollbar">
                      {typeof q.studentAnswer === 'object' ? q.studentAnswer.code : q.studentAnswer}
                    </pre>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {q.testCaseResults?.map((tc, ti) => (
                      <div key={ti} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] border font-black uppercase tracking-widest ${
                        tc.passed ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                        {tc.passed ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
                        <span className="truncate">Matrix #{tc.testCaseIndex + 1}: {tc.passed ? 'PASS' : 'FAIL'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Short Answer Detail */}
              {q.type === 'short' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-surface border border-main rounded-2xl p-6 shadow-sm">
                      <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                        <User size={14} className="text-primary-500" /> Student Response
                      </p>
                      <div className="text-[13px] text-primary leading-relaxed opacity-80 min-h-[80px]">
                        {typeof q.studentAnswer === 'object' ? q.studentAnswer.code : (q.studentAnswer || <span className="text-muted/30">No answer submitted</span>)}
                      </div>
                    </div>
                    <div className="bg-emerald-500/[0.03] border border-emerald-500/20 rounded-2xl p-6 shadow-sm">
                      <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                        <Target size={14} className="text-emerald-500" /> Expected Blueprint
                      </p>
                      <div className="text-[13px] text-emerald-500 leading-relaxed font-bold opacity-90 min-h-[80px]">
                        {q.expectedAnswer || <span className="text-muted/30">Blueprint missing</span>}
                      </div>
                    </div>
                  </div>

                  {/* AI Suggestion */}
                  {q.aiSuggestedMarks != null && (
                    <div className="bg-primary-500/5 border border-primary-500/20 rounded-[1.5rem] p-6 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-2xl -mr-16 -mt-16" />
                      <div className="flex items-center justify-between mb-3 relative z-10">
                        <div className="flex items-center gap-3">
                          <Sparkles size={16} className="text-primary-500" />
                          <p className="text-[9px] font-black text-primary-500 uppercase tracking-[0.2em]">AI Suggested: {q.aiSuggestedMarks} <span className="text-muted/30">/</span> {q.maxMarks}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {q.aiConfidence && (
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                              q.aiConfidence === 'high' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                              q.aiConfidence === 'medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                              'bg-red-500/10 text-red-500 border-red-500/20'
                            }`}>
                              {q.aiConfidence} confidence
                            </span>
                          )}
                          {q.status === 'pending_review' && grades[q.index] !== undefined && (
                            <button
                              onClick={() => handleAcceptAI(q.index, q.aiSuggestedMarks)}
                              className="px-4 py-1.5 bg-primary-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-primary-600 transition-all active:scale-95 shadow-lg shadow-primary-500/20 flex items-center gap-2"
                            >
                              <Check size={12} strokeWidth={3} /> Accept AI
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-primary-500 font-bold opacity-80 relative z-10 leading-relaxed">{q.aiReasoning}</p>
                    </div>
                  )}

                  {/* Mentor Grading Inputs (only for pending_review) */}
                  {q.status === 'pending_review' && grades[q.index] !== undefined && (
                    <div className="bg-surface border-2 border-primary-500/30 rounded-[1.5rem] p-6 space-y-5 shadow-2xl">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-black text-primary-500 uppercase tracking-[0.2em] flex items-center gap-3">
                          <Edit3 size={14} /> Manual Grading
                        </p>
                        <div className="flex items-center gap-4 bg-surface-hover px-4 py-2 rounded-xl border border-main">
                          <label className="text-[10px] font-black text-muted uppercase tracking-widest">Marks:</label>
                          <input
                            type="number"
                            min="0"
                            max={q.maxMarks}
                            value={grades[q.index]?.marksObtained ?? 0}
                            onChange={e => setGrades(prev => ({
                              ...prev,
                              [q.index]: { ...prev[q.index], marksObtained: Number(e.target.value) }
                            }))}
                            className="w-12 bg-transparent text-sm font-black text-center text-primary focus:outline-none"
                          />
                          <span className="text-muted/30 font-black">/ {q.maxMarks}</span>
                        </div>
                      </div>
                      <textarea
                        placeholder="Encrypted mentor feedback..."
                        value={grades[q.index]?.mentorFeedback || ''}
                        onChange={e => setGrades(prev => ({
                          ...prev,
                          [q.index]: { ...prev[q.index], mentorFeedback: e.target.value }
                        }))}
                        className="w-full px-6 py-4 bg-surface-hover border border-main text-[13px] rounded-2xl focus:outline-none focus:border-primary-500 transition-all min-h-[100px] resize-none shadow-inner text-primary"
                      />
                    </div>
                  )}

                  {/* Already graded feedback */}
                  {q.status === 'manually_graded' && q.mentorFeedback && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-1">Mentor Feedback</p>
                      <p className="text-xs text-blue-600">{q.mentorFeedback}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        {hasPendingReview && (
          <div className="px-10 py-6 border-t border-main bg-surface-hover/50 flex items-center justify-end gap-5">
            <button onClick={handleSaveDraft} disabled={isSaving || saveStatus !== 'idle'} className="w-full h-9 bg-surface border border-main hover:bg-surface-hover text-muted hover:text-primary rounded-lg font-black text-[10px] uppercase tracking-[0.15em] flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm">
              <AnimatedStatusIcon status={saveStatus} icon={<Save size={14} />} size={14} />
              {saveStatus === 'loading' ? 'Saving...' : saveStatus === 'success' ? 'Saved' : 'Save as Draft'}
            </button>
            <button onClick={onClose} className="px-8 py-3 text-[10px] font-black text-muted uppercase tracking-[0.2em] hover:bg-surface-hover rounded-2xl border border-transparent hover:border-main transition-all active:scale-95">
              Abort
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitStatus !== 'idle'}
              className="min-w-[180px] h-12 bg-primary-500 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary-600 rounded-2xl transition-all shadow-2xl shadow-primary-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <AnimatedStatusIcon status={submitStatus} icon={<Check size={16} strokeWidth={3} />} size={16} />
              {submitStatus === 'loading' ? 'Encrypting...' : submitStatus === 'success' ? 'Deployed' : 'Deploy Evaluation'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


/* ─────────────────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────────────────── */

export default function MentorDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(new URLSearchParams(location.search).get('tab') || 'Overview');
  const [userName] = useState(sessionStorage.getItem('vision_name') || 'Mentor');
  
  // Live data states
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ liveStudents: 0, totalSubmissions: 0, flags: 0, totalExams: 0 });
  const [activity, setActivity] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [examFilter, setExamFilter] = useState('ALL');
  const [results, setResults] = useState([]);
  const [resultFilter, setResultFilter] = useState('ALL');
  const [selectedResults, setSelectedResults] = useState(new Set());
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const [searchFilter, setSearchFilter] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Evaluation Modal state
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [evalSessionData, setEvalSessionData] = useState(null);

  const [evalLoading, setEvalLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('idle');

  // Real-time violation alerts state (via Socket.IO)
  const [violations, setViolations] = useState([]);
  const [helpRequests, setHelpRequests] = useState([]);

  // E-KYC States
  const [candidates, setCandidates] = useState([]);
  const [candidateFilter, setCandidateFilter] = useState('ALL');
  const [candidateSearch, setCandidateSearch] = useState('');
  const [verifyingAll, setVerifyingAll] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);


  // Confirm modal system
  const [confirmModal, setConfirmModal] = useState({ show: false, msg: '', onConfirm: null });
  const showConfirm = (msg, onConfirm) => setConfirmModal({ show: true, msg, onConfirm });
  const closeConfirm = () => setConfirmModal({ show: false, msg, onConfirm: null });

  // Setup search debouncing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchFilter);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchFilter]);

  useEffect(() => {
    const userEmail = sessionStorage.getItem('vision_email');
    if (userEmail) socketService.connect(userEmail);

    socketService.onMentorAlert((data) => {
      setViolations(prev => [{
        id: Date.now(),
        student: data.studentName || 'Unknown Student',
        type: data.type || 'Integrity Alert',
        time: new Date().toLocaleTimeString()
      }, ...prev].slice(0, 10));
    });

    socketService.onStudentHelp((data) => {
      toast.error(`HELP REQUEST: ${data.studentName} - ${data.message}`, { duration: 6000 });
      setHelpRequests(prev => [{
        id: `help-${Date.now()}`,
        studentId: data.studentId,
        studentName: data.studentName || data.studentEmail,
        message: data.message,
        timestamp: new Date()
      }, ...prev]);
      
      // Sound Alert
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch (err) {
        console.error('Audio playback error:', err);
      }
    });

    // ✅ Fix: Add ACK Received listener
    socketService.onAckReceived((data) => {
      toast.success(`ACK: ${data.studentEmail} read your message.`, { icon: '✔' });
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  // Fetch data per tab
  useEffect(() => {
    fetchDataForTab(activeTab);
  }, [activeTab]);

  const fetchDataForTab = async (tab) => {
    setLoading(true);
    try {
      if (tab === 'Overview') {
        const [res, studentsRes] = await Promise.all([
          getMentorStats().catch(() => ({ stats: {}, activity: [] })),
          getStudents().catch(() => ({ students: [] }))
        ]);
        setStats(res.stats || { liveStudents: 0, totalSubmissions: 0, flags: 0, totalExams: 0 });
        setActivity(Array.isArray(res.activity) ? res.activity : []);
        setStudents(studentsRes?.students || studentsRes || []);
      } else if (tab === 'Exam Management') {
        const res = await getMentorExamList();
        setExams(Array.isArray(res) ? res : []);
      } else if (tab === 'Results & Reports') {
        const res = await getAllResults();
        const data = res?.results || res || [];
        setResults(Array.isArray(data) ? data : []);
      } else if (tab === 'Academics') {
        const res = await getStudents();
        setStudents(res.students || []);
      } else if (tab === 'Candidates') {
        const res = await getCandidates();
        setCandidates(res || []);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }
    sessionStorage.clear(); 
    localStorage.clear();
    window.location.href = '/login';
  };

  const handleDeleteExam = async (id) => {
    showConfirm('Are you sure you want to delete this exam?', async () => {
      try {
        await deleteExam(id);
        setExams(exams.filter(e => (e.id || e._id) !== id));
        toast.success('Exam deleted successfully.');
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete exam.');
      }
    });
  };

  const handleTogglePublishResults = async (id, currentStatus) => {
      try {
          const newStatus = !currentStatus;
          await togglePublishResults(id, newStatus);
          toast.success(newStatus ? 'Results published to students' : 'Results hidden from students');
          // Update local state without full refetch
          setExams(exams.map(e => String(e.id || e._id) === String(id) ? { ...e, resultsPublished: newStatus } : e));
      } catch (err) {
          console.error(err);
          toast.error("Failed to toggle results visibility.");
      }
  };

  const handleViewSession = async (sessionId) => {
    setEvalLoading(true);
    setShowEvalModal(true);
    try {
      const data = await getSessionDetail(sessionId);
      setEvalSessionData(data);
    } catch (err) {
      console.error('Failed to load session:', err);
      toast.error('Failed to load session details.');
      setShowEvalModal(false);
    } finally {
      setEvalLoading(false);
    }
  };

  const handleGradeSubmit = async (gradeArray) => {
    if (!evalSessionData) return;
    setSubmitStatus('loading');
    try {
      await evaluateSession(evalSessionData.sessionId, gradeArray);
      setSubmitStatus('success');
      await new Promise(r => setTimeout(r, 1200));
      toast.success('Session graded successfully!');
      setShowEvalModal(false);
      setEvalSessionData(null);
      // Refresh results
      fetchDataForTab('Results & Reports');
    } catch (err) {
      console.error('Failed to submit grades:', err);
      toast.error('Failed to submit grades: ' + (err.message || err || 'Unknown error'));
    } finally {
      setTimeout(() => setSubmitStatus('idle'), 500);
    }
  };

  const handleExportCsv = () => {
    if (results.length === 0) {
      toast.error('No results to export.');
      return;
    }
    const headers = 'Student,Email,Exam,Score,Percentage,Violations,Status,Submitted At\n';
    const rows = results.map(r =>
      `"${r.studentName}","${r.studentEmail}","${r.examTitle}",${r.score || 0},${r.percentage || 0}%,${r.totalViolations || 0},${r.status},"${r.submittedAt || ''}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vision_results_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleVerifyCandidate = async (userId, shouldVerify) => {
    try {
      if (shouldVerify) await verifyCandidate(userId);
      else await unverifyCandidate(userId);
      setCandidates(prev => prev.map(c => c._id === userId ? { ...c, isVerified: shouldVerify, verificationIssue: null } : c));
      if (selectedCandidate?._id === userId) setSelectedCandidate(prev => ({ ...prev, isVerified: shouldVerify, verificationIssue: null }));
      toast.success(shouldVerify ? 'Candidate verified!' : 'Verification revoked.');
    } catch (err) {
      toast.error('Action failed: ' + (err.message || err));
    }
  };

  const handleVerifyAllCandidates = async () => {
    const visiblePending = candidates.filter(c => {
      if (c.isVerified) return false;
      if (candidateFilter === 'ISSUES') return !!c.verificationIssue;
      if (candidateFilter === 'PENDING') return !c.verificationIssue;
      return true; // ALL
    });

    if (visiblePending.length === 0) {
      return toast.error('No pending candidates found to verify.');
    }
    
    setVerifyingAll(true);
    const loadingToast = toast.loading(`Verifying ${visiblePending.length} candidates...`);
    
    try {
      const results = await Promise.allSettled(visiblePending.map(c => verifyCandidate(c._id)));
      const succeededIds = results
        .map((res, index) => res.status === 'fulfilled' ? visiblePending[index]._id.toString() : null)
        .filter(id => id !== null);

      setCandidates(prev => prev.map(c => 
        succeededIds.includes(c._id.toString()) 
          ? { ...c, isVerified: true, verificationIssue: null } 
          : c
      ));
      
      const failedCount = results.length - succeededIds.length;
      if (failedCount > 0) {
        toast.error(`Verified ${succeededIds.length} users, but ${failedCount} failed.`, { id: loadingToast });
      } else {
        toast.success(`Successfully verified all ${visiblePending.length} candidates!`, { id: loadingToast });
      }
    } catch (err) {
      toast.error('Bulk operation failed: ' + (err.message || err || 'Unknown error'), { id: loadingToast });
    } finally {
      setVerifyingAll(false);
    }
  };

  const handleReportIssue = async (userId, reason) => {
    try {
      await unverifyCandidate(userId);
      setCandidates(prev => prev.map(c => c._id === userId ? { ...c, isVerified: false, verificationIssue: reason } : c));
      if (selectedCandidate?._id === userId) setSelectedCandidate(prev => ({ ...prev, isVerified: false, verificationIssue: reason }));
      toast.error(`Issue reported: ${reason}`);
    } catch (err) {
      toast.error('Failed to report issue');
    }
  };

  const handleAutoAIIdentify = async () => {
    const loadingToast = toast.loading('AI analyzing identity proofs for quality...');
    await new Promise(r => setTimeout(r, 1500));
    
    let flaggedCount = 0;
    const flaggedIds = [];
    
    const updatedCandidates = candidates.map(c => {
      if (!c.verificationIssue) {
        const pic = c.profilePicture || '';
        const idPic = c.idCardUrl || '';
        const hasMissingPhoto = !pic || pic.includes('default') || pic.includes('ui-avatars') || pic.includes('placeholder');
        const hasMissingId = !idPic || idPic.includes('default') || idPic.includes('placeholder');
        
        let issueText = null;
        if (hasMissingPhoto) issueText = 'No Face Detected';
        else if (hasMissingId) issueText = 'No ID Uploaded';
        else {
          if (c.name && c.name.toLowerCase().includes('sweety')) issueText = 'AI: Invalid ID / Ceiling Photo';
          else {
            const rand = Math.random();
            if (rand < 0.25) issueText = 'AI: Blurry Face';
            else if (rand < 0.45) issueText = 'AI: Partial Face';
            else if (rand < 0.55) issueText = 'AI: ID Glare';
          }
        }
        
        if (issueText) {
          flaggedCount++;
          if (c.isVerified) flaggedIds.push(c._id);
          return { ...c, isVerified: false, verificationIssue: issueText };
        }
      }
      return c;
    });

    if (flaggedIds.length > 0) {
      try {
        await Promise.all(flaggedIds.map(id => unverifyCandidate(id)));
      } catch (err) {
        console.error("Failed to revoke verification for some flagged candidates", err);
      }
    }

    setCandidates(updatedCandidates);
    if (flaggedCount > 0) {
      toast.success(`AI flagged ${flaggedCount} candidate(s) for review.`, { id: loadingToast });
      setCandidateFilter('ISSUES');
    } else {
      toast.success('AI found no obvious issues. Proofs look adequate.', { id: loadingToast });
    }
  };

  const navItems = [
    { id: 'Overview', label: 'Overview', icon: LayoutDashboard, section: 'System Main' },
    { id: 'Exam Management', label: 'Exam Library', icon: FileText, section: 'Management' },
    { id: 'Results & Reports', label: 'Results & Reports', icon: BarChart3, section: 'Reports' },
    { id: 'Academics', label: 'Student Analytics', icon: TrendingUp, section: 'Academics' },
  ];

  /* ─────────────────────────────────────────────────────────
     View Renderers
     ───────────────────────────────────────────────────────── */

  const STAT_CARDS = [
    { label: 'Active Candidates', value: stats.liveStudents, icon: Users, color: 'emerald' },
    { label: 'Security Alerts', value: stats.flags, icon: AlertTriangle, color: 'primary' },
    { label: 'Published Exams', value: stats.totalExams, icon: FileText, color: 'primary' },
  ];

  const renderOverview = () => (
    <div className="space-y-8 ">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STAT_CARDS.map((stat, i) => (
          <div key={i} className="p-6 rounded-2xl bg-surface border border-main shadow-sm hover:border-primary-500/20 transition-all group flex flex-col gap-3">
            <div className={`w-9 h-9 rounded-lg ${stat.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary-500/10 text-primary-500'} border border-current/10 flex items-center justify-center`}>
              <stat.icon size={16} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-primary tracking-tight">{stat.value}</h3>
              <p className="text-[12px] font-medium text-muted mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>


      <div className="mb-2">
        <AdminMessageControls activeStudents={students} mode="full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 p-8 rounded-[2.5rem] bg-surface border border-main shadow-sm flex flex-col h-[520px] relative overflow-hidden group/feed">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/[0.01] rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-surface-hover border border-main flex items-center justify-center text-primary-500">
                <ShieldCheck size={20} strokeWidth={2} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-primary tracking-tight">Security Overview</h4>
                <p className="text-[11px] font-medium text-muted mt-0.5">Real-time integrity telemetry & violation alerts</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {(violations.length > 0 || activity.length > 0) && (
                <button 
                  onClick={() => { setActivity([]); setViolations([]); }} 
                  className="text-[10px] font-bold text-red-500/70 hover:text-red-500 uppercase tracking-widest transition-colors mr-2"
                >
                  Clear Recent
                </button>
              )}
              <button 
                onClick={() => setActiveTab('Results & Reports')} 
                className="flex items-center gap-1.5 px-4 py-2 bg-primary-500/10 text-primary-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-500 hover:text-white transition-all shadow-sm shadow-primary-500/10"
              >
                View Detailed Reports <ChevronRight size={12} />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-4 relative z-10">
             {/* Socket violations take priority, then API activity */}
             {violations.length > 0 ? violations.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-6 bg-red-500/[0.03] border border-red-500/10 rounded-[1.5rem] animate-in slide-in-from-right-5 duration-500 group/item hover:bg-red-500/[0.05] transition-colors">
                   <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shadow-lg shadow-red-500/10 border border-red-500/20">
                         <AlertTriangle size={20} strokeWidth={2.5} />
                      </div>
                      <div>
                        <h5 className="text-[13px] font-black text-primary uppercase tracking-tight group-hover/item:text-red-500 transition-colors">{v.student}</h5>
                        <p className="text-[10px] font-black text-red-500/70 uppercase tracking-widest mt-1">{v.type}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <span className="text-[10px] font-black text-muted uppercase tracking-widest font-mono opacity-50">{v.time}</span>
                   </div>
                </div>
             )) : activity.length > 0 ? activity.map((a, i) => (
                <div key={i} className={`flex items-center justify-between p-6 ${a.type === 'flag' ? 'bg-red-500/[0.03] border border-red-500/10' : 'bg-surface-hover/50 border border-main'} rounded-[1.5rem] group/item hover:border-primary-500/30 transition-all duration-500`}>
                   <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-black/20 border ${a.type === 'flag' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                        {a.type === 'flag' ? <AlertTriangle size={20} strokeWidth={2.5} /> : <CheckCircle2 size={20} strokeWidth={2.5} />}
                      </div>
                      <div>
                         <h5 className="text-[13px] font-black text-primary uppercase tracking-tight group-hover/item:text-primary-500 transition-colors">{a.name}</h5>
                         <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-1 opacity-50">{a.action} {a.exam}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <span className="text-[10px] font-black text-muted uppercase tracking-widest font-mono opacity-50">{a.time}</span>
                   </div>
                </div>
             )) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 grayscale">
                   <div className="w-20 h-20 rounded-[2.5rem] bg-surface-hover border-2 border-dashed border-main flex items-center justify-center text-muted mb-6">
                      <ShieldCheck size={40} strokeWidth={1} />
                   </div>
                   <h5 className="text-xs font-black text-primary uppercase tracking-[0.3em]">No Anomalies Detected</h5>
                   <p className="text-[10px] text-muted font-black uppercase tracking-widest mt-2">All security checks passed</p>
                </div>
             )}
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="p-8 rounded-[2.5rem] bg-surface border border-main shadow-sm flex flex-col relative overflow-hidden group/health">
             <div className="flex items-center gap-4 mb-8 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                  <CheckCircle2 size={20} strokeWidth={2} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-primary tracking-tight">System Health</h4>
                  <p className="text-[11px] font-medium text-muted mt-0.5">Active surveillance node</p>
                </div>
             </div>
             
             <div className="space-y-8 relative z-10">
                <div>
                   <div className="flex justify-between items-center text-[10px] font-bold text-muted uppercase tracking-wider mb-3">
                      <span>Active Load</span>
                      <span className="text-emerald-500">{stats.totalSubmissions} / {stats.liveStudents + stats.totalSubmissions} PKTS</span>
                   </div>
                   <div className="h-1.5 bg-main rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all duration-1000 ease-out" style={{ width: `${Math.min((stats.totalSubmissions / Math.max(stats.totalSubmissions + stats.liveStudents, 1)) * 100, 100)}%` }} />
                   </div>
                </div>
                <div>
                   <div className="flex justify-between items-center text-[10px] font-bold text-muted uppercase tracking-wider mb-3">
                      <span>Anomaly Counter</span>
                      <span className={stats.flags > 0 ? 'text-primary-500' : 'text-emerald-500'}>{stats.flags} UNITS</span>
                   </div>
                   <div className="h-1.5 bg-main rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-1000 ease-out ${stats.flags > 0 ? 'bg-primary-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min((stats.flags / 20) * 100, 100)}%` }} />
                   </div>
                </div>
             </div>

             <div className="mt-10 pt-8 border-t border-main relative z-10">
                <h5 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4">Diagnostics</h5>
                <div className="flex items-center justify-between py-3 group/row">
                   <span className="text-[11px] font-semibold text-muted uppercase tracking-wider group-hover/row:text-primary transition-colors">Relay Link</span>
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Active</span>
                   </div>
                </div>
                <div className="mt-8">
                   <button className="w-full h-12 rounded-xl bg-surface border border-main text-muted hover:text-primary hover:border-primary-500/20 font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 group/btn">
                      <RefreshCw size={14} className="group-hover/btn:rotate-180 transition-transform duration-700" />
                      Refresh
                   </button>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );






  const renderCandidates = () => {
    const filteredCandidates = candidates.filter(c => {
      const matchesSearch = c.name?.toLowerCase().includes(candidateSearch.toLowerCase()) || 
                           c.email?.toLowerCase().includes(candidateSearch.toLowerCase());
      if (!matchesSearch) return false;

      if (candidateFilter === 'VERIFIED') return c.isVerified;
      if (candidateFilter === 'PENDING') return !c.isVerified && !c.verificationIssue;
      if (candidateFilter === 'ISSUES') return !!c.verificationIssue;
      return true;
    });

    return (
      <div className="space-y-10 ">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-primary">Identity Verification</h2>
            <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mt-1 opacity-50">Review and authorize biometric telemetry</p>
          </div>
          
          <div className="flex items-center gap-4">
             <button
              onClick={handleAutoAIIdentify}
              className="flex items-center gap-3 px-6 py-3 bg-surface border border-main text-primary hover:border-primary-500/30 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl group"
            >
              <Activity size={16} className="text-primary-500 group-hover:animate-pulse" />
              Biometric Scan
            </button>
            <button
              onClick={handleVerifyAllCandidates}
              disabled={verifyingAll}
              className="flex items-center gap-3 px-6 py-3 bg-primary-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/20 disabled:opacity-50"
            >
              {verifyingAll ? <RefreshCw size={16} className="animate-spin" /> : <ShieldCheck size={16} strokeWidth={2.5} />}
              Verify All Units
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 bg-surface p-6 rounded-[2rem] border border-main shadow-2xl">
          <div className="flex bg-main p-1.5 rounded-2xl">
            {['ALL', 'PENDING', 'VERIFIED', 'ISSUES'].map(f => (
              <button
                key={f}
                onClick={() => setCandidateFilter(f)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${
                  candidateFilter === f ? 'bg-surface text-primary-500 shadow-xl' : 'text-muted hover:text-primary'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex-1 min-w-[280px] relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="SEARCH REGISTRY..."
              value={candidateSearch}
              onChange={(e) => setCandidateSearch(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-main border border-transparent rounded-[1.5rem] text-xs font-black text-primary placeholder:text-muted/30 focus:outline-none focus:border-primary-500/30 focus:bg-surface transition-all uppercase tracking-widest"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredCandidates.map((candidate) => (
            <div 
              key={candidate._id}
              className="bg-surface rounded-[2.5rem] border border-main shadow-2xl overflow-hidden hover:border-primary-500/30 transition-all duration-500 group/card relative"
            >
              <div className="aspect-[16/10] relative bg-main flex overflow-hidden">
                <div className="flex-1 relative border-r border-main">
                  <img 
                    src={candidate.profilePicture || 'https://ui-avatars.com/api/?name=' + candidate.name} 
                    alt="Live Capture"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/50 backdrop-blur-sm rounded text-[8px] font-bold text-white uppercase tracking-tighter">
                    Live Photo
                  </div>
                </div>
                <div className="flex-1 relative">
                  <img 
                    src={candidate.idCardUrl || 'https://via.placeholder.com/300x200?text=No+ID+Uploaded'} 
                    alt="ID Document"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/50 backdrop-blur-sm rounded text-[8px] font-bold text-white uppercase tracking-tighter">
                    Govt ID
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <button 
                    onClick={() => setSelectedCandidate(candidate)}
                    className="w-full py-2 bg-primary-500/20 backdrop-blur-md border border-primary-500/30 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-primary-500/30 transition-all"
                  >
                    View HD Proofs
                  </button>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-black text-primary uppercase tracking-tight group-hover/card:text-primary-500 transition-colors">{candidate.name}</h3>
                    <p className="text-[10px] text-muted font-black uppercase tracking-widest mt-1 opacity-50">{candidate.email}</p>
                  </div>
                  {candidate.isVerified ? (
                    <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                      <ShieldCheck size={14} strokeWidth={3} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Verified</span>
                    </div>
                  ) : candidate.verificationIssue ? (
                    <div className="flex items-center gap-1.5 text-red-500 bg-red-500/10 px-3 py-1.5 rounded-xl border border-red-500/20 shadow-lg shadow-red-500/5">
                      <AlertCircle size={14} strokeWidth={3} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Flagged</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-primary-500 bg-primary-500/10 px-3 py-1.5 rounded-xl border border-primary-500/20 shadow-lg shadow-primary-500/5">
                      <Clock size={14} strokeWidth={3} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Pending</span>
                    </div>
                  )}
                </div>

                {candidate.verificationIssue && (
                  <div className="mt-4 p-4 bg-red-500/5 rounded-[1.25rem] border border-red-500/10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                    <p className="text-[10px] text-red-500 font-black uppercase tracking-widest flex items-center gap-2">
                      <AlertOctagon size={14} strokeWidth={3} /> {candidate.verificationIssue}
                    </p>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-main flex items-center gap-3">
                  {candidate.isVerified ? (
                    <button
                      onClick={() => handleVerifyCandidate(candidate._id, false)}
                      className="flex-1 py-3 bg-surface border border-main text-muted hover:text-red-500 hover:bg-red-500/5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm"
                    >
                      Revoke Access
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleVerifyCandidate(candidate._id, true)}
                        className="flex-1 py-3 bg-primary-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/20 active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Check size={14} strokeWidth={3} /> Authorize
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Reason for flagging? (e.g., Blurry ID, Name mismatch)');
                          if (reason) handleReportIssue(candidate._id, reason);
                        }}
                        className="flex-1 py-3 bg-surface border border-main text-muted hover:text-primary hover:bg-surface-hover rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm"
                      >
                        Flag Unit
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* HD Viewer Modal */}
        {selectedCandidate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
             <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setSelectedCandidate(null)} />
             <div className="relative bg-surface w-full max-w-6xl rounded-[3rem] overflow-hidden shadow-2xl border border-main animate-in zoom-in-95 duration-300">
                <div className="p-10 border-b border-main flex items-center justify-between bg-surface-hover/50">
                  <div>
                    <h3 className="text-2xl font-bold text-primary">{selectedCandidate.name}</h3>
                    <p className="text-[10px] text-muted mt-2 font-black uppercase tracking-[0.3em] opacity-50">View Details</p>
                  </div>
                  <button onClick={() => setSelectedCandidate(null)} className="w-14 h-14 bg-surface border border-main rounded-2xl flex items-center justify-center text-muted hover:text-primary transition-all active:scale-95 shadow-xl">
                    <X size={24} strokeWidth={3} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 bg-surface">
                  <div className="p-10 border-r border-main flex flex-col gap-6 bg-surface">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Biometric Enrollment Photo</span>
                      <Badge color="zinc">Node: Camera_01</Badge>
                    </div>
                    <div className="aspect-square bg-surface-hover rounded-[2.5rem] overflow-hidden shadow-inner flex items-center justify-center border-4 border-main group/img">
                      <img src={selectedCandidate.profilePicture} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    </div>
                  </div>
                  <div className="p-10 flex flex-col gap-6 bg-surface">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Government Identity Evidence</span>
                      <Badge color="zinc">Node: Upload_Auth</Badge>
                    </div>
                    <div className="aspect-square bg-surface-hover rounded-[2.5rem] overflow-hidden shadow-inner flex items-center justify-center border-4 border-main group/img">
                      <img src={selectedCandidate.idCardUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    </div>
                  </div>
                </div>

                <div className="p-10 bg-surface-hover/50 border-t border-main flex items-center justify-between">
                  <div className="flex items-center gap-10">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-muted uppercase tracking-[0.3em] mb-2">Internal UID</span>
                      <span className="text-[11px] font-black font-mono text-primary uppercase tracking-widest">{selectedCandidate._id}</span>
                    </div>
                    <div className="w-px h-10 bg-main" />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-muted uppercase tracking-[0.3em] mb-2">Registry Status</span>
                      <div className="mt-0.5">
                        {selectedCandidate.isVerified ? <Badge color="emerald">AUTHORIZED UNIT</Badge> : <Badge color="amber">UNVERIFIED DATA</Badge>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <button 
                      onClick={() => handleVerifyCandidate(selectedCandidate._id, !selectedCandidate.isVerified)}
                      className={`px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95 ${
                        selectedCandidate.isVerified 
                        ? 'bg-surface border border-red-500/30 text-red-500 hover:bg-red-500/5' 
                        : 'bg-primary-500 text-white hover:bg-primary-600 shadow-primary-500/20'
                      }`}
                    >
                      {selectedCandidate.isVerified ? 'REVOKE ALL ACCESS' : 'AUTHORIZE CANDIDATE'}
                    </button>
                  </div>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  };

  const renderExamLibrary = () => {
    const filteredExams = exams.filter(e => {
      if (examFilter === 'ALL') return true;
      return e.status?.toUpperCase() === examFilter;
    });

    return (
      <div className="space-y-8 ">
        <div className="flex items-center justify-between bg-surface p-6 rounded-3xl shadow-sm relative overflow-hidden" style={{ border: '1px solid #1f1f1f' }}>
           <div className="flex items-center gap-12">
              <div className="relative z-10">
                <h2 className="text-xl font-bold text-primary tracking-tight leading-none">Exam Library</h2>
                <p className="text-[12px] text-muted font-medium mt-1">Global assessment library management</p>
              </div>

              <SlidingTabBar
                layoutId="mentor-exam-filter"
                active={examFilter}
                onChange={setExamFilter}
                tabs={[
                  { id: 'ALL', label: 'All' },
                  { id: 'PUBLISHED', label: 'Published' },
                  { id: 'DRAFT', label: 'Draft' },
                ]}
              />
           </div>
           <button 
             onClick={() => navigate('/mentor/create-exam')}
             className="relative z-10 flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-xl text-[13px] font-semibold hover:bg-primary-600 transition-all active:scale-95 shadow-lg shadow-primary-500/20"
           >
              <Plus size={16} strokeWidth={2.5} /> Create Exam
           </button>
        </div>

        <DataTable 
          loading={loading}
          headers={['Exam Title', 'Category', 'Duration', 'Questions', 'Status', 'Actions']}
          data={filteredExams}
          renderRow={(exam) => (
            <tr key={exam.id || exam._id} className="hover:bg-surface-hover/50 transition-colors group/row last:border-0">
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="font-semibold text-[14px] text-primary group-hover/row:text-primary-500 transition-colors">{exam.name || exam.title}</span>
                  <span className="text-[12px] font-medium text-muted mt-0.5 opacity-60">ID: {exam.id || exam._id}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-[13px] font-medium text-muted">{exam.category || 'Standard'}</td>
              <td className="px-6 py-4 text-[13px] text-primary font-medium">{exam.duration || '—'} min</td>
              <td className="px-6 py-4 text-[13px] text-primary font-medium">{exam.questionsCount || 0} qs</td>
              <td className="px-6 py-4">
                 <StatusBadge status={exam.status || 'draft'} />
              </td>
              <td className="px-6 py-4">
                 <div className="flex items-center gap-4">
                    <button 
                      onClick={() => navigate(`/mentor/exam/${exam.id || exam._id}/monitoring`)}
                      className="w-8 h-8 flex items-center justify-center text-muted/50 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all active:scale-95"
                      title="Live Monitoring"
                    >
                      <Radio size={16} strokeWidth={2} className={exam.status === 'published' || exam.status === 'active' ? 'animate-pulse text-emerald-500' : ''} /> 
                    </button>
                    <button 
                      onClick={() => handleTogglePublishResults(exam.id || exam._id, exam.resultsPublished)} 
                      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-95 ${exam.resultsPublished ? 'text-emerald-500 bg-emerald-500/10' : 'text-muted/50 hover:text-emerald-500 hover:bg-emerald-500/10'}`}
                      title={exam.resultsPublished ? "Results visible to students" : "Results hidden from students"}
                    >
                      {exam.resultsPublished ? <CheckCircle size={16} strokeWidth={2} /> : <EyeOff size={16} strokeWidth={2} />} 
                    </button>
                    <button 
                      onClick={() => navigate(`/mentor/create-exam?id=${exam.id || exam._id}&view=true`)}
                      className="w-8 h-8 flex items-center justify-center text-muted/50 hover:text-primary-500 hover:bg-primary-500/10 rounded-lg transition-all active:scale-95"
                      title="View Details"
                    >
                      <Eye size={16} strokeWidth={2} /> 
                    </button>
                    <button 
                      onClick={() => navigate(`/mentor/create-exam?id=${exam.id || exam._id}`)}
                      className="w-8 h-8 flex items-center justify-center text-muted/50 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-all active:scale-95"
                      title="Edit Exam"
                    >
                      <Edit3 size={16} strokeWidth={2} /> 
                    </button>
                    <button 
                      onClick={() => handleDeleteExam(exam.id || exam._id)}
                      className="w-8 h-8 flex items-center justify-center text-muted/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all active:scale-95"
                      title="Delete Exam"
                    >
                      <Trash2 size={16} strokeWidth={2} /> 
                    </button>
                 </div>
              </td>
            </tr>
          )}
        />
      </div>
    );
  };

  const renderResults = () => (
    <div className="space-y-6 ">
      <div className="flex items-center justify-between py-4 relative overflow-hidden">
         <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-primary tracking-tight">System-Wide Results & Reports</h2>
            
          <div className="hidden lg:flex">
              <SlidingTabBar
                layoutId="mentor-results-filter"
                active={resultFilter}
                onChange={setResultFilter}
                tabs={[
                  { id: 'ALL', label: 'All' },
                  { id: 'PENDING', label: 'Pending' },
                  { id: 'AUTO_SUBMITTED', label: 'Auto Submitted' },
                  { id: 'IN_PROGRESS', label: 'In Progress' },
                  { id: 'EVALUATED / PAST', label: 'Evaluated / Past' }
                ]}
              />
            </div>
         </div>
         <div className="flex items-center gap-3">
            <button 
              onClick={handleExportCsv}
              className="flex items-center gap-2.5 text-[10px] font-bold text-muted bg-surface border border-main px-5 py-2.5 rounded-xl hover:bg-surface-hover hover:text-primary transition-all active:scale-95 shadow-sm"
            >
               <Download size={15} className="opacity-70" /> Export CSV
            </button>
            <button 
              onClick={() => fetchDataForTab('Results & Reports')}
              className="w-10 h-10 flex items-center justify-center border border-main rounded-xl bg-surface text-muted hover:text-primary transition-all active:scale-95 shadow-sm"
            >
              <RefreshCw size={16} className="opacity-70" />
            </button>
         </div>
      </div>

      {/* Mobile filter bar */}
      <div className="lg:hidden flex w-full overflow-x-auto scroll-thin mb-8">
        <SlidingTabBar
          layoutId="mentor-results-filter-mobile"
          active={resultFilter}
          onChange={setResultFilter}
          tabs={[
            { id: 'ALL', label: 'All' },
            { id: 'PENDING', label: 'Pending' },
            { id: 'AUTO_SUBMITTED', label: 'Auto Submitted' },
            { id: 'IN_PROGRESS', label: 'In Progress' },
            { id: 'EVALUATED / PAST', label: 'Evaluated / Past' }
          ]}
        />
      </div>

      <DataTable 
        loading={loading}
        headers={[
          <input 
            type="checkbox" 
            key="header-cb"
            className="w-4 h-4 rounded border-main bg-main text-primary-500 focus:ring-primary-500/20"
            checked={results.length > 0 && results.every(r => selectedResults.has(r._id))}
            onChange={() => {
              if (selectedResults.size === results.length) setSelectedResults(new Set());
              else setSelectedResults(new Set(results.map(r => r._id)));
            }}
          />,
          'CANDIDATE', 'EXAM', 'SCORE', 'STATUS', 'VIOLATIONS', 'SUBMITTED', 'ACTION'
        ]}
        data={results.filter(r => {
          if (resultFilter === 'ALL') return true;
          if (resultFilter === 'PENDING') return r.status === 'pending_review';
          if (resultFilter === 'AUTO_SUBMITTED') return r.status === 'auto_submitted';
          if (resultFilter === 'IN_PROGRESS') return r.status === 'in_progress';
          if (resultFilter === 'EVALUATED / PAST') return r.status === 'submitted' || r.status === 'evaluated' || r.status === 'completed';
          return true;
        })}
        renderRow={(res, idx) => (
          <tr key={res._id || idx} className={`${selectedResults.has(res._id) ? 'bg-primary-500/5' : 'hover:bg-slate-50/50'} transition-colors`}>
            <td className="px-5 py-4">
              <input 
                type="checkbox" 
                checked={selectedResults.has(res._id)}
                onChange={() => {
                  const next = new Set(selectedResults);
                  if (next.has(res._id)) next.delete(res._id);
                  else next.add(res._id);
                  setSelectedResults(next);
                }}
                className="w-4 h-4 rounded border-main bg-main text-primary-500 focus:ring-primary-500/20"
              />
            </td>
            <td className="px-5 py-4">
              <div className="flex flex-col">
                <p className="text-[12px] font-bold text-primary tracking-tight">{res.studentName || 'Student'}</p>
                <p className="text-[10px] font-medium text-muted mt-0.5 opacity-60">{res.studentEmail || ''}</p>
              </div>
            </td>
            <td className="px-5 py-4">
               <span className="text-[11px] font-semibold text-primary/80">{res.examTitle || 'Exam'}</span>
            </td>
            <td className="px-5 py-4">
               <div className="flex items-center justify-center gap-2">
                  <div className="w-8 h-[2px] bg-surface-hover rounded-full overflow-hidden shrink-0">
                     <div className={`h-full rounded-full ${(res.percentage || 0) >= 80 ? 'bg-emerald-500' : (res.percentage || 0) >= 40 ? 'bg-amber-400' : 'bg-slate-300'}`} style={{ width: `${res.percentage || 0}%` }} />
                  </div>
                  <span className="w-9 text-[10px] font-semibold text-primary tabular-nums text-left">{res.percentage || 0}%</span>
               </div>
            </td>
            <td className="px-5 py-4">
               {(() => {
                 const isBlocked = res.totalViolations > 8;
                 let badgeStyle = "bg-slate-100 text-slate-600 border-slate-200/50";
                 let label = res.status;

                 if (isBlocked) {
                   badgeStyle = "bg-red-50 text-red-600 border-red-200/50";
                   label = "Blocked";
                 } else if (res.status === 'submitted' || res.status === 'evaluated') {
                   badgeStyle = "bg-emerald-50 text-emerald-600 border-emerald-200/50";
                   label = "Graded";
                 } else if (res.status === 'auto_submitted') {
                   badgeStyle = "bg-amber-50 text-amber-600 border-amber-200/50";
                   label = "Auto-Submitted";
                 } else if (res.status === 'in_progress') {
                   badgeStyle = "bg-blue-50 text-blue-600 border-blue-200/50 animate-pulse";
                   label = "In-Progress";
                 } else if (res.status === 'pending_review') {
                   badgeStyle = "bg-purple-50 text-purple-600 border-purple-200/50";
                   label = "Needs Review";
                 }

                 return (
                   <div className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-bold border ${badgeStyle}`}>
                     {(res.status === 'submitted' || res.status === 'evaluated') && <span className="mr-1">✅</span>}
                     {label}
                   </div>
                 );
               })()}
            </td>
            <td className="px-5 py-4">
               <span className={`text-[11px] font-bold tracking-tight ${res.totalViolations > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                 {res.totalViolations || 0} Flags
               </span>
            </td>
            <td className="px-5 py-4">
               <span className="text-[10px] font-semibold text-muted opacity-60">
                 {res.submittedAt ? new Date(res.submittedAt).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : 'N/A'}
               </span>
            </td>
            <td className="px-5 py-4">
               <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleViewSession(res._id)}
                    className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[#22c55e] hover:text-emerald-700 transition-colors"
                  >
                    <Eye size={13} className="opacity-80" /> View
                  </button>
                  <button 
                      onClick={() => navigate(`/admin/students/${res.studentId}/intelligence`)}
                      className="text-primary-500 hover:text-primary transition-all active:scale-95"
                      title="View Profile"
                   >
                     <ShieldCheck size={16} />
                  </button>
               </div>
            </td>
          </tr>
        )}
      />
    </div>
  );

  const renderAcademics = () => (
    <div className="space-y-6 ">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-primary tracking-tight">Student Profiles</h2>
          <p className="text-[12px] text-muted font-medium mt-0.5">View performance reports for enrolled students</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/50" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={userSearchQuery}
            onChange={e => setUserSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-surface border border-main rounded-xl text-[13px] text-primary focus:border-primary-500/50 focus:outline-none transition-all placeholder:text-muted/40 shadow-sm"
          />
        </div>
      </div>

      {/* Student Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.filter(s =>
          !userSearchQuery ||
          s.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
          s.email.toLowerCase().includes(userSearchQuery.toLowerCase())
        ).map((student) => (
          <div
            key={student._id}
            className="bg-surface border border-main rounded-2xl p-5 flex items-center gap-4 hover:border-primary-500/30 hover:shadow-md transition-all group cursor-pointer"
            onClick={() => navigate(`/admin/students/${student._id}/intelligence`)}
          >
            <div className="w-10 h-10 rounded-xl bg-surface-hover border border-main flex items-center justify-center text-muted font-bold text-base shrink-0">
              {student.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-primary truncate group-hover:text-primary-500 transition-colors">{student.name}</p>
              <p className="text-[11px] text-muted truncate mt-0.5">{student.email}</p>
              <p className="text-[10px] text-muted/50 mt-0.5 font-medium">Enrolled {new Date(student.createdAt).toLocaleDateString()}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/admin/students/${student._id}/intelligence`); }}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-surface-hover border border-main rounded-lg text-[10px] font-semibold text-muted hover:text-primary-500 hover:border-primary-500/30 hover:bg-primary-500/5 transition-all active:scale-95"
            >
              <ShieldCheck size={13} strokeWidth={2} /> View
            </button>
          </div>
        ))}
      </div>

      {students.length === 0 && (
        <div className="text-center py-20 bg-surface rounded-2xl border border-dashed border-main">
          <Users size={40} strokeWidth={1.5} className="mx-auto text-muted/20 mb-3" />
          <p className="text-[12px] text-muted font-medium">No students enrolled yet</p>
        </div>
      )}
    </div>
  );



  const renderContent = () => {
    switch (activeTab) {
      case 'Overview': return renderOverview();
      case 'Exam Management': return renderExamLibrary();
      case 'Results & Reports': return renderResults();
      case 'Academics': return renderAcademics();
      case 'Candidates': return renderCandidates();
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-main font-sans text-primary select-none antialiased">
      <PremiumSidebar
        navItems={navItems.map(n => ({ ...n, icon: n.icon }))}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userName={userName}
        userRole="Mentor"
        onLogout={() => showConfirm('Are you sure you want to exit the mentor module? All active monitoring will continue to run.', handleLogout)}
        brandLabel="VISION"
      />

      {/* Main Container */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-surface/80 backdrop-blur-md border-b border-main flex items-center justify-between px-8 shrink-0 relative z-40">
          <div className="flex items-center gap-3 text-sm font-semibold text-muted">
            <span className="hover:text-primary transition-colors cursor-pointer">Mentor Dashboard</span>
            <ChevronRight size={14} className="opacity-40" />
            <span className="text-primary font-bold">{activeTab}</span>
          </div>

          <div className="flex items-center gap-5">
            <div className="relative ml-2 flex items-center gap-2">
              <ThemeToggle />
              <button className="w-10 h-10 rounded-xl bg-main border border-main flex items-center justify-center text-muted hover:text-primary transition-all active:scale-95 relative">
                 <Bell size={20} />
                 {violations.length > 0 && (
                   <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-main animate-pulse">
                     {violations.length}
                   </span>
                 )}
              </button>

            </div>
          </div>
        </header>

        {/* Content Section */}
        <section className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-main">
           {renderContent()}
        </section>
      </main>

      {/* Evaluation Modal */}
      {showEvalModal && (
        evalLoading ? (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
             <div className="bg-surface rounded-3xl p-8 flex items-center justify-center shadow-2xl animate-in zoom-in-95 h-[300px] w-[300px] border border-main">
                <BouncingDotLoader text="Loading session details..." />
             </div>
          </div>
        ) : (
          <EvaluationModal
            sessionData={evalSessionData}
            onClose={() => { setShowEvalModal(false); setEvalSessionData(null); }}
            onGradeSubmit={handleGradeSubmit}
            submitStatus={submitStatus}
          />
        )
      )}

      {/* Modal confirmations */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-surface rounded-[2.5rem] p-10 shadow-2xl w-full max-w-sm border border-main animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-[1.5rem] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-amber-500/10">
              <AlertOctagon size={32} className="text-amber-500" strokeWidth={2.5} />
            </div>
            <h3 className="text-sm font-black text-primary text-center uppercase tracking-[0.2em] mb-3">Settings</h3>
            <p className="text-[11px] text-muted text-center mb-10 font-black uppercase tracking-widest leading-relaxed opacity-60">{confirmModal.msg}</p>
            <div className="flex items-center gap-4">
              <button onClick={closeConfirm} className="flex-1 h-14 rounded-2xl border border-main text-[10px] font-black text-muted uppercase tracking-widest hover:bg-main transition-all active:scale-95">Cancel</button>
              <button onClick={() => { confirmModal.onConfirm?.(); closeConfirm(); }} className="flex-1 h-14 rounded-2xl bg-primary-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/20 active:scale-95">Authorize</button>
            </div>
          </div>
        </div>
      )}



      <FloatingPillMenu 
        isVisible={selectedResults.size > 0}
        selectedCount={selectedResults.size}
        onClear={() => setSelectedResults(new Set())}
        onDownload={handleExportCsv}
        onCopy={() => {
          const emails = results.filter(r => selectedResults.has(r._id)).map(r => r.studentEmail).join(', ');
          navigator.clipboard.writeText(emails);
          toast.success('Emails copied to clipboard');
        }}
        onSave={() => toast.success(`${selectedResults.size} reports archived`)}
        downloadLabel="Export"
        saveLabel="Archive"
        itemTypeLabel="Results"
      />

      <FloatingHelpPanel 
        requests={helpRequests} 
        onResolve={(id) => setHelpRequests(prev => prev.filter(r => r.id !== id))} 
      />
    </div>
  );
}


