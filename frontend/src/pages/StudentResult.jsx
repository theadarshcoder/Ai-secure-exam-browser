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

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
                    <p className="text-slate-600 font-medium animate-pulse">Calculating your achievements...</p>
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
            color: 'text-amber-600', 
            bg: 'bg-amber-50' 
        },
        { 
            label: 'Percentage', 
            value: `${result.percentage}%`, 
            icon: Target, 
            color: 'text-emerald-600', 
            bg: 'bg-emerald-50' 
        },
        { 
            label: 'Result', 
            value: result.passed ? 'PASSED' : 'FAILED', 
            icon: result.passed ? CheckCircle2 : XCircle, 
            color: result.passed ? 'text-emerald-600' : 'text-red-600', 
            bg: result.passed ? 'bg-emerald-50' : 'bg-red-50' 
        },
        { 
            label: 'Violations', 
            value: result.violations || 0, 
            icon: AlertTriangle, 
            color: result.violations > 3 ? 'text-red-600' : 'text-slate-600', 
            bg: result.violations > 3 ? 'bg-red-50' : 'bg-slate-50' 
        }
    ];

    const displayDate = result.submittedAt || result.startedAt;

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 p-6 md:p-12">
            <div className="max-w-5xl mx-auto space-y-12">
                
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <button 
                            onClick={() => navigate('/student')}
                            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-4 group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-sm font-medium">Back to Dashboard</span>
                        </button>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{result.examTitle}</h1>
                        <p className="text-slate-500 mt-2 flex items-center gap-2 uppercase tracking-widest text-[10px] font-bold">
                            <Clock className="w-3 h-3" />
                            {displayDate ? (
                                `Completed on ${new Date(displayDate).toLocaleDateString()} at ${new Date(displayDate).toLocaleTimeString()}`
                            ) : 'Date unavailable'}
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="text-right">
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Status</p>
                            <p className={`font-bold uppercase ${result.status === 'pending_review' ? 'text-amber-600' : result.status === 'blocked' ? 'text-red-600' : 'text-emerald-600'}`}>
                                {result.status.replace('_', ' ')}
                            </p>
                        </div>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            result.status === 'pending_review' ? 'bg-amber-50 text-amber-600' : 
                            result.status === 'blocked' ? 'bg-red-50 text-red-600' : 
                            'bg-emerald-50 text-emerald-600'
                        }`}>
                            {result.status === 'pending_review' ? <AlertCircle className="w-6 h-6" /> : <BarChart3 className="w-6 h-6" />}
                        </div>
                    </div>
                </header>

                {/* Score Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 hover:border-slate-200 shadow-sm transition-all">
                            <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Section Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    <div className="lg:col-span-2 space-y-6">
                        <h3 className="text-xl font-bold flex items-center gap-3 text-slate-800">
                            <BarChart3 className="w-5 h-5 text-slate-400" />
                            Section Performance
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(result.sectionStats || {}).map(([type, data]) => (
                                <div key={type} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="uppercase tracking-widest text-[10px] font-bold text-slate-400">{type} QUESTIONS</div>
                                        <div className="text-xs font-bold text-slate-600">{Math.round((data.marks / (data.total * 5)) * 100)}%</div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div className="text-2xl font-bold text-slate-900">{data.correct}/{data.total}</div>
                                            <div className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">Correct</div>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-1000 ${
                                                    (data.correct / data.total) > 0.7 ? 'bg-emerald-500' : 'bg-slate-400'
                                                }`} 
                                                style={{ width: `${(data.correct / data.total) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Question Breakdown List */}
                        <div className="space-y-4 mt-8">
                            <h3 className="text-xl font-bold flex items-center gap-3 text-slate-800">
                                <Zap className="w-5 h-5 text-slate-400" />
                                Attempt Summary
                            </h3>
                            <div className="space-y-2">
                                {result.results.map((q, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 group hover:border-slate-300 transition-colors shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                                                q.status === 'correct' ? 'bg-emerald-50 text-emerald-600' : 
                                                q.status === 'incorrect' ? 'bg-red-50 text-red-600' : 
                                                'bg-slate-50 text-slate-400'
                                            }`}>
                                                {i + 1}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800 line-clamp-1">{q.questionText || `Question ${i+1}`}</p>
                                                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-0.5">{q.type}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-300">Marks</p>
                                                <p className="text-xs font-bold text-slate-600">{q.marksObtained}/{q.maxMarks}</p>
                                            </div>
                                            {q.status === 'correct' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : 
                                             q.status === 'incorrect' ? <XCircle className="w-5 h-5 text-red-500" /> : 
                                             <Clock className="w-5 h-5 text-slate-300" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Proctoring & Summary */}
                    <div className="space-y-6">
                        <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-xl overflow-hidden relative group">
                            <div className="relative z-10">
                                <h4 className="text-lg font-bold mb-2">Great Work!</h4>
                                <p className="text-slate-300 text-sm leading-relaxed mb-6">
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

                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                            <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 underline decoration-slate-100 decoration-2 underline-offset-8">
                                Security Report
                            </h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                    <span className="text-xs text-slate-500">Anti-Cheat Flags</span>
                                    <span className={`text-xs font-bold ${result.violations > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {result.violations === 0 ? 'CLEAN' : `${result.violations} INCIDENTS`}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                    <span className="text-xs text-slate-500">Tab Focus Loss</span>
                                    <span className="text-xs font-bold text-slate-700">{result.tabSwitches || 0} Switches</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-xs text-slate-500">Submission Mode</span>
                                    <span className="text-xs font-bold text-slate-700 uppercase">{result.status.includes('auto') ? 'Automatic' : 'Manual'}</span>
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
