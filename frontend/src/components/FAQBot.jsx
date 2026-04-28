import React, { useState, useRef, useEffect } from 'react';
import { requestHelp } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import VisionLogo from './VisionLogo';

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
        const lastTimeStr = sessionStorage.getItem(`lastHelpReq_${examId}`);
        const now = Date.now();
        if (lastTimeStr && now - parseInt(lastTimeStr, 10) < 5 * 60 * 1000) {
            setMessages(prev => {
                if (prev.length > 0 && prev[prev.length - 1].text.includes('already requested help')) {
                    return prev;
                }
                return [...prev, {
                    sender: 'bot',
                    text: '⏳ You have already requested help recently. Please wait 5 minutes before trying again.'
                }];
            });
            return;
        }

        setIsEscalating(true);
        try {
            await requestHelp(examId, 'Student needs manual intervention via support bot.');
            sessionStorage.setItem(`lastHelpReq_${examId}`, now.toString());
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
                        className="mb-4 bg-surface rounded-2xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.25)] w-[300px] h-[400px] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-[#1e2235] px-5 py-4 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                                    <VisionLogo className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-white">Vision Support</h3>
                                    <p className="text-[9px] text-white/40 font-semibold tracking-wide">Instant Assistance</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded-lg transition-all"
                            >
                                <X size={14} className="text-white/60 hover:text-white" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface scroll-thin">
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] px-4 py-3 text-[11px] leading-relaxed transition-all ${
                                        msg.sender === 'student'
                                            ? 'bg-[#1e2235] text-white font-bold rounded-2xl rounded-br-sm shadow-md'
                                            : 'bg-surface-hover border border-main text-primary font-bold rounded-2xl rounded-bl-sm shadow-sm'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Actions & Input Container */}
                        <div className="px-4 pt-3 pb-4 bg-surface border-t border-main space-y-3">
                            {/* Escalate Button */}
                            <button
                                onClick={escalateToAdmin}
                                disabled={isEscalating}
                                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold text-[#1e2235] hover:bg-[#1e2235]/5 uppercase tracking-widest transition-all disabled:opacity-30 border border-main hover:border-[#1e2235]/30"
                            >
                                {isEscalating ? (
                                    <>
                                        <Loader2 size={12} className="animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle size={12} />
                                        Contact Supervisor
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
                                    className="flex-1 bg-surface-hover border border-main rounded-xl px-4 py-2.5 text-[13px] font-medium text-primary placeholder:text-muted/40 focus:outline-none focus:border-[#1e2235] focus:ring-2 focus:ring-[#1e2235]/10 transition-all"
                                    placeholder="Describe your issue..."
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim()}
                                    className="w-10 h-10 rounded-xl bg-[#1e2235] hover:bg-[#1e2235]/90 text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-20 shadow-lg shadow-[#1e2235]/20 shrink-0"
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
