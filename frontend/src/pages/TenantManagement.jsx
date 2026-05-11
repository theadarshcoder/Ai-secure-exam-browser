import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Building, 
    ChevronLeft, 
    ChevronRight, 
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
    Plus,
    ShieldCheck,
    Fingerprint,
    Zap
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
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border uppercase tracking-wider ${styles[color] || 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
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
                <p className="text-xs font-semibold uppercase tracking-widest text-muted">Syncing Platform Metadata...</p>
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
                    { 
                        id: 'back', 
                        label: 'Go Back', 
                        icon: ChevronLeft, 
                        onClick: () => {
                            sessionStorage.setItem('sa_active_tab', 'institutions');
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
                    <div className="flex items-center gap-3 text-sm font-medium text-muted">
                        <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => {
                            sessionStorage.setItem('sa_active_tab', 'institutions');
                            navigate('/super-admin');
                        }}>Platform Engine</span>
                        <ChevronRight size={14} className="opacity-40" />
                        <span className="text-primary font-semibold">{institution.name}</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <button onClick={() => {
                            sessionStorage.setItem('sa_active_tab', 'institutions');
                            navigate('/super-admin');
                        }} className="p-2 text-muted hover:text-primary transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-main/50">
                    <div className="space-y-4">
                        
                        {/* Hero Header */}
                        <div className="bg-surface border border-main rounded-xl p-4 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center border border-primary-500/20">
                                    <Building size={24} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h1 className="text-lg font-medium text-primary tracking-tight">{institution.name}</h1>
                                        <Badge color={institution.status === 'active' ? 'emerald' : 'red'}>
                                            <span className="text-[9px] uppercase font-bold">{institution.status}</span>
                                        </Badge>
                                    </div>
                                    <div className="flex gap-3 text-[10px] font-medium text-muted">
                                        <span className="flex items-center gap-1"><Globe size={13} /> {institution.domain}</span>
                                        <span className="flex items-center gap-1 opacity-50">•</span>
                                        <span className="flex items-center gap-1"><Terminal size={13} /> ID: {institution.code}</span>
                                        <span className="flex items-center gap-1 opacity-50">•</span>
                                        <span className="flex items-center gap-1"><Clock size={13} /> Since {new Date(institution.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {institution.status === 'active' ? (
                                    <button onClick={handleToggleStatus} className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all"><Power size={13} /> Suspend Tenant</button>
                                ) : (
                                    <button onClick={handleToggleStatus} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all"><Power size={13} /> Activate Tenant</button>
                                )}
                                
                                <div className="relative">
                                    <button 
                                        onClick={() => setMenuOpen(!menuOpen)}
                                        className={`p-2 bg-surface border border-main text-muted hover:text-primary rounded-lg transition-all ${menuOpen ? 'bg-main ring-1 ring-primary-500/20' : ''}`}
                                    >
                                        <MoreVertical size={16} />
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
                                                    <div className="p-1.5 space-y-0.5">
                                                        <button 
                                                            onClick={() => { setMenuOpen(false); handleDeleteTenant(); }}
                                                            className="w-full px-3 py-2 text-left text-[11px] font-medium text-rose-500 hover:bg-rose-500/10 rounded-lg flex items-center gap-2.5 transition-colors group"
                                                        >
                                                            <ShieldAlert size={14} className="group-hover:scale-110 transition-transform" /> 
                                                            <span>Delete Institution</span>
                                                        </button>
                                                        <button 
                                                            className="w-full px-3 py-2 text-left text-[11px] font-medium text-muted hover:bg-main rounded-lg flex items-center gap-2.5 transition-colors opacity-40 cursor-not-allowed"
                                                        >
                                                            <Database size={14} /> 
                                                            <span>Export Platform Data</span>
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            
                            <div className="lg:col-span-2 space-y-4">
                                <section className="space-y-3">
                                    <div className="flex items-center justify-between px-1">
                                        <h3 className="text-[11px] font-medium text-muted flex items-center gap-2"><Lock size={13} /> Institutional Admins</h3>
                                        <button 
                                            type="button"
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAddAdminModalOpen(true); }} 
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary-500/5 text-primary-500 border border-primary-500/20 rounded-lg text-[10px] font-semibold uppercase tracking-wider hover:bg-primary-500/10 transition-all active:scale-95 shadow-sm"
                                        >
                                            <Plus size={13} /> Add New Admin
                                        </button>
                                    </div>
                                    <div className="grid gap-3">
                                        {admins.map(admin => (
                                            <div key={admin._id} className="bg-surface border border-main rounded-xl p-4 flex items-center justify-between group hover:border-primary-500/20 transition-all shadow-sm">
                                                <div className="flex items-center gap-3.5">
                                                    <div className="w-10 h-10 rounded-xl bg-main border border-main flex items-center justify-center font-semibold text-primary shadow-inner text-lg">{admin.name.charAt(0)}</div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-medium text-primary">{admin.name}</p>
                                                            {admin.status === 'invited' && <Badge color="amber"><span className="text-[10px] font-medium">Invited</span></Badge>}
                                                        </div>
                                                        <p className="text-[11px] text-muted">{admin.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Badge color="indigo"><span className="text-[10px] font-medium">Admin</span></Badge>
                                                    <button onClick={() => handleResetPassword(admin._id)} className="p-2 bg-surface border border-main text-muted hover:text-primary-500 hover:border-primary-500/20 rounded-lg transition-all" title="Reset Credentials"><RefreshCw size={14} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Institution Timeline */}
                                <section className="bg-surface border border-main rounded-xl p-4 space-y-4 shadow-sm">
                                    <h3 className="text-sm font-medium text-primary flex items-center gap-2"><History size={15} className="text-primary-500" /> Activity Timeline</h3>
                                    <div className="relative space-y-5 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-main">
                                        {timeline.map((log, i) => (
                                            <div key={i} className="relative pl-8 group">
                                                <div className="absolute left-0 top-1 w-5.5 h-5.5 rounded-full bg-surface border border-main flex items-center justify-center z-10 group-hover:border-primary-500 transition-colors">
                                                    <TimelineIcon action={log.action} />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[12px] font-medium text-primary leading-none">{log.action.replace(/_/g, ' ')}</p>
                                                    <span className="text-[10px] text-muted tabular-nums leading-none">{new Date(log.createdAt).toLocaleString()}</span>
                                                </div>
                                                <p className="text-[11px] text-muted mt-0.5">By: <span className="font-medium text-primary/80">{log.performedBy?.name || 'System'}</span></p>
                                                {log.details?.reason && <p className="text-[11px] text-rose-500/80 italic mt-0.5 font-medium leading-relaxed">Reason: {log.details.reason}</p>}
                                            </div>
                                        ))}
                                        {timeline.length === 0 && <p className="text-center py-4 text-muted italic text-xs">No activity recorded yet.</p>}
                                    </div>
                                </section>
                            </div>

                            {/* Right Column: Limits & Health */}
                            <div className="space-y-4">
                                <div className="bg-surface border border-main rounded-xl p-5 space-y-5 shadow-sm">
                                    <h3 className="text-sm font-medium text-primary flex items-center gap-2"><Activity size={15} className="text-primary-500" /> Instance Limits</h3>
                                    <div className="space-y-4">
                                        {/* Students */}
                                        <div>
                                            <div className="flex justify-between text-[11px] font-medium text-muted mb-1.5 tracking-tight">
                                                <span>STUDENT CAPACITY</span>
                                                <span className="text-primary font-semibold tabular-nums">{details.usage?.students || 0} / {institution.maxStudents}</span>
                                            </div>
                                            <div className="h-1 bg-main rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(100, ((details.usage?.students || 0) / institution.maxStudents) * 100)}%` }}
                                                    className="h-full bg-primary-500 rounded-full" 
                                                />
                                            </div>
                                        </div>

                                        {/* Exams */}
                                        <div>
                                            <div className="flex justify-between text-[11px] font-medium text-muted mb-1.5 tracking-tight">
                                                <span>EXAM SLOTS</span>
                                                <span className="text-primary font-semibold tabular-nums">{details.usage?.exams || 0} / {institution.maxExams || 50}</span>
                                            </div>
                                            <div className="h-1 bg-main rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(100, ((details.usage?.exams || 0) / (institution.maxExams || 50)) * 100)}%` }}
                                                    className="h-full bg-primary-500/60 rounded-full" 
                                                />
                                            </div>
                                        </div>

                                        {/* Mentors */}
                                        <div>
                                            <div className="flex justify-between text-[11px] font-medium text-muted mb-1.5 tracking-tight">
                                                <span>MENTOR CAPACITY</span>
                                                <span className="text-primary font-semibold tabular-nums">{details.usage?.mentors || 0} / {institution.maxMentors}</span>
                                            </div>
                                            <div className="h-1 bg-main rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(100, ((details.usage?.mentors || 0) / institution.maxMentors) * 100)}%` }}
                                                    className="h-full bg-primary-500/30 rounded-full" 
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t border-main">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[11px] font-medium text-muted uppercase tracking-tight">Subscription Plan</span>
                                                <Badge color="primary"><span className="text-[10px] font-medium">{institution.plan}</span></Badge>
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
                                        className="w-full py-2 bg-primary-500 text-white rounded-lg text-[11px] font-semibold uppercase tracking-wider hover:bg-primary-600 transition-all active:scale-95 shadow-sm"
                                    >
                                        Upgrade License
                                    </button>
                                </div>

                                {/* System Config (Condensed) */}
                                <section className="bg-surface border border-main rounded-xl p-4 space-y-3 shadow-sm">
                                    <h3 className="text-xs font-medium text-primary flex items-center gap-2"><Server size={14} className="text-primary-500" /> System Logic</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="p-2 bg-main/50 rounded-lg border border-main text-center">
                                            <p className="text-[9px] font-bold text-muted uppercase tracking-wider mb-0.5">Tabs</p>
                                            <p className="text-xs font-semibold text-primary">{settings?.maxTabSwitches || 5}</p>
                                        </div>
                                        <div className="p-2 bg-main/50 rounded-lg border border-main text-center">
                                            <p className="text-[9px] font-bold text-muted uppercase tracking-wider mb-0.5">Auto-Submit</p>
                                            <p className="text-xs font-semibold text-primary">60s</p>
                                        </div>
                                    </div>
                                </section>

                                <div className="bg-surface border border-main rounded-xl p-4 space-y-3 shadow-sm">
                                    <h3 className="text-xs font-medium text-primary flex items-center gap-2"><ShieldAlert size={14} className="text-amber-500" /> Compliance Status</h3>
                                    <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                                        <p className="text-[10px] text-amber-600 font-medium leading-relaxed">This tenant is compliant with platform-level standards. No breaches reported.</p>
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
                            className="relative w-full max-w-sm bg-surface border border-main rounded-xl p-6 shadow-2xl"
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 border shadow-inner ${confirmDialog.isDestructive ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-primary-500/10 text-primary-500 border-primary-500/20'}`}>
                                <AlertCircle size={24} />
                            </div>
                            <h3 className="text-lg font-medium text-primary mb-2">{confirmDialog.title}</h3>
                            <p className="text-xs text-muted leading-relaxed mb-6">{confirmDialog.message}</p>
                            <div className="flex justify-end gap-2">
                                <button 
                                    onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                                    className="px-4 py-2 bg-main text-primary hover:bg-surface-hover border border-main rounded-lg text-[11px] font-medium uppercase tracking-wider transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => {
                                        confirmDialog.action();
                                        setConfirmDialog({ ...confirmDialog, isOpen: false });
                                    }}
                                    className={`px-4 py-2 rounded-lg text-[11px] font-medium uppercase tracking-wider transition-all shadow-lg text-white ${confirmDialog.isDestructive ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' : 'bg-primary-500 hover:bg-primary-600 shadow-primary-500/20'}`}
                                >
                                    Confirm
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
                            className="relative w-full max-w-sm bg-surface border border-main rounded-xl p-6 shadow-2xl"
                        >
                            <button 
                                type="button"
                                onClick={() => setResetPasswordModal({ isOpen: false, adminId: '', customPassword: '' })}
                                className="absolute top-4 right-4 p-1.5 text-muted hover:text-primary hover:bg-main rounded-full transition-all"
                            >
                                <X size={16} />
                            </button>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="text-amber-500 py-1">
                                    <Fingerprint size={32} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-primary leading-tight">Reset Password</h3>
                                    <p className="text-[11px] text-muted font-medium mt-0.5">Update Institutional Credentials</p>
                                </div>
                            </div>
                            
                            <form onSubmit={submitPasswordReset} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-semibold text-muted uppercase tracking-wider pl-0.5">New Password (Optional)</label>
                                    <input 
                                        type="text" 
                                        value={resetPasswordModal.customPassword}
                                        onChange={(e) => setResetPasswordModal({...resetPasswordModal, customPassword: e.target.value})}
                                        placeholder="Leave blank for auto-key"
                                        className="w-full bg-main border border-main text-primary rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500/50 transition-all placeholder:text-muted/40"
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-1 border-t border-main">
                                    <button 
                                        type="button"
                                        onClick={() => setResetPasswordModal({ isOpen: false, adminId: '', customPassword: '' })}
                                        className="px-4 py-2 bg-main text-primary hover:bg-surface-hover border border-main rounded-lg text-[11px] font-medium uppercase tracking-wider transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-medium uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20"
                                    >
                                        Update Credentials
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
                            className="relative w-full max-w-md bg-surface border border-main rounded-xl p-6 shadow-2xl"
                        >
                            <button 
                                type="button"
                                onClick={() => !submittingAdmin && setAddAdminModalOpen(false)}
                                className="absolute top-4 right-4 p-1.5 text-muted hover:text-primary hover:bg-main rounded-full transition-all"
                            >
                                <X size={16} />
                            </button>
                            
                            <div className="flex items-center gap-4 mb-6">
                                <div className="text-primary-500 py-1">
                                    <ShieldCheck size={32} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-primary leading-tight">Add Administrator</h3>
                                    <p className="text-[11px] text-muted font-medium mt-0.5">Provision Institutional Access</p>
                                </div>
                            </div>

                            <form onSubmit={handleAddAdmin} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-semibold text-muted uppercase tracking-wider pl-0.5">Full Name</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={newAdminForm.name}
                                        onChange={(e) => setNewAdminForm({...newAdminForm, name: e.target.value})}
                                        placeholder="e.g. Adarsh Sharma"
                                        className="w-full bg-main border border-main text-primary rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-primary-500/50 transition-all placeholder:text-muted/40"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-semibold text-muted uppercase tracking-wider pl-0.5">Email Address</label>
                                    <input 
                                        type="email" 
                                        required
                                        value={newAdminForm.email}
                                        onChange={(e) => setNewAdminForm({...newAdminForm, email: e.target.value})}
                                        placeholder="admin@institution.edu"
                                        className="w-full bg-main border border-main text-primary rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-primary-500/50 transition-all placeholder:text-muted/40"
                                    />
                                </div>
                                
                                <div className="pt-3 border-t border-main">
                                    <button 
                                        type="submit"
                                        disabled={submittingAdmin}
                                        className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {submittingAdmin ? <RefreshCw className="animate-spin" size={14} /> : <Key size={14} />}
                                        {submittingAdmin ? 'Provisioning...' : 'Add Administrator'}
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
                            className="relative w-full max-w-sm bg-surface border border-main rounded-xl p-6 shadow-2xl"
                        >
                            <button 
                                type="button"
                                onClick={() => setUpgradeModal({ ...upgradeModal, isOpen: false })}
                                className="absolute top-4 right-4 p-1.5 text-muted hover:text-primary hover:bg-main rounded-full transition-all"
                            >
                                <X size={16} />
                            </button>
                            
                            <div className="flex items-center gap-4 mb-6">
                                <div className="text-primary-500 py-1">
                                    <Zap size={32} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-primary leading-tight">License Config</h3>
                                    <p className="text-[11px] text-muted font-medium mt-0.5">Adjust Tenant Capacity</p>
                                </div>
                            </div>

                            <form onSubmit={handleUpgradeLimits} className="space-y-5">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-semibold text-muted uppercase tracking-wider pl-0.5">Students</label>
                                        <input 
                                            type="number" 
                                            required
                                            value={upgradeModal.maxStudents}
                                            onChange={(e) => setUpgradeModal({...upgradeModal, maxStudents: e.target.value})}
                                            className="w-full bg-main border border-main text-primary rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary-500/50 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-semibold text-muted uppercase tracking-wider pl-0.5">Mentors</label>
                                        <input 
                                            type="number" 
                                            required
                                            value={upgradeModal.maxMentors}
                                            onChange={(e) => setUpgradeModal({...upgradeModal, maxMentors: e.target.value})}
                                            className="w-full bg-main border border-main text-primary rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary-500/50 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5 col-span-2">
                                        <label className="text-[10px] font-semibold text-muted uppercase tracking-wider pl-0.5">Exam Slots</label>
                                        <input 
                                            type="number" 
                                            required
                                            value={upgradeModal.maxExams}
                                            onChange={(e) => setUpgradeModal({...upgradeModal, maxExams: e.target.value})}
                                            className="w-full bg-main border border-main text-primary rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary-500/50 transition-all"
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-semibold text-muted uppercase tracking-wider pl-0.5">Subscription Plan</label>
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
                                        className="w-full bg-main border border-main text-primary rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary-500/50 transition-all appearance-none"
                                    >
                                        <option value="trial">Trial Mode</option>
                                        <option value="free">Free Tier</option>
                                        <option value="basic">Basic Plan</option>
                                        <option value="pro">Pro (Standard)</option>
                                        <option value="enterprise">Enterprise (Unlimited)</option>
                                    </select>
                                </div>

                                <div className="pt-3 border-t border-main">
                                    <button 
                                        type="submit"
                                        className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2"
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
                            initial={{ opacity: 0, scale: 0.95, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 40 }}
                            className="relative w-full max-w-md bg-surface border border-rose-500/20 rounded-xl p-8 shadow-2xl"
                        >
                            <div className="w-16 h-16 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-6 border border-rose-500/20 shadow-inner mx-auto">
                                <ShieldAlert size={32} />
                            </div>
                            
                            <h3 className="text-xl font-medium text-center text-primary mb-3">Critical Confirmation</h3>
                            <p className="text-muted text-center leading-relaxed mb-6 text-xs">
                                You are about to permanently delete <span className="text-rose-500 font-bold underline">{details.institution.name}</span>. 
                                This action is irreversible and wipes all records.
                                <br/><br/>
                                Type the institution name to confirm:
                            </p>

                            <form onSubmit={submitFinalDelete} className="space-y-5">
                                <input 
                                    type="text" 
                                    autoFocus
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    placeholder={details.institution.name}
                                    className="w-full bg-main border border-main text-primary rounded-lg px-4 py-3 focus:outline-none focus:border-rose-500 transition-all text-center font-medium text-sm"
                                />
                                
                                <div className="flex gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => { setShowDeleteFinal(false); setDeleteConfirmText(''); }}
                                        className="flex-1 py-2.5 bg-main text-primary hover:bg-surface-hover border border-main rounded-lg text-[11px] font-medium uppercase tracking-wider transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={deleteConfirmText !== details.institution.name}
                                        className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-30 text-white rounded-lg text-[11px] font-medium uppercase tracking-wider transition-all shadow-lg shadow-rose-500/20"
                                    >
                                        Wipe Data
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

