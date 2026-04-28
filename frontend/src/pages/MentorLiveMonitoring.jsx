import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Shield, ShieldAlert, ShieldCheck, Activity, Users, 
  AlertTriangle, Clock, RefreshCcw, ChevronLeft, Search,
  Filter, MoreVertical, Ban, CheckCircle2, Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { toast } from 'react-hot-toast';

/* ────────────────────────────────────────── Risk Score Badge ────────────────────────────────────────── */
const RiskBadge = ({ score }) => {
  let color = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  let label = 'Low Risk';
  
  if (score > 60) {
    color = 'bg-red-500/10 text-red-400 border-red-500/20';
    label = 'Critical';
  } else if (score > 30) {
    color = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    label = 'Suspicious';
  }

  return (
    <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${color}`}>
      {label} ({score})
    </div>
  );
};

/* ────────────────────────────────────────── Student Card ────────────────────────────────────────── */
const StudentLiveCard = ({ student, onTerminate }) => {
  const isOnline = student.isOnline;
  const status = student.status;
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative group bg-surface border rounded-[2rem] p-6 transition-all duration-300 ${student.riskScore > 50 ? 'border-red-500/30 bg-red-500/5 shadow-lg shadow-red-500/5' : 'border-main hover:border-primary-500/30 shadow-xl'}`}
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className={`w-14 h-14 rounded-2xl bg-surface-hover border border-main flex items-center justify-center overflow-hidden ${isOnline ? 'ring-2 ring-emerald-500 ring-offset-4 ring-offset-black' : ''}`}>
              {student.student?.image ? (
                <img src={student.student.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <Users size={24} className="text-muted opacity-20" />
              )}
            </div>
            {isOnline && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-black animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-primary truncate max-w-[140px]">{student.student?.name}</h3>
            <p className="text-[10px] font-medium text-muted uppercase tracking-widest">{student.student?.email?.split('@')[0]}</p>
          </div>
        </div>
        <button className="p-2 text-muted hover:text-primary transition-colors">
          <MoreVertical size={18} />
        </button>
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Risk Analysis</span>
          <RiskBadge score={student.riskScore} />
        </div>
        <div className="w-full h-1.5 bg-surface-hover rounded-full overflow-hidden border border-main">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${student.riskScore}%` }}
            className={`h-full rounded-full ${student.riskScore > 60 ? 'bg-red-500' : student.riskScore > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-surface-hover rounded-2xl p-3 border border-main flex flex-col items-center justify-center">
          <span className="text-[9px] font-black text-muted uppercase tracking-[0.1em] mb-1">Violations</span>
          <span className={`text-sm font-bold tabular-nums ${student.violationsCount > 0 ? 'text-red-500' : 'text-primary'}`}>{student.violationsCount}</span>
        </div>
        <div className="bg-surface-hover rounded-2xl p-3 border border-main flex flex-col items-center justify-center">
          <span className="text-[9px] font-black text-muted uppercase tracking-[0.1em] mb-1">Time Left</span>
          <span className="text-sm font-bold tabular-nums text-primary">{Math.floor(student.remainingTime / 60)}m</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <div className={`px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${student.secureClient ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
          {student.secureClient ? <ShieldCheck size={10} /> : <ShieldAlert size={10} />}
          {student.secureClient ? 'Secure Client' : 'Untrusted'}
        </div>
        <div className="px-2 py-0.5 rounded-md border border-main bg-surface-hover text-muted text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5">
          <Monitor size={10} /> {student.resolution || 'N/A'}
        </div>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={() => onTerminate(student.id)}
          className="flex-1 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 transition-all text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <Ban size={14} /> Terminate
        </button>
        <button 
          className="w-10 h-10 rounded-xl bg-surface-hover border border-main flex items-center justify-center text-muted hover:text-primary transition-all"
        >
          <Activity size={16} />
        </button>
      </div>
    </motion.div>
  );
};

/* ────────────────────────────────────────── Main Dashboard ────────────────────────────────────────── */
export default function MentorLiveMonitoring() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({ active: 0, flagged: 0, critical: 0 });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLiveStatus = async () => {
    try {
      const res = await api.get(`/exams/live-monitoring/${examId}`);
      if (res.data.success) {
        setSessions(res.data.data);
        const active = res.data.data.filter(s => s.isOnline).length;
        const flagged = res.data.data.filter(s => s.riskScore > 30 && s.riskScore <= 60).length;
        const critical = res.data.data.filter(s => s.riskScore > 60).length;
        setStats({ active, flagged, critical });
      }
    } catch (err) {
      console.error('Failed to fetch live data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveStatus();
    const interval = setInterval(fetchLiveStatus, 15000); // 15 Seconds Poll
    return () => clearInterval(interval);
  }, [examId]);

  const handleTerminate = async (sessionId) => {
    if (!window.confirm('Are you sure you want to forcibly terminate this student session?')) return;
    try {
      await api.put(`/exams/terminate/${sessionId}`);
      toast.success('Session terminated');
      fetchLiveStatus();
    } catch (err) {
      toast.error('Termination failed');
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.student?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-page p-8">
      {/* ── Header ── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-2xl bg-surface border border-main flex items-center justify-center text-muted hover:text-primary transition-all shadow-lg"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-primary tracking-tighter uppercase italic flex items-center gap-3">
              Live Monitoring <Activity className="text-emerald-500 animate-pulse" />
            </h1>
            <p className="text-sm font-medium text-muted">Real-time proctoring & risk analysis grid</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search student..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-surface border border-main rounded-2xl pl-12 pr-6 py-3.5 text-sm font-medium text-primary focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all w-[260px]"
            />
          </div>
          <button className="w-12 h-12 rounded-2xl bg-surface border border-main flex items-center justify-center text-muted hover:text-primary transition-all">
            <Filter size={18} />
          </button>
        </div>
      </header>

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-surface border border-main rounded-3xl p-6 flex items-center gap-5 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-primary-500/10 text-primary-500 flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted uppercase tracking-[0.15em]">Total Registered</p>
            <p className="text-2xl font-black text-primary tabular-nums">{sessions.length}</p>
          </div>
        </div>
        <div className="bg-surface border border-main rounded-3xl p-6 flex items-center gap-5 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-muted uppercase tracking-[0.15em]">Live Now</p>
            <p className="text-2xl font-black text-primary tabular-nums">{stats.active}</p>
          </div>
        </div>
        <div className="bg-surface border border-main rounded-3xl p-6 flex items-center gap-5 shadow-sm border-amber-500/20 bg-amber-500/5">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-amber-900/60 uppercase tracking-[0.15em]">Suspicious</p>
            <p className="text-2xl font-black text-amber-900 tabular-nums">{stats.flagged}</p>
          </div>
        </div>
        <div className="bg-surface border border-main rounded-3xl p-6 flex items-center gap-5 shadow-sm border-red-500/20 bg-red-500/5">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
            <ShieldAlert size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-red-900/60 uppercase tracking-[0.15em]">Critical Risk</p>
            <p className="text-2xl font-black text-red-900 tabular-nums">{stats.critical}</p>
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="h-[400px] flex flex-col items-center justify-center gap-4">
          <RefreshCcw size={32} className="text-primary-500 animate-spin" />
          <p className="text-xs font-black text-muted uppercase tracking-widest">Synchronizing Live Feed...</p>
        </div>
      ) : filteredSessions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <AnimatePresence>
            {filteredSessions.map((session) => (
              <StudentLiveCard 
                key={session.id} 
                student={session} 
                onTerminate={handleTerminate}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="h-[400px] bg-surface-hover border-2 border-dashed border-main rounded-[3rem] flex flex-col items-center justify-center text-center p-12">
          <div className="w-20 h-20 rounded-3xl bg-surface border border-main flex items-center justify-center text-muted mb-6 shadow-xl">
            <Users size={32} className="opacity-20" />
          </div>
          <h2 className="text-xl font-bold text-primary mb-2">No Active Sessions</h2>
          <p className="text-sm text-muted max-w-[280px]">Once students start the exam via the secure browser, they will appear here in real-time.</p>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="mt-16 flex items-center justify-between px-6 py-4 border-t border-main">
        <p className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2">
          <ShieldCheck size={14} className="text-emerald-500" /> Secure Proctoring Active • Auto-Refresh every 15s
        </p>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-700" />
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Offline</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
