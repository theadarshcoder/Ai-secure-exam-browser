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
  TrendingUp, Search, Activity
} from 'lucide-react';
import VisionLogo from '../components/VisionLogo';
import PremiumSidebar from '../components/PremiumSidebar';
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
  getStudents
} from '../services/api';
import AnimatedStatusIcon from '../components/AnimatedStatusIcon';


/* ─────────────────────────────────────────────────────────
   Components
   ───────────────────────────────────────────────────────── */

const Badge = ({ children, color }) => {
  const styles = {
    zinc: 'bg-slate-100 text-slate-600 border-slate-200',
    emerald: 'bg-green-50 text-green-700 border-green-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${styles[color] || styles.zinc} capitalize font-sans`}>
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
    <div className="fixed bottom-6 right-6 w-80 z-[60] animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[400px]">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Help Requests ({requests.length})</h3>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {requests.map((req, i) => (
            <div key={req.id || i} className="bg-white border border-slate-100 rounded-2xl p-4 hover:border-emerald-200 transition-all shadow-sm group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-900 truncate max-w-[150px]">{req.studentName}</span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-4 italic">"{req.message}"</p>
              <button 
                onClick={() => onResolve(req.id)}
                className="w-full py-2 rounded-xl bg-slate-900 hover:bg-[#4ade80] text-white text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-slate-900/10"
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
              <th key={i} className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">{sessionData.exam?.title || 'Exam'} — Evaluation</h3>
            <p className="text-xs text-slate-500 mt-1">
              Student: <span className="font-bold text-slate-700">{sessionData.student?.name}</span> ({sessionData.student?.email})
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-2xl font-black text-slate-900 tabular-nums leading-none">{sessionData.score}/{sessionData.totalMarks}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#22c55e] mt-1">{sessionData.percentage}% — {sessionData.passed ? 'Passed' : 'Failed'}</p>
            </div>
            <button onClick={onClose} className="p-2.5 hover:bg-slate-100 rounded-xl transition-all active:scale-95 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Questions List */}
        <div className="overflow-y-auto max-h-[60vh] p-6 space-y-4 custom-scrollbar">
          {sessionData.questions?.map((q, i) => (
            <div key={i} className={`rounded-xl border p-5 ${
              q.status === 'correct' ? 'border-emerald-200 bg-green-50/30' :
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
                <span className="text-sm font-bold tabular-nums text-slate-700">{q.marksObtained}/{q.maxMarks}</span>
              </div>

              <p className="text-sm text-slate-800 font-medium mb-3">{q.questionText}</p>

              {/* MCQ Detail */}
              {q.type === 'mcq' && (
                <div className="space-y-1.5">
                  {q.options?.map((opt, oi) => (
                    <div key={oi} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                      oi === q.correctChoice && oi === q.studentChoice ? 'bg-green-100 text-green-800 font-bold' :
                      oi === q.correctChoice ? 'bg-green-100 text-green-800 font-bold' :
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
                          className="w-20 px-3 py-2 border border-slate-200 text-sm text-center rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
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
                        className="w-full px-3 py-2 border border-slate-200 text-xs rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 min-h-[60px] resize-none"
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
              className="min-w-[150px] px-5 py-2.5 bg-[#4ade80] text-white text-xs font-bold uppercase hover:bg-green-700 rounded-xl transition-all shadow-lg shadow-green-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
  const [activeTab, setActiveTab] = useState(new URLSearchParams(location.search).get('tab') || 'Overview');
  const [userName] = useState(sessionStorage.getItem('vision_name') || 'Mentor');
  
  // Live data states
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ liveStudents: 0, totalSubmissions: 0, flags: 0, totalExams: 0 });
  const [activity, setActivity] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
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
        const res = await getMentorStats();
        setStats(res.stats || { liveStudents: 0, totalSubmissions: 0, flags: 0, totalExams: 0 });
        setActivity(Array.isArray(res.activity) ? res.activity : []);
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
    { id: 'Exam Management', label: 'Exam Library', icon: FileText },
    { id: 'Results & Reports', label: 'Results & Reports', icon: BarChart3 },
    { id: 'Academics', label: 'Academic Insights', icon: TrendingUp },
  ];

  /* ─────────────────────────────────────────────────────────
     View Renderers
     ───────────────────────────────────────────────────────── */

  const STAT_CARDS = [
    { label: 'Active Test Takers', value: stats.liveStudents, icon: Users },
    { label: 'Violations / Flags', value: stats.flags, icon: AlertTriangle },
    { label: 'Exams Published', value: stats.totalExams, icon: FileText },
  ];

  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STAT_CARDS.map((stat, i) => (
          <div key={i} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-[#22c55e]">
                <stat.icon size={20} />
              </div>
            </div>
            <h3 className="text-[32px] font-semibold text-[#0F0F0F]">{stat.value}</h3>
            <p className="text-sm font-medium text-[#7A7A7A] mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-2">
        <AdminMessageControls activeStudents={[]} mode="full" />
      </div>

      <div className="mb-8">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Live Exam Health</h4>
        {/* Note: This is an overview. If you have multiple exams, you'd iterate. 
            For now, we'll show it for the primary/latest active exam if one exists. */}
        <AdminHealthCockpit currentUserId={sessionStorage.getItem('vision_id') || sessionStorage.getItem('vision_email')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 p-8 rounded-[32px] bg-white border border-slate-200 shadow-sm flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                <ShieldCheck size={20} />
              </div>
              <h4 className="text-base font-bold text-slate-900 uppercase tracking-tight">Real-Time Integrity Feed</h4>
            </div>
            <button onClick={() => setActiveTab('Results & Reports')} className="text-[10px] font-bold text-[#22c55e] uppercase tracking-wider hover:bg-green-50 px-4 py-2 rounded-xl transition-all">View Analytics</button>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
             {/* Socket violations take priority, then API activity */}
             {violations.length > 0 ? violations.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-5 bg-red-50/40 border border-red-100/50 rounded-2xl animate-in slide-in-from-right-3 duration-500">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shadow-sm">
                        <AlertTriangle size={18} />
                      </div>
                      <div>
                         <p className="text-sm font-bold text-slate-900">{v.student}</p>
                         <p className="text-[10px] text-red-500 font-semibold uppercase tracking-wider">{v.type}</p>
                      </div>
                   </div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-lg border border-slate-100">{v.time}</span>
                </div>
             )) : activity.length > 0 ? activity.map((a, i) => (
                <div key={i} className={`flex items-center justify-between p-5 ${a.type === 'flag' ? 'bg-red-50/40 border border-red-100/50' : 'bg-slate-50 border border-slate-100'} rounded-2xl`}>
                   <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${a.type === 'flag' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-[#22c55e]'}`}>
                        {a.type === 'flag' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                      </div>
                      <div>
                         <p className="text-sm font-bold text-slate-900">{a.name}</p>
                         <p className="text-[11px] text-slate-500 font-medium uppercase tracking-tight">{a.action} {a.exam}</p>
                      </div>
                   </div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-lg border border-slate-100">{a.time}</span>
                </div>
             )) : (
               <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 opacity-40">
                  <ShieldCheck size={48} strokeWidth={1} />
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-center">Protocol Active <br/>Zero Violations Detected</p>
               </div>
             )}
          </div>
        </div>
        <div className="lg:col-span-4 p-8 rounded-[32px] bg-white border border-slate-200 shadow-sm">
           <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#22c55e] flex items-center justify-center">
                <CheckCircle2 size={20} />
              </div>
              <h4 className="text-base font-bold text-slate-900 uppercase tracking-tight">System Health</h4>
           </div>
           <div className="space-y-8">
              <div>
                 <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                    <span>Submissions</span>
                    <span className="text-[#22c55e]">{stats.totalSubmissions} / {stats.liveStudents + stats.totalSubmissions}</span>
                 </div>
                 <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 transition-all duration-700 ease-out" style={{ width: `${Math.min((stats.totalSubmissions / Math.max(stats.totalSubmissions + stats.liveStudents, 1)) * 100, 100)}%` }} />
                 </div>
              </div>
              <div>
                 <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                    <span>Integrity Flags</span>
                    <span className={stats.flags > 0 ? 'text-red-600' : 'text-[#22c55e]'}>{stats.flags} Sessions</span>
                 </div>
                 <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-700 ease-out ${stats.flags > 0 ? 'bg-red-400' : 'bg-green-500'}`} style={{ width: `${Math.min((stats.flags / Math.max(stats.totalSubmissions, 1)) * 100, 100)}%` }} />
                 </div>
              </div>
           </div>
           <div className="mt-12 p-5 bg-slate-50 rounded-2xl border border-slate-100">
             <p className="text-[11px] text-slate-500 leading-relaxed italic font-medium">
               "Vision Engine is monitoring all nodes. Secure environment verified."
             </p>
           </div>
        </div>
      </div>
    </div>
  );


  const renderExamLibrary = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
         <h2 className="text-lg font-bold text-slate-900 tracking-tight">Exam Library</h2>
         <button 
           onClick={() => navigate('/mentor/create-exam')}
           className="flex items-center gap-2 bg-[#4ade80] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-green-700 transition-all active:scale-95 shadow-lg shadow-green-500/20"
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
            <td className="px-6 py-4 font-semibold text-sm text-slate-900">{exam.name || exam.title}</td>
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
                    className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors active:scale-95 ${exam.resultsPublished ? 'text-[#22c55e] hover:text-emerald-700' : 'text-slate-400 hover:text-[#22c55e]'}`}
                    title={exam.resultsPublished ? "Results visible to students" : "Results hidden from students"}
                  >
                    {exam.resultsPublished ? <CheckCircle size={14} /> : <EyeOff size={14} />} 
                    {exam.resultsPublished ? 'Published' : 'Hidden'}
                  </button>
                  <button 
                    onClick={() => navigate(`/mentor/create-exam?id=${exam.id || exam._id}&view=true`)}
                    className="text-xs font-bold text-slate-500 hover:text-[#22c55e] uppercase tracking-wider flex items-center gap-1 transition-colors active:scale-95"
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
                 className={`px-4 py-1.5 rounded-md text-[10px] font-bold tracking-widest uppercase transition-all ${resultFilter === f ? 'bg-white text-[#22c55e] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
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
            className={`px-4 py-1.5 rounded-md text-[10px] font-bold tracking-widest uppercase transition-all whitespace-nowrap ${resultFilter === f ? 'bg-white text-[#22c55e] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {f === 'PAST' ? 'EVALUATED / PAST' : f}
          </button>
        ))}
      </div>

      <DataTable 
        loading={loading}
        headers={[
          <input 
            type="checkbox" 
            className="w-4 h-4 rounded border-slate-300 text-[#22c55e] focus:ring-green-500"
            checked={results.length > 0 && results.every(r => selectedResults.has(r._id))}
            onChange={() => {
              if (selectedResults.size === results.length) setSelectedResults(new Set());
              else setSelectedResults(new Set(results.map(r => r._id)));
            }}
          />,
          'Student', 'Exam Name', 'Result', 'Status', 'Violations', 'Submitted', 'Action'
        ]}
        data={results.filter(r => {
          if (resultFilter === 'ALL') return true;
          if (resultFilter === 'PENDING') return r.status === 'pending_review';
          if (resultFilter === 'PAST') return r.status === 'submitted' || r.status === 'evaluated' || r.status === 'completed';
          return true;
        })}
        renderRow={(res, idx) => (
          <tr key={res._id || idx} className={`${selectedResults.has(res._id) ? 'bg-green-50/50' : 'hover:bg-slate-50'} transition-colors`}>
            <td className="px-6 py-4">
              <input 
                type="checkbox" 
                checked={selectedResults.has(res._id)}
                onChange={() => {
                  const next = new Set(selectedResults);
                  if (next.has(res._id)) next.delete(res._id);
                  else next.add(res._id);
                  setSelectedResults(next);
                }}
                className="w-4 h-4 rounded border-slate-300 text-[#22c55e] focus:ring-green-500"
              />
            </td>
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
                    <div className={`h-full rounded-full ${(res.percentage || 0) >= 80 ? 'bg-green-500' : 'bg-amber-400'}`} style={{ width: `${res.percentage || 0}%` }} />
                 </div>
                 <span className={`text-xs font-bold tabular-nums ${(res.percentage || 0) >= 80 ? 'text-emerald-700' : 'text-amber-700'}`}>{res.percentage || 0}%</span>
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
                <div className="flex items-center gap-4">
                   <button 
                     onClick={() => handleViewSession(res._id)}
                     className={`font-bold text-[11px] uppercase tracking-widest flex items-center gap-1 active:scale-95 ${
                       res.status === 'pending_review' 
                         ? 'text-amber-600 hover:text-amber-700' 
                         : 'text-[#22c55e] hover:text-emerald-700'
                     }`}
                   >
                     {res.status === 'pending_review' ? (
                       <><Edit3 size={12} /> Evaluate</>
                     ) : (
                       <><Eye size={12} /> View Report</>
                     )}
                   </button>
                   {res.studentId && (
                     <button 
                       onClick={() => navigate(`/admin/students/${res.studentId}/intelligence`)}
                       className="text-blue-600 hover:text-blue-700 font-bold text-[11px] uppercase tracking-widest flex items-center gap-1 active:scale-95"
                       title="View Intelligence Report"
                     >
                       <ShieldCheck size={12} /> Intelligence
                     </button>
                   )}
                </div>
            </td>
          </tr>
        )}
      />
    </div>
  );

  const renderAcademics = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp size={24} className="text-blue-600" /> Academic Intelligence
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-widest">Global Student Behavioral Analytics</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
               type="text" 
               placeholder="Search students..." 
               value={userSearchQuery}
               onChange={e => setUserSearchQuery(e.target.value)}
               className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
             />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {students.filter(s => 
          !userSearchQuery || 
          s.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
          s.email.toLowerCase().includes(userSearchQuery.toLowerCase())
        ).map((student) => (
          <div key={student._id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-125 transition-transform duration-500">
              <Star size={64} className="text-blue-600" />
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg shadow-sm">
                {student.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{student.name}</h3>
                <p className="text-[11px] text-slate-400 font-medium">{student.email}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enrolled On</span>
                <span className="text-xs font-semibold text-slate-600">{new Date(student.createdAt).toLocaleDateString()}</span>
              </div>
              <button 
                onClick={() => navigate(`/admin/students/${student._id}/intelligence`)}
                className="px-4 py-2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95 flex items-center gap-2"
              >
                <ShieldCheck size={14} /> Analysis
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {students.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
          <Users size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No students found to analyze.</p>
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
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 shrink-0 relative z-40">
          <div className="flex items-center gap-3 text-[13px] font-medium text-slate-400 tracking-wide">
            <span className="hover:text-slate-900 transition-colors cursor-pointer">Mentor Dashboard</span>
            <ChevronRight size={14} className="opacity-40" />
            <span className="text-slate-900 font-semibold">{activeTab}</span>
          </div>

          <div className="flex items-center gap-5">
            <div className="relative ml-2 flex items-center gap-2">
              <button className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-white hover:border-slate-200 transition-all active:scale-95 relative">
                 <Bell size={20} />
                 {violations.length > 0 && (
                   <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                     {violations.length}
                   </span>
                 )}
              </button>
              <div className="flex items-center gap-3 cursor-pointer group px-2">
                {/* Optional Header Actions space */}
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

      {/* Modal confirmations */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-sm border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-5">
              <AlertOctagon size={24} className="text-amber-500" />
            </div>
            <h3 className="text-[13px] font-black text-slate-900 text-center uppercase tracking-widest mb-2">Confirm Action</h3>
            <p className="text-xs text-slate-500 text-center mb-8 font-medium">{confirmModal.msg}</p>
            <div className="flex items-center gap-3">
              <button onClick={closeConfirm} className="flex-1 h-12 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95">Cancel</button>
              <button onClick={() => { confirmModal.onConfirm?.(); closeConfirm(); }} className="flex-1 h-12 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95">Confirm</button>
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
