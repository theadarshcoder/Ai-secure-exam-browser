import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  Trophy, 
  Target, 
  Zap, 
  AlertTriangle, 
  ChevronRight, 
  Clock, 
  BarChart3,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle
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
                const response = await api.get(`/exams/student-result/${examId}`);
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

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-slate-800/30 border-t-slate-800 rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-medium animate-pulse">Calculating your achievements...</p>
                </div>
            </div>
        );
    }

    if (!result) return null;

    const stats = [
        { 
            label: 'Total Score', 
            value: `${result.score}/${result.totalMarks}`, 
            icon: Trophy, 
            color: 'text-amber-400', 
            bg: 'bg-amber-400/10' 
        },
        { 
            label: 'Percentage', 
            value: `${result.percentage}%`, 
            icon: Target, 
            color: 'text-emerald-400', 
            bg: 'bg-emerald-400/10' 
        },
        { 
            label: 'Result', 
            value: result.passed ? 'PASSED' : 'FAILED', 
            icon: result.passed ? CheckCircle2 : XCircle, 
            color: result.passed ? 'text-emerald-400' : 'text-red-400', 
            bg: result.passed ? 'bg-emerald-400/10' : 'bg-red-400/10' 
        },
        { 
            label: 'Violations', 
            value: result.violations || 0, 
            icon: AlertTriangle, 
            color: result.violations > 3 ? 'text-red-400' : 'text-slate-400', 
            bg: result.violations > 3 ? 'bg-red-400/10' : 'bg-slate-400/10' 
        }
    ];

    return (
        <div className="min-h-screen bg-[#0a0c10] text-white p-6 md:p-12">
            <div className="max-w-5xl mx-auto space-y-12">
                
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <button 
                            onClick={() => navigate('/student')}
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-sm font-medium">Back to Dashboard</span>
                        </button>
                        <h1 className="text-4xl font-black tracking-tight">{result.examTitle}</h1>
                        <p className="text-slate-500 mt-2 flex items-center gap-2 uppercase tracking-widest text-[10px] font-bold">
                            <Clock className="w-3 h-3" />
                            Submitted on {new Date(result.submittedAt).toLocaleDateString()} at {new Date(result.submittedAt).toLocaleTimeString()}
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                        <div className="text-right">
                            <p className="text-[10px] uppercase tracking-widest font-black text-slate-500">Status</p>
                            <p className={`font-bold uppercase ${result.status === 'pending_review' ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {result.status.replace('_', ' ')}
                            </p>
                        </div>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${result.status === 'pending_review' ? 'bg-amber-400/10' : 'bg-emerald-400/10'}`}>
                            {result.status === 'pending_review' ? <AlertCircle className="w-6 h-6 text-amber-400" /> : <BarChart3 className="w-6 h-6 text-emerald-400" />}
                        </div>
                    </div>
                </header>

                {/* Score Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-colors">
                            <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Section Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    <div className="lg:col-span-2 space-y-6">
                        <h3 className="text-xl font-bold flex items-center gap-3">
                            <BarChart3 className="w-5 h-5 text-slate-700" />
                            Section Performance
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(result.sectionStats || {}).map(([type, data]) => (
                                <div key={type} className="bg-slate-900/30 p-5 rounded-2xl border border-white/5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="uppercase tracking-widest text-[10px] font-black text-slate-500">{type} QUESTIONS</div>
                                        <div className="text-xs font-bold text-slate-700">{Math.round((data.marks / (data.total * 5)) * 100)}%</div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div className="text-2xl font-black">{data.correct}/{data.total}</div>
                                            <div className="text-[10px] text-slate-500 font-bold mb-1">CORRECT</div>
                                        </div>
                                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-slate-800 rounded-full transition-all duration-1000" 
                                                style={{ width: `${(data.correct / data.total) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Question Breakdown List */}
                        <div className="space-y-4 mt-8">
                            <h3 className="text-xl font-bold flex items-center gap-3">
                                <Zap className="w-5 h-5 text-slate-700" />
                                Attempt Summary
                            </h3>
                            <div className="space-y-2">
                                {result.results.map((q, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-slate-900/20 rounded-xl border border-white/5 group hover:bg-slate-900/40 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                                                q.status === 'correct' ? 'bg-emerald-400/10 text-emerald-400' : 
                                                q.status === 'incorrect' ? 'bg-red-400/10 text-red-400' : 
                                                'bg-slate-700/50 text-slate-400'
                                            }`}>
                                                {i + 1}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium line-clamp-1">{q.questionText}</p>
                                                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black mt-0.5">{q.type}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-[10px] uppercase tracking-widest font-black text-slate-600">Marks</p>
                                                <p className="text-xs font-bold">{q.marksObtained}/{q.maxMarks}</p>
                                            </div>
                                            {q.status === 'correct' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : 
                                             q.status === 'incorrect' ? <XCircle className="w-5 h-5 text-red-400" /> : 
                                             <Clock className="w-5 h-5 text-slate-600" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Proctoring & Summary */}
                    <div className="space-y-6">
                        <div className="bg-slate-900 p-8 rounded-[2rem] text-white overflow-hidden relative group">
                            <div className="relative z-10">
                                <h4 className="text-lg font-bold mb-2">Great Work!</h4>
                                <p className="text-slate-200 text-sm leading-relaxed mb-6">
                                    You have completed the exam. Your results are being processed and stored for certification.
                                </p>
                                <button 
                                    onClick={() => navigate('/student')}
                                    className="w-full bg-white text-slate-900 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:shadow-xl transition-all active:scale-95"
                                >
                                    Return Home
                                </button>
                            </div>
                            <Trophy className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12 group-hover:scale-110 transition-transform duration-700" />
                        </div>

                        <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5">
                            <h4 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6 underline decoration-slate-800 decoration-2 underline-offset-8">
                                Security Report
                            </h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-xs text-slate-400">Anti-Cheat Flags</span>
                                    <span className={`text-xs font-bold ${result.violations > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {result.violations === 0 ? 'CLEAN' : `${result.violations} INCIDENTS`}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-white/5">
                                    <span className="text-xs text-slate-400">Tab Focus Loss</span>
                                    <span className="text-xs font-bold text-slate-200">{result.tabSwitches || 0} Switches</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-xs text-slate-400">Submission Mode</span>
                                    <span className="text-xs font-bold text-slate-200 uppercase">{result.status.includes('auto') ? 'Automatic' : 'Manual'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default StudentResult;
