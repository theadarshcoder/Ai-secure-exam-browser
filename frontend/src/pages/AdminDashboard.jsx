import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, FileText, Users, ShieldAlert, Settings, 
  Search, Bell, Plus, MoreHorizontal, ExternalLink, 
  AlertCircle, BarChart3, Monitor,
  Clock, Download, ChevronRight, History
} from 'lucide-react';
import VisionLogo from '../components/VisionLogo';

/* ─────────────── Config & Constants ─────────────── */

const NAV_ITEMS = [
  { id: 'Overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
  { id: 'Assessments', label: 'Assessments', icon: <FileText size={18} /> },
  { id: 'Candidates', label: 'Candidates', icon: <Users size={18} /> },
  { id: 'Integrity', label: 'Integrity Log', icon: <ShieldAlert size={18} /> },
  { id: 'Analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
  { id: 'Settings', label: 'System Settings', icon: <Settings size={18} /> },
];

const ACTIVE_SESSIONS = [
  { id: 'VSN-89241', name: 'Adarsh Maurya', exam: 'Data Structures', risk: 'Low', score: 98, time: '32m rem' },
  { id: 'VSN-89242', name: 'Sarah Chen', exam: 'Advanced AI', risk: 'High', score: 42, time: '14m rem' },
  { id: 'VSN-89243', name: 'Rahul Verma', exam: 'Network Security', risk: 'Medium', score: 71, time: '45m rem' },
  { id: 'VSN-89244', name: 'Elena Rossi', exam: 'Operating Systems', risk: 'Low', score: 99, time: '08m rem' },
  { id: 'VSN-89245', name: 'Chris Jordan', exam: 'Cloud Arch', risk: 'Medium', score: 85, time: '22m rem' },
];

/* ─────────────── Sub-components ─────────────── */

const StatCard = ({ label, value, tag, color }) => (
  <div className="bg-[#181a20] rounded-2xl p-5 border border-white/[0.06] hover:border-white/[0.12] transition-all group">
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-2 h-2 rounded-full ${color.replace('text-', 'bg-')}`} />
      <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{label}</span>
    </div>
    <div className="flex items-baseline justify-between transition-transform group-hover:translate-x-1">
      <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/5 border border-white/10 ${color}`}>
        {tag}
      </span>
    </div>
  </div>
);

const SessionRow = ({ session }) => {
  const riskColor = session.risk === 'High' ? 'text-red-500' : session.risk === 'Medium' ? 'text-amber-500' : 'text-emerald-500';
  const riskBg = session.risk === 'High' ? 'bg-red-500' : session.risk === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <tr className="text-zinc-300 transition-colors hover:bg-white/[0.02] group divide-x divide-white/[0.04]">
      <td className="px-5 py-3.5">
        <div className="flex flex-col">
          <span className="text-[13px] font-semibold text-zinc-100">{session.name}</span>
          <span className="mt-0.5 font-mono text-[10px] text-zinc-600">{session.id}</span>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <span className="text-[12px] font-medium text-zinc-400">{session.exam}</span>
        <div className="mt-1 flex items-center gap-1.5 font-bold uppercase tracking-tight text-[9px] text-zinc-600">
          <Clock size={10} /> {session.time}
        </div>
      </td>
      <td className="px-5 py-3.5">
        <div className="mx-auto flex min-w-[120px] flex-col items-center gap-1.5">
          <div className="h-1 w-full max-w-[80px] overflow-hidden rounded-full bg-zinc-800">
            <div className={`h-full transition-all duration-1000 ${riskBg}`} style={{ width: `${session.score}%` }} />
          </div>
          <span className={`text-[9px] font-black uppercase tracking-widest ${riskColor}`}>
            {session.risk} RISK
          </span>
        </div>
      </td>
      <td className="px-8 py-3.5 text-right">
        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-800 hover:text-white transition-all"><ExternalLink size={14} /></button>
          <button className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-800 hover:text-white transition-all"><MoreHorizontal size={14} /></button>
        </div>
      </td>
    </tr>
  );
};

