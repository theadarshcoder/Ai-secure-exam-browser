import React, { useState, useEffect } from 'react';
import { 
    ShieldAlert, 
    ShieldCheck, 
    AlertTriangle, 
    Activity, 
    BarChart3, 
    Filter, 
    ExternalLink, 
    CheckCircle2, 
    XCircle,
    Brain,
    Clock,
    Zap,
    ChevronRight,
    Settings,
    MoreVertical,
    Target,
    ZapOff,
    Search,
    Download,
    ChevronDown
} from 'lucide-react';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    PieChart, 
    Pie, 
    Cell,
    BarChart,
    Bar
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { getAIAnalytics, reviewViolation, toggleAIFeatures } from '../../services/api';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];

const AiMonitoringDashboard = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [aiEnabled, setAiEnabled] = useState(true);
    const [filter, setFilter] = useState({ examId: '', status: 'all', dateRange: '7d' });
    const [selectedViolation, setSelectedViolation] = useState(null);
    const [reviewReason, setReviewReason] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, [filter]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await getAIAnalytics(filter);
            setAnalytics(data);
        } catch (error) {
            toast.error("Failed to load AI analytics");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAI = async (scope) => {
        const newState = !aiEnabled;
        try {
            await toggleAIFeatures({ scope, enabled: newState });
            setAiEnabled(newState);
            toast.success(`AI Governance mode switched to ${newState ? 'ACTIVE' : 'SUSPENDED'}`);
        } catch (error) {
            toast.error("Security Override Failed");
        }
    };

    const handleReview = async (status) => {
        if (!reviewReason) return toast.error("Verification reason required");
        try {
            await reviewViolation({
                sessionId: selectedViolation.sessionId,
                violationId: selectedViolation.violationId,
                status,
                reason: reviewReason
            });
            toast.success(`Human Verification recorded: ${status}`);
            setSelectedViolation(null);
            setReviewReason('');
            fetchData();
        } catch (error) {
            toast.error("Review synchronization failed");
        }
    };

    if (loading && !analytics) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-primary-500/10 border-t-primary-500 rounded-full animate-spin"></div>
                    <Brain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-500 animate-pulse" size={24} />
                </div>
                <div className="text-center">
                    <p className="text-primary font-black text-sm uppercase tracking-[0.3em]">AI Intelligence Engine</p>
                    <p className="text-muted text-[10px] mt-1 uppercase font-bold">Synchronizing Governance Nodes...</p>
                </div>
            </div>
        </div>
    );

    const stats = analytics?.summary || {};

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* --- TOP MISSION CONTROL BAR --- */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-surface/40 backdrop-blur-md border border-main p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 blur-[100px] -z-10" />
                
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-3xl bg-primary-500/10 flex items-center justify-center border border-primary-500/20 shadow-inner group transition-transform hover:scale-105">
                        <Brain className="text-primary-500" size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-primary flex items-center gap-3">
                            AI GOVERNANCE <span className="text-primary-500/40 font-thin">|</span> OPS
                        </h1>
                        <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em] px-2 py-0.5 border border-main rounded-md">Human-in-the-loop</span>
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-500 uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Monitoring Active
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className="flex-1 lg:flex-none bg-main/50 border border-main px-6 py-3 rounded-2xl flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[9px] font-black text-muted uppercase tracking-tighter">Engine Status</p>
                            <p className={`text-xs font-black ${aiEnabled ? 'text-emerald-500' : 'text-rose-500'}`}>{aiEnabled ? 'ACTIVE' : 'SUSPENDED'}</p>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${aiEnabled ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)] animate-pulse' : 'bg-rose-500'}`} />
                    </div>
                    
                    <button 
                        onClick={() => handleToggleAI('institution')}
                        className={`flex-1 lg:flex-none px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                            aiEnabled 
                            ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/20' 
                            : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20'
                        }`}
                    >
                        {aiEnabled ? (
                            <div className="flex items-center gap-2"><ZapOff size={14} /> Kill Switch</div>
                        ) : (
                            <div className="flex items-center gap-2"><Zap size={14} /> Enable Proctors</div>
                        )}
                    </button>
                </div>
            </div>

            {/* --- METRIC GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                    title="Total Violations" 
                    value={stats?.totalViolations || 0} 
                    icon={ShieldAlert} 
                    trend={{ val: "12%", type: "up" }}
                    color="primary"
                />
                <MetricCard 
                    title="Avg Risk Index" 
                    value={stats?.avgRiskScore?.toFixed(1) || 0} 
                    icon={Target} 
                    trend={{ val: "Stable", type: "stable" }}
                    color="amber"
                />
                <MetricCard 
                    title="FP Rate" 
                    value={`${analytics?.fpRate?.toFixed(1) || 0}%`} 
                    icon={ShieldCheck} 
                    trend={{ val: "-2%", type: "down" }}
                    color="emerald"
                />
                <MetricCard 
                    title="Critical Events" 
                    value={stats?.highRiskCount || 0} 
                    icon={AlertTriangle} 
                    trend={{ val: "Review Req", type: "warn" }}
                    color="rose"
                />
            </div>

            {/* --- ANALYTICS LAYER --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-surface/30 border border-main rounded-[2.5rem] p-8 shadow-sm group">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black text-primary flex items-center gap-3">
                                <Activity size={20} className="text-primary-500" />
                                VIOLATION TIMELINE
                            </h3>
                            <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Real-time pattern analysis</p>
                        </div>
                        <div className="flex items-center gap-2 bg-main/50 px-4 py-1.5 rounded-xl border border-main text-[10px] font-black text-muted uppercase tracking-widest">
                            <Clock size={12} /> 7 Day Trend
                        </div>
                    </div>
                    <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%" key={analytics ? 'timeline-active' : 'timeline-loading'} minWidth={0}>
                            <AreaChart data={analytics?.timeline?.map(t => ({ name: `${t._id?.day}/${t._id?.month}`, count: t.count || 0 })) || []}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--primary-rgb), 0.05)" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--muted)', fontSize: 10, fontWeight: 700}} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--muted)', fontSize: 10, fontWeight: 700}} />
                                <Tooltip 
                                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--main)', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    itemStyle={{ color: 'var(--primary)', fontSize: '11px', fontWeight: 900 }}
                                />
                                <Area type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" animationDuration={2000} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-surface/30 border border-main rounded-[2.5rem] p-8 shadow-sm">
                    <h3 className="text-lg font-black text-primary flex items-center gap-3 mb-8">
                        <BarChart3 size={20} className="text-primary-500" />
                        TYPE DISTRIBUTION
                    </h3>
                    <div className="h-[280px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%" key={analytics ? 'pie-active' : 'pie-loading'} minWidth={0}>
                            <PieChart>
                                <Pie
                                    data={analytics?.typeBreakdown?.map(t => ({ name: t._id, value: t.count }))}
                                    innerRadius={70}
                                    outerRadius={95}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {analytics?.typeBreakdown?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--main)', borderRadius: '16px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                            <p className="text-2xl font-black text-primary">{analytics?.typeBreakdown?.length || 0}</p>
                            <p className="text-[9px] font-black text-muted uppercase tracking-tighter leading-none">Unique<br/>Types</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 mt-6">
                        {analytics?.typeBreakdown?.slice(0, 3).map((t, i) => (
                            <div key={t._id} className="flex items-center justify-between p-3 bg-main/30 rounded-xl border border-main group hover:border-primary-500/20 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <span className="text-[11px] font-bold text-primary truncate max-w-[120px]">{t._id}</span>
                                </div>
                                <span className="text-xs font-black text-primary tabular-nums">{t.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- OPERATIONS FEED --- */}
            <div className="bg-surface/40 backdrop-blur-md border border-main rounded-[2.5rem] overflow-hidden shadow-xl">
                <div className="p-8 border-b border-main flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h3 className="text-xl font-black text-primary">OPERATIONS FEED</h3>
                        <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Live aggregated suspicious sessions</p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex-1 md:w-64 bg-main/50 border border-main rounded-2xl px-4 py-2 flex items-center gap-3 group focus-within:border-primary-500/50 transition-all">
                            <Search size={16} className="text-muted group-focus-within:text-primary-500" />
                            <input 
                                type="text" 
                                placeholder="Search candidates..." 
                                className="bg-transparent border-none outline-none text-xs font-bold w-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Filter Bar */}
                        <div className="relative">
                            <button 
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="bg-main/50 border border-main rounded-2xl px-6 py-2.5 flex items-center gap-4 group hover:border-primary-500/50 transition-all min-w-[200px] justify-between shadow-inner"
                            >
                                <div className="flex items-center gap-3">
                                    <Filter size={14} className="text-primary-500" />
                                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                                        {filter.status === 'all' ? 'All Status' : filter.status === 'pending' ? 'Pending Review' : filter.status === 'confirmed' ? 'Confirmed' : 'False Positives'}
                                    </span>
                                </div>
                                <ChevronDown size={14} className={`text-muted transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {dropdownOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 5, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute top-full left-0 mt-2 w-full min-w-[220px] bg-surface/90 backdrop-blur-xl border border-main rounded-2xl shadow-2xl z-[100] p-2 overflow-hidden"
                                    >
                                        {[
                                            { id: 'all', label: 'All Status', icon: Target },
                                            { id: 'pending', label: 'Pending Review', icon: Clock },
                                            { id: 'confirmed', label: 'Confirmed', icon: ShieldAlert },
                                            { id: 'false_positive', label: 'False Positives', icon: ShieldCheck }
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => { setFilter({...filter, status: opt.id}); setDropdownOpen(false); }}
                                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                    filter.status === opt.id 
                                                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' 
                                                    : 'text-muted hover:bg-main hover:text-primary'
                                                }`}
                                            >
                                                <opt.icon size={14} />
                                                {opt.label}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-main/20 text-[10px] font-black text-muted uppercase tracking-[0.2em]">
                                <th className="px-8 py-5">Target Node</th>
                                <th className="px-8 py-5">Risk Matrix</th>
                                <th className="px-8 py-5">Latest Violation</th>
                                <th className="px-8 py-5">Governance Status</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-main">
                            {analytics?.recentSuspicious?.length > 0 ? (
                                analytics.recentSuspicious.map((session, idx) => (
                                    <tr key={session._id} className="hover:bg-main/30 transition-all group">
                                        <td className="px-8 py-6">
                                            <div className="font-black text-sm text-primary group-hover:text-primary-500 transition-colors">{session.studentName || 'Unknown Student'}</div>
                                            <div className="text-[10px] text-muted font-bold uppercase tracking-tight mt-0.5">{session.examName}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`px-3 py-1 rounded-lg text-[9px] font-black border ${
                                                    session.riskLevel === 'CRITICAL' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                                    session.riskLevel === 'HIGH' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                    'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                                                }`}>
                                                    {session.riskLevel}
                                                </div>
                                                <div className="text-xs font-black text-muted tabular-nums">{session.riskScore.toFixed(0)}</div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-xs font-black text-primary uppercase tracking-tight">{session.latestViolationType}</div>
                                            <div className="text-[9px] text-muted font-bold flex items-center gap-1.5 mt-1 uppercase">
                                                <Clock size={10} /> {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <StatusBadge status={session.reviewStatus} />
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => window.open(`/mentor/exam/${session.examId}/monitoring`, '_blank')}
                                                    className="p-3 bg-main border border-main rounded-xl text-muted hover:text-primary-500 hover:border-primary-500/30 transition-all active:scale-90"
                                                >
                                                    <ExternalLink size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => setSelectedViolation(session)}
                                                    className="p-3 bg-main border border-main rounded-xl text-muted hover:text-amber-500 hover:border-amber-500/30 transition-all active:scale-90"
                                                >
                                                    <Settings size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <ShieldCheck size={48} className="text-emerald-500" />
                                            <p className="text-sm font-black uppercase tracking-widest text-muted">Awaiting Security Events</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- REVIEW MODAL (ENHANCED) --- */}
            <AnimatePresence>
                {selectedViolation && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-surface border border-main rounded-[2.5rem] w-full max-w-xl p-10 shadow-2xl relative"
                        >
                            <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary-500/10 blur-[80px] -z-10" />
                            
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-primary-500/20 rounded-2xl text-primary-500 border border-primary-500/20">
                                    <ShieldAlert size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-primary tracking-tight">SECURITY REVIEW</h2>
                                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Manual Override Authorization Required</p>
                                </div>
                            </div>
                            
                            <div className="bg-main/50 rounded-2xl p-6 border border-main mb-8 space-y-4">
                                <div className="flex justify-between items-center pb-4 border-b border-main">
                                    <span className="text-[10px] font-black text-muted uppercase tracking-widest">Target Node</span>
                                    <span className="text-sm font-black text-primary">{selectedViolation.studentName}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-muted uppercase tracking-widest">Violation Detected</span>
                                    <span className="text-xs font-black text-rose-500 px-3 py-1 bg-rose-500/10 rounded-lg">{selectedViolation.latestViolationType}</span>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <label className="flex items-center gap-2 text-[10px] font-black text-muted uppercase tracking-widest ml-1">
                                    <Settings size={12} /> Audit Trail Justification
                                </label>
                                <textarea 
                                    className="w-full bg-main/30 border border-main rounded-2xl p-6 text-sm text-primary outline-none focus:border-primary-500/50 transition-all h-36 resize-none shadow-inner"
                                    placeholder="Provide detailed justification for this human-in-the-loop override..."
                                    value={reviewReason}
                                    onChange={(e) => setReviewReason(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => handleReview('false_positive')}
                                    className="flex items-center justify-center gap-3 py-5 rounded-[1.5rem] bg-rose-500/10 text-rose-500 border border-rose-500/20 font-black text-xs uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-lg active:scale-95"
                                >
                                    <XCircle size={18} /> Flag False Pos
                                </button>
                                <button 
                                    onClick={() => handleReview('confirmed')}
                                    className="flex items-center justify-center gap-3 py-5 rounded-[1.5rem] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-black text-xs uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-lg active:scale-95"
                                >
                                    <CheckCircle2 size={18} /> Confirm Breach
                                </button>
                            </div>
                            
                            <button 
                                onClick={() => { setSelectedViolation(null); setReviewReason(''); }}
                                className="w-full mt-6 text-muted font-black text-[10px] uppercase tracking-[0.3em] py-2 hover:text-primary transition-colors"
                            >
                                Abandon Review
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const MetricCard = ({ title, value, icon: Icon, trend, color }) => {
    const colors = {
        primary: "bg-primary-500/10 text-primary-500 border-primary-500/20 shadow-primary-500/5",
        amber: "bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-amber-500/5",
        emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-emerald-500/5",
        rose: "bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-rose-500/5"
    };

    return (
        <div className="bg-surface/30 border border-main p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden group hover:border-primary-500/20 transition-all">
            <div className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-primary-500/10 to-transparent blur-3xl opacity-20 group-hover:opacity-40 transition-opacity`} />
            
            <div className="flex items-center justify-between mb-6">
                <div className={`w-12 h-12 rounded-2xl ${colors[color]} flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110`}>
                    <Icon size={24} />
                </div>
                <div className="flex flex-col items-end">
                    <div className="text-[9px] font-black text-muted uppercase tracking-widest">Platform Node</div>
                    <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">Live</span>
                    </div>
                </div>
            </div>
            
            <div className="space-y-1">
                <p className="text-4xl font-black text-primary tracking-tighter tabular-nums">{value}</p>
                <p className="text-[11px] font-bold text-muted uppercase tracking-widest">{title}</p>
            </div>
            
            <div className={`mt-6 pt-4 border-t border-main flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${
                trend.type === 'up' ? 'text-rose-500' : 
                trend.type === 'down' ? 'text-emerald-500' : 
                'text-muted'
            }`}>
                <ChevronRight size={12} className="text-primary-500" />
                {trend.val} <span className="text-muted/40 ml-1 font-bold">Performance Delta</span>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const config = {
        pending: { label: 'Awaiting Review', bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
        confirmed: { label: 'Confirmed Breach', bg: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
        false_positive: { label: 'False Positive', bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    };

    const s = config[status] || config.pending;

    return (
        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black border uppercase tracking-widest shadow-sm ${s.bg}`}>
            {s.label}
        </span>
    );
};

export default AiMonitoringDashboard;
