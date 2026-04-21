import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import socketService from '../services/socket';
import {
  LayoutDashboard, Video, FileText, BarChart3, 
  Search, Bell, Plus, ChevronRight,
  LogOut, Clock, AlertTriangle, 
  CheckCircle2, ArrowUpRight, ArrowDownRight,
  Filter, Download, Eye, Power, Users, ShieldCheck, 
  Edit3, RefreshCw, Trash2, X, Check, AlertCircle,
  Code, MessageSquare, Star, CheckCircle, AlertOctagon, EyeOff
} from 'lucide-react';
import VisionLogo from '../components/VisionLogo';
import PremiumSidebar from '../components/PremiumSidebar';
import BouncingDotLoader from '../components/BouncingDotLoader';
import { 
  getMentorStats, 
  getMentorExamList, 
  getAllResults,
  getSessionDetail,
  evaluateSession,
  togglePublishResults,
  deleteExam
} from '../services/api';
import AnimatedStatusIcon from '../components/AnimatedStatusIcon';

/* ─────────────────────────────────────────────────────────
   Components
   ───────────────────────────────────────────────────────── */

const StatusBadge = ({ status }) => {
  const styles = {
    normal: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    terminated: 'bg-red-50 text-red-700 border-red-200',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    live: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    draft: 'bg-slate-100 text-slate-600 border-slate-200',
    low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    high: 'bg-red-50 text-red-700 border-red-200',
    submitted: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    auto_submitted: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    pending_review: 'bg-amber-100 text-amber-800 border-amber-200',
    in_progress: 'bg-blue-100 text-blue-800 border-blue-200 animate-pulse',
    blocked: 'bg-red-100 text-red-800 border-red-200',
    manually_graded: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    correct: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    incorrect: 'bg-red-50 text-red-700 border-red-200',
    partial: 'bg-amber-50 text-amber-700 border-amber-200',
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
    manually_graded: '📝 Mentor Graded',
    correct: 'Correct',
    incorrect: 'Incorrect',
    partial: 'Partial',
  };

  const current = styles[status?.toLowerCase()] || styles.draft;

  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${current} capitalize`}>
      {labels[status] || status}
    </span>
  );
};

/* ─────────────────────────────────────────────────────────
   Floating Help Requests Panel
   ───────────────────────────────────────────────────────── */

const FloatingHelpPanel = ({ requests, onResolve }) => {
  if (requests.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 w-80 z-[60] animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[400px]">
        <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Help Requests ({requests.length})</h3>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
          {requests.map((req, i) => (
            <div key={req.id || i} className="bg-slate-800/80 border border-white/5 rounded-xl p-3 hover:border-white/10 transition-all group">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black text-emerald-400 truncate max-w-[150px]">{req.studentName}</span>
                <span className="text-[8px] font-mono text-slate-500">{new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed mb-3">"{req.message}"</p>
              <button 
                onClick={() => onResolve(req.id)}
                className="w-full py-1.5 rounded-lg bg-slate-700 hover:bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
              >
                Mark Resolved
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


const DataTable = ({ headers, data, renderRow, loading }) => (
  <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200 font-sans">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <tr>
              <td colSpan={headers.length} className="bg-white p-0">
                <BouncingDotLoader text="Syncing system data..." />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-6 py-12 text-center text-slate-400 font-medium">
                No active records found.
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
      setGrades(initial);
    }
  }, [sessionData]);

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
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">{sessionData.exam?.title || 'Exam'} — Evaluation</h3>
            <p className="text-xs text-slate-500 mt-1">
              Student: <span className="font-bold text-slate-700">{sessionData.student?.name}</span> ({sessionData.student?.email})
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xl font-bold text-slate-900">{sessionData.score}/{sessionData.totalMarks}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{sessionData.percentage}% — {sessionData.passed ? 'Passed' : 'Failed'}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <X size={18} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Questions List */}
        <div className="overflow-y-auto max-h-[60vh] p-6 space-y-4 custom-scrollbar">
          {sessionData.questions?.map((q, i) => (
            <div key={i} className={`rounded-xl border p-5 ${
              q.status === 'correct' ? 'border-emerald-200 bg-emerald-50/30' :
              q.status === 'incorrect' ? 'border-red-200 bg-red-50/30' :
              q.status === 'partial' ? 'border-amber-200 bg-amber-50/30' :
              q.status === 'manually_graded' ? 'border-blue-200 bg-blue-50/30' :
              'border-slate-200 bg-white'
            }`}>
              {/* Question Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Q{q.index + 1}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    q.type === 'mcq' ? 'bg-blue-100 text-blue-700' :
                    q.type === 'coding' ? 'bg-purple-100 text-purple-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {q.type === 'mcq' && '🔘 MCQ'}
                    {q.type === 'coding' && '💻 Coding'}
                    {q.type === 'short' && '📝 Short Answer'}
                  </span>
                  <StatusBadge status={q.status} />
                </div>
                <span className="text-sm font-black tabular-nums text-slate-700">{q.marksObtained}/{q.maxMarks}</span>
              </div>

              <p className="text-sm text-slate-800 font-medium mb-3">{q.questionText}</p>

              {/* MCQ Detail */}
              {q.type === 'mcq' && (
                <div className="space-y-1.5">
                  {q.options?.map((opt, oi) => (
                    <div key={oi} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                      oi === q.correctChoice && oi === q.studentChoice ? 'bg-emerald-100 text-emerald-800 font-bold' :
                      oi === q.correctChoice ? 'bg-emerald-100 text-emerald-800 font-bold' :
                      oi === q.studentChoice ? 'bg-red-100 text-red-800 font-bold' :
                      'bg-slate-50 text-slate-600'
                    }`}>
                      {oi === q.correctChoice && <Check size={12} />}
                      {oi === q.studentChoice && oi !== q.correctChoice && <X size={12} />}
                      <span>{opt}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Coding Detail */}
              {q.type === 'coding' && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Test Cases: {q.passedTestCases}/{q.totalTestCases} Passed
                  </p>
                  {q.studentAnswer && (
                    <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs overflow-x-auto max-h-40">
                      {typeof q.studentAnswer === 'object' ? q.studentAnswer.code : q.studentAnswer}
                    </pre>
                  )}
                  {q.testCaseResults?.map((tc, ti) => (
                    <div key={ti} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                      tc.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {tc.passed ? <Check size={12} /> : <X size={12} />}
                      <span>Test #{tc.testCaseIndex + 1}: {tc.passed ? 'Passed' : (tc.error || `Expected "${tc.expectedOutput}", got "${tc.actualOutput}"`)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Short Answer Detail */}
              {q.type === 'short' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Student's Answer</p>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 min-h-[60px]">
                        {typeof q.studentAnswer === 'object' ? q.studentAnswer.code : (q.studentAnswer || <span className="italic text-slate-400">No answer provided</span>)}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Expected Answer</p>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-700 min-h-[60px]">
                        {q.expectedAnswer || <span className="italic text-slate-400">Not configured</span>}
                      </div>
                    </div>
                  </div>

                  {/* AI Suggestion */}
                  {q.aiSuggestedMarks != null && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Star size={12} className="text-indigo-600" />
                        <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest">AI Suggestion: {q.aiSuggestedMarks}/{q.maxMarks}</p>
                      </div>
                      <p className="text-xs text-indigo-600">{q.aiReasoning}</p>
                    </div>
                  )}

                  {/* Mentor Grading Inputs (only for pending_review) */}
                  {q.status === 'pending_review' && grades[q.index] !== undefined && (
                    <div className="bg-white border-2 border-amber-300 rounded-xl p-4 space-y-3">
                      <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-1.5">
                        <Edit3 size={12} /> Mentor Evaluation
                      </p>
                      <div className="flex items-center gap-4">
                        <label className="text-xs font-bold text-slate-600">Marks:</label>
                        <input
                          type="number"
                          min="0"
                          max={q.maxMarks}
                          value={grades[q.index]?.marksObtained ?? 0}
                          onChange={e => setGrades(prev => ({
                            ...prev,
                            [q.index]: { ...prev[q.index], marksObtained: Number(e.target.value) }
                          }))}
                          className="w-20 px-3 py-2 border border-slate-200 text-sm text-center rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        />
                        <span className="text-xs text-slate-400">/ {q.maxMarks}</span>
                      </div>
                      <textarea
                        placeholder="Mentor feedback (optional)..."
                        value={grades[q.index]?.mentorFeedback || ''}
                        onChange={e => setGrades(prev => ({
                          ...prev,
                          [q.index]: { ...prev[q.index], mentorFeedback: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-slate-200 text-xs rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 min-h-[60px] resize-none"
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
          <div className="px-8 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 text-xs font-bold text-slate-500 uppercase hover:bg-slate-100 rounded-xl transition-all active:scale-95">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitStatus !== 'idle'}
              className="min-w-[150px] px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold uppercase hover:bg-emerald-700 rounded-xl transition-all shadow-lg shadow-emerald-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <AnimatedStatusIcon status={submitStatus} icon={<Check size={14} />} size={14} />
              {submitStatus === 'loading' ? 'Submitting' : submitStatus === 'success' ? 'Submitted' : 'Submit Grades'}
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
  const [activeTab, setActiveTab] = useState('Overview');
  const [userName] = useState(sessionStorage.getItem('vision_name') || 'Mentor');
  
  // Live data states
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ liveStudents: 0, totalSubmissions: 0, flags: 0, totalExams: 0 });
  const [activity, setActivity] = useState([]);
  const [liveSessions, setLiveSessions] = useState([]);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [resultFilter, setResultFilter] = useState('ALL');
  const [sessionDetail, setSessionDetail] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Evaluation Modal state
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [evalSessionData, setEvalSessionData] = useState(null);
  const [helpError, setHelpError] = useState(false);
  const [isTabViolation, setIsTabViolation] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [evalLoading, setEvalLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('idle');

  // Real-time violation alerts state (via Socket.IO)
  const [violations, setViolations] = useState([]);
  const [helpRequests, setHelpRequests] = useState([]);


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
      } catch (err) {}
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
      if (tab === 'Overview' || tab === 'Live Proctoring') {
        const res = await getMentorStats();
        setStats(res.stats || { liveStudents: 0, totalSubmissions: 0, flags: 0, totalExams: 0 });
        setActivity(Array.isArray(res.activity) ? res.activity : []);
        setLiveSessions(Array.isArray(res.performance) ? res.performance : []);
      } else if (tab === 'Exam Management') {
        const res = await getMentorExamList();
        setExams(Array.isArray(res) ? res : []);
      } else if (tab === 'Results & Reports') {
        const res = await getAllResults();
        const data = res?.results || res || [];
        setResults(Array.isArray(data) ? data : []);
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
      toast.error('Failed to submit grades: ' + (err.message || 'Unknown error'));
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

  const navItems = [
    { id: 'Overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'Live Proctoring', label: 'Live Proctoring', icon: Video },
    { id: 'Exam Management', label: 'Exam Library', icon: FileText },
    { id: 'Results & Reports', label: 'Results & Reports', icon: BarChart3 },
  ];

  /* ─────────────────────────────────────────────────────────
     View Renderers
     ───────────────────────────────────────────────────────── */

  const STAT_CARDS = [
    { label: 'Active Test Takers', value: stats.liveStudents, trendType: 'up', icon: Users },
    { label: 'Violations / Flags', value: stats.flags, trendType: stats.flags > 0 ? 'up' : 'neutral', icon: AlertTriangle },
    { label: 'Exams Published', value: stats.totalExams, trendType: 'neutral', icon: FileText },
  ];

  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STAT_CARDS.map((stat, i) => (
          <div key={i} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <stat.icon size={20} />
              </div>
              <span className={`text-xs font-bold flex items-center gap-1 ${
                stat.trendType === 'up' ? 'text-emerald-600' : 
                stat.trendType === 'down' ? 'text-red-600' : 'text-slate-400'
              }`}>
                {stat.trendType === 'up' && <ArrowUpRight size={14} />}
                {stat.trendType === 'down' && <ArrowDownRight size={14} />}
              </span>
            </div>
            <h3 className="text-[32px] font-bold text-[#0F0F0F]">{stat.value}</h3>
            <p className="text-sm font-medium text-[#7A7A7A] mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Recent Activity</h4>
            <button onClick={() => setActiveTab('Results & Reports')} className="text-xs font-bold text-emerald-600 hover:underline">View All</button>
          </div>
          <div className="space-y-4">
             {/* Socket violations take priority, then API activity */}
             {violations.length > 0 ? violations.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-4 bg-red-50/50 border border-red-100 rounded-xl animate-in slide-in-from-right-2">
                   <div className="flex items-center gap-3">
                      <AlertTriangle size={16} className="text-red-500" />
                      <div>
                         <p className="text-[13px] font-bold text-slate-900">{v.student}</p>
                         <p className="text-[11px] text-slate-500">{v.type}</p>
                      </div>
                   </div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase">{v.time}</span>
                </div>
             )) : activity.length > 0 ? activity.map((a, i) => (
                <div key={i} className={`flex items-center justify-between p-4 ${a.type === 'flag' ? 'bg-red-50/50 border border-red-100' : 'bg-slate-50 border border-slate-100'} rounded-xl`}>
                   <div className="flex items-center gap-3">
                      {a.type === 'flag' ? <AlertTriangle size={16} className="text-red-500" /> : <CheckCircle2 size={16} className="text-emerald-500" />}
                      <div>
                         <p className="text-[13px] font-bold text-slate-900">{a.name}</p>
                         <p className="text-[11px] text-slate-500">{a.action} {a.exam}</p>
                      </div>
                   </div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase">{a.time}</span>
                </div>
             )) : (
               <div className="h-32 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <ShieldCheck size={24} className="opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest opacity-40 text-center">No integrity violations detected <br/>in the current session</p>
               </div>
             )}
          </div>
        </div>
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
           <div className="flex items-center gap-2 mb-6">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Quick Stats</h4>
           </div>
           <div className="space-y-6">
              <div>
                 <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    <span>Submissions</span>
                    <span className="text-emerald-600">{stats.totalSubmissions}</span>
                 </div>
                 <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${Math.min((stats.totalSubmissions / Math.max(stats.totalSubmissions + stats.liveStudents, 1)) * 100, 100)}%` }} />
                 </div>
              </div>
              <div>
                 <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    <span>Flagged Sessions</span>
                    <span className={stats.flags > 0 ? 'text-red-600' : 'text-emerald-600'}>{stats.flags}</span>
                 </div>
                 <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-500 ${stats.flags > 0 ? 'bg-red-400' : 'bg-emerald-500'}`} style={{ width: `${Math.min((stats.flags / Math.max(stats.totalSubmissions, 1)) * 100, 100)}%` }} />
                 </div>
              </div>
           </div>
           <p className="text-[11px] text-slate-500 mt-8 leading-relaxed italic">
             "Proctoring active. Real-time data refreshes on each tab switch."
           </p>
        </div>
      </div>
    </div>
  );

  const renderLiveProctoring = () => {
    // Filter live sessions based on debounced search
    const filtered = liveSessions
      .map(s => ({
        ...s,
        threatScore: (s.tabSwitchCount || 0) * 2 + (s.warningCount || 0),
        isHighRisk: (s.tabSwitchCount || 0) >= 3 || (s.warningCount || 0) >= 2
      }))
      .sort((a, b) => b.threatScore - a.threatScore) // Highest risk first
      .filter(s => 
        !debouncedSearch || 
        (s.name || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (s.exam || '').toLowerCase().includes(debouncedSearch.toLowerCase())
      );

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Live Environment
            </h2>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">{stats.liveStudents} active sessions</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Filter candidates..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none w-64 bg-white"
              />
            </div>
            <button onClick={() => fetchDataForTab('Live Proctoring')} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-all active:scale-95">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        <DataTable 
          loading={loading}
          headers={['Student', 'Exam', 'Score', 'Status', 'Actions']}
          data={filtered}
          renderRow={(session, idx) => (
            <tr key={idx} className={`hover:bg-slate-50 transition-colors group ${session.isHighRisk ? 'bg-red-50/30' : ''}`}>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-xs ${session.isHighRisk ? 'bg-red-100 border-red-200 text-red-600 animate-pulse' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                    {(session.name || 'S').charAt(0)}
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-900">{session.name || 'Student'}</span>
                    {session.isHighRisk && <p className="text-[8px] font-black text-red-500 uppercase mt-0.5">High Integrity Risk</p>}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-xs font-medium text-slate-600">
                {session.exam || 'N/A'}
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col gap-1">
                  <span className={`text-xs font-black tabular-nums ${(session.score || 0) >= 80 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {session.score != null ? `${session.score}%` : 'Pending'}
                  </span>
                  <div className="flex items-center gap-2">
                     <span className="text-[9px] text-slate-400 uppercase font-bold">Tabs: {session.tabSwitchCount || 0}</span>
                     <span className="text-[9px] text-slate-400 uppercase font-bold">Warns: {session.warningCount || 0}</span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                 <StatusBadge status={session.status || 'Active'} />
              </td>
              <td className="px-6 py-4">
                 <div className="flex items-center gap-2">
                   <button 
                     onClick={() => navigate(`/mentor/monitor?id=${session.sessionId || session._id}&name=${session.name}&exam=${session.exam}&risk=${session.isHighRisk ? 'High' : 'Low'}`)}
                     className="flex items-center gap-2 text-[11px] font-black uppercase text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-[10px] transition-all border border-transparent hover:border-emerald-100 active:scale-95"
                   >
                      <Eye size={12} /> View
                   </button>
                 </div>
              </td>
            </tr>
          )}
        />
      </div>
    );
  };

  const renderExamLibrary = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
         <h2 className="text-lg font-bold text-slate-900 tracking-tight">Exam Library</h2>
         <button 
           onClick={() => navigate('/mentor/create-exam')}
           className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-600/20"
         >
            <Plus size={16} /> Create New Exam
         </button>
      </div>

      <DataTable 
        loading={loading}
        headers={['Assessment Title', 'Category', 'Duration', 'Questions', 'Status', 'Actions']}
        data={exams}
        renderRow={(exam) => (
          <tr key={exam.id || exam._id} className="hover:bg-slate-50 transition-colors">
            <td className="px-6 py-4 font-bold text-sm text-slate-900">{exam.name || exam.title}</td>
            <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">{exam.category || 'Standard'}</td>
            <td className="px-6 py-4 text-xs text-slate-500 tabular-nums font-medium">{exam.duration || '—'} MIN</td>
            <td className="px-6 py-4 text-xs text-slate-500 tabular-nums font-medium">{exam.questionsCount || 0} Qs</td>
            <td className="px-6 py-4">
               <StatusBadge status={exam.status || 'draft'} />
            </td>
            <td className="px-6 py-4">
               <div className="flex items-center gap-4">
                  <button 
                    onClick={() => handleTogglePublishResults(exam.id || exam._id, exam.resultsPublished)} 
                    className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors active:scale-95 ${exam.resultsPublished ? 'text-emerald-600 hover:text-emerald-700' : 'text-slate-400 hover:text-emerald-600'}`}
                    title={exam.resultsPublished ? "Results visible to students" : "Results hidden from students"}
                  >
                    {exam.resultsPublished ? <CheckCircle size={14} /> : <EyeOff size={14} />} 
                    {exam.resultsPublished ? 'Published' : 'Hidden'}
                  </button>
                  <button 
                    onClick={() => navigate(`/mentor/create-exam?id=${exam.id || exam._id}&view=true`)}
                    className="text-xs font-bold text-slate-500 hover:text-emerald-600 uppercase tracking-wider flex items-center gap-1 transition-colors active:scale-95"
                  >
                    <Eye size={14} /> View
                  </button>
                  <button 
                    onClick={() => navigate(`/mentor/create-exam?id=${exam.id || exam._id}`)}
                    className="text-xs font-bold text-slate-500 hover:text-amber-600 uppercase tracking-wider flex items-center gap-1 transition-colors active:scale-95"
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteExam(exam.id || exam._id)}
                    className="text-xs font-bold text-slate-400 hover:text-red-600 uppercase tracking-wider flex items-center gap-1 transition-colors active:scale-95"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
               </div>
            </td>
          </tr>
        )}
      />
    </div>
  );

  const renderResults = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
           <h2 className="text-lg font-bold text-slate-900 tracking-tight">Post-Exam Analytics</h2>
           <div className="hidden md:flex bg-slate-100/80 p-1 rounded-lg">
             {['ALL', 'PENDING', 'PAST'].map(f => (
               <button 
                 key={f}
                 onClick={() => setResultFilter(f)}
                 className={`px-4 py-1.5 rounded-md text-[10px] font-bold tracking-widest uppercase transition-all ${resultFilter === f ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
               >
                 {f === 'PAST' ? 'EVALUATED / PAST' : f}
               </button>
             ))}
           </div>
         </div>
         <div className="flex items-center gap-3">
           <button 
             onClick={handleExportCsv}
             className="flex items-center gap-2 text-xs font-bold text-slate-600 border border-slate-200 px-4 py-2 rounded-xl hover:bg-white shadow-sm transition-all active:scale-95"
           >
              <Download size={14} /> Export CSV
           </button>
           <button 
             onClick={() => fetchDataForTab('Results & Reports')}
             className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
           >
             <RefreshCw size={14} />
           </button>
         </div>
      </div>
      
      {/* Mobile filter bar */}
      <div className="md:hidden flex bg-slate-100/80 p-1 rounded-lg w-full overflow-x-auto scroll-thin mb-4">
        {['ALL', 'PENDING', 'PAST'].map(f => (
          <button 
            key={f}
            onClick={() => setResultFilter(f)}
            className={`px-4 py-1.5 rounded-md text-[10px] font-bold tracking-widest uppercase transition-all whitespace-nowrap ${resultFilter === f ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {f === 'PAST' ? 'EVALUATED / PAST' : f}
          </button>
        ))}
      </div>

      <DataTable 
        loading={loading}
        headers={['Student', 'Exam Name', 'Result', 'Status', 'Violations', 'Submitted', 'Action']}
        data={results.filter(r => {
          if (resultFilter === 'ALL') return true;
          if (resultFilter === 'PENDING') return r.status === 'pending_review';
          if (resultFilter === 'PAST') return r.status === 'submitted' || r.status === 'evaluated' || r.status === 'completed';
          return true;
        })}
        renderRow={(res, idx) => (
          <tr key={res._id || idx} className="hover:bg-slate-50 transition-colors">
            <td className="px-6 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">{res.studentName || 'Student'}</p>
                <p className="text-[10px] text-slate-400">{res.studentEmail || ''}</p>
              </div>
            </td>
            <td className="px-6 py-4 text-xs font-medium text-slate-600">{res.examTitle || 'Exam'}</td>
            <td className="px-6 py-4">
               <div className="flex items-center gap-2">
                 <div className="max-w-[100px] flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${(res.percentage || 0) >= 80 ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${res.percentage || 0}%` }} />
                 </div>
                 <span className={`text-xs font-black tabular-nums ${(res.percentage || 0) >= 80 ? 'text-emerald-700' : 'text-amber-700'}`}>{res.percentage || 0}%</span>
               </div>
            </td>
            <td className="px-6 py-4">
               <StatusBadge status={res.status || 'submitted'} />
            </td>
            <td className="px-6 py-4 text-xs font-bold text-red-500 tabular-nums">{res.totalViolations || 0} Flags</td>
            <td className="px-6 py-4 text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
               <Clock size={12} /> {res.submittedAt ? new Date(res.submittedAt).toLocaleString() : 'N/A'}
            </td>
            <td className="px-6 py-4">
               <button 
                 onClick={() => handleViewSession(res._id)}
                 className={`font-bold text-[11px] uppercase tracking-widest flex items-center gap-1 active:scale-95 ${
                   res.status === 'pending_review' 
                     ? 'text-amber-600 hover:text-amber-700' 
                     : 'text-emerald-600 hover:text-emerald-700'
                 }`}
               >
                 {res.status === 'pending_review' ? (
                   <><Edit3 size={12} /> Evaluate</>
                 ) : (
                   <><Eye size={12} /> View Report</>
                 )}
               </button>
            </td>
          </tr>
        )}
      />
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'Overview': return renderOverview();
      case 'Live Proctoring': return renderLiveProctoring();
      case 'Exam Management': return renderExamLibrary();
      case 'Results & Reports': return renderResults();
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-white font-sans text-slate-900 select-none antialiased">
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
        <header className="h-20 bg-white flex items-center justify-between px-8 relative z-20">
          <div className="flex items-center gap-3 text-[13px] font-medium text-slate-400 tracking-wide">
            <span className="hover:text-slate-900 transition-colors cursor-pointer">Mentor Dashboard</span>
            <ChevronRight size={14} className="opacity-40" />
            <span className="text-slate-900 font-semibold">{activeTab}</span>
          </div>

          <div className="flex items-center gap-5">
            <div className="relative ml-2 flex items-center gap-4">
              <div className="relative group cursor-pointer">
                 <Bell size={20} className="text-slate-400 hover:text-slate-600 transition-colors" />
                 {violations.length > 0 && (
                   <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                 )}
              </div>
              <div className="h-6 w-px bg-slate-200 mx-2" />
              <div className="flex items-center gap-3 cursor-pointer group">
                <div className="text-right">
                  <p className="text-[13px] font-semibold text-[#0F0F0F] leading-none">{userName}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm ml-1">
                  {userName.charAt(0)}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Section */}
        <section className="flex-1 overflow-y-auto p-10 custom-scrollbar">
           {renderContent()}
        </section>
      </main>

      {/* Evaluation Modal */}
      {showEvalModal && (
        evalLoading ? (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center">
             <div className="bg-white rounded-3xl p-8 flex items-center justify-center shadow-2xl animate-in zoom-in-95 h-[300px] w-[300px]">
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

      {/* Confirm Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 shadow-2xl w-full max-w-sm border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-5">
              <AlertOctagon size={24} className="text-amber-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 text-center uppercase tracking-wider mb-2">Confirm Action</h3>
            <p className="text-xs text-slate-500 text-center mb-8 font-medium">{confirmModal.msg}</p>
            <div className="flex items-center gap-3">
              <button onClick={closeConfirm} className="flex-1 h-12 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider hover:bg-slate-50 transition-all active:scale-95">Cancel</button>
              <button onClick={() => { confirmModal.onConfirm?.(); closeConfirm(); }} className="flex-1 h-12 rounded-xl bg-red-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition-all shadow-lg shadow-red-900/20 active:scale-95">Confirm</button>
            </div>
          </div>
        </div>
      )}


      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
      <FloatingHelpPanel 
        requests={helpRequests} 
        onResolve={(id) => setHelpRequests(prev => prev.filter(r => r.id !== id))} 
      />
    </div>
  );
}
