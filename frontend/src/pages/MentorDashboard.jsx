import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import socketService from '../services/socket';
import {
  LayoutDashboard, Video, FileText, BarChart3, 
  Search, Bell, Plus, ChevronRight, MoreVertical,
  LogOut, Settings, Clock, AlertTriangle, 
  CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight,
  Filter, Download, Eye, Power, Users, ShieldCheck, 
  Edit3, RefreshCw
} from 'lucide-react';
import VisionLogo from '../components/VisionLogo';

/* ─────────────────────────────────────────────────────────
   Mock Data & Constants
   ───────────────────────────────────────────────────────── */

const MOCK_STATS = [
  { label: 'Active Test Takers', value: '42', trend: '+5', trendType: 'up', icon: Users },
  { label: 'Violations Today', value: '15', trend: '-2', trendType: 'down', icon: AlertTriangle },
  { label: 'Exams Published', value: '8', trend: '0', trendType: 'neutral', icon: FileText }
];

const MOCK_LIVE_SESSIONS = [
  { id: '1', name: 'Arjun Mehra', exam: 'Data Structures Final', status: 'Normal', violations: 0 },
  { id: '2', name: 'Priya Sharma', exam: 'Algorithm Design', status: 'Warning', violations: 3 },
  { id: '3', name: 'Rahul Varma', exam: 'Data Structures Final', status: 'Normal', violations: 0 },
  { id: '4', name: 'Sneha Kapur', exam: 'System Design', status: 'Terminated', violations: 12 },
];

const MOCK_EXAMS = [
  { id: 'e1', title: 'Data Structures Final', type: 'Coding', duration: '90', questions: 12, status: 'Active' },
  { id: 'e2', title: 'Algorithm Design', type: 'Coding', duration: '120', questions: 8, status: 'Active' },
  { id: 'e3', title: 'Web Frameworks MCQ', type: 'MCQ', duration: '45', questions: 30, status: 'Draft' },
];

const MOCK_RESULTS = [
  { id: 'r1', name: 'Amit Singh', exam: 'OS Midsem', score: 88, violations: 1, time: '2024-03-20 14:12' },
  { id: 'r2', name: 'Neha Gupta', exam: 'OS Midsem', score: 94, violations: 0, time: '2024-03-20 14:05' },
  { id: 'r3', name: 'Vikram Rao', exam: 'Database Systems', score: 42, violations: 5, time: '2024-03-19 11:30' },
];

/* ─────────────────────────────────────────────────────────
   Components
   ───────────────────────────────────────────────────────── */

