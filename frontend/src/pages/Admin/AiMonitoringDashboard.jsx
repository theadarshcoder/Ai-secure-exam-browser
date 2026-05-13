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
    Radar,
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
import BouncingDotLoader from '../../components/BouncingDotLoader';
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

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <BouncingDotLoader text="Initializing secure neural systems..." />
        </div>
    );

    const stats = analytics?.summary || {};

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* --- TOP CONTROL BAR --- */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 bg-surface/40 backdrop-blur-md border border-main p-4 rounded-2xl shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 blur-[100px] -z-10" />
                
                <div className="flex items-center gap-3">
                    <Radar className="text-primary-500" size={22} />
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-primary flex items-center gap-2">
                            AI Monitoring
                        </h1>
                        <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[9px] font-semibold text-muted uppercase tracking-wider px-2 py-0.5 border border-main rounded-md">Human Review</span>
                            <div className="flex items-center gap-1.5 text-[9px] font-medium text-primary-500 uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                                Active
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="flex-1 lg:flex-none bg-main/50 border border-main px-4 py-2 rounded-xl flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-[9px] font-semibold text-muted uppercase tracking-wider">AI Status</p>
                            <p className={`text-[11px] font-semibold ${aiEnabled ? 'text-primary-500' : 'text-muted'}`}>{aiEnabled ? 'Active' : 'Paused'}</p>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${aiEnabled ? 'bg-primary-500 shadow-[0_0_6px_rgba(var(--primary-500-rgb),0.4)] animate-pulse' : 'bg-muted/40'}`} />
                    </div>
                    
                    <button 
                        onClick={() => handleToggleAI('institution')}
                        className={`flex-1 lg:flex-none px-5 py-2.5 rounded-xl font-semibold text-[10px] uppercase tracking-wider transition-all shadow-sm active:scale-95 ${
                            aiEnabled 
                            ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-primary-500/20' 
                            : 'bg-primary-500 text-white hover:bg-primary-600 shadow-primary-500/20'
                        }`}
                    >
                        {aiEnabled ? (
                            <div className="flex items-center gap-2"><ZapOff size={13} /> Disable AI</div>
                        ) : (
                            <div className="flex items-center gap-2"><Zap size={13} /> Enable AI</div>
                        )}
                    </button>
                </div>
            </div>

            {/* --- METRIC GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard 
                    title="Total Violations" 
                    value={stats?.totalViolations || 0} 
                    icon={ShieldAlert} 
                    trend={{ val: "12%", type: "up" }}
                    color="primary"
                />
                <MetricCard 
                    title="Avg Risk Score" 
                    value={stats?.avgRiskScore?.toFixed(1) || 0} 
                    icon={Target} 
                    trend={{ val: "Stable", type: "stable" }}
                    color="amber"
                />
                <MetricCard 
                    title="False Alarms" 
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-surface/30 border border-main rounded-2xl p-6 shadow-sm group">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-base font-semibold text-primary flex items-center gap-2">
                                <Activity size={18} className="text-primary-500" />
                                Activity Timeline
                            </h3>
                            <p className="text-[11px] text-muted font-medium tracking-wide mt-1">Recent violation trends</p>
                        </div>
                        <div className="flex items-center gap-2 bg-main/50 px-3 py-1.5 rounded-lg border border-main text-[10px] font-semibold text-muted uppercase tracking-wider">
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

                <div className="bg-surface/30 border border-main rounded-2xl p-6 shadow-sm">
                    <h3 className="text-base font-semibold text-primary flex items-center gap-2 mb-6">
                        <BarChart3 size={18} className="text-primary-500" />
                        Violation Types
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
                            <p className="text-2xl font-semibold text-primary">{analytics?.typeBreakdown?.length || 0}</p>
                            <p className="text-[10px] font-medium text-muted uppercase tracking-wider leading-none">Unique<br/>Types</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 mt-6">
                        {analytics?.typeBreakdown?.slice(0, 3).map((t, i) => (
                            <div key={t._id} className="flex items-center justify-between p-3 bg-main/30 rounded-xl border border-main group hover:border-primary-500/20 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <span className="text-[11px] font-medium text-primary truncate max-w-[120px]">{t._id}</span>
                                </div>
                                <span className="text-xs font-semibold text-primary tabular-nums">{t.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- OPERATIONS FEED --- */}
            <div className="bg-surface/40 backdrop-blur-md border border-main rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-primary">Live Feed</h3>
                        <p className="text-[11px] text-muted font-medium tracking-wide mt-1">Recent suspicious activity</p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex-1 md:w-64 bg-main/50 border border-main rounded-xl px-4 py-2 flex items-center gap-3 group focus-within:border-primary-500/50 transition-all">
                            <Search size={16} className="text-muted group-focus-within:text-primary-500" />
                            <input 
                                type="text" 
                                placeholder="Search candidates..." 
                                className="bg-transparent border-none outline-none text-xs font-medium w-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Filter Bar */}
                        <div className="relative">
                            <button 
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="bg-main/50 border border-main rounded-xl px-4 py-2.5 flex items-center gap-3 group hover:border-primary-500/50 transition-all min-w-[180px] justify-between shadow-sm"
                            >
                                <div className="flex items-center gap-2">
                                    <Filter size={14} className="text-primary-500" />
                                    <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                                        {filter.status === 'all' ? 'All' : filter.status === 'pending' ? 'Pending' : filter.status === 'confirmed' ? 'Confirmed' : 'False Alarms'}
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
                                        className="absolute top-full left-0 mt-2 w-full min-w-[200px] bg-surface/90 backdrop-blur-xl border border-main rounded-xl shadow-lg z-[100] p-1.5 overflow-hidden"
                                    >
                                        {[
                                            { id: 'all', label: 'All', icon: Target },
                                            { id: 'pending', label: 'Pending', icon: Clock },
                                            { id: 'confirmed', label: 'Confirmed', icon: ShieldAlert },
                                            { id: 'false_positive', label: 'False Alarms', icon: ShieldCheck }
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => { setFilter({...filter, status: opt.id}); setDropdownOpen(false); }}
                                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all ${
                                                    filter.status === opt.id 
                                                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20' 
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
                            <tr className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                                <th className="px-6 py-4">Student</th>
                                <th className="px-6 py-4">Risk Level</th>
                                <th className="px-6 py-4">Latest Event</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="">
                            {analytics?.recentSuspicious?.length > 0 ? (
                                analytics.recentSuspicious.map((session, idx) => (
                                    <tr key={session._id} className="hover:bg-main/30 transition-all group">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-sm text-primary group-hover:text-primary-500 transition-colors">{session.studentName || 'Unknown Student'}</div>
                                            <div className="text-[11px] text-muted font-medium tracking-wide mt-0.5">{session.examName}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`px-2 py-1 rounded-md text-[10px] font-semibold border ${
                                                    session.riskLevel === 'CRITICAL' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                                    session.riskLevel === 'HIGH' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                    'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                                                }`}>
                                                    {session.riskLevel}
                                                </div>
                                                <div className="text-xs font-semibold text-muted tabular-nums">{session.riskScore.toFixed(0)}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-semibold text-primary uppercase tracking-wider">{session.latestViolationType}</div>
                                            <div className="text-[10px] text-muted font-medium flex items-center gap-1.5 mt-1 uppercase">
                                                <Clock size={10} /> {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={session.reviewStatus} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
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
                                    <td colSpan="5" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-40">
                                            <ShieldCheck size={40} className="text-emerald-500" />
                                            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Awaiting Security Events</p>
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
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-surface border border-main rounded-2xl w-full max-w-xl p-8 shadow-xl relative"
                        >
                            <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary-500/10 blur-[80px] -z-10" />
                            
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-primary-500/10 rounded-xl text-primary-500 border border-primary-500/20">
                                    <ShieldAlert size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-primary tracking-tight">Review Activity</h2>
                                    <p className="text-[11px] text-muted font-medium tracking-wide">Please review and confirm this event</p>
                                </div>
                            </div>
                            
                            <div className="bg-main/50 rounded-xl p-5 border border-main mb-6 space-y-4">
                                <div className="flex justify-between items-center pb-3 border-b border-main">
                                    <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">Student</span>
                                    <span className="text-sm font-semibold text-primary">{selectedViolation.studentName}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">Event Detected</span>
                                    <span className="text-xs font-semibold text-rose-500 px-3 py-1 bg-rose-500/10 rounded-md">{selectedViolation.latestViolationType}</span>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                <label className="flex items-center gap-2 text-[10px] font-semibold text-muted uppercase tracking-wider ml-1">
                                    <Settings size={12} /> Reason for Decision
                                </label>
                                <textarea 
                                    className="w-full bg-main/30 border border-main rounded-xl p-4 text-sm text-primary outline-none focus:border-primary-500/50 transition-all h-32 resize-none shadow-sm"
                                    placeholder="Add a note explaining your decision..."
                                    value={reviewReason}
                                    onChange={(e) => setReviewReason(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => handleReview('false_positive')}
                                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 font-semibold text-[11px] uppercase tracking-wider hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95"
                                >
                                    <XCircle size={16} /> Mark as Safe
                                </button>
                                <button 
                                    onClick={() => handleReview('confirmed')}
                                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-semibold text-[11px] uppercase tracking-wider hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-95"
                                >
                                    <CheckCircle2 size={16} /> Confirm Cheating
                                </button>
                            </div>
                            
                            <button 
                                onClick={() => { setSelectedViolation(null); setReviewReason(''); }}
                                className="w-full mt-4 text-muted font-semibold text-[11px] uppercase tracking-wider py-2 hover:text-primary transition-colors"
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

const MetricCard = ({ title, value, icon: Icon, trend, color }) => {
    return (
        <div className="bg-surface border border-main rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-primary-500/30 transition-all group h-full gap-4">
            <div className="flex items-center gap-3">
                <Icon className={`text-${color}-500 shrink-0`} size={20} />
                <div>
                    <h3 className="text-[12px] font-semibold text-primary leading-none">{title}</h3>
                    <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={`text-[9px] font-medium uppercase tracking-wider ${
                            trend.type === 'up' ? 'text-rose-500' : 
                            trend.type === 'down' ? 'text-emerald-500' : 
                            'text-muted'
                        }`}>
                            {trend.val}
                        </span>
                    </div>
                </div>
            </div>
            <p className="text-xl font-semibold text-primary tabular-nums tracking-tight">{value}</p>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const config = {
        pending: { label: 'Pending', bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
        confirmed: { label: 'Confirmed', bg: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
        false_positive: { label: 'False Alarm', bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    };

    const s = config[status] || config.pending;

    return (
        <span className={`px-3 py-1 rounded-md text-[10px] font-semibold border uppercase tracking-wider shadow-sm ${s.bg}`}>
            {s.label}
        </span>
    );
};

export default AiMonitoringDashboard;