const IncidentItem = ({ incident }) => (
  <div className="cursor-default p-5 transition-colors hover:bg-white/[0.02] group">
    <div className="mb-2 flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-600">
       <span className={incident.severity === 'high' ? 'text-red-400' : 'text-amber-400'}>{incident.type}</span>
       <span className="font-mono text-zinc-700">{new Date(incident.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
    <p className="mb-3 leading-relaxed text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">{incident.details}</p>
    <div className="flex items-center justify-between">
      <span className="font-mono text-[9px] tracking-tighter text-zinc-700 bg-white/5 px-1.5 py-0.5 rounded uppercase">ID: {incident.id.split('-').pop()}</span>
      <button className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 hover:text-indigo-400 transition-all active:scale-95">Resolve Issue</button>
    </div>
  </div>
);

/* ─────────────── Main Component ─────────────── */

export default function AdminDashboard() {
  const [activeTab, setTab] = useState('Overview');
  const [incidents, setIncidents] = useState([]);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    
    try {
      const raw = localStorage.getItem('vision_incidents');
      if (raw) setIncidents(JSON.parse(raw));
    } catch (e) { console.error("History sync failure", e); }

    return () => {
      document.body.style.overflow = 'auto';
      clearInterval(timer);
    };
  }, []);

  const criticalIssues = incidents.filter(i => i.severity === 'high').length;
  const stats = [
    { label: 'Active Exams', value: '142', tag: 'SYNCED', color: 'text-indigo-500' },
    { label: 'Reported Alerts', value: String(criticalIssues), tag: 'URGENT', color: 'text-red-500' },
    { label: 'Integrity Score', value: '98.2', tag: 'NOMINAL', color: 'text-emerald-500' },
    { label: 'System Uptime', value: '99.9%', tag: 'STABLE', color: 'text-zinc-500' },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0f1117] font-sans text-zinc-200 select-none">
      <aside className="z-50 flex w-64 shrink-0 flex-col border-r border-white/5 bg-[#0c0c0e] shadow-2xl">
        <div className="flex h-14 items-center gap-2.5 border-b border-white/5 px-5">
          <VisionLogo className="h-5 w-5 text-white" />
          <span className="text-sm font-bold uppercase tracking-wider text-zinc-100">Vision Admin</span>
        </div>
        
        <nav className="flex-1 space-y-0.5 p-4 overflow-y-auto custom-scrollbar">
          <p className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-2">Main Menu</p>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all ${activeTab === item.id ? 'bg-white/5 text-white shadow-sm' : 'text-zinc-500 hover:bg-white/[0.02] hover:text-zinc-300'}`}
            >
              <span className={activeTab === item.id ? 'text-indigo-500' : 'text-zinc-700 transition-colors group-hover:text-zinc-500'}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-zinc-800 bg-black/40 p-4">
          <div className="mb-1 flex items-center gap-3">
            <div className="relative w-2 h-2">
              <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-30" />
              <div className="relative h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-500">System Online</span>
          </div>
          <p className="text-[9px] font-medium text-zinc-600 tracking-widest uppercase">Region: primary-node</p>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-white/5 bg-[#0f1117]/80 px-8 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
            <span>Root</span>
            <ChevronRight size={10} />
            <span>Dashboard</span>
            <ChevronRight size={10} />
            <span className="text-indigo-500">Overview</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700 transition-all group-focus-within:text-blue-500" size={14} />
              <input type="text" placeholder="Global Search..." className="w-64 rounded-xl border border-white/5 bg-[#181a20] py-2 pl-9 pr-3 text-[12px] text-white transition-all placeholder:text-zinc-700 focus:border-white/10 outline-none" />
            </div>
            <div className="h-6 w-px bg-white/5" />
            <div className="flex items-center gap-3">
              <button className="rounded-xl p-2 text-zinc-500 hover:bg-white/5 hover:text-white transition-all"><Bell size={18} /></button>
              <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-[#181a20] text-[10px] font-black text-zinc-300 hover:bg-white/[0.08] hover:border-white/20 transition-all shadow-lg">AD</div>
            </div>
          </div>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto p-8 custom-scrollbar">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white uppercase">Admin Dashboard</h1>
              <p className="text-xs font-medium text-zinc-600 uppercase tracking-widest mt-1">Status: Operational // {currentTime}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-[#1a1d26] px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-zinc-300 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.12] transition-all"><Download size={14} /> Export</button>
              <button className="flex items-center gap-2 rounded-xl bg-white px-6 py-2 text-[11px] font-bold uppercase tracking-widest text-[#0f1117] shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_28px_rgba(255,255,255,0.2)] hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98] transition-all"><Plus size={16} /> Deploy</button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {stats.map((s, i) => <StatCard key={i} {...s} />)}
          </div>

          <div className="grid grid-cols-12 gap-6">
            <section className="col-span-8 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-600">
                  <Monitor className="text-indigo-500" size={14} /> Active Sessions
                </h2>
                <button className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-500 hover:underline transition-all">View All Sessions</button>
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0c0c0e] shadow-2xl">
                <table className="w-full text-left">
                  <thead className="border-b border-white/[0.04] bg-white/[0.01]">
                    <tr>
                      <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-widest text-zinc-600">Student Name</th>
                      <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-widest text-zinc-600">Exam Title</th>
                      <th className="px-5 py-4 text-center text-[9px] font-bold uppercase tracking-widest text-zinc-600">Risk Level</th>
                      <th className="px-8 py-4 text-right text-[9px] font-bold uppercase tracking-widest text-zinc-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {ACTIVE_SESSIONS.map((s, i) => <SessionRow key={i} session={s} />)}
                  </tbody>
                </table>
              </div>
            </section>

            <aside className="col-span-4 flex flex-col gap-4">
              <h2 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-600">
                <History className="text-amber-500" size={14} /> Security Logs
              </h2>
              <div className="max-h-[460px] overflow-y-auto rounded-2xl border border-white/[0.06] bg-[#181a20]/50 divide-y divide-white/[0.04] shadow-2xl custom-scrollbar">
                {incidents.length > 0 ? incidents.slice(0, 6).map((inc, i) => <IncidentItem key={i} incident={inc} />) : (
                  <div className="flex h-64 flex-col items-center justify-center p-6 text-center opacity-40">
                    <ShieldAlert className="mb-3 text-zinc-800" size={28} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-700">Threat Matrix Passive</p>
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-[#181a20] p-6 shadow-inner relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-red-500/10 transition-colors" />
                <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600 relative z-10">Quick Actions</p>
                <div className="grid grid-cols-2 gap-3 relative z-10">
                  <button className="rounded-xl border border-red-500/20 bg-red-500/10 py-3 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95">Stop Exam</button>
                  <button className="rounded-xl border border-white/5 bg-white/[0.03] py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-white/10 transition-all active:scale-95">Ping All</button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
