import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Users, ShieldAlert, Settings,
  Search, Bell, Plus, ExternalLink,
  AlertCircle, BarChart3, Monitor,
  Clock, Download, ChevronRight, History,
  X, CheckCircle2, OctagonX, Wifi, Zap,
  UserCheck, TrendingUp, Activity, Shield,
  Eye, RotateCcw, LogOut, UserPlus, Trash2, Loader2
} from 'lucide-react';
import { getStudents, removeStudent, addStudent } from '../services/api';
import VisionLogo from '../components/VisionLogo';
import { ThemeToggle } from '../contexts/ThemeContext';

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Config & Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const NAV_ITEMS = [
  { id: 'Overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
  { id: 'Assessments', label: 'Assessments', icon: <FileText size={18} /> },
  { id: 'Candidates', label: 'Candidates', icon: <Users size={18} /> },
  { id: 'Integrity', label: 'Integrity Log', icon: <ShieldAlert size={18} /> },
  { id: 'Analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
  { id: 'Settings', label: 'System Settings', icon: <Settings size={18} /> },
];

const INITIAL_SESSIONS = [];

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Toast â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const Toast = ({ toasts, removeToast }) => (
  <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
    {toasts.map(t => (
      <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md pointer-events-auto transition-all ${
        t.type === 'error' ? 'bg-red-950/90 border-red-500/30 text-red-300' :
        t.type === 'warn' ? 'bg-amber-950/90 border-amber-500/30 text-amber-300' :
        'bg-zinc-900/90 border-emerald-500/30 text-emerald-300'
      }`}>
        {t.type === 'error' ? <OctagonX size={14} /> : t.type === 'warn' ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
        <span className="text-xs font-semibold">{t.message}</span>
        <button onClick={() => removeToast(t.id)} className="ml-2 opacity-50 hover:opacity-100"><X size={12} /></button>
      </div>
    ))}
  </div>
);

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Terminate Confirm Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const TerminateModal = ({ target, onConfirm, onClose }) => {
  if (!target) return null;
  const isAll = target === 'ALL';
  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150]" onClick={onClose} />
      <div className="fixed inset-0 z-[151] flex items-center justify-center p-8 pointer-events-none">
        <div className="bg-[#13151b] border border-red-500/30 rounded-2xl w-full max-w-md p-8 shadow-2xl pointer-events-auto">
          <div className="w-14 h-14 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 mb-6 mx-auto flex items-center justify-center">
            <OctagonX size={28} />
          </div>
          <h3 className="text-xl font-bold text-white text-center mb-2">
            {isAll ? 'Stop All Exams' : `Terminate Exam`}
          </h3>
          <p className="text-zinc-400 text-sm text-center mb-2">
            {isAll
              ? 'This will force-end ALL active exam sessions immediately.'
              : `This will immediately terminate the exam session for:`}
          </p>
          {!isAll && (
            <div className="bg-[#0f1117] rounded-xl p-4 border border-white/[0.06] mb-6 text-center">
              <p className="text-white font-bold">{target.name}</p>
              <p className="text-zinc-500 text-xs font-mono mt-1">{target.id} Â· {target.exam}</p>
            </div>
          )}
          {isAll && <div className="mb-6" />}
          <p className="text-red-400/70 text-xs text-center mb-6">This action cannot be undone. The student will see a termination notice.</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-sm font-semibold">Cancel</button>
            <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-all text-sm font-bold shadow-lg active:scale-95">
              {isAll ? 'Stop All Exams' : 'Terminate Exam'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Session Row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const SessionRow = ({ session, onTerminate, onView }) => {
  const riskColor = session.risk === 'High' ? 'text-red-500' : session.risk === 'Medium' ? 'text-amber-500' : 'text-emerald-500';
  const riskBg = session.risk === 'High' ? 'bg-red-500' : session.risk === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500';
  const isTerminated = session.status === 'terminated';

  return (
    <tr className={`text-zinc-300 transition-colors hover:bg-white/[0.02] group divide-x divide-white/[0.04] ${isTerminated ? 'opacity-40' : ''}`}>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          {isTerminated ? (
            <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          ) : (
            <div className="relative w-2 h-2 shrink-0">
              <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-40" />
              <div className="w-2 h-2 rounded-full bg-emerald-500 relative" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-[13px] font-semibold text-zinc-100">{session.name}</span>
            <span className="mt-0.5 font-mono text-[10px] text-zinc-600">{session.id}</span>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <span className="text-[12px] font-medium text-zinc-400">{session.exam}</span>
        <div className="mt-1 flex items-center gap-1.5 font-bold uppercase tracking-tight text-[9px] text-zinc-600">
          <Clock size={10} /> {isTerminated ? 'TERMINATED' : session.time}
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
      <td className="px-5 py-3.5 text-right">
        <div className="flex justify-end gap-1.5 transition-opacity">
          {!isTerminated && (
            <>
              <button
                onClick={() => onView(session)}
                style={{ backgroundColor: 'rgba(0,0,0,0.05)', color: '#475569' }}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 hover:bg-zinc-800 hover:text-white border border-transparent hover:border-zinc-700 transition-all text-[10px] font-bold uppercase tracking-wider"
                title="View session"
              >
                <Eye size={12} /> View
              </button>
              <button
                onClick={() => onTerminate(session)}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-red-400 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 transition-all text-[10px] font-bold uppercase tracking-wider"
                title="Terminate exam"
              >
                <OctagonX size={12} /> Terminate
              </button>
            </>
          )}
          {isTerminated && (
            <span className="text-[10px] font-bold text-red-500/60 uppercase tracking-widest border border-red-500/20 px-2.5 py-1.5 rounded-lg">
              Ended
            </span>
          )}
        </div>
      </td>
    </tr>
  );
};

/* ───────────────────────────────────────────────────────── Add Student Modal ───────────────────────────────────────────────────────── */

const AddStudentModal = ({ isOpen, onClose, onSuccess, addToast }) => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addStudent(formData);
      addToast('Student added successfully!', 'success');
      onSuccess();
      onClose();
      setFormData({ name: '', email: '', password: '' });
    } catch (err) {
      addToast(err.message || 'Failed to add student', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[150]" onClick={onClose} />
      <div className="fixed inset-0 z-[151] flex items-center justify-center p-8 pointer-events-none">
        <div className="bg-[#13151b] border border-white/10 rounded-2xl w-full max-w-md p-8 shadow-2xl pointer-events-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Add New Student</h3>
            <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black tracking-widest text-zinc-500 uppercase mb-1.5 ml-1">Full Name</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500/50 transition-colors"
                placeholder="Student Name"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black tracking-widest text-zinc-500 uppercase mb-1.5 ml-1">Email Address</label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500/50 transition-colors"
                placeholder="email@university.edu"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black tracking-widest text-zinc-500 uppercase mb-1.5 ml-1">Temporary Password</label>
              <input
                required
                type="password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500/50 transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              disabled={loading}
              className="w-full mt-4 bg-teal-600 hover:bg-teal-500 text-white py-3 rounded-xl font-bold text-sm tracking-widest uppercase transition-all shadow-lg shadow-teal-900/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              {loading ? 'Processing...' : 'Register Student'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

/* ───────────────────────────────────────────────────────── Incident Item ───────────────────────────────────────────────────────── */

const IncidentItem = ({ incident, onResolve }) => (
  <div className={`cursor-default p-5 transition-colors hover:bg-white/[0.02] group ${incident.resolved ? 'opacity-40' : ''}`}>
    <div className="mb-2 flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-600">
      <span className={incident.severity === 'high' ? 'text-red-400' : 'text-amber-400'}>{incident.type}</span>
      <span className="font-mono text-zinc-700">
        {new Date(incident.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
    <p className="mb-3 leading-relaxed text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">{incident.details}</p>
    <div className="flex items-center justify-between">
      <span className="font-mono text-[9px] tracking-tighter text-zinc-700 bg-white/5 px-1.5 py-0.5 rounded uppercase">
        ID: {incident.id?.split('-').pop() || 'N/A'}
      </span>
      {incident.resolved ? (
        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-1">
          <CheckCircle2 size={10} /> Resolved
        </span>
      ) : (
        <button
          onClick={() => onResolve(incident.id)}
          className="text-[10px] font-bold uppercase tracking-widest text-teal-600 hover:text-teal-500 transition-all active:scale-95"
        >
          Resolve Issue
        </button>
      )}
    </div>
  </div>
);

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Tab Pages â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const AssessmentsTab = ({ exams, addToast }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white uppercase tracking-tight">Published Assessments</h2>
        <span className="text-xs text-zinc-500 font-mono">{exams.length} total</span>
      </div>
      {exams.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-[#0c0c0e] p-16 text-center">
          <FileText size={32} className="text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 text-sm font-semibold uppercase tracking-widest">No exams published yet</p>
          <p className="text-zinc-700 text-xs mt-2">Mentors can create and publish exams from their dashboard.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] bg-[#0c0c0e] overflow-hidden shadow-2xl">
          {exams.map((exam, i) => (
            <div key={exam.id || i} className="p-5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors flex items-center justify-between group">
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-teal-400 transition-colors uppercase tracking-tight">{exam.name || 'Untitled'}</p>
                <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-zinc-500 font-mono">ID: {String(exam.id).slice(-6)}</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-700" />
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{exam.duration} MIN</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-700" />
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{exam.questionsCount || 0} QUESTS</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/exam/${exam.id}`); addToast('Exam link copied!', 'success'); }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-zinc-300 uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all active:scale-95"
                >
                  Get Link
                </button>
                <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Live</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CandidatesTab = ({ students, onDelete, onAddClick }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-bold text-white uppercase tracking-tight">User Management</h2>
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Total Registered Students: {students.length}</p>
      </div>
      <button
        onClick={onAddClick}
        className="flex items-center gap-2 bg-teal-600/10 border border-teal-500/20 text-teal-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-600 hover:text-white transition-all active:scale-95 shadow-lg"
      >
        <UserPlus size={14} /> Add Student
      </button>
    </div>
    
    <div className="rounded-2xl border border-white/[0.06] bg-[#0c0c0e] overflow-hidden shadow-2xl">
      <table className="w-full text-left border-collapse">
        <thead className="border-b border-white/[0.04] bg-white/[0.02]">
          <tr>
            {['Student Name', 'Email Address', 'Account Date', 'Actions'].map(h => (
              <th key={h} className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.02]">
          {students.length === 0 ? (
            <tr>
              <td colSpan="4" className="px-6 py-16 text-center">
                <Users size={32} className="mx-auto text-zinc-800 mb-3" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-700">No students registered in database</p>
              </td>
            </tr>
          ) : (
            students.map((s, i) => (
              <tr key={s._id || i} className="hover:bg-white/[0.01] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800/50 border border-white/5 flex items-center justify-center text-[10px] font-black text-zinc-500">
                      {s.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-zinc-200">{s.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-[11px] text-zinc-500">{s.email}</td>
                <td className="px-6 py-4 text-[11px] text-zinc-600">
                  {new Date(s.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => onDelete(s._id, s.name)}
                    className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Remove Student"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const AnalyticsTab = ({ stats, sessions }) => {
  const metrics = [
    { label: 'Total Exams Published', value: String(stats?.totalExams || 0), trend: 'Live', color: 'text-teal-500' },
    { label: 'Total Submissions', value: String(stats?.totalSubmissions || 0), trend: 'Cumulative', color: 'text-emerald-400' },
    { label: 'Active Sessions', value: String(stats?.activeSessions || 0), trend: 'Real-time', color: 'text-amber-400' },
    { label: 'Violations Logged', value: String(stats?.flags || 0), trend: 'Critical', color: 'text-red-400' },
  ];

  // Calculate risk distribution from live sessions
  const risks = { Low: 0, Medium: 0, High: 0 };
  sessions.forEach(s => { risks[s.risk] = (risks[s.risk] || 0) + 1; });
  const total = sessions.length || 1;
  const riskData = [
    { l: 'Low Risk', v: Math.round((risks.Low / total) * 100), c: 'bg-emerald-500' },
    { l: 'Medium Risk', v: Math.round((risks.Medium / total) * 100), c: 'bg-amber-500' },
    { l: 'High Risk', v: Math.round((risks.High / total) * 100), c: 'bg-red-500' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-white">Platform Analytics</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <div key={i} className="bg-[#181a20] rounded-2xl p-5 border border-white/[0.06]">
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-3">{m.label}</p>
            <p className="text-3xl font-bold text-white">{m.value}</p>
            <p className={`text-xs mt-1 font-bold ${m.color}`}>{m.trend}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#181a20] rounded-2xl p-6 border border-white/[0.06]">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Risk Distribution</p>
          <div className="space-y-3">
            {riskData.map((r, j) => (
              <div key={j}>
                <div className="flex justify-between text-xs mb-1"><span className="text-zinc-400">{r.l}</span><span className="text-zinc-300 font-bold">{r.v}%</span></div>
                <div className="h-1.5 bg-zinc-800 rounded-full"><div className={`h-full rounded-full ${r.c}`} style={{ width: `${r.v}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#181a20] rounded-2xl p-6 border border-white/[0.06] flex items-center justify-center opacity-40">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Integrity Matrix Live</p>
        </div>
      </div>
    </div>
  );
};

const SettingItem = ({ label, desc, initialEnabled, onToggle }) => {
  const [enabled, setEnabled] = useState(initialEnabled);
  return (
    <div className="flex items-center justify-between p-5 rounded-2xl bg-[#181a20] border border-white/[0.06] hover:border-white/10 transition-colors">
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
      </div>
      <button
        onClick={() => { 
          const newState = !enabled;
          setEnabled(newState); 
          onToggle(label, newState);
        }}
        className={`relative w-12 h-6 rounded-full transition-all duration-300 ${enabled ? 'bg-teal-600 shadow-lg shadow-teal-900/20' : 'bg-zinc-700'}`}
      >
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-xl transition-all duration-300 ${enabled ? 'translate-x-7' : 'translate-x-1'}`} />
      </button>
    </div>
  );
};

const SettingsTab = ({ addToast }) => {
  const settings = [
    { label: 'AI Proctoring', desc: 'Real-time face detection and behavior analysis', enabled: true },
    { label: 'Tab Switch Detection', desc: 'Flag students who switch browser tabs', enabled: true },
    { label: 'Audio Monitoring', desc: 'Monitor ambient noise during exams', enabled: false },
    { label: 'Geofencing', desc: 'Restrict access by geographic location', enabled: false },
  ];

  const handleToggle = (label, state) => {
    addToast(`${label} ${state ? 'enabled' : 'disabled'}`, 'success');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-white uppercase tracking-tight">System Settings</h2>
      <div className="space-y-3">
        {settings.map((setting, i) => (
          <SettingItem 
            key={i} 
            label={setting.label} 
            desc={setting.desc} 
            initialEnabled={setting.enabled} 
            onToggle={handleToggle}
          />
        ))}
      </div>
      <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/10 mt-8">
        <p className="text-xs font-black text-red-500 uppercase tracking-[0.2em] mb-2">Danger Zone</p>
        <p className="text-[11px] text-zinc-500 mb-4 font-medium">Resetting localized data will sign you out and clear pending session flags.</p>
        <button 
          onClick={() => { localStorage.clear(); addToast('System cache cleared', 'warn'); setTimeout(() => window.location.reload(), 1000); }} 
          className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all active:scale-95 shadow-lg shadow-red-900/10"
        >
          Clear Persistence Layer
        </button>
      </div>
    </div>
  );
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setTab] = useState('Overview');
  const [sessions, setSessions] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [statsData, setStatsData] = useState(null);
  const [examList, setExamList] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [terminateTarget, setTerminateTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  };

  const removeToast = (id) => setToasts(p => p.filter(t => t.id !== id));

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const fetchData = async () => {
      try {
        const response = await api.get('/api/exams/admin-stats');
        const { stats, sessions, examList, incidents } = response.data;
        setStatsData(stats);
        setSessions(sessions || []);
        setExamList(examList || []);
        setIncidents(incidents || []);
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
      }
    };

    const fetchAllStudents = async () => {
      try {
        const data = await getStudents();
        setAllStudents(data || []);
      } catch (err) {
        console.error('Failed to fetch students:', err);
      }
    };
    
    fetchData();
    fetchAllStudents();
    const pollInterval = setInterval(fetchData, 15000); // Poll every 15s

    return () => { 
      document.body.style.overflow = 'auto'; 
      clearInterval(pollInterval);
    };
  }, []);

  const handleDeleteStudent = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove ${name}? This cannot be undone.`)) {
      try {
        await removeStudent(id);
        addToast(`${name} removed successfully`, 'success');
        setAllStudents(prev => prev.filter(s => s._id !== id));
      } catch (err) {
        addToast(err.message || 'Failed to remove student', 'error');
      }
    }
  };

  /* â”€â”€ Termination Logic â”€â”€ */
  const terminateSession = (session) => {
    // Persist termination flag so ExamCockpit can detect it
    const existing = JSON.parse(localStorage.getItem('vision_terminated_sessions') || '[]');
    const entry = {
      studentId: session.id,
      examId: session.examId || session.id,
      reason: 'Terminated by Admin',
      terminatedBy: 'admin',
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('vision_terminated_sessions', JSON.stringify([entry, ...existing]));

    setSessions(prev => prev.map(s => s.id === session.id ? { ...s, status: 'terminated' } : s));

    const incident = {
      id: `INC-${Date.now()}`,
      type: 'Admin Termination',
      severity: 'high',
      details: `Exam session for ${session.name} (${session.id}) was force-terminated by admin.`,
      timestamp: new Date().toISOString(),
    };
    setIncidents(prev => [incident, ...prev]);
    addToast(`Exam terminated for ${session.name}`, 'error');
    setTerminateTarget(null);
  };

  const terminateAll = () => {
    const existing = JSON.parse(localStorage.getItem('vision_terminated_sessions') || '[]');
    const newEntries = sessions
      .filter(s => s.status === 'active')
      .map(s => ({
        studentId: s.id,
        examId: s.examId || s.id,
        reason: 'All exams stopped by Admin',
        terminatedBy: 'admin',
        timestamp: new Date().toISOString(),
      }));
    localStorage.setItem('vision_terminated_sessions', JSON.stringify([...newEntries, ...existing]));

    setSessions(prev => prev.map(s => ({ ...s, status: 'terminated' })));
    addToast('All active exams have been terminated', 'error');
    setTerminateTarget(null);
  };

  const resolveIncident = (id) => {
    setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, resolved: true } : inc));
    addToast('Incident marked as resolved', 'success');
  };

  /* â”€â”€ Export â”€â”€ */
  const handleExport = () => {
    const data = sessions.map(s => `${s.id},${s.name},${s.exam},${s.risk},${s.score},${s.status}`);
    const csv = ['ID,Name,Exam,Risk,Score,Status', ...data].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'vision_sessions.csv'; a.click();
    addToast('Session data exported as CSV', 'success');
  };

  const handlePingAll = () => {
    setSessions(prev =>
      prev.map(s => s.status === 'active' ? { ...s, pinged: true } : s)
    );
    addToast('Ping sent to all active sessions', 'success');
    setTimeout(() => setSessions(prev => prev.map(s => ({ ...s, pinged: false }))), 2000);
  };

  const handleViewSession = (session) => {
    const params = new URLSearchParams({
      id: session.id,
      name: session.name,
      exam: session.exam,
      risk: session.risk,
      score: String(session.score),
      time: session.time,
    });
    navigate(`/admin/session?${params.toString()}`);
  };

  const activeSessions = sessions.filter(s => s.status === 'active');
  const criticalIssues = incidents.filter(i => i.severity === 'high' && !i.resolved).length;
  const stats = [
    { label: 'Active Exams', value: String(statsData?.totalExams || 0), tag: 'LIVE', color: 'text-teal-600' },
    { label: 'Reported Alerts', value: String(statsData?.flags || 0), tag: 'URGENT', color: 'text-red-500' },
    { label: 'Integrity Score', value: statsData ? String(Math.max(0, 100 - (statsData.flags * 5))) : '100', tag: 'NOMINAL', color: 'text-emerald-500' },
  ];

  const filteredSessions = searchQuery
    ? sessions.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.exam.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sessions;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Assessments': return <AssessmentsTab exams={examList} addToast={addToast} />;
      case 'Candidates': 
        return (
          <CandidatesTab 
            students={allStudents} 
            onDelete={handleDeleteStudent} 
            onAddClick={() => setShowAddModal(true)}
          />
        );
      case 'Analytics': return <AnalyticsTab stats={statsData} sessions={sessions} />;
      case 'Settings': return <SettingsTab addToast={addToast} />;
      case 'Integrity':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Integrity Log</h2>
              <span className="text-xs text-zinc-500">{incidents.filter(i => !i.resolved).length} unresolved</span>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-[#181a20]/50 divide-y divide-white/[0.04] shadow-2xl overflow-y-auto max-h-[60vh]">
              {incidents.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center p-6 text-center opacity-40">
                  <ShieldAlert className="mb-3 text-zinc-800" size={28} />
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-700">Threat Matrix Passive</p>
                </div>
              ) : incidents.map((inc, i) => (
                <IncidentItem key={i} incident={inc} onResolve={resolveIncident} />
              ))}
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white uppercase">Admin Dashboard</h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-[#1a1d26] px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-zinc-300 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.12] transition-all active:scale-95"
                >
                  <Download size={14} /> Export CSV
                </button>
                <button
                  onClick={() => navigate('/mentor/create-exam')}
                  className="flex items-center gap-2 rounded-xl bg-white px-6 py-2 text-[11px] font-bold uppercase tracking-widest text-[#0f1117] shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_28px_rgba(255,255,255,0.2)] hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Plus size={16} /> Create Exam
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {stats.map((s, i) => (
                <div key={i} className="bg-[#181a20] rounded-2xl p-5 border border-white/[0.06] hover:border-white/[0.15] hover:bg-[#151a25] transition-colors duration-300">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2 h-2 rounded-full ${s.color.replace('text-', 'bg-')}`} />
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{s.label}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-bold text-white tracking-tight">{s.value}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/5 border border-white/10 ${s.color}`}>{s.tag}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-12 gap-6">
              <section className="col-span-8 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-600">
                    <Monitor className="text-teal-600" size={14} /> Active Sessions
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-teal-600/10 border border-teal-600/20 text-teal-500 text-[9px]">{activeSessions.length} live</span>
                  </h2>
                  {activeSessions.length > 0 && (
                    <button
                      onClick={() => setTerminateTarget('ALL')}
                      className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 rounded-lg px-3 py-1.5 hover:bg-red-500/5 transition-all active:scale-95"
                    >
                      <OctagonX size={11} /> Stop All Exams
                    </button>
                  )}
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={13} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by name, ID, or exam..."
                    className="w-full rounded-xl border border-white/5 bg-[#181a20] py-2 pl-9 pr-3 text-[12px] text-white transition-all placeholder:text-zinc-700 focus:border-white/10 outline-none"
                  />
                </div>

                <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0c0c0e] shadow-2xl">
                  <table className="w-full text-left">
                    <thead className="border-b border-white/[0.04] bg-white/[0.01]">
                      <tr>
                        <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-widest text-zinc-600">Student</th>
                        <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-widest text-zinc-600">Exam</th>
                        <th className="px-5 py-4 text-center text-[9px] font-bold uppercase tracking-widest text-zinc-600">Risk</th>
                        <th className="px-5 py-4 text-right text-[9px] font-bold uppercase tracking-widest text-zinc-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02]">
                      {filteredSessions.map((s, i) => (
                        <SessionRow
                          key={i}
                          session={s}
                          onTerminate={s => setTerminateTarget(s)}
                          onView={handleViewSession}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <aside className="col-span-4 flex flex-col gap-4">
                <h2 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-600">
                  <History className="text-amber-500" size={14} /> Security Logs
                </h2>
                <div className="max-h-[300px] overflow-y-auto rounded-2xl border border-white/[0.06] bg-[#181a20]/50 divide-y divide-white/[0.04] shadow-2xl">
                  {incidents.length > 0 ? incidents.slice(0, 6).map((inc, i) => (
                    <IncidentItem key={i} incident={inc} onResolve={resolveIncident} />
                  )) : (
                    <div className="flex h-36 flex-col items-center justify-center p-6 text-center opacity-40">
                      <ShieldAlert className="mb-3 text-zinc-800" size={24} />
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-700">Threat Matrix Passive</p>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-[#181a20] p-6 shadow-inner relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-red-500/10 transition-colors" />
                  <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600 relative z-10">Quick Actions</p>
                  <div className="grid grid-cols-2 gap-3 relative z-10">
                    <button
                      onClick={() => setTerminateTarget('ALL')}
                      style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#dc2626' }}
                      className="rounded-xl border border-red-500/40 py-3 text-[10px] font-extrabold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95"
                    >
                      Stop All
                    </button>
                    <button
                      onClick={handlePingAll}
                      style={{ backgroundColor: 'rgba(113, 113, 122, 0.1)', color: '#475569' }}
                      className="rounded-xl border border-zinc-500/30 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-700 hover:text-white transition-all active:scale-95"
                    >
                      Ping All
                    </button>
                    <button
                      onClick={handleExport}
                      style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#4f46e5' }}
                      className="rounded-xl border border-teal-600/40 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-teal-600 hover:text-white transition-all active:scale-95"
                    >
                      Export
                    </button>
                    <button
                      onClick={() => { setTab('Analytics'); }}
                      style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#047857' }}
                      className="rounded-xl border border-emerald-500/40 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all active:scale-95"
                    >
                      Analytics
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0f1117] font-sans text-zinc-200 select-none">
      {/* Sidebar */}
      <aside className="z-50 flex w-64 shrink-0 flex-col border-r border-white/5 bg-[#0c0c0e] shadow-2xl">
        <div className="flex h-14 items-center gap-2 border-b border-white/5 px-5">
          <VisionLogo className="h-[18px] w-[18px] text-white" />
          <span className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-100">VISION <span className="text-zinc-500">ADMIN</span></span>
        </div>

        <nav className="flex-1 space-y-0.5 p-4 overflow-y-auto">
          <p className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-2">Main Menu</p>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all ${activeTab === item.id ? 'bg-white/5 text-white shadow-sm' : 'text-zinc-500 hover:bg-white/[0.02] hover:text-zinc-300'}`}
            >
              <span className={activeTab === item.id ? 'text-teal-600' : 'text-zinc-700 transition-colors group-hover:text-zinc-500'}>{item.icon}</span>
              {item.label}
              {item.id === 'Integrity' && criticalIssues > 0 && (
                <span className="ml-auto px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-black">{criticalIssues}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="border-t border-zinc-800 bg-black/40 p-4">
          <div className="mb-2 flex items-center gap-3">
            <div className="relative w-2 h-2">
              <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-30" />
              <div className="relative h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-500">System Online</span>
          </div>
          <p className="text-[9px] font-medium text-zinc-600 tracking-widest uppercase mb-3">Region: primary-node</p>
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-2 justify-center rounded-lg border border-white/5 bg-white/[0.02] py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:text-white hover:bg-white/[0.05] transition-all active:scale-95"
          >
            <LogOut size={12} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b border-white/5 bg-[#0f1117]/80 px-8 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
            {/* Breadcrumbs removed */}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700 transition-all group-focus-within:text-blue-500" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search sessions..."
                className="w-64 rounded-xl border border-white/5 bg-[#181a20] py-2 pl-9 pr-3 text-[12px] text-white transition-all placeholder:text-zinc-700 focus:border-white/10 outline-none"
              />
            </div>
            <div className="h-6 w-px bg-white/5" />
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="relative">
                <button
                  onClick={() => { setShowNotifs(!showNotifs); setNotifCount(0); }}
                  className="rounded-xl p-2 text-zinc-500 hover:bg-white/5 hover:text-white transition-all relative"
                >
                  <Bell size={18} />
                  {notifCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-black text-white flex items-center justify-center">{notifCount}</span>
                  )}
                </button>
                {showNotifs && (
                  <div className="absolute right-0 top-10 w-80 bg-[#181a20] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                      <span className="text-xs font-bold text-white uppercase tracking-widest">Notifications</span>
                      <button onClick={() => setShowNotifs(false)}><X size={14} className="text-zinc-500" /></button>
                    </div>
                    {[].map((n, i) => (
                      <div key={i} className="px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer">
                        <p className={`text-xs font-medium ${n.color}`}>{n.msg}</p>
                        <p className="text-[10px] text-zinc-600 mt-0.5">{n.t}</p>
                      </div>
                    ))}
                    <div className="p-4 text-center text-[10px] text-zinc-600 uppercase tracking-widest">No new notifications</div>
                  </div>
                )}
              </div>
              {/* Avatar removed */}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {renderTabContent()}
        </div>
      </main>

      {/* Terminate Modal */}
      <TerminateModal
        target={terminateTarget}
        onClose={() => setTerminateTarget(null)}
        onConfirm={() => {
          if (terminateTarget === 'ALL') terminateAll();
          else terminateSession(terminateTarget);
        }}
      />

      <Toast toasts={toasts} removeToast={removeToast} />

      <AddStudentModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          // Re-fetch students list to show the new one
          getStudents().then(data => setAllStudents(data || []));
        }}
        addToast={addToast}
      />
    </div>
  );
}

