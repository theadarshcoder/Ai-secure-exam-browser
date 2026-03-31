import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Navbar } from '../components/Navbar';
import { 
  PlayCircle, BookOpen, ShieldCheck, 
  ArrowRight, Clock, CheckCircle2, Lock, ListChecks, Calendar,
  Activity, Fingerprint, LifeBuoy
} from 'lucide-react';

/* ─────────────── Config ─────────────── */

/* ─────────────── Sub-components ─────────────── */

const Sidebar = ({ currentTime }) => (
  <aside className="h-full flex flex-col min-w-[260px] lg:max-w-xs shrink-0 relative z-10">
    <div className="flex-1 flex flex-col bg-[#0c0e14] rounded-[24px] border border-white/[0.04] p-6 lg:p-7 shadow-2xl relative overflow-hidden group">
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />

      <div className="flex items-center gap-2 mb-8 relative z-10">
        <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute animate-ping" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 relative" />
        </div>
        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Active Sandbox</span>
      </div>

      <div className="flex items-center gap-4 mb-8 relative z-10 text-center">
        <div className="w-[46px] h-[46px] rounded-[14px] bg-gradient-to-tr from-indigo-500 to-indigo-400 p-[1px] shrink-0 shadow-lg">
          <div className="w-full h-full bg-[#12141a] rounded-[13px] flex items-center justify-center text-white font-black text-lg tracking-wider">AM</div>
        </div>
        <div>
          <h2 className="text-xl font-black text-white tracking-tight leading-none mb-1.5 text-left">Adarsh Maurya</h2>
          <p className="text-[10px] text-slate-500 font-mono font-black tracking-[0.15em] uppercase text-left">ID: VSN-89241</p>
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 pb-1 border-b border-white/[0.02]">Telemetry</div>
        {[
          { icon: <ShieldCheck size={14} className="text-emerald-500" />, label: 'Integrity', status: 'Verified', statusColor: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { icon: <Clock size={14} className="text-indigo-400" />, label: 'Sync Time', status: currentTime, statusColor: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          { icon: <Fingerprint size={14} className="text-amber-500" />, label: 'Biometrics', status: 'Mapped', statusColor: 'text-amber-500', bg: 'bg-amber-500/10' },
        ].map((v, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {v.icon}
              <span className="text-xs font-bold text-slate-400 uppercase">{v.label}</span>
            </div>
            <span className={`text-[9px] font-black ${v.statusColor} uppercase tracking-widest ${v.bg} px-2 py-0.5 rounded border border-white/5`}>{v.status}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col justify-end pt-6 relative z-10">
        <div className="bg-indigo-500/5 rounded-2xl p-4 border border-indigo-500/10 relative overflow-hidden">
          <div className="flex items-start gap-3 relative z-10">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0 text-indigo-400 shadow-lg"><ShieldCheck size={14} /></div>
            <div>
              <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Zero-Trust Active</h4>
              <p className="text-[9px] text-slate-500 leading-relaxed font-semibold">Local OS telemetry hooked. Environment isolated.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-white/[0.04] relative z-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-sm font-black text-white tracking-tight mb-1 uppercase">Support</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Vision Secure Node</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 shadow-inner"><LifeBuoy size={16} /></div>
        </div>
        <button className="w-full bg-white text-[#0a0c10] hover:bg-slate-200 text-[10px] font-black uppercase tracking-widest h-12 rounded-xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2">Initialize Channel <ArrowRight size={14} /></button>
      </div>
    </div>
  </aside>
);

const ExamCard = ({ exam, now, onLaunch }) => {
  const startTime = new Date(exam.startTime);
  const unlockTime = new Date(startTime.getTime() - 15 * 60000);
  const isLive = now >= startTime;
  const isPreOnboarding = now >= unlockTime && now < startTime;
  const canLaunch = now >= unlockTime;

  return (
    <div className={`bg-[#12161f] p-5 lg:p-6 rounded-3xl border transition-all duration-300 flex flex-col xl:flex-row xl:items-center justify-between gap-4 ${canLaunch ? 'border-emerald-900/30 hover:bg-[#151a25] shadow-lg' : 'border-white/[0.03] opacity-60'}`}>
      <div className="flex gap-4 items-start">
        <div className={`w-12 h-12 rounded-2xl bg-[#0a0c10] flex items-center justify-center border border-white/[0.05] shadow-inner ${canLaunch ? 'text-emerald-400' : 'text-slate-600'}`}>
          <BookOpen size={20} />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {isLive ? (
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Live Now</span>
            ) : isPreOnboarding ? (
              <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" /> Final Checks</span>
            ) : (
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-amber-500" /> Standby</span>
            )}
            <span className="text-[9px] text-slate-600 font-black tracking-widest uppercase">NODE: {exam.id}</span>
          </div>
          <h3 className="font-black text-lg text-white mb-2 tracking-tight uppercase leading-tight">{exam.title}</h3>
          <div className="flex flex-wrap items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <span className="flex items-center gap-1.5 text-indigo-400"><Calendar size={12}/> {startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
            <span className="flex items-center gap-1.5"><Clock size={12}/> {exam.duration} MINS</span>
            <span className="flex items-center gap-1.5"><ListChecks size={12}/> {exam.questionsCount} MSQ</span>
          </div>
        </div>
      </div>
      <button 
        disabled={!canLaunch} 
        onClick={() => onLaunch(exam.id)} 
        className={`shrink-0 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${canLaunch ? 'bg-white text-[#0a0c10] hover:bg-slate-200 shadow-xl active:scale-95' : 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5'}`}
      >
        {canLaunch ? 'Launch Sequence' : 'Locked'} {canLaunch ? <ArrowRight size={14} className="inline ml-1" /> : <Clock size={12} className="inline ml-1" />}
      </button>
    </div>
  );
};

/* ─────────────── Main Page ─────────────── */

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [exams, setExams] = useState([]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const timer = setInterval(() => setNow(new Date()), 1000);

    // Fetch real exams from backend
    const fetchExams = async () => {
      try {
        const response = await api.get('/api/exams/active');
        const data = response.data;
        if (Array.isArray(data) && data.length > 0) {
          setExams(data.map(e => ({
            id: e.id,
            title: e.title,
            duration: e.duration,
            questionsCount: e.questionsCount,
            startTime: e.startTime || new Date().toISOString(),
            category: e.category
          })));
        } else {
          setExams([]);
        }
      } catch (err) {
        console.warn('Backend unavailable, using fallback exams:', err.message);
        setExams([]);
      }
    };
    fetchExams();

    return () => {
      document.body.style.overflow = 'auto';
      clearInterval(timer);
    };
  }, []);

  const currentTime = now.toLocaleTimeString('en-GB', { hour12: false });

  return (
    <div className="h-screen w-full bg-[#0a0c10] font-sans flex flex-col overflow-hidden text-slate-200">
      <Navbar role="Student" />
      <style>{`html, body { overflow: hidden !important; height: 100% !important; overscroll-behavior: none !important; }`}</style>

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 pt-24 pb-8 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 overflow-hidden">
        <Sidebar currentTime={currentTime} />

        <section className="bg-[#0b0f19] rounded-[40px] p-6 lg:p-10 border border-slate-800/60 shadow-2xl flex flex-col h-full overflow-hidden relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8 shrink-0 border-b border-white/[0.04] pb-6">
             <div>
               <h1 className="text-2xl font-black text-white tracking-tight uppercase">Your Assignments</h1>
               <p className="text-[11px] text-slate-500 font-bold mt-1">Select an exam below to initiate the secure Vision environment.</p>
             </div>
             <div className="hidden sm:flex w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl items-center justify-center shadow-lg"><PlayCircle size={24} /></div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
             {exams.length > 0 ? (
                exams.map(exam => (
                  <ExamCard 
                    key={exam.id} 
                    exam={exam} 
                    now={now} 
                    onLaunch={(id) => navigate(`/exam/${id}/verify`)} 
                  />
                ))
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-center opacity-40">
                   <CheckCircle2 size={48} className="text-zinc-800 mb-4" />
                   <h3 className="text-sm font-black text-white uppercase tracking-widest">Protocol Nominal</h3>
                   <p className="text-[10px] text-slate-600 mt-1 uppercase font-bold tracking-tighter">No pending operations detected.</p>
                </div>
              )}
          </div>
        </section>
      </main>
    </div>
  );
}
