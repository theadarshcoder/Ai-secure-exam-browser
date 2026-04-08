import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { 
  getStudents, getMentors, removeStudent, removeMentor, 
  getSystemHealth, getAuditLogs 
} from '../services/api';
import {
  LayoutDashboard, Users, FileText, ShieldAlert, Settings,
  Activity, Search, Bell,
  ChevronRight, Trash2, Edit3,
  CheckCircle2, Clock, 
  Filter, Download, ArrowUpRight, UserPlus,
  RefreshCw, Database, Globe, Zap, Shield, LogOut
} from 'lucide-react';
import VisionLogo from '../components/VisionLogo';

/* ─────────────────────────────────────────────────────────
   Components
   ───────────────────────────────────────────────────────── */

const StatusBadge = ({ status }) => {
  const styles = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    published: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    draft: 'bg-slate-50 text-slate-600 border-slate-200',
    archived: 'bg-red-50 text-red-700 border-red-200',
    healthy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    degraded: 'bg-amber-50 text-amber-700 border-amber-200',
    unreachable: 'bg-red-50 text-red-700 border-red-200',
  };

  const current = styles[status?.toLowerCase()] || styles.draft;

  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${current} capitalize`}>
      {status}
    </span>
  );
};

const DataTable = ({ headers, data, renderRow, loading }) => (
  <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 tabular-nums">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <tr>
              <td colSpan={headers.length} className="px-6 py-12 text-center text-slate-400">
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw size={16} className="animate-spin" /> Fetching latest records...
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-6 py-12 text-center text-slate-400">
                No records found.
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

const HealthCard = ({ title, status, desc, icon: Icon, latency }) => {
  const colors = {
    healthy: 'text-emerald-500 bg-emerald-50 border-emerald-100',
    degraded: 'text-amber-500 bg-amber-50 border-amber-100',
    unreachable: 'text-red-500 bg-red-50 border-red-100',
  };

  const currentStatus = status?.toLowerCase() || 'healthy';
  const colorClass = colors[currentStatus] || colors.healthy;

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className={`p-2.5 rounded-xl ${colorClass}`}>
          <Icon size={20} />
        </div>
        <StatusBadge status={status} />
      </div>
      <div>
        <h4 className="text-sm font-bold text-slate-900">{title}</h4>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
      </div>
      {latency && (
        <div className="flex items-center gap-1.5 mt-auto pt-4 border-t border-slate-50">
          <Clock size={12} className="text-slate-400" />
          <span className="text-[11px] font-mono text-slate-500">{latency}ms response</span>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────────────────── */

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(false);
  
  // Data States
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [exams, setExams] = useState([]);
  const [health, setHealth] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  
  // UI States
  const [roleFilter, setRoleFilter] = useState('student'); // 'student' or 'mentor'
  
  const addToast = (msg, type = 'success') => {
    console.log(`[${type.toUpperCase()}] ${msg}`);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'Overview') {
        const { data } = await api.get('/api/admin/stats');
        setStats(data);
      } else if (activeTab === 'Users') {
        const data = roleFilter === 'student' ? await getStudents() : await getMentors();
        setUsers(data);
      } else if (activeTab === 'Exams') {
        const { data } = await api.get('/api/admin/results');
        setExams(data);
      } else if (activeTab === 'System Health') {
        const data = await getSystemHealth();
        setHealth(data);
      } else if (activeTab === 'Audit Logs') {
        const data = await getAuditLogs();
        setAuditLogs(data);
      }
    } catch (err) {
        console.error('Data sync failure:', err);
        addToast('Data sync failure', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, roleFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name}?`)) return;
    try {
      if (roleFilter === 'student') {
        await removeStudent(id);
      } else {
        await removeMentor(id);
      }
      addToast(`${name} removed successfully`, 'success');
      fetchData();
    } catch (err) {
      console.error('User removal failure:', err);
      addToast('Failed to remove user', 'error');
    }
  };

  const sidebarItems = [
    { id: 'Overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'Users', label: 'User Management', icon: Users },
    { id: 'Exams', label: 'Exam Library', icon: FileText },
    { id: 'System Health', label: 'System Health', icon: Activity },
    { id: 'Audit Logs', label: 'Security Logs', icon: ShieldAlert },
    { id: 'Settings', label: 'Configuration', icon: Settings },
  ];

  /* ─────────────────────────────────────────────────────────
     Render Sections
     ───────────────────────────────────────────────────────── */

  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Live Candidates', value: stats.liveStudents || 0, icon: Users, color: 'indigo', trend: '+12% from last hour' },
          { label: 'Exams Managed', value: stats.totalExams || 0, icon: FileText, color: 'blue', trend: 'Global view enabled' },
          { label: 'Total Submissions', value: stats.totalAttempts || 0, icon: CheckCircle2, color: 'emerald', trend: 'Cumulative data' },
          { label: 'Security Flags', value: stats.flaggedSessions || 0, icon: Shield, color: 'red', trend: 'High priority alerts' },
        ].map((item, i) => (
          <div key={i} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-xl bg-${item.color}-50 text-${item.color}-600`}>
                <item.icon size={22} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest tabular-nums">Metric {i+1}</span>
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight tabular-nums">{item.value}</h3>
            <p className="text-xs font-bold text-slate-500 mt-2 uppercase tracking-wide">{item.label}</p>
            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                <ArrowUpRight size={12} /> {item.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity size={16} className="text-indigo-600" /> Platform Throughput
            </h4>
            <select className="text-xs border-slate-200 rounded-lg py-1 px-2 focus:ring-0">
              <option>Last 24 Hours</option>
              <option>Last 7 Days</option>
            </select>
          </div>
          <div className="h-[240px] w-full bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-xs font-semibold uppercase tracking-widest">
            Analytics visualization pipeline active
          </div>
        </div>
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <h4 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
             <Bell size={16} className="text-amber-500" /> System Alerts
          </h4>
          <div className="space-y-4">
            {[
              { msg: 'Peak traffic detected', time: '12m ago', level: 'info' },
              { msg: 'Judge0 latency increased', time: '1h ago', level: 'warn' },
              { msg: 'New proctor registered', time: '2h ago', level: 'info' },
            ].map((alert, idx) => (
              <div key={idx} className="flex gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                <div className={`w-1.5 h-full rounded-full ${alert.level === 'warn' ? 'bg-amber-400' : 'bg-indigo-400'} shrink-0`} />
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{alert.msg}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl self-start">
          <button 
            onClick={() => setRoleFilter('student')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${roleFilter === 'student' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Students
          </button>
          <button 
            onClick={() => setRoleFilter('mentor')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${roleFilter === 'mentor' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Mentors
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder={`Search ${roleFilter}s...`}
              className="pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none w-64 bg-white"
            />
          </div>
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-sm">
            <UserPlus size={14} /> Add {roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1)}
          </button>
        </div>
      </div>

      <DataTable 
        headers={['Name', 'Email/ID', 'Joined Date', 'Status', 'Actions']}
        data={users}
        loading={loading}
        renderRow={(user) => (
          <tr key={user._id} className="hover:bg-slate-50 transition-colors group">
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">
                  {user.name?.charAt(0) || '?'}
                </div>
                <span className="text-sm font-semibold text-slate-900">{user.name}</span>
              </div>
            </td>
            <td className="px-6 py-4">
              <div className="flex flex-col">
                <span className="text-xs text-slate-600 font-medium">{user.email}</span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-tighter">UID: {user._id?.slice(-8)}</span>
              </div>
            </td>
            <td className="px-6 py-4 text-xs text-slate-500 font-medium">
              {new Date(user.createdAt).toLocaleDateString()}
            </td>
            <td className="px-6 py-4">
              <StatusBadge status="active" />
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Edit">
                  <Edit3 size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteUser(user._id, user.name)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" 
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </td>
          </tr>
        )}
      />
    </div>
  );

  const renderHealth = () => (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Global Connectivity</h2>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Node: vision-master-east</p>
        </div>
        <button 
          onClick={fetchData} 
          className="flex items-center gap-2 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Run Diagnostics
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <HealthCard 
          title="Core Database"
          status={health?.database || 'Healthy'}
          desc="MongoDB Atlas primary cluster. Replicated instances online."
          icon={Database}
        />
        <HealthCard 
          title="Judge0 Proxy"
          status={health?.judge0 || 'Healthy'}
          desc="Code execution backend for technical assessments."
          icon={Zap}
          latency={health?.latency || 0}
        />
        <HealthCard 
          title="Live Signal Layer"
          status="Healthy"
          desc="Secure WebSocket connections for realtime monitoring."
          icon={Globe}
        />
      </div>

      <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
          <Shield size={32} />
        </div>
        <div className="text-center md:text-left">
          <h4 className="text-base font-bold text-slate-900">Enterprise Security Active</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md">256-bit AES encryption is enforced for all packet transmission. AI-driven identity verification is processing 12.4k requests/min.</p>
        </div>
        <button className="md:ml-auto px-6 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-all active:scale-95">
          View Security Audit
        </button>
      </div>
    </div>
  );

  const renderLogs = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-900 tracking-tight">Audit Trail</h2>
        <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-all flex items-center gap-2">
                <Filter size={14} /> Filter Actions
            </button>
            <button className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg transition-all flex items-center gap-2">
                <Download size={14} /> Export Logs
            </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {auditLogs.map((log) => (
          <div key={log._id} className="p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 flex items-center justify-between gap-6 group transition-colors">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-lg ${log.action?.includes('DELETE') ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-500'}`}>
                {log.action?.includes('DELETE') ? <Trash2 size={16} /> : <Activity size={16} />}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{log.action?.replace(/_/g, ' ')}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{log.adminId?.name || 'Automated'}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="text-[10px] text-slate-400 font-mono tracking-tighter">{JSON.stringify(log.details)}</span>
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap">
              <Clock size={12} /> {new Date(log.createdAt).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'Overview': return renderOverview();
      case 'Users': return renderUsers();
      case 'System Health': return renderHealth();
      case 'Audit Logs': return renderLogs();
      case 'Exams': return (
        <DataTable 
          headers={['Exam Title', 'Mentor', 'Duration', 'Risk Status', 'Action']}
          data={exams}
          loading={loading}
          renderRow={(exam) => (
            <tr key={exam._id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-sm text-slate-900 capitalize tracking-tight">{exam.examTitle}</td>
                <td className="px-6 py-4 text-xs font-semibold text-slate-600">{exam.studentName}</td>
                <td className="px-6 py-4 text-xs text-slate-500 tabular-nums font-medium">{exam.examDuration} MIN</td>
                <td className="px-6 py-4">
                  <StatusBadge status={exam.status === 'in_progress' ? 'published' : 'archived'} />
                </td>
                <td className="px-6 py-4">
                    <button className="text-indigo-600 font-bold text-[11px] uppercase tracking-widest hover:underline">View Analytics</button>
                </td>
            </tr>
          )}
        />
      );
      default: return <div className="p-32 text-center text-slate-400 font-bold uppercase tracking-[0.2em]">Feature Deployment Pending</div>;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50/50 font-sans text-slate-900 select-none antialiased">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-slate-900 flex flex-col z-30 shadow-2xl">
        <div className="h-20 flex items-center px-8 border-b border-white/5">
          <div className="flex items-center gap-3">
            <VisionLogo className="h-6 w-6 text-indigo-500" />
            <span className="text-sm font-black uppercase tracking-[0.3em] text-white">VISION <span className="text-slate-500 font-bold">ADM</span></span>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-1.5 overflow-y-auto">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`group flex w-full items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative ${
                activeTab === item.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={18} className={`transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
              {activeTab === item.id && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-4 bg-white/20 rounded-full" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white text-sm font-black uppercase shadow-inner border border-white/5">
              AD
            </div>
            <div>
              <p className="text-xs font-bold text-white tracking-tight">Admin Console</p>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-0.5">Root Layer</p>
            </div>
          </div>
          <button 
            onClick={() => { localStorage.clear(); navigate('/login'); }}
            className="w-full flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all uppercase tracking-widest active:scale-95 border border-white/5"
          >
            <LogOut size={16} /> Exit Session
          </button>
        </div>
      </aside>

      {/* Main Layer */}
      <main className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-10 relative z-20">
          <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span className="hover:text-indigo-600 transition-colors cursor-pointer capitalize">{activeTab}</span>
            <ChevronRight size={14} className="opacity-50" />
            <span className="text-slate-900">Current Node</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group">
               <Bell size={20} className="text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer" />
               <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-black text-white border-2 border-white tabular-nums">3</div>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right">
                <p className="text-[11px] font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight leading-none">Global Admin</p>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Superuser</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-600 uppercase text-sm shadow-sm group-hover:border-indigo-200 transition-all">
                G
              </div>
            </div>
          </div>
        </header>

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
