import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Building, 
    Inbox, 
    Shield, 
    Server, 
    Power, 
    LayoutDashboard,
    Globe,
    Activity,
    Users,
    ChevronRight,
    Search,
    Bell,
    Settings,
    ShieldAlert,
    Database,
    Clock,
    BarChart3,
    Terminal,
    FileText,
    ExternalLink,
    AlertCircle,
    CheckCircle2,
    RefreshCw,
    X
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import PremiumSidebar from '../components/PremiumSidebar';
import { ThemeToggle } from '../contexts/ThemeContext';
import VisionLogo from '../components/VisionLogo';

export default function SuperAdminDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('demo-requests');
    const [demoRequests, setDemoRequests] = useState([]);
    const [institutions, setInstitutions] = useState([]);
    const [stats, setStats] = useState({ totalInstitutions: 0, totalStudents: 0, totalExams: 0, pendingDemos: 0, activeTenants: 0, uptime: 0 });
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sidebarExpanded, setSidebarExpanded] = useState(true);
    const [userName] = useState(sessionStorage.getItem('vision_name') || 'Platform Owner');

    const navItems = [
        { id: 'demo-requests', label: 'Onboarding', icon: Inbox },
        { id: 'institutions', label: 'Institutions', icon: Building },
        { id: 'intelligence', label: 'Intelligence', icon: BarChart3 },
        { id: 'audit-trail', label: 'Audit Trail', icon: FileText },
        { id: 'health', label: 'System Health', icon: Activity },
        { id: 'settings', label: 'Global Settings', icon: Settings },
    ];

    useEffect(() => {
        if (activeTab === 'health') {
            navigate('/super-admin/health');
            return;
        }
        if (activeTab === 'settings') {
            navigate('/super-admin/settings');
            return;
        }
        fetchData();
        fetchStats();
    }, [activeTab]);

    const fetchStats = async () => {
        try {
            const { data } = await api.get('/api/super-admin/stats');
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch platform stats');
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'demo-requests') {
                const { data } = await api.get('/api/super-admin/demo-requests');
                setDemoRequests(data);
            } else if (activeTab === 'institutions') {
                const { data } = await api.get('/api/super-admin/institutions');
                setInstitutions(data);
            } else if (activeTab === 'intelligence') {
                await fetchStats();
            } else if (activeTab === 'audit-trail') {
                const { data } = await api.get('/api/super-admin/audit-logs');
                setAuditLogs(data);
            }
        } catch (error) {
            toast.error('Failed to load platform data');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            const { data } = await api.post(`/api/super-admin/demo-requests/${id}/approve`);
            toast.success('Institution provisioned successfully!');
            toast.success(`Admin Password: ${data.adminPassword}`, { duration: 15000 });
            fetchData();
            fetchStats();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Provisioning failed');
        }
    };

    const handleToggleStatus = async (inst) => {
        const action = inst.status === 'active' ? 'suspend' : 'activate';
        if (!window.confirm(`Are you sure you want to ${action} ${inst.name}?\n\n${action === 'suspend' ? 'This will block all students and mentors from this institution immediately.' : 'This will restore access for all users.'}`)) return;

        try {
            await api.patch(`/api/super-admin/institutions/${inst._id}/status`, { 
                status: inst.status === 'active' ? 'suspended' : 'active' 
            });
            toast.success(`Tenant ${action}ed successfully`);
            fetchData();
        } catch (error) {
            toast.error(`Failed to ${action} tenant`);
        }
    };

    const formatUptime = (seconds) => {
        if (!seconds) return '0h 0m';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    const Badge = ({ children, color }) => {
        const styles = {
            emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
            amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
            red: 'bg-red-500/10 text-red-500 border-red-500/20',
            indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
            rose: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
        };
        return (
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${styles[color] || 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                {children}
            </span>
        );
    };

    const filteredInstitutions = institutions.filter(inst => 
        inst.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        inst.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inst.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-screen bg-main font-sans text-primary select-none antialiased">
            <PremiumSidebar
                expanded={sidebarExpanded}
                onToggle={setSidebarExpanded}
                navItems={navItems}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                userName={userName}
                userRole="super_admin"
                onLogout={() => { sessionStorage.clear(); window.location.href = '/login'; }}
                brandLabel="PLATFORM"
            />

            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="h-14 bg-surface/80 backdrop-blur-md border-b border-main flex items-center justify-between px-8 shrink-0 relative z-40">
                    <div className="flex items-center gap-3 text-sm font-semibold text-muted">
                        <Terminal size={16} className="text-primary-500" />
                        <span>Platform Engine</span>
                        <ChevronRight size={14} className="opacity-30" />
                        <span className="text-primary capitalize">{activeTab.replace('-', ' ')}</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                            <Activity size={12} className="text-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">v1.5.0 — Managed</span>
                        </div>
                        <ThemeToggle />
                        <button className="relative p-2 text-muted hover:text-primary transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-rose-500 rounded-full border border-surface" />
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-main/50">
                    <div className="max-w-6xl mx-auto space-y-8">
                        
                        {/* Summary Stats Row */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Active Tenants', val: stats.activeTenants, icon: Building, color: 'indigo' },
                                { label: 'Platform Users', val: stats.totalStudents, icon: Users, color: 'emerald' },
                                { label: 'Exams Provisioned', val: stats.totalExams, icon: FileText, color: 'primary' },
                                { label: 'Sys Uptime', val: formatUptime(stats.uptime), icon: Clock, color: 'amber' },
                            ].map((s, i) => (
                                <div key={i} className="bg-surface border border-main rounded-2xl p-5 shadow-sm hover:border-primary-500/30 transition-all group">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className={`p-2 rounded-lg bg-${s.color}-500/10 text-${s.color}-500`}>
                                            <s.icon size={18} />
                                        </div>
                                        <Badge color={s.color}>{s.label}</Badge>
                                    </div>
                                    <p className="text-2xl font-black text-primary tabular-nums tracking-tight">{s.val}</p>
                                </div>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                {activeTab === 'demo-requests' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-xl font-bold text-primary tracking-tight">Access Requests</h2>
                                            <Badge color="amber">{demoRequests.filter(r => r.status === 'pending').length} Pending</Badge>
                                        </div>
                                        <div className="grid gap-4">
                                            {demoRequests.map((req) => (
                                                <div key={req._id} className="bg-surface border border-main rounded-2xl p-6 hover:shadow-lg transition-all group relative overflow-hidden">
                                                    {req.status === 'pending' && <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-6">
                                                            <div className="w-14 h-14 rounded-2xl bg-surface-hover border border-main flex items-center justify-center text-muted group-hover:text-primary-500 transition-colors">
                                                                <Inbox size={28} />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-lg font-bold text-primary tracking-tight">{req.institutionName}</h3>
                                                                <div className="flex gap-4 mt-2 text-[12px] font-medium text-muted">
                                                                    <span className="flex items-center gap-1.5"><Users size={14} /> {req.name}</span>
                                                                    <span className="opacity-20">|</span>
                                                                    <span>{req.email}</span>
                                                                    {req.website && <>
                                                                        <span className="opacity-20">|</span>
                                                                        <a href={req.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary-500 hover:underline"><Globe size={12} /> Website</a>
                                                                    </>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            {req.status === 'pending' ? (
                                                                <>
                                                                    <button onClick={() => handleApprove(req._id)} className="px-6 py-2.5 bg-primary-500 text-white hover:bg-primary-600 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-primary-500/20">Provision Tenant</button>
                                                                    <button onClick={() => api.post(`/api/super-admin/demo-requests/${req._id}/reject`).then(fetchData)} className="px-6 py-2.5 bg-surface border border-main text-muted hover:text-rose-500 hover:border-rose-500/30 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all">Reject</button>
                                                                </>
                                                            ) : <Badge color={req.status === 'approved' ? 'emerald' : 'red'}>{req.status}</Badge>}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {demoRequests.length === 0 && <div className="text-center py-20 text-muted italic">No access requests found.</div>}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'institutions' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-xl font-bold text-primary tracking-tight">Tenant Infrastructure</h2>
                                            <div className="flex items-center gap-3 bg-surface border border-main rounded-xl px-4 py-2">
                                                <Search size={16} className="text-muted" />
                                                <input 
                                                    type="text" 
                                                    placeholder="Search code, domain, name..." 
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="bg-transparent border-none focus:outline-none text-sm text-primary placeholder:text-muted/40 w-64" 
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-4">
                                            {filteredInstitutions.map((inst) => (
                                                <div key={inst._id} className="bg-surface border border-main rounded-2xl p-6 hover:shadow-lg transition-all group">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-6">
                                                            <div className="w-14 h-14 rounded-2xl bg-surface-hover border border-main flex items-center justify-center text-muted group-hover:text-indigo-500 transition-colors">
                                                                <Server size={28} />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-3">
                                                                    <h3 className="text-lg font-bold text-primary tracking-tight">{inst.name}</h3>
                                                                    <Badge color={inst.status === 'active' ? 'emerald' : 'red'}>{inst.status}</Badge>
                                                                </div>
                                                                <div className="flex gap-4 mt-2 text-[12px] font-medium text-muted">
                                                                    <span className="font-mono bg-main px-2 py-0.5 rounded text-[10px]">{inst.code}</span>
                                                                    <span className="opacity-20">|</span>
                                                                    <span>{inst.domain}</span>
                                                                    <span className="opacity-20">|</span>
                                                                    <span className="capitalize">{inst.plan} Plan</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <button onClick={() => navigate(`/super-admin/institutions/${inst._id}`)} className="px-6 py-2.5 bg-surface border border-main text-primary hover:bg-surface-hover rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm">Manage</button>
                                                            <button onClick={() => handleToggleStatus(inst)} className={`p-3 rounded-xl transition-all border ${inst.status === 'active' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}><Power size={20} /></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {filteredInstitutions.length === 0 && <div className="text-center py-20 text-muted italic">No matching tenants found.</div>}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'intelligence' && (
                                    <div className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="bg-surface border border-main rounded-3xl p-8 space-y-6 shadow-sm">
                                                <h3 className="text-lg font-bold text-primary flex items-center gap-3"><ShieldAlert size={20} className="text-rose-500" /> Platform Integrity</h3>
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between p-4 bg-main/50 rounded-2xl border border-main">
                                                        <div className="flex items-center gap-3">
                                                            <Shield size={18} className="text-emerald-500" />
                                                            <span className="text-sm font-bold text-primary">Tenant Isolation Guard</span>
                                                        </div>
                                                        <Badge color="emerald">Hardened</Badge>
                                                    </div>
                                                    <div className="flex items-center justify-between p-4 bg-main/50 rounded-2xl border border-main">
                                                        <div className="flex items-center gap-3">
                                                            <Database size={18} className="text-indigo-500" />
                                                            <span className="text-sm font-bold text-primary">Encryption Layer</span>
                                                        </div>
                                                        <span className="text-[10px] font-black text-muted uppercase">AES-256-GCM</span>
                                                    </div>
                                                    <div className="flex items-center justify-between p-4 bg-main/50 rounded-2xl border border-main">
                                                        <div className="flex items-center gap-3">
                                                            <Activity size={18} className="text-amber-500" />
                                                            <span className="text-sm font-bold text-primary">Middleware Governance</span>
                                                        </div>
                                                        <Badge color="emerald">Active</Badge>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-surface border border-main rounded-3xl p-8 space-y-6 shadow-sm">
                                                <h3 className="text-lg font-bold text-primary flex items-center gap-3"><BarChart3 size={20} className="text-primary-500" /> Infrastructure Load</h3>
                                                <div className="space-y-6">
                                                    <div>
                                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted mb-2"><span>Database Connections</span><span>Healthy</span></div>
                                                        <div className="h-2 bg-main rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-[24%] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]" /></div>
                                                    </div>
                                                    <div>
                                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted mb-2"><span>Worker Saturation</span><span>Low</span></div>
                                                        <div className="h-2 bg-main rounded-full overflow-hidden"><div className="h-full bg-primary-500 w-[12%] rounded-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.4)]" /></div>
                                                    </div>
                                                    <div>
                                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted mb-2"><span>Redis Memory Ops</span><span>Optimal</span></div>
                                                        <div className="h-2 bg-main rounded-full overflow-hidden"><div className="h-full bg-amber-500 w-[18%] rounded-full shadow-[0_0_8px_rgba(245,158,11,0.4)]" /></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Activity Snapshot Placeholder */}
                                        <div className="bg-surface border border-main rounded-3xl p-8 text-center space-y-4">
                                            <div className="w-16 h-16 bg-main rounded-2xl flex items-center justify-center mx-auto mb-4 border border-main">
                                                <Activity size={32} className="text-primary-500" />
                                            </div>
                                            <h3 className="text-lg font-bold text-primary">Traffic Intelligence Coming Soon</h3>
                                            <p className="text-sm text-muted max-w-md mx-auto leading-relaxed">We are calibrating the real-time aggregation engine. Advanced traffic charts and heatmaps will be available in the next minor update.</p>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'audit-trail' && (
                                    <div className="bg-surface border border-main rounded-3xl overflow-hidden shadow-sm flex flex-col h-[calc(100vh-320px)]">
                                        <div className="p-6 border-b border-main bg-surface-hover/30 flex items-center justify-between shrink-0">
                                            <h3 className="text-lg font-bold text-primary flex items-center gap-3"><FileText size={20} className="text-primary-500" /> Global Event Stream</h3>
                                            <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-main border border-main rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-primary-500 transition-all">
                                                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                                                Refresh Stream
                                            </button>
                                        </div>
                                        <div className="flex-1 overflow-auto custom-scrollbar">
                                            <table className="w-full text-left">
                                                <thead className="bg-surface-hover/50 text-[10px] font-black uppercase tracking-[0.2em] text-muted sticky top-0 z-10">
                                                    <tr>
                                                        <th className="px-6 py-4">Timestamp</th>
                                                        <th className="px-6 py-4">Actor</th>
                                                        <th className="px-6 py-4">Severity</th>
                                                        <th className="px-6 py-4">Action</th>
                                                        <th className="px-6 py-4">Target Entity</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-main">
                                                    {auditLogs.map((log) => (
                                                        <tr key={log._id} className="hover:bg-surface-hover/20 transition-colors">
                                                            <td className="px-6 py-4 text-[11px] font-medium text-muted whitespace-nowrap tabular-nums">{new Date(log.createdAt).toLocaleString()}</td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex flex-col">
                                                                    <span className="text-xs font-bold text-primary">{log.performedBy?.name || 'System'}</span>
                                                                    <span className="text-[10px] text-muted">{log.performedBy?.email || 'automated@platform'}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <Badge color={log.severity === 'critical' ? 'rose' : log.severity === 'warning' ? 'amber' : 'indigo'}>
                                                                    {log.severity || 'info'}
                                                                </Badge>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="text-xs font-bold text-primary">{log.action.replace(/_/g, ' ')}</span>
                                                            </td>
                                                            <td className="px-6 py-4 text-xs font-bold text-primary truncate max-w-[200px]">
                                                                {log.institutionId?.name || 'VISION PLATFORM'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {auditLogs.length === 0 && (
                                                        <tr>
                                                            <td colSpan={5} className="text-center py-20 text-muted italic">No logs found for this period.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
}
