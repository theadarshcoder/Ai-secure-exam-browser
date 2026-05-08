import React, { useState, useEffect } from 'react';
import { 
    BarChart3, 
    TrendingUp, 
    Users, 
    FileText, 
    Clock, 
    AlertCircle, 
    ChevronRight, 
    Download,
    Calendar,
    Target,
    Layers,
    Share2,
    ArrowUpRight,
    ArrowDownRight,
    MousePointer2,
    PieChart as PieIcon,
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
    BarChart,
    Bar,
    Cell,
    Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';

const InstitutionAnalytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('30d');
    const [dropdownOpen, setDropdownOpen] = useState(false);

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const { data: res } = await api.get(`/api/v1/analytics/strategic?range=${dateRange}`);
            
            if (res.success && res.data) {
                const b = res.data;
                
                // Transform Backend Data to Frontend Logic
                const transformedData = {
                    participationRate: b.funnel?.invited > 0 ? (b.funnel.started / b.funnel.invited) * 100 : 0,
                    completionRate: b.funnel?.started > 0 ? (b.funnel.submitted / b.funnel.started) * 100 : 0,
                    avgDuration: Math.round(b.avgCompletionMinutes || 0),
                    anomalyCount: b.anomaly?.detected ? 1 : 0,
                    funnel: [
                        { name: 'Invited', value: b.funnel?.invited || 0 },
                        { name: 'Started', value: b.funnel?.started || 0 },
                        { name: 'Completed', value: b.funnel?.submitted || 0 }
                    ],
                    // Merge Growth Data
                    trends: b.growth?.users?.map((u, i) => {
                        const e = b.growth.exams[i] || { count: 0 };
                        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                        return {
                            date: `${monthNames[u._id.month - 1]} ${u._id.year}`,
                            users: u.count,
                            exams: e.count
                        };
                    }) || []
                };
                setData(transformedData);
            }
        } catch (error) {
            console.error("Strategic Analytics fetch failed:", error);
            toast.error("Failed to sync live analytics");
        } finally {
            setLoading(false);
        }
    };

    if (loading && !data) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-primary-500/10 border-t-primary-500 rounded-full animate-spin"></div>
                    <Layers className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-500 animate-pulse" size={24} />
                </div>
                <div className="text-center">
                    <p className="text-primary font-black text-sm uppercase tracking-[0.3em]">Institutional Intelligence</p>
                    <p className="text-muted text-[10px] mt-1 uppercase font-bold">Aggregating Behavioral Data...</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* --- STRATEGIC HEADER --- */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-surface/40 backdrop-blur-md border border-main p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 blur-[120px] -z-10" />
                
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-3xl bg-primary-500/10 flex items-center justify-center border border-primary-500/20 shadow-inner group transition-transform hover:scale-105">
                        <Target className="text-primary-500" size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-primary flex items-center gap-3">
                            STRATEGIC ANALYTICS <span className="text-primary-500/40 font-thin">|</span> INSIGHTS
                        </h1>
                        <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em] px-2 py-0.5 border border-main rounded-md">Macro Behavioral Analysis</span>
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-500 uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Data Sync Live
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto relative">
                    <div className="relative">
                        <button 
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="bg-main/50 border border-main rounded-2xl px-6 py-2.5 flex items-center gap-4 group hover:border-primary-500/50 transition-all min-w-[180px] justify-between shadow-inner"
                        >
                            <div className="flex items-center gap-3">
                                <Calendar size={16} className="text-primary-500" />
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                                    {dateRange === '7d' ? 'Last 7 Days' : dateRange === '30d' ? 'Last 30 Days' : 'Quarterly'}
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
                                    className="absolute top-full right-0 mt-2 w-full min-w-[200px] bg-surface/90 backdrop-blur-xl border border-main rounded-2xl shadow-2xl z-[100] p-2 overflow-hidden"
                                >
                                    {[
                                        { id: '7d', label: 'Last 7 Days', icon: Clock },
                                        { id: '30d', label: 'Last 30 Days', icon: Calendar },
                                        { id: '90d', label: 'Quarterly', icon: TrendingUp }
                                    ].map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => { setDateRange(opt.id); setDropdownOpen(false); }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                dateRange === opt.id 
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

                    <button className="p-3.5 bg-primary-500 text-white rounded-2xl shadow-lg shadow-primary-500/20 hover:bg-primary-600 transition-all active:scale-95">
                        <Download size={20} />
                    </button>
                    <button className="p-3.5 bg-surface border border-main text-muted rounded-2xl hover:text-primary transition-all active:scale-95">
                        <Share2 size={20} />
                    </button>
                </div>
            </div>

            {/* --- KEY PERFORMANCE INDICATORS --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard 
                    title="Participation" 
                    value={`${data?.participationRate?.toFixed(1) || 0}%`} 
                    label="Invited vs Started"
                    icon={Users} 
                    trend={{ val: "4.2%", type: "up" }}
                    color="primary"
                />
                <KPICard 
                    title="Efficiency" 
                    value={`${data?.completionRate?.toFixed(1) || 0}%`} 
                    label="Completion Rate"
                    icon={TrendingUp} 
                    trend={{ val: "Stable", type: "stable" }}
                    color="emerald"
                />
                <KPICard 
                    title="Avg Duration" 
                    value={`${data?.avgDuration || 0}m`} 
                    label="Across all nodes"
                    icon={Clock} 
                    trend={{ val: "Optimal", type: "up" }}
                    color="amber"
                />
                <KPICard 
                    title="Anomaly Status" 
                    value={data?.anomalyCount > 0 ? 'ALERT' : 'NOMINAL'} 
                    label="Last 24h scanning"
                    icon={AlertCircle} 
                    trend={{ val: data?.anomalyCount > 0 ? 'Review Needed' : 'No Flags', type: data?.anomalyCount > 0 ? 'down' : 'stable' }}
                    color={data?.anomalyCount > 0 ? 'rose' : 'emerald'}
                />
            </div>

            {/* --- VISUAL INTELLIGENCE LAYER --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Exam Funnel */}
                <div className="lg:col-span-1 bg-surface/30 border border-main rounded-[2.5rem] p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-black text-primary flex items-center gap-3">
                            <Layers size={20} className="text-primary-500" />
                            EXAM FUNNEL
                        </h3>
                        <MousePointer2 size={16} className="text-muted opacity-20" />
                    </div>
                    
                    <div className="space-y-6">
                        {data?.funnel?.map((step, i) => (
                            <div key={i} className="space-y-2 group">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black text-muted uppercase tracking-widest">{step.name}</span>
                                    <span className="text-sm font-black text-primary tabular-nums">{step.value}</span>
                                </div>
                                <div className="h-4 bg-main/50 rounded-xl overflow-hidden border border-main/50">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(step.value / data.funnel[0].value) * 100}%` }}
                                        transition={{ duration: 1.5, delay: i * 0.2 }}
                                        className={`h-full rounded-xl shadow-lg ${
                                            i === 0 ? 'bg-primary-500' : 
                                            i === 1 ? 'bg-indigo-500' : 
                                            'bg-emerald-500'
                                        }`}
                                    />
                                </div>
                                {i < data.funnel.length - 1 && (
                                    <div className="flex justify-center py-1">
                                        <div className="w-px h-4 bg-gradient-to-b from-main to-transparent" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 p-6 bg-primary-500/5 border border-primary-500/10 rounded-2xl">
                        <div className="flex items-center gap-3 mb-2">
                            <PieIcon size={16} className="text-primary-500" />
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Conversion Intelligence</span>
                        </div>
                        <p className="text-[11px] text-muted leading-relaxed font-medium">
                            Based on current throughput, your institution has a <span className="text-primary-500 font-bold">{(data.funnel[2].value / data.funnel[0].value * 100).toFixed(1)}%</span> final completion efficiency.
                        </p>
                    </div>
                </div>

                {/* Usage Trends */}
                <div className="lg:col-span-2 bg-surface/30 border border-main rounded-[2.5rem] p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black text-primary flex items-center gap-3">
                                <BarChart3 size={20} className="text-primary-500" />
                                USAGE GROWTH TRENDS
                            </h3>
                            <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Cross-sectional platform adoption</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary-500" />
                                <span className="text-[9px] font-black text-muted uppercase">Users</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-[9px] font-black text-muted uppercase">Exams</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-[380px] w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <AreaChart data={data?.trends || []}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorExams" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--primary-rgb), 0.05)" vertical={false} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: 'var(--muted)', fontSize: 10, fontWeight: 700}} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--muted)', fontSize: 10, fontWeight: 700}} />
                                <Tooltip 
                                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--main)', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    itemStyle={{ fontSize: '11px', fontWeight: 900 }}
                                />
                                <Area type="monotone" dataKey="users" stroke="var(--primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorUsers)" />
                                <Area type="monotone" dataKey="exams" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorExams)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* --- DETAILED DATA GRID (Placeholder for more detail) --- */}
            <div className="bg-surface/40 backdrop-blur-md border border-main rounded-[2.5rem] p-12 text-center space-y-6">
                <div className="w-20 h-20 bg-primary-500/10 rounded-3xl flex items-center justify-center mx-auto border border-primary-500/20 shadow-inner group transition-all hover:rotate-12">
                    <PieIcon size={40} className="text-primary-500" />
                </div>
                <div className="max-w-xl mx-auto">
                    <h3 className="text-xl font-black text-primary">ADVANCED ANALYTICS NODES</h3>
                    <p className="text-sm text-muted leading-relaxed mt-2">
                        Deeper insights including cohort analysis, student retention heatmaps, and exam difficulty indexing are being processed by the intelligence core.
                    </p>
                </div>
                <div className="flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-muted uppercase tracking-widest">Cohort Analysis Ready</span>
                    </div>
                    <div className="flex items-center gap-2 text-primary-500">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Processing Insights...</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const KPICard = ({ title, value, label, icon: Icon, trend, color }) => {
    const colors = {
        primary: "bg-primary-500/10 text-primary-500 border-primary-500/20",
        emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        amber: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        rose: "bg-rose-500/10 text-rose-500 border-rose-500/20"
    };

    return (
        <div className="bg-surface/30 border border-main p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden group hover:border-primary-500/20 transition-all">
            <div className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-primary-500/10 to-transparent blur-3xl opacity-20 group-hover:opacity-40 transition-opacity`} />
            
            <div className="flex items-center justify-between mb-6">
                <div className={`w-12 h-12 rounded-2xl ${colors[color]} flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110`}>
                    <Icon size={24} />
                </div>
                <div className="flex flex-col items-end">
                    <div className="text-[9px] font-black text-muted uppercase tracking-widest">{title}</div>
                    <div className="flex items-center gap-1.5">
                        {trend.type === 'up' ? <ArrowUpRight size={12} className="text-emerald-500" /> : 
                         trend.type === 'down' ? <ArrowDownRight size={12} className="text-rose-500" /> : 
                         <ChevronRight size={12} className="text-muted" />}
                        <span className={`text-[10px] font-black uppercase ${
                            trend.type === 'up' ? 'text-emerald-500' : 
                            trend.type === 'down' ? 'text-rose-500' : 
                            'text-muted'
                        }`}>{trend.val}</span>
                    </div>
                </div>
            </div>
            
            <div className="space-y-1">
                <p className="text-4xl font-black text-primary tracking-tighter tabular-nums">{value}</p>
                <p className="text-[11px] font-bold text-muted uppercase tracking-widest">{label}</p>
            </div>
            
            <div className="mt-6 pt-4 border-t border-main flex items-center justify-between">
                <span className="text-[9px] font-black text-muted/40 uppercase tracking-widest">Macro Delta</span>
                <div className="w-16 h-1 bg-main/50 rounded-full overflow-hidden">
                    <div className={`h-full bg-${color === 'primary' ? 'primary' : color}-500 w-[65%]`} />
                </div>
            </div>
        </div>
    );
};

export default InstitutionAnalytics;
