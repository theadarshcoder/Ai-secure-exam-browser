import React, { useState, useEffect } from 'react';
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
    ChevronLeft
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
                <RefreshCw className="animate-spin text-primary-500" size={32} />
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
                    { id: 'back', label: 'Dashboard', icon: ChevronLeft },
                ]}
                activeTab={null}
                setActiveTab={() => navigate('/super-admin')}
                userName={userName}
                userRole="super_admin"
                onLogout={() => { sessionStorage.clear(); window.location.href = '/login'; }}
                brandLabel="GOVERN"
            />

            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="h-14 bg-surface/80 backdrop-blur-md border-b border-main flex items-center justify-between px-8 shrink-0 relative z-40">
                    <div className="flex items-center gap-3 text-sm font-semibold text-muted">
                        <Shield size={16} className="text-primary-500" />
                        <span>Platform Governance</span>
                        <ChevronLeft size={14} className="opacity-30 mx-1" />
                        <span className="text-primary font-bold">Global Settings</span>
                    </div>
                    <ThemeToggle />
                </header>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-main/50">
                    <div className="max-w-4xl mx-auto space-y-8">
                        
                        {/* Mode Control */}
                        <section className="bg-surface border border-main rounded-3xl p-8 space-y-8 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none rotate-12">
                                <Shield size={160} />
                            </div>
                            
                            <div className="flex items-center justify-between relative z-10">
                                <div>
                                    <h2 className="text-2xl font-black text-primary tracking-tight">System Mode</h2>
                                    <p className="text-xs text-muted font-bold uppercase tracking-widest mt-1">Current State: {settings.platformMode}</p>
                                </div>
                                <Activity className="text-primary-500" size={32} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                                {modes.map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => setMode(m.id)}
                                        className={`p-5 rounded-2xl border-2 text-left transition-all ${
                                            mode === m.id 
                                            ? `bg-${m.color}-500/10 border-${m.color}-500/50 shadow-lg shadow-${m.color}-500/10` 
                                            : 'bg-main/30 border-main hover:border-primary-500/20'
                                        }`}
                                    >
                                        <m.icon size={20} className={`mb-3 ${mode === m.id ? `text-${m.color}-500` : 'text-muted'}`} />
                                        <p className={`text-sm font-bold ${mode === m.id ? `text-${m.color}-500` : 'text-primary'}`}>{m.label}</p>
                                        <p className="text-[10px] text-muted font-medium mt-1 leading-relaxed">{m.desc}</p>
                                    </button>
                                ))}
                            </div>

                            {mode !== settings.platformMode && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }} 
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-4 pt-4 border-t border-main relative z-10"
                                >
                                    <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex items-start gap-4">
                                        <AlertTriangle size={20} className="text-rose-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-rose-500/80 leading-relaxed font-medium">
                                            <strong>WARNING:</strong> Changing the platform mode will immediately affect all institutions, mentors, and students.
                                            {mode === 'maintenance' && " Students in active exams will be blocked from continuing."}
                                        </p>
                                    </div>
                                    <div className="flex gap-4">
                                        <input 
                                            type="text" 
                                            placeholder="Reason for state change..." 
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            className="flex-1 bg-main border border-main rounded-xl px-4 text-sm focus:outline-none focus:border-primary-500/50 transition-all"
                                        />
                                        <button 
                                            onClick={handleUpdateMode}
                                            disabled={saving}
                                            className="px-8 py-3 bg-primary-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-600 transition-all flex items-center gap-2"
                                        >
                                            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                                            Commit Changes
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </section>

                        {/* Announcements */}
                        <section className="bg-surface border border-main rounded-3xl p-8 space-y-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-primary flex items-center gap-3"><Megaphone size={20} className="text-amber-500" /> Platform Announcement</h2>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase text-muted tracking-widest">Broadcast Active</span>
                                    <button 
                                        onClick={() => setAnnouncement({...announcement, isActive: !announcement.isActive})}
                                        className={`w-10 h-5 rounded-full transition-all relative ${announcement.isActive ? 'bg-emerald-500' : 'bg-muted/30'}`}
                                    >
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${announcement.isActive ? 'left-6' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Title</label>
                                        <input 
                                            type="text" 
                                            value={announcement.title}
                                            onChange={(e) => setAnnouncement({...announcement, title: e.target.value})}
                                            placeholder="Emergency Maintenance Notice..."
                                            className="w-full bg-main border border-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500/50"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Target Audience</label>
                                        <select 
                                            value={announcement.target}
                                            onChange={(e) => setAnnouncement({...announcement, target: e.target.value})}
                                            className="w-full bg-main border border-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500/50"
                                        >
                                            <option value="all">Everyone (All Roles)</option>
                                            <option value="admin">Institutional Admins</option>
                                            <option value="mentor">Mentors Only</option>
                                            <option value="student">Students Only</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Message Body</label>
                                    <textarea 
                                        rows={3}
                                        value={announcement.message}
                                        onChange={(e) => setAnnouncement({...announcement, message: e.target.value})}
                                        placeholder="We are performing essential server upgrades tonight at 02:00 UTC..."
                                        className="w-full bg-main border border-main rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/50 resize-none"
                                    />
                                </div>
                                <button 
                                    onClick={handleUpdateAnnouncement}
                                    className="w-full py-3 bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
                                >
                                    Update Broadcast Message
                                </button>
                            </div>
                        </section>

                        {/* History */}
                        <section className="bg-surface border border-main rounded-3xl p-8 space-y-6 shadow-sm">
                            <h2 className="text-xl font-bold text-primary flex items-center gap-3"><History size={20} className="text-indigo-500" /> State Change History</h2>
                            <div className="space-y-4">
                                {settings.history?.slice().reverse().map((h, i) => (
                                    <div key={i} className="flex gap-4 p-4 hover:bg-main/20 rounded-2xl transition-all group">
                                        <div className="w-10 h-10 rounded-xl bg-main border border-main flex items-center justify-center shrink-0">
                                            <Shield size={18} className="text-muted group-hover:text-primary-500 transition-colors" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-bold text-primary">Mode changed to <span className="text-primary-500 uppercase">{h.newValue?.platformMode}</span></p>
                                                <span className="text-[10px] font-bold text-muted uppercase tabular-nums">{new Date(h.timestamp).toLocaleString()}</span>
                                            </div>
                                            <p className="text-xs text-muted leading-relaxed italic">"{h.reason}"</p>
                                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest pt-1">Actor: {h.updatedBy?.name || 'System'}</p>
                                        </div>
                                    </div>
                                ))}
                                {(!settings.history || settings.history.length === 0) && (
                                    <div className="text-center py-8 text-muted italic text-sm">No state changes recorded yet.</div>
                                )}
                            </div>
                        </section>

                    </div>
                </div>
            </main>
        </div>
    );
}
