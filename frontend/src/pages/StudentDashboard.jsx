import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { 
  PlayCircle, History, BookOpen, ShieldCheck, 
  Trophy, Star, ArrowRight, Clock,
  CheckCircle2, HelpCircle, GraduationCap
} from 'lucide-react';

export default function StudentDashboard() {
  const navigate = useNavigate();

  const mockStats = [
    { label: 'Exams Completed', value: '12', icon: <CheckCircle2 className="text-emerald-500" />, color: 'bg-emerald-50' },
    { label: 'Average Score', value: '88%', icon: <Trophy className="text-amber-500" />, color: 'bg-amber-50' },
    { label: 'Global Rank', value: '#42', icon: <Star className="text-indigo-500" />, color: 'bg-indigo-50' },
  ];

  const recentExams = [
    { title: 'Computer Science 101', date: '2 days ago', score: '94/100', status: 'Graded' },
    { title: 'Discrete Mathematics', date: '1 week ago', score: '82/100', status: 'Graded' },
  ];

  return (
    <div className="min-h-screen bg-[#fcfdfe] font-sans pb-20">
      <Navbar role="Student" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Welcome Block */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          <div className="flex-grow bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.04)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 text-slate-50 group-hover:text-indigo-50 transition-colors">
              <GraduationCap size={120} strokeWidth={1} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-100/50">Candidate Hub</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-tight">ID: PROCTO-89241</span>
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight mb-3">Welcome back,<br /><span className="text-indigo-600">Adarsh Maurya</span></h1>
              <p className="text-slate-500 text-sm font-medium max-w-md leading-relaxed mb-8">Your next big assessment is just around the corner. Stay sharp and follow the integrity protocols.</p>
              
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => navigate('/exam/E7X9-PQR2-LMN0')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-3 group/btn"
                >
                  <PlayCircle size={20} className="group-hover/btn:rotate-12 transition-transform" />
                  Launch Assigned Exam
                </button>
                <button className="bg-white border border-slate-200 text-slate-600 px-8 py-4 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all active:scale-95">
                  View Schedule
                </button>
              </div>
            </div>
          </div>

          <div className="w-full md:w-80 space-y-4">
            {mockStats.map((stat, i) => (
              <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
                <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center shrink-0 border border-current opacity-20 group-hover:opacity-100 transition-opacity duration-500`}>
                  {React.cloneElement(stat.icon, { size: 24, className: "" })}
                </div>
                <div>
                  <h4 className="text-2xl font-black text-slate-900 leading-none mb-1">{stat.value}</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <div className="lg:col-span-8 space-y-10">
            {/* Honor Code Banner */}
            <div className="bg-gradient-to-r from-emerald-500/5 to-transparent border border-emerald-100/50 p-8 rounded-[2.5rem] flex items-center gap-6 relative overflow-hidden">
              <div className="w-16 h-16 rounded-2xl bg-white text-emerald-600 flex items-center justify-center shadow-sm border border-emerald-100/50 shrink-0">
                <ShieldCheck size={32} />
              </div>
              <div className="relative z-10">
                <h3 className="font-bold text-emerald-900 text-lg mb-1">Integrity is your greatest asset.</h3>
                <p className="text-sm text-emerald-800/70 font-medium leading-relaxed max-w-xl">
                  ProctoShield ensures a fair environment for everyone. Good luck with your upcoming assessments!
                </p>
              </div>
              <div className="absolute -right-4 -bottom-4 text-emerald-600/5">
                <ShieldCheck size={140} />
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Education Hub</h2>
                <div className="h-px flex-grow bg-slate-100 mx-6 opacity-50"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer" onClick={() => navigate('/exam/E7X9-PQR2-LMN0')}>
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <History size={28} />
                  </div>
                  <h3 className="font-black text-lg text-slate-900 mb-2">Pending Exams</h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">You have 1 assigned exam available. Click here to start the proctoring sequence.</p>
                  <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest group-hover:gap-3 transition-all">
                    Start Session <ArrowRight size={14} />
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <BookOpen size={28} />
                  </div>
                  <h3 className="font-black text-lg text-slate-900 mb-2">Study Library</h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">Access mock tests, preparation guidelines, and technical documentation.</p>
                  <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest group-hover:gap-3 transition-all">
                    Explore Resources <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            {/* History Sidebar */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm h-full">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Recent Activity</h3>
                <History size={18} className="text-slate-300" />
              </div>

              <div className="space-y-8">
                {recentExams.map((exam, i) => (
                  <div key={i} className="relative pl-6 before:absolute before:left-0 before:top-1.5 before:bottom-0 before:w-[2px] before:bg-slate-100 last:before:display-none">
                    <div className="absolute left-[-4px] top-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-indigo-50"></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{exam.date}</p>
                    <h4 className="text-sm font-bold text-slate-800 mb-1 leading-tight">{exam.title}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black text-indigo-600">{exam.score}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{exam.status}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 p-6 rounded-3xl bg-indigo-900 text-white relative overflow-hidden group cursor-pointer">
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                <HelpCircle className="mb-4 text-indigo-300" size={24} />
                <h4 className="font-bold text-sm mb-1 leading-tight">Need Assistance?</h4>
                <p className="text-indigo-200/60 text-[10px] font-medium leading-relaxed mb-4">Contact your institutional mentor for exam support.</p>
                <div className="flex items-center gap-1.5 font-black text-[9px] uppercase tracking-widest">
                  Open Support Desk <ArrowRight size={10} />
                </div>
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
