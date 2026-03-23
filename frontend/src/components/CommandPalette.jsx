import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Activity, Lock, Search, Camera, Headphones, X } from 'lucide-react';

const COMMANDS = [
  { id: 'start', icon: <Shield className="w-4 h-4" />, label: 'Start Exam', desc: 'Launch your secure exam environment', action: () => window.location.href = '/login' },
  { id: 'camera', icon: <Camera className="w-4 h-4" />, label: 'Check Camera', desc: 'Verify your webcam is working correctly', action: () => window.location.href = '/login' },
  { id: 'support', icon: <Headphones className="w-4 h-4" />, label: 'Contact Support', desc: 'Get help from our exam team', action: () => window.open('mailto:support@vision.ai') },
  { id: 'security', icon: <Lock className="w-4 h-4" />, label: 'Security Overview', desc: 'View our security documentation', action: () => document.querySelector('#security')?.scrollIntoView({ behavior: 'smooth' }) },
  { id: 'features', icon: <Activity className="w-4 h-4" />, label: 'Features', desc: 'Explore platform capabilities', action: () => document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' }) },
];

const CommandPalette = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  
  const filtered = COMMANDS.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.desc.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  const run = (cmd) => {
    cmd.action();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="palette-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[1000] flex items-start justify-center pt-[18vh]"
          style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(15,23,42,0.55)' }}
          onClick={onClose}
        >
          <motion.div
            key="palette-box"
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-xl mx-4 bg-slate-900 border border-slate-700/60 rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.6)] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-800">
              <Search className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Type a command or search…"
                className="flex-1 bg-transparent text-slate-100 text-sm placeholder-slate-500 outline-none font-medium"
              />
              <button onClick={onClose} className="text-slate-600 hover:text-slate-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-2 max-h-72 overflow-y-auto">
              {filtered.length === 0 && (
                <div className="px-4 py-8 text-center text-slate-500 text-sm">No commands found.</div>
              )}
              {filtered.map((cmd) => (
                <button
                  key={cmd.id}
                  onClick={() => run(cmd)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/70 transition-colors duration-100 text-left group"
                >
                  <span className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:border-slate-600 group-hover:text-slate-200 transition-all duration-150 shrink-0">
                    {cmd.icon}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-200">{cmd.label}</span>
                    <span className="text-xs text-slate-500">{cmd.desc}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="px-4 py-2.5 border-t border-slate-800 flex items-center gap-4">
              <span className="text-[10px] text-slate-600 font-semibold tracking-wider uppercase flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-500 font-mono">↵</kbd> to select
              </span>
              <span className="text-[10px] text-slate-600 font-semibold tracking-wider uppercase flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-500 font-mono">Esc</kbd> to close
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