const StatusBadge = ({ status }) => {
  const styles = {
    normal: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    terminated: 'bg-red-50 text-red-700 border-red-200',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    draft: 'bg-zinc-100 text-zinc-600 border-zinc-200',
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
  
  // Real-time violation alerts state
  const [violations, setViolations] = useState([]);

  useEffect(() => {
    const userEmail = localStorage.getItem('vision_email');
    if (userEmail) socketService.connect(userEmail);

    socketService.onMentorAlert((data) => {
      /* 
         SOCKET.IO INTEGRATION POINT
         This listener catches live alerts (Tab Switches, Face Mismatch, etc.)
         We push them into the local violation feed.
      */
      setViolations(prev => [{
        id: Date.now(),
        student: data.studentName || 'Unknown Student',
        type: data.type || 'Integrity Alert',
        time: new Date().toLocaleTimeString()
      }, ...prev].slice(0, 10));
    });

    return () => socketService.disconnect();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
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

  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MOCK_STATS.map((stat, i) => (
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
                {stat.trend !== '0' && stat.trend}
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
            <button className="text-xs font-bold text-emerald-600 hover:underline">View All</button>
          </div>
          <div className="space-y-4">
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
              <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-tight">System Compliance</h4>
           </div>
           <div className="space-y-6">
              <div>
                 <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                    <span>Identity Verified</span>
                    <span className="text-emerald-600">100%</span>
                 </div>
                 <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-full" />
                 </div>
              </div>
              <div>
                 <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                    <span>Proctoring Relay</span>
                    <span className="text-emerald-600">Stable</span>
                 </div>
                 <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[94%]" />
                 </div>
              </div>
           </div>
           <p className="text-[11px] text-zinc-500 mt-8 leading-relaxed italic">
             "Encrypted proctoring stream is active. AI diagnostics reporting minimal outlier behavior."
           </p>
        </div>
      </div>
    </div>
  );

  const renderLiveProctoring = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Live Environment
          </h2>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">Node: vision-edge-alpha</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -tranzinc-y-1/2 text-zinc-400" size={14} />
            <input 
              type="text" 
              placeholder="Filter candidates..."
              className="pl-9 pr-4 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none w-64 bg-white"
            />
          </div>
          <button className="p-2 border border-zinc-200 rounded-xl text-zinc-500 hover:bg-zinc-50 transition-all">
            <Filter size={14} />
          </button>
        </div>
      </div>

      <DataTable 
        headers={['Candidate Name', 'Current Exam', 'Status', 'Violations', 'Actions']}
        data={MOCK_LIVE_SESSIONS}
        renderRow={(session) => (
          <tr key={session.id} className="hover:bg-zinc-50 transition-colors group">
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-zinc-600 text-xs">
                  {session.name.charAt(0)}
                </div>
                <span className="text-sm font-semibold text-zinc-900">{session.name}</span>
              </div>
            </td>
            <td className="px-6 py-4 text-xs font-medium text-zinc-600">
              {session.exam}
            </td>
            <td className="px-6 py-4">
               <StatusBadge status={session.status} />
            </td>
            <td className="px-6 py-4">
               <div className={`flex items-center gap-1.5 text-xs font-bold tabular-nums ${session.violations > 5 ? 'text-red-600' : 'text-zinc-500'}`}>
                  <AlertTriangle size={12} className={session.violations > 0 ? 'text-amber-500' : 'text-zinc-300'} />
                  {session.violations}
               </div>
            </td>
            <td className="px-6 py-4">
               <button className="flex items-center gap-2 text-[11px] font-black uppercase text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all border border-transparent hover:border-red-100 active:scale-95">
                  <Power size={12} /> Terminate
               </button>
            </td>
          </tr>
        )}
      />
    </div>
  );

  const renderExamLibrary = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
         <h2 className="text-lg font-black text-zinc-900 tracking-tight">Exam Library</h2>
         <button className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-600/20">
            <Plus size={16} /> Create New Exam
         </button>
      </div>

      <DataTable 
        headers={['Assessment Title', 'Type', 'Duration', 'Questions', 'Status', 'Action']}
        data={MOCK_EXAMS}
        renderRow={(exam) => (
          <tr key={exam.id} className="hover:bg-zinc-50 transition-colors">
            <td className="px-6 py-4 font-bold text-sm text-zinc-900">{exam.title}</td>
            <td className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">{exam.type}</td>
            <td className="px-6 py-4 text-xs text-zinc-500 tabular-nums font-medium">{exam.duration} MIN</td>
            <td className="px-6 py-4 text-xs text-zinc-500 tabular-nums font-medium">{exam.questions} Qs</td>
            <td className="px-6 py-4">
               <StatusBadge status={exam.status} />
            </td>
            <td className="px-6 py-4 text-right">
               <div className="flex items-center justify-end gap-2">
                  <button className="p-1.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"><Edit3 size={16} /></button>
                  <button className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-all"><MoreVertical size={16} /></button>
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
         <button className="flex items-center gap-2 text-xs font-bold text-zinc-600 border border-zinc-200 px-4 py-2 rounded-xl hover:bg-white shadow-sm transition-all">
            <Download size={14} /> Export CSV
         </button>
      </div>

      <DataTable 
        headers={['Student', 'Exam Name', 'Result', 'Violations', 'Submission Time', 'Action']}
        data={MOCK_RESULTS}
        renderRow={(res) => (
          <tr key={res.id} className="hover:bg-zinc-50 transition-colors">
            <td className="px-6 py-4 text-sm font-semibold text-zinc-800">{res.name}</td>
            <td className="px-6 py-4 text-xs font-medium text-zinc-600">{res.exam}</td>
            <td className="px-6 py-4">
               <div className="flex items-center gap-2">
                 <div className="max-w-[100px] flex-1 h-1 bg-zinc-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${res.score >= 80 ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${res.score}%` }} />
                 </div>
                 <span className={`text-xs font-black tabular-nums ${res.score >= 80 ? 'text-emerald-700' : 'text-amber-700'}`}>{res.score}%</span>
               </div>
            </td>
            <td className="px-6 py-4 text-xs font-bold text-red-500 tabular-nums">{res.violations} Flags</td>
            <td className="px-6 py-4 text-[10px] items-center gap-1.5 font-bold text-zinc-400 flex uppercase tracking-wider">
               <Clock size={12} /> {res.time}
            </td>
            <td className="px-6 py-4">
               <button className="text-emerald-600 font-bold text-[11px] uppercase tracking-widest hover:underline flex items-center gap-1">
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
                <div className="absolute right-2 top-1/2 -tranzinc-y-1/2 w-1 h-3 bg-white/30 rounded-full" />
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
               <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </div>
            <div className="h-6 w-px bg-zinc-200" />
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right">
                <p className="text-[11px] font-bold text-zinc-900 group-hover:text-emerald-600 transition-colors uppercase tracking-tight leading-none">{userName}</p>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mt-1">Lead Architect</p>
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
