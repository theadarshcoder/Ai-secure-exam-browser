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
import BouncingDotLoader from '../../components/BouncingDotLoader';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';

const InstitutionAnalytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dateRange, setDateRange] = useState('30d');
    const [dropdownOpen, setDropdownOpen] = useState(false);

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const { data: res } = await api.get(`/api/v1/analytics/strategic?range=${dateRange}`);
            
            // 🛡️ Fix: Handle unwrapped response from standardized api interceptor
            // In the new api.js, res is already the 'data' field of the response.
            if (res && (res.funnel || res.growth)) {
                const b = res;
                
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
                        const e = b.growth?.exams?.[i] || { count: 0 };
                        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                        const month = u._id?.month || 1;
                        const year = u._id?.year || new Date().getFullYear();
                        return {
                            date: `${monthNames[month - 1]} ${year}`,
                            users: u.count || 0,
                            exams: e.count || 0
                        };
                    }) || []
                };
                setData(transformedData);
                setError(null);
            } else {
                setError("No data received from intelligence core");
            }
        } catch (error) {
            console.error("Strategic Analytics fetch failed:", error);
            setError("Failed to sync live analytics. Please check your connection.");
            toast.error("Failed to sync live analytics");
        } finally {
            setLoading(false);
        }
    };

    if (loading && !data) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <BouncingDotLoader text="Processing behavioral intelligence..." />
        </div>
    );

    if (error && !data) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-6 bg-surface/30 border border-main p-12 rounded-[2.5rem] max-w-md text-center">
                <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center border border-rose-500/20 shadow-inner">
                    <AlertCircle className="text-rose-500" size={40} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-primary uppercase">Analytics Unavailable</h3>
                    <p className="text-sm text-muted mt-2 font-medium">{error || "No intelligence data found for this period."}</p>
                </div>
                <button 
                    onClick={fetchAnalytics}
                    className="mt-4 px-8 py-3 bg-primary-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-600 transition-all active:scale-95"
                >
                    Retry Synthesis
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* --- STRATEGIC HEADER --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative">
                <div>
                    <h1 className="text-2xl font-bold text-primary tracking-tight flex items-center gap-3">
                        <Target className="text-primary-500" size={24} /> Analytics & Insights
                    </h1>
                    <p className="text-sm text-muted mt-1 font-medium">Platform usage and behavioral trends</p>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto relative">
                    <div className="relative">
                        <button 
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="bg-surface border border-main rounded-xl px-4 py-2 flex items-center gap-3 hover:border-primary-500/30 transition-all shadow-sm"
                        >
                            <Calendar size={14} className="text-primary-500" />
                            <span className="text-[12px] font-medium text-primary">
                                {dateRange === '7d' ? 'Last 7 Days' : dateRange === '30d' ? 'Last 30 Days' : 'Quarterly'}
                            </span>
                            <ChevronDown size={14} className={`text-muted transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {dropdownOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="absolute top-full right-0 mt-2 w-full min-w-[160px] bg-surface border border-main rounded-xl shadow-lg z-[100] p-1 overflow-hidden"
                                >
                                    {[
                                        { id: '7d', label: 'Last 7 Days', icon: Clock },
                                        { id: '30d', label: 'Last 30 Days', icon: Calendar },
                                        { id: '90d', label: 'Quarterly', icon: TrendingUp }
                                    ].map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => { setDateRange(opt.id); setDropdownOpen(false); }}
                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[12px] font-medium transition-all ${
                                                dateRange === opt.id 
                                                ? 'bg-primary-500/10 text-primary-500' 
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

                    <button className="p-2 bg-surface border border-main text-muted rounded-xl hover:text-primary transition-all shadow-sm">
                        <Download size={16} />
                    </button>
                    <button className="p-2 bg-surface border border-main text-muted rounded-xl hover:text-primary transition-all shadow-sm">
                        <Share2 size={16} />
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Exam Funnel */}
                <div className="lg:col-span-1 bg-surface/40 backdrop-blur-md border border-main rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-base font-semibold text-primary flex items-center gap-2">
                            <Layers size={18} className="text-primary-500" />
                            Exam Funnel
                        </h3>
                    </div>
                    
                    <div className="space-y-6">
                        {data?.funnel?.map((step, i) => (
                            <div key={i} className="space-y-2 group">
                                <div className="flex justify-between items-end">
                                    <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">{step.name}</span>
                                    <span className="text-sm font-bold text-primary tabular-nums">{step.value}</span>
                                </div>
                                <div className="h-3 bg-main/50 rounded-full overflow-hidden border border-main/50">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(step.value / (data?.funnel?.[0]?.value || 1)) * 100}%` }}
                                        transition={{ duration: 1.5, delay: i * 0.2 }}
                                        className={`h-full rounded-full shadow-sm ${
                                            i === 0 ? 'bg-primary-500' : 
                                            i === 1 ? 'bg-indigo-500' : 
                                            'bg-emerald-500'
                                        }`}
                                    />
                                </div>
                                {i < (data?.funnel?.length || 0) - 1 && (
                                    <div className="flex justify-center py-1">
                                        <div className="w-px h-3 bg-main" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-4 bg-primary-500/5 border border-primary-500/10 rounded-xl">
                        <div className="flex items-center gap-2 mb-1.5">
                            <PieIcon size={14} className="text-primary-500" />
                            <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">Conversion</span>
                        </div>
                        <p className="text-[12px] text-muted leading-relaxed font-medium">
                            Based on current throughput, your institution has a <span className="text-primary-500 font-bold">
                                {((data?.funnel?.[2]?.value || 0) / (data?.funnel?.[0]?.value || 1) * 100).toFixed(1)}%
                            </span> final completion efficiency.
                        </p>
                    </div>
                </div>

                {/* Usage Trends */}
                <div className="lg:col-span-2 bg-surface/40 backdrop-blur-md border border-main rounded-2xl p-6 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-base font-semibold text-primary flex items-center gap-2">
                                <BarChart3 size={18} className="text-primary-500" />
                                Platform Adoption
                            </h3>
                            <p className="text-[11px] text-muted font-medium mt-1">Cross-sectional usage trends</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary-500" />
                                <span className="text-[10px] font-semibold text-muted uppercase">Users</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-semibold text-muted uppercase">Exams</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-[300px]">
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
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: 'var(--muted)', fontSize: 10, fontWeight: 500}} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--muted)', fontSize: 10, fontWeight: 500}} />
                                <Tooltip 
                                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--main)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                    itemStyle={{ fontSize: '11px', fontWeight: 600 }}
                                />
                                <Area type="monotone" dataKey="users" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                                <Area type="monotone" dataKey="exams" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorExams)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* --- DETAILED DATA GRID (Placeholder for more detail) --- */}
            <div className="bg-surface/40 backdrop-blur-md border border-main rounded-2xl p-8 text-center space-y-4 shadow-sm">
                <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center mx-auto border border-primary-500/20 text-primary-500">
                    <PieIcon size={24} />
                </div>
                <div className="max-w-xl mx-auto">
                    <h3 className="text-lg font-semibold text-primary">Advanced Analytics Ready</h3>
                    <p className="text-sm text-muted font-medium mt-1">
                        Deeper insights including cohort analysis, student retention heatmaps, and exam difficulty indexing are being processed by the intelligence core.
                    </p>
                </div>
            </div>
        </div>
    );
};

