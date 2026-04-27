import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Navbar } from '../components/Navbar';
import BouncingDotLoader from '../components/BouncingDotLoader';
import api, { getSettings } from '../services/api';
import { 
  PlayCircle, BookOpen, ShieldCheck, 
  ArrowRight, Clock, CheckCircle2, Lock as LockIcon, ListChecks, Calendar,
  Fingerprint, LifeBuoy, AlertTriangle, Search, Filter,
  ChevronRight, Hash, Info, UserCircle, Activity, ClipboardList, LogOut, X, Power
} from 'lucide-react';


/* ─────────────── Sub-components ─────────────── */

const SkeletonExamCard = () => (
  <div className="bg-surface p-8 rounded-[2.5rem] border border-main flex flex-col xl:flex-row xl:items-center justify-between gap-8 animate-pulse">
    <div className="flex gap-6 items-start flex-1">
      <div className="w-16 h-16 rounded-2xl bg-surface-hover shrink-0" />
      <div className="flex-1 space-y-4">
        <div className="w-48 h-6 rounded-lg bg-surface-hover" />
        <div className="flex gap-4">
          <div className="w-24 h-8 rounded-xl bg-surface-hover" />
          <div className="w-24 h-8 rounded-xl bg-surface-hover" />
        </div>
      </div>
    </div>
    <div className="w-40 h-14 rounded-2xl bg-surface-hover shrink-0" />
  </div>
);

