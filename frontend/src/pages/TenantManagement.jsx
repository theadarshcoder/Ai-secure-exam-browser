import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Building, 
    ChevronLeft, 
    Lock, 
    Key, 
    RefreshCw, 
    Users, 
    Server, 
    Globe, 
    ShieldAlert, 
    Database, 
    Activity, 
    Power,
    ExternalLink,
    MoreVertical,
    Clock,
    Terminal,
    History,
    AlertCircle,
    CheckCircle2,
    X,
    Plus
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import PremiumSidebar from '../components/PremiumSidebar';
import { ThemeToggle } from '../contexts/ThemeContext';

export default function TenantManagement() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [details, setDetails] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [sidebarExpanded, setSidebarExpanded] = useState(true);
    const [userName] = useState(sessionStorage.getItem('vision_name') || 'Platform Owner');

    // UI States
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', action: null, isDestructive: false });
    const [addAdminModalOpen, setAddAdminModalOpen] = useState(false);
    const [newAdminForm, setNewAdminForm] = useState({ name: '', email: '' });
    const [submittingAdmin, setSubmittingAdmin] = useState(false);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [detailsRes, timelineRes] = await Promise.all([
                api.get(`/api/super-admin/institutions/${id}`),
                api.get(`/api/super-admin/institutions/${id}/timeline`)
            ]);
            setDetails(detailsRes.data);
            setTimeline(timelineRes.data);
        } catch (error) {
            toast.error('Failed to load tenant details');
            navigate('/super-admin');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = (adminId) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Reset Admin Password',
            message: "This will immediately log them out and generate a new secure key. The new key will be shown on the screen.",
            isDestructive: false,
            action: async () => {
                try {
                    const { data } = await api.post(`/api/super-admin/institutions/${id}/reset-admin`, { adminId });
                    toast.success(`Password Reset! New Key: ${data.newPassword}`, { duration: 20000 });
                    fetchData(); // Refresh timeline
                } catch (error) {
                    toast.error('Failed to reset password');
                }
            }
        });
    };

    const handleToggleStatus = () => {
        const action = details.institution.status === 'active' ? 'suspend' : 'activate';
        setConfirmDialog({
            isOpen: true,
            title: `${action === 'suspend' ? 'Suspend' : 'Activate'} Tenant`,
            message: action === 'suspend' 
                ? `Are you sure you want to suspend ${details.institution.name}? This will block all students and mentors from this institution immediately.`
                : `Are you sure you want to activate ${details.institution.name}? This will restore access for all users.`,
            isDestructive: action === 'suspend',
            action: async () => {
                try {
                    const { data } = await api.patch(`/api/super-admin/institutions/${id}/status`, { 
                        status: details.institution.status === 'active' ? 'suspended' : 'active' 
                    });
                    toast.success(`Tenant ${action}ed successfully`);
                    setDetails({ ...details, institution: data.institution });
                    fetchData(); // Refresh timeline
                } catch (error) {
                    toast.error(`Failed to ${action} tenant`);
                }
            }
        });
    };

    const handleAddAdmin = async (e) => {
        e.preventDefault();
        if (!newAdminForm.name || !newAdminForm.email) return toast.error('Fill all fields');
        setSubmittingAdmin(true);
        try {
            const { data } = await api.post(`/api/super-admin/institutions/${id}/add-admin`, newAdminForm);
            toast.success('Admin added successfully!');
            toast.success(`Temp Password: ${data.tempPassword}`, { duration: 20000 });
            setAddAdminModalOpen(false);
            setNewAdminForm({ name: '', email: '' });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add admin');
        } finally {
            setSubmittingAdmin(false);
        }
    };

    const Badge = ({ children, color }) => {
        const styles = {
            emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
            amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
            red: 'bg-red-500/10 text-red-500 border-red-500/20',
            indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        };
        return (
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${styles[color] || 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                {children}
            </span>
        );
    };

    const TimelineIcon = ({ action }) => {
        if (action.includes('SUSPEND')) return <Power className="text-rose-500" size={14} />;
        if (action.includes('ACTIVATE')) return <CheckCircle2 className="text-emerald-500" size={14} />;
        if (action.includes('PASSWORD')) return <Key className="text-amber-500" size={14} />;
        if (action.includes('APPROVE')) return <Building className="text-indigo-500" size={14} />;
        return <AlertCircle className="text-muted" size={14} />;
    };

    if (loading) {
        return (
            <div className="h-screen bg-main flex flex-col items-center justify-center space-y-4">
                <RefreshCw size={40} className="text-primary-500 animate-spin" />
                <p className="text-xs font-black uppercase tracking-widest text-muted">Syncing Platform Metadata...</p>
            </div>
        );
    }

    const { institution, admins, settings } = details;

    return (
        <div className="flex h-screen bg-main font-sans text-primary select-none antialiased">
            <PremiumSidebar
                expanded={sidebarExpanded}
                onToggle={setSidebarExpanded}
                navItems={[
                    { id: 'back', label: 'Go Back', icon: ChevronLeft },
                ]}
                activeTab={null}
                setActiveTab={() => navigate('/super-admin')}
                userName={userName}
                userRole="super_admin"
                onLogout={() => { sessionStorage.clear(); window.location.href = '/login'; }}
                brandLabel="TENANT"
            />

            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="h-14 bg-surface/80 backdrop-blur-md border-b border-main flex items-center justify-between px-8 shrink-0 relative z-40">
                    <div className="flex items-center gap-3 text-sm font-semibold text-muted">
                        <Building size={16} className="text-indigo-500" />
                        <span>Platform Engine</span>
                        <ChevronLeft size={14} className="opacity-30" />
                        <span className="text-primary font-bold">{institution.name}</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <button onClick={() => navigate('/super-admin')} className="p-2 text-muted hover:text-primary transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-main/50">
                    <div className="max-w-6xl mx-auto space-y-8">
                        
                        {/* Hero Header */}
                        <div className="bg-surface border border-main rounded-3xl p-8 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                                    <Building size={40} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="text-3xl font-black text-primary tracking-tighter">{institution.name}</h1>
                                        <Badge color={institution.status === 'active' ? 'emerald' : 'red'}>{institution.status}</Badge>
                                    </div>
                                    <div className="flex gap-4 text-xs font-bold text-muted">
                                        <span className="flex items-center gap-1.5"><Globe size={14} /> {institution.domain}</span>
                                        <span className="opacity-20">|</span>
                                        <span className="flex items-center gap-1.5"><Terminal size={14} /> ID: {institution.code}</span>
                                        <span className="opacity-20">|</span>
                                        <span className="flex items-center gap-1.5"><Clock size={14} /> Since {new Date(institution.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                {institution.status === 'active' ? (
                                    <button onClick={handleToggleStatus} className="flex items-center gap-2 px-6 py-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all"><Power size={16} /> Suspend Tenant</button>
                                ) : (
                                    <button onClick={handleToggleStatus} className="flex items-center gap-2 px-6 py-3 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all"><Power size={16} /> Activate Tenant</button>
                                )}
                                <button className="p-3 bg-surface border border-main text-muted hover:text-primary rounded-2xl transition-all shadow-sm"><MoreVertical size={20} /></button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            
                            {/* Left Column: Admins & Config */}
                            <div className="lg:col-span-2 space-y-8">
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-2"><Lock size={14} /> Institutional Admins</h3>
                                        <button onClick={() => setAddAdminModalOpen(true)} className="text-[10px] font-black uppercase tracking-widest text-primary-500 hover:underline flex items-center gap-1.5"><Key size={12} /> Add New Admin</button>

                                    </div>
                                    <div className="grid gap-4">
                                        {admins.map(admin => (
                                            <div key={admin._id} className="bg-surface border border-main rounded-2xl p-6 flex items-center justify-between group hover:border-primary-500/20 transition-all shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-main border border-main flex items-center justify-center font-bold text-primary shadow-inner text-xl">{admin.name.charAt(0)}</div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-base font-bold text-primary">{admin.name}</p>
                                                            {admin.status === 'invited' && <Badge color="amber">Invited</Badge>}
                                                        </div>
                                                        <p className="text-xs text-muted font-medium">{admin.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Badge color="indigo">Super Admin</Badge>
                                                    <button onClick={() => handleResetPassword(admin._id)} className="p-2.5 bg-surface border border-main text-muted hover:text-rose-500 hover:border-rose-500/20 rounded-xl transition-all shadow-sm" title="Reset Credentials"><RefreshCw size={18} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Institution Timeline */}
                                <section className="bg-surface border border-main rounded-3xl p-8 space-y-6 shadow-sm">
                                    <h3 className="text-lg font-bold text-primary flex items-center gap-3"><History size={20} className="text-indigo-500" /> Activity Timeline</h3>
                                    <div className="relative space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-main">
                                        {timeline.map((log, i) => (
                                            <div key={i} className="relative pl-10 group">
                                                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-surface border border-main flex items-center justify-center z-10 group-hover:border-primary-500 transition-colors">
                                                    <TimelineIcon action={log.action} />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-bold text-primary">{log.action.replace(/_/g, ' ')}</p>
                                                    <span className="text-[10px] font-bold text-muted uppercase tabular-nums">{new Date(log.createdAt).toLocaleString()}</span>
                                                </div>
                                                <p className="text-xs text-muted mt-1">Performed by: <span className="font-semibold">{log.performedBy?.name || 'System'}</span></p>
                                                {log.details?.reason && <p className="text-xs text-rose-500/70 italic mt-1 font-medium leading-relaxed">Reason: {log.details.reason}</p>}
                                            </div>
                                        ))}
                                        {timeline.length === 0 && <p className="text-center py-4 text-muted italic text-sm">No activity recorded yet.</p>}
                                    </div>
                                </section>
                            </div>

                            {/* Right Column: Limits & Health */}
                            <div className="space-y-6">
                                <div className="bg-surface border border-main rounded-3xl p-8 space-y-6 shadow-sm">
                                    <h3 className="text-lg font-bold text-primary flex items-center gap-3"><Activity size={20} className="text-emerald-500" /> Instance Limits</h3>
                                    <div className="space-y-5">
                                        <div>
                                            <div className="flex justify-between text-[11px] font-bold text-muted mb-2"><span>STUDENT CAPACITY</span><span className="text-primary">{institution.maxStudents}</span></div>
                                            <div className="h-2 bg-main rounded-full overflow-hidden"><div className="h-full bg-primary-500 w-[70%] rounded-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" /></div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-[11px] font-bold text-muted mb-2"><span>MENTOR CAPACITY</span><span className="text-primary">{institution.maxMentors}</span></div>
                                            <div className="h-2 bg-main rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-[40%] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" /></div>
                                        </div>
                                        <div className="pt-4 border-t border-main">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-muted">SUBSCRIPTION PLAN</span>
                                                <Badge color="indigo">{institution.plan}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="w-full py-3 bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all active:scale-95">Upgrade License</button>
                                </div>

                                {/* System Config (Condensed) */}
                                <section className="bg-surface border border-main rounded-3xl p-6 space-y-4 shadow-sm">
                                    <h3 className="text-sm font-bold text-primary flex items-center gap-2"><Server size={16} className="text-indigo-500" /> System Logic</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-main/50 rounded-xl border border-main text-center">
                                            <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Tabs</p>
                                            <p className="text-sm font-bold text-primary">{settings?.maxTabSwitches || 5}</p>
                                        </div>
                                        <div className="p-3 bg-main/50 rounded-xl border border-main text-center">
                                            <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Auto-Submit</p>
                                            <p className="text-sm font-bold text-primary">60s</p>
                                        </div>
                                    </div>
                                </section>

                                <div className="bg-surface border border-main rounded-3xl p-8 space-y-4 shadow-sm">
                                    <h3 className="text-sm font-bold text-primary flex items-center gap-2"><ShieldAlert size={16} className="text-amber-500" /> Compliance Status</h3>
                                    <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                                        <p className="text-[11px] text-amber-600 font-medium leading-relaxed">This tenant is compliant with all platform-level proctoring standards. No security breaches reported.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Custom Confirm Dialog Modal */}
            <AnimatePresence>
                {confirmDialog.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-surface border border-main rounded-3xl p-8 shadow-2xl"
                        >
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border shadow-inner ${confirmDialog.isDestructive ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-primary-500/10 text-primary-500 border-primary-500/20'}`}>
                                <AlertCircle size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-primary mb-3">{confirmDialog.title}</h3>
                            <p className="text-muted leading-relaxed mb-8">{confirmDialog.message}</p>
                            <div className="flex justify-end gap-3">
                                <button 
                                    onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                                    className="px-6 py-3 bg-main text-primary hover:bg-surface-hover border border-main rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => {
                                        confirmDialog.action();
                                        setConfirmDialog({ ...confirmDialog, isOpen: false });
                                    }}
                                    className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg text-white ${confirmDialog.isDestructive ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' : 'bg-primary-500 hover:bg-primary-600 shadow-primary-500/20'}`}
                                >
                                    Confirm Action
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add Admin Modal */}
            <AnimatePresence>
                {addAdminModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => !submittingAdmin && setAddAdminModalOpen(false)}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-surface border border-main rounded-3xl p-8 shadow-2xl"
                        >
                            <button 
                                onClick={() => !submittingAdmin && setAddAdminModalOpen(false)}
                                className="absolute top-6 right-6 p-2 text-muted hover:text-primary hover:bg-main rounded-full transition-all"
                            >
                                <X size={20} />
                            </button>
                            
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-primary-500/10 text-primary-500 flex items-center justify-center border border-primary-500/20 shadow-inner">
                                    <Plus size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-primary">Add Administrator</h3>
                                    <p className="text-xs font-bold text-muted uppercase tracking-widest mt-1">Provision New Institutional Access</p>
                                </div>
                            </div>

                            <form onSubmit={handleAddAdmin} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted uppercase tracking-widest pl-1">Full Name</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={newAdminForm.name}
                                        onChange={(e) => setNewAdminForm({...newAdminForm, name: e.target.value})}
                                        placeholder="e.g. Adarsh Sharma"
                                        className="w-full bg-main border border-main text-primary rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all placeholder:text-muted/40"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted uppercase tracking-widest pl-1">Email Address</label>
                                    <input 
                                        type="email" 
                                        required
                                        value={newAdminForm.email}
                                        onChange={(e) => setNewAdminForm({...newAdminForm, email: e.target.value})}
                                        placeholder="admin@institution.edu"
                                        className="w-full bg-main border border-main text-primary rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all placeholder:text-muted/40"
                                    />
                                </div>
                                
                                <div className="pt-4 border-t border-main">
                                    <button 
                                        type="submit"
                                        disabled={submittingAdmin}
                                        className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {submittingAdmin ? <RefreshCw className="animate-spin" size={18} /> : <Key size={18} />}
                                        {submittingAdmin ? 'Provisioning...' : 'Provision Administrator'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
