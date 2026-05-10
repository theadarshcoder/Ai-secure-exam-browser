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
    X,
    Trash2
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
    const [upgradeRequests, setUpgradeRequests] = useState([]);
    const [institutions, setInstitutions] = useState([]);
    const [stats, setStats] = useState({ totalInstitutions: 0, totalStudents: 0, totalExams: 0, pendingDemos: 0, activeTenants: 0, uptime: 0 });
    const [auditLogs, setAuditLogs] = useState([]);
    const [intelligenceData, setIntelligenceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sidebarExpanded, setSidebarExpanded] = useState(true);
    const [userName] = useState(sessionStorage.getItem('vision_name') || 'Platform Owner');
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);

    const navItems = [
        { id: 'demo-requests', label: 'Onboarding', icon: Inbox },
        { id: 'upgrade-requests', label: 'Upgrades', icon: Database },
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
                // 🛡️ Robust Parsing: Handle both direct arrays and paginated objects
                setDemoRequests(Array.isArray(data) ? data : (data.requests || []));
            } else if (activeTab === 'upgrade-requests') {
                const { data } = await api.get('/api/super-admin/upgrade-requests');
                setUpgradeRequests(Array.isArray(data) ? data : (data.requests || []));
            } else if (activeTab === 'institutions') {
                const { data } = await api.get('/api/super-admin/institutions');
                // 🛡️ Robust Parsing: Handle both direct arrays and paginated objects
                setInstitutions(Array.isArray(data) ? data : (data.institutions || []));
            } else if (activeTab === 'intelligence') {
                const { data } = await api.get('/api/super-admin/intelligence');
                setIntelligenceData(data);
            } else if (activeTab === 'audit-trail') {
                const { data } = await api.get('/api/super-admin/audit-logs');
                setAuditLogs(Array.isArray(data) ? data : (data.logs || data.auditLogs || []));
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

    const handleDeleteDemo = async (id) => {
        if (!window.confirm('Are you sure you want to delete this request permanently?')) return;
        try {
            await api.delete(`/api/super-admin/demo-requests/${id}`);
            toast.success('Request deleted');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete request');
        }
    };

    const handleProcessUpgrade = async (id, status) => {
        try {
            await api.patch(`/api/super-admin/upgrade-requests/${id}`, { status });
            toast.success(`Request ${status} successfully!`);
            fetchData();
            fetchStats();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to process upgrade');
        }
    };

    const handleDeleteUpgrade = async (id) => {
        if (!window.confirm('Are you sure you want to delete this upgrade request permanently?')) return;
        try {
            await api.delete(`/api/super-admin/upgrade-requests/${id}`);
            toast.success('Upgrade request deleted');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete request');
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
                        <div className="relative">
                            <button 
                                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                                className="w-10 h-10 rounded-xl bg-main border border-main flex items-center justify-center text-muted hover:text-primary transition-all active:scale-95 relative"
                            >
                                <Bell size={20} />
                                {(stats.pendingDemos > 0 || upgradeRequests.filter(r => r.status === 'pending').length > 0) && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-surface animate-pulse" />
                                )}
                            </button>

                            <AnimatePresence>
                                {showNotifDropdown && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 top-14 w-80 bg-surface border border-main rounded-2xl shadow-2xl z-50 overflow-hidden"
                                    >
                                        <div className="px-5 py-4 border-b border-main bg-surface-hover/30 flex items-center justify-between">
                                            <span className="text-xs font-bold text-primary flex items-center gap-2">
                                                <Bell size={14} className="text-primary-500" /> Notifications
                                            </span>
                                            {(stats.pendingDemos > 0 || upgradeRequests.filter(r => r.status === 'pending').length > 0) && (
                                                <Badge color="amber">Action Required</Badge>
                                            )}
                                        </div>
                                        <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                            {stats.pendingDemos > 0 && (
                                                <button 
                                                    onClick={() => { setActiveTab('demo-requests'); setShowNotifDropdown(false); }}
                                                    className="w-full px-5 py-4 hover:bg-surface-hover/50 flex items-start gap-4 transition-all text-left border-b border-main"
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                                                        <Inbox size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-bold text-primary">Pending Onboarding</p>
                                                        <p className="text-[11px] text-muted mt-0.5">{stats.pendingDemos} institutions waiting for approval.</p>
                                                    </div>
                                                </button>
                                            )}
                                            {upgradeRequests.filter(r => r.status === 'pending').length > 0 && (
                                                <button 
                                                    onClick={() => { setActiveTab('upgrade-requests'); setShowNotifDropdown(false); }}
                                                    className="w-full px-5 py-4 hover:bg-surface-hover/50 flex items-start gap-4 transition-all text-left border-b border-main"
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                                        <Database size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-bold text-primary">Upgrade Requests</p>
                                                        <p className="text-[11px] text-muted mt-0.5">{upgradeRequests.filter(r => r.status === 'pending').length} organizations requesting plan upgrades.</p>
                                                    </div>
                                                </button>
                                            )}
                                            {stats.pendingDemos === 0 && upgradeRequests.filter(r => r.status === 'pending').length === 0 && (
                                                <div className="py-12 text-center text-muted">
                                                    <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center mx-auto mb-3 opacity-20">
                                                        <CheckCircle2 size={24} />
                                                    </div>
                                                    <p className="text-xs font-medium">All caught up!</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-main/50">
                    <div className="max-w-6xl mx-auto space-y-8">
                        
                        {/* Summary Stats Row */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Active Tenants', val: stats.activeTenants, icon: Building, color: 'indigo' },
                                { label: 'Total Platform Users', val: stats.totalUsers, icon: Users, color: 'emerald' },
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
                                                            ) : (
                                                                <>
                                                                    <Badge color={req.status === 'approved' ? 'emerald' : 'red'}>{req.status}</Badge>
                                                                    <button onClick={() => handleDeleteDemo(req._id)} className="p-2.5 text-muted hover:text-rose-500 bg-surface border border-main rounded-xl transition-all"><Trash2 size={16} /></button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {demoRequests.length === 0 && <div className="text-center py-20 text-muted italic">No access requests found.</div>}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'upgrade-requests' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-xl font-bold text-primary tracking-tight">Plan Upgrade Requests</h2>
                                            <Badge color="emerald">{upgradeRequests.filter(r => r.status === 'pending').length} Pending</Badge>
                                        </div>
                                        <div className="grid gap-4">
                                            {upgradeRequests.map((req) => (
                                                <div key={req._id} className="bg-surface border border-main rounded-2xl p-6 hover:shadow-lg transition-all group relative overflow-hidden">
                                                    {req.status === 'pending' && <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-6">
                                                            <div className="w-14 h-14 rounded-2xl bg-surface-hover border border-main flex items-center justify-center text-muted group-hover:text-primary-500 transition-colors">
                                                                <Database size={28} />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <h3 className="text-lg font-bold text-primary tracking-tight">{req.institutionId?.name || 'Unknown Institution'}</h3>
                                                                    <Badge color="indigo">{req.plan} Plan</Badge>
                                                                </div>
                                                                <div className="flex gap-4 mt-2 text-[12px] font-medium text-muted">
                                                                    <span className="flex items-center gap-1.5"><Users size={14} /> {req.requestedBy?.name || 'Unknown'}</span>
                                                                    <span className="opacity-20">|</span>
                                                                    <span className="font-mono bg-main px-2 py-0.5 rounded text-[10px]">TXN: {req.transactionId}</span>
                                                                    <span className="opacity-20">|</span>
                                                                    <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            {req.status === 'pending' ? (
                                                                <>
                                                                    <button onClick={() => handleProcessUpgrade(req._id, 'approved')} className="px-6 py-2.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-500/20">Approve</button>
                                                                    <button onClick={() => handleProcessUpgrade(req._id, 'rejected')} className="px-6 py-2.5 bg-surface border border-main text-muted hover:text-rose-500 hover:border-rose-500/30 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all">Reject</button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Badge color={req.status === 'approved' ? 'emerald' : 'red'}>{req.status}</Badge>
                                                                    <button onClick={() => handleDeleteUpgrade(req._id)} className="p-2.5 text-muted hover:text-rose-500 bg-surface border border-main rounded-xl transition-all"><Trash2 size={16} /></button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {upgradeRequests.length === 0 && <div className="text-center py-20 text-muted italic">No upgrade requests found.</div>}
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
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            {/* Top Institutions by Activity */}
                                            <div className="bg-surface border border-main rounded-3xl p-8 space-y-6 shadow-sm">
                                                <h3 className="text-lg font-bold text-primary flex items-center gap-3"><Building size={20} className="text-indigo-500" /> Active Leaders</h3>
                                                <div className="space-y-4">
                                                    {intelligenceData?.topInstitutions?.length > 0 ? intelligenceData.topInstitutions.map((inst, i) => (
                                                        <div key={inst._id} className="flex items-center justify-between p-4 bg-main/30 rounded-2xl border border-main group hover:border-indigo-500/30 transition-all">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-black text-xs">#{i+1}</div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-primary">{inst.name}</p>
                                                                    <p className="text-[10px] font-medium text-muted uppercase tracking-widest">{inst.code}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-lg font-black text-primary tabular-nums">{inst.examCount}</p>
                                                                <p className="text-[9px] font-bold text-muted uppercase">Exams Conducted</p>
                                                            </div>
                                                        </div>
                                                    )) : (
                                                        <div className="py-12 text-center text-muted italic text-sm">Waiting for platform activity...</div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Security & Proctoring Snapshot */}
                                            <div className="bg-surface border border-main rounded-3xl p-8 space-y-6 shadow-sm">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-lg font-bold text-primary flex items-center gap-3"><ShieldAlert size={20} className="text-rose-500" /> Proctoring Integrity</h3>
                                                    <Badge color={intelligenceData?.security?.integrityScore > 90 ? 'emerald' : 'rose'}>{intelligenceData?.security?.integrityScore}% Clean</Badge>
                                                </div>
                                                <div className="space-y-6">
                                                    <div>
                                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted mb-2"><span>Global Integrity Score</span><span>{intelligenceData?.security?.integrityScore}%</span></div>
                                                        <div className="h-2 bg-main rounded-full overflow-hidden">
                                                            <motion.div 
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${intelligenceData?.security?.integrityScore || 0}%` }}
                                                                className={`h-full rounded-full ${intelligenceData?.security?.integrityScore > 90 ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="p-4 bg-main/50 rounded-2xl border border-main">
                                                            <p className="text-[9px] font-black text-muted uppercase mb-1">Total Flags (30d)</p>
                                                            <p className="text-xl font-black text-primary">{intelligenceData?.security?.totalFlags || 0}</p>
                                                        </div>
                                                        <div className="p-4 bg-main/50 rounded-2xl border border-main">
                                                            <p className="text-[9px] font-black text-muted uppercase mb-1">Critical Alerts</p>
                                                            <p className="text-xl font-black text-rose-500">{intelligenceData?.security?.criticalAlerts || 0}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex items-center gap-4">
                                                    <div className="p-2 bg-rose-500/20 rounded-xl text-rose-500">
                                                        <ShieldAlert size={18} />
                                                    </div>
                                                    <p className="text-[10px] font-medium text-rose-600/80 leading-relaxed italic">
                                                        System automatically monitors behavioral anomalies. Higher flags may indicate coordinated attempt patterns.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Traffic/Usage intelligence Placeholder - Slightly more refined */}
                                        <div className="bg-surface border border-main rounded-3xl p-12 text-center space-y-4">
                                            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                                                <BarChart3 size={32} className="text-indigo-500" />
                                            </div>
                                            <h3 className="text-xl font-bold text-primary">Traffic Analytics Aggregating</h3>
                                            <p className="text-sm text-muted max-w-lg mx-auto leading-relaxed">
                                                We are calibrating the multi-tenant traffic engine. Time-series data and peak load maps will be available after the next data synchronization cycle.
                                            </p>
                                            <div className="flex items-center justify-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                                                <RefreshCw size={12} className="animate-spin" /> Next Sync in 4h 12m
                                            </div>
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
