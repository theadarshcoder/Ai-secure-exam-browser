import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import socketService from '../services/socket';
import {
  LayoutDashboard, Users, FileText, Settings,
  Search, FileUp, UserPlus, Trash2, Eye,
  ShieldCheck, Activity, AlertOctagon,
  ChevronRight, LogOut, Bell, RefreshCw, Edit3,
  BarChart3, Download, Clock, Check, X, Star, CheckCircle, AlertCircle, Plus, ScanFace, Radio, ShieldAlert, User, EyeOff, MessageCircle, AlertTriangle
} from 'lucide-react';
import VisionLogo from '../components/VisionLogo';
import api, { 
  getDashboardStats, 
  getStudents, 
  getMentors, 
  removeStudent, 
  removeMentor,
  addUser,
  bulkImportUsers,
  getSettings,
  saveSettings,
  getAdminExams,
  getAuditLogs,
  getAdminResults,
  getAdmins,
  getSessionDetail,
  evaluateSession,
  getCandidates,
  verifyCandidate,
  unverifyCandidate,
  deleteExam,
  togglePublishResults,
  deleteAuditLog,
  clearAllAuditLogs
} from '../services/api';

// ─────────────────────────────────────────────────────────
// UI Utilities (matching MentorDashboard style)
// ─────────────────────────────────────────────────────────

