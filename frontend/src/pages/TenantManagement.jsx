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
    const [resetPasswordModal, setResetPasswordModal] = useState({ isOpen: false, adminId: '', customPassword: '' });
    const [upgradeModal, setUpgradeModal] = useState({ isOpen: false, maxStudents: 0, maxMentors: 0, maxExams: 0, plan: '' });
    const [menuOpen, setMenuOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [showDeleteFinal, setShowDeleteFinal] = useState(false);


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
        setResetPasswordModal({ isOpen: true, adminId, customPassword: '' });
    };

    const submitPasswordReset = async (e) => {
        if (e) e.preventDefault();
        try {
            const { data } = await api.post(`/api/super-admin/institutions/${id}/reset-admin`, { 
                adminId: resetPasswordModal.adminId,
                password: resetPasswordModal.customPassword.trim() || undefined
            });
            toast.success(`Password Reset! New Key: ${data.newPassword}`, { duration: 20000 });
            fetchData(); // Refresh timeline
            setResetPasswordModal({ isOpen: false, adminId: '', customPassword: '' });
        } catch (error) {
            toast.error('Failed to reset password');
        }
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

    const handleUpgradeLimits = async (e) => {
        e.preventDefault();
        try {
            await api.patch(`/api/super-admin/institutions/${id}/limits`, {
                maxStudents: upgradeModal.maxStudents,
                maxMentors: upgradeModal.maxMentors,
                maxExams: upgradeModal.maxExams,
                plan: upgradeModal.plan
            });
            toast.success('License limits upgraded successfully');
            setUpgradeModal({ ...upgradeModal, isOpen: false });
            fetchData();
        } catch (error) {
            toast.error('Failed to upgrade limits');
        }
    };

    const handleDeleteTenant = () => {
        setConfirmDialog({
            isOpen: true,
            title: 'Delete Institution?',
            message: `Are you sure you want to PERMANENTLY delete ${details.institution.name}? This action is irreversible and will wipe all associated data, including users, exams, and results.`,
            isDestructive: true,
            action: () => {
                // First confirmation passed, now show the second final confirmation with text input
                setTimeout(() => setShowDeleteFinal(true), 400);
            }
        });
    };

    const submitFinalDelete = async (e) => {
        if (e) e.preventDefault();
        if (deleteConfirmText !== details.institution.name) {
            return toast.error('Institution name mismatch');
        }

        try {
            const { data } = await api.delete(`/api/super-admin/institutions/${id}`);
            toast.success(data.message);
            navigate('/super-admin');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete institution');
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
                                
                                <div className="relative">
                                    <button 
                                        onClick={() => setMenuOpen(!menuOpen)}
                                        className={`p-3 bg-surface border border-main text-muted hover:text-primary rounded-2xl transition-all shadow-sm ${menuOpen ? 'bg-main ring-2 ring-primary-500/20' : ''}`}
                                    >
                                        <MoreVertical size={20} />
                                    </button>
                                    
                                    <AnimatePresence>
                                        {menuOpen && (
                                            <>
                                                <motion.div 
                                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                    className="fixed inset-0 z-40"
                                                    onClick={() => setMenuOpen(false)}
                                                />
                                                <motion.div 
                                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                    className="absolute right-0 mt-2 w-48 bg-surface border border-main rounded-2xl shadow-2xl z-50 overflow-hidden"
                                                >
                                                    <div className="p-2 space-y-1">
                                                        <button 
                                                            onClick={() => { setMenuOpen(false); handleDeleteTenant(); }}
                                                            className="w-full px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 rounded-xl flex items-center gap-3 transition-colors"
                                                        >
                                                            <ShieldAlert size={16} /> Delete Tenant
                                                        </button>
                                                        <button 
                                                            className="w-full px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-muted hover:bg-main rounded-xl flex items-center gap-3 transition-colors opacity-50 cursor-not-allowed"
                                                        >
                                                            <Database size={16} /> Export Data
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
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
                                        {/* Students */}
                                        <div>
                                            <div className="flex justify-between text-[11px] font-bold text-muted mb-2">
                                                <span>STUDENT CAPACITY</span>
                                                <span className="text-primary font-black">{details.usage?.students || 0} / {institution.maxStudents}</span>
                                            </div>
                                            <div className="h-2 bg-main rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(100, ((details.usage?.students || 0) / institution.maxStudents) * 100)}%` }}
                                                    className="h-full bg-primary-500 rounded-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" 
                                                />
                                            </div>
                                        </div>

                                        {/* Exams */}
                                        <div>
                                            <div className="flex justify-between text-[11px] font-bold text-muted mb-2">
                                                <span>EXAM CAPACITY</span>
                                                <span className="text-primary font-black">{details.usage?.exams || 0} / {institution.maxExams || 50}</span>
                                            </div>
                                            <div className="h-2 bg-main rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(100, ((details.usage?.exams || 0) / (institution.maxExams || 50)) * 100)}%` }}
                                                    className="h-full bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]" 
                                                />
                                            </div>
                                        </div>

                                        {/* Mentors */}
                                        <div>
                                            <div className="flex justify-between text-[11px] font-bold text-muted mb-2">
                                                <span>MENTOR CAPACITY</span>
                                                <span className="text-primary font-black">{details.usage?.mentors || 0} / {institution.maxMentors}</span>
                                            </div>
                                            <div className="h-2 bg-main rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(100, ((details.usage?.mentors || 0) / institution.maxMentors) * 100)}%` }}
                                                    className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-main">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-muted">SUBSCRIPTION PLAN</span>
                                                <Badge color="indigo">{institution.plan}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                        <button 
                                            onClick={() => setUpgradeModal({ 
                                                isOpen: true, 
                                                maxStudents: institution.maxStudents, 
                                                maxMentors: institution.maxMentors, 
                                                maxExams: institution.maxExams || 50,
                                                plan: institution.plan 
                                            })} 
                                            className="w-full py-3 bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                                        >
                                            Upgrade License
                                        </button>
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

            {/* Reset Password Modal */}
            <AnimatePresence>
                {resetPasswordModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setResetPasswordModal({ isOpen: false, adminId: '', customPassword: '' })}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-surface border border-main rounded-3xl p-8 shadow-2xl"
                        >
                            <button 
                                onClick={() => setResetPasswordModal({ isOpen: false, adminId: '', customPassword: '' })}
                                className="absolute top-6 right-6 p-2 text-muted hover:text-primary hover:bg-main rounded-full transition-all"
                            >
                                <X size={20} />
                            </button>

                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border shadow-inner bg-amber-500/10 text-amber-500 border-amber-500/20">
                                <Key size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-primary mb-3">Reset Password</h3>
                            <p className="text-muted leading-relaxed mb-6 text-sm">Enter a custom password below, or leave it blank to auto-generate a secure key.</p>
                            
                            <form onSubmit={submitPasswordReset} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted uppercase tracking-widest pl-1">New Password (Optional)</label>
                                    <input 
                                        type="text" 
                                        value={resetPasswordModal.customPassword}
                                        onChange={(e) => setResetPasswordModal({...resetPasswordModal, customPassword: e.target.value})}
                                        placeholder="Leave blank to auto-generate"
                                        className="w-full bg-main border border-main text-primary rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all placeholder:text-muted/40"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-2 border-t border-main">
                                    <button 
                                        type="button"
                                        onClick={() => setResetPasswordModal({ isOpen: false, adminId: '', customPassword: '' })}
                                        className="px-6 py-3 bg-main text-primary hover:bg-surface-hover border border-main rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20"
                                    >
                                        Reset Credentials
                                    </button>
                                </div>
                            </form>
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

            {/* Upgrade License Modal */}
            <AnimatePresence>
                {upgradeModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setUpgradeModal({ ...upgradeModal, isOpen: false })}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-surface border border-main rounded-3xl p-8 shadow-2xl"
                        >
                            <button 
                                onClick={() => setUpgradeModal({ ...upgradeModal, isOpen: false })}
                                className="absolute top-6 right-6 p-2 text-muted hover:text-primary hover:bg-main rounded-full transition-all"
                            >
                                <X size={20} />
                            </button>
                            
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                                    <Server size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-primary">Upgrade License</h3>
                                    <p className="text-xs font-bold text-muted uppercase tracking-widest mt-1">Adjust Institution Capacity</p>
                                </div>
                            </div>

                            <form onSubmit={handleUpgradeLimits} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted uppercase tracking-widest pl-1">Student Capacity</label>
                                        <input 
                                            type="number" 
                                            required
                                            value={upgradeModal.maxStudents}
                                            onChange={(e) => setUpgradeModal({...upgradeModal, maxStudents: e.target.value})}
                                            className="w-full bg-main border border-main text-primary rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted uppercase tracking-widest pl-1">Mentor Capacity</label>
                                        <input 
                                            type="number" 
                                            required
                                            value={upgradeModal.maxMentors}
                                            onChange={(e) => setUpgradeModal({...upgradeModal, maxMentors: e.target.value})}
                                            className="w-full bg-main border border-main text-primary rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-xs font-bold text-muted uppercase tracking-widest pl-1">Exam Capacity</label>
                                        <input 
                                            type="number" 
                                            required
                                            value={upgradeModal.maxExams}
                                            onChange={(e) => setUpgradeModal({...upgradeModal, maxExams: e.target.value})}
                                            className="w-full bg-main border border-main text-primary rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 transition-all"
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted uppercase tracking-widest pl-1">Subscription Plan</label>
                                    <select 
                                        value={upgradeModal.plan}
                                        onChange={(e) => {
                                            const newPlan = e.target.value;
                                            const defaults = {
                                                trial: { students: 50, mentors: 2, exams: 5 },
                                                free: { students: 20, mentors: 1, exams: 2 },
                                                basic: { students: 200, mentors: 5, exams: 20 },
                                                pro: { students: 1000, mentors: 20, exams: 100 },
                                                enterprise: { students: 10000, mentors: 100, exams: 1000 }
                                            };
                                            const planDefaults = defaults[newPlan] || {};
                                            setUpgradeModal({
                                                ...upgradeModal, 
                                                plan: newPlan,
                                                maxStudents: planDefaults.students || upgradeModal.maxStudents,
                                                maxMentors: planDefaults.mentors || upgradeModal.maxMentors,
                                                maxExams: planDefaults.exams || upgradeModal.maxExams
                                            });
                                        }}
                                        className="w-full bg-main border border-main text-primary rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 transition-all appearance-none"
                                    >
                                        <option value="trial">Trial Mode</option>
                                        <option value="free">Free Tier</option>
                                        <option value="basic">Basic Plan</option>
                                        <option value="pro">Pro (Standard)</option>
                                        <option value="enterprise">Enterprise (Unlimited)</option>
                                    </select>
                                </div>

                                <div className="pt-4 border-t border-main">
                                    <button 
                                        type="submit"
                                        className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                                    >
                                        Update Subscription
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Final Delete Confirmation Modal (Second Confirmation) */}
            <AnimatePresence>
                {showDeleteFinal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            className="relative w-full max-w-lg bg-surface border-2 border-rose-500/30 rounded-[2.5rem] p-10 shadow-[0_0_50px_rgba(244,63,94,0.2)]"
                        >
                            <div className="w-20 h-20 rounded-3xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-8 border border-rose-500/20 shadow-inner mx-auto animate-pulse">
                                <ShieldAlert size={40} />
                            </div>
                            
                            <h3 className="text-3xl font-black text-center text-primary mb-4 tracking-tighter">Critical Confirmation</h3>
                            <p className="text-muted text-center leading-relaxed mb-8 text-sm">
                                You are about to delete <span className="text-rose-500 font-bold underline">{details.institution.name}</span>. 
                                This will erase all student data, exam records, and proctoring logs. 
                                <br/><br/>
                                To confirm, please type the institution name below:
                            </p>

                            <form onSubmit={submitFinalDelete} className="space-y-6">
                                <div className="space-y-2">
                                    <input 
                                        type="text" 
                                        autoFocus
                                        value={deleteConfirmText}
                                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                                        placeholder={details.institution.name}
                                        className="w-full bg-main border-2 border-rose-500/20 text-primary rounded-2xl px-6 py-4 focus:outline-none focus:border-rose-500 transition-all text-center font-bold tracking-tight text-lg shadow-inner"
                                    />
                                </div>
                                
                                <div className="flex gap-4">
                                    <button 
                                        type="button"
                                        onClick={() => { setShowDeleteFinal(false); setDeleteConfirmText(''); }}
                                        className="flex-1 py-4 bg-main text-primary hover:bg-surface-hover border border-main rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                                    >
                                        I changed my mind
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={deleteConfirmText !== details.institution.name}
                                        className="flex-1 py-4 bg-rose-500 hover:bg-rose-600 disabled:opacity-30 disabled:grayscale text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-rose-500/20"
                                    >
                                        Confirm & Wipe All Data
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

