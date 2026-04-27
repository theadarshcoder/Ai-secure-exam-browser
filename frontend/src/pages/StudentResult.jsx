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
            <div className="min-h-screen bg-page flex items-center justify-center relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-[120px] animate-pulse" />
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-6 relative z-10"
                >
                    <div className="w-16 h-16 border-4 border-main border-t-primary-500 rounded-2xl animate-spin shadow-2xl shadow-primary-500/20" />
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-primary font-black uppercase text-[11px] tracking-[0.4em] animate-pulse">Analyzing Metrics</p>
                        <div className="w-32 h-1 bg-main rounded-full overflow-hidden">
                            <motion.div 
                                className="h-full bg-primary-500" 
                                animate={{ x: [-128, 128] }} 
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} 
                            />
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (!result) return null;

    const displayDate = result.submittedAt || result.startedAt;

    return (
        <div className="min-h-screen bg-page text-primary font-['Outfit'] selection:bg-primary-500/20 antialiased pb-24 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-primary-500/[0.03] to-transparent pointer-events-none" />
            
            <main className="max-w-7xl mx-auto px-8 py-16 lg:px-12 flex flex-col gap-12 relative z-10">
                
                {/* 1. HEADER SECTION */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 px-3 py-1 bg-primary-500/10 border border-primary-500/20 rounded-full shadow-lg shadow-primary-500/5">
                                    <ShieldCheck size={12} className="text-primary-500" />
                                    <span className="text-[9px] font-black tracking-[0.2em] uppercase text-primary-500">
                                        Validated Protocol Session
                                    </span>
                                </div>
                                <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em] opacity-50">
                                    {displayDate ? (
                                        `Concluded ${new Date(displayDate).toLocaleDateString()} • ${new Date(displayDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
                                    ) : 'Protocol Terminated'}
                                </span>
                            </div>
                            <h1 className="text-5xl font-black tracking-tighter text-primary uppercase leading-none">
                                {result.examTitle}
                            </h1>
                        </div>
                    </div>

                    <button 
                        onClick={() => navigate('/student')}
                        className="flex items-center gap-4 px-8 h-14 bg-surface border border-main text-primary rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-surface-hover hover:border-primary-500/30 transition-all active:scale-95 shadow-2xl group/btn"
                    >
                        <LayoutDashboard size={16} className="group-hover/btn:rotate-12 transition-transform duration-500" />
                        Access Terminal
                        <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform duration-500" />
                    </button>
                </header>

                {/* 2. TOP STATS: Bento Grid */}
                <section className="grid grid-cols-2 md:grid-cols-4 bg-surface border border-main rounded-[2.5rem] shadow-2xl overflow-hidden divide-y md:divide-y-0 md:divide-x divide-main">
                    <div className="p-10 flex flex-col justify-between min-h-[160px] hover:bg-surface-hover/50 transition-all duration-500 group/stat">
                        <h2 className="text-[10px] font-black tracking-[0.3em] uppercase text-muted group-hover/stat:text-primary-500 transition-colors">Efficiency Score</h2>
                        <p className="text-5xl font-black tracking-tighter mt-4 text-primary uppercase leading-none">
                            {result.score}<span className="text-2xl text-muted/30 ml-2">/{result.totalMarks}</span>
                        </p>
                    </div>
                    <div className="p-10 flex flex-col justify-between min-h-[160px] hover:bg-surface-hover/50 transition-all duration-500 group/stat">
                        <h2 className="text-[10px] font-black tracking-[0.3em] uppercase text-muted group-hover/stat:text-primary-500 transition-colors">Accuracy Rate</h2>
                        <p className="text-5xl font-black tracking-tighter mt-4 text-primary uppercase leading-none">
                            {result.percentage}%
                        </p>
                    </div>
                    <div className="p-10 flex flex-col justify-between min-h-[160px] hover:bg-surface-hover/50 transition-all duration-500 group/stat">
                        <h2 className="text-[10px] font-black tracking-[0.3em] uppercase text-muted group-hover/stat:text-primary-500 transition-colors">Protocol Outcome</h2>
                        <p className={`text-4xl font-black tracking-tighter mt-4 uppercase leading-none ${result.passed ? 'text-emerald-500 shadow-emerald-500/20' : 'text-red-500 shadow-red-500/20'}`}>
                            {result.passed ? 'Validated' : 'Failed'}
                        </p>
                    </div>
                    <div className="p-10 flex flex-col justify-between min-h-[160px] hover:bg-surface-hover/50 transition-all duration-500 group/stat">
                        <h2 className="text-[10px] font-black tracking-[0.3em] uppercase text-muted group-hover/stat:text-primary-500 transition-colors">Integrity Flags</h2>
                        <p className={`text-5xl font-black tracking-tighter mt-4 uppercase leading-none ${result.violations > 3 ? 'text-red-500' : 'text-primary'}`}>
                            {result.violations || 0}
                        </p>
                    </div>
                </section>

                {/* 3. BOTTOM CONTENT */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* Left Column: Grouped Breakdown */}
                    <section className="lg:col-span-8 flex flex-col gap-16">
                        
                        <div>
                            <h3 className="text-[11px] font-black tracking-[0.4em] uppercase text-muted mb-10 px-2 flex items-center gap-3">
                                <BarChart3 size={14} className="text-primary-500" />
                                Section Performance Telemetry
                            </h3>
                            
                            <div className="space-y-16">
                                {Object.entries(groupedResults).map(([category, questions]) => (
                                    <div key={category} className="flex flex-col gap-8">
                                        {/* Section Header */}
                                        <div className="flex items-center justify-between border-b border-main pb-6">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-[1.25rem] bg-surface-hover text-primary flex items-center justify-center border border-main shadow-lg shadow-black/20">
                                                    {category.toLowerCase().includes('coding') ? <Code size={20} strokeWidth={2.5} /> : 
                                                     category.toLowerCase().includes('section') ? <BookOpen size={20} strokeWidth={2.5} /> : 
                                                     <HelpCircle size={20} strokeWidth={2.5} />}
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-black text-primary uppercase tracking-tight">{category}</h4>
                                                    <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] opacity-50 mt-1">{questions.length} Protocols Analyzed</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-primary tracking-tighter uppercase">
                                                    {questions.reduce((sum, q) => sum + q.marksObtained, 0)}<span className="text-muted/30 mx-2">/</span>{questions.reduce((sum, q) => sum + q.maxMarks, 0)}
                                                </p>
                                                <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em] opacity-50">Efficiency Units</p>
                                            </div>
                                        </div>

                                        {/* Questions in this Section */}
                                        <div className="flex flex-col space-y-3">
                                            {questions.map((q, i) => (
                                                <div 
                                                    key={i} 
                                                    className="flex items-center justify-between py-6 px-6 bg-surface border border-main hover:border-primary-500/30 rounded-[2rem] transition-all duration-500 group relative overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-primary-500/5"
                                                >
                                                    <div className="flex items-center gap-6">
                                                        <span className="text-[11px] font-black text-muted/30 w-8 group-hover:text-primary-500 transition-colors duration-500">
                                                            {String(i + 1).padStart(2, '0')}
                                                        </span>
                                                        <div className="flex flex-col gap-1.5">
                                                            <span className="text-sm font-black text-primary group-hover:text-primary-500 transition-colors duration-500 uppercase tracking-tight">
                                                                {q.questionText || `Evaluation Item ${i+1}`}
                                                            </span>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[9px] font-black text-muted uppercase tracking-[0.2em] opacity-50">{q.type}</span>
                                                                {q.status === 'correct' && (
                                                                    <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] border border-emerald-500/20">
                                                                        <CheckCircle2 size={10} strokeWidth={3} />
                                                                        Verified
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-10">
                                                        <div className="hidden sm:flex items-center gap-2 text-muted/40 group-hover:text-muted transition-colors">
                                                            <Clock size={12} strokeWidth={2.5} />
                                                            <span className="text-[11px] font-black">{q.timeSpent || '--'}S</span>
                                                        </div>
                                                        <div className="flex flex-col items-end min-w-[80px]">
                                                            <span className="text-lg font-black text-primary tracking-tighter uppercase">
                                                                {q.marksObtained}<span className="text-muted/30 mx-1">/</span>{q.maxMarks}
                                                            </span>
                                                            <span className="text-[8px] font-black text-muted uppercase tracking-[0.2em] opacity-50 leading-none">Yield</span>
                                                        </div>
                                                        <div className="w-10 h-10 flex items-center justify-center">
                                                            {q.status === 'correct' ? (
                                                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                                                                    <CheckCircle2 size={18} strokeWidth={2.5} />
                                                                </div>
                                                            ) : q.status === 'incorrect' ? (
                                                                <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 shadow-lg shadow-red-500/10">
                                                                    <XCircle size={18} strokeWidth={2.5} />
                                                                </div>
                                                            ) : (
                                                                <div className="w-6 h-6 rounded-lg border-2 border-main" />
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
                    <aside className="lg:col-span-4 flex flex-col gap-8">
                        {/* Security Report */}
                        <div className="bg-surface p-8 rounded-[2.5rem] border border-main shadow-2xl relative overflow-hidden group/audit">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover/audit:bg-primary-500/10 transition-colors duration-700" />
                            
                            <div className="flex items-center gap-3 mb-8 relative z-10">
                                <Shield size={16} className="text-primary-500" strokeWidth={2.5} />
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted group-hover/audit:text-primary transition-colors">Security Intelligence</h4>
                            </div>
                            
                            <div className="space-y-2 divide-y divide-main font-black relative z-10">
                                <div className="flex justify-between items-center py-5">
                                    <span className="text-[11px] text-muted uppercase tracking-[0.2em]">Session Integrity</span>
                                    <span className={`text-[10px] px-3 py-1 rounded-lg border font-black uppercase tracking-widest ${result.violations > 0 ? 'bg-red-500/10 text-red-500 border-red-500/20 shadow-lg shadow-red-500/10' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-lg shadow-emerald-500/10'}`}>
                                        {result.violations === 0 ? 'COMPLIANT' : `${result.violations} ANOMALIES`}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-5">
                                    <span className="text-[11px] text-muted uppercase tracking-[0.2em]">Focus Deviations</span>
                                    <span className="text-[10px] text-primary uppercase tracking-[0.1em] font-mono">{result.tabSwitches || 0} UNITS</span>
                                </div>
                                <div className="flex justify-between items-center py-5 border-none!">
                                    <span className="text-[11px] text-muted uppercase tracking-[0.2em]">Sync Protocol</span>
                                    <span className="text-[10px] text-primary uppercase tracking-[0.2em]">{result.status.includes('auto') ? 'SYSTEM_FINAL' : 'USER_MANUAL'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Verification Badge Card */}
                        <div className="bg-surface-hover/50 border border-primary-500/20 p-6 rounded-[2rem] flex items-center gap-5 shadow-2xl group/badge">
                            <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 border border-primary-500/20 shadow-xl shadow-primary-500/5 group-hover/badge:rotate-12 transition-transform duration-500">
                                <ShieldCheck size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-primary-500 uppercase tracking-[0.2em]">Encrypted Session</p>
                                <p className="text-[10px] text-muted font-black uppercase tracking-widest leading-tight mt-1 opacity-50">Digitally Signed Protocol</p>
                            </div>
                        </div>

                        {/* Active Monitor Footer */}
                        <div className="flex items-center justify-center gap-4 py-4 opacity-30">
                            <div className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-[0.5em] text-muted">Surveillance Node Active</span>
                        </div>
                    </aside>
                </div>

            </main>
        </div>
    );
};

export default StudentResult;
