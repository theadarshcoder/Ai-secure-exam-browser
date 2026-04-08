import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import socketService from '../services/socket';
import {
  LayoutDashboard, Video, FileText, BarChart3, 
  Search, Bell, Plus, ChevronRight,
  LogOut, Clock, AlertTriangle, 
  CheckCircle2, ArrowUpRight, ArrowDownRight,
  Filter, Download, Eye, Power, Users, ShieldCheck, 
  Edit3, RefreshCw, Trash2
} from 'lucide-react';
import VisionLogo from '../components/VisionLogo';
import { 
  getMentorStats, 
  getMentorExamList, 
  getAllResults,
  deleteExam 
} from '../services/api';

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
    draft: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    high: 'bg-red-50 text-red-700 border-red-200',
  };

  const current = styles[status?.toLowerCase()] || styles.draft;

  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${current} capitalize`}>
      {status}
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


/* ─────────────────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────────────────── */

export default function MentorDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const [userName] = useState(localStorage.getItem('vision_name') || 'Mentor');
  
  // Live data states
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ liveStudents: 0, totalSubmissions: 0, flags: 0, totalExams: 0 });
  const [activity, setActivity] = useState([]);
  const [liveSessions, setLiveSessions] = useState([]);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');

  // Real-time violation alerts state (via Socket.IO)
  const [violations, setViolations] = useState([]);

  useEffect(() => {
    const userEmail = localStorage.getItem('vision_email');
    if (userEmail) socketService.connect(userEmail);

    socketService.onMentorAlert((data) => {
      setViolations(prev => [{
        id: Date.now(),
        student: data.studentName || 'Unknown Student',
        type: data.type || 'Integrity Alert',
        time: new Date().toLocaleTimeString()
      }, ...prev].slice(0, 10));
    });

    return () => socketService.disconnect();
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
        setActivity(res.activity || []);
        // For live proctoring, use the live sessions from stats
        // The mentor-stats endpoint returns session data we can use
        setLiveSessions(res.performance || []);
      } else if (tab === 'Exam Management') {
        const res = await getMentorExamList();
        setExams(res || []);
      } else if (tab === 'Results & Reports') {
        const res = await getAllResults();
        setResults(res || []);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleDeleteExam = async (id) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return;
    try {
      await deleteExam(id);
      setExams(exams.filter(e => (e.id || e._id) !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete exam.');
    }
  };

  const handleExportCsv = () => {
    if (results.length === 0) {
      alert('No results to export.');
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
          <div key={i} className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <stat.icon size={20} />
              </div>
              <span className={`text-xs font-bold flex items-center gap-1 ${
                stat.trendType === 'up' ? 'text-emerald-600' : 
                stat.trendType === 'down' ? 'text-red-600' : 'text-zinc-400'
              }`}>
                {stat.trendType === 'up' && <ArrowUpRight size={14} />}
                {stat.trendType === 'down' && <ArrowDownRight size={14} />}
              </span>
            </div>
            <h3 className="text-3xl font-black text-zinc-900 tracking-tight">{stat.value}</h3>
            <p className="text-xs font-bold text-zinc-500 mt-1 uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-tight">Recent Activity</h4>
            <button onClick={() => setActiveTab('Results & Reports')} className="text-xs font-bold text-emerald-600 hover:underline">View All</button>
          </div>
          <div className="space-y-4">
             {/* Socket violations take priority, then API activity */}
             {violations.length > 0 ? violations.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-4 bg-red-50/50 border border-red-100 rounded-xl animate-in slide-in-from-right-2">
                   <div className="flex items-center gap-3">
                      <AlertTriangle size={16} className="text-red-500" />
                      <div>
                         <p className="text-[13px] font-bold text-zinc-900">{v.student}</p>
                         <p className="text-[11px] text-zinc-500">{v.type}</p>
                      </div>
                   </div>
                   <span className="text-[10px] font-bold text-zinc-400 uppercase">{v.time}</span>
                </div>
             )) : activity.length > 0 ? activity.map((a, i) => (
                <div key={i} className={`flex items-center justify-between p-4 ${a.type === 'flag' ? 'bg-red-50/50 border border-red-100' : 'bg-zinc-50 border border-zinc-100'} rounded-xl`}>
                   <div className="flex items-center gap-3">
                      {a.type === 'flag' ? <AlertTriangle size={16} className="text-red-500" /> : <CheckCircle2 size={16} className="text-emerald-500" />}
                      <div>
                         <p className="text-[13px] font-bold text-zinc-900">{a.name}</p>
                         <p className="text-[11px] text-zinc-500">{a.action} {a.exam}</p>
                      </div>
                   </div>
                   <span className="text-[10px] font-bold text-zinc-400 uppercase">{a.time}</span>
                </div>
             )) : (
               <div className="h-32 flex flex-col items-center justify-center text-zinc-400 gap-2">
                  <ShieldCheck size={24} className="opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest opacity-40 text-center">No integrity violations detected <br/>in the current session</p>
               </div>
             )}
          </div>
        </div>
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm">
           <div className="flex items-center gap-2 mb-6">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-tight">Quick Stats</h4>
           </div>
           <div className="space-y-6">
              <div>
                 <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                    <span>Submissions</span>
                    <span className="text-emerald-600">{stats.totalSubmissions}</span>
                 </div>
                 <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${Math.min((stats.totalSubmissions / Math.max(stats.totalSubmissions + stats.liveStudents, 1)) * 100, 100)}%` }} />
                 </div>
              </div>
              <div>
                 <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                    <span>Flagged Sessions</span>
                    <span className={stats.flags > 0 ? 'text-red-600' : 'text-emerald-600'}>{stats.flags}</span>
                 </div>
                 <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-500 ${stats.flags > 0 ? 'bg-red-400' : 'bg-emerald-500'}`} style={{ width: `${Math.min((stats.flags / Math.max(stats.totalSubmissions, 1)) * 100, 100)}%` }} />
                 </div>
              </div>
           </div>
           <p className="text-[11px] text-zinc-500 mt-8 leading-relaxed italic">
             "Proctoring active. Real-time data refreshes on each tab switch."
           </p>
        </div>
      </div>
    </div>
  );

  const renderLiveProctoring = () => {
    // Filter live sessions based on search
    const filtered = liveSessions.filter(s => 
      !searchFilter || 
      (s.name || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
      (s.exam || '').toLowerCase().includes(searchFilter.toLowerCase())
    );

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-zinc-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Live Environment
            </h2>
            <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">{stats.liveStudents} active sessions</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
              <input 
                type="text" 
                placeholder="Filter candidates..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="pl-9 pr-4 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none w-64 bg-white"
              />
            </div>
            <button onClick={() => fetchDataForTab('Live Proctoring')} className="p-2 border border-zinc-200 rounded-xl text-zinc-500 hover:bg-zinc-50 transition-all active:scale-95">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        <DataTable 
          loading={loading}
          headers={['Student', 'Exam', 'Score', 'Status', 'Actions']}
          data={filtered}
          renderRow={(session, idx) => (
            <tr key={idx} className="hover:bg-zinc-50 transition-colors group">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-zinc-600 text-xs">
                    {(session.name || 'S').charAt(0)}
                  </div>
                  <span className="text-sm font-semibold text-zinc-900">{session.name || 'Student'}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-xs font-medium text-zinc-600">
                {session.exam || 'N/A'}
              </td>
              <td className="px-6 py-4">
                <span className={`text-xs font-black tabular-nums ${(session.score || 0) >= 80 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {session.score != null ? `${session.score}%` : 'Pending'}
                </span>
              </td>
              <td className="px-6 py-4">
                 <StatusBadge status={session.status || 'Active'} />
              </td>
              <td className="px-6 py-4">
                 <button className="flex items-center gap-2 text-[11px] font-black uppercase text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-all border border-transparent hover:border-emerald-100 active:scale-95">
                    <Eye size={12} /> View
                 </button>
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
         <h2 className="text-lg font-black text-zinc-900 tracking-tight">Exam Library</h2>
         <button 
           onClick={() => navigate('/create-exam')}
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
          <tr key={exam.id || exam._id} className="hover:bg-zinc-50 transition-colors">
            <td className="px-6 py-4 font-bold text-sm text-zinc-900">{exam.name || exam.title}</td>
            <td className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">{exam.category || 'Standard'}</td>
            <td className="px-6 py-4 text-xs text-zinc-500 tabular-nums font-medium">{exam.duration || '—'} MIN</td>
            <td className="px-6 py-4 text-xs text-zinc-500 tabular-nums font-medium">{exam.questionsCount || 0} Qs</td>
            <td className="px-6 py-4">
               <StatusBadge status={exam.status || 'draft'} />
            </td>
            <td className="px-6 py-4">
               <div className="flex items-center gap-4">
                  <button 
                    onClick={() => navigate(`/examcockpit/${exam.id || exam._id}`)}
                    className="text-xs font-bold text-zinc-500 hover:text-emerald-600 uppercase tracking-wider flex items-center gap-1 transition-colors active:scale-95"
                  >
                    <Eye size={14} /> View
                  </button>
                  <button 
                    onClick={() => navigate(`/create-exam?edit=${exam.id || exam._id}`)}
                    className="text-xs font-bold text-zinc-500 hover:text-amber-600 uppercase tracking-wider flex items-center gap-1 transition-colors active:scale-95"
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteExam(exam.id || exam._id)}
                    className="text-xs font-bold text-zinc-400 hover:text-red-600 uppercase tracking-wider flex items-center gap-1 transition-colors active:scale-95"
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
         <h2 className="text-lg font-black text-zinc-900 tracking-tight">Post-Exam Analytics</h2>
         <button 
           onClick={handleExportCsv}
           className="flex items-center gap-2 text-xs font-bold text-zinc-600 border border-zinc-200 px-4 py-2 rounded-xl hover:bg-white shadow-sm transition-all active:scale-95"
         >
            <Download size={14} /> Export CSV
         </button>
      </div>

      <DataTable 
        loading={loading}
        headers={['Student', 'Exam Name', 'Result', 'Violations', 'Submitted', 'Action']}
        data={results}
        renderRow={(res, idx) => (
          <tr key={res._id || idx} className="hover:bg-zinc-50 transition-colors">
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
            <td className="px-6 py-4 text-xs font-bold text-red-500 tabular-nums">{res.totalViolations || 0} Flags</td>
            <td className="px-6 py-4 text-[10px] font-bold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
               <Clock size={12} /> {res.submittedAt ? new Date(res.submittedAt).toLocaleString() : 'N/A'}
            </td>
            <td className="px-6 py-4">
               <button 
                 onClick={() => alert(`Report for ${res.studentName}:\nExam: ${res.examTitle}\nScore: ${res.score}/${res.totalMarks}\nPercentage: ${res.percentage}%\nPassed: ${res.passed ? 'Yes' : 'No'}\nViolations: ${res.totalViolations}\nTab Switches: ${res.tabSwitches}`)}
                 className="text-emerald-600 font-bold text-[11px] uppercase tracking-widest hover:underline flex items-center gap-1 active:scale-95"
               >
                 View Report <Eye size={12} />
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
    <div className="flex h-screen bg-zinc-50 font-sans text-zinc-900 select-none antialiased">
      {/* Fixed Sidebar */}
      <aside className="w-64 bg-zinc-950 flex flex-col z-30 shadow-2xl shrink-0">
        <div className="h-20 flex items-center px-8 border-b border-white/5">
          <div className="flex items-center gap-3">
             <VisionLogo className="h-6 w-6 text-emerald-500" />
             <span className="text-sm font-black uppercase tracking-[0.3em] text-white">VISION <span className="text-zinc-500 font-bold">PRO</span></span>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-1.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`group flex w-full items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative ${
                activeTab === item.id 
                ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/40' 
                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={18} className={`transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
              {activeTab === item.id && (
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

      {/* Main Container */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-zinc-200 flex items-center justify-between px-10 relative z-20">
          <div className="flex items-center gap-3 text-xs font-bold text-zinc-400 uppercase tracking-widest">
            <span className="hover:text-emerald-600 transition-colors cursor-pointer">Mentor</span>
            <ChevronRight size={14} className="opacity-50" />
            <span className="text-zinc-900">{activeTab}</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group cursor-pointer">
               <Bell size={20} className="text-zinc-400 hover:text-emerald-600 transition-colors" />
               {violations.length > 0 && (
                 <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse" />
               )}
            </div>
            <div className="h-6 w-px bg-zinc-200" />
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right">
                <p className="text-[11px] font-bold text-zinc-900 group-hover:text-emerald-600 transition-colors uppercase tracking-tight leading-none">{userName}</p>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mt-1">Mentor</p>
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
