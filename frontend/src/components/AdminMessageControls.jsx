import React, { useState } from 'react';
import { Send, Radio, MessageSquare, AlertTriangle, Info, OctagonX } from 'lucide-react';
import socketService from '../services/socket';
import { toast } from 'react-hot-toast';

const SEVERITY_OPTIONS = [
    { value: 'info', label: 'Info', icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { value: 'warning', label: 'Warning', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { value: 'critical', label: 'Critical', icon: OctagonX, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
];

const AdminMessageControls = ({ examId, activeStudents = [], mode = 'full' }) => {
    const [msgType, setMsgType] = useState('broadcast');
    const [targetStudentId, setTargetStudentId] = useState('');
    const [messageText, setMessageText] = useState('');
    const [severity, setSeverity] = useState('info');
    const [isSending, setIsSending] = useState(false);

    // Initialize compact mode defaults
    React.useEffect(() => {
        if (mode === 'compact' && activeStudents.length > 0) {
            setMsgType('direct');
            setTargetStudentId(activeStudents[0]._id || activeStudents[0].id);
        }
    }, [mode, activeStudents]);

    const handleSend = () => {
        if (!messageText.trim()) return;
        if (msgType === 'direct' && !targetStudentId) {
            toast.error('Select a student for direct message!');
            return;
        }

        setIsSending(true);

        socketService.emitAdminMessage({
            examId,
            type: msgType,
            studentId: msgType === 'direct' ? targetStudentId : null,
            message: messageText.trim(),
            severity,
            requiresAck: true
        });

        toast.success(
            msgType === 'broadcast' 
                ? 'Alert broadcasted to all students!' 
                : 'Direct message sent!',
            { icon: '📨' }
        );

        setMessageText('');
        setTimeout(() => setIsSending(false), 400);
    };

    const activeSeverity = SEVERITY_OPTIONS.find(s => s.value === severity);

    // Compact mode for SessionMonitor (already has a specific student)
    if (mode === 'compact') {
        return (
            <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                    <MessageSquare size={12} className="text-indigo-400" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Proctor Alert</span>
                </div>
                <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type alert message..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 resize-none h-16"
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                />
                <div className="flex items-center gap-2">
                    <div className="flex bg-white/5 rounded-lg p-0.5 gap-0.5 border border-white/5">
                        {SEVERITY_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setSeverity(opt.value)}
                                className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${
                                    severity === opt.value 
                                        ? 'bg-white/10 text-white' 
                                        : 'text-zinc-600 hover:text-zinc-400'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleSend}
                        disabled={!messageText.trim() || isSending}
                        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                    >
                        <Send size={10} />
                        Send
                    </button>
                </div>
            </div>
        );
    }

    // Full mode for Dashboard pages
    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm">
                    <Radio size={14} />
                </div>
                <div>
                    <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Send Exam Alert</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Broadcast or direct message to students</p>
                </div>
            </div>

            <div className="p-5 space-y-4">
                {/* Message Type + Target */}
                <div className="flex gap-3">
                    <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                        <button
                            onClick={() => setMsgType('broadcast')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                                msgType === 'broadcast' 
                                    ? 'bg-white text-slate-900 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            📡 Broadcast
                        </button>
                        {activeStudents.length > 0 && (
                            <button
                                onClick={() => setMsgType('direct')}
                                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                                    msgType === 'direct' 
                                        ? 'bg-white text-slate-900 shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                👤 Direct
                            </button>
                        )}
                    </div>

                    {msgType === 'direct' && activeStudents.length > 0 && (
                        <select
                            value={targetStudentId}
                            onChange={(e) => setTargetStudentId(e.target.value)}
                            className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-slate-400 bg-white"
                        >
                            <option value="">Select Student...</option>
                            {activeStudents.map(st => (
                                <option key={st._id || st.id} value={st._id || st.id}>
                                    {st.name} {st.rollNo ? `(${st.rollNo})` : `(${st.email})`}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Message Input */}
                <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message... e.g., 'Time extension: 5 extra minutes granted'"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 resize-none h-20 transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                />

                {/* Severity + Send */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {SEVERITY_OPTIONS.map(opt => {
                            const Icon = opt.icon;
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => setSeverity(opt.value)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all active:scale-95 ${
                                        severity === opt.value
                                            ? `${opt.bg} ${opt.color} ${opt.border} shadow-sm`
                                            : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                                    }`}
                                >
                                    <Icon size={12} />
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={!messageText.trim() || isSending}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-slate-900/10"
                    >
                        <Send size={13} />
                        {isSending ? 'Sending...' : 'Send Alert'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminMessageControls;
