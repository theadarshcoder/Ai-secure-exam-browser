import React, { useState, useEffect } from 'react';
import { ShieldAlert, Info, Settings, Lock, Activity } from 'lucide-react';
import api from '../services/api';
import socketService from '../services/socket';
import { motion, AnimatePresence } from 'framer-motion';

const SystemModeBanner = () => {
    const [mode, setMode] = useState('active');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initial Fetch
        const fetchStatus = async () => {
            try {
                const { data } = await api.get('/api/public/platform/status');
                setMode(data.platformMode || 'active');
            } catch (error) {
                console.error("Failed to fetch platform status");
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();

        // Socket Listener
        const socket = socketService.getSocket();
        if (socket) {
            socket.on('platform_mode_change', (data) => {
                setMode(data.mode);
            });
        }

        return () => {
            if (socket) socket.off('platform_mode_change');
        };
    }, []);

    if (loading || mode === 'active') return null;

    const config = {
        readonly: {
            icon: <Info size={14} />,
            label: 'System Read-Only',
            desc: 'Viewing is allowed but data modifications are currently restricted.',
            bg: 'bg-indigo-600',
            pulse: 'bg-indigo-400'
        },
        maintenance: {
            icon: <Settings size={14} />,
            label: 'System Maintenance',
            desc: 'We are performing scheduled updates. Some features may be unavailable.',
            bg: 'bg-amber-600',
            pulse: 'bg-amber-400'
        },
        locked: {
            icon: <Lock size={14} />,
            label: 'System Locked',
            desc: 'Platform is currently restricted to Super Admin access only.',
            bg: 'bg-rose-600',
            pulse: 'bg-rose-400'
        }
    };

    const current = config[mode] || config.maintenance;

    return (
        <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className={`${current.bg} text-white relative z-[100] shadow-lg overflow-hidden`}
        >
            <div className="max-w-screen-2xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className={`w-2 h-2 rounded-full ${current.pulse} animate-ping absolute inset-0`} />
                        <div className={`w-2 h-2 rounded-full ${current.pulse} relative z-10`} />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                            {current.icon} {current.label}
                        </span>
                        <span className="text-[11px] font-bold opacity-90 hidden md:inline">
                            {current.desc}
                        </span>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <Activity size={14} className="animate-pulse opacity-50" />
                    <span className="text-[9px] font-black uppercase tracking-tighter opacity-70">
                        Global Guard Active
                    </span>
                </div>
            </div>
            
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-100%] animate-[shimmer_3s_infinite]" />
        </motion.div>
    );
};

export default SystemModeBanner;
