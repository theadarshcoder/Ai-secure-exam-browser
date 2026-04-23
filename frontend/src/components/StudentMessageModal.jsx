import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import socketService from '../services/socket';

const StudentMessageModal = ({ userId }) => {
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

        // Emit ACK to backend
        socketService.emitMessageAck(currentMsg.id, userId);

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
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-6">
                <motion.div
                    initial={{ scale: 0.92, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.92, y: 20, opacity: 0 }}
                    transition={{ type: 'spring', damping: 24, stiffness: 300 }}
                    className="w-full max-w-md"
                >
                    <div className={`bg-white rounded-3xl shadow-2xl overflow-hidden border-t-[6px] ${
                        isCritical ? 'border-red-500' : isWarning ? 'border-amber-500' : 'border-blue-500'
                    }`}>
                        {/* Header */}
                        <div className="px-7 pt-7 pb-0">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm ${
                                        isCritical ? 'bg-red-50 border border-red-100' : 
                                        isWarning ? 'bg-amber-50 border border-amber-100' : 
                                        'bg-blue-50 border border-blue-100'
                                    }`}>
                                        {isCritical ? '🛑' : isWarning ? '⚠️' : 'ℹ️'}
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 tracking-tight">
                                            {isCritical ? 'Critical Alert' : isWarning ? 'Proctor Warning' : 'Proctor Message'}
                                        </h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            From {currentMsg.senderRole || 'Admin'} • {new Date(currentMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>

                                {/* Pending badge */}
                                {messageQueue.length > 1 && (
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                        isCritical ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}>
                                        {messageQueue.length} Pending
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Message Body */}
                        <div className="px-7 py-6">
                            <div className={`p-5 rounded-2xl border ${
                                isCritical ? 'bg-red-50/50 border-red-100' : 
                                isWarning ? 'bg-amber-50/50 border-amber-100' : 
                                'bg-slate-50 border-slate-100'
                            }`}>
                                <p className="text-[15px] font-medium text-slate-800 leading-relaxed">
                                    {currentMsg.message}
                                </p>
                            </div>
                        </div>

                        {/* Action */}
                        {currentMsg.requiresAck !== false && (
                            <div className="px-7 pb-7">
                                <button
                                    onClick={handleAcknowledge}
                                    className={`w-full h-12 rounded-xl font-bold text-[12px] uppercase tracking-widest transition-all active:scale-[0.97] shadow-lg flex items-center justify-center gap-2 ${
                                        isCritical 
                                            ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20' 
                                            : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20'
                                    }`}
                                >
                                    ✓ I Understand
                                    {messageQueue.length > 1 && (
                                        <span className="text-[10px] opacity-70">
                                            ({messageQueue.length - 1} more)
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
