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
    const [activeTab, setActiveTabRaw] = useState(() => sessionStorage.getItem('sa_active_tab') || 'demo-requests');
    const setActiveTab = (tab) => { sessionStorage.setItem('sa_active_tab', tab); setActiveTabRaw(tab); };
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
 sessionStorage.setItem('sa_active_tab', 'demo-requests');
 navigate('/super-admin/health');
 return;
 }
 if (activeTab === 'settings') {
 sessionStorage.setItem('sa_active_tab', 'demo-requests');
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
 <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border tracking-wider ${styles[color] || 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
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
 brandLabel="VISION"
 />

 <main className="flex-1 flex flex-col h-screen overflow-hidden">
 <header className="h-14 bg-surface/80 backdrop-blur-md border-b border-main flex items-center justify-between px-8 shrink-0">
 <div className="flex items-center gap-3 text-sm font-semibold text-muted">
 <span className="hover:text-primary transition-colors cursor-pointer">Platform Engine</span>
 <ChevronRight size={14} className="opacity-40" />
 <span className="text-primary font-semibold capitalize">{activeTab.replace('-', ' ')}</span>
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
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 {[
 { label: 'Active Tenants', val: stats.activeTenants, icon: Building, color: 'primary' },
 { label: 'Platform Users', val: stats.totalUsers, icon: Users, color: 'emerald' },
 { label: 'Exams Provisioned', val: stats.totalExams, icon: FileText, color: 'primary' },
 { label: 'Sys Uptime', val: formatUptime(stats.uptime), icon: Clock, color: 'amber' },
 ].map((s, i) => (
 <div key={i} className="bg-surface border border-main rounded-2xl p-5 flex items-center justify-between shadow-sm hover:border-primary-500/30 transition-all group h-full gap-4">
 <div className="flex items-center gap-3">
 <s.icon className={`text-${s.color}-500 shrink-0`} size={22} />
 <div>
 <h3 className="text-[13px] font-medium text-primary leading-none">{s.label}</h3>
 <p className="text-[10px] font-medium text-muted uppercase tracking-tight mt-1 opacity-70">Live platform count</p>
 </div>
 </div>
 <p className="text-xl font-medium text-primary tabular-nums tracking-tight">{s.val}</p>
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
 <h2 className="text-xl font-semibold text-primary">Access Requests</h2>
 <Badge color="amber">{demoRequests.filter(r => r.status === 'pending').length} Pending</Badge>
 </div>
 <div className="grid gap-4">
 {demoRequests.map((req) => (
 <div key={req._id} className="bg-surface border border-main rounded-xl p-3 hover:shadow-md transition-all group relative overflow-hidden">
 {req.status === 'pending' && <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-xl bg-surface-hover border border-main flex items-center justify-center text-muted shrink-0">
 <Inbox size={18} />
 </div>
 <div>
 <h3 className="text-sm font-medium text-primary">{req.institutionName}</h3>
 <div className="flex gap-3 mt-1 text-xs text-muted">
 <span className="flex items-center gap-1"><Users size={11} /> {req.name}</span>
 <span className="opacity-20">|</span>
 <span>{req.email}</span>
 {req.website && <>
 <span className="opacity-20">|</span>
 <a href={req.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary-500 hover:underline"><Globe size={11} /> Website</a>
 </>}
 </div>
 </div>
 </div>
 <div className="flex items-center gap-2">
 {req.status === 'pending' ? (
 <>
 <button onClick={() => handleApprove(req._id)} className="px-4 py-1.5 bg-primary-500 text-white hover:bg-primary-600 rounded-lg text-xs font-medium transition-all active:scale-95">Provision Tenant</button>
 <button onClick={() => api.post(`/api/super-admin/demo-requests/${req._id}/reject`).then(fetchData)} className="px-4 py-1.5 bg-surface border border-main text-muted hover:text-rose-500 hover:border-rose-500/30 rounded-lg text-xs font-medium transition-all">Reject</button>
 </>
 ) : (
 <>
 <Badge color={req.status === 'approved' ? 'emerald' : 'red'}>{req.status}</Badge>
 <button onClick={() => handleDeleteDemo(req._id)} className="p-2 text-muted hover:text-rose-500 bg-surface border border-main rounded-lg transition-all"><Trash2 size={14} /></button>
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
 <h2 className="text-xl font-semibold text-primary">Plan Upgrade Requests</h2>
 <Badge color="emerald">{upgradeRequests.filter(r => r.status === 'pending').length} Pending</Badge>
 </div>
 <div className="grid gap-4">
 {upgradeRequests.map((req) => (
 <div key={req._id} className="bg-surface border border-main rounded-xl p-3 hover:shadow-md transition-all group relative overflow-hidden">
 {req.status === 'pending' && <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-xl bg-surface-hover border border-main flex items-center justify-center text-muted shrink-0">
 <Database size={18} />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h3 className="text-sm font-medium text-primary">{req.institutionId?.name || 'Unknown Institution'}</h3>
 <Badge color="indigo">{req.plan} Plan</Badge>
 </div>
 <div className="flex gap-3 mt-1 text-xs text-muted">
 <span className="flex items-center gap-1"><Users size={11} /> {req.requestedBy?.name || 'Unknown'}</span>
 <span className="opacity-20">|</span>
 <span className="font-mono bg-main px-1.5 py-0.5 rounded text-[10px]">TXN: {req.transactionId}</span>
 <span className="opacity-20">|</span>
 <span>{new Date(req.createdAt).toLocaleDateString()}</span>
 </div>
 </div>
 </div>
 <div className="flex items-center gap-2">
 {req.status === 'pending' ? (
 <>
 <button onClick={() => handleProcessUpgrade(req._id, 'approved')} className="px-4 py-1.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg text-xs font-medium transition-all active:scale-95">Approve</button>
 <button onClick={() => handleProcessUpgrade(req._id, 'rejected')} className="px-4 py-1.5 bg-surface border border-main text-muted hover:text-rose-500 hover:border-rose-500/30 rounded-lg text-xs font-medium transition-all">Reject</button>
 </>
 ) : (
 <>
 <Badge color={req.status === 'approved' ? 'emerald' : 'red'}>{req.status}</Badge>
 <button onClick={() => handleDeleteUpgrade(req._id)} className="p-2 text-muted hover:text-rose-500 bg-surface border border-main rounded-lg transition-all"><Trash2 size={14} /></button>
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
 <h2 className="text-xl font-semibold text-primary">Tenant Infrastructure</h2>
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
 <div className="grid gap-3">
 {filteredInstitutions.map((inst) => (
 <div key={inst._id} className="bg-surface border border-main rounded-xl p-3 hover:shadow-md transition-all group">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-xl border border-main flex items-center justify-center overflow-hidden shrink-0 relative">
   <img
     src={`https://logo.clearbit.com/${inst.domain}`}
     alt={inst.name}
     className="w-full h-full object-cover absolute inset-0"
     onLoad={(e) => { e.target.style.opacity = '1'; e.target.nextSibling.style.display = 'none'; }}
     onError={(e) => { e.target.style.display = 'none'; }}
     style={{ opacity: 0 }}
   />
   <span className="w-full h-full flex items-center justify-center text-[9px] font-semibold tracking-wide text-muted bg-main">
     {inst.name.split(' ').filter(w => !['of','the','and','for','at','in'].includes(w.toLowerCase())).map(w => w[0]).join('').toUpperCase().slice(0, 3)}
   </span>
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h3 className="text-sm font-medium text-primary">{inst.name}</h3>
 <Badge color={inst.status === 'active' ? 'emerald' : 'red'}>{inst.status}</Badge>
 </div>
 <div className="flex gap-3 mt-1 text-xs text-muted">
 <span className="font-mono bg-main px-1.5 py-0.5 rounded text-[10px]">{inst.code}</span>
 <span className="opacity-20">|</span>
 <span>{inst.domain}</span>
 <span className="opacity-20">|</span>
 <span className="capitalize">{inst.plan} Plan</span>
 </div>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <button onClick={() => navigate(`/super-admin/institutions/${inst._id}`)} className="px-4 py-1.5 bg-surface border border-main text-primary hover:bg-surface-hover rounded-lg text-xs font-medium transition-all shadow-sm">Manage</button>
 <button onClick={() => handleToggleStatus(inst)} className={`p-2 rounded-lg transition-all border ${inst.status === 'active' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}><Power size={15} /></button>
 </div>
 </div>
 </div>
 ))}
 {filteredInstitutions.length === 0 && <div className="text-center py-20 text-muted italic">No matching tenants found.</div>}
 </div>
 </div>
 )}

 {activeTab === 'intelligence' && (
 <div className="space-y-6">
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

 {/* Active Leaders */}
 <div className="bg-surface border border-main rounded-2xl overflow-hidden shadow-sm">
 <div className="px-6 py-5 border-b border-main flex items-center gap-2.5">
 <Building size={15} className="text-primary-500" />
 <div>
 <h3 className="text-sm font-medium text-primary">Active Leaders</h3>
 <p className="text-xs text-muted mt-0.5">Top institutions by exam activity</p>
 </div>
 </div>
 <div className="divide-y divide-main">
 {intelligenceData?.topInstitutions?.length > 0 ? intelligenceData.topInstitutions.map((inst, i) => (
 <div key={inst._id} className="flex items-center justify-between px-6 py-4 hover:bg-surface-hover/50 transition-colors group">
 <div className="flex items-center gap-4">
 <span className="text-xs font-medium text-muted tabular-nums w-5 text-right shrink-0">{i + 1}.</span>
 <div>
 <p className="text-sm font-medium text-primary leading-tight">{inst.name}</p>
 <p className="text-xs text-muted mt-0.5 font-mono">{inst.code}</p>
 </div>
 </div>
 <div className="text-right">
 <p className="text-xl font-medium text-primary tabular-nums">{inst.examCount}</p>
 <p className="text-[10px] uppercase tracking-wider text-muted mt-0.5">Exams</p>
 </div>
 </div>
 )) : (
 <div className="py-16 text-center text-muted text-sm">Waiting for platform activity...</div>
 )}
 </div>
 </div>

 {/* Proctoring Integrity */}
 <div className="bg-surface border border-main rounded-2xl overflow-hidden shadow-sm">
 <div className="px-6 py-5 border-b border-main flex items-center justify-between">
 <div className="flex items-center gap-2.5">
 <ShieldAlert size={15} className="text-rose-400" />
 <div>
 <h3 className="text-sm font-medium text-primary">Proctoring Integrity</h3>
 <p className="text-xs text-muted mt-0.5">Global security snapshot</p>
 </div>
 </div>
 <Badge color={intelligenceData?.security?.integrityScore > 90 ? 'emerald' : 'rose'}>
 {intelligenceData?.security?.integrityScore}% Clean
 </Badge>
 </div>

 <div className="px-6 py-5 space-y-5">
 {/* Score Bar */}
 <div>
 <div className="flex justify-between items-center mb-3">
 <span className="text-xs text-muted">Global Integrity Score</span>
 <span className="text-xl font-medium text-primary tabular-nums">{intelligenceData?.security?.integrityScore}%</span>
 </div>
 <div className="h-2 bg-main rounded-full overflow-hidden">
 <motion.div
 initial={{ width: 0 }}
 animate={{ width: `${intelligenceData?.security?.integrityScore || 0}%` }}
 transition={{ duration: 1, ease: 'easeOut' }}
 className={`h-full rounded-full ${intelligenceData?.security?.integrityScore > 90 ? 'bg-emerald-500' : 'bg-rose-500'}`}
 />
 </div>
 </div>

 {/* Stats Row */}
 <div className="grid grid-cols-2 gap-4">
 <div className="p-4 bg-main/40 rounded-xl border border-main">
 <p className="text-[11px] uppercase tracking-wider text-muted mb-2">Total Flags (30d)</p>
 <p className="text-2xl font-medium text-primary tabular-nums">{intelligenceData?.security?.totalFlags || 0}</p>
 </div>
 <div className="p-4 bg-main/40 rounded-xl border border-main">
 <p className="text-[11px] uppercase tracking-wider text-muted mb-2">Critical Alerts</p>
 <p className="text-2xl font-medium text-rose-500 tabular-nums">{intelligenceData?.security?.criticalAlerts || 0}</p>
 </div>
 </div>

 {/* Info Banner */}
 <div className="flex items-start gap-3 p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl">
 <ShieldAlert size={16} className="text-rose-500 mt-0.5 shrink-0" />
 <p className="text-xs text-rose-600/80 leading-relaxed">
 System automatically monitors behavioral anomalies. Higher flags may indicate coordinated attempt patterns.
 </p>
 </div>
 </div>
 </div>

 </div>

 {/* Traffic Analytics Placeholder */}
 <div className="bg-surface border border-main rounded-xl p-10 text-center space-y-4">
 <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center mx-auto border border-primary-500/20">
 <BarChart3 size={24} className="text-primary-500" />
 </div>
 <div>
 <h3 className="text-sm font-medium text-primary">Traffic Analytics Aggregating</h3>
 <p className="text-[11px] text-muted max-w-md mx-auto leading-relaxed mt-2">
 We are calibrating the multi-tenant traffic engine. Time-series data and peak load maps will be available after the next data synchronization cycle.
 </p>
 </div>
 <div className="inline-flex items-center gap-2 text-[10px] font-semibold text-primary-500 bg-primary-500/10 px-3 py-1.5 rounded-lg border border-primary-500/20 uppercase tracking-wider">
 <RefreshCw size={11} className="animate-spin" /> Next Sync in 4h 12m
 </div>
 </div>

 </div>
 )}

 {activeTab === 'audit-trail' && (
 <div className="bg-surface border border-main rounded-xl overflow-hidden shadow-sm flex flex-col h-[calc(100vh-320px)]">
 <div className="px-5 py-4 border-b border-main bg-surface-hover/30 flex items-center justify-between shrink-0">
 <h3 className="text-sm font-medium text-primary flex items-center gap-2"><FileText size={16} className="text-primary-500" /> Global Event Stream</h3>
 <button onClick={fetchData} className="flex items-center gap-2 px-3 py-1.5 bg-main border border-main rounded-lg text-[11px] font-medium hover:text-primary-500 transition-all">
 <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
 Refresh Stream
 </button>
 </div>
 <div className="overflow-hidden flex flex-col flex-1">
 <table className="w-full text-left table-fixed">
 <thead className="bg-surface">
 <tr className="border-b border-main">
 <th className="px-6 py-2 text-[10px] font-medium text-muted uppercase tracking-tight w-44">Event Timestamp</th>
 <th className="px-6 py-2 text-[10px] font-medium text-muted uppercase tracking-tight w-48">Actor Identity</th>
 <th className="px-6 py-2 text-[10px] font-medium text-muted uppercase tracking-tight w-28">Severity</th>
 <th className="px-6 py-2 text-[10px] font-medium text-muted uppercase tracking-tight w-56">Action Context</th>
 <th className="px-6 py-2 text-[10px] font-medium text-muted uppercase tracking-tight">Target Entity</th>
 </tr>
 </thead>
 </table>
 <div className="flex-1 overflow-y-auto custom-scrollbar">
 <table className="w-full text-left table-fixed">
 <colgroup>
 <col className="w-44" /><col className="w-48" /><col className="w-28" /><col className="w-56" /><col />
 </colgroup>
 <tbody className="divide-y-0">
 {auditLogs.map((log) => (
 <tr key={log._id} className="hover:bg-surface-hover/20 transition-colors border-b border-main last:border-0">
 <td className="px-6 py-2.5 text-[11px] font-medium text-muted whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
 <td className="px-6 py-2.5">
 <div className="flex flex-col">
 <span className="text-[11px] font-medium text-primary leading-tight">{log.performedBy?.name || 'System'}</span>
 <span className="text-[10px] text-muted">{log.performedBy?.email || 'automated@platform'}</span>
 </div>
 </td>
 <td className="px-6 py-2.5">
 <Badge color={log.severity === 'critical' ? 'rose' : log.severity === 'warning' ? 'amber' : 'blue'}>
 <span className="text-[9px] uppercase font-bold">{log.severity || 'info'}</span>
 </Badge>
 </td>
 <td className="px-6 py-2.5">
 <span className="text-[11px] font-medium text-primary">{log.action.replace(/_/g, ' ')}</span>
 </td>
 <td className="px-6 py-2.5 text-[11px] font-medium text-primary truncate max-w-[200px]">
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

