import React, { useState, useEffect } from 'react';
import { 
    TrendingUp, 
    TrendingDown, 
    Users, 
    FileText, 
    Clock, 
    AlertTriangle, 
    ChevronRight, 
    Filter, 
    Download,
    BarChart3,
    Activity,
    Target,
    Zap,
    History
} from 'lucide-react';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    LineChart,
    Line,
    BarChart,
    Bar,
    Cell
} from 'recharts';
import { motion } from 'framer-motion';
import { getStrategicAnalytics } from '../../services/api';
import toast from 'react-hot-toast';

const InstitutionAnalytics = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ startDate: '', endDate: '', examId: '' });

    useEffect(() => {
        fetchData();
    }, [filter]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await getStrategicAnalytics(filter);
            setAnalytics(data);
        } catch (error) {
            toast.error("Failed to load strategic analytics");
        } finally {
            setLoading(false);
        }
    };

    if (loading && !analytics) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
    );

    const funnelData = analytics?.funnel ? [
        { name: 'Invited', value: analytics.funnel.invited || 0, fill: '#6366f1' },
        { name: 'Started', value: analytics.funnel.started || 0, fill: '#8b5cf6' },
        { name: 'Submitted', value: analytics.funnel.submitted || 0, fill: '#10b981' },
    ] : [];

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <Target className="text-indigo-500" size={28} />
                        INSTITUTIONAL INTELLIGENCE
                    </h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Macro Trends & Behavioral Analysis</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-3">
                        <Filter size={14} className="text-slate-500" />
                        <select 
                            className="bg-transparent border-none outline-none text-[11px] font-black text-slate-300 uppercase tracking-widest"
                            value={filter.examId}
                            onChange={(e) => setFilter({...filter, examId: e.target.value})}
                        >
                            <option value="">Global Performance</option>
                            {/* In a real app, populate with exam list */}
                        </select>
                    </div>
                    <button 
                        onClick={() => toast.success("Export initiated (Strategic V1)")}
                        className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-xl border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all shadow-lg shadow-indigo-500/5"
                    >
                        <Download size={18} />
                    </button>
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard 
                    label="Participation Rate" 
                    value={`${analytics?.funnel?.invited > 0 ? ((analytics.funnel.started / analytics.funnel.invited) * 100).toFixed(1) : 0}%`}
                    icon={<Users size={18} />}
                    sub="Invited vs Started"
                    trend={analytics?.funnel?.started > 0 ? "Normal" : "Low"}
                />
                <KPICard 
                    label="Completion Efficiency" 
                    value={`${analytics?.funnel?.started > 0 ? ((analytics.funnel.submitted / analytics.funnel.started) * 100).toFixed(1) : 0}%`}
                    icon={<Zap size={18} />}
                    sub="Avg Submission Rate"
                    trend="Stable"
                />
                <KPICard 
                    label="Avg Test Duration" 
                    value={`${Math.round(analytics?.avgCompletionMinutes || 0)}m`}
                    icon={<Clock size={18} />}
                    sub="Across all sessions"
                    trend="Optimal"
                />
                <KPICard 
                    label="Anomaly Status" 
                    value={analytics?.anomaly?.detected ? "SPIKE" : "NOMINAL"}
                    icon={<Activity size={18} />}
                    sub={`Last 24h: ${analytics?.anomaly?.last24h || 0} flags`}
                    color={analytics?.anomaly?.detected ? "red" : "emerald"}
                    trend={analytics?.anomaly?.detected ? `+${analytics?.anomaly?.spikeFactor || 0}x spike` : "No anomalies"}
                />
            </div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Funnel Visualization */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 relative overflow-hidden backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <History size={16} /> Exam Funnel Performance
                        </h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={funnelData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} width={80} />
                                <Tooltip 
                                    cursor={{fill: 'rgba(255,255,255,0.02)'}}
                                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                                />
                                <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={40}>
                                    {funnelData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-6 grid grid-cols-3 gap-4">
                        <FunnelMetric label="Abandoned" value={analytics?.funnel.abandoned} color="amber" />
                        <FunnelMetric label="Blocked" value={analytics?.funnel.blocked} color="red" />
                        <FunnelMetric label="Success" value={analytics?.funnel.submitted} color="emerald" />
                    </div>
                </div>

                {/* Growth Trend */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <TrendingUp size={16} /> Usage Growth Trends
                        </h3>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500" /><span className="text-[10px] font-bold text-slate-500">Users</span></div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[10px] font-bold text-slate-500">Exams</span></div>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analytics?.growth.users?.map((u, i) => ({ 
                                name: `${u._id.month}/${u._id.year}`, 
                                users: u.count,
                                exams: analytics.growth.exams[i]?.count || 0
                            }))}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }} />
                                <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                                <Area type="monotone" dataKey="exams" stroke="#10b981" strokeWidth={3} fill="transparent" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Risk Leaderboard */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl">
                <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-500" /> High-Risk Exam Clusters
                    </h3>
                    <span className="text-[10px] font-bold text-slate-500">Top 5 by Violation Density</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-950/50">
                            <tr>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Exam Target</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Sessions</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Avg Risk</th>
                                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Violation Ratio</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {analytics?.riskLeaderboard.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="font-bold text-sm text-white">{item.title}</div>
                                        <div className="text-[10px] text-slate-500 font-bold uppercase mt-0.5 tracking-tighter">Target Exam ID: {item._id.slice(-8)}</div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="text-xs font-bold text-slate-300">{item.sessionTotal} Units</div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className={`text-xs font-bold ${item.avgRisk > 10 ? 'text-red-500' : 'text-amber-500'}`}>
                                            {item.avgRisk.toFixed(1)} Index
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-indigo-500" 
                                                    style={{ width: `${Math.min(100, item.riskRatio * 20)}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-black text-white">{item.riskRatio.toFixed(2)}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {analytics?.riskLeaderboard.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-8 py-10 text-center text-slate-500 italic text-sm">
                                        Insufficient behavioral data for risk clustering.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const KPICard = ({ label, value, icon, sub, trend, color = "indigo" }) => {
    const colors = {
        indigo: "text-indigo-500 border-indigo-500/20 bg-indigo-500/5",
        emerald: "text-emerald-500 border-emerald-500/20 bg-emerald-500/5",
        red: "text-red-500 border-red-500/20 bg-red-500/5",
        amber: "text-amber-500 border-amber-500/20 bg-amber-500/5"
    };

    return (
        <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl backdrop-blur-sm group hover:border-indigo-500/30 transition-all">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-xl border ${colors[color]}`}>
                    {icon}
                </div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{trend}</div>
            </div>
            <div className="text-3xl font-black text-white tracking-tighter mb-1">{value}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</div>
            <p className="text-[10px] font-medium text-slate-500 mt-2 flex items-center gap-2">
                <ChevronRight size={10} className="text-indigo-500" /> {sub}
            </p>
        </div>
    );
};

const FunnelMetric = ({ label, value, color }) => {
    const colors = {
        amber: "bg-amber-500",
        red: "bg-red-500",
        emerald: "bg-emerald-500"
    };
    return (
        <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
                <div className={`w-1.5 h-1.5 rounded-full ${colors[color]}`} />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
            </div>
            <div className="text-lg font-black text-white">{value}</div>
        </div>
    );
};

export default InstitutionAnalytics;
