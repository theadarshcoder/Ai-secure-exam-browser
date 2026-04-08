import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, Settings,
  Search, FileUp, UserPlus, Trash2, Eye,
  ShieldCheck, Activity, AlertOctagon,
  ChevronRight, LogOut, Bell, RefreshCw
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
  getAdminExams
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
  
  const [userName] = useState(localStorage.getItem('vision_name') || 'Administrator');
  const [userRole] = useState(localStorage.getItem('vision_role') || 'admin');

  // App States
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalUsers: 0, activeExams: 0, systemHealth: '100%', totalViolations: 0 });
  const [users, setUsers] = useState([]);
  const [exams, setExams] = useState([]);
  const [settings, setSettingsState] = useState({
     maxTabSwitches: 5,
     forceFullscreen: true,
     allowLateSubmissions: false,
     enableWebcam: false
  });

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'student' });

  useEffect(() => {
    fetchDataForTab(activeTab);
  }, [activeTab]);

  const fetchDataForTab = async (tab) => {
      setLoading(true);
      try {
          if (tab === 'Overview') {
              const res = await getDashboardStats();
              setStats({
                  totalUsers: res.totalAttempts || 0,
                  activeExams: res.liveExams || 0,
                  systemHealth: '100%',
                  totalViolations: res.flaggedSessions || 0
              });
          } else if (tab === 'Users') {
              const [studentsRes, mentorsRes] = await Promise.all([
                  getStudents().catch(() => []),
                  getMentors().catch(() => [])
              ]);
              setUsers([...mentorsRes, ...studentsRes]);
          } else if (tab === 'Exams') {
              const res = await getAdminExams();
              setExams(res || []);
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
    localStorage.clear();
    navigate('/login');
  };

  const handleDeleteUser = async (id, role) => {
     if(!window.confirm("Are you sure you want to delete this user?")) return;
     try {
         if (role === 'student') await removeStudent(id);
         else await removeMentor(id);
         setUsers(users.filter(u => u._id !== id));
     } catch(err) {
         alert("Failed to delete: " + err.message);
     }
  };

  const handleDeleteExam = async (id) => {
      if(!window.confirm("Delete this exam globally?")) return;
      try {
          await api.delete(`/api/exams/${id}`);
          setExams(exams.filter(e => e._id !== id));
      } catch (err) {
          console.error(err);
          alert('Failed to delete exam');
      }
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
             alert("No valid rows found in CSV. Format: name,email,role");
             return;
         }

         try {
             const res = await bulkImportUsers(usersToImport);
             alert(`${res.results?.length || 'Multiple'} users imported.`);
             fetchDataForTab('Users');
         } catch(err) {
             alert('Import failed: ' + (err.message || "Unknown Error"));
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
      } catch (err) {
          alert("Error creating user: " + err.message);
      }
  };

  const handleSaveSettings = async () => {
      try {
          await saveSettings(settings);
          alert('System settings saved successfully!');
      } catch (err) {
          console.error(err);
          alert('Failed to save settings.');
      }
  };

  const tabs = [
    { id: 'Overview', label: 'Overview', icon: LayoutDashboard, access: ['admin', 'super_mentor'] },
    { id: 'Users', label: 'User Management', icon: Users, access: ['admin', 'super_mentor'] },
    { id: 'Exams', label: 'Exam Library', icon: FileText, access: ['admin', 'super_mentor'] },
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
           <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-tight">Recent System Activity</h4>
        </div>
        <div className="h-32 flex flex-col items-center justify-center text-zinc-400 gap-2">
           <Activity size={24} className="opacity-20" />
           <p className="text-xs font-bold uppercase tracking-widest opacity-40 text-center">System operational. Activity logs<br/>stream actively.</p>
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
                <button onClick={() => navigate(`/examcockpit/${exam.id || exam._id}`)} className="text-xs font-bold text-zinc-500 hover:text-emerald-600 uppercase tracking-wider flex items-center gap-1 transition-colors active:scale-95">
                  <Eye size={14} /> View
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

  const renderContent = () => {
    switch (activeTab) {
      case 'Overview': return renderOverview();
      case 'Users': return renderUsers();
      case 'Exams': return renderExams();
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

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
}
