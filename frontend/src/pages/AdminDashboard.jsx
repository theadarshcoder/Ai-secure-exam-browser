import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { 
  Users, Settings, Database, Shield, 
  Activity, AlertTriangle, CheckCircle2, 
  Search, ArrowUpRight, ArrowDownRight,
  MoreVertical, Bell, Globe, Server, 
  Cpu, Zap, Terminal, Lock, HardDrive,
  BarChart3, Layers
} from 'lucide-react';

export default function AdminDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const stats = [
    { label: 'Global Candidates', value: '1,284', change: '+12%', icon: <Users />, trend: 'up', color: 'indigo' },
    { label: 'Active Matrix', value: '42', change: '-5%', icon: <Zap />, trend: 'down', color: 'emerald' },
    { label: 'Integrity Alerts', value: '03', change: 'Stable', icon: <Shield />, trend: 'neutral', color: 'rose' },
    { label: 'Core Capacity', value: '84%', change: '+2%', icon: <HardDrive />, trend: 'up', color: 'amber' },
  ];

  const sessions = [
    { id: 'S-2938', entity: 'John Doe', node: 'Edge-US-East', status: 'Secure', activity: 'Active' },
    { id: 'S-2940', entity: 'Sarah Smith', node: 'Edge-EU-West', status: 'Warning', activity: 'Idle' },
    { id: 'S-2942', entity: 'System Core', node: 'Primary-Cloud', status: 'Optimal', activity: 'Maintenance' },
    { id: 'S-2945', entity: 'Tanay Goyal', node: 'Edge-IN-South', status: 'Secure', activity: 'Active' },
  ];

  return (
    <div className="h-screen w-full bg-[#020617] font-['Inter'] text-slate-400 selection:bg-indigo-500/30 overflow-hidden flex flex-col antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=Outfit:wght@500;700;900&family=JetBrains+Mono:wght@400;700&display=swap');
        
        .hyper-glass {
          background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);
          backdrop-filter: blur(40px);
          border: 1px solid rgba(255,255,255,0.05);
        }
        .text-outfit { font-family: 'Outfit', sans-serif; }
        .text-mono { font-family: 'JetBrains Mono', monospace; }
        .glow-indigo { box-shadow: 0 0 40px -10px rgba(99, 102, 241, 0.3); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.2); border-radius: 10px; }
      `}</style>

      <Navbar role="Administrator" />
      
      <main className="flex-1 max-w-[1800px] w-full mx-auto px-10 pt-28 pb-10 overflow-hidden flex flex-col gap-10">
        
        {/* HYPER-HEADER */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-10 shrink-0">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
               <div className="px-4 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-[0.4em] shadow-lg shadow-indigo-500/5">
                 System_Overlord v10.0
               </div>
               <div className="h-4 w-px bg-white/5"></div>
               <div className="flex items-center gap-2 text-slate-600 font-mono text-[9px] tracking-[0.3em] uppercase">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                 Global Sync: {currentTime}
               </div>
            </div>
            <h1 className="text-6xl font-black text-white text-outfit tracking-tighter leading-none uppercase italic">
              Hyper <span className="text-indigo-500 not-italic">Command</span>
            </h1>
            <p className="text-slate-500 font-medium max-w-2xl text-sm leading-relaxed tracking-wide opacity-80">
              Pinnacle oversight orchestration. Monitoring <span className="text-indigo-400">14 Edge Nodes</span> and <span className="text-indigo-400">843 concurrently encrypted</span> data streams across the global neural grid.
            </p>
          </div>
          
          <div className="flex items-center gap-4 py-2 px-2 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-2xl">
            <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer transition-all shadow-xl shadow-indigo-600/20 active:scale-95 group">
              <Zap size={16} fill="currentColor" className="group-hover:rotate-12 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Deploy Optimization</span>
            </div>
            <div className="h-8 w-px bg-white/10"></div>
            <button className="p-4 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
              <Layers size={20} />
            </button>
            <button className="p-4 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* METRICS HUD */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 shrink-0">
          {stats.map((stat, idx) => (
            <div key={idx} className="hyper-glass p-8 rounded-[3rem] relative overflow-hidden group hover:-translate-y-2 transition-all duration-700">
               <div className="absolute -top-10 -right-10 p-12 opacity-5 scale-150 group-hover:scale-[2.5] transition-transform duration-1000 text-white">
                 {stat.icon}
               </div>
               <div className="flex items-center justify-between mb-10 relative z-10">
                 <div className={`w-16 h-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center border border-white/10 text-white group-hover:bg-indigo-600 group-hover:border-indigo-500 transition-all duration-500 shadow-2xl group-hover:shadow-indigo-500/50`}>
                   {React.cloneElement(stat.icon, { size: 28 })}
                 </div>
                 <div className={`flex items-center gap-1.5 text-[9px] font-black px-3 py-1.5 rounded-full border border-white/5 bg-white/5 ${
                   stat.trend === 'up' ? 'text-emerald-400' : 
                   stat.trend === 'down' ? 'text-rose-400' : 'text-slate-500'
                 }`}>
                   {stat.trend === 'up' ? <ArrowUpRight size={12} /> : stat.trend === 'down' ? <ArrowDownRight size={12} /> : <Activity size={12} />}
                   {stat.change}
                 </div>
               </div>
               <h3 className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em] mb-2">{stat.label}</h3>
               <p className="text-4xl font-black text-white text-outfit tracking-tighter leading-none">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* CORE TELEMETRY PANEL */}
        <div className="flex-1 flex flex-col xl:flex-row gap-10 overflow-hidden min-h-0">
          
          {/* TACTICAL STREAM (70%) */}
          <div className="flex-[2] hyper-glass rounded-[4rem] overflow-hidden flex flex-col shadow-2xl">
             <div className="p-10 border-b border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Terminal size={20} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white text-outfit leading-none mb-1 uppercase italic tracking-tighter">Tactical Stream</h2>
                    <p className="text-slate-600 text-[9px] font-bold uppercase tracking-[0.4em] font-mono">Encrypted Node Telemetry // LIVE</p>
                  </div>
                </div>
                <div className="relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={16} />
                  <input 
                    type="text" 
                    placeholder="SCAN_IDENTITIES..." 
                    className="bg-white/5 border border-white/5 rounded-2xl pl-14 pr-8 py-4 text-[10px] font-black uppercase tracking-[0.25em] focus:bg-white/10 outline-none w-72 transition-all placeholder:opacity-30"
                  />
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 custom-scrollbar">
               <table className="w-full text-left border-separate border-spacing-y-4">
                 <thead>
                   <tr className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">
                     <th className="px-10 py-4">Node_ID</th>
                     <th className="px-10 py-4">Entity</th>
                     <th className="px-10 py-4">Protocol</th>
                     <th className="px-10 py-4 text-right">Integrity</th>
                   </tr>
                 </thead>
                 <tbody>
                   {sessions.map((sub, i) => (
                     <tr key={i} className="group hover:bg-white/5 transition-all cursor-crosshair">
                       <td className="px-10 py-6 font-mono text-xs text-indigo-400 font-bold bg-white/5 rounded-l-[2rem] border-y border-l border-white/5">{sub.id}</td>
                       <td className="px-10 py-6 border-y border-white/5">
                         <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-[10px] font-black shadow-xl shadow-indigo-500/20">
                             {sub.entity.charAt(0)}
                           </div>
                           <span className="text-sm font-black text-white tracking-tight uppercase italic">{sub.entity}</span>
                         </div>
                       </td>
                       <td className="px-10 py-6 border-y border-white/5 text-slate-600 text-[10px] font-bold font-mono tracking-widest">{sub.node}</td>
                       <td className="px-10 py-6 border-y border-r border-white/5 rounded-r-[2rem] text-right">
                         <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${
                           sub.status === 'Secure' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' :
                           sub.status === 'Warning' ? 'border-rose-500/20 text-rose-400 bg-rose-500/5' : 'border-indigo-500/20 text-indigo-400 bg-indigo-500/5'
                         }`}>
                           <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                             sub.status === 'Secure' ? 'bg-emerald-500' :
                             sub.status === 'Warning' ? 'bg-rose-500' : 'bg-indigo-500'
                           }`} />
                           {sub.status}
                         </span>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
             
             <button className="h-20 text-center text-[9px] font-black text-slate-600 uppercase tracking-[0.5em] border-t border-white/5 hover:bg-white/5 hover:text-white transition-all group flex items-center justify-center gap-4">
                <BarChart3 size={14} className="group-hover:scale-150 transition-transform" />
                <span>Execute Complete Audit Uplink</span>
             </button>
          </div>

          {/* VITAL OVERLAY (30%) */}
          <div className="flex-1 flex flex-col gap-10 overflow-hidden min-w-[400px]">
            <div className="flex-1 hyper-glass rounded-[4rem] p-10 flex flex-col shadow-2xl overflow-hidden group relative">
               <div className="absolute -top-40 -left-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-indigo-600/20 transition-all duration-1000"></div>
               
               <div className="flex items-center justify-between mb-12 shrink-0">
                 <h3 className="text-xl font-black text-white text-outfit italic tracking-tighter uppercase leading-none">Vitals</h3>
                 <div className="flex h-6 items-center gap-1">
                    {[1,2,3,4,5].map(i => <div key={i} className="w-1 bg-indigo-500/40 rounded-full animate-bounce" style={{height: `${Math.random()*100}%`, animationDelay: `${i*0.1}s`}}></div>)}
                 </div>
               </div>

               <div className="flex-1 space-y-10 overflow-y-auto no-scrollbar pb-6 relative z-10">
                 <div className="space-y-4 group/vital">
                   <div className="flex items-center justify-between text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] group-hover/vital:text-white transition-colors">
                     <div className="flex items-center gap-3"><Server size={14} className="text-emerald-500" /> Latency_Matrix</div>
                     <span className="text-emerald-400 font-mono tracking-tighter">18ms_Nominal</span>
                   </div>
                   <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-[2px]">
                     <div className="h-full bg-emerald-500 w-[24%] rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)]"></div>
                   </div>
                 </div>

                 <div className="space-y-4 group/vital">
                   <div className="flex items-center justify-between text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] group-hover/vital:text-white transition-colors">
                     <div className="flex items-center gap-3"><Cpu size={14} className="text-indigo-500" /> Neural_Load</div>
                     <span className="text-indigo-400 font-mono tracking-tighter">Core_Optimal</span>
                   </div>
                   <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-[2px]">
                     <div className="h-full bg-indigo-500 w-[89%] rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>
                   </div>
                 </div>

                 <div className="space-y-4 group/vital">
                   <div className="flex items-center justify-between text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] group-hover/vital:text-white transition-colors">
                     <div className="flex items-center gap-3"><Globe size={14} className="text-rose-500" /> Global_Nodes</div>
                     <span className="text-rose-400 font-mono tracking-tighter">1_Offline</span>
                   </div>
                   <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-[2px]">
                     <div className="h-full bg-rose-500 w-[65%] rounded-full shadow-[0_0_20px_rgba(244,63,94,0.5)]"></div>
                   </div>
                 </div>
               </div>

               <div className="mt-8 flex items-center gap-5 p-6 bg-white/5 rounded-[2rem] border border-white/10 shrink-0 group hover:border-emerald-500/20 transition-all">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <Lock size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-white uppercase tracking-widest leading-none mb-2 italic">ARES-DEFENSE v4.0</p>
                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter whitespace-nowrap">Active Protocols: 14 // Secure</p>
                  </div>
               </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
