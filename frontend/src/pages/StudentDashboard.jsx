import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import api from '../services/api';
import { 
  PlayCircle, BookOpen, ShieldCheck, 
  ArrowRight, Clock, CheckCircle2, Lock, ListChecks, Calendar,
  Activity, Fingerprint, LifeBuoy, AlertTriangle
} from 'lucide-react';

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Mock Data (Fallback jab backend down ho) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const MOCK_EXAMS = [
  { id: 'EXM-CS101', title: 'Computer Science 101 - Final', duration: 90, questionsCount: 50, startTime: new Date(Date.now() + 60000).toISOString() },
  { id: 'EXM-DSA', title: 'Data Structures & Algorithms', duration: 120, questionsCount: 40, startTime: new Date(Date.now() - 1800000).toISOString() },
  { id: 'EXM-OS', title: 'Operating Systems Midterm', duration: 60, questionsCount: 30, startTime: new Date(Date.now() + 300000).toISOString() },
  { id: 'EXM-DBMS', title: 'Database Management Systems', duration: 45, questionsCount: 20, startTime: new Date(Date.now() + 86400000).toISOString() },
  { id: 'EXM-SE', title: 'Software Engineering Fundamentals', duration: 90, questionsCount: 50, startTime: new Date(Date.now() - 60000).toISOString() },
  { id: 'EXM-NW', title: 'Computer Networks Assessment', duration: 60, questionsCount: 25, startTime: new Date(Date.now() + 7200000).toISOString() },
  { id: 'EXM-AI', title: 'Artificial Intelligence Basics', duration: 180, questionsCount: 60, startTime: new Date(Date.now() + 172800000).toISOString() },
  { id: 'EXM-ML', title: 'Machine Learning Core Exam', duration: 120, questionsCount: 40, startTime: new Date(Date.now() + 259200000).toISOString() },
];

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const Sidebar = ({ currentTime, userName, userEmail, onSupport }) => (
  <aside className="h-full flex flex-col min-w-[260px] lg:max-w-xs shrink-0 relative z-10">
    <div className="flex-1 flex flex-col bg-[#0c0e14] rounded-[24px] border border-white/[0.04] p-6 lg:p-7 shadow-2xl relative overflow-hidden group">
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-teal-600/10 blur-[80px] rounded-full pointer-events-none" />

      <div className="flex items-center gap-2 mb-8 relative z-10">
        <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute animate-ping" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 relative" />
        </div>
        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Active Sandbox</span>
      </div>

      <div className="flex items-center gap-4 mb-8 relative z-10 text-center">
        <div className="w-[46px] h-[46px] rounded-[14px] bg-gradient-to-tr from-teal-600 to-teal-500 p-[1px] shrink-0 shadow-lg">
          <div className="w-full h-full bg-[#12141a] rounded-[13px] flex items-center justify-center text-white font-black text-lg tracking-wider">
            {userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'VS'}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-black text-white tracking-tight leading-none mb-1.5 text-left">{userName || 'Vision Student'}</h2>
          <p className="text-[10px] text-slate-500 font-mono font-black tracking-[0.15em] uppercase text-left">{userEmail || 'ID: VSN-00000'}</p>
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 pb-1 border-b border-white/[0.02]">Telemetry</div>
        {[
          { icon: <ShieldCheck size={14} className="text-emerald-500" />, label: 'Integrity', status: 'Verified', statusColor: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { icon: <Clock size={14} className="text-teal-400" />, label: 'Sync Time', status: currentTime, statusColor: 'text-teal-400', bg: 'bg-teal-600/10' },
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
        <div className="bg-teal-600/5 rounded-2xl p-4 border border-teal-600/10 relative overflow-hidden">
          <div className="flex items-start gap-3 relative z-10">
            <div className="w-8 h-8 rounded-lg bg-teal-600/10 flex items-center justify-center border border-teal-600/20 shrink-0 text-teal-400 shadow-lg"><ShieldCheck size={14} /></div>
            <div>
              <h4 className="text-[10px] font-black text-teal-300 uppercase tracking-widest mb-1">Zero-Trust Active</h4>
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
        <button onClick={onSupport} className="w-full bg-white text-[#0a0c10] hover:bg-slate-200 text-[10px] font-black uppercase tracking-widest h-12 rounded-xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2">Initialize Channel <ArrowRight size={14} /></button>
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
  const isSubmitted = exam.alreadySubmitted;

  return (
    <div className={`bg-[#12161f] p-5 lg:p-6 rounded-3xl border transition-all duration-300 flex flex-col xl:flex-row xl:items-center justify-between gap-4 ${isSubmitted ? 'border-slate-800/30 opacity-50' : canLaunch ? 'border-emerald-900/30 hover:bg-[#151a25] shadow-lg' : 'border-white/[0.03] opacity-60'}`}>
      <div className="flex gap-4 items-start">
        <div className={`w-12 h-12 rounded-2xl bg-[#0a0c10] flex items-center justify-center border border-white/[0.05] shadow-inner ${isSubmitted ? 'text-slate-600' : canLaunch ? 'text-emerald-400' : 'text-slate-600'}`}>
          <BookOpen size={20} />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {isSubmitted ? (
              <span className="bg-slate-500/10 text-slate-400 border border-slate-500/20 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5"><CheckCircle2 size={8} /> Submitted</span>
            ) : isLive ? (
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
            <span className="flex items-center gap-1.5 text-teal-400"><Calendar size={12}/> {startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
            <span className="flex items-center gap-1.5"><Clock size={12}/> {exam.duration} MINS</span>
            <span className="flex items-center gap-1.5"><ListChecks size={12}/> {exam.questionsCount} MSQ</span>
          </div>
        </div>
      </div>
      <button 
        disabled={!canLaunch || isSubmitted} 
        onClick={() => onLaunch(exam.id)} 
        className={`shrink-0 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isSubmitted ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed border border-white/5' : canLaunch ? 'bg-white text-[#0a0c10] hover:bg-slate-200 shadow-xl active:scale-95' : 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5'}`}
      >
        {isSubmitted ? 'Completed' : canLaunch ? 'Launch Sequence' : 'Locked'} {!isSubmitted && (canLaunch ? <ArrowRight size={14} className="inline ml-1" /> : <Clock size={12} className="inline ml-1" />)}
      </button>
    </div>
  );
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [showSupport, setShowSupport] = useState(false);
  const [supportMsg, setSupportMsg] = useState('');
  const [supportSent, setSupportSent] = useState(false);

  // Exam data from API
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLiveData, setIsLiveData] = useState(false);

  // User info from localStorage (login ke baad save hota hai)
  const userName = localStorage.getItem('vision_name') || localStorage.getItem('vision_email')?.split('@')[0] || 'Vision Student';
  const userEmail = localStorage.getItem('vision_email') || '';

  // â”€â”€â”€ Fetch Active Exams from Backend API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const fetchExams = async () => {
      try {
        // Real API call â€” GET /api/exams/active
        const response = await api.get('/api/exams/active');
        
        // Backend ka data ExamCard ke format mein map karo
        if (Array.isArray(response.data)) {
          const liveExams = response.data.map(exam => ({
            id: exam?.id || 'EXM-UNKNOWN',
            title: exam?.title || 'Untitled Assessment',
            duration: exam?.duration || 60,
            questionsCount: exam?.questionsCount || 0,
            startTime: exam?.startTime || new Date().toISOString(),
            category: exam?.category || 'General',
            creator: exam?.creator || 'System',
            alreadySubmitted: exam?.alreadySubmitted || false
          }));

        setExams(liveExams);
        setIsLiveData(true);
        console.log(`âœ… Loaded ${liveExams.length} exams from backend`);
      } catch (error) {
        // Backend down? Mock data use karo (demo/offline ke liye)
        console.warn('âš ï¸ Backend unreachable, using mock exams:', error.message);
        setExams(MOCK_EXAMS);
        setIsLiveData(false);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const timer = setInterval(() => setNow(new Date()), 1000);
    
    localStorage.removeItem('vision_terminated_sessions');
    
    return () => {
      document.body.style.overflow = 'auto';
      clearInterval(timer);
    };
  }, []);

  const handleSupport = () => {
    setSupportSent(true);
    setTimeout(() => { setShowSupport(false); setSupportSent(false); setSupportMsg(''); }, 2000);
  };

  const currentTime = now.toLocaleTimeString('en-GB', { hour12: false });

  return (
    <>
    <div className="h-screen w-full bg-[#0a0c10] font-sans flex flex-col overflow-hidden text-slate-200">
      <Navbar role="Student" />
      <style>{`html, body { overflow: hidden !important; height: 100% !important; overscroll-behavior: none !important; }`}</style>

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 pt-24 pb-8 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 overflow-hidden">
        <Sidebar currentTime={currentTime} userName={userName} userEmail={userEmail} onSupport={() => setShowSupport(true)} />

        <section className="bg-[#0b0f19] rounded-[40px] p-6 lg:p-10 border border-slate-800/60 shadow-2xl flex flex-col h-full overflow-hidden relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8 shrink-0 border-b border-white/[0.04] pb-6">
             <div>
               <h1 className="text-2xl font-black text-white tracking-tight uppercase">Your Assignments</h1>
               <p className="text-[11px] text-slate-500 font-bold mt-1">
                 {isLiveData 
                   ? `${exams.length} exam(s) loaded from server.`
                   : 'Offline mode â€” showing demo exams.'}
               </p>
             </div>
             <div className="hidden sm:flex items-center gap-3">
               <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center shadow-lg"><PlayCircle size={24} /></div>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
             {loading ? (
               <div className="h-full w-full flex flex-col items-center justify-center text-center">
                 <div className="w-8 h-8 border-2 border-slate-700 border-t-emerald-400 rounded-full animate-spin mb-4" />
                 <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Loading exams...</p>
               </div>
             ) : exams.length > 0 ? (
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
    
    {/* Support Chat Modal */}
    {showSupport && (
      <>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" onClick={() => setShowSupport(false)} />
        <div className="fixed bottom-6 right-6 z-[101] w-80 bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-[#0c0c0e]">
            <div className="flex items-center gap-2">
              <div className="relative w-2 h-2"><div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-40" /><div className="w-2 h-2 rounded-full bg-emerald-500 relative" /></div>
              <span className="text-xs font-bold text-white uppercase tracking-widest">Vision Support</span>
            </div>
            <button onClick={() => setShowSupport(false)} className="text-zinc-500 hover:text-white"><ArrowRight size={14} className="rotate-180" /></button>
          </div>
          <div className="px-5 py-4">
            {supportSent ? (
              <div className="text-center py-4">
                <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-white">Message Sent!</p>
                <p className="text-xs text-zinc-500 mt-1">A supervisor will respond shortly.</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-zinc-400 mb-3">Describe your issue and a proctor will assist you:</p>
                <textarea
                  value={supportMsg}
                  onChange={e => setSupportMsg(e.target.value)}
                  placeholder="Type your message..."
                  rows={3}
                  className="w-full bg-[#181a20] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-teal-600/40 resize-none"
                />
                <button
                  onClick={handleSupport}
                  disabled={!supportMsg.trim()}
                  className="mt-3 w-full py-2.5 rounded-xl bg-white text-[#0a0c10] text-xs font-black uppercase tracking-widest hover:bg-zinc-100 transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                >
                  Send Message
                </button>
              </>
            )}
          </div>
        </div>
      </>
    )}
    </>
  );
}

