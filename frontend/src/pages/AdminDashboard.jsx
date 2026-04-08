import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, Settings,
  Search, FileUp, UserPlus, Trash2, Eye,
  ShieldCheck, Activity, AlertOctagon,
  ChevronRight, LogOut
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
// UI Utilities
// ─────────────────────────────────────────────────────────

const Badge = ({ children, color }) => {
  const styles = {
    zinc: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest border rounded-sm ${styles[color] || styles.zinc}`}>
      {children}
    </span>
  );
};

const DataTable = ({ headers, data, renderRow, loading }) => (
  <div className="w-full bg-white border border-zinc-200">
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-zinc-50 border-b border-zinc-200 font-sans">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {loading ? (
             <tr>
               <td colSpan={headers.length} className="px-6 py-8 text-center text-[13px] text-zinc-400 font-medium tracking-wide">
                 Loading data...
               </td>
             </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-6 py-8 text-center text-[13px] text-zinc-400 font-medium tracking-wide">
                No records to display.
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

  // Initial Fetch based on active tab
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
         }).filter(u => u.email); // filter empty lines
         
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
          alert('Configurations Global System Settings Saved!');
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

  const renderOverview = () => {
    const STAT_CARDS = [
       { label: 'Total Users (Attempts)', value: stats.totalUsers, icon: Users },
       { label: 'Active Live Exams', value: stats.activeExams, icon: FileText },
       { label: 'System Health', value: stats.systemHealth, icon: ShieldCheck },
       { label: 'Total Flags/Violations', value: stats.totalViolations, icon: AlertOctagon },
    ];
    return (
      <div className="animate-in fade-in duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {STAT_CARDS.map((stat, i) => (
            <div key={i} className="p-5 bg-white border border-zinc-200 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</span>
                <stat.icon size={16} className="text-zinc-400" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-zinc-900 tracking-tight">{stat.value}</h3>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-zinc-200">
          <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
             <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-widest">Recent System Activity</h4>
          </div>
          <div className="p-8 text-center text-zinc-400 text-sm">
             <Activity size={24} className="mx-auto mb-2 opacity-50 text-zinc-400" />
             <p>System operational. Activity logs stream actively.</p>
          </div>
        </div>
      </div>
    );
  };

  const renderUsers = () => (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
          <input 
            type="text" 
            placeholder="Search users by name or email..."
            className="pl-9 pr-4 py-2 border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 w-72 transition-colors rounded-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleCsvImport} />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors uppercase tracking-wider rounded-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            <FileUp size={14} /> Import CSV
          </button>
          {userRole === 'admin' && (
            <button 
              onClick={() => setShowAddUserModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors uppercase tracking-wider rounded-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
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
          <tr key={user._id} className="hover:bg-zinc-50 transition-colors">
            <td className="px-6 py-4 text-sm font-medium text-zinc-900">{user.name}</td>
            <td className="px-6 py-4 text-sm text-zinc-500">{user.email}</td>
            <td className="px-6 py-4">
               <Badge color={user.role === 'admin' ? 'red' : user.role === 'super_mentor' ? 'amber' : user.role === 'mentor' ? 'emerald' : 'zinc'}>
                 {user.role}
               </Badge>
            </td>
            <td className="px-6 py-4 text-[13px] text-zinc-500">{new Date(user.createdAt).toLocaleDateString()}</td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <button onClick={() => handleDeleteUser(user._id, user.role)} className="text-zinc-400 hover:text-red-700 transition-colors focus:outline-none">
                  <Trash2 size={16} />
                </button>
              </div>
            </td>
          </tr>
        )}
      />

       {/* Add User Modal */}
       {showAddUserModal && (
          <div className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white p-6 md:p-8 rounded-sm shadow-2xl w-full max-w-md border border-zinc-200">
               <h3 className="text-lg font-bold text-zinc-900 mb-6 uppercase tracking-wider">Add New User</h3>
               <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Full Name</label>
                      <input required type="text" value={newUser.name} onChange={e=>setNewUser({...newUser, name: e.target.value})} className="w-full px-4 py-2 border border-zinc-200 text-sm focus:outline-none focus:border-emerald-600 rounded-sm" />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Email Details</label>
                      <input required type="email" value={newUser.email} onChange={e=>setNewUser({...newUser, email: e.target.value})} className="w-full px-4 py-2 border border-zinc-200 text-sm focus:outline-none focus:border-emerald-600 rounded-sm" />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Password</label>
                      <input required type="password" value={newUser.password} onChange={e=>setNewUser({...newUser, password: e.target.value})} className="w-full px-4 py-2 border border-zinc-200 text-sm focus:outline-none focus:border-emerald-600 rounded-sm" />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Role Type</label>
                      <select value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value})} className="w-full px-4 py-2 border border-zinc-200 text-sm focus:outline-none focus:border-emerald-600 rounded-sm bg-white">
                         <option value="student">Student</option>
                         <option value="mentor">Mentor</option>
                         <option value="super_mentor">Super Mentor</option>
                         <option value="admin">Administrator</option>
                      </select>
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-6 border-t border-zinc-100 mt-4">
                     <button type="button" onClick={() => setShowAddUserModal(false)} className="px-5 py-2 text-xs font-bold text-zinc-500 uppercase hover:bg-zinc-50 rounded-sm transition-colors">Cancel</button>
                     <button type="submit" className="px-5 py-2 bg-emerald-700 text-white text-xs font-bold uppercase hover:bg-emerald-800 rounded-sm transition-colors shadow-sm">Save User</button>
                  </div>
               </form>
            </div>
          </div>
       )}
    </div>
  );

  const renderExams = () => (
    <div className="animate-in fade-in duration-300">
      <DataTable 
        loading={loading}
        headers={['System Title', 'Created By', 'Type/Category', 'Status', 'Actions']}
        data={exams}
        renderRow={(exam) => (
          <tr key={exam.id || exam._id} className="hover:bg-zinc-50 transition-colors">
            <td className="px-6 py-4 text-sm font-medium text-zinc-900">{exam.name || exam.title}</td>
            <td className="px-6 py-4 text-sm text-zinc-500">{exam.creatorName || exam.creator?.name || 'Unknown'}</td>
            <td className="px-6 py-4 text-sm text-zinc-500">{exam.category || 'Standard'}</td>
            <td className="px-6 py-4">
               <Badge color={exam.status === 'live' || exam.status === 'published' ? 'emerald' : 'zinc'}>
                 {exam.status || 'Draft'}
               </Badge>
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-4">
                <button onClick={() => navigate(`/examcockpit/${exam.id || exam._id}`)} className="text-xs font-bold text-zinc-500 hover:text-zinc-900 uppercase tracking-wider flex items-center gap-1 focus:outline-none">
                  <Eye size={14} /> View
                </button>
                <button onClick={() => handleDeleteExam(exam.id || exam._id)} className="text-xs font-bold text-zinc-400 hover:text-red-700 uppercase tracking-wider flex items-center gap-1 transition-colors focus:outline-none">
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
    <div className="animate-in fade-in duration-300 max-w-4xl">
      <div className="bg-white border border-zinc-200 mb-6">
         <div className="p-4 border-b border-zinc-200 bg-zinc-50">
            <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-widest">Proctoring Rules & Security</h4>
         </div>
         <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
               <div>
                  <p className="text-sm font-medium text-zinc-900">Max Allowed Tab Switches</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Threshold before exam auto-terminates actively.</p>
               </div>
               <input 
                  type="number" 
                  value={settings.maxTabSwitches} 
                  onChange={e => setSettingsState({...settings, maxTabSwitches: Number(e.target.value)})}
                  className="w-20 px-3 py-1.5 border border-zinc-200 text-sm focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 text-center rounded-sm" 
               />
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
               <div>
                  <p className="text-sm font-medium text-zinc-900">Force Strict Fullscreen</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Locks the browser natively into fullscreen mode during active sessions.</p>
               </div>
               <div 
                  onClick={() => setSettingsState({...settings, forceFullscreen: !settings.forceFullscreen})}
                  className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${settings.forceFullscreen ? 'bg-zinc-900' : 'bg-zinc-200 border border-zinc-300'}`}
               >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${settings.forceFullscreen ? 'right-0.5' : 'left-0.5'}`} />
               </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
               <div>
                  <p className="text-sm font-medium text-zinc-900">Allow Late Submissions</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Accepts payloads after the timer expires, immediately flagged as late.</p>
               </div>
               <div 
                  onClick={() => setSettingsState({...settings, allowLateSubmissions: !settings.allowLateSubmissions})}
                  className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${settings.allowLateSubmissions ? 'bg-zinc-900' : 'bg-zinc-200 border border-zinc-300'}`}
               >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${settings.allowLateSubmissions ? 'right-0.5' : 'left-0.5'}`} />
               </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
               <div>
                  <p className="text-sm font-medium text-zinc-900">Enable Webcam Monitoring</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Hardware mesh to track gaze and physical presence.</p>
               </div>
               <div 
                  onClick={() => setSettingsState({...settings, enableWebcam: !settings.enableWebcam})}
                  className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${settings.enableWebcam ? 'bg-zinc-900' : 'bg-zinc-200 border border-zinc-300'}`}
               >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${settings.enableWebcam ? 'right-0.5' : 'left-0.5'}`} />
               </div>
            </div>
         </div>
      </div>

      <div className="flex justify-end">
         <button onClick={handleSaveSettings} className="px-6 py-2.5 bg-zinc-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 transition-colors rounded-sm">
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
    <div className="flex h-screen bg-zinc-50 font-sans text-zinc-900 select-none antialiased selection:bg-zinc-200 selection:text-zinc-900">
      
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-100 border-r border-zinc-200 flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-zinc-200 bg-zinc-100">
           <VisionLogo className="h-5 w-5 text-zinc-900 mr-2 grayscale" />
           <span className="text-sm font-bold tracking-widest text-zinc-900 uppercase">VISION</span>
        </div>

        <nav className="flex-1 py-4 flex flex-col">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors border-l-2 focus:outline-none ${
                activeTab === tab.id 
                ? 'border-zinc-900 bg-white text-zinc-900 shadow-sm' 
                : 'border-transparent text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50'
              }`}
            >
              <tab.icon size={16} className={activeTab === tab.id ? 'text-zinc-900' : 'text-zinc-400'} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-200 bg-zinc-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 text-xs font-bold uppercase tracking-wider transition-colors rounded-sm focus:outline-none"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header */}
        <header className="h-16 border-b border-zinc-200 bg-white flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            <span>Administration</span>
            <ChevronRight size={14} />
            <span className="text-zinc-900 font-bold">{activeTab}</span>
          </div>

          <div className="flex items-center gap-4">
             <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-700 uppercase">
                {userName.charAt(0)}
             </div>
             <div className="hidden sm:block">
               <p className="text-xs font-bold text-zinc-900">{userName}</p>
               <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">{userRole.replace('_', ' ')}</p>
             </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-8">
           {renderContent()}
        </div>

      </main>
    </div>
  );
}
