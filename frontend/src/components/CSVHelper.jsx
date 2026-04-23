import React from 'react';
import { HelpCircle } from 'lucide-react';

const CSVHelper = ({ format, example }) => {
  return (
    <div className="relative group">
      <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-500 hover:border-emerald-200 cursor-help transition-all shadow-sm active:scale-95">
        <HelpCircle size={15} />
      </div>
      
      {/* Tooltip Content */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] pointer-events-none">
        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-2.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Expected CSV Format
          </p>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4">
            <code className="block text-[11px] font-mono text-emerald-400 break-all leading-relaxed">
              {format}
            </code>
          </div>
          {example && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-2">Example Row</p>
              <p className="text-[10px] font-medium text-slate-300 italic leading-relaxed">
                {example}
              </p>
            </>
          )}
        </div>
        {/* Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-8 border-transparent border-t-slate-900" />
      </div>
    </div>
  );
};

export default CSVHelper;
