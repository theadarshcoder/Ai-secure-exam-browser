import React, { useState, useEffect } from 'react';
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

    if (loading) {
        return (
            <div className="h-screen bg-main flex items-center justify-center">
                <RefreshCw className="animate-spin text-primary-500" size={32} />
            </div>
        );
    }

    const StatCard = ({ title, status, latency, icon: Icon, color }) => (
        <div className="bg-surface border border-main rounded-3xl p-6 flex items-center justify-between shadow-sm group hover:border-primary-500/20 transition-all">
            <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-${color}-500/10 text-${color}-500 flex items-center justify-center border border-${color}-500/20 shadow-inner`}>
                    <Icon size={28} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-primary">{title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`w-2 h-2 rounded-full ${status === 'up' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted">{status === 'up' ? 'Operational' : 'Critical Failure'}</span>
                    </div>
                </div>
            </div>
            <div className="text-right">
                <p className="text-xs font-black text-muted uppercase tracking-widest">Latency</p>
                <p className="text-xl font-black text-primary tabular-nums">{latency}ms</p>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-main font-sans text-primary select-none antialiased">
            <PremiumSidebar
                expanded={sidebarExpanded}
                onToggle={setSidebarExpanded}
                navItems={[
                    { id: 'back', label: 'Dashboard', icon: ChevronLeft },
                ]}
                activeTab={null}
                setActiveTab={() => navigate('/super-admin')}
                userName={userName}
                userRole="super_admin"
                onLogout={() => { sessionStorage.clear(); window.location.href = '/login'; }}
                brandLabel="HEALTH"
            />

            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="h-14 bg-surface/80 backdrop-blur-md border-b border-main flex items-center justify-between px-8 shrink-0 relative z-40">
                    <div className="flex items-center gap-3 text-sm font-semibold text-muted">
                        <Activity size={16} className="text-emerald-500" />
                        <span>Platform Operations</span>
                        <ChevronLeft size={14} className="opacity-30 mx-1" />
                        <span className="text-primary font-bold">Infrastructure Cockpit</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black uppercase text-muted tracking-[0.2em]">{refreshing ? 'Syncing...' : 'Live Engine Status'}</span>
                        <ThemeToggle />
                        <button onClick={() => fetchData(true)} className={`p-2 text-muted hover:text-primary-500 transition-all ${refreshing ? 'animate-spin' : ''}`}>
                            <RefreshCw size={20} />
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-main/50">
                    <div className="max-w-6xl mx-auto space-y-8">
                        
                        {/* Core Infrastructure */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard title="MongoDB Cluster" status={health?.database?.status} latency={health?.database?.latency || 0} icon={Database} color="emerald" />
                            <StatCard title="Redis Cache" status={health?.cache?.status} latency={health?.cache?.latency || 0} icon={Zap} color="amber" />
                            <StatCard title="Judge0 Engine" status={health?.judge0?.status} latency={health?.judge0?.latency || 0} icon={Terminal} color="indigo" />
                            <div className="bg-surface border border-main rounded-3xl p-6 flex items-center justify-between shadow-sm group hover:border-primary-500/20 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center border border-violet-500/20 shadow-inner">
                                        <BarChart size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-primary">AI Engines</h3>
                                        <div className="flex flex-col gap-1 mt-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-1.5 h-1.5 rounded-full ${health?.ai?.gemini === 'up' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                <span className="text-[9px] font-black uppercase text-muted tracking-widest">Gemini Engine</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`w-1.5 h-1.5 rounded-full ${health?.ai?.groq === 'up' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                <span className="text-[9px] font-black uppercase text-muted tracking-widest">Groq Engine</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Live Status Row */}
                        <div className="bg-primary-500/5 border border-primary-500/10 rounded-2xl p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary-500/20 rounded-xl text-primary-500">
                                    <Activity size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-muted uppercase tracking-widest">Live Active Connections</p>
                                    <p className="text-xl font-black text-primary tabular-nums">{health?.connections?.active || 0} <span className="text-[10px] font-bold text-muted ml-1 uppercase tracking-tighter">Nodes Online</span></p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Real-time Stream Active</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            
                            {/* Resource Consumption */}
                            <section className="lg:col-span-1 space-y-6">
                                <div className="bg-surface border border-main rounded-3xl p-8 space-y-6 shadow-sm">
                                    <h3 className="text-lg font-bold text-primary flex items-center gap-3"><Cpu size={20} className="text-primary-500" /> Node Resources</h3>
                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex justify-between text-[11px] font-black text-muted uppercase tracking-widest mb-2">
                                                <span>Heap Memory</span>
                                                <span>{health?.memory ? Math.round(health.memory.heapUsed / 1024 / 1024) : 0}MB</span>
                                            </div>
                                            <div className="h-2 bg-main rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${health?.memory ? (health.memory.heapUsed / health.memory.heapTotal) * 100 : 0}%` }}
                                                    className="h-full bg-primary-500 rounded-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" 
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-[11px] font-black text-muted uppercase tracking-widest mb-2">
                                                <span>RSS Usage</span>
                                                <span>{health?.memory ? Math.round(health.memory.rss / 1024 / 1024) : 0}MB</span>
                                            </div>
                                            <div className="h-2 bg-main rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min((health?.memory?.rss / (512 * 1024 * 1024)) * 100, 100)}%` }}
                                                    className="h-full bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]" 
                                                />
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-main flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-xs font-bold text-muted"><Clock size={14} /> Node Uptime</div>
                                            <span className="text-sm font-black text-primary tabular-nums">{health?.uptime ? `${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m` : '0h 0m'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-surface border border-main rounded-3xl p-8 space-y-4 shadow-sm">
                                    <h3 className="text-sm font-bold text-primary flex items-center gap-2"><ShieldCheck size={16} className={health?.security?.criticalAlerts > 0 ? 'text-rose-500' : 'text-emerald-500'} /> Security Telemetry</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-main/50 rounded-2xl border border-main">
                                            <p className="text-[10px] font-black text-muted uppercase tracking-tighter">Critical Alerts</p>
                                            <p className={`text-lg font-black ${health?.security?.criticalAlerts > 0 ? 'text-rose-500' : 'text-primary'}`}>{health?.security?.criticalAlerts || 0}</p>
                                        </div>
                                        <div className="p-3 bg-main/50 rounded-2xl border border-main">
                                            <p className="text-[10px] font-black text-muted uppercase tracking-tighter">Warnings</p>
                                            <p className={`text-lg font-black ${health?.security?.warnings > 5 ? 'text-amber-500' : 'text-primary'}`}>{health?.security?.warnings || 0}</p>
                                        </div>
                                    </div>
                                    <div className={`p-4 rounded-2xl border ${health?.security?.criticalAlerts > 0 ? 'bg-rose-500/5 border-rose-500/10' : 'bg-emerald-500/5 border-emerald-500/10'}`}>
                                        <p className={`text-[11px] font-medium leading-relaxed italic ${health?.security?.criticalAlerts > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                            {health?.security?.criticalAlerts > 0 
                                                ? '🚨 Security breach attempt detected! Immediate review of audit logs required.' 
                                                : '🛡️ All firewall rules active. No intrusion detected in recent socket handshakes.'}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Queue Monitor */}
                            <section className="lg:col-span-2 bg-surface border border-main rounded-3xl overflow-hidden shadow-sm flex flex-col">
                                <div className="p-6 border-b border-main bg-surface-hover/30 flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-primary flex items-center gap-3"><Layers size={20} className="text-amber-500" /> Queue Manager (BullMQ)</h3>
                                    <Badge color="emerald">Cluster Active</Badge>
                                </div>
                                <div className="flex-1 overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-surface-hover/50 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                                            <tr>
                                                <th className="px-6 py-4">Queue Name</th>
                                                <th className="px-6 py-4">Waiting</th>
                                                <th className="px-6 py-4">Active</th>
                                                <th className="px-6 py-4">Failed</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-main">
                                            {queues.map((q, i) => (
                                                <tr key={i} className="hover:bg-surface-hover/20 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                            <span className="text-xs font-bold text-primary capitalize">{q.name.replace(/-/g, ' ')}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-bold text-primary tabular-nums">{q.waiting}</td>
                                                    <td className="px-6 py-4 text-sm font-bold text-emerald-500 tabular-nums">{q.active}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${q.failed > 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-500/10 text-slate-500'}`}>
                                                            {q.failed} FAILED
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button 
                                                            disabled={q.failed === 0}
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
        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${styles[color] || 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
            {children}
        </span>
    );
};
