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
    MoreVertical
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
            toast.success(`AI features ${newState ? 'enabled' : 'disabled'} globally`);
        } catch (error) {
            toast.error("Failed to toggle AI features");
        }
    };

    const handleReview = async (status) => {
        if (!reviewReason) return toast.error("Reason is mandatory");
        try {
            await reviewViolation({
                sessionId: selectedViolation.sessionId,
                violationId: selectedViolation.violationId,
                status,
                reason: reviewReason
            });
            toast.success(`Decision recorded: ${status}`);
            setSelectedViolation(null);
            setReviewReason('');
            fetchData();
        } catch (error) {
            toast.error("Review failed");
        }
    };

    if (loading && !analytics) return (
        <div className="flex items-center justify-center min-h-screen bg-[#0a0c10]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="text-slate-400 font-medium text-sm animate-pulse">Initializing AI Ops Console...</p>
            </div>
        </div>
    );

    const stats = analytics?.summary || {};

    return (
        <div className="text-slate-100 font-sans">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                        <Brain className="text-indigo-500" size={32} />
                        AI GOVERNANCE & OPS
                    </h1>
                    <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-widest">
                        Human-in-the-loop Proctoring Management
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-2xl border border-slate-800">
                    <div className="px-4 py-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">AI Engine Status</p>
                        <div className="flex items-center gap-2 mt-1">
                            <div className={`w-2 h-2 rounded-full ${aiEnabled ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                            <span className="text-sm font-bold">{aiEnabled ? 'ACTIVE' : 'INACTIVE'}</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => handleToggleAI('global')}
                        className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                            aiEnabled 
                            ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' 
                            : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white'
                        }`}
                    >
                        {aiEnabled ? 'KILL SWITCH' : 'ENABLE ENGINE'}
                    </button>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard 
                    title="Total Violations" 
                    value={stats?.totalViolations || 0} 
                    icon={<ShieldAlert className="text-indigo-500" size={20} />} 
                    trend="+12% vs last week"
                    color="indigo"
                />
                <StatCard 
                    title="Avg Risk Index" 
                    value={stats?.avgRiskScore?.toFixed(1) || 0} 
                    icon={<Zap className="text-amber-500" size={20} />} 
                    trend="Stable performance"
                    color="amber"
                />
                <StatCard 
                    title="False Positive Rate" 
                    value={`${analytics?.fpRate?.toFixed(1) || 0}%`} 
                    icon={<ShieldCheck className="text-emerald-500" size={20} />} 
                    trend="High AI accuracy"
                    color="emerald"
                />
                <StatCard 
                    title="Critical Sessions" 
                    value={stats?.highRiskCount || 0} 
                    icon={<AlertTriangle className="text-red-500" size={20} />} 
                    trend="Requires manual review"
                    color="red"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                <div className="lg:col-span-2 bg-slate-900/40 rounded-3xl p-8 border border-slate-800 backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Activity size={20} className="text-indigo-500" />
                            Violation Timeline
                        </h3>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">7 Day Trend</div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analytics?.timeline?.map(t => ({ name: `${t._id?.day}/${t._id?.month}`, count: t.count || 0 })) || []}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                                <Tooltip 
                                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-slate-900/40 rounded-3xl p-8 border border-slate-800 backdrop-blur-xl">
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-8">
                        <BarChart3 size={20} className="text-indigo-500" />
                        Type Distribution
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={analytics?.typeBreakdown?.map(t => ({ name: t._id, value: t.count }))}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {analytics?.typeBreakdown?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        {analytics?.typeBreakdown?.slice(0, 4).map((t, i) => (
                            <div key={t._id} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                <span className="text-[11px] font-bold text-slate-400 truncate">{t._id}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-4 mb-8">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-3">
                    <Filter size={16} className="text-slate-500" />
                    <select 
                        className="bg-transparent border-none outline-none text-sm font-bold text-slate-300"
                        value={filter.status}
                        onChange={(e) => setFilter({...filter, status: e.target.value})}
                    >
                        <option value="all">ALL STATUS</option>
                        <option value="pending">PENDING REVIEW</option>
                        <option value="confirmed">CONFIRMED</option>
                        <option value="false_positive">FALSE POSITIVES</option>
                    </select>
                </div>
            </div>

            {/* Main Feed Table */}
            <div className="bg-slate-900/30 rounded-3xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/50">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Node</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Risk Level</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Latest Violation</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Review Status</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {/* Mocking row data as full aggregated suspicious feed needs a dedicated backend endpoint for listing, 
                            but for MVP we can show recent sessions that hit the match criteria */}
                        {analytics?.recentSuspicious?.length > 0 ? (
                            analytics.recentSuspicious.map((session, idx) => (
                                <tr key={session._id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="font-bold text-sm">{session.studentName || 'Student'}</div>
                                        <div className="text-[11px] text-slate-500 font-medium">{session.examName}</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-black border ${
                                            session.riskLevel === 'CRITICAL' ? 'text-red-500 border-red-500/20 bg-red-500/5' :
                                            session.riskLevel === 'HIGH' ? 'text-orange-500 border-orange-500/20 bg-orange-500/5' :
                                            'text-indigo-500 border-indigo-500/20 bg-indigo-500/5'
                                        }`}>
                                            {session.riskLevel}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-xs font-semibold">{session.latestViolationType}</div>
                                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                                            <Clock size={10} /> {new Date(session.timestamp).toLocaleTimeString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <StatusBadge status={session.reviewStatus} />
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button 
                                            onClick={() => window.open(`/mentor/exam/${session.examId}/monitoring`, '_blank')}
                                            className="p-2 text-slate-400 hover:text-white transition-colors"
                                        >
                                            <ExternalLink size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-20 text-center text-slate-500 italic text-sm">
                                    No suspicious sessions requiring immediate action.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Review Modal */}
            <AnimatePresence>
                {selectedViolation && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-8 shadow-2xl"
                        >
                            <h2 className="text-xl font-black mb-2 flex items-center gap-3">
                                <ShieldAlert className="text-indigo-500" />
                                CORRECTIVE REVIEW
                            </h2>
                            <p className="text-slate-400 text-sm mb-6">You are overriding an AI decision. This action is auditable.</p>
                            
                            <div className="space-y-4 mb-8">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Reason for correction</label>
                                <textarea 
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-all h-32 resize-none"
                                    placeholder="Explain why this is a false positive..."
                                    value={reviewReason}
                                    onChange={(e) => setReviewReason(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => handleReview('false_positive')}
                                    className="flex items-center justify-center gap-2 py-4 rounded-xl bg-red-500/10 text-red-500 font-black text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                                >
                                    <XCircle size={16} /> Mark False Pos
                                </button>
                                <button 
                                    onClick={() => handleReview('confirmed')}
                                    className="flex items-center justify-center gap-2 py-4 rounded-xl bg-emerald-500/10 text-emerald-500 font-black text-xs uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all"
                                >
                                    <CheckCircle2 size={16} /> Confirm Cheat
                                </button>
                            </div>
                            
                            <button 
                                onClick={() => setSelectedViolation(null)}
                                className="w-full mt-4 text-slate-500 font-bold text-[11px] uppercase tracking-widest py-2"
                            >
                                Cancel
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const StatCard = ({ title, value, icon, trend, color }) => {
    const colors = {
        indigo: "from-indigo-500/20 border-indigo-500/20 text-indigo-500",
        amber: "from-amber-500/20 border-amber-500/20 text-amber-500",
        emerald: "from-emerald-500/20 border-emerald-500/20 text-emerald-500",
        red: "from-red-500/20 border-red-500/20 text-red-500"
    };

    return (
        <div className={`bg-slate-900/50 border ${colors[color].split(' ')[1]} p-6 rounded-3xl backdrop-blur-sm relative overflow-hidden group`}>
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors[color].split(' ')[0]} to-transparent blur-3xl opacity-20 group-hover:opacity-40 transition-opacity`} />
            <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    {icon}
                </div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Live Monitor</div>
            </div>
            <div className="text-3xl font-black text-white tracking-tighter mb-1">{value}</div>
            <div className="text-sm font-bold text-slate-300">{title}</div>
            <p className="text-[10px] font-medium text-slate-500 mt-2 flex items-center gap-1.5 uppercase tracking-widest">
                <ChevronRight size={10} className="text-indigo-500" /> {trend}
            </p>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const config = {
        pending: { label: 'PENDING', bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
        confirmed: { label: 'CONFIRMED', bg: 'bg-red-500/10 text-red-500 border-red-500/20' },
        false_positive: { label: 'FALSE POSITIVE', bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    };

    const s = config[status] || config.pending;

    return (
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${s.bg}`}>
            {s.label}
        </span>
    );
};

export default AiMonitoringDashboard;
