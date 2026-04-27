import React, { useState, useRef, useEffect } from 'react';
import { Send, Radio, MessageSquare, AlertTriangle, Info, OctagonX, Search, ChevronDown, X } from 'lucide-react';
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
    const [targetStudentName, setTargetStudentName] = useState('');
    const [messageText, setMessageText] = useState('');
    const [severity, setSeverity] = useState('info');
    const [isSending, setIsSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredStudents = activeStudents.filter(st =>
        st.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectStudent = (st) => {
        setTargetStudentId(st._id || st.id);
        setTargetStudentName(st.name);
        setSearchQuery('');
        setIsDropdownOpen(false);
    };

    const handleClearStudent = () => {
        setTargetStudentId('');
        setTargetStudentName('');
        setSearchQuery('');
    };

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
        <div className="bg-surface border border-main rounded-[2rem] shadow-sm overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Header */}
            <div className="px-6 py-5 bg-surface-hover/30 border-b border-main flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-500 shadow-sm">
                    <Radio size={18} strokeWidth={2.2} />
                </div>
                <div>
                    <h3 className="text-[13px] font-bold text-primary uppercase tracking-widest leading-none mb-1">Send Exam Alert</h3>
                    <p className="text-[11px] text-muted font-medium">Broadcast or direct message to students</p>
                </div>
            </div>

            <div className="p-6 space-y-5">
                {/* Message Type + Target */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex bg-main rounded-xl p-1 gap-1 w-fit">
                        <button
                            onClick={() => setMsgType('broadcast')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all ${
                                msgType === 'broadcast' 
                                    ? 'bg-surface text-primary shadow-sm' 
                                    : 'text-muted hover:text-primary'
                            }`}
                        >
                            <Radio size={14} /> Broadcast
                        </button>
                        {activeStudents.length > 0 && (
                            <button
                                onClick={() => setMsgType('direct')}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all ${
                                    msgType === 'direct' 
                                        ? 'bg-surface text-primary shadow-sm' 
                                        : 'text-muted hover:text-primary'
                                }`}
                            >
                                <MessageSquare size={14} /> Direct
                            </button>
                        )}
                    </div>

                    {msgType === 'direct' && activeStudents.length > 0 && (
                        <div className="relative flex-1 min-w-[220px]" ref={dropdownRef}>
                            {/* Inline search trigger */}
                            <div
                                onClick={() => { setIsDropdownOpen(true); }}
                                className={`w-full flex items-center gap-2 border bg-surface rounded-xl px-4 py-2.5 cursor-text transition-colors ${isDropdownOpen ? 'border-primary-500/60 ring-2 ring-primary-500/10' : 'border-main hover:border-primary-500/40'}`}
                            >
                                <Search size={13} className="text-muted shrink-0" />
                                <input
                                    type="text"
                                    value={isDropdownOpen ? searchQuery : targetStudentName}
                                    onChange={(e) => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }}
                                    onFocus={() => { setIsDropdownOpen(true); setSearchQuery(''); }}
                                    placeholder="Select Student..."
                                    className="flex-1 bg-transparent text-xs text-primary placeholder-muted/50 focus:outline-none min-w-0"
                                    readOnly={!isDropdownOpen}
                                />
                                <div className="flex items-center gap-1 shrink-0">
                                    {targetStudentId && !isDropdownOpen && (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleClearStudent(); }}
                                            className="p-0.5 rounded-full hover:bg-surface-hover text-muted hover:text-primary transition-colors"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                    <ChevronDown size={14} className={`text-muted transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                </div>
                            </div>

                            {/* Results dropdown */}
                            {isDropdownOpen && (
                                <div className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-surface border border-main rounded-2xl shadow-2xl overflow-hidden">
                                    {/* Results list */}
                                    <ul className="max-h-52 overflow-y-auto py-1">
                                        {filteredStudents.length > 0 ? filteredStudents.map(st => (
                                            <li
                                                key={st._id || st.id}
                                                onClick={() => handleSelectStudent(st)}
                                                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-primary-500/5 transition-colors ${
                                                    targetStudentId === (st._id || st.id) ? 'bg-primary-500/10 text-primary-500' : 'text-primary'
                                                }`}
                                            >
                                                <div className="w-7 h-7 rounded-full bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-[10px] font-bold text-primary-500 shrink-0">
                                                    {st.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[12px] font-semibold truncate">{st.name}</p>
                                                    <p className="text-[10px] text-muted truncate">{st.rollNo || st.email}</p>
                                                </div>
                                                {targetStudentId === (st._id || st.id) && (
                                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />
                                                )}
                                            </li>
                                        )) : (
                                            <li className="px-4 py-6 text-center text-[11px] text-muted">
                                                No students found for &ldquo;{searchQuery}&rdquo;
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Message Input */}
                <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message... e.g., 'Time extension: 5 extra minutes granted'"
                    className="w-full border border-main bg-surface-hover/30 rounded-2xl px-5 py-4 text-[13px] text-primary placeholder-muted/40 focus:outline-none focus:border-primary-500 transition-all resize-none h-24 shadow-inner"
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                />

                {/* Severity + Send */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-2">
                    <div className="flex flex-wrap items-center gap-3">
                        {SEVERITY_OPTIONS.map(opt => {
                            const Icon = opt.icon;
                            // Customize dark mode friendly colors for the severity badges
                            const severityStyles = {
                                info: 'text-blue-500 border-blue-500/20 bg-blue-500/10',
                                warning: 'text-amber-500 border-amber-500/20 bg-amber-500/10',
                                critical: 'text-red-500 border-red-500/20 bg-red-500/10'
                            };
                            
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => setSeverity(opt.value)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all active:scale-95 ${
                                        severity === opt.value
                                            ? `${severityStyles[opt.value]} shadow-sm`
                                            : 'bg-surface text-muted border-main hover:border-primary-500/30 hover:text-primary'
                                    }`}
                                >
                                    <Icon size={14} strokeWidth={2.5} />
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={!messageText.trim() || isSending}
                        className="flex items-center justify-center gap-3 bg-primary text-surface px-8 py-3.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl sm:w-auto w-full"
                    >
                        <Send size={14} />
                        {isSending ? 'Sending...' : 'Send Alert'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminMessageControls;
