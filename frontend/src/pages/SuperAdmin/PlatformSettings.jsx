import React, { useState, useEffect } from 'react';
import BouncingDotLoader from '../../components/BouncingDotLoader';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Settings, 
    Shield, 
    Bell, 
    Lock, 
    Eye, 
    AlertTriangle, 
    CheckCircle2, 
    History,
    RefreshCw,
    Save,
    Megaphone,
    Users,
    Activity,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import PremiumSidebar from '../../components/PremiumSidebar';
import { ThemeToggle } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

export default function PlatformSettings() {
    const navigate = useNavigate();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sidebarExpanded, setSidebarExpanded] = useState(true);
    const [userName] = useState(sessionStorage.getItem('vision_name') || 'Platform Owner');

    // Form states
    const [mode, setMode] = useState('active');
    const [reason, setReason] = useState('');
    const [announcement, setAnnouncement] = useState({ title: '', message: '', isActive: false, target: 'all' });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/api/super-admin/settings');
            setSettings(data);
            setMode(data.platformMode);
            setAnnouncement(data.announcement || { title: '', message: '', isActive: false, target: 'all' });
        } catch (error) {
            toast.error('Failed to load platform settings');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateMode = async () => {
        if (!reason && mode !== settings.platformMode) {
            toast.error('Please provide a reason for mode change');
            return;
        }

        setSaving(true);
        try {
            const { data } = await api.patch('/api/super-admin/settings/mode', { mode, reason });
            setSettings(data);
            toast.success(`Platform mode set to ${mode.toUpperCase()}`);
            setReason('');
        } catch (error) {
            toast.error('Failed to update platform mode');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateAnnouncement = async () => {
        setSaving(true);
        try {
            const { data } = await api.patch('/api/super-admin/settings/announcement', announcement);
            setSettings(data);
            toast.success('Announcement settings updated');
        } catch (error) {
            toast.error('Failed to update announcement');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="h-screen bg-main flex items-center justify-center">
                <BouncingDotLoader text="Syncing system state..." />
            </div>
        );
    }

    const modes = [
        { id: 'active', label: 'Active', desc: 'Standard platform operations enabled.', icon: CheckCircle2, color: 'emerald' },
        { id: 'readonly', label: 'Read-Only', desc: 'Viewing allowed, but no data modifications.', icon: Eye, color: 'amber' },
        { id: 'maintenance', label: 'Maintenance', desc: 'Scheduled maintenance. Exams blocked.', icon: Settings, color: 'rose' },
        { id: 'locked', label: 'Locked', desc: 'Complete lockout. Super Admin only.', icon: Lock, color: 'slate' },
    ];

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
                        <span className="text-primary font-bold">Platform Settings</span>
                    </div>
                    <ThemeToggle />
                </header>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-main/50">
                    <div className="space-y-6">
                        
                        {/* Mode Control */}
                        <section className="bg-surface border border-main rounded-xl p-5 space-y-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-medium text-primary">System Mode</h2>
                                    <p className="text-xs text-muted uppercase tracking-wide mt-0.5">Current State: {settings.platformMode}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                {modes.map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => setMode(m.id)}
                                        className={`p-4 rounded-xl border text-left transition-all ${
                                            mode === m.id 
                                            ? `bg-${m.color}-500/10 border-${m.color}-500/40` 
                                            : 'bg-main/30 border-main hover:border-primary-500/20'
                                        }`}
                                    >
                                        <m.icon size={16} className={`mb-2 ${mode === m.id ? `text-${m.color}-500` : 'text-muted'}`} />
                                        <p className={`text-xs font-medium ${mode === m.id ? `text-${m.color}-500` : 'text-primary'}`}>{m.label}</p>
                                        <p className="text-[11px] text-muted mt-0.5 leading-relaxed">{m.desc}</p>
                                    </button>
                                ))}
                            </div>

                            {mode !== settings.platformMode && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -8 }} 
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-3 pt-3 border-t border-main"
                                >
                                    <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-lg flex items-start gap-3">
                                        <AlertTriangle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-rose-500/80 leading-relaxed">
                                            <strong>WARNING:</strong> Changing the platform mode will immediately affect all institutions, mentors, and students.
                                            {mode === 'maintenance' && " Students in active exams will be blocked from continuing."}
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <input 
                                            type="text" 
                                            placeholder="Reason for state change..." 
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            className="flex-1 bg-main border border-main rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary-500/50 transition-all"
                                        />
                                        <button 
                                            onClick={handleUpdateMode}
                                            disabled={saving}
                                            className="px-5 py-2 bg-primary-500 text-white rounded-lg text-xs font-medium uppercase tracking-wide hover:bg-primary-600 transition-all flex items-center gap-2"
                                        >
                                            {saving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
                                            Commit
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </section>

                        {/* Announcements */}
                        <section className="bg-surface border border-main rounded-xl p-5 space-y-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Megaphone size={14} className="text-indigo-400" />
                                    <h2 className="text-sm font-medium text-primary">Platform Announcement</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] uppercase text-muted tracking-wide">Broadcast Active</span>
                                    <button 
                                        onClick={() => setAnnouncement({...announcement, isActive: !announcement.isActive})}
                                        className={`w-9 h-5 rounded-full transition-all relative shadow-inner ${announcement.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                                    >
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${announcement.isActive ? 'left-5' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[11px] text-muted uppercase tracking-wide ml-1">Title</label>
                                        <input 
                                            type="text" 
                                            value={announcement.title}
                                            onChange={(e) => setAnnouncement({...announcement, title: e.target.value})}
                                            placeholder="Emergency Maintenance Notice..."
                                            className="w-full bg-main border border-main rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary-500/50"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] text-muted uppercase tracking-wide ml-1">Target Audience</label>
                                        <select 
                                            value={announcement.target}
                                            onChange={(e) => setAnnouncement({...announcement, target: e.target.value})}
                                            className="w-full bg-main border border-main rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary-500/50"
                                        >
                                            <option value="all">Everyone (All Roles)</option>
                                            <option value="admin">Institutional Admins</option>
                                            <option value="mentor">Mentors Only</option>
                                            <option value="student">Students Only</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] text-muted uppercase tracking-wide ml-1">Message Body</label>
                                    <textarea 
                                        rows={3}
                                        value={announcement.message}
                                        onChange={(e) => setAnnouncement({...announcement, message: e.target.value})}
                                        placeholder="We are performing essential server upgrades tonight at 02:00 UTC..."
                                        className="w-full bg-main border border-main rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-primary-500/50 resize-none"
                                    />
                                </div>
                                <button 
                                    onClick={handleUpdateAnnouncement}
                                    className="w-full py-2.5 bg-primary-500 text-white rounded-lg text-xs font-medium uppercase tracking-wide hover:bg-primary-600 transition-all"
                                >
                                    Update Broadcast Message
                                </button>
                            </div>
                        </section>

                        {/* History */}
                        <section className="bg-surface border border-main rounded-xl p-5 space-y-3 shadow-sm">
                            <div className="flex items-center gap-2">
                                <History size={14} className="text-indigo-400" />
                                <h2 className="text-sm font-medium text-primary">State Change History</h2>
                            </div>
                            <div className="space-y-0">
                                {settings.history?.slice().reverse().map((h, i) => (
                                    <div key={i} className="flex gap-3 py-3 px-2 border-b border-main last:border-0 hover:bg-main/20 rounded-lg transition-all group">
                                        <div className="w-7 h-7 rounded-lg bg-main border border-main flex items-center justify-center shrink-0 mt-0.5">
                                            <Shield size={13} className="text-muted group-hover:text-primary-500 transition-colors" />
                                        </div>
                                        <div className="flex-1 space-y-0.5">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-medium text-primary">Mode changed to <span className="text-primary-500 uppercase">{h.newValue?.platformMode}</span></p>
                                                <span className="text-[10px] text-muted tabular-nums">{new Date(h.timestamp).toLocaleString()}</span>
                                            </div>
                                            <p className="text-[11px] text-muted italic">"{h.reason}"</p>
                                            <p className="text-[10px] text-muted uppercase tracking-wide">Actor: {h.updatedBy?.name || 'System'}</p>
                                        </div>
                                    </div>
                                ))}
                                {(!settings.history || settings.history.length === 0) && (
                                    <div className="text-center py-6 text-muted italic text-sm">No state changes recorded yet.</div>
                                )}
                            </div>
                        </section>

                    </div>
                </div>
            </main>
        </div>
    );
}
