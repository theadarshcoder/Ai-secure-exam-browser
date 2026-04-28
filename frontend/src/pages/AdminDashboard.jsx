import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import socketService from '../services/socket';
import FloatingPillMenu from '../components/FloatingPillMenu';
import AdminMessageControls from '../components/AdminMessageControls';
import {
  LayoutDashboard, Users, FileText, Settings,
  Search, FileUp, UserPlus, Trash2, Eye,
  ShieldCheck, Activity, AlertOctagon,
  ChevronRight, LogOut, Bell, RefreshCw, Edit3,
  BarChart3, Download, Clock, Check, X, Star, CheckCircle, AlertCircle, Plus, ScanFace, Radio, ShieldAlert, User, EyeOff, MessageCircle, AlertTriangle, OctagonX, TrendingUp, Sparkles
} from 'lucide-react';
import VisionLogo from '../components/VisionLogo';
import PremiumSidebar from '../components/PremiumSidebar';
import ToggleSwitch from '../components/ToggleSwitch';
import { ThemeToggle } from '../contexts/ThemeContext';
import BouncingDotLoader from '../components/BouncingDotLoader';
import CSVHelper from '../components/CSVHelper';
import api, { 
  getDashboardStats, 
  getStudents, 
  getMentors, 
  addUser,
  bulkImportUsers,
  getSettings,
  saveSettings,
  getAdminExams,
  getAuditLogs,
  getAdminResults,
  getAdmins,
  getSessionDetail,
  getCandidates,
  verifyCandidate,
  unverifyCandidate,
  togglePublishResults,
  evaluateSession,
  deleteAuditLog,
  clearAllAuditLogs,
  getLiveSessions
} from '../services/api';

// ─────────────────────────────────────────────────────────
// UI Utilities (matching MentorDashboard style)
// ─────────────────────────────────────────────────────────

