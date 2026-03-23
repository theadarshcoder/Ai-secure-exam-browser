import React from 'react';
import { Navbar } from '../components/Navbar';
import { 
  BookOpen, CheckCircle, PlusCircle, Users, 
  Monitor, AlertCircle, TrendingUp, Clock,
  Video, Mic, Eye, MoreHorizontal, ChevronRight,
  Activity, Shield, LayoutGrid, Radio, Terminal,
  Cpu, Zap, Globe
} from 'lucide-react';

export default function MentorDashboard() {
  const activeExams = [
    { id: 'EX-901', name: 'Advanced Quantum Computing', students: 24, status: 'live', alerts: 0, node: 'N-Alpha' },
    { id: 'EX-902', name: 'Neural Cryptography', students: 18, status: 'live', alerts: 2, node: 'N-Beta' },
    { id: 'EX-903', name: 'Distributed Systems', students: 31, status: 'scheduled', alerts: 0, node: 'N-Gamma' },
  ];

  const submissions = [
    { student: 'Alex Rivera', exam: 'UI/UX Architecture', score: 'Pending', time: '10m ago' },
    { student: 'Mila Kunis', exam: 'Kernel Optimization', score: '88/100', time: '1h ago' },
    { student: 'Tanay Goyal', exam: 'Zero-Knowledge Proofs', score: '92/100', time: '3h ago' },
  ];

  return (
    <div className="h-screen w-full bg-[#020617] font-['Inter'] text-slate-400 overflow-hidden flex flex-col antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=Outfit:wght@500;700;900&family=JetBrains+Mono:wght@400;700&display=swap');
        
        .hyper-glass {
          background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);
          backdrop-filter: blur(40px);
          border: 1px solid rgba(255,255,255,0.05);
        }
        .text-outfit { font-family: 'Outfit', sans-serif; }
        .text-mono { font-family: 'JetBrains Mono', monospace; }
        .hud-glow { filter: drop-shadow(0 0 10px rgba(99, 102, 241, 0.4)); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.2); border-radius: 10px; }
      `}</style>

      <Navbar role="Mentor" />

      <main className="flex-1 max-w-[1800px] w-full mx-auto px-10 pt-28 pb-10 overflow-hidden flex flex-col gap-10">
        
        {/* BRIDGE HEADER */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-10 shrink-0">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-6 items-center gap-3 px-4 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                <Radio size={14} className="animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em]">Surveillance Active</span>
              </div>
              <div className="h-4 w-px bg-white/5"></div>
              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.4em] font-mono whitespace-nowrap">BRIDGE_ID: MS-09-TACTICAL</span>
            </div>
            <h1 className="text-6xl font-black text-white text-outfit tracking-tighter uppercase leading-none italic">
              Surveillance <span className="text-indigo-500 not-italic">Bridge</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-2xl opacity-80">
              Orchestrate academic integrity. Real-time multi-stream proctoring, 
              behavioral analytics, and synchronized session management through the neural proctoring grid.
            </p>
          </div>
          
          <div className="flex items-center gap-6 bg-white/5 p-2 rounded-3xl border border-white/10">
            <button className="flex items-center gap-4 bg-indigo-600 hover:bg-indigo-500 text-white px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl shadow-indigo-600/20 transition-all active:scale-95 group">
              <PlusCircle size={20} className="group-hover:rotate-90 transition-transform duration-500" />
              Initialize New Session
            </button>
          </div>
        </div>

        {/* HUD VITALS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 shrink-0">
          <div className="hyper-glass p-10 rounded-[4rem] group hover:bg-white/[0.04] transition-all duration-700 relative overflow-hidden flex items-center gap-8">
            <div className="absolute -top-10 -right-10 p-12 opacity-5 scale-150 rotate-12 group-hover:scale-[2] transition-transform duration-1000">
              <Users size={80} />
            </div>
            <div className="w-20 h-20 rounded-[2rem] bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/10 shadow-2xl group-hover:bg-emerald-500 transition-all duration-500 group-hover:text-white">
              <Users size={34} />
            </div>
            <div>
              <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.5em] mb-1 italic">Active Agents</p>
              <h3 className="text-4xl font-black text-white text-outfit tracking-tighter">142</h3>
            </div>
          </div>
          
          <div className="hyper-glass p-10 rounded-[4rem] group hover:bg-white/[0.04] transition-all duration-700 relative overflow-hidden flex items-center gap-8 border-l-4 border-l-indigo-600">
            <div className="absolute -top-10 -right-10 p-12 opacity-5 scale-150 group-hover:scale-[2] transition-transform duration-1000">
              <Monitor size={80} />
            </div>
            <div className="w-20 h-20 rounded-[2rem] bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/10 shadow-2xl group-hover:bg-indigo-500 transition-all duration-500 group-hover:text-white text-white">
              <BookOpen size={34} />
            </div>
            <div>
              <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.5em] mb-1 italic">Live Missions</p>
              <h3 className="text-4xl font-black text-white text-outfit tracking-tighter">08</h3>
            </div>
          </div>

          <div className="hyper-glass p-10 rounded-[4rem] group hover:bg-rose-500/5 transition-all duration-700 relative overflow-hidden flex items-center gap-8 border-l-4 border-l-rose-500 text-rose-400">
            <div className="absolute -top-10 -right-10 p-12 opacity-5 scale-150 group-hover:scale-[2] transition-transform duration-1000 text-rose-900">
              <AlertCircle size={80} />
            </div>
            <div className="w-20 h-20 rounded-[2rem] bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/10 shadow-2xl group-hover:bg-rose-500 transition-all duration-500 group-hover:text-white">
              <AlertCircle size={34} />
            </div>
            <div>
              <p className="text-rose-500/40 text-[10px] font-black uppercase tracking-[0.5em] mb-1 italic">Threats Logged</p>
              <h3 className="text-4xl font-black text-outfit tracking-tighter">12</h3>
            </div>
          </div>
        </div>

        {/* SURVEILLANCE MATRIX & DECISION CORE */}
        <div className="flex-1 flex flex-col xl:flex-row gap-10 overflow-hidden min-h-0">
          
          {/* MATRIX GRID (70%) */}
          <div className="flex-[2] hyper-glass rounded-[4rem] overflow-hidden flex flex-col shadow-2xl">
              <div className="p-10 border-b border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <LayoutGrid size={20} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white text-outfit italic tracking-tighter uppercase leading-none mb-1">Live Matrix</h2>
                    <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.4em] font-mono">Parallel Surveillance Flows</p>
                  </div>
                </div>
                <button className="flex items-center gap-4 bg-white/5 border border-white/10 px-8 py-4 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all active:scale-95 shadow-xl">
                  <Globe size={16} /> Global Viewport
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 sm:grid-cols-2 gap-8 custom-scrollbar mb-6">
                {activeExams.map((exam) => (
                  <div key={exam.id} className="p-10 rounded-[3.5rem] border border-white/5 bg-white/[0.01] group hover:bg-white/[0.04] hover:border-indigo-500/30 transition-all duration-700 relative overflow-hidden cursor-pointer shadow-3xl">
                    {exam.status === 'live' && (
                      <div className="absolute top-0 right-0 p-8">
                        <div className="flex h-3 w-3 rounded-full bg-rose-500 animate-[ping_1.5s_infinite] shadow-[0_0_20px_rgba(244,63,94,0.6)]"></div>
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-12 relative z-10">
                      <div className="px-5 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/10 text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] font-mono shadow-sm">
                        {exam.id}
                      </div>
                      <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] ${exam.alerts > 0 ? 'text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-xl shadow-rose-500/5' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-xl shadow-emerald-500/5'} px-4 py-2 rounded-full border`}>
                        {exam.alerts > 0 ? `DEVIATION DETECTED (${exam.alerts})` : 'INTEGRITY SECURE'}
                      </div>
                    </div>
                    <h4 className="text-2xl font-black text-white text-outfit mb-12 tracking-tight italic uppercase">{exam.name}</h4>
                    <div className="flex items-center justify-between mt-auto border-t border-white/5 pt-8 relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="flex -space-x-4">
                          {[1,2,3].map(i => <div key={i} className="w-11 h-11 rounded-2xl border-4 border-[#020617] bg-slate-800 flex items-center justify-center text-[11px] font-black italic">S{i}</div>)}
                          <div className="w-11 h-11 rounded-2xl border-4 border-[#020617] bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shadow-xl shadow-indigo-600/30">+{exam.students-3}</div>
                        </div>
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter italic">Tracking</span>
                      </div>
                      <button className="w-14 h-14 rounded-[1.5rem] bg-white text-[#020617] hover:bg-indigo-600 hover:text-white transition-all shadow-2xl group-hover:-translate-y-3 flex items-center justify-center translate-z-10 transform-gpu group-hover:shadow-indigo-500/50">
                        <Eye size={24} />
                      </button>
                    </div>
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"></div>
                  </div>
                ))}
              </div>
          </div>

          {/* DECISION CORE (30%) */}
          <div className="flex-1 flex flex-col gap-10 overflow-hidden min-w-[450px]">
            <div className="flex-1 hyper-glass rounded-[4rem] p-12 shadow-2xl backdrop-blur-3xl flex flex-col overflow-hidden relative group">
              <div className="absolute -bottom-40 -left-20 w-80 h-80 bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none group-hover:bg-indigo-600/15 transition-all duration-1000"></div>
              
              <div className="flex items-center justify-between mb-12 shrink-0">
                <h3 className="text-2xl font-black text-white text-outfit italic tracking-tighter uppercase leading-none">Grading queue</h3>
                <span className="px-4 py-2 rounded-2xl bg-indigo-600 text-white text-[9px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-indigo-600/30">High Priority</span>
              </div>

              <div className="flex-1 space-y-10 overflow-y-auto no-scrollbar pb-8 relative z-10">
                {submissions.map((sub, i) => (
                  <div key={i} className="flex gap-6 group/item cursor-pointer relative">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover/item:bg-indigo-500 transition-all duration-500 shadow-xl group-hover/item:shadow-indigo-500/20 group-hover/item:-translate-y-2">
                      <CheckCircle size={30} className="text-slate-700 group-hover/item:text-white transition-colors" />
                    </div>
                    <div className="flex-grow min-w-0 flex flex-col justify-center">
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <p className="text-xl font-black text-white text-outfit tracking-tighter truncate uppercase leading-none">{sub.student}</p>
                        <span className="text-[10px] font-black text-slate-600 font-mono tracking-tighter whitespace-nowrap uppercase opacity-40">{sub.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-bold tracking-[0.2em] truncate uppercase leading-none mb-4 italic group-hover/item:text-indigo-400 transition-colors">{sub.exam}</p>
                      {sub.score === 'Pending' ? (
                        <div className="flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                           <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.3em]">Decision Matrix Required</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left duration-500">
                          <TrendingUp size={14} className="text-emerald-500" />
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] font-mono">{sub.score} Verified</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button className="h-20 w-full mt-6 bg-white/5 border border-white/10 rounded-[2.5rem] font-black text-[10px] text-slate-500 uppercase tracking-[0.5em] transition-all active:scale-95 shadow-2xl hover:bg-white/10 hover:text-white shrink-0">
                Dive into decision matrix
              </button>
            </div>

            <div className="h-64 bg-gradient-to-br from-indigo-700 to-indigo-900 rounded-[3.5rem] p-12 flex flex-col justify-center items-center text-center shadow-3xl shadow-indigo-600/30 group relative overflow-hidden shrink-0">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
               <div className="w-16 h-16 rounded-3xl bg-white text-indigo-700 flex items-center justify-center mb-6 shadow-2xl shadow-black/20 group-hover:scale-110 transition-transform duration-500 translate-z-10">
                 <Zap size={32} fill="currentColor" />
               </div>
               <h4 className="text-2xl font-black text-white text-outfit mb-2 tracking-tighter uppercase italic leading-none">Uplink Protocols</h4>
               <p className="text-indigo-100/60 text-[10px] font-bold tracking-[0.3em] uppercase max-w-xs text-balance">Review tactical documentation for emergency intervention.</p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
