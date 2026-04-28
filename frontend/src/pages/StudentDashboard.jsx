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
  <div className="bg-[#F5F5F5]/50 p-6 rounded-3xl border border-slate-200 flex flex-col xl:flex-row xl:items-center justify-between gap-6 animate-pulse">
    <div className="flex gap-5 items-start w-full">
      <div className="w-14 h-14 rounded-2xl bg-slate-200 shrink-0" />
      <div className="w-full">
        <div className="w-24 h-4 rounded-full bg-slate-200 mb-3" />
        <div className="w-3/4 max-w-sm h-7 rounded-lg bg-slate-200 mb-4" />
        <div className="flex gap-4">
          <div className="w-28 h-4 rounded-full bg-slate-200" />
          <div className="w-20 h-4 rounded-full bg-slate-200" />
        </div>
      </div>
    </div>
    <div className="w-full xl:w-40 h-14 rounded-xl bg-slate-200 shrink-0" />
  </div>
);

const Sidebar = ({ currentTime, userName, userEmail, onSupport }) => (
  <aside className="w-full lg:w-[280px] shrink-0 relative z-10 flex flex-col gap-4">
    <div className="bg-[#F5F5F5] rounded-xl border border-slate-200 p-5 lg:p-6 shadow-sm relative overflow-hidden flex flex-col h-full lg:h-auto">
      {/* Clean User Profile */}
      <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-200 relative z-10 w-full">
        
        {/* Fixed Sizing Avatar */}
        <div className="w-10 h-10 shrink-0 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
          <UserCircle size={20} strokeWidth={1.5} />
        </div>

        {/* Clean Text Stack Rhythm */}
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-[15px] font-semibold text-slate-800">{userName || 'Vinit'}</h2>
          </div>
          
          <span className="text-[12px] text-slate-500 mb-1">
            @{userEmail?.split('@')[0] || 'vinit'}
          </span>

          <span className="text-xs text-gray-500">
            Secure session
          </span>
        </div>
      </div>

      {/* Telemetry (System Status) */}
      <div className="relative z-10 flex-1">
         <div className="flex items-center gap-2 mb-4">
           <div className="relative flex items-center justify-center w-2 h-2">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
           </div>
           <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-500">System Status</h3>
         </div>
         <div className="space-y-3.5">
           <div className="flex justify-between items-center text-[13px]">
             <span className="text-slate-500 font-medium">Integrity</span>
             <span className="text-emerald-500 font-semibold flex items-center gap-1.5"><CheckCircle2 size={13} strokeWidth={2.5}/> Verified</span>
           </div>
           <div className="flex justify-between items-center text-[13px]">
             <span className="text-slate-500 font-medium">Connection</span>
             <span className="text-slate-800 font-mono text-[12px] font-semibold">{currentTime}</span>
           </div>
           <div className="flex justify-between items-center text-[13px]">
             <span className="text-slate-500 font-medium">Biometrics</span>
             <span className="text-emerald-500 font-semibold flex items-center gap-1.5"><LockIcon size={13} strokeWidth={2.5}/> Authenticated</span>
           </div>
         </div>
      </div>

      {/* Centered Support Action */}
      <div className="mt-6 pt-5 border-t border-slate-200 relative z-10">
         <button onClick={onSupport} className="w-full py-2.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:text-slate-700 dark:hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
           <LifeBuoy size={15} strokeWidth={2} /> Get Help
         </button>
      </div>
    </div>
  </aside>
);