const Sidebar = ({ currentTime, userName, userEmail, onSupport }) => (
  <aside className="w-full lg:w-[320px] shrink-0 relative z-10 flex flex-col gap-6">
    <div className="bg-surface rounded-3xl border border-main p-8 shadow-2xl relative overflow-hidden flex flex-col h-full lg:h-auto group/sidebar transition-all duration-500 hover:border-primary-500/30">
      {/* Background Decorative Element */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-500/5 rounded-full blur-3xl opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-1000" />
      
      {/* Clean User Profile */}
      <div className="flex flex-col items-center text-center mb-8 pb-8 border-b border-main relative z-10 w-full">
        {/* Fixed Sizing Avatar */}
        <div className="w-20 h-20 shrink-0 rounded-[2.5rem] bg-surface-hover border border-main flex items-center justify-center text-primary-500 mb-5 group-hover/sidebar:scale-105 transition-transform duration-500 shadow-xl shadow-primary-500/5">
          <UserCircle size={40} strokeWidth={1} />
        </div>
        
        {/* Clean Text Stack Rhythm */}
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-black text-primary uppercase tracking-tight leading-none">{userName || 'Vision'}</h2>
          <span className="text-[10px] text-muted font-black uppercase tracking-widest opacity-50">
            @{userEmail?.split('@')[0] || 'candidate'}
          </span>
        </div>
      </div>
      
      {/* Telemetry (System Status) */}
      <div className="relative z-10 flex-1 space-y-8">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="relative flex items-center justify-center w-2.5 h-2.5">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20"></span>
               <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
             </div>
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Telemetry</h3>
           </div>
           <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
             <span className="text-[8px] font-black uppercase text-emerald-500 tracking-widest">Active</span>
           </div>
         </div>
         
         <div className="space-y-5">
           <div className="flex justify-between items-center group/item">
             <span className="text-[11px] font-black uppercase tracking-widest text-muted group-hover/item:text-primary transition-colors">Security Protocol</span>
             <span className="text-emerald-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 px-3 py-1.5 bg-emerald-500/5 rounded-xl border border-emerald-500/10"><ShieldCheck size={12} strokeWidth={2.5}/> Verified</span>
           </div>
           
           <div className="flex justify-between items-center group/item">
             <span className="text-[11px] font-black uppercase tracking-widest text-muted group-hover/item:text-primary transition-colors">Session Clock</span>
             <span className="text-primary font-mono text-xs font-black bg-surface-hover px-3 py-1.5 rounded-xl border border-main tracking-widest tabular-nums">{currentTime}</span>
           </div>
           
           <div className="flex justify-between items-center group/item">
             <span className="text-[11px] font-black uppercase tracking-widest text-muted group-hover/item:text-primary transition-colors">Node Identity</span>
             <span className="text-primary-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 px-3 py-1.5 bg-primary-500/5 rounded-xl border border-primary-500/10"><Fingerprint size={12} strokeWidth={2.5}/> Validated</span>
           </div>
         </div>
      </div>
      
      {/* Centered Support Action */}
      <div className="mt-10 pt-8 border-t border-main relative z-10">
         <button onClick={onSupport} className="w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-primary hover:bg-surface-hover border border-transparent hover:border-main transition-all flex items-center justify-center gap-3 active:scale-95 group/help">
           <LifeBuoy size={16} strokeWidth={2.5} className="group-hover/help:rotate-45 transition-transform duration-500" /> Support Relay
         </button>
      </div>
    </div>
  </aside>
);

const ExamCard = ({ exam, now, onLaunch, onViewResults, index }) => {
  const startTime = new Date(exam.startTime);
  const endTime = new Date(startTime.getTime() + exam.duration * 60000);
  const unlockTime = new Date(startTime.getTime() - 15 * 60000); 
  
  const isLive = now >= startTime && now <= endTime;
  const isExpired = now > endTime;
  const isPreOnboarding = now >= unlockTime && now < startTime;
  const isSubmitted = exam.alreadySubmitted;

  // Derive visual states
  let cardBg = "bg-surface"; 
  let statusColor = "text-muted";
  let statusText = "Upcoming Protocol";
  let btnText = "Locked";
  let btnDisabled = true;
  let btnSecondary = false;

  if (isSubmitted) {
    cardBg = "bg-surface opacity-50 grayscale hover:grayscale-0 border-main";
    statusColor = "text-muted";
    statusText = "Protocol Concluded";
    
    if (exam.resultsPublished) {
      btnText = "View Intel";
      btnDisabled = false;
      btnSecondary = true;
    } else {
      btnText = "Pending Analysis";
      btnDisabled = true;
      btnSecondary = true;
    }
  } else if (isExpired) {
    cardBg = "bg-surface opacity-40 border-main";
    statusColor = "text-red-500";
    statusText = "Protocol Expired";
    btnText = "Mission Over";
    btnDisabled = true;
  } else if (isLive) {
    cardBg = "bg-surface border-primary-500/50 shadow-2xl shadow-primary-500/10"; 
    statusColor = "text-emerald-500";
    statusText = "Active Transmission";
    btnText = "Initialize Entry";
    btnDisabled = false;
  } else if (isPreOnboarding) {
    cardBg = "bg-surface border-primary-500/30";
    statusColor = "text-primary-500";
    statusText = "Ready for Uplink";
    btnText = "Enter Terminal";
    btnDisabled = false;
  }

  return (
    <div className={`p-8 rounded-[2.5rem] border transition-all duration-500 flex flex-col xl:flex-row xl:items-center justify-between gap-8 group/card overflow-hidden relative ${cardBg}`}>
      {isLive && (
        <div className="absolute top-0 right-0 p-4">
           <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
             <span className="text-[8px] font-black uppercase text-emerald-500 tracking-widest">Live Now</span>
           </div>
        </div>
      )}

      {/* Primary Info */}
      <div className="flex gap-6 items-start xl:items-center relative z-10 flex-1">
        <div className={`w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center border transition-all duration-500 ${isLive ? 'border-primary-500/50 bg-primary-500/10 text-primary-500 shadow-xl shadow-primary-500/20 scale-110' : 'border-main bg-surface-hover text-muted group-hover/card:text-primary-500 group-hover/card:border-primary-500/30'}`}>
          <ClipboardList size={28} strokeWidth={1.5} />
        </div>
        
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex flex-col mb-2">
            <h3 className="text-xl font-black text-primary leading-tight uppercase tracking-tight group-hover/card:text-primary-500 transition-colors truncate">{exam.title}</h3>
            <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mt-1 opacity-50">{exam.id}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-surface-hover px-3 py-1.5 rounded-xl border border-main">
              <Calendar size={12} className="text-muted" />
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">{startTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-2 bg-surface-hover px-3 py-1.5 rounded-xl border border-main">
              <Clock size={12} className="text-muted" />
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">{exam.duration} MINS</span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Area */}
      <div className="flex items-center gap-4 shrink-0 relative z-10">
        <div className="text-right hidden sm:block mr-4">
          <p className={`text-[9px] font-black uppercase tracking-widest ${statusColor}`}>{statusText}</p>
          <p className="text-[10px] text-muted font-bold mt-0.5 opacity-50">T-minus: {format(startTime, 'HH:mm')}</p>
        </div>
        <button 
          disabled={btnDisabled} 
          onClick={() => btnSecondary ? onViewResults?.(exam.id) : onLaunch(exam.id)} 
          className={`h-14 px-8 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all focus:outline-none flex items-center justify-center gap-3
            ${btnDisabled 
              ? 'bg-surface-hover text-muted cursor-not-allowed border border-main' 
              : btnSecondary 
                ? 'bg-surface border border-primary-500/50 text-primary-500 hover:bg-primary-500 hover:text-white shadow-xl shadow-primary-500/5'
                : 'bg-primary-500 text-white hover:bg-primary-600 shadow-2xl shadow-primary-500/30 hover:scale-105 active:scale-95'
            }`}
        >
          {btnText}
          <ArrowRight size={16} strokeWidth={2.5} className="group-hover/card:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

/* ─────────────── Results Modal ─────────────── */


/* ─────────────── Main Page ─────────────── */

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  
  // Support state
  const [showSupport, setShowSupport] = useState(false);
  const [supportMsg, setSupportMsg] = useState('');
  const [supportSent, setSupportSent] = useState(false);

    // Results modal state — Removed as we now use a dedicated page
    // const [showResultsModal, setShowResultsModal] = useState(false);
    // const [selectedExamId, setSelectedExamId] = useState(null);

  // Exit confirmation state
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [exitPassword, setExitPassword] = useState('');
  const [settings, setSettings] = useState(null);
  const [exitError, setExitError] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // All, Live, Upcoming, Completed

  // Exam Data
  const [exams, setExams] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('published_exams_v2'));
      return (cached && Array.isArray(cached.data)) ? cached.data : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [isLiveData, setIsLiveData] = useState(false);
  const [cacheTime, setCacheTime] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('published_exams_v2'));
      return cached?.timestamp ? new Date(cached.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
    } catch (e) {
      console.error(e);
      return null;
    }
  });

  // User Info
  const userName = sessionStorage.getItem('vision_name') || sessionStorage.getItem('vision_email')?.split('@')[0] || 'Vision Student';
  const userEmail = sessionStorage.getItem('vision_email') || '';

  // Fetch Logic
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await api.get('/api/exams/active');
        if (Array.isArray(response.data)) {
          const liveExams = response.data.map(exam => ({
            id: exam?.id || 'EXM-UNKNOWN',
            title: exam?.title || 'Untitled Assessment',
            duration: exam?.duration || 60,
            questionsCount: exam?.questionsCount || 0,
            startTime: exam?.startTime || new Date().toISOString(),
            alreadySubmitted: exam?.alreadySubmitted || false,
            resultsPublished: exam?.resultsPublished || false,
            settings: exam?.settings || {}
          }));
          setExams(liveExams);
          // Timestamped Caching
          localStorage.setItem('published_exams_v2', JSON.stringify({
            data: liveExams,
            timestamp: Date.now()
          })); 
          setIsLiveData(true);
        }
      } catch (error) {
        console.error('Backend unreachable or API Error:', error.message);
        
        // Accurate Fallback
        const cached = JSON.parse(localStorage.getItem('published_exams_v2'));
        if (cached && Array.isArray(cached.data)) {
          setExams(cached.data);
          setCacheTime(new Date(cached.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        } else {
          setExams([]);
        }
        
        setIsLiveData(false);
        toast.error("Unable to reach server. Using cached data if available.", {
          id: 'fetch-exams-error',
        });
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

    const role = sessionStorage.getItem('vision_role');
    if (role === 'admin' || role === 'mentor' || role === 'super_mentor') {
      getSettings().then(res => {
        if (res) setSettings(res);
      }).catch(err => console.error("Failed to load settings", err));
    }

    return () => {
      document.body.style.overflow = 'auto';
      clearInterval(timer);
    };
  }, []);

  const handleSupport = async () => {
    try {
      setSupportSent(true);
      await api.post('/api/exams/help', { msg: supportMsg });
      setTimeout(() => { setShowSupport(false); setSupportSent(false); setSupportMsg(''); }, 2000);
    } catch (err) {
      setSupportSent(false);
      console.error('Failed to send support request:', err);
    }
  };

  // ─────────────── Filtering Engine ──────────────
  const filteredExams = useMemo(() => {
    return exams.filter(exam => {
      // 1. Text Search Filter
      if (searchQuery && !exam.title.toLowerCase().includes(searchQuery.toLowerCase()) && !exam.id.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // 2. Status Category Filter
      if (statusFilter !== 'All') {
        const startTime = new Date(exam.startTime);
        const endTime = new Date(startTime.getTime() + exam.duration * 60000);
        const unlockTime = new Date(startTime.getTime() - 15 * 60000);
        const isLiveOrPre = now >= unlockTime && now <= endTime;
        const isSubmitted = exam.alreadySubmitted;

        if (statusFilter === 'Completed' && !isSubmitted) return false;
        if (statusFilter === 'Live' && (isSubmitted || !isLiveOrPre)) return false;
        if (statusFilter === 'Upcoming' && (isSubmitted || now >= unlockTime)) return false;
      }
      
      return true;
    });
  }, [exams, searchQuery, statusFilter, now]);
  
  const currentTime = now.toLocaleTimeString('en-GB', { hour12: false });

  return (
    <>
    {/* Raw Internal Tool Wrapper */}
    <div className="h-screen w-full bg-page font-sans flex flex-col overflow-hidden text-primary relative">
      <div className="relative z-10 flex flex-col h-full w-full">
        <Navbar role="Student" />
        <style>{`html, body { overflow: hidden !important; height: 100% !important; overscroll-behavior: none !important; }`}</style>

        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 lg:px-8 pt-24 pb-8 flex flex-col lg:flex-row gap-8 overflow-hidden z-10 relative">
        <Sidebar currentTime={currentTime} userName={userName} userEmail={userEmail} onSupport={() => setShowSupport(true)} />

        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          
          {/* Breadcrumbs & Header Section */}
          <div className="shrink-0 mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
             <div>
               <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] font-black text-muted mb-4">
                 <span className="opacity-50">Gateway</span>
                 <ChevronRight size={10} className="opacity-30" />
                 <span className="opacity-50">Candidate</span>
                 <ChevronRight size={10} className="opacity-30" />
                 <span className="text-primary-500">Curated Protocols</span>
               </div>
               <h1 className="text-4xl lg:text-5xl font-black text-primary tracking-tighter mb-3 uppercase">Assessment Hub</h1>
               <p className="text-[11px] text-muted font-black uppercase tracking-widest flex items-center gap-3">
                 <span className={`w-2 h-2 rounded-full ${isLiveData ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-red-500'}`} />
                 {isLiveData 
                   ? `Synchronized with server (${exams.length} assignments).` 
                   : cacheTime 
                     ? `Offline Protocol (Cached from ${cacheTime})` 
                     : 'Disconnected. No curated items.'}
               </p>
             </div>
             
             {/* Search & Filter Bar */}
             <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-80 group">
                   <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary-500 transition-colors" />
                   <input 
                      type="text" 
                      placeholder="Search protocols or identifiers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-surface border border-main rounded-2xl pl-12 pr-5 py-3.5 text-[11px] font-black uppercase tracking-widest text-primary placeholder:text-muted/30 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all"
                    />
                </div>
                <div className="flex items-center gap-1.5 bg-surface border border-main rounded-2xl p-1.5 w-full sm:w-auto overflow-x-auto custom-scrollbar shadow-sm">
                  {['All', 'Live', 'Upcoming', 'Completed'].map(f => (
                    <button 
                      key={f}
                      onClick={() => setStatusFilter(f)}
                      className={`px-5 py-2 rounded-xl text-[10px] uppercase font-black tracking-widest whitespace-nowrap transition-all duration-300 ${statusFilter === f ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-muted hover:text-primary hover:bg-surface-hover'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
             </div>
          </div>

          {/* Exam List Container */}
          <div className="flex-1 overflow-y-auto pr-3 pb-10 custom-scrollbar">
             {loading ? (
               <div className="space-y-4 mt-2">
                 <SkeletonExamCard />
                 <SkeletonExamCard />
                 <SkeletonExamCard />
               </div>
             ) : filteredExams.length > 0 ? (
                 <div className="flex flex-col gap-4 mt-6 mb-8">
                    {filteredExams.map(exam => (
                      <ExamCard 
                        key={exam.id}
                        exam={exam}
                        now={now}
                      onLaunch={(id) => {
                        const examObj = exams.find(e => e.id === id);
                        if (examObj?.settings?.requireIDVerification === false) {
                            navigate(`/exam/${id}/waiting`);
                        } else {
                            navigate(`/exam/${id}/verify`);
                        }
                      }}
                        onViewResults={() => navigate(`/exam/${exam.id}/result`)}
                      />
                    ))}
                 </div>
              ) : (
                <div className="py-32 w-full flex flex-col items-center justify-center text-center bg-surface border-2 border-dashed border-main rounded-[3rem] mt-8 relative overflow-hidden group/empty">
                   <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 to-transparent opacity-0 group-hover/empty:opacity-100 transition-opacity duration-500" />
                   <div className="w-24 h-24 rounded-[2.5rem] bg-surface-hover border border-main flex items-center justify-center text-muted mb-6 group-hover/empty:text-primary-500 group-hover/empty:scale-110 transition-all duration-500 shadow-xl shadow-primary-500/5">
                     <Filter size={40} strokeWidth={1.5} />
                   </div>
                   <h3 className="text-sm font-black text-primary uppercase tracking-[0.3em] mb-2">No Curated Items Found</h3>
                   <p className="text-[10px] text-muted font-black uppercase tracking-widest opacity-50 max-w-[280px]">Adjust your search query or filters to reveal matching assessment protocols.</p>
                   {(searchQuery || statusFilter !== 'All') && (
                     <button onClick={() => {setSearchQuery(''); setStatusFilter('All');}} className="mt-8 text-[11px] text-primary-500 font-black uppercase tracking-[0.2em] hover:text-primary-600 transition-colors flex items-center gap-2 group/clear">
                       <RefreshCw size={14} className="group-hover/clear:rotate-180 transition-transform duration-500" />
                       Clear Protocol Filters
                     </button>
                   )}
                </div>
              )}
          </div>
        </div>
      </main>
      </div>
    </div>
    
    {/* Support Chat Modal */}
    {showSupport && (
      <>
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]" onClick={() => setShowSupport(false)} />
        <div className="fixed bottom-8 right-8 z-[101] w-[400px] bg-surface border border-main rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
          <div className="flex items-center justify-between px-8 py-6 border-b border-main bg-surface-hover/50">
            <div className="flex items-center gap-4">
              <div className="relative w-2.5 h-2.5">
                <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-40" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative" />
              </div>
              <span className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Support Relay Active</span>
            </div>
            <button onClick={() => setShowSupport(false)} className="w-10 h-10 flex items-center justify-center rounded-xl text-muted hover:text-primary hover:bg-surface-hover transition-all">
              <X size={20} />
            </button>
          </div>
          <div className="p-8">
            {supportSent ? (
               <div className="text-center py-10">
                 <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-emerald-500">
                   <CheckCircle2 size={40} strokeWidth={1.5} />
                 </div>
                 <p className="text-sm font-black tracking-[0.2em] uppercase text-primary mb-2">Transmission Sent</p>
                 <p className="text-[10px] text-muted font-black uppercase tracking-widest opacity-50">A supervisor will initiate proxy support shortly.</p>
               </div>
            ) : (
               <div className="space-y-6">
                 <div>
                   <p className="text-[10px] text-muted mb-3 font-black uppercase tracking-widest opacity-50 ml-1">Relay technical issue securely</p>
                   <textarea
                     value={supportMsg}
                     onChange={e => setSupportMsg(e.target.value)}
                     placeholder="Describe the anomaly..."
                     rows={4}
                     className="w-full bg-surface-hover border border-main rounded-2xl px-5 py-4 text-xs font-bold text-primary placeholder:text-muted/30 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all resize-none shadow-inner"
                   />
                 </div>
                 <button
                   onClick={handleSupport}
                   disabled={!supportMsg.trim()}
                   className="w-full h-14 rounded-2xl bg-primary-500 text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-primary-600 transition-all shadow-2xl shadow-primary-500/30 active:scale-95 disabled:opacity-20 disabled:grayscale disabled:pointer-events-none flex items-center justify-center gap-3"
                 >
                   <Send size={16} />
                   Transmit Packet
                 </button>
               </div>
            )}
          </div>
        </div>
      </>
    )}


    {/* Exit FAB — Global Candidate Style */}
    {!showExitConfirm && (
      <button
        onClick={() => setShowExitConfirm(true)}
        className="fixed bottom-8 right-8 z-[90] w-16 h-16 bg-surface border border-main shadow-[0_16px_32px_-8px_rgba(0,0,0,0.5)] rounded-[2rem] flex items-center justify-center text-muted hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/5 transition-all duration-500 active:scale-95 group/exit-fab"
      >
        <Power size={24} className="stroke-[2.5px] group-hover/exit-fab:rotate-90 transition-transform duration-500" />
      </button>
    )}

    {/* Exit Confirmation Modal */}
    {showExitConfirm && (
      <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-8">
        <div className="bg-surface border border-main rounded-[3rem] max-w-md w-full p-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-20 h-20 rounded-[2rem] bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 text-red-500 shadow-xl shadow-red-500/5">
              <LogOut size={32} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-xl font-black text-primary uppercase tracking-tight mb-2">Terminate Session</h3>
              <p className="text-[10px] text-muted font-black uppercase tracking-widest opacity-50">This will immediately clear your node's local curated items.</p>
            </div>
          </div>

          <div className="space-y-6">
            {settings?.exitPassword && (
               <div>
                 <p className="text-[10px] text-muted mb-3 font-black uppercase tracking-widest opacity-50 ml-1">Supervisor Authorization</p>
                 <input
                   type="password"
                   value={exitPassword}
                   onChange={e => { setExitPassword(e.target.value); setExitError(''); }}
                   placeholder="Enter Access Key"
                   className="w-full bg-surface-hover border border-main rounded-2xl px-6 py-4 text-center text-primary font-mono tracking-[0.3em] outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/5 transition-all text-sm font-black shadow-inner uppercase placeholder:text-muted/20"
                 />
                 {exitError && <p className="text-[10px] text-red-500 font-black mt-3 uppercase tracking-widest text-center">{exitError}</p>}
               </div>
             )}
             
             <div className="flex gap-4">
               <button
                 onClick={() => { setShowExitConfirm(false); setExitPassword(''); setExitError(''); }}
                 className="flex-1 h-14 rounded-2xl bg-surface-hover hover:bg-surface border border-main text-primary font-black text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95"
               >
                 Abort
               </button>
               <button
                 onClick={() => { 
                   const targetPass = settings?.exitPassword || '';
                   if (!targetPass || exitPassword === targetPass) {
                     sessionStorage.clear(); 
                     localStorage.clear(); 
                     navigate('/'); 
                   } else {
                     setExitError('Access Denied');
                   }
                 }}
                 className="flex-1 h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-red-500/30 active:scale-95"
               >
                 <Power size={14} /> Terminate
               </button>
             </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
