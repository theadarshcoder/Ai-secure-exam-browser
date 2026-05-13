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
    <div className={`px-2 py-0.5 rounded-md border text-[9px] font-semibold uppercase tracking-wider ${color}`}>
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
      className={`relative group bg-surface border rounded-2xl p-5 transition-all duration-300 ${student.riskScore > 50 ? 'border-red-500/30 bg-red-500/5 shadow-lg shadow-red-500/5' : 'border-main hover:border-primary-500/30 shadow-md'}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-11 h-11 rounded-xl bg-surface-hover border border-main flex items-center justify-center overflow-hidden ${isOnline ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-black' : ''}`}>
              {student.student?.image ? (
                <img src={student.student.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <Users size={24} className="text-muted opacity-20" />
              )}
            </div>
            {isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-black animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-primary truncate max-w-[140px]">{student.student?.name}</h3>
            <p className="text-[10px] font-medium text-muted uppercase tracking-wider">{student.student?.email?.split('@')[0]}</p>
          </div>
        </div>
        <button className="p-2 text-muted hover:text-primary transition-colors">
          <MoreVertical size={18} />
        </button>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">Risk Analysis</span>
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

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-surface-hover rounded-xl p-2.5 border border-main flex flex-col items-center justify-center">
          <span className="text-[9px] font-semibold text-muted uppercase tracking-wider mb-0.5">Violations</span>
          <span className={`text-[13px] font-semibold tabular-nums ${student.violationsCount > 0 ? 'text-red-500' : 'text-primary'}`}>{student.violationsCount}</span>
        </div>
        <div className="bg-surface-hover rounded-xl p-2.5 border border-main flex flex-col items-center justify-center">
          <span className="text-[9px] font-semibold text-muted uppercase tracking-wider mb-0.5">Time Left</span>
          <span className="text-[13px] font-semibold tabular-nums text-primary">{Math.floor(student.remainingTime / 60)}m</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className={`px-2 py-0.5 rounded-md border text-[9px] font-semibold uppercase tracking-wider flex items-center gap-1 ${student.secureClient ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
          {student.secureClient ? <ShieldCheck size={10} /> : <ShieldAlert size={10} />}
          {student.secureClient ? 'Secure Client' : 'Untrusted'}
        </div>
        <div className="px-2 py-0.5 rounded-md border border-main bg-surface-hover text-muted text-[9px] font-semibold uppercase tracking-wider flex items-center gap-1">
          <Monitor size={10} /> {student.resolution || 'N/A'}
        </div>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={() => onTerminate(student.id)}
          className="flex-1 py-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 transition-all text-[10px] font-semibold uppercase tracking-wider flex items-center justify-center gap-2"
        >
          <Ban size={14} /> Terminate
        </button>
        <button 
          className="w-9 h-9 rounded-xl bg-surface-hover border border-main flex items-center justify-center text-muted hover:text-primary transition-all"
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
    <div className="min-h-screen bg-page p-6">
      {/* ── Header ── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 flex items-center justify-center text-muted hover:text-primary transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-primary tracking-tight flex items-center gap-2" style={{ fontFamily: "'Inter', sans-serif" }}>
              Live Monitoring <Activity size={20} className="text-emerald-500 animate-pulse" />
            </h1>
            <p className="text-[11px] font-medium text-muted tracking-wide">Real-time proctoring & risk analysis grid</p>
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
              className="bg-surface border border-main rounded-xl pl-10 pr-4 py-2.5 text-[12px] font-medium text-primary focus:outline-none focus:border-primary-500 transition-all w-[240px] placeholder:text-muted/40"
            />
          </div>
          <button className="w-10 h-10 rounded-xl bg-surface border border-main flex items-center justify-center text-muted hover:text-primary transition-all">
            <Filter size={16} />
          </button>
        </div>
      </header>

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="bg-surface border border-main rounded-xl p-4 flex items-center gap-3">
          <Users size={18} className="text-primary-500 shrink-0" />
          <div>
            <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">Total Registered</p>
            <p className="text-lg font-semibold text-primary tabular-nums">{sessions.length}</p>
          </div>
        </div>
        <div className="bg-surface border border-main rounded-xl p-4 flex items-center gap-3">
          <Activity size={18} className="text-emerald-500 shrink-0" />
          <div>
            <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">Live Now</p>
            <p className="text-lg font-semibold text-primary tabular-nums">{stats.active}</p>
          </div>
        </div>
        <div className="bg-surface border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-amber-500 shrink-0" />
          <div>
            <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider">Suspicious</p>
            <p className="text-lg font-semibold text-amber-500 tabular-nums">{stats.flagged}</p>
          </div>
        </div>
        <div className="bg-surface border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
          <ShieldAlert size={18} className="text-red-500 shrink-0" />
          <div>
            <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wider">Critical Risk</p>
            <p className="text-lg font-semibold text-red-500 tabular-nums">{stats.critical}</p>
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="h-[400px] flex flex-col items-center justify-center gap-4">
          <RefreshCcw size={32} className="text-primary-500 animate-spin" />
          <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">Synchronizing Live Feed...</p>
        </div>
      ) : filteredSessions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
        <div className="h-[300px] border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center">
          <Users size={28} className="text-muted/20 mb-3" />
          <h2 className="text-[13px] font-semibold text-primary mb-1">No Active Sessions</h2>
          <p className="text-[11px] text-muted/60 max-w-[240px]">Once students start the exam via the secure browser, they will appear here in real-time.</p>
        </div>
      )}


    </div>
  );
}
