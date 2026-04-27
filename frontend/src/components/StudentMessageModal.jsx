import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import socketService from '../services/socket';

const StudentMessageModal = ({ userId, examId }) => {
    const [messageQueue, setMessageQueue] = useState([]);

    useEffect(() => {
        const handleNewMessage = (payload) => {
            setMessageQueue(prev => [...prev, payload]);
        };

        socketService.onAdminMessage(handleNewMessage);

        return () => {
            socketService.offAdminMessage(handleNewMessage);
        };
    }, []);

    const handleAcknowledge = () => {
        const currentMsg = messageQueue[0];

        // Emit ACK to backend with examId context
        socketService.emitMessageAck(currentMsg.id, userId, examId || currentMsg.examId);

        // Remove acknowledged message, show next in queue
        setMessageQueue(prev => prev.slice(1));
    };

    // Nothing to show
    if (messageQueue.length === 0) return null;

    const currentMsg = messageQueue[0];
    const isCritical = currentMsg.severity === 'critical';
    const isWarning = currentMsg.severity === 'warning';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[9999] p-8">
                <motion.div
                    initial={{ scale: 0.95, y: 30, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.95, y: 30, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                    className="w-full max-w-lg"
                >
                    <div className="bg-surface rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] overflow-hidden border border-main relative group">
                        {/* Status Bar Indicator */}
                        <div className={`absolute top-0 left-0 right-0 h-2 ${
                            isCritical ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 
                            isWarning ? 'bg-primary-500 shadow-[0_0_15px_rgba(255,59,0,0.5)]' : 
                            'bg-primary-500'
                        }`} />

                        {/* Header */}
                        <div className="px-10 pt-10 pb-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-xl transition-transform duration-500 group-hover:scale-110 ${
                                        isCritical ? 'bg-red-500/10 border border-red-500/20 text-red-500' : 
                                        isWarning ? 'bg-primary-500/10 border border-primary-500/20 text-primary-500' : 
                                        'bg-primary-500/10 border border-primary-500/20 text-primary-500'
                                    }`}>
                                        {isCritical ? '🛑' : isWarning ? '⚠️' : 'ℹ️'}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-primary tracking-tighter uppercase">
                                            {isCritical ? 'Protocol Halt' : isWarning ? 'System Alert' : 'Transmission'}
                                        </h3>
                                        <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] opacity-50">
                                            From {currentMsg.senderRole || 'Supervisor'} • {new Date(currentMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>

                                {/* Pending badge */}
                                {messageQueue.length > 1 && (
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border animate-pulse ${
                                        isCritical ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-surface-hover text-primary border-main'
                                    }`}>
                                        {messageQueue.length} BATCHED
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Message Body */}
                        <div className="px-10 py-8">
                            <div className={`p-8 rounded-[2rem] border transition-all duration-500 ${
                                isCritical ? 'bg-red-500/5 border-red-500/10' : 
                                isWarning ? 'bg-primary-500/5 border-primary-500/10' : 
                                'bg-surface-hover border-main'
                            }`}>
                                <p className="text-lg font-black text-primary leading-tight uppercase tracking-tight">
                                    {currentMsg.message}
                                </p>
                            </div>
                        </div>

                        {/* Action */}
                        {currentMsg.requiresAck !== false && (
                            <div className="px-10 pb-10">
                                <button
                                    onClick={handleAcknowledge}
                                    className={`w-full h-16 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] transition-all active:scale-[0.97] shadow-2xl flex items-center justify-center gap-3 ${
                                        isCritical 
                                            ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/30' 
                                            : 'bg-primary-500 hover:bg-primary-600 text-white shadow-primary-500/30'
                                    }`}
                                >
                                    Confirm Intel
                                    {messageQueue.length > 1 && (
                                        <span className="px-2 py-0.5 bg-black/20 rounded text-[9px]">
                                            +{messageQueue.length - 1} MORE
                                        </span>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default StudentMessageModal;
