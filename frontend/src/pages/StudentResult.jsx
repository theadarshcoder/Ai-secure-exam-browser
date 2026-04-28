import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Target, 
  Zap, 
  AlertTriangle, 
  Clock, 
  BarChart3,
  CheckCircle2,
  XCircle,
  Shield,
  ArrowRight,
  ShieldCheck,
  LayoutDashboard,
  Code,
  HelpCircle,
  BookOpen
} from 'lucide-react';
import api from '../services/api';

const StudentResult = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResult = async () => {
            try {
                const response = await api.get(`/api/exams/student-result/${examId}`);
                setResult(response.data);
            } catch (err) {
                console.error('Failed to fetch result:', err);
                toast.error(err.response?.data?.message || 'Failed to load results');
                navigate('/student');
            } finally {
                setLoading(false);
            }
        };

        fetchResult();
    }, [examId, navigate]);

    // Group results by Section (e.g., Section A, B, C) or Type
    const groupedResults = useMemo(() => {
        if (!result?.results) return {};
        return result.results.reduce((acc, curr) => {
            // Priority: section property, then fallback to type
            const category = curr.section || curr.type || 'General';
            if (!acc[category]) acc[category] = [];
            acc[category].push(curr);
            return acc;
        }, {});
    }, [result]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="w-10 h-10 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.3em]">Processing Intel</p>
                </motion.div>
            </div>
        );
    }

    if (!result) return null;

    const displayDate = result.submittedAt || result.startedAt;

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-['Outfit'] selection:bg-indigo-100 antialiased pb-20">
            <main className="max-w-6xl mx-auto px-6 py-10 lg:px-8 flex flex-col gap-10">
                
                {/* 1. HEADER SECTION */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100/50">
                                    ExamVault Session
                                </span>
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                    {displayDate ? (
                                        `Completed ${new Date(displayDate).toLocaleDateString()} • ${new Date(displayDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
                                    ) : 'Session Completed'}
                                </span>
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                {result.examTitle}
                            </h1>
                        </div>
                    </div>

                    <button 
                        onClick={() => navigate('/student')}
                        className="flex items-center gap-2.5 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-black transition-all active:scale-[0.97] shadow-lg shadow-slate-900/10 group"
                    >
                        <LayoutDashboard size={14} className="group-hover:rotate-12 transition-transform" />
                        Return to Dashboard
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </header>

                {/* 2. TOP STATS: Bento Grid */}
                <section className="grid grid-cols-2 md:grid-cols-4 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-100">
                    <div className="p-6 flex flex-col justify-between min-h-[130px] hover:bg-slate-50/50 transition-colors">
                        <h2 className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-400">Total Score</h2>
                        <p className="text-3xl font-bold tracking-tight mt-2 text-slate-900">
                            {result.score}<span className="text-xl text-slate-300 ml-1">/{result.totalMarks}</span>
                        </p>
                    </div>
                    <div className="p-6 flex flex-col justify-between min-h-[130px] hover:bg-slate-50/50 transition-colors">
                        <h2 className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-400">Accuracy</h2>
                        <p className="text-3xl font-bold tracking-tight mt-2 text-slate-900">
                            {result.percentage}%
                        </p>
                    </div>
                    <div className="p-6 flex flex-col justify-between min-h-[130px] hover:bg-slate-50/50 transition-colors">
                        <h2 className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-400">Status</h2>
                        <p className={`text-2xl font-bold tracking-tight mt-2 ${result.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {result.passed ? 'Passed' : 'Failed'}
                        </p>
                    </div>
                    <div className="p-6 flex flex-col justify-between min-h-[130px] hover:bg-slate-50/50 transition-colors">
                        <h2 className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-400">Flags</h2>
                        <p className={`text-3xl font-bold tracking-tight mt-2 ${result.violations > 3 ? 'text-rose-600' : 'text-slate-900'}`}>
                            {result.violations || 0}
                        </p>
                    </div>
                </section>

                {/* 3. BOTTOM CONTENT */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* Left Column: Grouped Breakdown */}
                    <section className="lg:col-span-8 flex flex-col gap-12">
                        
                        <div>
                            <h3 className="text-[11px] font-bold tracking-[0.2em] uppercase text-slate-400 mb-8 px-1 flex items-center gap-2">
                                <BarChart3 size={12} className="text-indigo-400" />
                                Section-Wise Performance
                            </h3>
                            
                            <div className="space-y-12">
                                {Object.entries(groupedResults).map(([category, questions]) => (
                                    <div key={category} className="flex flex-col gap-6">
                                        {/* Section Header */}
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center border border-indigo-100/50">
                                                    {category.toLowerCase().includes('coding') ? <Code size={18} /> : 
                                                     category.toLowerCase().includes('section') ? <BookOpen size={18} /> : 
                                                     <HelpCircle size={18} />}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">{category}</h4>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{questions.length} Items</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-slate-900 font-mono tracking-tighter">
                                                    {questions.reduce((sum, q) => sum + q.marksObtained, 0)}<span className="text-slate-300 mx-1">/</span>{questions.reduce((sum, q) => sum + q.maxMarks, 0)}
                                                </p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Section Marks</p>
                                            </div>
                                        </div>

                                        {/* Questions in this Section */}
                                        <div className="flex flex-col space-y-1">
                                            {questions.map((q, i) => (
                                                <div 
                                                    key={i} 
                                                    className="flex items-center justify-between py-4 px-4 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 rounded-2xl transition-all duration-300 -mx-4 group relative overflow-hidden"
                                                >
                                                    {/* Decorative sidebar for status */}
                                                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity ${
                                                        q.status === 'correct' ? 'bg-emerald-500' : q.status === 'incorrect' ? 'bg-rose-500' : 'bg-slate-200'
                                                    }`} />

                                                    <div className="flex items-center gap-5">
                                                        <span className="text-[10px] font-bold text-slate-300 w-6 font-mono group-hover:text-indigo-500 transition-colors">
                                                            {String(i + 1).padStart(2, '0')}
                                                        </span>
                                                        <div className="flex flex-col">
                                                            <span className="text-[13px] font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                                                                {q.questionText || `Evaluation Item ${i+1}`}
                                                            </span>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.1em]">{q.type}</span>
                                                                {q.status === 'correct' && (
                                                                    <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border border-emerald-100/50">
                                                                        <CheckCircle2 size={8} />
                                                                        Verified
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-8">
                                                        <div className="flex items-center gap-1.5 text-slate-300 group-hover:text-slate-400 transition-colors">
                                                            <Clock size={11} />
                                                            <span className="text-[10px] font-bold font-mono">{q.timeSpent || '--'}s</span>
                                                        </div>
                                                        <div className="flex flex-col items-end min-w-[60px]">
                                                            <span className="text-sm font-bold text-slate-900 font-mono tracking-tighter">
                                                                {q.marksObtained}<span className="text-slate-300 mx-0.5">/</span>{q.maxMarks}
                                                            </span>
                                                            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-none">Score</span>
                                                        </div>
                                                        <div className="w-5 h-5 flex items-center justify-center">
                                                            {q.status === 'correct' ? (
                                                                <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100/50">
                                                                    <CheckCircle2 size={13} />
                                                                </div>
                                                            ) : q.status === 'incorrect' ? (
                                                                <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100/50">
                                                                    <XCircle size={13} />
                                                                </div>
                                                            ) : (
                                                                <div className="w-4 h-4 rounded-full border border-slate-200" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </section>

                    {/* Right Column */}
                    <aside className="lg:col-span-4 flex flex-col gap-6">
                        {/* Security Report */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-6">
                                <Shield size={14} className="text-slate-400" />
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Security Audit</h4>
                            </div>
                            
                            <div className="space-y-1 divide-y divide-slate-100/60 font-mono">
                                <div className="flex justify-between items-center py-4">
                                    <span className="text-[11px] font-bold text-slate-500 font-sans">Integrity</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${result.violations > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                        {result.violations === 0 ? 'SECURE' : `${result.violations} FLAGS`}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-4">
                                    <span className="text-[11px] font-bold text-slate-500 font-sans">Focus Deviations</span>
                                    <span className="text-[10px] font-bold text-slate-800">{result.tabSwitches || 0} UNITS</span>
                                </div>
                                <div className="flex justify-between items-center py-4 border-none!">
                                    <span className="text-[11px] font-bold text-slate-500 font-sans">Submission</span>
                                    <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">{result.status.includes('auto') ? 'SYNC' : 'USER'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Verification Badge Card */}
                        <div className="bg-white border border-indigo-100 p-5 rounded-2xl flex items-center gap-4 shadow-sm shadow-indigo-500/5">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest">Verified Session</p>
                                <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">Digitally signed for official certification.</p>
                            </div>
                        </div>

                        {/* Active Monitor Footer */}
                        <div className="flex items-center justify-center gap-3 py-2 opacity-30">
                            <div className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">Monitoring Active</span>
                        </div>
                    </aside>
                </div>

            </main>
        </div>
    );
};

export default StudentResult;