const KPICard = ({ title, value, label, icon: Icon, trend, color }) => {
    const textColors = {
        primary: "text-primary-500",
        emerald: "text-emerald-500",
        amber: "text-amber-500",
        rose: "text-rose-500"
    };

    return (
        <div className="bg-surface border border-main rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-primary-500/30 transition-all group h-full gap-4">
            <div className="flex items-center gap-3">
                <Icon className={`${textColors[color] || 'text-muted'} shrink-0`} size={20} />
                <div className="flex flex-col">
                    <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">{title}</p>
                    <h4 className="text-xl font-bold text-primary tabular-nums leading-none mt-1">{value}</h4>
                </div>
            </div>
            
            <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] font-medium text-muted uppercase tracking-wider truncate max-w-[80px]">{label}</span>
                <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    trend.type === 'up' ? 'text-emerald-500 bg-emerald-500/10' : 
                    trend.type === 'down' ? 'text-rose-500 bg-rose-500/10' : 
                    'text-muted bg-main'
                }`}>
                    {trend.type === 'up' ? <ArrowUpRight size={12} /> : 
                     trend.type === 'down' ? <ArrowDownRight size={12} /> : 
                     <ChevronRight size={12} />}
                    {trend.val}
                </div>
            </div>
        </div>
    );
};

export default InstitutionAnalytics;
