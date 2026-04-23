import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, CheckCircle, Info, AlertTriangle } from 'lucide-react';

const ModernAlert = ({ isOpen, onClose, title, message, type = 'info', confirmText = 'OK' }) => {
  const themes = {
    info: {
      icon: <Info className="text-blue-500" />,
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      btn: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
    },
    success: {
      icon: <CheckCircle className="text-emerald-500" />,
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      btn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
    },
    warning: {
      icon: <AlertTriangle className="text-amber-500" />,
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      btn: 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
    },
    error: {
      icon: <AlertCircle className="text-rose-500" />,
      bg: 'bg-rose-50',
      border: 'border-rose-100',
      btn: 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
    }
  };

  const theme = themes[type] || themes.info;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100"
          >
            <div className={`p-6 ${theme.bg} border-b ${theme.border} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  {theme.icon}
                </div>
                <h3 className="font-bold text-slate-800 tracking-tight">{title || 'Attention'}</h3>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-white/50 rounded-lg transition-colors text-slate-400">
                <X size={18} />
              </button>
            </div>

            <div className="p-8">
              <p className="text-slate-600 leading-relaxed text-sm font-medium">
                {message}
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={onClose}
                className={`px-8 py-2.5 rounded-xl text-white font-bold text-sm transition-all active:scale-95 shadow-lg ${theme.btn}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ModernAlert;
