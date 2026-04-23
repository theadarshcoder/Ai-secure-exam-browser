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
                        className="mb-4 bg-white border border-slate-200 rounded-3xl shadow-2xl w-80 h-[420px] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-sm">
                                    🤖
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-widest">Vision Support</h3>
                                    <p className="text-[9px] text-slate-400 font-medium">Instant help during exam</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X size={14} className="text-slate-400" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[12px] leading-relaxed font-medium ${
                                        msg.sender === 'student'
                                            ? 'bg-slate-900 text-white rounded-br-lg'
                                            : 'bg-white border border-slate-200 text-slate-700 rounded-bl-lg shadow-sm'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Escalate Button */}
                        <div className="px-3 py-2 bg-white border-t border-slate-100 flex justify-center shrink-0">
                            <button
                                onClick={escalateToAdmin}
                                disabled={isEscalating}
                                className="flex items-center gap-1.5 text-[10px] font-bold text-red-600 hover:text-red-700 uppercase tracking-wider transition-colors disabled:opacity-50"
                            >
                                {isEscalating ? (
                                    <>
                                        <Loader2 size={11} className="animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle size={11} />
                                        Contact Admin
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Input */}
                        <div className="px-3 pb-3 pt-1 flex gap-2 bg-white shrink-0">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-all"
                                placeholder="Type your issue..."
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim()}
                                className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-slate-900/10 shrink-0"
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FAQBot;
