import React, { useState, useEffect } from 'react';
import BouncingDotLoader from '../../components/BouncingDotLoader';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Activity, 
    Database, 
    Zap, 
    Cpu, 
    HardDrive, 
    Server, 
    RefreshCw, 
    CheckCircle2, 
    AlertCircle, 
    ShieldCheck,
    Clock,
    Layers,
    Terminal,
    ChevronLeft,
    ChevronRight,
    BarChart
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import PremiumSidebar from '../../components/PremiumSidebar';
import { ThemeToggle } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

export default function SystemHealth() {
    const navigate = useNavigate();
    const [health, setHealth] = useState(null);
    const [queues, setQueues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sidebarExpanded, setSidebarExpanded] = useState(true);
    const [userName] = useState(sessionStorage.getItem('vision_name') || 'Platform Owner');

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000); // Reduced load: Refresh every 60s
        return () => clearInterval(interval);
    }, []);

    const fetchData = async (isManual = false) => {
        if (isManual) setRefreshing(true);
        try {
            const [healthRes, queueRes] = await Promise.all([
                api.get('/api/super-admin/health'),
                api.get('/api/super-admin/queues')
            ]);
            setHealth(healthRes.data);
            setQueues(queueRes.data);
        } catch (error) {
            console.error('Health check failed');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRetryQueue = async (queueId) => {
        try {
            const { data } = await api.post(`/api/super-admin/queues/${queueId}/retry`);
            if (data.success) {
                toast.success(data.message);
                fetchData(); // Refresh stats
            }
        } catch (error) {
            toast.error('Failed to retry queue jobs');
        }
    };

    if (loading) {
        return (
            <div className="h-screen bg-main flex items-center justify-center">
                <BouncingDotLoader text="Syncing system state..." />
            </div>
        );
    }

    const StatCard = ({ title, status, latency, icon: Icon, color }) => (
        <div className="bg-surface border border-main rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all gap-3">
            <div className="flex items-center gap-3">
                <Icon className={`text-${color}-500 shrink-0`} size={16} />
                <div>
                    <h3 className="text-sm font-medium text-primary leading-tight">{title}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status === 'up' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        <span className="text-[10px] uppercase tracking-wide text-muted">{status === 'up' ? 'Operational' : 'Critical'}</span>
                    </div>
                </div>
            </div>
            <div className="text-right shrink-0">
                <p className="text-[10px] text-muted uppercase tracking-wide">Latency</p>
                <p className="text-sm font-medium text-primary tabular-nums mt-0.5">{latency}ms</p>
            </div>
        </div>
    );

    const AIEnginesCard = ({ geminiStatus, groqStatus }) => {
        const isAllUp = geminiStatus === 'up' && groqStatus === 'up';
        const isSomeUp = geminiStatus === 'up' || groqStatus === 'up';
        
        return (
            <div className="bg-surface border border-main rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all gap-3">
                <div className="flex items-center gap-3">
                    <BarChart className="text-blue-500 shrink-0" size={16} />
                    <div>
                        <h3 className="text-sm font-medium text-primary leading-tight">AI Engines</h3>
                        <div className="flex items-center gap-3 mt-0.5">
                            <div className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${geminiStatus === 'up' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                <span className="text-[10px] uppercase tracking-wide text-muted">Gemini</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${groqStatus === 'up' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                <span className="text-[10px] uppercase tracking-wide text-muted">Groq</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-[10px] text-muted uppercase tracking-wide">Latency</p>
                    <p className="text-sm font-medium text-primary tabular-nums mt-0.5">{health?.ai?.latency || 0}ms</p>
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-main font-sans text-primary select-none antialiased">
            <PremiumSidebar 
                expanded={sidebarExpanded}
                onToggle={setSidebarExpanded}
                navItems={[
                    { 
                        id: 'back', 
                        label: 'Dashboard', 
                        icon: ChevronLeft, 
                        onClick: () => {
                            sessionStorage.setItem('sa_active_tab', 'demo-requests');
                            navigate('/super-admin');
                        }
                    },
                ]}
                activeTab={null}
                setActiveTab={() => navigate('/super-admin')}
                userName={userName}
                userRole="super_admin"
                onLogout={() => { sessionStorage.clear(); window.location.href = '/login'; }}
                brandLabel="VISION"
            />

            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="h-14 bg-surface/80 backdrop-blur-md border-b border-main flex items-center justify-between px-8 shrink-0 relative z-40">
                    <div className="flex items-center gap-3 text-sm font-semibold text-muted">
                        <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/super-admin')}>Platform Engine</span>
                        <ChevronRight size={14} className="opacity-40" />
                        <span className="text-primary font-bold">System Health</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-medium uppercase text-muted tracking-wide">{refreshing ? 'Syncing...' : 'Live Engine Status'}</span>
                        <ThemeToggle />
                        <button onClick={() => fetchData(true)} className={`p-2 text-muted hover:text-primary-500 transition-all ${refreshing ? 'animate-spin' : ''}`}>
                            <RefreshCw size={20} />
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-main/50">
                    <div className="space-y-6">
                        
                        {/* Core Infrastructure */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                            <StatCard title="MongoDB Cluster" status={health?.database?.status} latency={health?.database?.latency || 0} icon={Database} color="emerald" />
                            <StatCard title="Redis Cache" status={health?.cache?.status} latency={health?.cache?.latency || 0} icon={Zap} color="amber" />
                            <StatCard title="Judge0 Engine" status={health?.judge0?.status} latency={health?.judge0?.latency || 0} icon={Terminal} color="indigo" />
                            <AIEnginesCard geminiStatus={health?.ai?.gemini} groqStatus={health?.ai?.groq} />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            
                            {/* Resource Consumption */}
                            <section className="lg:col-span-1 space-y-4">
                                <div className="bg-surface border border-main rounded-xl p-5 space-y-4 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <Cpu size={14} className="text-indigo-400" />
                                        <h3 className="text-sm font-medium text-primary">Node Resources</h3>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-xs text-muted uppercase tracking-wide mb-1.5">
                                                <span>Heap Memory</span>
                                                <span>{health?.memory ? Math.round(health.memory.heapUsed / 1024 / 1024) : 0}MB</span>
                                            </div>
                                            <div className="h-1.5 bg-main rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${health?.memory ? (health.memory.heapUsed / health.memory.heapTotal) * 100 : 0}%` }}
                                                    className="h-full bg-primary-500 rounded-full" 
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs text-muted uppercase tracking-wide mb-1.5">
                                                <span>RSS Usage</span>
                                                <span>{health?.memory ? Math.round(health.memory.rss / 1024 / 1024) : 0}MB</span>
                                            </div>
                                            <div className="h-1.5 bg-main rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min((health?.memory?.rss / (512 * 1024 * 1024)) * 100, 100)}%` }}
                                                    className="h-full bg-primary-500/70 rounded-full" 
                                                />
                                            </div>
                                        </div>
                                        <div className="pt-3 border-t border-main flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-xs text-muted"><Clock size={12} /> Node Uptime</div>
                                            <span className="text-sm font-medium text-primary tabular-nums">{health?.uptime ? `${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m` : '0h 0m'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-surface border border-main rounded-xl p-4 space-y-3 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck size={14} className={health?.security?.criticalAlerts > 0 ? 'text-rose-500' : 'text-emerald-500'} />
                                        <h3 className="text-sm font-medium text-primary">Security Telemetry</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="p-3 bg-main/50 rounded-lg border border-main">
                                            <p className="text-[10px] text-muted uppercase tracking-wide">Critical Alerts</p>
                                            <p className={`text-base font-medium mt-0.5 ${health?.security?.criticalAlerts > 0 ? 'text-rose-500' : 'text-primary'}`}>{health?.security?.criticalAlerts || 0}</p>
                                        </div>
                                        <div className="p-3 bg-main/50 rounded-lg border border-main">
                                            <p className="text-[10px] text-muted uppercase tracking-wide">Warnings</p>
                                            <p className={`text-base font-medium mt-0.5 ${health?.security?.warnings > 5 ? 'text-amber-500' : 'text-primary'}`}>{health?.security?.warnings || 0}</p>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-2.5 rounded-lg border text-xs leading-relaxed ${health?.security?.criticalAlerts > 0 ? 'bg-rose-500/5 border-rose-500/10 text-rose-600' : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-600'}`}>
                                        {health?.security?.criticalAlerts > 0
                                            ? '🚨 Security breach attempt detected! Immediate review required.'
                                            : '🛡️ All firewall rules active. No intrusion detected.'}
                                    </div>
                                </div>
                            </section>

                            {/* Queue Monitor */}
                            <section className="lg:col-span-2 bg-surface border border-main rounded-xl overflow-hidden shadow-sm flex flex-col">
                                <div className="px-5 py-4 border-b border-main flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Layers size={14} className="text-indigo-400" />
                                        <h3 className="text-sm font-medium text-primary">Queue Manager (BullMQ)</h3>
                                    </div>
                                    <Badge color="emerald">Cluster Active</Badge>
                                </div>
                                <div className="flex-1 overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-surface-hover/50">
                                            <tr className="border-b border-main">
                                                <th className="px-5 py-2.5 text-[11px] font-semibold text-primary/60 uppercase tracking-wider">Queue Name</th>
                                                <th className="px-5 py-2.5 text-[11px] font-semibold text-primary/60 uppercase tracking-wider">Waiting</th>
                                                <th className="px-5 py-2.5 text-[11px] font-semibold text-primary/60 uppercase tracking-wider">Active</th>
                                                <th className="px-5 py-2.5 text-[11px] font-semibold text-primary/60 uppercase tracking-wider">Failed</th>
                                                <th className="px-5 py-2.5 text-[11px] font-semibold text-primary/60 uppercase tracking-wider text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-main">
                                            {queues.map((q, i) => (
                                                <tr key={i} className="hover:bg-surface-hover/20 transition-colors border-b border-main last:border-0">
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                            <span className="text-xs font-medium text-primary capitalize">{q.name.replace(/-/g, ' ')}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3 text-xs font-medium text-primary tabular-nums">{q.waiting}</td>
                                                    <td className="px-5 py-3 text-xs font-medium text-emerald-500 tabular-nums">{q.active}</td>
                                                    <td className="px-5 py-3">
                                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${q.failed > 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-500/10 text-slate-500'}`}>
                                                            {q.failed} FAILED
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3 text-right">
                                                        <button 
                                                            disabled={q.failed === 0}
                                                            onClick={() => handleRetryQueue(q.id)}
                                                            className={`p-2 rounded-xl transition-all ${q.failed > 0 ? 'text-primary-500 hover:bg-primary-500/10' : 'text-muted opacity-30'}`}
                                                            title="Retry Failed Jobs"
                                                        >
                                                            <RefreshCw size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

const Badge = ({ children, color }) => {
    const styles = {
        emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        rose: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
        indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    };
    return (
        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border uppercase tracking-wider ${styles[color] || 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
            {children}
        </span>
    );
};