const Badge = ({ children, color }) => {
  const styles = {
    zinc: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${styles[color] || styles.zinc} capitalize`}>
      {children}
    </span>
  );
};

const DataTable = ({ headers, data, renderRow, loading }) => (
  <div className="w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-zinc-50 border-b border-zinc-200 font-sans">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {loading ? (
             <tr>
               <td colSpan={headers.length} className="px-6 py-12 text-center text-zinc-400">
                 <div className="flex items-center justify-center gap-2">
                   <RefreshCw size={16} className="animate-spin" /> Syncing with server...
                 </div>
               </td>
             </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-6 py-12 text-center text-zinc-400 font-medium">
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

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────


/* ─────────────────────────────────────────────────────────
   Session Report Modal Component
   ───────────────────────────────────────────────────────── */

const SessionReportModal = ({ sessionData, onClose }) => {
  if (!sessionData) return null;

  return (
    <div className="fixed inset-0 bg-zinc-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-zinc-200 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-zinc-200 bg-zinc-50 font-sans">
          <div>
            <h3 className="text-base font-black text-zinc-900 uppercase tracking-wider">{sessionData.exam?.title || 'Exam Report'} — Detail</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Student: <span className="font-bold text-zinc-700">{sessionData.student?.name || 'Unknown'}</span> ({sessionData.student?.email || 'N/A'})
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xl font-black text-zinc-900 tabular-nums">{sessionData.score ?? 0}/{sessionData.totalMarks ?? 0}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">{sessionData.percentage ?? 0}% — {sessionData.passed ? 'PASSED' : 'FAILED'}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-xl transition-all active:scale-95">
              <X size={18} className="text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Questions List */}
        <div className="overflow-y-auto max-h-[65vh] p-8 space-y-6 custom-scrollbar">
          {(!sessionData.questions || sessionData.questions.length === 0) ? (
            <div className="text-center py-20">
              <AlertCircle size={40} className="mx-auto text-zinc-200 mb-4" />
              <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">No detailed question data available for this session.</p>
            </div>
          ) : (
            sessionData.questions.map((q, i) => (
              <div key={i} className={`rounded-2xl border p-6 transition-all ${
                q.status === 'correct' ? 'border-emerald-200 bg-emerald-50/20' :
                q.status === 'incorrect' ? 'border-red-200 bg-red-50/20' :
                q.status === 'partial' ? 'border-amber-200 bg-amber-50/20' :
                'border-zinc-200 bg-zinc-50/30'
              }`}>
                {/* Question Info */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Question {q.index + 1}</span>
                    <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
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
                  <span className="text-sm font-black text-zinc-900 tabular-nums bg-white px-3 py-1 rounded-lg border border-zinc-100">
                    {q.marksObtained ?? 0} <span className="text-zinc-300 font-bold mx-0.5">/</span> {q.maxMarks || q.marks || 0}
                  </span>
                </div>

                <p className="text-sm text-zinc-800 font-semibold leading-relaxed mb-6">{q.questionText}</p>

                {/* Specific answer views */}
                {q.type === 'mcq' && q.options && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {q.options.map((opt, oi) => {
                      const isCorrect = oi === q.correctChoice;
                      const isStudent = oi === q.studentChoice;
                      return (
                        <div key={oi} className={`px-4 py-3 rounded-xl text-xs flex items-center gap-3 border transition-all ${
                          isCorrect ? 'bg-emerald-100 border-emerald-200 text-emerald-800 font-bold' :
                          isStudent ? 'bg-red-50 border-red-200 text-red-700 font-bold' :
                          'bg-white border-zinc-100 text-zinc-500'
                        }`}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                             isCorrect ? 'bg-emerald-500 text-white' :
                             isStudent ? 'bg-red-500 text-white' : 
                             'bg-zinc-100 text-zinc-400'
                          }`}>
                            {isCorrect ? <Check size={12} /> : isStudent ? <X size={12} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
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
                       <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Submission Artifact</p>
                       <span className="text-[10px] font-bold text-zinc-400 uppercase bg-zinc-100 px-2 py-0.5 rounded">Source Code</span>
                    </div>
                    <pre className="bg-zinc-900 text-zinc-100 p-5 rounded-2xl text-[11px] font-mono leading-relaxed overflow-x-auto max-h-48 border border-white/5 custom-scrollbar">
                      {typeof q.studentAnswer === 'object' ? q.studentAnswer.code : q.studentAnswer}
                    </pre>
                  </div>
                )}

                {q.type === 'short' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <CheckCircle size={12} className="text-zinc-300" /> Student's Response
                      </p>
                      <div className="text-xs text-zinc-700 leading-relaxed italic">
                        {typeof q.studentAnswer === 'object' ? q.studentAnswer.code : (q.studentAnswer || "No content provided.")}
                      </div>
                    </div>
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 shadow-sm">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                         <Star size={12} className="text-emerald-400" /> Expected Blueprint
                      </p>
                      <div className="text-xs text-emerald-800 leading-relaxed font-medium">
                        {q.expectedAnswer || "Static evaluation criteria not configured."}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-zinc-200 bg-zinc-50 flex items-center justify-end gap-3">
           <p className="text-[11px] font-bold text-zinc-400 mr-auto flex items-center gap-2">
             <ShieldCheck size={14} className="text-emerald-500" /> Secure Exam Artifact — System Verified
           </p>
           <button 
             onClick={onClose}
             className="px-6 py-2.5 bg-zinc-900 text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-zinc-900/20"
           >
             Close Artifact
           </button>
        </div>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('Overview');
  
  const [userName] = useState(sessionStorage.getItem('vision_name') || 'Administrator');
  const [userRole] = useState(sessionStorage.getItem('vision_role') || 'admin');

  // App States
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalUsers: 0, activeExams: 0, systemHealth: '100%', totalViolations: 0 });
  const [auditLogs, setAuditLogs] = useState([]);
  const [helpRequests, setHelpRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [exams, setExams] = useState([]);
  const [adminResults, setAdminResults] = useState([]);
  const [resultFilter, setResultFilter] = useState('ALL');
  // Evaluation Modal state
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [evalSessionData, setEvalSessionData] = useState(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Candidate eKYC states
  const [candidates, setCandidates] = useState([]);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [settings, setSettingsState] = useState({
     maxTabSwitches: 5,
     forceFullscreen: true,
     allowLateSubmissions: false,
     enableWebcam: true,
     disableCopyPaste: true,
     requireIDVerification: true
  });

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'student' });


  // Confirm modal system
  const [confirmModal, setConfirmModal] = useState({ show: false, msg: '', onConfirm: null });
  const showConfirm = (msg, onConfirm) => setConfirmModal({ show: true, msg, onConfirm });
  const closeConfirm = () => setConfirmModal({ show: false, msg: '', onConfirm: null });

  useEffect(() => {
    fetchDataForTab(activeTab);
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
      toast.error(`VIOLATION: ${data.studentId} - ${data.type}`, { icon: '🚨' });
      const newNotif = { ...data, id: Date.now(), type: 'violation', unread: true, timestamp: new Date() };
      setNotifications(prev => [newNotif, ...prev]);
    });

    return () => socketService.disconnect();
  }, []);

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
              const [res, logsRes] = await Promise.all([
                  getDashboardStats().catch(() => ({})),
                  getAuditLogs().catch(() => [])
              ]);
              setStats({
                  totalUsers: res.totalAttempts || 0,
                  activeExams: res.liveExams || 0,
                  systemHealth: '100%',
                  totalViolations: res.flaggedSessions || 0
              });
              setAuditLogs(logsRes || []);
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
              const res = await getSettings();
              if (res) setSettingsState(res);
          } else if (tab === 'Candidates') {
              const res = await getCandidates(candidateSearch).catch(() => []);
              setCandidates(res || []);
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
    } catch (err) {
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
      } catch (err) {
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
       } catch (err) {
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
      } catch (err) {
        toast.error('Failed to delete selected users');
      }
    });
  };

  const handleBulkExportCSV = () => {
    if (selectedUsers.size === 0) return;
    const selectedData = users.filter(u => selectedUsers.has(u._id));
    
    const headers = 'ID,Name,Email,Role,Date Added\n';
    const rows = selectedData.map(u => `"${u._id}","${u.name}","${u.email}","${u.role}","${new Date(u.createdAt).toLocaleDateString()}"`).join('\n');
    
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
    if (selectedUsers.size === filteredUsers.length && filteredUsers.length > 0) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u._id)));
    }
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

  const handleGradeSubmit = async (gradeArray) => {
    if (!evalSessionData) return;
    setIsSubmitting(true);
    try {
      await evaluateSession(evalSessionData.sessionId, gradeArray);
      toast.success('Session graded successfully!');
      setShowEvalModal(false);
      setEvalSessionData(null);
      fetchDataForTab('Results');
    } catch (err) {
      console.error('Failed to submit grades:', err);
      toast.error('Failed to submit grades: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

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
    { id: 'Overview', label: 'Overview', icon: LayoutDashboard, access: ['admin', 'super_mentor'] },
    { id: 'Users', label: 'User Management', icon: Users, access: ['admin', 'super_mentor'] },
    { id: 'Candidates', label: 'Candidates', icon: ScanFace, access: ['admin', 'super_mentor'] },
    { id: 'Exams', label: 'Exam Library', icon: FileText, access: ['admin', 'super_mentor'] },
    { id: 'Results', label: 'Results & Reports', icon: BarChart3, access: ['admin', 'super_mentor'] },
    { id: 'Settings', label: 'System Settings', icon: Settings, access: ['admin'] },
  ];

  const visibleTabs = tabs.filter(t => t.access.includes(userRole));

  // ────────── Tab Views ──────────

  const STAT_CARDS = [
     { label: 'Total Users', value: stats.totalUsers, icon: Users },
     { label: 'Active Live Exams', value: stats.activeExams, icon: FileText },
     { label: 'System Health', value: stats.systemHealth, icon: ShieldCheck },
     { label: 'Total Violations', value: stats.totalViolations, icon: AlertOctagon },
  ];

  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STAT_CARDS.map((stat, i) => (
          <div key={i} className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <stat.icon size={20} />
              </div>
            </div>
            <h3 className="text-3xl font-black text-zinc-900 tracking-tight">{stat.value}</h3>
            <p className="text-xs font-bold text-zinc-500 mt-1 uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Audit Logs */}
        <div className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-sm flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-6 shrink-0">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600"><FileText size={16} /></div>
               <h4 className="text-sm font-black text-zinc-900 uppercase tracking-tight">System Audit logs</h4>
             </div>
             <div className="flex items-center gap-3">
               {auditLogs.length > 0 && (
                 <button onClick={handleClearAllLogs} className="text-[10px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest px-3 py-1 rounded-lg hover:bg-red-50 transition-all">Clear All</button>
               )}
               {loading && <RefreshCw size={14} className="animate-spin text-zinc-400" />}
             </div>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
             {auditLogs.length > 0 ? auditLogs.map((log) => (
                <div key={log._id} className="group relative flex flex-col p-4 bg-zinc-50 border border-zinc-100 rounded-2xl hover:border-zinc-200 transition-all">
                   <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge color={log.action.includes('DELETE') ? 'red' : 'zinc'}>{log.action}</Badge>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                      <button onClick={() => handleDeleteLog(log._id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                   </div>
                   <p className="text-[11px] text-zinc-600 font-bold italic mb-2">By: {log.adminId?.name || 'Admin'} <span className="opacity-50 noter-italic">({log.adminId?.email || 'N/A'})</span></p>
                   {log.details && (
                      <div className="p-3 bg-white/60 rounded-xl border border-zinc-100 text-[10px] font-mono text-zinc-500 break-all leading-relaxed shadow-inner">
                         {JSON.stringify(log.details)}
                      </div>
                   )}
                </div>
             )) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-300 gap-3">
                   <Activity size={32} className="opacity-20 translate-y-2" />
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Audit trail is empty</p>
                </div>
             )}
          </div>
        </div>

        {/* Right Column: Student Activity */}
        <div className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-sm flex flex-col h-[500px]">
           <div className="flex items-center justify-between mb-6 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600"><AlertCircle size={16} /></div>
                <h4 className="text-sm font-black text-zinc-900 uppercase tracking-tight">Active Student Signals</h4>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest animate-pulse">Live Feed</span>
           </div>
           
           <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
              {helpRequests.length === 0 && notifications.filter(n => n.type === 'violation').length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-300 gap-3">
                   <Radio size={32} className="opacity-20" />
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">No active signals from candidates</p>
                </div>
              ) : (
                <>
                  {/* Help Requests specifically */}
                  {helpRequests.map(req => (
                    <div key={req.id} className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-3">
                          <button onClick={() => handleResolveHelp(req.id)} className="p-1.5 bg-white text-emerald-600 rounded-lg shadow-sm hover:bg-emerald-600 hover:text-white transition-all"><Check size={14} /></button>
                       </div>
                       <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Help Requested</span>
                       </div>
                       <h5 className="text-xs font-black text-zinc-900 mb-1">{req.studentName}</h5>
                       <p className="text-[11px] text-zinc-500 font-bold mb-3">{req.studentEmail}</p>
                       <div className="p-3 bg-white rounded-xl border border-emerald-100 text-xs font-semibold text-emerald-900 shadow-sm italic">
                          "{req.message}"
                       </div>
                    </div>
                  ))}

                  {/* Violations from Notifications state */}
                  {notifications.filter(n => n.type === 'violation').map(notif => (
                    <div key={notif.id} className="p-5 bg-red-50 border border-red-100 rounded-2xl">
                       <div className="flex items-center gap-2 mb-3">
                          <ShieldAlert size={14} className="text-red-500" />
                          <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Security Alert</span>
                          <span className="ml-auto text-[9px] font-bold text-red-400 capitalize">{new Date(notif.timestamp).toLocaleTimeString()}</span>
                       </div>
                       <p className="text-xs font-bold text-zinc-900 leading-relaxed">
                          <span className="text-red-600">{notif.studentId}</span> triggered a <span className="underline decoration-red-200">{notif.type}</span> violation.
                       </p>
                       <button className="mt-3 text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                          Investigate Session <ChevronRight size={12} />
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
            <input 
              type="text" 
              placeholder="Search users..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 border border-zinc-200 rounded-xl text-sm text-zinc-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 w-64 transition-all bg-white shadow-sm"
            />
          </div>
          <div className="hidden lg:flex bg-zinc-100 p-1 rounded-lg">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'student', label: 'Students' },
              { id: 'mentor', label: 'Mentors' },
              { id: 'admin', label: 'Admins' }
            ].map(f => (
              <button 
                key={f.id}
                onClick={() => setUserRoleFilter(f.id)}
                className={`px-4 py-1.5 rounded-md text-[10px] font-bold tracking-widest uppercase transition-all ${userRoleFilter === f.id ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleCsvImport} />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-all uppercase tracking-wider rounded-xl shadow-sm active:scale-95"
          >
            <FileUp size={14} /> Import CSV
          </button>
          {userRole === 'admin' && (
            <button 
              onClick={() => setShowAddUserModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-900/20 active:scale-95"
            >
              <UserPlus size={14} /> Add User
            </button>
          )}
        </div>
      </div>

      {/* Mobile filter bar */}
      <div className="lg:hidden flex bg-zinc-100 p-1 rounded-lg w-full overflow-x-auto scroll-thin mb-4">
        {[
          { id: 'ALL', label: 'ALL' },
          { id: 'student', label: 'STUDENTS' },
          { id: 'mentor', label: 'MENTORS' },
          { id: 'admin', label: 'ADMINS' }
        ].map(f => (
          <button 
            key={f.id}
            onClick={() => setUserRoleFilter(f.id)}
            className={`px-4 py-1.5 rounded-md text-[10px] font-bold tracking-widest uppercase transition-all whitespace-nowrap ${userRoleFilter === f.id ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {selectedUsers.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-800 shadow-2xl rounded-2xl p-3 flex items-center gap-4 z-50 animate-in slide-in-from-bottom-5">
           <span className="text-white text-xs font-bold px-3 py-1 bg-white/10 rounded-lg">{selectedUsers.size} Selected</span>
           <div className="flex gap-2">
              <button onClick={handleBulkExportCSV} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg active:scale-95">
                 Export CSV
              </button>
              {userRole === 'admin' && (
                <button onClick={handleBulkDelete} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg active:scale-95 flex items-center gap-2">
                   <Trash2 size={14} /> Delete
                </button>
              )}
           </div>
        </div>
      )}

      <DataTable 
        loading={loading}
        headers={[
          <input 
             type="checkbox" 
             className="w-4 h-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
             checked={
               (() => {
                  const filtered = users.filter(u => {
                    const matchesRole = userRoleFilter === 'ALL' || (userRoleFilter === 'student' && u.role === 'student') || (userRoleFilter === 'mentor' && (u.role === 'mentor' || u.role === 'super_mentor')) || (userRoleFilter === 'admin' && u.role === 'admin');
                    const matchesSearch = !userSearchQuery.trim() || u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || u.email.toLowerCase().includes(userSearchQuery.toLowerCase());
                    return matchesRole && matchesSearch;
                  });
                  return filtered.length > 0 && selectedUsers.size === filtered.length;
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
          'Name', 'Email', 'Role', 'Date Added', 'Actions'
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
        renderRow={(user) => (
          <tr key={user._id} className={selectedUsers.has(user._id) ? "bg-emerald-50/50" : "hover:bg-zinc-50/80 transition-colors"}>
            <td className="px-6 py-4">
               <input 
                 type="checkbox" 
                 checked={selectedUsers.has(user._id)}
                 onChange={() => toggleUserSelection(user._id)}
                 className="w-4 h-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
               />
            </td>
            <td className="px-6 py-4 text-sm font-semibold text-zinc-900">{user.name}</td>
            <td className="px-6 py-4 text-sm text-zinc-500">{user.email}</td>
            <td className="px-6 py-4">
               <Badge color={user.role === 'admin' ? 'red' : user.role === 'super_mentor' ? 'amber' : user.role === 'mentor' ? 'emerald' : 'zinc'}>
                 {user.role}
               </Badge>
            </td>
            <td className="px-6 py-4 text-[13px] text-zinc-500">{new Date(user.createdAt).toLocaleDateString()}</td>
            <td className="px-6 py-4">
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteUser(user._id, user.role); }} 
                className="text-zinc-400 hover:text-red-600 transition-colors active:scale-90"
              >
                <Trash2 size={16} />
              </button>
            </td>
          </tr>
        )}
      />

       {/* Add User Modal */}
       {showAddUserModal && (
          <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-zinc-200 animate-in fade-in zoom-in-95 duration-200">
               <h3 className="text-lg font-black text-zinc-900 mb-6 uppercase tracking-wider">Add New User</h3>
               <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                      <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Full Name</label>
                      <input required type="text" value={newUser.name} onChange={e=>setNewUser({...newUser, name: e.target.value})} className="w-full px-4 py-2.5 border border-zinc-200 text-sm rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                  </div>
                  <div>
                      <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Email</label>
                      <input required type="email" value={newUser.email} onChange={e=>setNewUser({...newUser, email: e.target.value})} className="w-full px-4 py-2.5 border border-zinc-200 text-sm rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                  </div>
                  <div>
                      <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Password</label>
                      <input required type="password" value={newUser.password} onChange={e=>setNewUser({...newUser, password: e.target.value})} className="w-full px-4 py-2.5 border border-zinc-200 text-sm rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                  </div>
                  <div>
                      <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Role Type</label>
                      <select value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value})} className="w-full px-4 py-2.5 border border-zinc-200 text-sm rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all bg-white">
                         <option value="student">Student</option>
                         <option value="mentor">Mentor</option>
                         <option value="super_mentor">Super Mentor</option>
                         <option value="admin">Administrator</option>
                      </select>
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-6 border-t border-zinc-100 mt-4">
                     <button type="button" onClick={() => setShowAddUserModal(false)} className="px-5 py-2.5 text-xs font-bold text-zinc-500 uppercase hover:bg-zinc-50 rounded-xl transition-all active:scale-95">Cancel</button>
                     <button type="submit" className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold uppercase hover:bg-emerald-700 rounded-xl transition-all shadow-lg shadow-emerald-900/20 active:scale-95">Save User</button>
                  </div>
               </form>
            </div>
          </div>
       )}
    </div>
  );

  const renderExams = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-zinc-900 tracking-tight">Exam Library</h2>
        <button 
          onClick={() => navigate('/mentor/create-exam')}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-900/20 active:scale-95"
        >
          <Plus size={14} /> Create Exam
        </button>
      </div>
      <DataTable 
        loading={loading}
        headers={['Exam Title', 'Created By', 'Category', 'Status', 'Actions']}
        data={exams}
        renderRow={(exam) => (
          <tr key={exam.id || exam._id} className="hover:bg-zinc-50/80 transition-colors">
            <td className="px-6 py-4 text-sm font-semibold text-zinc-900">{exam.name || exam.title}</td>
            <td className="px-6 py-4 text-sm text-zinc-500">{exam.creatorName || exam.creator?.name || 'Unknown'}</td>
            <td className="px-6 py-4 text-sm text-zinc-500">{exam.category || 'Standard'}</td>
            <td className="px-6 py-4">
               <Badge color={exam.status === 'live' || exam.status === 'published' ? 'emerald' : 'zinc'}>
                 {exam.status || 'Draft'}
               </Badge>
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleTogglePublishResults(exam.id || exam._id, exam.resultsPublished)} 
                  className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors active:scale-95 ${exam.resultsPublished ? 'text-emerald-600 hover:text-emerald-700' : 'text-zinc-400 hover:text-emerald-600'}`}
                  title={exam.resultsPublished ? "Results visible to students" : "Results hidden from students"}
                >
                  {exam.resultsPublished ? <CheckCircle size={14} /> : <EyeOff size={14} />} 
                  {exam.resultsPublished ? 'Published' : 'Hidden'}
                </button>
                <button onClick={() => navigate(`/mentor/create-exam?id=${exam.id || exam._id}&view=true`)} className="text-xs font-bold text-zinc-500 hover:text-emerald-600 uppercase tracking-wider flex items-center gap-1 transition-colors active:scale-95">
                  <Eye size={14} /> View
                </button>
                <button onClick={() => navigate(`/mentor/create-exam?id=${exam.id || exam._id}`)} className="text-xs font-bold text-zinc-500 hover:text-amber-600 uppercase tracking-wider flex items-center gap-1 transition-colors active:scale-95">
                  <Edit3 size={14} /> Edit
                </button>
                <button onClick={() => handleDeleteExam(exam.id || exam._id)} className="text-xs font-bold text-zinc-400 hover:text-red-600 uppercase tracking-wider flex items-center gap-1 transition-colors active:scale-95">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </td>
          </tr>
        )}
      />
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-4xl">
      <div className="rounded-2xl bg-white border border-zinc-200 shadow-sm overflow-hidden">
         <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50">
            <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-tight">Proctoring Rules & Security</h4>
         </div>
         <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
               <div>
                  <p className="text-sm font-semibold text-zinc-900">Max Allowed Tab Switches</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Threshold before exam auto-terminates.</p>
               </div>
               <input 
                  type="number" 
                  value={settings.maxTabSwitches} 
                  onChange={e => setSettingsState({...settings, maxTabSwitches: Number(e.target.value)})}
                  className="w-20 px-3 py-2 border border-zinc-200 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-center rounded-xl transition-all" 
               />
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
               <div>
                  <p className="text-sm font-semibold text-zinc-900">Force Strict Fullscreen</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Lock browser into fullscreen during exam sessions.</p>
               </div>
               <div 
                  onClick={() => setSettingsState({...settings, forceFullscreen: !settings.forceFullscreen})}
                  className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${settings.forceFullscreen ? 'bg-emerald-600' : 'bg-zinc-200'}`}
               >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-md transition-all ${settings.forceFullscreen ? 'right-0.5' : 'left-0.5'}`} />
               </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
               <div>
                  <p className="text-sm font-semibold text-zinc-900">Allow Late Submissions</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Accept answers after timer expiry, flagged as late.</p>
               </div>
               <div 
                  onClick={() => setSettingsState({...settings, allowLateSubmissions: !settings.allowLateSubmissions})}
                  className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${settings.allowLateSubmissions ? 'bg-emerald-600' : 'bg-zinc-200'}`}
               >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-md transition-all ${settings.allowLateSubmissions ? 'right-0.5' : 'left-0.5'}`} />
               </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
               <div>
                  <p className="text-sm font-semibold text-zinc-900">Enable Webcam Monitoring</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Track gaze and physical presence via webcam.</p>
               </div>
               <div 
                  onClick={() => setSettingsState({...settings, enableWebcam: !settings.enableWebcam})}
                  className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${settings.enableWebcam ? 'bg-emerald-600' : 'bg-zinc-200'}`}
               >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-md transition-all ${settings.enableWebcam ? 'right-0.5' : 'left-0.5'}`} />
               </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
               <div>
                  <p className="text-sm font-semibold text-zinc-900">Disable Copy/Paste & Context Menu</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Prevent students from using clipboard or right-click during exam.</p>
               </div>
               <div 
                  onClick={() => setSettingsState({...settings, disableCopyPaste: !settings.disableCopyPaste})}
                  className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${settings.disableCopyPaste ? 'bg-emerald-600' : 'bg-zinc-200'}`}
               >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-md transition-all ${settings.disableCopyPaste ? 'right-0.5' : 'left-0.5'}`} />
               </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
               <div>
                  <p className="text-sm font-semibold text-zinc-900">Require ID Verification (eKYC)</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Ensure students verify their identity via face-match before starting.</p>
               </div>
               <div 
                  onClick={() => setSettingsState({...settings, requireIDVerification: !settings.requireIDVerification})}
                  className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${settings.requireIDVerification ? 'bg-emerald-600' : 'bg-zinc-200'}`}
               >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-md transition-all ${settings.requireIDVerification ? 'right-0.5' : 'left-0.5'}`} />
               </div>
            </div>
         </div>
      </div>

      <div className="flex justify-end">
         <button onClick={handleSaveSettings} className="px-6 py-3 bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all rounded-xl shadow-lg shadow-emerald-900/20 active:scale-95">
            Save Configurations
         </button>
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
           <h2 className="text-lg font-black text-zinc-900 tracking-tight">System-Wide Results & Reports</h2>
           <div className="hidden md:flex bg-zinc-100/80 p-1 rounded-lg">
             {['ALL', 'PENDING', 'PAST'].map(f => (
               <button 
                 key={f}
                 onClick={() => setResultFilter(f)}
                 className={`px-4 py-1.5 rounded-md text-[10px] font-bold tracking-widest uppercase transition-all ${resultFilter === f ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
               >
                 {f === 'PAST' ? 'EVALUATED / PAST' : f}
               </button>
             ))}
           </div>
         </div>
         <div className="flex items-center gap-3">
           <button 
             onClick={handleExportCsv}
             className="flex items-center gap-2 text-xs font-bold text-zinc-600 border border-zinc-200 px-4 py-2 rounded-xl hover:bg-white shadow-sm transition-all active:scale-95"
           >
              <Download size={14} /> Export CSV
           </button>
           <button 
             onClick={() => fetchDataForTab('Results')}
             className="p-2 border border-zinc-200 rounded-xl text-zinc-500 hover:bg-zinc-50 transition-all active:scale-95"
           >
             <RefreshCw size={14} />
           </button>
                            </div>
                         </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
         </div>
      </div>
      {/* Mobile filter bar */}
      <div className="md:hidden flex bg-zinc-100/80 p-1 rounded-lg w-full overflow-x-auto scroll-thin mb-4 mt-2">
        {['ALL', 'PENDING', 'PAST'].map(f => (
          <button 
            key={f}
            onClick={() => setResultFilter(f)}
            className={`px-4 py-1.5 rounded-md text-[10px] font-bold tracking-widest uppercase transition-all whitespace-nowrap ${resultFilter === f ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            {f === 'PAST' ? 'EVALUATED / PAST' : f}
          </button>
        ))}
      </div>

      <DataTable 
        loading={loading}
        headers={['Student', 'Exam', 'Score', 'Status', 'Violations', 'Submitted', 'Action']}
        data={adminResults.filter(r => {
          if (resultFilter === 'ALL') return true;
          if (resultFilter === 'PENDING') return r.status === 'pending_review';
          if (resultFilter === 'PAST') return r.status === 'submitted' || r.status === 'evaluated' || r.status === 'completed';
          return true;
        })}
        renderRow={(res, idx) => (
          <tr key={res._id || idx} className="hover:bg-zinc-50/80 transition-colors">
            <td className="px-6 py-4">
              <div>
                <p className="text-sm font-semibold text-zinc-800">{res.studentName || 'Student'}</p>
                <p className="text-[10px] text-zinc-400">{res.studentEmail || ''}</p>
              </div>
            </td>
            <td className="px-6 py-4 text-xs font-medium text-zinc-600">{res.examTitle || 'Exam'}</td>
            <td className="px-6 py-4">
               <div className="flex items-center gap-2">
                 <div className="max-w-[100px] flex-1 h-1 bg-zinc-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${(res.percentage || 0) >= 80 ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${res.percentage || 0}%` }} />
                 </div>
                 <span className={`text-xs font-black tabular-nums ${(res.percentage || 0) >= 80 ? 'text-emerald-700' : 'text-amber-700'}`}>{res.percentage || 0}%</span>
               </div>
            </td>
            <td className="px-6 py-4">
               <Badge color={
                 res.status === 'submitted' ? 'emerald' :
                 res.status === 'pending_review' ? 'amber' :
                 res.status === 'in_progress' ? 'zinc' : 'zinc'
               }>
                 {res.status === 'pending_review' ? '⏳ Needs Review' :
                  res.status === 'submitted' ? '✅ Graded' :
                  res.status}
               </Badge>
            </td>
            <td className="px-6 py-4 text-xs font-bold text-red-500 tabular-nums">{res.totalViolations || 0} Flags</td>
            <td className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
               {res.submittedAt ? new Date(res.submittedAt).toLocaleString() : 'N/A'}
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
                   <><Eye size={12} /> View</>
                 )}
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
      setCandidates(prev => prev.map(c => c._id === userId ? { ...c, isVerified: shouldVerify } : c));
      if (selectedCandidate?._id === userId) setSelectedCandidate(prev => ({ ...prev, isVerified: shouldVerify }));
      toast.success(shouldVerify ? 'Candidate verified!' : 'Verification revoked.');
    } catch (err) {
      toast.error('Action failed: ' + (err.message || err));
    }
  };

  const renderCandidates = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-zinc-900 tracking-tight">Candidate Identity Board</h2>
          <p className="text-xs text-zinc-400 font-medium mt-1">Review student identity proofs captured during exam onboarding.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
          <input
            type="text"
            placeholder="Search student..."
            value={candidateSearch}
            onChange={(e) => {
              setCandidateSearch(e.target.value);
              getCandidates(e.target.value).then(r => setCandidates(r || [])).catch(() => {});
            }}
            className="pl-9 pr-4 py-2.5 border border-zinc-200 rounded-xl text-sm text-zinc-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 w-64 transition-all bg-white shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-zinc-100 animate-pulse" />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-zinc-400 gap-3">
          <ScanFace size={40} className="opacity-20" />
          <p className="text-xs font-bold uppercase tracking-widest opacity-40">No candidates found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {candidates.map((c) => (
            <div
              key={c._id}
              onClick={() => setSelectedCandidate(c)}
              className="group relative bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300 cursor-pointer hover:-translate-y-1"
            >
              {/* Live Badge */}
              {c.isLive && (
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-red-500 text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                  <Radio size={8} className="animate-pulse" /> Live
                </div>
              )}
              {/* Verified Badge */}
              {c.isVerified && (
                <div className="absolute top-3 right-3 z-10 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-md">
                  <Check size={12} className="text-white" />
                </div>
              )}
              {/* Profile Picture */}
              <div className="aspect-square w-full bg-zinc-50 overflow-hidden">
                {c.profilePicture ? (
                  <img src={c.profilePicture} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User size={40} className="text-zinc-200" />
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="p-4">
                <p className="text-sm font-black text-zinc-900 truncate">{c.name}</p>
                <p className="text-[10px] text-zinc-400 truncate mt-0.5">{c.email}</p>
                {c.currentExam && (
                  <p className="text-[9px] text-red-500 font-bold mt-2 truncate uppercase tracking-wide">📝 {c.currentExam}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    c.isVerified ? 'bg-emerald-50 text-emerald-700' : c.profilePicture ? 'bg-amber-50 text-amber-700' : 'bg-zinc-100 text-zinc-500'
                  }`}>
                    {c.isVerified ? 'Verified' : c.profilePicture ? 'Pending' : 'No Photo'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-zinc-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedCandidate(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-zinc-200" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-zinc-100 bg-zinc-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <ScanFace size={20} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-zinc-900 uppercase tracking-wide">{selectedCandidate.name}</h3>
                  <p className="text-xs text-zinc-400">{selectedCandidate.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {selectedCandidate.isLive && (
                  <span className="flex items-center gap-1.5 bg-red-50 text-red-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-red-100">
                    <Radio size={10} className="animate-pulse" /> Live Exam
                  </span>
                )}
                <button onClick={() => setSelectedCandidate(null)} className="p-2 hover:bg-zinc-100 rounded-xl transition-all">
                  <X size={18} className="text-zinc-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 grid grid-cols-2 gap-6">
              {/* Face Photo */}
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2"><User size={12} /> Face Capture</p>
                <div className="aspect-square rounded-2xl bg-zinc-50 border-2 border-zinc-200 overflow-hidden">
                  {selectedCandidate.profilePicture ? (
                    <img src={selectedCandidate.profilePicture} alt="Face" className="w-full h-full object-cover scale-x-[-1]" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-300">
                      <User size={32} />
                      <span className="text-[9px] font-bold uppercase tracking-widest">Not Captured</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ID Card */}
              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2"><ShieldCheck size={12} /> ID Card</p>
                <div className="aspect-square rounded-2xl bg-zinc-50 border-2 border-zinc-200 overflow-hidden flex items-center justify-center">
                  {selectedCandidate.idCardUrl ? (
                    <img src={selectedCandidate.idCardUrl} alt="ID Card" className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-300">
                      <ShieldAlert size={32} />
                      <span className="text-[9px] font-bold uppercase tracking-widest">Not Uploaded</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-8 py-5 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Joined: {new Date(selectedCandidate.createdAt).toLocaleDateString()}</p>
                <p className={`text-xs font-black mt-1 ${selectedCandidate.isVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {selectedCandidate.isVerified ? '✅ Identity Verified' : '⏳ Pending Verification'}
                </p>
              </div>
              <div className="flex gap-3">
                {selectedCandidate.isVerified ? (
                  <button
                    onClick={() => handleVerifyCandidate(selectedCandidate._id, false)}
                    className="px-5 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-black uppercase tracking-wider rounded-xl transition-all border border-red-100 active:scale-95"
                  >
                    Revoke Verification
                  </button>
                ) : (
                  <button
                    onClick={() => handleVerifyCandidate(selectedCandidate._id, true)}
                    disabled={!selectedCandidate.profilePicture || !selectedCandidate.idCardUrl}
                    className="px-6 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-900/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ✅ Verify Identity
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'Overview': return renderOverview();
      case 'Users': return renderUsers();
      case 'Candidates': return renderCandidates();
      case 'Exams': return renderExams();
      case 'Results': return renderResults();
      case 'Settings': return renderSettings();
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-zinc-50 font-sans text-zinc-900 select-none antialiased">
      
      {/* Dark Sidebar — matching MentorDashboard */}
      <aside className="w-64 bg-zinc-950 flex flex-col z-30 shadow-2xl shrink-0">
        <div className="h-20 flex items-center px-8 border-b border-white/5">
           <div className="flex items-center gap-3">
              <VisionLogo className="h-6 w-6 text-emerald-500" />
              <span className="text-sm font-black uppercase tracking-[0.3em] text-white">VISION <span className="text-zinc-500 font-bold">CMD</span></span>
           </div>
        </div>

        <nav className="flex-1 p-6 space-y-1.5">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group flex w-full items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative ${
                activeTab === tab.id 
                ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/40' 
                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <tab.icon size={18} className={`transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="text-xs font-bold uppercase tracking-wider">{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-3 bg-white/30 rounded-full" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-white/5">
          <button 
            onClick={() => showConfirm('Are you sure you want to exit the admin control panel?', handleLogout)}
            className="w-full flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 rounded-xl text-xs font-bold transition-all uppercase tracking-widest active:scale-95 border border-white/5"
          >
            <LogOut size={16} /> Exit Module
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Header — matching MentorDashboard */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-zinc-200 flex items-center justify-between px-10 relative z-20">
          <div className="flex items-center gap-3 text-xs font-bold text-zinc-400 uppercase tracking-widest">
            <span className="hover:text-emerald-600 transition-colors cursor-pointer">Admin</span>
            <ChevronRight size={14} className="opacity-50" />
            <span className="text-zinc-900">{activeTab}</span>
          </div>

          <div className="flex items-center gap-6">
             <div className="relative">
                <button 
                  onClick={() => {
                    setShowNotifDropdown(!showNotifDropdown);
                    if (!showNotifDropdown) markAllRead();
                  }}
                  className="p-2.5 bg-zinc-100 text-zinc-600 rounded-xl hover:bg-zinc-200 transition-all active:scale-95 relative"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifDropdown && (
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-zinc-200 z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
                      <h5 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Alert Center</h5>
                      <button onClick={handleClearNotifications} className="text-[9px] font-black text-zinc-400 hover:text-red-500 uppercase tracking-widest">Clear All</button>
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="py-12 text-center">
                          <AlertCircle size={32} className="mx-auto text-zinc-100 mb-3" />
                          <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.2em]">No active alerts</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className={`p-4 border-b border-zinc-50 hover:bg-zinc-50 transition-all ${n.unread ? 'bg-emerald-50/20' : ''}`}>
                             <div className="flex gap-4">
                                <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
                                  n.type === 'help' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                                }`}>
                                   {n.type === 'help' ? <MessageCircle size={16} /> : <AlertTriangle size={16} />}
                                </div>
                                <div className="flex-1">
                                   <div className="flex items-center justify-between mb-1">
                                      <p className="text-[11px] font-black text-zinc-900 uppercase tracking-tight">
                                        {n.type === 'help' ? `Support Needed` : `Security Violation`}
                                      </p>
                                      <span className="text-[9px] font-bold text-zinc-300 uppercase shrink-0">
                                        {n.timestamp ? new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Now'}
                                      </span>
                                   </div>
                                   <p className="text-[11px] font-bold text-zinc-700 leading-tight mb-1">
                                      {n.type === 'help' ? n.studentName : n.studentId}
                                   </p>
                                   <p className="text-[10px] text-zinc-500 line-clamp-2 italic font-medium">
                                     {n.type === 'help' ? n.message : `Violation detected: ${n.type}`}
                                   </p>
                                </div>
                             </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
             </div>
             <div className="h-6 w-px bg-zinc-200" />
             <div className="flex items-center gap-3 cursor-pointer group">
               <div className="text-right">
                 <p className="text-[11px] font-bold text-zinc-900 group-hover:text-emerald-600 transition-colors uppercase tracking-tight leading-none">{userName}</p>
                 <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mt-1">{userRole.replace('_', ' ')}</p>
               </div>
               <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center font-black text-zinc-600 uppercase text-sm shadow-sm group-hover:border-emerald-200 transition-all">
                 {userName.charAt(0)}
               </div>
             </div>
          </div>
        </header>

        {/* Content Section */}
        <section className="flex-1 overflow-y-auto p-10 custom-scrollbar">
           {renderContent()}
        </section>
      </main>

      {/* Evaluation Modal (reused from MentorDashboard pattern) */}
      {/* Evaluation Modal */}
      {showEvalModal && (
        evalLoading ? (
          <div className="fixed inset-0 bg-zinc-900/70 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-8 flex items-center gap-3 shadow-2xl animate-in zoom-in-95">
              <RefreshCw size={20} className="animate-spin text-emerald-600" />
              <span className="text-sm font-bold text-zinc-700">Accessing secure data layer...</span>
            </div>
          </div>
        ) : (
          <SessionReportModal 
            sessionData={evalSessionData} 
            onClose={() => { setShowEvalModal(false); setEvalSessionData(null); }} 
          />
        )
      )}

      {/* Confirm Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 shadow-2xl w-full max-w-sm border border-zinc-200 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-5">
              <AlertOctagon size={24} className="text-amber-500" />
            </div>
            <h3 className="text-sm font-black text-zinc-900 text-center uppercase tracking-wider mb-2">Confirm Action</h3>
            <p className="text-xs text-zinc-500 text-center mb-8 font-medium">{confirmModal.msg}</p>
            <div className="flex items-center gap-3">
              <button onClick={closeConfirm} className="flex-1 h-12 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-500 uppercase tracking-wider hover:bg-zinc-50 transition-all active:scale-95">Cancel</button>
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
    </div>
  );
}