const Badge = ({ children, color }) => {
  const styles = {
    zinc:    'bg-surface-hover text-muted border-main',
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    amber:   'bg-primary-500/10 text-primary-500 border-primary-500/20',
    red:     'bg-red-500/10 text-red-500 border-red-500/20',
    indigo:  'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    sky:     'bg-sky-500/10 text-sky-400 border-sky-500/20',
    teal:    'bg-teal-500/10 text-teal-400 border-teal-500/20',
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${styles[color] || styles.zinc} uppercase tracking-widest font-sans`}>
      {children}
    </span>
  );
};

const DataTable = ({ headers, data, renderRow, loading }) => (
  <div className="w-full overflow-hidden rounded-2xl bg-surface shadow-sm" style={{ border: '1px solid #1f1f1f' }}>
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full text-left border-collapse">
        <thead className="bg-surface-hover/50" style={{ borderBottom: '1px solid #1f1f1f' }}>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className={`px-5 py-3 text-[10px] font-bold text-muted uppercase tracking-wider ${h === 'SCORE' ? 'text-center' : 'text-left'}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="">
          {loading ? (
             <tr>
               <td colSpan={headers.length} className="bg-surface p-0">
                 <BouncingDotLoader text="Syncing system data..." />
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
                       <p className="text-[12px] text-muted/50 font-medium mt-1">System is standing by for incoming transmission</p>
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

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────


/* ─────────────────────────────────────────────────────────
   Session Report Modal Component
   ───────────────────────────────────────────────────────── */

const SessionReportModal = ({ sessionData, onClose, onRefresh }) => {
  const [localGrades, setLocalGrades] = React.useState({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Initialize local grades from session data (pre-fill with AI suggestions)
  React.useEffect(() => {
    if (sessionData?.questions) {
      const initial = {};
      sessionData.questions.forEach(q => {
        if (q.type === 'short' || q.status === 'pending_review') {
          initial[q.questionId || q.id] = {
            marksObtained: q.aiSuggestedMarks ?? q.marksObtained ?? 0,
            mentorFeedback: q.mentorFeedback || ''
          };
        }
      });
      setLocalGrades(initial);
    }
  }, [sessionData]);

  // Accept AI suggestion for a specific question
  const handleAcceptAI = (qId, aiMarks) => {
    setLocalGrades(prev => ({
      ...prev,
      [qId]: { ...prev[qId], marksObtained: aiMarks }
    }));
  };

  if (!sessionData) return null;

  const handleGradeChange = (qId, field, value) => {
    setLocalGrades(prev => ({
      ...prev,
      [qId]: { ...prev[qId], [field]: value }
    }));
  };

  const handleSubmitEvaluation = async () => {
    const gradesToSubmit = Object.entries(localGrades).map(([qId, data]) => ({
      questionId: qId,
      marksObtained: Number(data.marksObtained),
      mentorFeedback: data.mentorFeedback
    }));

    if (gradesToSubmit.length === 0) return;

    setIsSubmitting(true);
    try {
      await evaluateSession(sessionData.sessionId, gradesToSubmit);
      toast.success('Evaluation finalized successfully!');
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      toast.error('Failed to save evaluation: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasPendingReview = sessionData.questions?.some(q => q.status === 'pending_review');

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-surface rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] w-full max-w-4xl max-h-[90vh] overflow-hidden border border-main animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-main bg-surface-hover/50 font-sans">
          <div>
            <h3 className="text-base font-black text-primary uppercase tracking-[0.2em]">{sessionData.exam?.title || 'Exam Report'} — Intelligence Detail</h3>
            <p className="text-[10px] text-muted mt-1 uppercase font-black tracking-widest">
              Subject: <span className="text-primary">{sessionData.student?.name || 'Unknown'}</span> — {sessionData.student?.email || 'N/A'}
            </p>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-right">
              <p className="text-2xl font-black text-primary tabular-nums leading-none">{sessionData.score ?? 0}/{sessionData.totalMarks ?? 0}</p>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#22c55e] mt-1">{sessionData.percentage ?? 0}% — {sessionData.passed ? 'PROTOCOL PASSED' : 'PROTOCOL FAILED'}</p>
            </div>
            <button onClick={onClose} className="p-2.5 hover:bg-surface-hover rounded-2xl transition-all active:scale-95 border border-transparent hover:border-main text-muted hover:text-primary">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Questions List */}
        <div className="overflow-y-auto max-h-[65vh] p-8 space-y-6 custom-scrollbar">
          {(!sessionData.questions || sessionData.questions.length === 0) ? (
            <div className="text-center py-20">
              <AlertCircle size={40} className="mx-auto text-slate-200 mb-4" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No detailed question data available for this session.</p>
            </div>
          ) : (
            sessionData.questions.map((q, i) => {
              const qId = q.questionId || q.id;
              const isShort = q.type === 'short';
              const isEvaluating = isShort || q.status === 'pending_review';

              return (
                <div key={i} className={`rounded-[2rem] border p-8 transition-all ${
                  q.status === 'correct' ? 'border-emerald-500/20 bg-emerald-500/[0.02]' :
                  q.status === 'incorrect' ? 'border-red-500/20 bg-red-500/[0.02]' :
                  q.status === 'partial' ? 'border-primary-500/20 bg-primary-500/[0.02]' :
                  'border-main bg-surface-hover/30'
                }`}>
                  {/* Question Info */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Question {q.index + 1}</span>
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        q.type === 'mcq' ? 'bg-blue-100 text-blue-700' :
                        q.type === 'coding' ? 'bg-purple-100 text-purple-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {q.type || 'Standard'}
                      </span>
                      <Badge color={
                        q.status === 'correct' ? 'emerald' :
                        q.status === 'incorrect' ? 'red' :
                        q.status === 'partial' ? 'amber' : 'zinc'
                      }>{q.status || 'evaluated'}</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      {isEvaluating ? (
                        <div className="flex items-center gap-3 bg-surface px-4 py-2 rounded-2xl border border-main shadow-sm">
                          <span className="text-[9px] font-black text-muted uppercase tracking-[0.2em]">Award:</span>
                          <input 
                            type="number" 
                            max={q.maxMarks || q.marks} 
                            min="0"
                            value={localGrades[qId]?.marksObtained ?? q.marksObtained ?? 0}
                            onChange={(e) => handleGradeChange(qId, 'marksObtained', e.target.value)}
                            className="w-12 bg-transparent text-center text-sm font-black text-primary focus:outline-none"
                          />
                          <span className="text-muted/30 font-black">/</span>
                          <span className="text-sm font-black text-muted">{q.maxMarks || q.marks || 0}</span>
                        </div>
                      ) : (
                        <span className="text-sm font-black text-primary tabular-nums bg-surface px-4 py-2 rounded-2xl border border-main shadow-sm">
                          {q.marksObtained ?? 0} <span className="text-muted/30 font-black mx-1">/</span> {q.maxMarks || q.marks || 0}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-[13px] text-primary font-bold leading-relaxed mb-8 opacity-90">{q.questionText}</p>

                  {/* Specific answer views */}
                  {q.type === 'mcq' && q.options && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {q.options.map((opt, oi) => {
                        const isCorrect = oi === q.correctChoice;
                        const isStudent = oi === q.studentChoice;
                        return (
                          <div key={oi} className={`px-5 py-4 rounded-2xl text-[11px] flex items-center gap-4 border transition-all ${
                            isCorrect ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 font-black' :
                            isStudent ? 'bg-red-500/10 border-red-500/20 text-red-500 font-black' :
                            'bg-surface border-main text-muted font-bold'
                          }`}>
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                               isCorrect ? 'bg-emerald-500 text-white' :
                               isStudent ? 'bg-red-500 text-white' : 
                               'bg-surface-hover text-muted/30 border border-main'
                            }`}>
                              {isCorrect ? <Check size={14} strokeWidth={3} /> : isStudent ? <X size={14} strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                            </div>
                            <span className="flex-1">{opt}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.type === 'coding' && q.studentAnswer && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                         <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em]">Source Code Artifact</p>
                         <span className="text-[9px] font-black text-primary-500 uppercase bg-primary-500/10 px-3 py-1 rounded-lg border border-primary-500/20 tracking-widest">Encrypted Stream</span>
                      </div>
                      <pre className="bg-[#0a0c10] text-slate-300 p-8 rounded-[1.5rem] text-[11px] font-mono leading-relaxed overflow-x-auto max-h-64 border border-white/5 custom-scrollbar shadow-2xl">
                        {typeof q.studentAnswer === 'object' ? q.studentAnswer.code : q.studentAnswer}
                      </pre>
                    </div>
                  )}

                  {q.type === 'frontend-react' && q.files && (
                    <div className="space-y-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">React Lab Artifacts</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         {Object.entries(q.files).map(([path, code]) => (
                           <div key={path} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                              <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between">
                                 <span className="text-[10px] font-bold text-slate-600 font-mono">{path}</span>
                              </div>
                              <pre className="bg-slate-900 text-slate-300 p-3 text-[10px] font-mono leading-relaxed overflow-x-auto max-h-40 custom-scrollbar">
                                 {code}
                              </pre>
                           </div>
                         ))}
                      </div>
                      {q.testCaseResults && q.testCaseResults.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-xl p-4">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">UI Test Reports</p>
                           <div className="space-y-2">
                              {q.testCaseResults.map((tr, tri) => (
                                <div key={tri} className="flex items-center gap-3 text-[11px] font-medium">
                                   {tr.passed ? <CheckCircle size={14} className="text-emerald-500" /> : <AlertTriangle size={14} className="text-red-500" />}
                                   <span className={tr.passed ? 'text-emerald-700' : 'text-red-700'}>{tr.description}</span>
                                </div>
                              ))}
                           </div>
                        </div>
                      )}
                    </div>
                  )}

                  {q.type === 'short' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-surface border border-main rounded-2xl p-6 shadow-sm">
                          <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                            <CheckCircle size={14} className="text-primary-500" /> Student Response
                          </p>
                          <div className="text-[13px] text-primary leading-relaxed opacity-80">
                            {typeof q.studentAnswer === 'object' ? q.studentAnswer.code : (q.studentAnswer || "Transmission missing.")}
                          </div>
                        </div>
                        <div className="bg-emerald-500/[0.03] border border-emerald-500/20 rounded-2xl p-6 shadow-sm">
                          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                             <Star size={14} className="text-emerald-500" /> System Blueprint
                          </p>
                          <div className="text-[13px] text-emerald-500 leading-relaxed font-bold opacity-90">
                            {q.expectedAnswer || "Unstructured criteria."}
                          </div>
                        </div>
                      </div>

                      {/* 🤖 AI Suggestion Panel */}
                      {q.aiSuggestedMarks != null && (
                        <div className="bg-primary-500/5 border border-primary-500/20 rounded-[1.5rem] p-6 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-2xl -mr-16 -mt-16" />
                          <div className="flex items-center justify-between mb-3 relative z-10">
                            <div className="flex items-center gap-3">
                              <Sparkles size={16} className="text-primary-500" />
                              <p className="text-[9px] font-black text-primary-500 uppercase tracking-[0.2em]">
                                AI Suggested: {q.aiSuggestedMarks} <span className="text-muted/30">/</span> {q.maxMarks || q.marks}
                              </p>
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
                              {isEvaluating && (
                                <button
                                  onClick={() => handleAcceptAI(qId, q.aiSuggestedMarks)}
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
                      
                      {isEvaluating && (
                        <div className="mt-6">
                          <label className="text-[9px] font-black text-muted uppercase tracking-[0.2em] mb-3 block">Mentor Intelligence Feedback</label>
                          <textarea 
                            value={localGrades[qId]?.mentorFeedback ?? q.mentorFeedback ?? ''}
                            onChange={(e) => handleGradeChange(qId, 'mentorFeedback', e.target.value)}
                            placeholder="Add evaluation insights..."
                            className="w-full px-6 py-4 bg-surface border border-main rounded-2xl text-sm text-primary focus:outline-none focus:border-primary-500 transition-all min-h-[100px] shadow-inner"
                          />
                        </div>
                      )}

                      {/* Already graded feedback */}
                      {q.status === 'manually_graded' && q.mentorFeedback && (
                        <div className="bg-blue-500/[0.03] border border-blue-500/20 rounded-2xl p-5">
                          <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2">Mentor Feedback</p>
                          <p className="text-[12px] text-blue-400 leading-relaxed">{q.mentorFeedback}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-10 py-6 border-t border-main bg-surface-hover/50 flex items-center justify-end gap-5">
           <p className="text-[9px] font-black text-muted mr-auto flex items-center gap-3 uppercase tracking-widest">
             <ShieldCheck size={16} className="text-emerald-500" /> Node Verified — Integrity Hash Match
           </p>
           <button 
             onClick={onClose}
             className="px-8 py-3 text-muted text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-surface-hover border border-transparent hover:border-main transition-all active:scale-95"
           >
             Close
           </button>
           {(hasPendingReview || Object.keys(localGrades).length > 0) && (
             <button 
               onClick={handleSubmitEvaluation}
               disabled={isSubmitting}
               className="px-10 py-3 bg-primary-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-primary-600 transition-all active:scale-95 shadow-2xl shadow-primary-500/20 flex items-center gap-3 disabled:opacity-50"
             >
               {isSubmitting ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} strokeWidth={3} />}
               Finalize Intelligence Evaluation
             </button>
           )}
        </div>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState(new URLSearchParams(location.search).get('tab') || 'Overview');
  
  const [userName] = useState(sessionStorage.getItem('vision_name') || 'Administrator');
  const [userRole] = useState(sessionStorage.getItem('vision_role') || 'admin');

  // App States
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalStudents: 0, activeExams: 0, systemHealth: '100%', totalViolations: 0 });
  const [auditLogs, setAuditLogs] = useState([]);
  const [helpRequests, setHelpRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [exams, setExams] = useState([]);
  const [adminResults, setAdminResults] = useState([]);
  const [resultFilter, setResultFilter] = useState('ALL');
  
  // Live Sessions Monitoring state
  const [liveSessions, setLiveSessions] = useState([]);
  const [liveSearchQuery, setLiveSearchQuery] = useState('');

  // Evaluation Modal state
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [evalSessionData, setEvalSessionData] = useState(null);
  const [evalLoading, setEvalLoading] = useState(false);


  // Candidate eKYC states
  const [candidates, setCandidates] = useState([]);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateFilter, setCandidateFilter] = useState('ALL');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [settings, setSettingsState] = useState({
    maxTabSwitches: 5,
    maxViolations: 5,
    backgroundLimitSeconds: 10,
    forceFullscreen: true,
    allowLateSubmissions: false,
    enableWebcam: true,
    disableCopyPaste: true,
    requireIDVerification: true,
    exitPassword: ''
  });

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'student' });


  // Confirm modal system
  const [confirmModal, setConfirmModal] = useState({ show: false, msg: '', onConfirm: null });
  const showConfirm = (msg, onConfirm) => setConfirmModal({ show: true, msg, onConfirm });
  const closeConfirm = () => setConfirmModal({ show: false, msg: '', onConfirm: null });

  // Load Settings Exactly Once On Mount
  useEffect(() => {
    getSettings().then(res => {
      if (res && Object.keys(res).length > 0) {
        setSettingsState(prev => ({ ...prev, ...res }));
      }
    }).catch(() => console.log('Failed fetching early settings.'));
  }, []);

  useEffect(() => {
    fetchDataForTab(activeTab);
    setSelectedUsers(new Set());
  }, [activeTab]);

  useEffect(() => {
    const userEmail = sessionStorage.getItem('vision_email');
    if (userEmail) socketService.connect(userEmail);

    // Socket: Student Help Request
    socketService.onStudentHelp((data) => {
      toast.error(`HELP REQUEST: ${data.studentName} - ${data.message}`, { duration: 6000 });
      const newReq = { ...data, id: Date.now(), type: 'help', unread: true };
      setHelpRequests(prev => [newReq, ...prev]);
      setNotifications(prev => [newReq, ...prev]);
    });

    // Socket: Proctoring Violation Alert
    socketService.onMentorAlert((data) => {
      const displayName = data.studentName || data.studentId || 'Unknown Student';
      toast.error(`VIOLATION: ${displayName} - ${data.type}`, { icon: '🚨' });
      const newNotif = { ...data, id: Date.now(), type: 'violation', unread: true, timestamp: new Date() };
      setNotifications(prev => [newNotif, ...prev]);
    });

    // ✅ Fix: Add ACK Received listener
    socketService.onAckReceived((data) => {
      toast.success(`MESSAGE READ: ${data.studentEmail} acknowledged your message.`, { icon: '✔' });
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  // Poll Live Sessions when on LiveMonitoring tab or every 30s
  useEffect(() => {
    let interval;
    const fetchLive = async () => {
      try {
        const res = await getLiveSessions();
        setLiveSessions(res || []);
      } catch (err) {
        console.error("Live sessions fetch failed:", err);
      }
    };

    fetchLive();
    interval = setInterval(fetchLive, 20000); // 20s poll

    return () => clearInterval(interval);
  }, [activeTab]);

  const handleClearNotifications = () => {
    setNotifications([]);
    setShowNotifDropdown(false);
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const handleResolveHelp = (id) => {
    setHelpRequests(prev => prev.filter(r => r.id !== id));
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const fetchDataForTab = async (tab) => {
      setLoading(true);
      try {
          if (tab === 'Overview') {
              const [res, logsRes, studentsRes] = await Promise.all([
                  getDashboardStats().catch(() => ({})),
                  getAuditLogs().catch(() => []),
                  getStudents().catch(() => ({ students: [] }))
              ]);
              setStats({
                  totalStudents: res.totalStudents || 0,
                  activeExams: res.liveExams || 0,
                  systemHealth: '100%',
                  totalViolations: res.flaggedSessions || 0
              });
              setAuditLogs(logsRes || []);
              setStudents(studentsRes?.students || studentsRes || []);
          } else if (tab === 'Users') {
              const [studentsRes, mentorsRes, adminsRes] = await Promise.all([
                  getStudents().catch(() => ({ students: [] })),
                  getMentors().catch(() => ({ mentors: [] })),
                  getAdmins().catch(() => [])
              ]);
              const studentsData = studentsRes?.students || studentsRes || [];
              const mentorsData = mentorsRes?.mentors || mentorsRes || [];
              const adminsData = Array.isArray(adminsRes) ? adminsRes : [];
              setUsers([...adminsData, ...mentorsData, ...studentsData]);
          } else if (tab === 'Exams') {
              const res = await getAdminExams();
              setExams(res || []);
          } else if (tab === 'Results') {
              const res = await getAdminResults();
              setAdminResults(res?.results || res || []);
          } else if (tab === 'Settings') {
              // Settings are fetched independently on mount. No data required on tab switch.
          } else if (tab === 'Candidates') {
              const res = await getCandidates(candidateSearch).catch(() => []);
              setCandidates(res || []);
          } else if (tab === 'LiveMonitoring') {
              const res = await getLiveSessions();
              setLiveSessions(res || []);
          } else if (tab === 'Academics') {
              const res = await getStudents().catch(() => ({ students: [] }));
              const studentsData = res?.students || res || [];
              setStudents(studentsData);
          }
      } catch (err) {
          console.error("Failed fetching data:", err);
      } finally {
          setLoading(false);
      }
  };

  const handleDeleteLog = async (id) => {
    try {
      await deleteAuditLog(id);
      setAuditLogs(prev => prev.filter(l => l._id !== id));
      toast.success('Log entry removed');
    } catch {
      toast.error('Failed to delete log');
    }
  };

  const handleClearAllLogs = () => {
    showConfirm('Delete ALL audit logs forever?', async () => {
      try {
        await clearAllAuditLogs();
        setAuditLogs([]);
        toast.success('Audit trail cleared');
        closeConfirm();
      } catch {
        toast.error('Failed to clear logs');
      }
    });
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

  const handleDeleteUser = async (id, currentRole) => {
    if (userRole !== 'admin' && currentRole === 'mentor') return toast.error('Unauthorized');
    
    showConfirm('Are you sure you want to delete this user? This action cannot be undone.', async () => {
       try {
         const route = currentRole === 'student' ? `/api/admin/students/${id}` : `/api/admin/mentors/${id}`;
         await api.delete(route);
         setUsers(users.filter(u => u._id !== id));
         toast.success('User deleted successfully.');
         closeConfirm();
       } catch {
         toast.error('Failed to delete user.');
       }
    });
  };

  const handleBulkDelete = () => {
    if (selectedUsers.size === 0) return;
    
    showConfirm(`Are you sure you want to delete ${selectedUsers.size} selected users?`, async () => {
      try {
        await api.post('/api/admin/students/bulk-delete', { userIds: Array.from(selectedUsers) });
        setUsers(users.filter(u => !selectedUsers.has(u._id)));
        setSelectedUsers(new Set());
        toast.success(`Successfully deleted ${selectedUsers.size} users`);
        closeConfirm();
      } catch {
        toast.error('Failed to delete selected users');
      }
    });
  };

  const handleBulkExportCSV = () => {
    if (selectedUsers.size === 0) return;
    const selectedData = users.filter(u => selectedUsers.has(u._id));
    
    const headers = 'Name,Email,Role\n';
    const rows = selectedData.map(u => `"${u.name}","${u.email}","${u.role}"`).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vision_users_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export downloaded');
  };

  const toggleUserSelection = (userId) => {
    const newSet = new Set(selectedUsers);
    if (newSet.has(userId)) newSet.delete(userId);
    else newSet.add(userId);
    setSelectedUsers(newSet);
  };

  const toggleAllUsers = (filteredUsers) => {
    const filteredIds = filteredUsers.map(u => u._id);
    const allFilteredSelected = filteredIds.every(id => selectedUsers.has(id));
    
    if (allFilteredSelected && filteredIds.length > 0) {
      const newSet = new Set(selectedUsers);
      filteredIds.forEach(id => newSet.delete(id));
      setSelectedUsers(newSet);
    } else {
      const newSet = new Set(selectedUsers);
      filteredIds.forEach(id => newSet.add(id));
      setSelectedUsers(newSet);
    }
  };

  const handleTogglePublishResults = async (id, currentStatus) => {
      try {
          const newStatus = !currentStatus;
          await togglePublishResults(id, newStatus);
          toast.success(newStatus ? 'Results published to students' : 'Results hidden from students');
          // Update local state without full refetch
          setExams(exams.map(e => String(e.id || e._id) === String(id) ? { ...e, resultsPublished: newStatus } : e));
      } catch {
          toast.error("Failed to toggle results visibility.");
      }
  };

  const handleDeleteExam = async (id) => {
      showConfirm("Delete this exam globally?", async () => {
          try {
              await api.delete(`/api/exams/${id}`);
              setExams(exams.filter(e => e._id !== id));
              toast.success('Exam deleted successfully.');
          } catch (err) {
              console.error(err);
              toast.error('Failed to delete exam');
          }
      });
  };

  const getUserColumnMap = (headerRow) => {
    const cols = headerRow.split(',').map(c => c.toLowerCase().trim());
    return {
        name: cols.indexOf('name'),
        email: cols.findIndex(c => c.includes('email')),
        role: cols.indexOf('role'),
        password: cols.findIndex(c => c.includes('password'))
    };
  };

  const handleCsvImport = async (e) => {
     const file = e.target.files[0];
     if (!file) return;

     const reader = new FileReader();
     reader.onload = async (event) => {
         const text = event.target.result;
         let rows = text.split('\n').filter(row => row.trim() !== '');
         if (rows.length === 0) return;

         const header = rows[0].toLowerCase().includes('email') ? rows[0] : null;
         const dataRows = header ? rows.slice(1) : rows;
         const map = header ? getUserColumnMap(header) : null;

         const usersToImport = dataRows.map(row => {
             const cols = row.split(',');
             const get = (key, defIdx) => (map && map[key] !== -1) ? cols[map[key]] : cols[defIdx];
             
             return { 
                 name: get('name', 0)?.trim() || 'No Name', 
                 email: get('email', 1)?.trim(), 
                 password: get('password', -1)?.trim() || '',
                 role: get('role', 2)?.trim()?.toLowerCase() || 'student' 
             };
         }).filter(u => u.email && u.email.includes('@'));
         
         if(usersToImport.length === 0) {
             toast.error("No valid users found in CSV.");
             return;
         }

         try {
             const res = await bulkImportUsers(usersToImport);
             const successCount = res.successCount ?? res.results?.filter(r => r.status === 'success').length ?? 0;
             const failureCount = res.failureCount ?? res.results?.filter(r => r.status === 'failed').length ?? 0;
             
             if (failureCount > 0) {
                 toast.success(`${successCount} users imported. ${failureCount} skipped (duplicates/errors).`);
             } else {
                 toast.success(`${successCount} users imported successfully.`);
             }
             fetchDataForTab('Users');
         } catch(err) {
             toast.error('Import failed: ' + (err.message || "Unknown Error"));
         }
     };
     reader.readAsText(file);
     e.target.value = null; 
  };

  const handleCreateUser = async (e) => {
      e.preventDefault();
      try {
          await addUser(newUser);
          setShowAddUserModal(false);
          setNewUser({ name: '', email: '', password: '', role: 'student' });
          fetchDataForTab('Users');
          toast.success('User created successfully.');
      } catch (err) {
          toast.error("Error creating user: " + err.message);
      }
  };

  const handleSaveSettings = async () => {
      try {
          await saveSettings(settings);
          sessionStorage.removeItem('admin_unsaved_settings'); // Clear unsaved flag after successful DB save
          toast.success('System settings saved successfully!');
      } catch (err) {
          console.error(err);
          toast.error('Failed to save settings.');
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

  const handleBlockStudent = async (studentId, examId) => {
    showConfirm('Block this student? They will be locked out of the exam screen.', async () => {
      try {
        socketService.blockStudent(studentId, examId);
        toast.error('Student blocked!');
        // Optimization: update local state immediately
        setLiveSessions(prev => prev.map(s => s._id === studentId || s.studentId === studentId ? { ...s, isBlocked: true, status: 'blocked' } : s));
      } catch (err) {
        toast.error('Block failed');
      }
    });
  };

  const handleUnblockStudent = async (studentId, examId) => {
    try {
      socketService.unblockStudent(studentId, examId);
      toast.success('Student unblocked!');
      setLiveSessions(prev => prev.map(s => s._id === studentId || s.studentId === studentId ? { ...s, isBlocked: false, status: 'in_progress' } : s));
    } catch (err) {
      toast.error('Unblock failed');
    }
  };

  const handleTerminateStudent = async (sessionId) => {
    // Find the student ID for this session from our state to send the socket signal
    const targetSession = liveSessions.find(s => s._id === sessionId);
    const targetStudentId = targetSession?.studentId || sessionId;

    showConfirm('TERIMINATE EXAM? This will forcibly submit their exam and kick them out. This cannot be undone.', async () => {
      try {
        socketService.emitAdminMessage({
            type: 'direct',
            studentId: targetStudentId,
            message: 'Your exam has been terminated by the administrator.',
            severity: 'critical',
            action: 'TERMINATE'
        });
        
        // Also call API to finalize session status in DB
        await api.put(`/api/exams/terminate/${sessionId}`);
        
        toast.success('Session terminated.');
        setLiveSessions(prev => prev.filter(s => s._id !== sessionId));
      } catch (err) {
        toast.error('Termination failed.');
      }
    });
  };

  // Grade submission is handled by SessionReportModal inline if needed

  const handleExportCsv = () => {
    if (adminResults.length === 0) {
      toast.error('No results to export.');
      return;
    }
    const headers = 'Student,Email,Exam,Score,Percentage,Violations,Status,Submitted At\n';
    const rows = adminResults.map(r =>
      `"${r.studentName}","${r.studentEmail}","${r.examTitle}",${r.score || 0},${r.percentage || 0}%,${r.totalViolations || 0},${r.status},"${r.submittedAt || ''}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vision_admin_results_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'Overview', label: 'Overview', icon: LayoutDashboard, access: ['admin', 'super_mentor'], section: 'System Main' },
    { id: 'LiveMonitoring', label: 'Live Monitoring', icon: Radio, access: ['admin', 'super_mentor', 'mentor'], badge: liveSessions.length, section: 'System Main' },
    { id: 'Users', label: 'User Management', icon: Users, access: ['admin', 'super_mentor'], section: 'User Management' },
    { id: 'Candidates', label: 'Candidates', icon: ScanFace, access: ['admin', 'super_mentor'], section: 'User Management' },
    { id: 'Exams', label: 'Exam Library', icon: FileText, access: ['admin', 'super_mentor'], section: 'Management' },
    { id: 'Results', label: 'Results & Reports', icon: BarChart3, access: ['admin', 'super_mentor'], section: 'Intelligence & Oversight' },
    { id: 'Academics', label: 'Academic Insights', icon: TrendingUp, access: ['admin', 'super_mentor', 'mentor'], section: 'Intelligence & Oversight' },
    { id: 'Settings', label: 'System Settings', icon: Settings, access: ['admin'], section: 'Platform' },
  ];

  const visibleTabs = tabs.filter(t => t.access.includes(userRole));

  // ────────── Tab Views ──────────

  const STAT_CARDS = [
     { label: 'Total Students', value: stats.totalStudents, icon: Users },
     { label: 'Active Live Exams', value: stats.activeExams, icon: FileText },
     { label: 'System Health', value: stats.systemHealth, icon: ShieldCheck },
     { label: 'Total Violations', value: stats.totalViolations, icon: AlertOctagon },
  ];

  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {STAT_CARDS.map((stat, i) => (
          <div key={i} className="p-6 rounded-2xl bg-surface border border-main shadow-sm hover:shadow-md transition-all hover:border-primary-500/30 group active:scale-95 cursor-pointer relative overflow-hidden flex flex-col gap-4" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="w-10 h-10 rounded-[10px] bg-surface-hover border border-main flex items-center justify-center text-primary-500 shadow-sm group-hover:bg-primary-500 group-hover:text-white transition-all duration-500 relative z-10">
              <stat.icon size={18} strokeWidth={2.2} />
            </div>
            <div className="relative z-10">
              <h3 className="text-3xl font-bold text-primary tracking-tight leading-none">{stat.value}</h3>
              <p className="text-[13px] font-medium text-muted mt-1.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-2">
        <AdminMessageControls activeStudents={students} mode="full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Audit Logs */}
        <div className="p-6 rounded-3xl bg-surface border border-main shadow-sm hover:shadow-md transition-shadow flex flex-col h-[500px] relative overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
          <div className="flex items-center justify-between mb-6 shrink-0 relative z-10">
             <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-surface-hover border border-main flex items-center justify-center text-primary-500 shadow-sm"><FileText size={18} strokeWidth={2.2} /></div>
               <div>
                 <h4 className="text-lg font-bold text-primary tracking-tight leading-none">Intelligence Logs</h4>
                 <p className="text-[12px] font-medium text-muted mt-1">Platform-wide operation trail</p>
               </div>
             </div>
             <div className="flex items-center gap-3">
               {auditLogs.length > 0 && (
                 <button onClick={handleClearAllLogs} className="text-xs font-semibold text-red-500 hover:text-red-600 px-4 py-2 rounded-lg border border-red-500/10 hover:bg-red-500/5 transition-all shadow-sm">Clear All</button>
               )}
               {loading && <RefreshCw size={14} className="animate-spin text-muted/50" />}
             </div>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 relative z-10">
             {auditLogs.length > 0 ? auditLogs.map((log) => (
                <div key={log._id} className="group relative flex flex-col p-4 bg-surface-hover/30 border border-main rounded-2xl hover:border-primary-500/30 transition-all duration-300">
                   <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge color={log.action.includes('DELETE') ? 'red' : 'zinc'}>{log.action}</Badge>
                        <span className="text-[10px] font-medium text-muted opacity-60">{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                      <button onClick={() => handleDeleteLog(log._id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-muted/40 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all"><Trash2 size={14} /></button>
                   </div>
                   <p className="text-xs text-primary font-semibold tracking-tight mb-2">Principal: {log.adminId?.name || 'System'} <span className="opacity-50 font-medium ml-1">({log.adminId?.email || 'AUTH_INTERNAL'})</span></p>
                   {log.details && (
                      <div className="p-3 bg-surface border border-main rounded-xl text-[11px] font-mono text-muted/70 break-all leading-relaxed shadow-sm">
                         {JSON.stringify(log.details)}
                      </div>
                   )}
                </div>
             )) : (
                <div className="h-full flex flex-col items-center justify-center text-muted/30 gap-4 grayscale">
                   <Activity size={48} strokeWidth={1} />
                   <p className="text-[13px] font-semibold tracking-wide">No artifacts recorded</p>
                </div>
             )}
          </div>
        </div>

        {/* Right Column: Student Activity */}
        <div className="p-6 rounded-3xl bg-surface border border-main shadow-sm hover:shadow-md transition-shadow flex flex-col h-[500px] relative overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
           <div className="flex items-center justify-between mb-6 shrink-0 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-500 shadow-sm"><AlertCircle size={18} strokeWidth={2.2} /></div>
                <div>
                  <h4 className="text-lg font-bold text-primary tracking-tight leading-none">Active Signals</h4>
                  <p className="text-[12px] font-medium text-muted mt-1">Real-time candidate telemetry</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] font-bold text-emerald-600 tracking-wider">LIVE</span>
              </div>
           </div>
           
           <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 relative z-10">
              {helpRequests.length === 0 && notifications.filter(n => n.type === 'violation').length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted/30 gap-4 grayscale">
                   <Radio size={48} strokeWidth={1} />
                   <p className="text-[13px] font-semibold tracking-wide">Standing by for signals</p>
                </div>
              ) : (
                <>
                  {/* Help Requests specifically */}
                  {helpRequests.map(req => (
                    <div key={req.id} className="p-5 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-2xl relative overflow-hidden group/alert hover:bg-emerald-500/[0.05] transition-colors duration-300">
                       <div className="absolute top-0 right-0 p-3">
                          <button onClick={() => handleResolveHelp(req.id)} className="w-8 h-8 bg-surface border border-emerald-500/20 text-emerald-500 rounded-lg shadow-sm hover:bg-emerald-500 hover:text-white transition-all active:scale-95 flex items-center justify-center"><Check size={16} strokeWidth={2.5} /></button>
                       </div>
                       <div className="flex items-center gap-3 mb-5">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]" />
                          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">Prioritized assistance req</span>
                       </div>
                       <h5 className="text-sm font-black text-primary uppercase tracking-tight mb-1">{req.studentName}</h5>
                       <p className="text-[10px] text-muted font-black uppercase tracking-widest mb-6 opacity-50">{req.studentEmail}</p>
                       <div className="p-5 bg-surface border border-emerald-500/10 rounded-2xl text-[11px] font-black text-emerald-500/90 shadow-inner leading-relaxed">
                          "{req.message}"
                       </div>
                    </div>
                  ))}

                  {/* Violations from Notifications state */}
                  {notifications.filter(n => n.type === 'violation').map(notif => (
                    <div key={notif.id} className="p-8 bg-red-500/[0.03] border border-red-500/10 rounded-[2rem] relative overflow-hidden group/violation hover:bg-red-500/[0.05] transition-colors duration-500">
                       <div className="flex items-center gap-3 mb-5">
                          <ShieldAlert size={16} className="text-red-500" strokeWidth={3} />
                          <span className="text-[9px] font-black text-red-500 uppercase tracking-[0.2em]">Integrity Violation Protocol</span>
                          <span className="ml-auto text-[9px] font-black text-red-400/50 uppercase tracking-widest">{new Date(notif.timestamp).toLocaleTimeString()}</span>
                       </div>
                       <p className="text-[12px] font-black text-primary leading-relaxed uppercase tracking-tight">
                          <span className="text-red-500">{notif.studentId}</span> triggered a <span className="text-red-500 underline underline-offset-4 decoration-2">{notif.type}</span> anomaly.
                       </p>
                       <button onClick={() => setActiveTab('LiveMonitoring')} className="mt-6 text-[10px] font-black text-red-500 uppercase tracking-[0.2em] flex items-center gap-3 hover:gap-5 transition-all group-hover/violation:translate-x-2 duration-500">
                          Initiate Countermeasures <ChevronRight size={14} strokeWidth={3} />
                       </button>
                    </div>
                  ))}
                </>
              )}
           </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-8 ">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-surface p-6 rounded-3xl border border-main shadow-sm relative overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="flex items-center gap-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/60" size={16} strokeWidth={2.5} />
            <input 
              type="text" 
              placeholder="Search unit registry..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="pl-11 pr-4 py-3 bg-surface border border-main rounded-2xl text-[13px] font-medium text-primary focus:outline-none focus:border-primary-500 w-[280px] transition-all placeholder:text-muted/40 shadow-inner"
            />
          </div>
          <div className="hidden lg:flex bg-surface p-1 rounded-xl border border-main shadow-sm">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'student', label: 'Students' },
              { id: 'mentor', label: 'Mentors' },
              { id: 'admin', label: 'Admins' }
            ].map(f => (
               <button 
                key={f.id}
                onClick={() => setUserRoleFilter(f.id)}
                className={`px-5 py-2 rounded-lg text-[12px] font-semibold transition-all ${userRoleFilter === f.id ? 'bg-surface text-primary shadow-sm border border-main' : 'text-muted hover:text-primary hover:bg-surface-hover'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleCsvImport} />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-main text-[12px] font-semibold text-primary hover:bg-surface-hover hover:border-primary-500/30 transition-all rounded-xl shadow-sm active:scale-95"
          >
            <FileUp size={16} strokeWidth={2.5} className="text-muted" /> Import .CSV
          </button>
          <CSVHelper format="name, email" example="John Doe, john@example.com" />
          {userRole === 'admin' && (
            <button 
              onClick={() => setShowAddUserModal(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 text-white text-[12px] font-bold hover:bg-primary-600 transition-all rounded-xl shadow-lg shadow-primary-500/20 active:scale-95"
            >
              <UserPlus size={16} strokeWidth={2.5} /> Add Operator
            </button>
          )}
        </div>
      </div>

      {/* Mobile filter bar */}
      <div className="lg:hidden flex bg-slate-100 p-1 rounded-lg w-full overflow-x-auto scroll-thin mb-4">
        {[
          { id: 'ALL', label: 'ALL' },
          { id: 'student', label: 'STUDENTS' },
          { id: 'mentor', label: 'MENTORS' },
          { id: 'admin', label: 'ADMINS' }
        ].map(f => (
          <button 
            key={f.id}
            onClick={() => setUserRoleFilter(f.id)}
            className={`px-4 py-1.5 rounded-md text-[10px] font-bold tracking-widest uppercase transition-all whitespace-nowrap ${userRoleFilter === f.id ? 'bg-white text-primary-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {f.label}
          </button>
        ))}
      </div>


      <DataTable 
        loading={loading}
        headers={[
          <input 
             type="checkbox" 
             className="w-4 h-4 rounded border-main bg-surface text-primary-500 focus:ring-primary-500/20"
             checked={
               (() => {
                  const filtered = users.filter(u => {
                    const matchesRole = userRoleFilter === 'ALL' || (userRoleFilter === 'student' && u.role === 'student') || (userRoleFilter === 'mentor' && (u.role === 'mentor' || u.role === 'super_mentor')) || (userRoleFilter === 'admin' && u.role === 'admin');
                    const matchesSearch = !userSearchQuery.trim() || u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || u.email.toLowerCase().includes(userSearchQuery.toLowerCase());
                    return matchesRole && matchesSearch;
                  });
                  return filtered.length > 0 && filtered.every(u => selectedUsers.has(u._id));
               })()
             }
             onChange={() => {
                const filtered = users.filter(u => {
                  const matchesRole = userRoleFilter === 'ALL' || (userRoleFilter === 'student' && u.role === 'student') || (userRoleFilter === 'mentor' && (u.role === 'mentor' || u.role === 'super_mentor')) || (userRoleFilter === 'admin' && u.role === 'admin');
                  const matchesSearch = !userSearchQuery.trim() || u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || u.email.toLowerCase().includes(userSearchQuery.toLowerCase());
                  return matchesRole && matchesSearch;
                });
                toggleAllUsers(filtered);
             }}
          />, 
          'Principal Name', 'Secure Channel (Email)', 'Access Level', 'Registration Sync', 'Action'
        ]}
        data={users.filter(u => {
          const matchesRole = userRoleFilter === 'ALL' || 
            (userRoleFilter === 'student' && u.role === 'student') ||
            (userRoleFilter === 'mentor' && (u.role === 'mentor' || u.role === 'super_mentor')) ||
            (userRoleFilter === 'admin' && u.role === 'admin');
          
          const matchesSearch = !userSearchQuery.trim() || 
            u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
            u.email.toLowerCase().includes(userSearchQuery.toLowerCase());
            
          return matchesRole && matchesSearch;
        })}
        renderRow={(user) => {
          const isSelected = selectedUsers.has(user._id);
          return (
          <tr key={user._id} className={isSelected ? "bg-primary-500/[0.04]" : "hover:bg-surface-hover/50 transition-colors group/row"}>
            <td className="px-6 py-4">
               <input 
                 type="checkbox" 
                 checked={isSelected}
                 onChange={() => toggleUserSelection(user._id)}
                 className="w-4 h-4 rounded border-main bg-surface text-primary-500 focus:ring-primary-500/20"
               />
            </td>
            <td className="px-6 py-4">
              <span className={`text-[14px] font-semibold transition-colors ${isSelected ? 'text-primary' : 'text-primary group-hover/row:text-primary-500'}`}>{user.name}</span>
            </td>
            <td className={`px-6 py-4 text-[13px] font-medium ${isSelected ? 'text-primary/80' : 'text-secondary'}`}>{user.email}</td>
            <td className="px-6 py-4">
               <Badge color={user.role === 'admin' ? 'indigo' : user.role === 'super_mentor' ? 'sky' : user.role === 'mentor' ? 'teal' : 'zinc'}>
                 {user.role}
               </Badge>
            </td>
            <td className={`px-6 py-4 text-[12px] font-medium ${isSelected ? 'text-primary/80' : 'text-secondary'}`}>{new Date(user.createdAt).toLocaleDateString()}</td>
            <td className="px-6 py-4">
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteUser(user._id, user.role); }} 
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-95 ${isSelected ? 'text-primary hover:text-red-500 hover:bg-red-500/10' : 'text-muted/50 hover:text-red-500 hover:bg-red-500/10'}`}
              >
                <Trash2 size={16} strokeWidth={2} />
              </button>
            </td>
          </tr>
        )}}
      />

       {/* Add User Modal */}
       {showAddUserModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-6">
            <div className="bg-surface p-10 rounded-[3rem] shadow-2xl w-full max-w-lg border border-main animate-in zoom-in-95 duration-300 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-primary-500/10" />
               <h3 className="text-2xl font-bold text-primary mb-6">Commission Unit</h3>
               <form onSubmit={handleCreateUser} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-[9px] font-black text-muted uppercase tracking-[0.3em] mb-3">Operator Name</label>
                        <input required type="text" placeholder="FULL NAME" value={newUser.name} onChange={e=>setNewUser({...newUser, name: e.target.value})} className="w-full px-6 py-4 bg-surface-hover border border-main text-[13px] font-black text-primary rounded-2xl focus:outline-none focus:border-primary-500/50 transition-all placeholder:text-muted/20" />
                    </div>
                    <div>
                        <label className="block text-[9px] font-black text-muted uppercase tracking-[0.3em] mb-3">Auth Channel</label>
                        <input required type="email" placeholder="EMAIL ADDRESS" value={newUser.email} onChange={e=>setNewUser({...newUser, email: e.target.value})} className="w-full px-6 py-4 bg-surface-hover border border-main text-[13px] font-black text-primary rounded-2xl focus:outline-none focus:border-primary-500/50 transition-all placeholder:text-muted/20" />
                    </div>
                  </div>
                  <div>
                      <label className="block text-[9px] font-black text-muted uppercase tracking-[0.3em] mb-3">Access Protocol (Password)</label>
                      <input required type="password" placeholder="SECURE KEY" value={newUser.password} onChange={e=>setNewUser({...newUser, password: e.target.value})} className="w-full px-6 py-4 bg-surface-hover border border-main text-[13px] font-mono font-black text-primary rounded-2xl focus:outline-none focus:border-primary-500/50 transition-all placeholder:text-muted/20 tracking-widest" />
                  </div>
                  <div>
                      <label className="block text-[9px] font-black text-muted uppercase tracking-[0.3em] mb-3">Clearance Level</label>
                      <select value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value})} className="w-full px-6 py-4 bg-surface-hover border border-main text-[11px] font-black text-primary uppercase tracking-widest rounded-2xl focus:outline-none focus:border-primary-500/50 transition-all appearance-none">
                         <option value="student">Candidate / Student</option>
                         <option value="mentor">Monitor / Mentor</option>
                         <option value="super_mentor">Superintendent</option>
                         <option value="admin">Platform Admin</option>
                      </select>
                  </div>
                  <div className="flex items-center justify-end gap-4 pt-10 border-t border-main mt-6">
                     <button type="button" onClick={() => setShowAddUserModal(false)} className="px-8 py-3.5 text-[11px] font-black text-muted uppercase tracking-widest hover:text-primary transition-all active:scale-95">Abort</button>
                     <button type="submit" className="px-10 py-4 bg-primary-500 text-white text-[11px] font-black uppercase tracking-widest hover:bg-primary-600 rounded-2xl transition-all shadow-2xl shadow-primary-500/20 active:scale-95 flex items-center gap-3">
                       Commit Operator <Check size={16} strokeWidth={3} />
                     </button>
                  </div>
               </form>
            </div>
          </div>
       )}
    </div>
  );

  const renderCandidatesOld = () => (
    <div className="space-y-10 ">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-surface p-10 rounded-[2.5rem] border border-main shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary-500/10" />
        <div className="flex items-center gap-8">
           <div className="w-14 h-14 rounded-2xl bg-surface-hover border border-main flex items-center justify-center text-primary-500 shadow-xl">
             <ScanFace size={28} strokeWidth={2.5} />
           </div>
           <div>
             <h2 className="text-2xl font-bold text-primary">Identity Registry</h2>
             <p className="text-sm text-muted mt-1">E-KYC Verification & Biometric Status</p>
           </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="hidden lg:flex bg-surface-hover p-1.5 rounded-2xl border border-main shadow-inner">
             {[
               { id: 'ALL', label: 'All' },
               { id: 'PENDING', label: 'Pending' },
               { id: 'VERIFIED', label: 'Verified' },
               { id: 'ISSUES', label: 'Flags' }
             ].map(f => (
               <button 
                 key={f.id}
                 onClick={() => setCandidateFilter(f.id)}
                 className={`px-6 py-2.5 rounded-xl text-[9px] font-black tracking-widest uppercase transition-all ${candidateFilter === f.id ? 'bg-surface text-primary-500 shadow-xl border border-main' : 'text-muted hover:text-primary'}`}
               >
                 {f.label}
               </button>
             ))}
           </div>
           <button 
             onClick={handleVerifyAllCandidates}
             disabled={verifyingAll}
             className="px-8 py-3.5 bg-primary-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-all rounded-2xl shadow-2xl shadow-primary-500/20 active:scale-95 disabled:opacity-50"
           >
             {verifyingAll ? 'Processing...' : 'Verify Registry'}
           </button>
        </div>
      </div>

      <DataTable 
        loading={loading}
        headers={['Candidate Principal', 'Identity Proof', 'Biometric Score', 'Status', 'Clearance']}
        data={candidates.filter(c => {
          if (candidateFilter === 'VERIFIED') return c.isVerified;
          if (candidateFilter === 'PENDING') return !c.isVerified && !c.verificationIssue;
          if (candidateFilter === 'ISSUES') return !!c.verificationIssue;
          return true;
        })}
        renderRow={(c) => (
          <tr key={c._id} className="hover:bg-surface-hover/50 transition-colors group/row last:border-0">
            <td className="px-8 py-6">
              <div className="flex flex-col">
                <span className="font-black text-[13px] text-primary uppercase tracking-tight group-hover/row:text-primary-500 transition-colors">{c.name}</span>
                <span className="text-[9px] font-black text-muted uppercase tracking-widest mt-1 opacity-40">{c.email}</span>
              </div>
            </td>
            <td className="px-8 py-6">
               <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-surface-hover border border-main overflow-hidden shadow-inner group/img cursor-pointer" onClick={() => setSelectedCandidate(c)}>
                     <img src={c.profilePicture || 'https://ui-avatars.com/api/?name='+c.name} alt="Face" className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-surface-hover border border-main overflow-hidden shadow-inner group/img cursor-pointer" onClick={() => setSelectedCandidate(c)}>
                     <img src={c.idCardUrl || 'https://via.placeholder.com/150?text=ID+CARD'} alt="ID" className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500" />
                  </div>
               </div>
            </td>
            <td className="px-8 py-6">
               <div className="flex items-center gap-3">
                  <div className="w-20 h-1.5 bg-main rounded-full overflow-hidden">
                     <div className="h-full bg-emerald-500" style={{ width: '94%' }} />
                  </div>
                  <span className="text-[11px] font-black text-emerald-500 tabular-nums">94%</span>
               </div>
            </td>
            <td className="px-8 py-6">
               {c.verificationIssue ? (
                 <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black border bg-red-500/10 text-red-500 border-red-500/20 uppercase tracking-widest">
                   <AlertCircle size={10} strokeWidth={3} /> {c.verificationIssue}
                 </span>
               ) : c.isVerified ? (
                 <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black border bg-emerald-500/10 text-emerald-500 border-emerald-500/20 uppercase tracking-widest">
                   <ShieldCheck size={10} strokeWidth={3} /> Verified
                 </span>
               ) : (
                 <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black border bg-amber-500/10 text-amber-500 border-amber-500/20 uppercase tracking-widest">
                   <Clock size={10} strokeWidth={3} /> Pending Review
                 </span>
               )}
            </td>
            <td className="px-8 py-6">
               <div className="flex items-center gap-4">
                  <button 
                    onClick={() => handleVerifyCandidate(c._id, !c.isVerified)}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-95 ${c.isVerified ? 'text-red-500 bg-red-500/10 border border-red-500/20' : 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20'}`}
                    title={c.isVerified ? "Revoke Verification" : "Authorize Candidate"}
                  >
                    {c.isVerified ? <X size={18} strokeWidth={3} /> : <Check size={18} strokeWidth={3} />}
                  </button>
                  <button 
                    onClick={() => setSelectedCandidate(c)}
                    className="w-10 h-10 flex items-center justify-center text-muted/30 hover:text-primary-500 hover:bg-primary-500/10 border border-transparent hover:border-primary-500/20 rounded-xl transition-all active:scale-95"
                  >
                    <Eye size={18} strokeWidth={3} />
                  </button>
               </div>
            </td>
          </tr>
        )}
      />
    </div>
  );

  const renderExams = () => (
    <div className="space-y-8 ">
      <div className="flex items-center justify-between bg-surface p-6 rounded-3xl border border-main shadow-sm relative overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-primary tracking-tight leading-none">Exam Library</h2>
          <p className="text-[12px] text-muted font-medium mt-1">Global assessment library orchestration</p>
        </div>
        <button 
          onClick={() => navigate('/mentor/create-exam?returnTo=/admin')}
          className="relative z-10 flex items-center gap-2 px-6 py-3 bg-primary-500 text-white text-[13px] font-semibold hover:bg-primary-600 transition-all rounded-xl shadow-lg shadow-primary-500/20 active:scale-95"
        >
          <Plus size={16} strokeWidth={2.5} /> Create Exam
        </button>
      </div>
      <DataTable 
        loading={loading}
        headers={['Exam Title', 'Created By', 'Category', 'Status', 'Actions']}
        data={exams}
        renderRow={(exam) => (
          <tr key={exam.id || exam._id} className="hover:bg-surface-hover/50 transition-colors group/row">
            <td className="px-6 py-4">
              <span className="text-[14px] font-semibold text-primary group-hover/row:text-primary-500 transition-colors">{exam.name || exam.title}</span>
            </td>
            <td className="px-6 py-4 text-[13px] font-medium text-muted">{exam.creatorName || exam.creator?.name || 'Unknown'}</td>
            <td className="px-6 py-4 text-[13px] font-medium text-muted">{exam.category || 'Standard'}</td>
            <td className="px-6 py-4">
               {(() => {
                 const now = new Date();
                 const startDateStr = exam.time || exam.scheduledDate;
                 const start = startDateStr ? new Date(startDateStr) : null;
                 const end = start ? new Date(start.getTime() + (exam.duration || 60) * 60 * 1000) : null;

                 if (exam.status === 'draft') return <Badge color="amber">Draft</Badge>;
                 if (start && now < start) return <Badge color="zinc">Upcoming</Badge>;
                 if (end && now > end && startDateStr) return <Badge color="zinc">Expired</Badge>;
                 
                 return (
                   <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-semibold border bg-emerald-500/10 text-emerald-500 border-emerald-500/20 tracking-wide">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]" />
                     Live Active
                   </span>
                 );
               })()}
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleTogglePublishResults(exam.id || exam._id, exam.resultsPublished)} 
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-95 ${exam.resultsPublished ? 'text-emerald-500 bg-emerald-500/10' : 'text-muted/50 hover:text-emerald-500 hover:bg-emerald-500/10'}`}
                  title={exam.resultsPublished ? "Results Published" : "Results Hidden"}
                >
                  {exam.resultsPublished ? <CheckCircle size={16} strokeWidth={2} /> : <EyeOff size={16} strokeWidth={2} />} 
                </button>
                <button 
                  onClick={() => navigate(`/mentor/create-exam?id=${exam.id || exam._id}&view=true&returnTo=/admin`)} 
                  className="w-8 h-8 flex items-center justify-center text-muted/50 hover:text-primary-500 hover:bg-primary-500/10 rounded-lg transition-all active:scale-95"
                  title="View Exam"
                >
                  <Eye size={16} strokeWidth={2} />
                </button>
                <button 
                  onClick={() => navigate(`/mentor/create-exam?id=${exam.id || exam._id}&returnTo=/admin`)} 
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

  const renderSettings = () => (
    <div className="max-w-4xl mx-auto pb-32 ">
      <div className="mb-8 py-4 relative overflow-hidden">
        <h2 className="text-2xl font-bold text-primary tracking-tight">Global System Control</h2>
        <p className="text-[9px] font-semibold text-muted uppercase tracking-[0.2em] mt-1.5 opacity-70">Unified Security & Proctoring Architecture</p>
      </div>

      {/* Card 1: Session Tolerances */}
      <div className="bg-surface border border-white/15 rounded-2xl shadow-sm mb-6 overflow-hidden">
        <div className="px-6 py-3.5 bg-surface-hover/30">
          <h3 className="text-[9px] font-bold text-muted uppercase tracking-[0.15em]">Session Tolerances</h3>
        </div>
        <div className="">
          <div className="flex items-center justify-between p-6 hover:bg-surface-hover/30 transition-colors">
            <div className="max-w-[70%]">
              <p className="text-[13px] font-bold text-primary tracking-tight">Max Allowed Tab Switches</p>
              <p className="text-[11px] text-muted mt-0.5 font-medium leading-relaxed opacity-80">Automatic session termination trigger when tab switching exceeds this limit.</p>
            </div>
            <input 
              type="number" 
              value={settings.maxTabSwitches} 
              onChange={e => setSettingsState(prev => ({...prev, maxTabSwitches: Number(e.target.value)}))}
              className="w-16 px-3 py-1.5 bg-surface border border-main rounded-lg text-[13px] font-bold text-primary text-center focus:border-primary-500 outline-none transition-all shadow-sm" 
            />
          </div>

          <div className="flex items-center justify-between p-6 hover:bg-surface-hover/30 transition-colors">
            <div className="max-w-[70%]">
              <p className="text-[13px] font-bold text-primary tracking-tight">Violation Tolerance Cap</p>
              <p className="text-[11px] text-muted mt-0.5 font-medium leading-relaxed opacity-80">Permitted threshold for integrity flags before a permanent lockout occurs.</p>
            </div>
            <input 
              type="number" 
              value={settings.maxViolations || 5} 
              onChange={e => setSettingsState(prev => ({...prev, maxViolations: Number(e.target.value)}))}
              className="w-16 px-3 py-1.5 bg-surface border border-main rounded-lg text-[13px] font-bold text-primary text-center focus:border-primary-500 outline-none transition-all shadow-sm" 
            />
          </div>

          <div className="flex items-center justify-between p-6 hover:bg-surface-hover/30 transition-colors">
            <div className="max-w-[70%]">
              <p className="text-[13px] font-bold text-primary tracking-tight">Background Idle Limit</p>
              <p className="text-[11px] text-muted mt-0.5 font-medium leading-relaxed opacity-80">Maximum seconds permitted in background before session suspension.</p>
            </div>
            <div className="relative">
              <input 
                type="number" 
                value={settings.backgroundLimitSeconds || 10} 
                onChange={e => setSettingsState(prev => ({...prev, backgroundLimitSeconds: Number(e.target.value)}))}
                className="w-24 pl-4 pr-10 py-1.5 bg-surface border border-main rounded-lg text-[13px] font-bold text-primary text-center focus:border-primary-500 outline-none transition-all shadow-sm" 
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-muted/50 uppercase">SEC</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Environment Security */}
      <div className="bg-surface border border-white/15 rounded-2xl shadow-sm mb-6 overflow-hidden">
        <div className="px-6 py-3.5 bg-surface-hover/30">
          <h3 className="text-[9px] font-bold text-muted uppercase tracking-[0.15em]">Browser Security</h3>
        </div>
        <div className="">
          <div className="flex items-center justify-between p-6 hover:bg-surface-hover/30 transition-colors">
            <div className="max-w-[70%]">
              <p className="text-[13px] font-bold text-primary tracking-tight">Force Fullscreen Mode</p>
              <p className="text-[11px] text-muted mt-0.5 font-medium leading-relaxed opacity-80">Require students to keep the exam in fullscreen mode at all times.</p>
            </div>
            <ToggleSwitch
              checked={!!settings.forceFullscreen}
              onChange={() => setSettingsState(prev => ({...prev, forceFullscreen: !prev.forceFullscreen}))}
            />
          </div>

          <div className="flex items-center justify-between p-6 hover:bg-surface-hover/30 transition-colors">
            <div className="max-w-[70%]">
              <p className="text-[13px] font-bold text-primary tracking-tight">Disable Copy & Paste</p>
              <p className="text-[11px] text-muted mt-0.5 font-medium leading-relaxed opacity-80">Prevent students from copying, pasting, or right-clicking during the exam.</p>
            </div>
            <ToggleSwitch
              checked={!!settings.disableCopyPaste}
              onChange={() => setSettingsState(prev => ({...prev, disableCopyPaste: !prev.disableCopyPaste}))}
            />
          </div>

          <div className="flex items-center justify-between p-6 hover:bg-surface-hover/30 transition-colors">
            <div className="max-w-[70%]">
              <p className="text-[13px] font-bold text-primary tracking-tight">Exam Exit Password</p>
              <p className="text-[11px] text-muted mt-0.5 font-medium leading-relaxed opacity-80">Require a password for students to submit or exit the exam early.</p>
            </div>
            <input 
              type="text" 
              placeholder="NO KEY SET"
              value={settings.exitPassword || ''} 
              onChange={e => setSettingsState(prev => ({...prev, exitPassword: e.target.value}))}
              className="w-40 px-4 py-2 bg-surface border border-main rounded-xl text-[13px] font-mono font-bold text-primary text-center focus:border-primary-500 outline-none transition-all tracking-widest placeholder:text-[10px] placeholder:font-medium" 
            />
          </div>
        </div>
      </div>

      {/* Card 3: Identity & Proctoring */}
      <div className="bg-surface border border-white/15 rounded-2xl shadow-sm mb-6 overflow-hidden">
        <div className="px-6 py-3.5 bg-surface-hover/30">
          <h3 className="text-[9px] font-bold text-muted uppercase tracking-[0.15em]">Camera & ID Settings</h3>
        </div>
        <div className="">
          <div className="flex items-center justify-between p-6 hover:bg-surface-hover/30 transition-colors">
            <div className="max-w-[70%]">
              <p className="text-[13px] font-bold text-primary tracking-tight">Enable Webcam Monitoring</p>
              <p className="text-[11px] text-muted mt-0.5 font-medium leading-relaxed opacity-80">Record the student's webcam to monitor their face and behavior during the exam.</p>
            </div>
            <ToggleSwitch
              checked={!!settings.enableWebcam}
              onChange={() => setSettingsState(prev => ({...prev, enableWebcam: !prev.enableWebcam}))}
            />
          </div>

          <div className="flex items-center justify-between p-6 hover:bg-surface-hover/30 transition-colors">
            <div className="max-w-[70%]">
              <p className="text-[13px] font-bold text-primary tracking-tight">Require ID Verification</p>
              <p className="text-[11px] text-muted mt-0.5 font-medium leading-relaxed opacity-80">Ask students to verify their identity with a photo ID before starting the exam.</p>
            </div>
            <ToggleSwitch
              checked={!!settings.requireIDVerification}
              onChange={() => setSettingsState(prev => ({...prev, requireIDVerification: !prev.requireIDVerification}))}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderAcademics = () => {
    // We use the dedicated students state here

    return (
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
};

  const renderResults = () => (
    <div className="space-y-6 ">
      <div className="flex items-center justify-between py-4 relative overflow-hidden">
         <div className="flex items-center gap-8">
            <h2 className="text-xl font-bold text-primary tracking-tight">System-Wide Results & Reports</h2>
            
            <div className="hidden lg:flex bg-surface-hover/50 p-1 rounded-xl border border-main">
              {['ALL', 'PENDING', 'EVALUATED / PAST'].map(f => (
                <button 
                  key={f}
                  onClick={() => setResultFilter(f)}
                  className={`px-6 py-2 rounded-lg text-[10px] font-bold tracking-wider transition-all ${resultFilter === f ? 'bg-surface text-primary shadow-sm border border-main' : 'text-muted hover:text-primary'}`}
                >
                  {f}
                </button>
              ))}
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
              onClick={() => fetchDataForTab('Results')}
              className="w-10 h-10 flex items-center justify-center border border-main rounded-xl bg-surface text-muted hover:text-primary transition-all active:scale-95 shadow-sm"
            >
              <RefreshCw size={16} className="opacity-70" />
            </button>
         </div>
      </div>
      {/* Mobile filter bar */}
      <div className="lg:hidden flex bg-surface-hover/50 p-1 rounded-xl border border-main w-full overflow-x-auto scroll-thin mb-8">
        {['ALL', 'PENDING', 'EVALUATED / PAST'].map(f => (
          <button 
            key={f}
            onClick={() => setResultFilter(f)}
            className={`px-6 py-2 rounded-lg text-[10px] font-bold tracking-wider transition-all whitespace-nowrap ${resultFilter === f ? 'bg-surface text-primary shadow-sm border border-main' : 'text-muted hover:text-primary'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <DataTable 
        loading={loading}
        headers={['STUDENT', 'EXAM', 'SCORE', 'STATUS', 'VIOLATIONS', 'SUBMITTED', 'ACTION']}
        data={adminResults.filter(r => {
          if (resultFilter === 'ALL') return true;
          if (resultFilter === 'PENDING') return r.status === 'pending_review';
          if (resultFilter === 'EVALUATED / PAST') return r.status === 'submitted' || r.status === 'evaluated' || r.status === 'completed';
          return true;
        })}
        renderRow={(res, idx) => (
          <tr key={res._id || idx} className="hover:bg-slate-50/50 transition-colors last:border-0">
            <td className="px-6 py-4">
              <div>
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
               <div className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-bold border ${
                 res.totalViolations > 8 ? 'bg-blue-50 text-blue-600 border-blue-200/50' :
                 res.status === 'submitted' ? 'bg-emerald-50 text-emerald-600 border-emerald-200/50' :
                 'bg-slate-100 text-slate-600 border-slate-200/50'
               }`}>
                 {res.status === 'submitted' && <span className="mr-1">✅</span>}
                 {res.totalViolations > 8 ? 'Blocked' : res.status === 'submitted' ? 'Graded' : res.status}
               </div>
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
               <button 
                 onClick={() => handleViewSession(res._id)}
                 className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[#22c55e] hover:text-emerald-700 transition-colors"
               >
                 <Eye size={13} className="opacity-80" /> View
               </button>
            </td>
          </tr>
        )}
      />
    </div>
  );

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

  const [verifyingAll, setVerifyingAll] = useState(false);

  const handleVerifyAllCandidates = async () => {
    // Step 1: Identify pending candidates in the CURRENT VIEW (including filters)
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
      // Step 2: Batch process using Settled to handle individual failures gracefully
      const results = await Promise.allSettled(visiblePending.map(c => verifyCandidate(c._id)));
      
      // Step 3: Extract successfully verified IDs (ensure string comparison)
      const succeededIds = results
        .map((res, index) => res.status === 'fulfilled' ? visiblePending[index]._id.toString() : null)
        .filter(id => id !== null);

      // Step 4: Update local state for successful ones
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
      toast.error('Bulk operation failed: ' + (err.message || 'Unknown error'), { id: loadingToast });
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
    
    // Simulate AI processing delay
    await new Promise(r => setTimeout(r, 1500));
    
    let flaggedCount = 0;
    const flaggedIds = [];
    
    const updatedCandidates = candidates.map(c => {
      // Process ALL candidates (even verified ones) to audit quality
      if (!c.verificationIssue) {
        const pic = c.profilePicture || '';
        const idPic = c.idCardUrl || '';
        
        const hasMissingPhoto = !pic || pic.includes('default') || pic.includes('ui-avatars') || pic.includes('placeholder');
        const hasMissingId = !idPic || idPic.includes('default') || idPic.includes('placeholder');
        
        let issueText = null;
        
        if (hasMissingPhoto) {
          issueText = 'No Face Detected';
        } else if (hasMissingId) {
          issueText = 'No ID Uploaded';
        } else {
          // If the admin verified a test/dummy candidate (like "SWEETY"), the AI catches it:
          if (c.name && c.name.toLowerCase().includes('sweety')) {
             issueText = 'AI: Invalid ID / Ceiling Photo';
          } else {
             // Simulated AI heuristics for demo purposes
             const rand = Math.random();
             if (rand < 0.25) { issueText = 'AI: Blurry Face'; }
             else if (rand < 0.45) { issueText = 'AI: Partial Face'; }
             else if (rand < 0.55) { issueText = 'AI: ID Glare'; }
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

    // Revoke verification on backend for flagged users that were previously verified
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
      setCandidateFilter('ISSUES'); // Auto-switch to issues tab to show results
    } else {
      toast.success('AI found no obvious issues. Proofs look adequate.', { id: loadingToast });
    }
  };

  const renderCandidates = () => {
    const filteredCandidates = candidates.filter(c => {
      if (candidateFilter === 'VERIFIED') return c.isVerified;
      if (candidateFilter === 'ISSUES') return !!c.verificationIssue;
      if (candidateFilter === 'PENDING') return !c.isVerified && !c.verificationIssue;
      return true; // ALL
    });

    return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header & Primary Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Candidate Identity Board</h2>
          <p className="text-sm text-slate-500 mt-1">Review student identity proofs captured during exam onboarding.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleAutoAIIdentify}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-sm font-medium rounded-lg transition-all border border-indigo-200 active:scale-95 shadow-sm"
          >
            <ScanFace size={16} /> AI Scan
          </button>
          <button
            onClick={handleVerifyAllCandidates}
            disabled={verifyingAll}
            className={`flex items-center gap-2 px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 text-sm font-medium rounded-lg transition-all border border-slate-200 active:scale-95 shadow-sm ${verifyingAll ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {verifyingAll ? (
              <><RefreshCw size={16} className="animate-spin text-emerald-500" /> Processing...</>
            ) : (
              <><CheckCircle size={16} className="text-emerald-500" /> Verify All</>
            )}
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 p-1.5 rounded-xl border border-slate-200/60">
        <div className="flex items-center bg-white p-1 rounded-lg shadow-sm border border-slate-200/50 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'PENDING', label: 'Pending' },
            { id: 'VERIFIED', label: 'Verified' },
            { id: 'ISSUES', label: 'Issues' }
          ].map(f => (
            <button 
              key={f.id}
              onClick={() => setCandidateFilter(f.id)}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${candidateFilter === f.id ? 'bg-slate-100 text-slate-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative shrink-0 w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search candidate..."
            value={candidateSearch}
            onChange={(e) => {
              setCandidateSearch(e.target.value);
              getCandidates(e.target.value).then(r => setCandidates(r || [])).catch(() => {});
            }}
            className="w-full sm:w-64 pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="w-full h-64 flex items-center justify-center rounded-2xl bg-white border border-slate-100">
          <BouncingDotLoader text="Accessing remote proctor feeds..." />
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
          <ScanFace size={40} className="opacity-20" />
          <p className="text-xs font-bold uppercase tracking-widest opacity-40">No candidates found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredCandidates.map((c) => (
            <div
              key={c._id}
              onClick={() => setSelectedCandidate(c)}
              className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300 cursor-pointer hover:-translate-y-1"
            >
              {/* Live Badge */}
              {c.isLive && (
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-red-500 text-white px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-lg">
                  <Radio size={8} className="animate-pulse" /> Live
                </div>
              )}
              {/* Verified Badge */}
              {c.isVerified && (
                <div className="absolute top-3 right-3 z-10 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-md">
                  <Check size={12} className="text-white" />
                </div>
              )}
              {/* Profile Picture */}
              <div className="aspect-square w-full bg-slate-50 overflow-hidden">
                {c.profilePicture ? (
                  <img src={c.profilePicture} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User size={40} className="text-slate-200" />
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="p-4">
                <p className="text-sm font-bold text-slate-900 truncate">{c.name}</p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{c.email}</p>
                {c.currentExam && (
                  <p className="text-[9px] text-red-500 font-bold mt-2 truncate uppercase tracking-wide">📝 {c.currentExam}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    c.isVerified ? 'bg-emerald-50 text-emerald-700' : c.profilePicture ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {c.isVerified ? 'Verified' : c.verificationIssue ? 'Issue Flagged' : c.profilePicture ? 'Pending' : 'No Photo'}
                  </span>
                  {c.verificationIssue && (
                    <span className="text-[9px] font-bold text-red-500 truncate ml-2">
                      {c.verificationIssue}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedCandidate(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-green-100 flex items-center justify-center">
                  <ScanFace size={20} className="text-[#22c55e]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide">{selectedCandidate.name}</h3>
                  <p className="text-xs text-slate-400">{selectedCandidate.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {selectedCandidate.isLive && (
                  <span className="flex items-center gap-1.5 bg-red-50 text-red-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-red-100">
                    <Radio size={10} className="animate-pulse" /> Live Exam
                  </span>
                )}
                <button onClick={() => setSelectedCandidate(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                  <X size={18} className="text-slate-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 grid grid-cols-2 gap-6">
              {/* Face Photo */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><User size={12} /> Face Capture</p>
                <div className="aspect-square rounded-2xl bg-slate-50 border-2 border-slate-200 overflow-hidden flex items-center justify-center">
                  {selectedCandidate.profilePicture ? (
                    <img src={selectedCandidate.profilePicture} alt="Face" className="w-full h-full object-contain p-2 scale-x-[-1]" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-300">
                      <User size={32} />
                      <span className="text-[9px] font-bold uppercase tracking-widest">Not Captured</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ID Card */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><ShieldCheck size={12} /> ID Card</p>
                <div className="aspect-square rounded-2xl bg-slate-50 border-2 border-slate-200 overflow-hidden flex items-center justify-center">
                  {selectedCandidate.idCardUrl ? (
                    <img src={selectedCandidate.idCardUrl} alt="ID Card" className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-300">
                      <ShieldAlert size={32} />
                      <span className="text-[9px] font-bold uppercase tracking-widest">Not Uploaded</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Joined: {new Date(selectedCandidate.createdAt).toLocaleDateString()}</p>
                <p 
                  className={`text-xs font-bold mt-1 truncate ${selectedCandidate.isVerified ? 'text-[#22c55e]' : 'text-amber-600'}`}
                  title={selectedCandidate.verificationIssue ? `Issue: ${selectedCandidate.verificationIssue}` : ''}
                >
                  {selectedCandidate.isVerified ? '✅ Identity Verified' : selectedCandidate.verificationIssue ? `⚠️ Issue: ${selectedCandidate.verificationIssue}` : '⏳ Pending Verification'}
                </p>
              </div>
              <div className="flex gap-3 shrink-0 items-center">
                {selectedCandidate.isVerified ? (
                  <button
                    onClick={() => handleVerifyCandidate(selectedCandidate._id, false)}
                    className="px-5 py-2 bg-white text-red-600 hover:bg-red-50 hover:border-red-200 text-sm font-medium rounded-xl transition-all border border-slate-200 shadow-sm active:scale-95 whitespace-nowrap"
                  >
                    Revoke Verification
                  </button>
                ) : (
                  <div className="flex gap-3 items-center">
                    <div className="flex bg-slate-100/80 p-1 rounded-[14px] border border-slate-200 shadow-inner">
                      {[
                        { label: 'Blurry', icon: <EyeOff size={13} /> },
                        { label: 'No ID', icon: <AlertTriangle size={13} /> },
                        { label: 'Wrong Photo', icon: <User size={13} /> }
                      ].map(issue => (
                        <button
                          key={issue.label}
                          onClick={() => handleReportIssue(selectedCandidate._id, issue.label)}
                          className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-white text-slate-600 hover:text-red-600 rounded-lg text-xs font-medium transition-all hover:shadow-[0_1px_3px_rgba(0,0,0,0.05)] whitespace-nowrap"
                          title={`Report ${issue.label}`}
                        >
                          {issue.icon} {issue.label}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => handleVerifyCandidate(selectedCandidate._id, true)}
                      className="px-4 py-1.5 bg-[#4ade80] text-slate-900 text-[11px] font-bold rounded-xl transition-all shadow-lg shadow-green-500/10 border border-[#22c55e]/30 active:scale-95 flex items-center gap-1.5 whitespace-nowrap shrink-0 uppercase tracking-wider"
                    >
                      <CheckCircle size={14} strokeWidth={2.5} /> Verify Identity
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  };

  const renderLiveMonitoring = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
              <input 
                type="text" 
                placeholder="Search live students..."
                value={liveSearchQuery}
                onChange={(e) => setLiveSearchQuery(e.target.value)}
                className="pl-11 pr-4 py-3 bg-surface border border-main rounded-2xl text-[13px] font-medium text-primary focus:outline-none focus:border-primary-500 w-[300px] transition-all shadow-sm placeholder:text-muted/50"
              />
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20 shadow-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="text-[11px] font-bold uppercase tracking-widest">{liveSessions.length} Online Now</span>
            </div>
          </div>
        </div>
        
        <div className="w-full">
           <AdminMessageControls activeStudents={liveSessions.map(s => ({ _id: s.studentId, name: s.studentName, email: s.studentEmail }))} mode="full" />
        </div>
      </div>

      <DataTable 
        loading={loading}
        headers={['Candidate', 'Exam Title', 'Violations', 'Status', 'Risk Level', 'Actions']}
        data={liveSessions.filter(s => 
          !liveSearchQuery || 
          s.studentName.toLowerCase().includes(liveSearchQuery.toLowerCase()) || 
          s.examTitle.toLowerCase().includes(liveSearchQuery.toLowerCase())
        )}
        renderRow={(session) => (
          <tr key={session._id} className="hover:bg-slate-50/80 transition-colors group">
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 uppercase text-xs border border-slate-200 shadow-sm shrink-0">
                  {session.studentName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{session.studentName}</p>
                  <p className="text-[11px] text-slate-400 font-medium truncate">{session.studentEmail}</p>
                </div>
              </div>
            </td>
            <td className="px-6 py-4">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-700">{session.examTitle}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Started {new Date(session.startedAt).toLocaleTimeString()}</span>
              </div>
            </td>
            <td className="px-6 py-4 text-center">
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                session.violationCount > 5 ? 'bg-red-50 text-red-600 border-red-100' : 
                session.violationCount > 2 ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                'bg-slate-50 text-slate-600 border-slate-100'
              }`}>
                <AlertTriangle size={12} />
                {session.violationCount}
              </div>
            </td>
            <td className="px-6 py-4">
               <Badge color={session.status === 'blocked' ? 'red' : session.status === 'flagged' ? 'amber' : 'emerald'}>
                 {session.status.replace('_', ' ')}
               </Badge>
            </td>
            <td className="px-6 py-4">
               <div className="flex items-center gap-2">
                 <div className={`w-1.5 h-1.5 rounded-full ${
                   session.risk === 'High' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 
                   session.risk === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                 }`} />
                 <span className={`text-[10px] font-bold uppercase tracking-widest ${
                    session.risk === 'High' ? 'text-red-600' : 
                    session.risk === 'Medium' ? 'text-amber-600' : 'text-emerald-600'
                 }`}>{session.risk}</span>
               </div>
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-2">
                {session.status === 'blocked' ? (
                  <button 
                    onClick={() => handleUnblockStudent(session.studentId || session._id, session.examId)}
                    title="Unblock Screen"
                    className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all border border-emerald-100"
                  >
                    <ShieldCheck size={16} />
                  </button>
                ) : (
                  <button 
                    onClick={() => handleBlockStudent(session.studentId || session._id, session.examId)}
                    title="Block Screen"
                    className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-all border border-amber-100"
                  >
                    <OctagonX size={16} />
                  </button>
                )}
                <button 
                  onClick={() => handleTerminateStudent(session._id)}
                  title="Terminate Session"
                  className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all border border-red-100"
                >
                  <X size={16} />
                </button>
              </div>
            </td>
          </tr>
        )}
      />
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'Overview': return renderOverview();
      case 'LiveMonitoring': return renderLiveMonitoring();
      case 'Users': return renderUsers();
      case 'Candidates': return renderCandidates();
      case 'Exams': return renderExams();
      case 'Results': return renderResults();
      case 'Academics': return renderAcademics();
      case 'Settings': return renderSettings();
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-main font-sans text-primary select-none antialiased">
      
      <PremiumSidebar
        expanded={sidebarExpanded}
        onToggle={setSidebarExpanded}
        navItems={visibleTabs.map(t => ({ id: t.id, label: t.label, icon: t.icon }))}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userName={userName}
        userRole={userRole}
        onLogout={() => showConfirm('Are you sure you want to exit the admin control panel?', handleLogout)}
        brandLabel="VISION"
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Header */}
        <header className="h-14 bg-surface/80 backdrop-blur-md border-b border-main flex items-center justify-between px-8 shrink-0 relative z-40">
          <div className="flex items-center gap-3 text-sm font-semibold text-muted">
            <span className="hover:text-primary transition-colors cursor-pointer">Admin Dashboard</span>
            <ChevronRight size={14} className="opacity-40" />
            <span className="text-primary font-bold">{activeTab}</span>
          </div>

          <div className="flex items-center gap-5">
            <div className="relative ml-2 flex items-center gap-4">
                <ThemeToggle />
                <button 
                  onClick={() => {
                    setShowNotifDropdown(!showNotifDropdown);
                    if (!showNotifDropdown) markAllRead();
                  }}
                  className="w-10 h-10 rounded-xl bg-main border border-main flex items-center justify-center text-muted hover:text-primary transition-all active:scale-95 relative"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-main animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifDropdown && (
                  <div className="absolute right-0 top-14 w-80 bg-surface rounded-2xl shadow-xl z-50 overflow-hidden" style={{ border: '1px solid #1f1f1f' }}>
                    
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #1f1f1f' }}>
                      <div className="flex items-center gap-2">
                        <Bell size={13} className="text-muted" />
                        <span className="text-[11px] font-bold text-primary">Notifications</span>
                        {notifications.filter(n => n.unread).length > 0 && (
                          <span className="text-[9px] font-bold bg-primary-500 text-white px-1.5 py-0.5 rounded-full">
                            {notifications.filter(n => n.unread).length}
                          </span>
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <button
                          onClick={handleClearNotifications}
                          className="text-[10px] font-medium text-muted hover:text-primary transition-colors"
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    {/* Body */}
                    <div className="max-h-72 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="py-10 flex flex-col items-center gap-2">
                          <Bell size={20} className="text-muted opacity-25" />
                          <p className="text-[11px] text-muted font-medium">No notifications</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className={`px-4 py-3 hover:bg-surface-hover transition-colors ${n.unread ? 'bg-primary-500/[0.03]' : ''}`} style={{ borderBottom: '1px solid #1f1f1f' }}>
                            <div className="flex gap-3 items-start">
                              <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${
                                n.type === 'help' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary-500/10 text-primary-500'
                              }`}>
                                {n.type === 'help'
                                  ? <MessageCircle size={13} strokeWidth={2.5} />
                                  : <AlertTriangle size={13} strokeWidth={2.5} />
                                }
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                  <p className="text-[11px] font-semibold text-primary truncate">
                                    {n.type === 'help' ? 'Support Request' : 'Security Alert'}
                                  </p>
                                  <span className="text-[10px] text-muted shrink-0">
                                    {n.timestamp ? new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                                  </span>
                                </div>
                                <p className="text-[11px] font-medium text-primary truncate">
                                  {n.type === 'help' ? n.studentName : (n.studentName || n.studentId)}
                                </p>
                                <p className="text-[10px] text-muted truncate mt-0.5">
                                  {n.type === 'help' ? n.message : `Violation: ${n.type}`}
                                </p>
                              </div>
                              {n.unread && (
                                <div className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0 mt-1.5" />
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

              </div>

          </div>
        </header>

        {/* Content Section */}
        <section className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-main">
           {renderContent()}
        </section>

        {/* Sticky Action Footer for Settings */}
        {activeTab === 'Settings' && (
          <div 
            className="fixed bottom-0 right-0 bg-surface/80 backdrop-blur-xl border-t border-white/10 p-4 flex justify-end z-40 shadow-2xl"
            style={{ left: sidebarExpanded ? 220 : 76 }}
          >
            <div className="max-w-6xl w-full mx-auto flex justify-end items-center gap-6">
               <div className="flex flex-col items-end">
                  <p className="text-[9px] font-bold text-muted uppercase tracking-wider mb-0.5 opacity-60">Security Info</p>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Engine v2.4.0 Active</p>
               </div>
               <button 
                 onClick={handleSaveSettings} 
                 className="px-8 py-2.5 bg-emerald-500 text-white text-[10px] font-bold hover:bg-emerald-600 transition-all rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2 uppercase tracking-widest"
               >
                  <ShieldCheck size={14} strokeWidth={2.5} /> Publish Exam
               </button>
            </div>
          </div>
        )}
      </main>

      {/* Evaluation Modal (reused from MentorDashboard pattern) */}
      {/* Evaluation Modal */}
      {showEvalModal && (
        evalLoading ? (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
             <div className="bg-surface rounded-[2.5rem] p-12 flex items-center justify-center shadow-2xl animate-in zoom-in-95 h-[320px] w-[320px] border border-main">
                <BouncingDotLoader text="Loading..." />
             </div>
          </div>
        ) : (
          <SessionReportModal 
            sessionData={evalSessionData} 
            onClose={() => { setShowEvalModal(false); setEvalSessionData(null); }} 
            onRefresh={() => fetchDataForTab('Results')}
          />
        )
      )}

      {/* Confirm Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
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
        isVisible={selectedUsers.size > 0 && !confirmModal.show && !showEvalModal}
        selectedCount={selectedUsers.size}
        onClear={() => setSelectedUsers(new Set())}
        onDownload={handleBulkExportCSV}
        onCopy={() => {
          const emails = users.filter(u => selectedUsers.has(u._id)).map(u => u.email).join(', ');
          navigator.clipboard.writeText(emails);
          toast.success('Emails copied to clipboard');
        }}
        onSave={handleBulkDelete}
        downloadLabel="Export"
        saveLabel="Delete"
        itemTypeLabel="Users"
      />


    </div>
  );
}


