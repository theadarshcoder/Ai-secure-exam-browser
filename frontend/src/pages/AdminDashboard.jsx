import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import socketService from '../services/socket';
import {
  LayoutDashboard, Users, FileText, Settings,
  Search, FileUp, UserPlus, Trash2, Eye,
  ShieldCheck, Activity, AlertOctagon,
  ChevronRight, LogOut, Bell, RefreshCw, Edit3,
  BarChart3, Download, Clock, Check, X, Star, CheckCircle, AlertCircle, Plus
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
  getSessionDetail,
  evaluateSession
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
  const [users, setUsers] = useState([]);
  const [exams, setExams] = useState([]);
  const [adminResults, setAdminResults] = useState([]);
  const [resultFilter, setResultFilter] = useState('ALL');
  // Evaluation Modal state
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [evalSessionData, setEvalSessionData] = useState(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettingsState] = useState({
     maxTabSwitches: 5,
     forceFullscreen: true,
     allowLateSubmissions: false,
     enableWebcam: false
  });

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'student' });

  // Toast notification system
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

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

    socketService.onStudentHelp((data) => {
      addToast(`HELP REQUEST: ${data.studentName} - ${data.message}`, 'error');
    });

    return () => socketService.disconnect();
  }, [addToast]);

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
              const [studentsRes, mentorsRes] = await Promise.all([
                  getStudents().catch(() => []),
                  getMentors().catch(() => [])
              ]);
              setUsers([...mentorsRes, ...studentsRes]);
          } else if (tab === 'Exams') {
              const res = await getAdminExams();
              setExams(res || []);
          } else if (tab === 'Results') {
              const res = await getAdminResults();
              setAdminResults(res || []);
          } else if (tab === 'Settings') {
              const res = await getSettings();
              if (res) setSettingsState(res);
          }
      } catch (err) {
          console.error("Failed fetching data:", err);
      } finally {
          setLoading(false);
      }
  };

  const handleLogout = () => {
    sessionStorage.clear(); localStorage.clear();
    navigate('/login');
  };

  const handleDeleteUser = async (id, role) => {
     showConfirm("Are you sure you want to delete this user?", async () => {
         try {
             if (role === 'student') await removeStudent(id);
             else await removeMentor(id);
             setUsers(users.filter(u => u._id !== id));
             addToast('User deleted successfully.');
         } catch(err) {
             addToast("Failed to delete: " + err.message, 'error');
         }
     });
  };

  const handleDeleteExam = async (id) => {
      showConfirm("Delete this exam globally?", async () => {
          try {
              await api.delete(`/api/exams/${id}`);
              setExams(exams.filter(e => e._id !== id));
              addToast('Exam deleted successfully.');
          } catch (err) {
              console.error(err);
              addToast('Failed to delete exam', 'error');
          }
      });
  };

  const handleCsvImport = async (e) => {
     const file = e.target.files[0];
     if (!file) return;

     const reader = new FileReader();
     reader.onload = async (event) => {
         const text = event.target.result;
         const rows = text.split('\n').filter(row => row.trim() !== '');
         const usersToImport = rows.map(row => {
             const cols = row.split(',');
             return { name: cols[0]?.trim(), email: cols[1]?.trim(), role: cols[2]?.trim() || 'student' };
         }).filter(u => u.email);
         
         if(usersToImport.length === 0) {
             addToast("No valid rows found in CSV. Format: name,email,role", 'error');
             return;
         }

         try {
             const res = await bulkImportUsers(usersToImport);
             addToast(`${res.results?.length || 'Multiple'} users imported.`);
             fetchDataForTab('Users');
         } catch(err) {
             addToast('Import failed: ' + (err.message || "Unknown Error"), 'error');
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
          addToast('User created successfully.');
      } catch (err) {
          addToast("Error creating user: " + err.message, 'error');
      }
  };

  const handleSaveSettings = async () => {
      try {
          await saveSettings(settings);
          addToast('System settings saved successfully!');
      } catch (err) {
          console.error(err);
          addToast('Failed to save settings.', 'error');
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
      addToast('Failed to load session details.', 'error');
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
      addToast('Session graded successfully!');
      setShowEvalModal(false);
      setEvalSessionData(null);
      fetchDataForTab('Results');
    } catch (err) {
      console.error('Failed to submit grades:', err);
      addToast('Failed to submit grades: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCsv = () => {
    if (adminResults.length === 0) {
      addToast('No results to export.', 'error');
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

      <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
           <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-tight">Recent System Activity (Audit Logs)</h4>
           {loading && <RefreshCw size={14} className="animate-spin text-zinc-400" />}
        </div>
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
           {auditLogs.length > 0 ? auditLogs.map((log) => (
              <div key={log._id} className="flex flex-col p-4 bg-zinc-50 border border-zinc-100 rounded-xl">
                 <div className="flex items-center justify-between mb-2">
                    <p className="text-[13px] font-bold text-zinc-900">{log.action}</p>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{new Date(log.createdAt).toLocaleString()}</span>
                 </div>
                 <p className="text-[11px] text-zinc-500 font-medium">By: {log.adminId?.name || 'Admin'} ({log.adminId?.email || 'N/A'})</p>
                 {log.details && Object.keys(log.details).length > 0 && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-zinc-200 text-[10px] font-mono text-zinc-600">
                       {JSON.stringify(log.details, null, 2)}
                    </div>
                 )}
              </div>
           )) : (
              <div className="h-32 flex flex-col items-center justify-center text-zinc-400 gap-2">
                 <Activity size={24} className="opacity-20" />
                 <p className="text-xs font-bold uppercase tracking-widest opacity-40 text-center">No recent audit logs found.</p>
              </div>
           )}
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
          <input 
            type="text" 
            placeholder="Search users by name or email..."
            className="pl-9 pr-4 py-2.5 border border-zinc-200 rounded-xl text-sm text-zinc-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 w-72 transition-all bg-white shadow-sm"
          />
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

      <DataTable 
        loading={loading}
        headers={['Name', 'Email', 'Role', 'Date Added', 'Actions']}
        data={users}
        renderRow={(user) => (
          <tr key={user._id} className="hover:bg-zinc-50/80 transition-colors">
            <td className="px-6 py-4 text-sm font-semibold text-zinc-900">{user.name}</td>
            <td className="px-6 py-4 text-sm text-zinc-500">{user.email}</td>
            <td className="px-6 py-4">
               <Badge color={user.role === 'admin' ? 'red' : user.role === 'super_mentor' ? 'amber' : user.role === 'mentor' ? 'emerald' : 'zinc'}>
                 {user.role}
               </Badge>
            </td>
            <td className="px-6 py-4 text-[13px] text-zinc-500">{new Date(user.createdAt).toLocaleDateString()}</td>
            <td className="px-6 py-4">
              <button onClick={() => handleDeleteUser(user._id, user.role)} className="text-zinc-400 hover:text-red-600 transition-colors active:scale-90">
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
          if (resultFilter === 'PAST') return r.status === 'evaluated' || r.status === 'completed';
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

  const renderContent = () => {
    switch (activeTab) {
      case 'Overview': return renderOverview();
      case 'Users': return renderUsers();
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
            onClick={handleLogout}
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
             <div className="relative group cursor-pointer">
                <Bell size={20} className="text-zinc-400 hover:text-emerald-600 transition-colors" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
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
      {showEvalModal && (
        evalLoading ? (
          <div className="fixed inset-0 bg-zinc-900/70 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-8 flex items-center gap-3 shadow-2xl">
              <RefreshCw size={20} className="animate-spin text-emerald-600" />
              <span className="text-sm font-bold text-zinc-700">Loading session details...</span>
            </div>
          </div>
        ) : evalSessionData ? (
          <div className="fixed inset-0 bg-zinc-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowEvalModal(false); setEvalSessionData(null); }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-zinc-200" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-8 py-5 border-b border-zinc-200 bg-zinc-50">
                <div>
                  <h3 className="text-base font-black text-zinc-900 uppercase tracking-wider">{evalSessionData.exam?.title} — Detail</h3>
                  <p className="text-xs text-zinc-500 mt-1">Student: <span className="font-bold text-zinc-700">{evalSessionData.student?.name}</span> ({evalSessionData.student?.email})</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xl font-black text-zinc-900">{evalSessionData.score}/{evalSessionData.totalMarks}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{evalSessionData.percentage}%</p>
                  </div>
                  <button onClick={() => { setShowEvalModal(false); setEvalSessionData(null); }} className="p-2 hover:bg-zinc-100 rounded-xl">
                    <X size={18} className="text-zinc-400" />
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto max-h-[65vh] p-6 space-y-4 custom-scrollbar">
                {evalSessionData.questions?.map((q, i) => (
                  <div key={i} className={`rounded-xl border p-5 ${
                    q.status === 'correct' ? 'border-emerald-200 bg-emerald-50/30' :
                    q.status === 'incorrect' ? 'border-red-200 bg-red-50/30' :
                    q.status === 'partial' ? 'border-amber-200 bg-amber-50/30' :
                    'border-zinc-200 bg-white'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Q{q.index + 1}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          q.type === 'mcq' ? 'bg-blue-100 text-blue-700' :
                          q.type === 'coding' ? 'bg-purple-100 text-purple-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>{q.type}</span>
                        <Badge color={
                          q.status === 'correct' ? 'emerald' :
                          q.status === 'incorrect' ? 'red' :
                          q.status === 'partial' ? 'amber' : 'zinc'
                        }>{q.status}</Badge>
                      </div>
                      <span className="text-sm font-black tabular-nums text-zinc-700">{q.marksObtained}/{q.maxMarks}</span>
                    </div>
                    <p className="text-sm text-zinc-800 font-medium mb-2">{q.questionText}</p>
                    {q.type === 'mcq' && q.options && (
                      <div className="space-y-1">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className={`px-3 py-1.5 rounded text-xs ${
                            oi === q.correctChoice && oi === q.studentChoice ? 'bg-emerald-100 text-emerald-800 font-bold' :
                            oi === q.correctChoice ? 'bg-emerald-100 text-emerald-700' :
                            oi === q.studentChoice ? 'bg-red-100 text-red-700 font-bold' :
                            'bg-zinc-50 text-zinc-600'
                          }`}>{opt}</div>
                        ))}
                      </div>
                    )}
                    {q.type === 'coding' && q.studentAnswer && (
                      <pre className="bg-zinc-900 text-zinc-100 p-3 rounded-lg text-xs overflow-x-auto max-h-32 mt-2">{q.studentAnswer}</pre>
                    )}
                    {q.type === 'short' && (
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <div className="bg-zinc-50 border rounded-lg p-3 text-xs">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Student's Answer</p>
                          {q.studentAnswer || <span className="italic text-zinc-400">No answer</span>}
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-700">
                          <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Expected</p>
                          {q.expectedAnswer || 'N/A'}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null
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

      {/* Toast Notifications */}
      <div className="fixed bottom-8 right-8 z-[200] space-y-3">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-3 px-5 py-4 rounded-2xl border shadow-2xl animate-in slide-in-from-right-10 duration-500 ${t.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${t.type === 'error' ? 'bg-red-100 text-red-500' : 'bg-emerald-100 text-emerald-500'}`}>
               {t.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest mb-0.5 leading-none">{t.type === 'error' ? 'Error' : 'Success'}</p>
               <p className="text-[11px] font-semibold">{t.msg}</p>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
}