const ExamCard = ({ exam, now, onLaunch, onViewResults, index }) => {
  // If no startTime set → treat as always available (open-ended exam)
  const hasSchedule = !!exam.startTime;
  const startTime = hasSchedule ? new Date(exam.startTime) : null;
  const endTime = hasSchedule ? new Date(startTime.getTime() + exam.duration * 60000) : null;
  const unlockTime = hasSchedule ? new Date(startTime.getTime() - 15 * 60000) : null;

  const isLive = !hasSchedule || (now >= startTime && now <= endTime);
  const isExpired = hasSchedule && now > endTime;
  const isPreOnboarding = hasSchedule && now >= unlockTime && now < startTime;
  const isSubmitted = exam.alreadySubmitted;

  // Derive visual states
  let cardBg = index === 0 ? "bg-[#F5F5F5] opacity-100 shadow-xl" : "bg-[#F5F5F5] opacity-90 hover:opacity-100"; 
  let statusColor = "text-slate-500";
  let statusText = "Upcoming";
  let btnText = "Not Available";
  let btnDisabled = true;
  let btnSecondary = false;

  if (isSubmitted) {
    cardBg = "bg-[#FFFFFF] opacity-50 grayscale hover:grayscale-0 border-slate-200";
    statusColor = "text-slate-500";
    statusText = "Completed";
    
    // Check if results are published by admin
    if (exam.resultsPublished) {
      btnText = "View Results";
      btnDisabled = false;
      btnSecondary = true;
    } else {
      btnText = "Results Pending";
      btnDisabled = true;
      btnSecondary = true;
    }
  } else if (isExpired) {
    cardBg = "bg-[#FFFFFF] opacity-40 border-slate-200";
    statusColor = "text-red-600";
    statusText = "Expired";
    btnText = "Exam Over";
    btnDisabled = true;
  } else if (isLive) {
    cardBg = "bg-[#F5F5F5] opacity-100 border-slate-200 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)]"; 
    statusColor = "text-emerald-600";
    statusText = "Live Now";
    btnText = "Start Exam";
    btnDisabled = false;
  } else if (isPreOnboarding) {
    cardBg = "bg-[#F5F5F5] opacity-100";
    statusColor = "text-blue-600";
    statusText = "Final Checks";
    btnText = "Enter Waiting Room";
    btnDisabled = false;
  }

  return (
    <div className={`p-5 lg:p-6 rounded-xl border border-slate-200 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-6 group ${cardBg}`}>
      
      {/* Primary Info */}
      <div className="flex gap-4 items-start sm:items-center">
        <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center border ${isLive ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-slate-200 bg-white text-slate-500 group-hover:text-slate-800 group-hover:bg-slate-100 group-hover:border-slate-300'} transition-colors`}>
          <ClipboardList size={22} strokeWidth={1.5} />
        </div>
        
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-1.5">
            <h3 className="text-base font-semibold text-slate-800 leading-none">{exam.title}</h3>
            
            {(isLive || isPreOnboarding) ? (
              <span className={`text-[10px] uppercase tracking-wider font-bold flex items-center gap-1.5 px-2 py-0.5 rounded ${isLive ? 'bg-emerald-50 border-emerald-200 text-emerald-600 border border-emerald-200' : 'bg-blue-50 border-blue-200 text-blue-600 border border-blue-200'}`}>
                {isLive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                {statusText}
              </span>
            ) : (
              <span className={`text-[11px] font-medium ${statusColor}`}>{statusText}</span>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-[13px] text-slate-500 font-medium">
            <span>{hasSchedule ? startTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Open Access'}</span>
            <span>•</span>
            <span>{exam.duration} min</span>
          </div>
        </div>
      </div>

      {/* CTA Area */}
      <button 
        disabled={btnDisabled} 
        onClick={() => btnSecondary ? onViewResults?.(exam.id) : onLaunch(exam.id)} 
        className={`shrink-0 px-5 py-2.5 rounded-lg font-semibold text-[13px] transition-all focus:outline-none
          ${btnDisabled 
            ? 'bg-transparent text-slate-600 cursor-not-allowed border border-slate-200' 
            : btnSecondary 
              ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'
              : 'bg-slate-900 text-white hover:bg-slate-700 border border-slate-900 shadow-sm hover:shadow active:scale-[0.98]'
          }`}
      >
        {btnText}
      </button>
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
            startTime: exam?.startTime || null,
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
    <div className="h-screen w-full bg-[#FFFFFF] font-sans flex flex-col overflow-hidden text-slate-700 relative">
      <div className="relative z-10 flex flex-col h-full w-full">
        <Navbar role="Student" />
        <style>{`html, body { overflow: hidden !important; height: 100% !important; overscroll-behavior: none !important; }`}</style>

        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 lg:px-8 pt-24 pb-8 flex flex-col lg:flex-row gap-8 overflow-hidden z-10 relative">
        <Sidebar currentTime={currentTime} userName={userName} userEmail={userEmail} onSupport={() => setShowSupport(true)} />

        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          
          {/* Breadcrumbs & Header Section */}
          <div className="shrink-0 mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
             <div>
               <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-3">
                 <span>Gateway</span>
                 <ChevronRight size={10} />
                 <span>Candidate</span>
                 <ChevronRight size={10} />
                 <span className="text-emerald-600">Assignments</span>
               </div>
               <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">My Assessments</h1>
               <p className="text-xs text-slate-500 font-medium">
                 {isLiveData 
                   ? `Synchronized with server (${exams.length} assignments).` 
                   : cacheTime 
                     ? `Operating in Offline Mode (Cached Data from ${cacheTime})` 
                     : 'Disconnected. No cached data available.'}
               </p>
             </div>
             
             {/* Search & Filter Bar */}
             <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-64">
                   <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                   <input 
                     type="text" 
                     placeholder="Search exam or ID..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full bg-[#F5F5F5] border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-medium"
                   />
                </div>
                <div className="flex items-center gap-1 bg-[#F5F5F5] border border-slate-200 rounded-xl p-1 w-full sm:w-auto overflow-x-auto custom-scrollbar">
                  {['All', 'Live', 'Upcoming', 'Completed'].map(f => (
                    <button 
                      key={f}
                      onClick={() => setStatusFilter(f)}
                      className={`px-4 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-bold whitespace-nowrap transition-all ${statusFilter === f ? 'bg-white text-black shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'}`}
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
                      onLaunch={(id) => navigate(`/exam/${id}/verify`)}
                        onViewResults={() => navigate(`/exam/${exam.id}/result`)}
                      />
                    ))}
                 </div>
              ) : (
                <div className="h-48 md:h-64 w-full flex flex-col items-center justify-center text-center bg-[#F5F5F5] border border-dashed border-slate-300 rounded-3xl mt-4">
                   <Filter size={32} className="text-slate-400 mb-4" />
                   <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-1">No Alignments Found</h3>
                   <p className="text-xs text-slate-500 font-medium max-w-[250px]">Adjust your search query or filters to reveal matching assignments.</p>
                   {(searchQuery || statusFilter !== 'All') && (
                     <button onClick={() => {setSearchQuery(''); setStatusFilter('All');}} className="mt-4 text-[10px] text-emerald-600 font-bold uppercase tracking-widest hover:underline">Clear Filters</button>
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]" onClick={() => setShowSupport(false)} />
        <div className="fixed bottom-6 right-6 z-[101] w-80 lg:w-96 bg-[#FFFFFF] border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-[#F5F5F5]">
            <div className="flex items-center gap-2">
              <div className="relative w-2 h-2"><div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-40" /><div className="w-2 h-2 rounded-full bg-emerald-500 relative" /></div>
              <span className="text-xs font-bold text-slate-900 uppercase tracking-widest">Live Channel</span>
            </div>
            <button onClick={() => setShowSupport(false)} className="text-zinc-500 hover:text-slate-900 p-1 rounded hover:bg-slate-50"><ChevronRight size={16} className="rotate-90" /></button>
          </div>
          <div className="px-5 py-4">
            {supportSent ? (
               <div className="text-center py-8">
                 <CheckCircle2 size={36} className="text-emerald-600 mx-auto mb-3" />
                 <p className="text-sm font-bold tracking-wider uppercase text-slate-900">Transmission Sent</p>
                 <p className="text-xs text-zinc-500 mt-2 font-medium">A supervisor will initiate proxy support shortly.</p>
               </div>
            ) : (
               <>
                 <p className="text-xs text-zinc-400 mb-3 font-medium">Relay your technical issue securely:</p>
                 <textarea
                   value={supportMsg}
                   onChange={e => setSupportMsg(e.target.value)}
                   placeholder="Describe what is happening on your node..."
                   rows={4}
                   className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs text-slate-800 placeholder:text-zinc-600 focus:outline-none focus:border-teal-600/40 resize-none font-medium"
                 />
                 <button
                   onClick={handleSupport}
                   disabled={!supportMsg.trim()}
                   className="mt-4 w-full py-3 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                 >
                   Transmit Packet
                 </button>
               </>
            )}
          </div>
        </div>
      </>
    )}




    {/* Exit FAB — Global Candidate Style */}
    {!showExitConfirm && (
      <button
        onClick={() => setShowExitConfirm(true)}
        className="fixed bottom-6 right-6 z-[90] w-[52px] h-[52px] bg-white border border-slate-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)] rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 hover:shadow-lg transition-all active:scale-95 group"
      >
        <Power size={20} className="stroke-[2.5px]" />
      </button>
    )}

    {/* Exit Confirmation Modal */}
    {showExitConfirm && (
      <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                <LogOut size={18} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Exit Session</h3>
                <p className="text-xs text-slate-500 mt-0.5">This will end your current session.</p>
              </div>
            </div>
            <button onClick={() => setShowExitConfirm(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
              <X size={16} />
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-5 font-medium">
            Are you sure you want to exit? Your session will be cleared and you'll be redirected to the home page.
          </p>
          {settings?.exitPassword && (
             <div className="mb-5">
               <input
                 type="password"
                 value={exitPassword}
                 onChange={e => { setExitPassword(e.target.value); setExitError(''); }}
                 placeholder="Supervisor Password"
                 className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center text-slate-900 font-mono tracking-widest outline-none focus:border-red-400 transition-all text-sm"
               />
               {exitError && <p className="text-[10px] text-red-500 font-bold mt-2 uppercase tracking-widest">{exitError}</p>}
             </div>
           )}
           <div className="flex gap-3">
             <button
               onClick={() => { setShowExitConfirm(false); setExitPassword(''); setExitError(''); }}
               className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest transition-colors"
             >
               Stay
             </button>
             <button
               onClick={() => { 
                 const targetPass = settings?.exitPassword || '';
                 if (!targetPass || exitPassword === targetPass) {
                   sessionStorage.clear(); 
                   localStorage.clear(); 
                   navigate('/'); 
                 } else {
                   setExitError('Incorrect Password');
                 }
               }}
               className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
             >
               <LogOut size={13} /> Exit
             </button>
           </div>
        </div>
      </div>
    )}
    </>
  );
}
