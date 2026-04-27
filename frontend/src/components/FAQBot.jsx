import React, { useState, useRef, useEffect } from 'react';
import { requestHelp } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, AlertCircle, Loader2 } from 'lucide-react';

const FAQ_RULES = [
    {
        keywords: ['camera', 'webcam', 'cam', 'video'],
        reply: '📷 Camera Issue: Go to your browser settings → Site Permissions → Camera → Allow. Then refresh the page. If still not working, check if another app (Zoom, Meet) is using the camera.'
    },
    {
        keywords: ['net', 'network', 'offline', 'internet', 'wifi', 'disconnect'],
        reply: '🌐 Network Issue: Don\'t close the exam window! Your answers are being auto-saved locally. Once your connection restores, they will sync automatically. Stay calm and keep working.'
    },
    {
        keywords: ['fullscreen', 'full screen', 'exit', 'escape', 'esc'],
        reply: '🖥️ Fullscreen: The exam requires fullscreen mode. Press F11 or click "Initialize Secure Entry" to re-enter. Exiting fullscreen is logged as a violation.'
    },
    {
        keywords: ['code', 'editor', 'compile', 'run', 'execute', 'output'],
        reply: '💻 Code Editor: Write your code, select the language from the dropdown, and click "Run Code". Execution may take a few seconds. If stuck, try resetting the editor.'
    },
    {
        keywords: ['time', 'timer', 'duration', 'remaining'],
        reply: '⏱️ Timer: The countdown timer is shown at the top. When time expires, your exam auto-submits with all saved answers. Work on high-priority questions first.'
    },
    {
        keywords: ['submit', 'finish', 'end', 'done'],
        reply: '📤 Submission: Click the "Submit Exam" button when ready. You\'ll see a confirmation dialog with your answer summary. Once submitted, you cannot make changes.'
    },
    {
        keywords: ['copy', 'paste', 'right click', 'shortcut'],
        reply: '🔒 Security: Copy, paste, and right-click are disabled during the exam for academic integrity. Please type your answers manually.'
    },
    {
        keywords: ['block', 'blocked', 'suspended', 'locked'],
        reply: '🔐 If you\'re blocked, it means the proctor detected suspicious activity. Please wait — a supervisor will review your session. Contact your instructor if this persists.'
    },
    {
        keywords: ['mic', 'microphone', 'audio', 'sound'],
        reply: '🎙️ Microphone: Allow microphone access in browser settings if prompted. Background noise is monitored but won\'t affect your exam unless flagged for speaking.'
    }
];

const FAQBot = ({ examId, userId, isOpen, onClose }) => {
    const [messages, setMessages] = useState([
        { sender: 'bot', text: 'Hi! 👋 Having a technical issue? Type your problem or click "Contact Admin" below for direct help.' }
    ]);
    const [input, setInput] = useState('');
    const [isEscalating, setIsEscalating] = useState(false);
    const messagesEndRef = useRef(null);

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const findReply = (text) => {
        const lower = text.toLowerCase();
        for (const rule of FAQ_RULES) {
            if (rule.keywords.some(kw => lower.includes(kw))) {
                return rule.reply;
            }
        }
        return null;
    };

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg = input.trim();
        setMessages(prev => [...prev, { sender: 'student', text: userMsg }]);
        setInput('');

        const reply = findReply(userMsg);

        setTimeout(() => {
            if (reply) {
                setMessages(prev => [...prev, { sender: 'bot', text: reply }]);
            } else {
                setMessages(prev => [...prev, {
                    sender: 'bot',
                    text: "I couldn't find a match for your issue. Please click \"Contact Admin\" below — a proctor will assist you directly."
                }]);
            }
        }, 500);
    };

    const escalateToAdmin = async () => {
        setIsEscalating(true);
        try {
            await requestHelp(examId, 'Student needs manual intervention via support bot.');
            setMessages(prev => [...prev, {
                sender: 'bot',
                text: '✅ Help request sent! A proctor will message you shortly. Keep the exam window open.'
            }]);
        } catch {
            setMessages(prev => [...prev, {
                sender: 'bot',
                text: '❌ Failed to send request. Please try again in a moment.'
            }]);
        }
        setIsEscalating(false);
    };

    return (
        <div className="fixed bottom-14 left-6 z-[100]">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                        className="mb-4 bg-surface border border-main rounded-[2rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] w-80 h-[460px] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-surface-hover/50 border-b border-main px-6 py-5 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-lg shadow-xl shadow-primary-500/5">
                                    <Sparkles size={18} className="text-primary-500" />
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Vision Support</h3>
                                    <p className="text-[9px] text-muted font-black uppercase tracking-widest opacity-50">Instant Assistance</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center hover:bg-primary-500/10 rounded-lg transition-all group"
                            >
                                <X size={14} className="text-muted group-hover:text-primary-500" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-surface custom-scrollbar">
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[90%] px-4 py-3 rounded-2xl text-[11px] leading-relaxed font-bold uppercase tracking-wide transition-all ${
                                        msg.sender === 'student'
                                            ? 'bg-primary-500 text-white rounded-br-none shadow-lg shadow-primary-500/20'
                                            : 'bg-surface-hover border border-main text-primary rounded-bl-none shadow-sm'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Actions & Input Container */}
                        <div className="p-4 bg-surface-hover/30 border-t border-main space-y-3">
                            {/* Escalate Button */}
                            <button
                                onClick={escalateToAdmin}
                                disabled={isEscalating}
                                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[9px] font-black text-red-500 hover:bg-red-500/5 uppercase tracking-[0.2em] transition-all disabled:opacity-30 border border-transparent hover:border-red-500/20"
                            >
                                {isEscalating ? (
                                    <>
                                        <Loader2 size={12} className="animate-spin" />
                                        Relaying...
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle size={12} />
                                        Request Supervisor
                                    </>
                                )}
                            </button>

                            {/* Input Area */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    className="flex-1 bg-surface border border-main rounded-xl px-4 py-2.5 text-[11px] font-bold text-primary placeholder:text-muted/30 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all uppercase tracking-wider"
                                    placeholder="Type protocol issue..."
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim()}
                                    className="w-10 h-10 rounded-xl bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-20 disabled:grayscale shadow-xl shadow-primary-500/20 shrink-0"
                                >
                                    <Send size={14} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FAQBot;
