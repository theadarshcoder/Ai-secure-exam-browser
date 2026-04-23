import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Check, Copy, Trash2, X } from 'lucide-react';

/**
 * FloatingPillMenu (Glassmorphism Redesign + Ultra-Stable Layout)
 * Optimized to prevent jitter or "reloading" feel when selection count changes.
 */
const FloatingPillMenu = ({ 
  isVisible, 
  selectedCount = 0,
  onClear, 
  onDownload, 
  onCopy, 
  onSave,
  clearLabel = "Clear",
  downloadLabel = "Export",
  copyLabel = "Copy",
  saveLabel = "Delete",
  itemTypeLabel = "Users",
  downloadSuccessMsg = "Exported Successfully",
  copySuccessMsg = "Copied to Clipboard"
}) => {
  const [status, setStatus] = useState(null); // { message: string, icon: ReactNode }

  const handleAction = async (actionFn, successMsg, SuccessIcon = <Check size={14} className="text-emerald-500" strokeWidth={3} />) => {
    if (actionFn) {
      await actionFn();
      setStatus({ message: successMsg, icon: SuccessIcon });
    }
  };

  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => setStatus(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const Divider = () => (
    <motion.div 
      layout
      className="w-px h-4 bg-slate-200/50 mx-1.5 shrink-0" 
    />
  );

  const getPluralLabel = (count, label) => {
    if (count === 1) {
      if (label === "Users") return "User";
      if (label === "Results") return "Result";
      return label.endsWith('s') ? label.slice(0, -1) : label;
    }
    return label;
  };

  const itemLabel = getPluralLabel(selectedCount, itemTypeLabel);

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed bottom-6 inset-x-0 z-[100] pointer-events-none flex justify-center px-4">
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            className="pointer-events-auto"
          >
            <motion.div 
              layout
              transition={{ 
                type: 'spring', 
                stiffness: 450, 
                damping: 35, 
                mass: 0.8,
                layout: { duration: 0.3 } 
              }}
              className="bg-white/70 backdrop-blur-2xl px-4 py-2 rounded-full shadow-[0_15px_30px_rgba(0,0,0,0.12)] border border-white/40 flex items-center ring-1 ring-black/5 overflow-hidden"
            >
              <AnimatePresence mode="wait">
                {!status ? (
                  <motion.div 
                    key="initial-state"
                    className="flex items-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Count Group */}
                    <motion.div layout className="flex items-center px-1.5">
                      <motion.span 
                        layout="position"
                        className="text-slate-500 text-[11px] font-bold whitespace-nowrap uppercase tracking-wider"
                      >
                        {selectedCount} {itemLabel}
                      </motion.span>
                    </motion.div>

                    <Divider />

                    {/* General Group */}
                    <motion.div layout className="flex items-center">
                      <button
                        onClick={onClear}
                        className="px-3 py-1.5 text-slate-700 hover:text-slate-900 text-[11px] font-bold uppercase tracking-wider transition-all rounded-full hover:bg-slate-50/50 active:scale-95"
                      >
                        {clearLabel}
                      </button>

                      <button
                        onClick={() => handleAction(onCopy, copySuccessMsg, <Check size={14} className="text-emerald-500" />)}
                        className="p-2 text-slate-600 hover:text-slate-900 transition-all rounded-full hover:bg-slate-50/50 active:scale-90"
                        title={copyLabel}
                      >
                        <Copy size={14} />
                      </button>
                    </motion.div>

                    <Divider />

                    {/* Key Action Group (Export) */}
                    <motion.div layout className="flex items-center">
                      <button
                        onClick={() => handleAction(onDownload, downloadSuccessMsg, <Download size={14} className="text-emerald-500" />)}
                        className="flex items-center gap-2 px-4 py-1.5 text-emerald-600 hover:text-emerald-700 font-bold text-[11px] uppercase tracking-wider transition-all rounded-full hover:bg-emerald-50/40 active:scale-95"
                      >
                        <Download size={14} strokeWidth={2.5} />
                        <motion.span layout="position" className="whitespace-nowrap">
                          {downloadLabel} {selectedCount} {itemLabel}
                        </motion.span>
                      </button>
                    </motion.div>

                    <Divider />

                    {/* Destructive Group (Delete) */}
                    <motion.div layout className="flex items-center">
                      <button
                        onClick={onSave}
                        className="flex items-center gap-2 px-3 py-1.5 text-red-500 hover:text-red-600 font-bold text-[11px] uppercase tracking-wider transition-all rounded-full hover:bg-red-50/40 active:scale-95"
                      >
                        <Trash2 size={14} strokeWidth={2.5} />
                        <motion.span layout="position" className="whitespace-nowrap">
                          {saveLabel} {selectedCount} {itemLabel}
                        </motion.span>
                      </button>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="success-state"
                    initial={{ opacity: 0, scale: 0.9, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -5 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="px-6 py-1.5 flex items-center gap-3 whitespace-nowrap min-w-[220px] justify-center"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 600, damping: 25, delay: 0.1 }}
                    >
                      {status.icon}
                    </motion.div>
                    <motion.span 
                      initial={{ opacity: 0, x: 5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 }}
                      className="text-slate-900 text-[11px] font-bold uppercase tracking-[0.12em]"
                    >
                      {status.message}
                    </motion.span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default FloatingPillMenu;
